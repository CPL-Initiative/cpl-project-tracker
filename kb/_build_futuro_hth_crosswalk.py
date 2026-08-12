#!/usr/bin/env python3
"""Build the Futuro Health / Human Touch Healthcare (HTH) -> CCC CNA crosswalk.

The question this answers, in Ashley's words: *"which colleges statewide offer CNA
programs that may align with the Human Touch Healthcare program?"*

WHAT HTH IS (from the syllabus, HTH General Syllabus 3.0 v2.2): a six-week, 80-hour,
fully online course in the interpersonal ("soft") skills of allied health. Six modules
-- Emotional Intelligence, Empathy & Compassion, Effective Communication, Cultural
Competence, Teamwork & Collaboration, Ethics & Integrity -- and six SLOs. No
prerequisites, no clinical hours, no skills lab.

WHY THAT SHAPES THE MATCH: HTH cannot articulate into the CNA course itself. A
California CNA program is a CDPH-approved 160-hour course (60 theory / 100 clinical)
whose hours and content are set in regulation; a college cannot award CPL against it
for an online soft-skills course. So the crosswalk points at the ADJACENT receiving
course -- the communication / cultural-competence / healthcare-ethics course that sits
beside the CNA course in the same catalog -- which is where HTH's 80 hours actually map.

SOURCES (all committed or MAP-owned; nothing scraped):
  * kb/reference/cb_course_basic_fall2025.csv -- statewide MIS course inventory
    (109,898 courses, 118 colleges). TOP 1230.30 = Certified Nurse Assistant.
  * tmc/source_data/coci_program_export_2026-06-17.csv -- statewide COCI program
    inventory (29,147 programs), for the award-level CNA picture.
  * kb/futuro_hth_map_reference.json -- MAP snapshot (exhibits, credit recs,
    contacts, landing pages, region) synced from Supabase.

MATCHING GATE: a receiving-course candidate must satisfy TWO independent signals --
its TITLE matches an HTH module lens AND its TOP code sits in a relevant family.
Title-only matching is badly noisy (it surfaced "Library Teamwork Supervision Skills",
"Automotive Leadership and Team Building" and "Compassion Training for Yoga Teachers").
This is the sanctioned use of TOP as a search/filter aid, never as a gatekeeper.

Run:  python3 kb/_build_futuro_hth_crosswalk.py [--outdir DIR]
"""
import argparse
import collections
import csv
import datetime as dt
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
MIS = os.path.join(REPO, "kb", "reference", "cb_course_basic_fall2025.csv")
COCI = os.path.join(REPO, "tmc", "source_data", "coci_program_export_2026-06-17.csv")
MAPREF = os.path.join(HERE, "futuro_hth_map_reference.json")
# The shared identity crosswalk (SkyLink, 2026-08-12) — MAP college_id <-> MIS
# college code <-> every spelling our systems use. Preferred over name matching:
# `cb_course_basic.CB_COLLEGE_ID` IS the MIS college code, so this is a CODED join.
IDENTITY = os.path.join(HERE, "college_identity", "2026-08-12", "crosswalk.json")

CNA_TOP = "123030"          # MIS form (no dot) -- Certified Nurse Assistant
CNA_TOP_DOTTED = "1230.30"  # COCI form

# ---------------------------------------------------------------- HTH lens ---
# NOTE ON TITLES: the MIS course file abbreviates and truncates ("INTERCULTURAL COMM",
# "Nrs Caring Concepts", "BIO-ETHICS"). Matching the full word "communication" silently
# missed the canonical receiving course at College of Alameda and LA Valley -- i.e. it
# reported "none found" where the course plainly exists. Every title is passed through
# tidy_title() first, and the patterns accept the "comm" abbreviation.
def tidy_title(t):
    """Fold punctuation so abbreviated/hyphenated MIS titles match the lens."""
    s = (t or "").lower().replace("-", " ").replace("/", " ").replace(".", " ")
    return re.sub(r"\s+", " ", s).strip()


# Each entry: (HTH module, title regex). Derived from the six syllabus modules.
MODULE_PATTERNS = [
    ("Effective Communication",
     r"interpersonal comm|communication for (health|allied|the health)"
     r"|health(care)? comm|therapeutic comm"
     r"|comm(unication)? (in|for) (nursing|health)"),
    ("Cultural Competence",
     r"intercultural comm|cross ?cultural|cultural (competen|diversit|awareness|humility)"
     r"|diversity in health|multicultural (health|societ)|health.{0,12}multicultural"),
    ("Ethics and Integrity",
     r"(health ?care|medical|nursing|bio)\s*ethics|ethics (in|for|and) (health|nursing|human serv|allied)"
     r"|law and ethics|ethical issues"),
    ("Emotional Intelligence",
     r"emotional intelligence|stress management|human relations"
     r"|personal (development|growth) (for|and)|psychology of (human )?(relations|adjustment)"),
    ("Empathy and Compassion",
     r"\bempathy|compassion|caring|helping (skills|relationship)|counseling skills|interviewing"),
    ("Teamwork and Collaboration",
     r"teamwork|team ?building|group (process|dynamics|leadership)|collaborat"
     r"|conflict (resolution|management)|(small )?group comm"),
    ("Professionalism (allied health)",
     r"professionalism|(skill ?set|skills) for (the )?health|health(care)? (career|worker|professional)"
     r"|introduction to health (care|occupations)"),
]
COMPILED = [(m, re.compile(p, re.I)) for m, p in MODULE_PATTERNS]

HTH_MODULES = [
    "Emotional Intelligence", "Empathy and Compassion", "Effective Communication",
    "Cultural Competence", "Teamwork and Collaboration", "Ethics and Integrity",
]

# TOP families that make a title match credible, and the tier they earn.
#   Tier 1 -- health disciplines: the receiving course sits in the same division as
#             the CNA program, so the faculty who own CNA also own this course.
#   Tier 2 -- speech communication: the canonical interpersonal/intercultural course.
#             Widely transferable, high student value, but owned outside health.
#   Tier 3 -- human services / social work / psychology: adjacent helping-professions
#             coursework.
TIER1_PREFIXES = ("12",)                       # Health (1200-1299)
TIER2_PREFIXES = ("1506",)                     # Speech Communication
TIER3_PREFIXES = ("2104", "2101", "2105", "2001")  # Human svcs / social work / psych

TIER_LABEL = {
    1: "Tier 1 - health discipline (same faculty as CNA)",
    2: "Tier 2 - communication studies (interpersonal / intercultural)",
    3: "Tier 3 - human services / psychology",
}

CREDIT_STATUS = {
    "D": "Credit - degree applicable",
    "C": "Credit - not degree applicable",
    "N": "Noncredit",
}

# --- fit scoring -------------------------------------------------------------
# Tier alone ranks badly. A health-family TOP code covers every allied-health
# occupation, so "Funeral Service Law and Ethics" and "RDA Law and Ethics" (dental)
# are Tier 1 and were out-ranking the canonical Interpersonal Communication course.
# Those teach ANOTHER occupation's law and scope of practice -- they are not the
# soft-skills course HTH maps to. Fit scoring fixes the ordering and drops the noise.
RX_HEALTH_CTX = re.compile(r"health|patient|nurs|clinical|medical|care\b|caring", re.I)
# 'comm' not 'communicat' -- MIS writes "Interpersonal Commun" and "Intercultural Comm".
RX_CANONICAL = re.compile(r"interpersonal comm|intercultural comm", re.I)
RX_SOFT = re.compile(
    r"\bcomm|cultural|ethic|empathy|compassion|teamwork|conflict|professionalism"
    r"|human relations|group process|counseling skills|emotional intelligence", re.I)
# A different occupation's ethics/scope course, or a non-lecture placement.
RX_OTHER_OCC = re.compile(
    r"funeral|mortuar|dental|denta|veterinar|pharmac|radiolog|respirator|surgical"
    r"|phlebotom|massage|optic|librar|automot|\bfire\b|criminal|justice|addiction"
    r"|child|yoga|sport|athlet|real estate|hospitality|culinar|cosmetol", re.I)
RX_PLACEMENT = re.compile(r"intern|practicum|field ?work|clinical experience|work experience", re.I)


def fit_of(raw_title):
    """How well a candidate title matches what HTH actually teaches. Higher is better."""
    title = tidy_title(raw_title)
    f = 0
    if RX_HEALTH_CTX.search(title):
        f += 2                      # healthcare-contextualised
    if RX_CANONICAL.search(title):
        f += 3                      # the canonical interpersonal/intercultural course
    if RX_SOFT.search(title):
        f += 1
    if RX_OTHER_OCC.search(title):
        f -= 3                      # another occupation's law/ethics/scope
    if RX_PLACEMENT.search(title):
        f -= 2                      # a placement, not a soft-skills course
    return f

# Absence is a phrase, never a blank cell -- a spreadsheet travels without its schema.
NONE_FOUND = ("No matching course in the fall-2025 state file - confirm against the "
              "current catalog before concluding none exists")
NO_CONTACT = "MAP holds no primary contact for this college"


def tier_of(top):
    """Return 1/2/3 for a relevant TOP family, else None (candidate rejected)."""
    t = (top or "").strip()
    if t.startswith(TIER2_PREFIXES):
        return 2
    if t.startswith(TIER3_PREFIXES):
        return 3
    if t.startswith(TIER1_PREFIXES):
        return 1
    return None


def norm(name):
    """Normalise a college name for joining. Applied to BOTH sides, always.

    Handles the MIS inversion ('DESERT, COLLEGE OF THE' -> 'college of the desert'),
    drops the generic tail words, and folds punctuation/abbreviations.
    """
    s = (name or "").strip().lower()
    s = s.replace("&", "and").replace(".", " ").replace("-", " ")
    if "," in s:  # 'desert, college of the' -> 'college of the desert'
        head, tail = s.split(",", 1)
        s = f"{tail.strip()} {head.strip()}"
    s = re.sub(r"\bmount\b", "mt", s)
    s = re.sub(r"\bsaint\b", "st", s)
    s = re.sub(r"\bcontinuing ed\b", "continuing education", s)
    s = re.sub(r"\b(community|junior|city)\b", " ", s)
    s = re.sub(r"\bcollege(s)?\b", " ", s)
    s = re.sub(r"\bof the\b", " ", s)
    s = re.sub(r"\bof\b", " ", s)
    s = re.sub(r"\bthe\b", " ", s)
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def load_mis():
    with open(MIS, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def load_coci():
    with open(COCI, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def build():
    mis = load_mis()
    coci = load_coci()
    with open(MAPREF, encoding="utf-8") as f:
        mapref = json.load(f)

    # --- 1. the universe: colleges teaching a CNA course --------------------
    cna_courses = collections.defaultdict(list)
    mis_code = {}          # MIS college_name_long -> CB_COLLEGE_ID (the MIS code)
    for r in mis:
        if (r.get("CB_TOP_CODE") or "").strip().startswith(CNA_TOP):
            name = r["College_name_long"].strip()
            cna_courses[name].append(r)
            mis_code.setdefault(name, (r.get("CB_COLLEGE_ID") or "").strip())

    # --- 2. CNA programs (award level) from COCI ----------------------------
    kw = re.compile(r"\b(cna|nurse assistant|nursing assistant|nurse aide|nursing aide)\b", re.I)
    coci_programs = collections.defaultdict(list)
    for r in coci:
        top = (r.get("TOP CODE") or "")
        if top.startswith(CNA_TOP_DOTTED) or kw.search(r.get("TITLE") or ""):
            coci_programs[norm(r["COLLEGE"])].append(r)

    # --- 3. receiving-course candidates, two-signals-agree ------------------
    candidates = collections.defaultdict(list)
    for r in mis:
        col = r["College_name_long"].strip()
        if col not in cna_courses:
            continue
        title = (r.get("CB_TITLE") or "").strip()
        top = (r.get("CB_TOP_CODE") or "").strip()
        if not title:
            continue
        tier = tier_of(top)
        if tier is None:
            continue                      # signal 2 (TOP family) failed
        mods = [m for m, rx in COMPILED if rx.search(tidy_title(title))]
        if not mods:
            continue                      # signal 1 (title lens) failed
        if top.startswith(CNA_TOP):
            continue                      # the CNA course itself is not a receiver
        fit = fit_of(title)
        if fit < 1:
            continue                      # another occupation's course, or a placement
        candidates[col].append({
            "course": (r.get("CB_COURSE_ID") or "").strip(),
            "title": title, "top": top, "tier": tier, "fit": fit,
            "credit": CREDIT_STATUS.get(r.get("CB_CREDIT_STATUS"), r.get("CB_CREDIT_STATUS") or ""),
            "units": (r.get("CB_UNITS_MAXIMUM") or "").strip(),
            "modules": [m for m in mods if m in HTH_MODULES] or mods,
            "modules_all": mods,
        })

    # --- 4. join to MAP -- CODED key first, names only as a fallback --------
    # Preference order, and the reason for it:
    #   1. MIS college CODE via the shared identity crosswalk. A code join cannot
    #      be defeated by a spelling, and the crosswalk asserts its codes are unique.
    #   2. name matching with norm() applied to BOTH sides, then a de-spaced retry
    #      ('MIRA COSTA COLLEGE' vs 'MiraCosta College' differ only by a space).
    # The fallback is NOT redundant: the identity crosswalk scopes to the 116 CREDIT
    # colleges, so the continuing-education institutions -- which are real MAP
    # entities with their own college_id -- are absent from it. San Diego College of
    # Continuing Education (MIS code 076) teaches 4 CNA courses and would silently
    # drop out of a 61-row deliverable if the coded join were the only path.
    identity_by_code = {}
    if os.path.exists(IDENTITY):
        with open(IDENTITY, encoding="utf-8") as f:
            ident = json.load(f)
        for c in ident.get("colleges", []):
            code = (c.get("mis_college_code") or "").strip()
            if code:
                identity_by_code[code] = c

    map_by_norm = {norm(k): (k, v) for k, v in mapref["colleges"].items()}
    map_by_squash = {k.replace(" ", ""): v for k, v in map_by_norm.items()}
    rows, unmatched = [], []
    for col in sorted(cna_courses):
        hit, how, map_id = None, "", None
        key = norm(col)          # also the COCI-program lookup key, below

        ident_hit = identity_by_code.get(mis_code.get(col, ""))
        if ident_hit:
            k = norm(ident_hit["college_name"])
            hit = map_by_norm.get(k) or map_by_squash.get(k.replace(" ", ""))
            if hit:
                how, map_id = "mis_code", ident_hit["college_id"]

        if not hit:
            hit = map_by_norm.get(key) or map_by_squash.get(key.replace(" ", ""))
            how = "name"

        if not hit:
            unmatched.append(col)
            continue
        map_name, m = hit
        # Best fit first, then tier, then title -- so the healthcare-contextualised
        # communication course beats a generic one, and both beat Tier 3.
        cands = sorted(candidates.get(col, []), key=lambda c: (-c["fit"], c["tier"], c["title"]))
        t1 = [c for c in cands if c["tier"] == 1]
        t2 = [c for c in cands if c["tier"] == 2]
        mods = sorted({m2 for c in cands for m2 in c["modules_all"] if m2 in HTH_MODULES})

        pts = 0
        pts += 2 if len(t1) >= 1 else 0
        pts += 1 if len(t1) >= 2 else 0
        pts += 1 if len(t2) >= 1 else 0
        pts += 1 if len(t2) >= 2 else 0
        pts += 1 if len(mods) >= 5 else 0
        score = max(1, min(5, pts))

        ex, cr = m["ex"], m["cr"]
        if ex > 0 and cr > 0:
            readiness = "A - CPL operating in MAP"
        elif ex > 0:
            readiness = "B - exhibits loaded, no credit recommendations yet"
        elif m["contact"]:
            readiness = "C - MAP page live and staffed, no CPL activity yet"
        else:
            readiness = "D - MAP page live, no contact on file, no CPL activity"

        cc = cna_courses[col]
        progs = coci_programs.get(key, [])
        active = [p for p in progs if (p.get("STATUS") or "").strip() in ("Active", "Approved")]
        awards = sorted({(p.get("AWARD") or "").strip() for p in active if (p.get("AWARD") or "").strip()})

        rows.append({
            "college": map_name,
            "mis_name": col,
            "mis_college_code": mis_code.get(col, ""),
            "map_college_id": map_id,
            "joined_via": how,
            "region": m["region"],
            "county": m["county"],
            "cna_courses": len(cc),
            "cna_course_list": "; ".join(
                f"{(c.get('CB_COURSE_ID') or '').strip()} {(c.get('CB_TITLE') or '').strip()}"
                for c in cc[:6]),
            "cna_delivery": ", ".join(sorted({CREDIT_STATUS.get(c.get("CB_CREDIT_STATUS"), "?") for c in cc})),
            "cna_award": "; ".join(awards) if awards else "No award-level CNA program in COCI (course only)",
            "best_fit": " | ".join(f"{c['course']} {c['title']}" for c in cands[:3]) or NONE_FOUND,
            "best_fit_tier": TIER_LABEL[cands[0]["tier"]] if cands else NONE_FOUND,
            "n_candidates": len(cands),
            "n_tier1": len(t1),
            "n_tier2": len(t2),
            "modules": ", ".join(mods) if mods else "No HTH module matched in this catalog",
            "n_modules": len(mods),
            "score": score,
            "readiness": readiness,
            "map_exhibits": ex,
            "map_credit_recs": cr,
            "map_disciplines": m["disc"],
            "contact": m["contact"] or NO_CONTACT,
            "email": m["email"] or NO_CONTACT,
            "landing": f"https://cpldashboardcccco.azurewebsites.net/{m['lp']}",
            "candidates": cands,
        })

    if unmatched:
        sys.exit(f"JOIN FAILED - {len(unmatched)} MIS colleges did not match MAP: {unmatched}")

    return {
        "built_at": dt.date.today().isoformat(),
        "rows": rows,
        "partner": mapref["partner"],
        "totals": {
            "cna_colleges": len(rows),
            "mis_colleges": len({r["College_name_long"].strip() for r in mis}),
            "cna_courses": sum(len(v) for v in cna_courses.values()),
            "coci_programs": sum(len(v) for v in coci_programs.values()),
            "with_receiving": sum(1 for r in rows if r["n_candidates"]),
            "with_tier1": sum(1 for r in rows if r["n_tier1"]),
            "cpl_operating": sum(1 for r in rows if r["readiness"].startswith("A")),
            "joined_via_mis_code": sum(1 for r in rows if r["joined_via"] == "mis_code"),
            "joined_via_name": sum(1 for r in rows if r["joined_via"] == "name"),
        },
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--outdir", default=os.path.join(HERE, "futuro_hth_out"))
    a = ap.parse_args()
    data = build()
    os.makedirs(a.outdir, exist_ok=True)
    p = os.path.join(a.outdir, "crosswalk.json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    t = data["totals"]
    print(f"wrote {p}")
    print(f"  CNA colleges: {t['cna_colleges']} of {t['mis_colleges']} statewide")
    print(f"  CNA courses: {t['cna_courses']} | COCI CNA programs: {t['coci_programs']}")
    print(f"  with >=1 receiving candidate: {t['with_receiving']} | with a Tier 1: {t['with_tier1']}")
    print(f"  CPL already operating in MAP: {t['cpl_operating']}")
    print(f"  joined via MIS code: {t['joined_via_mis_code']} | via name fallback: {t['joined_via_name']}")
