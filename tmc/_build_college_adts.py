#!/usr/bin/env python3
"""Build tmc_college_adts.js — the per-college **approved-ADT overlay** for the
TMC Builder tab.

WHY: COCI publishes two principal sets — a *course* export (already in the repo
as kb/reference/coci_course_list.xlsx) and a *program* export. The program
export is the AUTHORITATIVE source for which colleges have an approved Associate
Degree for Transfer (ADT) in each discipline. This builder reads the committed
program export, isolates the ADT rows, maps each to one of our 45 ASCCC TMC
templates (TOP-code-corroborated title match), and emits a compact overlay the
tab consults to stamp a per-college ADT status onto each TMC.

INPUT  : tmc/source_data/coci_program_export_<date>.csv  (COCI program export;
         columns: COLLEGE, CONTROL NUMBER, TITLE, TOP CODE, CIP CODE, GOAL,
         AWARD, SUB AWARD, APPROVED DATE, CERT UNITS, MAJOR UNITS, STATUS)
OUTPUT : tmc_college_adts.js  (window.CPL_TMC_COLLEGE_ADTS)

College-name reconciliation: the program export uses loose short labels
("L.A. CITY", "SAN FRANCISCO CITY"); the tab joins on the full COCI *course*
names ("Los Angeles City College", "City College of San Francisco"). We resolve
program -> tab via normalize() against the tab's own college list + the committed
kb/college_short_names.json taxonomy (canonical + aliases) + a small explicit
fallback for spellings neither bridges. Any college that fails to resolve is
reported in _meta.unmatched_colleges and the build fails loud — so a future
extract that introduces a new spelling can't silently drop a college.

Decisions baked in (Sam, 2026-06-18; revised 2026-06-20):
  * COCI's two affirmative states are kept SEPARATE (Sam, 2026-06-20 — "split
    Active vs Approved"): active (STATUS "Active" — live in the catalog) vs
    approved (STATUS "Approved" — CO-approved, pending activation). Also surface
    in_progress (Submitted/Review/Revision/Draft) and teachout
    (Active - Teachout Only); Inactive is kept in the data but the UI hides it.
  * Public Health Science folds into the Public Health TMC; Elementary Teacher
    Education (plain) folds into ETE: Integrated Programs.
  * UCTP ("A.S. UCTP Degree" / "...for UC Transfer") is the UC Transfer Pathway,
    NOT an ASCCC ADT-T — it gets its OWN instances (uctp-chemistry, uctp-physics)
    via _meta-declared extra_tmcs, never folded into Chemistry/Physics.

Run from repo root:  python3 tmc/_build_college_adts.py
STATIC artifact — rebuild only on a fresh COCI program extract; NOT a daily-cron
artifact.
"""
import csv
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_CSV = os.path.join(ROOT, "tmc", "source_data", "coci_program_export_2026-06-17.csv")
TEMPLATES_JS = os.path.join(ROOT, "tmc_templates.js")
COLLEGE_COURSES_JS = os.path.join(ROOT, "tmc_college_courses.js")
TAXONOMY_JSON = os.path.join(ROOT, "kb", "college_short_names.json")
OUT = os.path.join(ROOT, "tmc_college_adts.js")

# ---- ADT identification -----------------------------------------------------
ADT_AWARDS = {"A.A- T Degree", "A.S. T Degree"}
ADT_SUBAWARDS = {"ADT Degree", "A.S. UCTP Degree"}

# ---- status buckets ---------------------------------------------------------
# COCI distinguishes two affirmative program states that we keep SEPARATE
# (Sam, 2026-06-20 — "split Active vs Approved" so the badge mirrors COCI):
#   * Active   = approved AND live in the college catalog (students can enroll)
#   * Approved = CO-approved but not yet activated in the catalog (pending)
# Active is the stronger signal, so it outranks Approved in the dedup below.
ACTIVE = {"Active"}
APPROVED = {"Approved"}
IN_PROGRESS = {"Submitted", "Review", "Revision", "Draft"}
TEACHOUT = {"Active - Teachout Only"}
INACTIVE = {"Inactive"}
BUCKET_RANK = {"active": 0, "approved": 1, "in_progress": 2,
               "teachout": 3, "inactive": 4, "other": 5}


def bucket_of(status):
    if status in ACTIVE:
        return "active"
    if status in APPROVED:
        return "approved"
    if status in IN_PROGRESS:
        return "in_progress"
    if status in TEACHOUT:
        return "teachout"
    if status in INACTIVE:
        return "inactive"
    return "other"


# ---- UC Transfer Pathway pseudo-TMCs (their own instances, NOT folded) -------
EXTRA_TMCS = [
    {"id": "uctp-chemistry", "title": "Chemistry for UC Transfer",
     "degree": "AS", "kind": "uc-transfer-pathway"},
    {"id": "uctp-physics", "title": "Physics for UC Transfer",
     "degree": "AS", "kind": "uc-transfer-pathway"},
]


def load_js_object(path, varname):
    src = open(path, encoding="utf-8").read()
    i = src.index("{", src.index(varname))
    depth, j = 0, i
    # brace-match to find the object end (handles strings naively but our
    # generated JS has no unbalanced braces inside strings)
    obj = src[i:src.rindex("}") + 1]
    return json.loads(obj)


# ---- discipline / title normalization (TMC mapping) -------------------------
def norm_title(s):
    s = s.lower().strip().replace("​", "")
    s = s.replace("2.0", " ")
    s = re.sub(r"\b(a\.?a\.?-?\s*t|a\.?s\.?-?\s*t|aa-t|as-t|adt)\b", " ", s)
    s = re.sub(r"associate in (arts|science)( in)?", " ", s)
    s = re.sub(r"\bfor transfer\b", " ", s)
    s = re.sub(r"[\,\.\:/\(\)\-&]", " ", s)
    s = s.replace("theatre", "theater")
    s = re.sub(r"\bsciences\b", "science", s)
    s = re.sub(r"\barts\b", "art", s)
    s = re.sub(r"\bstudies\b", "study", s)
    s = re.sub(r"\bcommunications\b", "communication", s)
    s = re.sub(r"\bservices\b", "service", s)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"^in ", "", s)  # "AS-T in Biology" -> "biology"
    return s


TITLE_ALIAS = {
    "business administation": "business-administration",
    "business adminstration": "business-administration",
    "business": "business-administration",
    "philosphy": "philosophy",
    "nutrition and dietics": "nutrition-and-dietetics",
    "nutrition": "nutrition-and-dietetics",
    "environmental science": "environmental-science",
    "math": "mathematics",
    "agribusiness": "agriculture-business",
    "agricultural business": "agriculture-business",
    "agricultural plant science": "agriculture-plant-sciences",
    "agricultural animal science": "agriculture-animal-sciences",
    "animal science": "agriculture-animal-sciences",
    "theater": "theatre-arts",
    "film television and media art": "film-television-and-electronic-media",
    "computer science software engineering": "computer-science",
    "journalism and mass communication": "journalism",
    "social work human service": "social-work-and-human-services",
    "chicana o study": "chicana-o-studies-latina-o-studies",
}


def make_tmc_resolver(templates):
    by_norm = {norm_title(t["discipline"]): t["id"] for t in templates}

    def resolve(raw_title):
        low = raw_title.lower()
        if "uctp" in low:
            if "chem" in low:
                return "uctp-chemistry"
            if "physic" in low:
                return "uctp-physics"
            return None
        n = norm_title(raw_title)
        if n in by_norm:
            return by_norm[n]
        if n.startswith("social justice"):
            return "social-justice-studies"
        if "elementary teacher education" in n:  # plain folds into Integrated
            return "elementary-teacher-education-integrated-programs"
        if "educational teaching study" in n:
            return "elementary-teacher-education-integrated-programs"
        if "public health science" in n:  # folds into Public Health
            return "public-health"
        if n in TITLE_ALIAS:
            return TITLE_ALIAS[n]
        return None

    return resolve, by_norm


# ---- college-name reconciliation (program -> tab full name) -----------------
def norm_college(s):
    s = s.lower()
    s = re.sub(r"\b(college|community|the|of|center|centers|ctrs|ctr|district)\b", " ", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# Explicit program-export spelling -> tab full name, for forms that neither
# normalize() nor the committed taxonomy bridges (mostly "L.A." vs "Los
# Angeles", and a couple of one-offs). The tab full names are the JOIN TARGET.
PROGRAM_COLLEGE_ALIASES = {
    "CANADA": "Cañada College",
    "EAST L.A.": "East Los Angeles College",
    "L.A. CITY": "Los Angeles City College",
    "L.A. HARBOR": "Los Angeles Harbor College",
    "L.A. MISSION": "Los Angeles Mission College",
    "L.A. PIERCE": "Los Angeles Pierce College",
    "L.A. SOUTHWEST": "Los Angeles Southwest College",
    "L.A. TRADE-TECH": "Los Angeles Trade Technical College",
    "L.A. VALLEY": "Los Angeles Valley College",
    "MIRA COSTA": "MiraCosta College",
    "SAN FRANCISCO CITY": "City College of San Francisco",
    "SAN FRANCISCO CTRS": "City College of San Francisco",
    "WEST L.A.": "West Los Angeles College",
}


def make_college_resolver(tab_names):
    tab_by_norm = {}
    for nm in tab_names:
        tab_by_norm.setdefault(norm_college(nm), nm)
    # Consult the committed taxonomy: every known form -> its canonical, then
    # canonical -> tab name (same normalize() bridges the residual casing drift,
    # e.g. taxonomy "Miracosta" vs tab "MiraCosta").
    tax_to_tab = {}
    try:
        cols = json.load(open(TAXONOMY_JSON, encoding="utf-8"))["colleges"]
        for e in cols:
            forms = [e.get("canonical"), e.get("short"), e.get("short_caps")] + (e.get("aliases") or [])
            canon_tab = tab_by_norm.get(norm_college(e.get("canonical", "")))
            if not canon_tab:
                continue
            for f in forms:
                if f:
                    tax_to_tab.setdefault(norm_college(f), canon_tab)
    except Exception as exc:  # taxonomy is an optional assist, never fatal
        print(f"  (taxonomy assist unavailable: {exc})", file=sys.stderr)

    def resolve(prog_name):
        p = prog_name.strip()
        if p in PROGRAM_COLLEGE_ALIASES:
            return PROGRAM_COLLEGE_ALIASES[p]
        n = norm_college(p)
        if n in tab_by_norm:
            return tab_by_norm[n]
        if n in tax_to_tab:
            return tax_to_tab[n]
        return None

    return resolve


# ---- units parsing ----------------------------------------------------------
def parse_units(major_units):
    nums = [float(x) for x in re.findall(r"\d+(?:\.\d+)?", major_units or "")]
    nums = [x for x in nums if x > 0]
    if not nums:
        return "", None
    lo, hi = min(nums), max(nums)

    def fmt(x):
        return str(int(x)) if x == int(x) else ("%.1f" % x)

    disp = fmt(lo) if lo == hi else f"{fmt(lo)}–{fmt(hi)}"
    return disp, hi


def main():
    templates = load_js_object(TEMPLATES_JS, "CPL_TMC_TEMPLATES")["templates"]
    tab_names = load_js_object(COLLEGE_COURSES_JS, "CPL_TMC_COLLEGE_COURSES")["colleges"]
    resolve_tmc, _ = make_tmc_resolver(templates)
    resolve_college = make_college_resolver(tab_names)

    valid_tmc_ids = {t["id"] for t in templates} | {x["id"] for x in EXTRA_TMCS}

    rows = []
    with open(SRC_CSV, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            award = r["AWARD"].strip()
            sub = r["SUB AWARD"].strip()
            title = r["TITLE"].strip()
            if award in ADT_AWARDS or sub in ADT_SUBAWARDS or "uctp" in title.lower():
                rows.append(r)

    # (college, tmc_id) -> best record
    best = {}
    unmatched_titles = Counter()
    unmatched_colleges = Counter()
    for r in rows:
        tmc_id = resolve_tmc(r["TITLE"])
        if not tmc_id:
            unmatched_titles[r["TITLE"].strip()] += 1
            continue
        college = resolve_college(r["COLLEGE"])
        if not college:
            unmatched_colleges[r["COLLEGE"].strip()] += 1
            continue
        status = r["STATUS"].strip()
        bucket = bucket_of(status)
        approved_date = r["APPROVED DATE"].strip()
        units_disp, _ = parse_units(r["MAJOR UNITS"])
        rec = {
            "b": bucket,
            "s": status,
            "c": r["CONTROL NUMBER"].strip(),
            "a": approved_date,
            "u": units_disp,
            "t": r["TITLE"].strip(),
        }
        key = (college, tmc_id)
        cur = best.get(key)
        if cur is None:
            best[key] = rec
        else:
            # prefer the more-affirmative bucket; tie -> more recent approval
            if BUCKET_RANK[bucket] < BUCKET_RANK[cur["b"]]:
                best[key] = rec
            elif BUCKET_RANK[bucket] == BUCKET_RANK[cur["b"]] and approved_date > (cur["a"] or ""):
                best[key] = rec

    if unmatched_colleges:
        print("ERROR: unresolved college names (extend PROGRAM_COLLEGE_ALIASES "
              "or the taxonomy):", file=sys.stderr)
        for nm, c in unmatched_colleges.most_common():
            print(f"    {nm!r}: {c}", file=sys.stderr)
        sys.exit(1)

    by_college = defaultdict(dict)
    for (college, tmc_id), rec in best.items():
        by_college[college][tmc_id] = rec

    # per-TMC systemwide totals (for the directory's review-mode stat)
    tmc_totals = {}
    for tid in sorted(valid_tmc_ids):
        cnt = Counter()
        for cmap in by_college.values():
            if tid in cmap:
                cnt[cmap[tid]["b"]] += 1
        if cnt:
            tmc_totals[tid] = {
                "active": cnt["active"],
                "approved": cnt["approved"],
                "in_progress": cnt["in_progress"],
                "teachout": cnt["teachout"],
                "inactive": cnt["inactive"],
                # "colleges" = the established set (active + approved + teachout),
                # plus in-progress, for the directory's truthiness gate. Unchanged
                # in value from the pre-split build (active+approved == old approved).
                "colleges": cnt["active"] + cnt["approved"]
                + cnt["in_progress"] + cnt["teachout"],
            }

    meta = {
        "_generated_by": "tmc/_build_college_adts.py",
        "_generated_at": date.today().isoformat(),
        "_source": os.path.relpath(SRC_CSV, ROOT),
        "_note": ("Per-college approved-ADT overlay for the TMC Builder. "
                  "Keyed by the tab's full college name -> tmc_id -> {b:bucket, "
                  "s:status, c:control#, a:approvedDate, u:majorUnits, t:rawTitle}. "
                  "STATIC artifact, NOT a daily-cron artifact — rebuild on a fresh "
                  "COCI program extract."),
        "status_buckets": {
            "active": sorted(ACTIVE),
            "approved": sorted(APPROVED),
            "in_progress": sorted(IN_PROGRESS),
            "teachout": sorted(TEACHOUT),
            "inactive": sorted(INACTIVE),
        },
        "adt_rows_read": len(rows),
        "adt_rows_mapped": len(best),
        "colleges": len(by_college),
        "tmcs_with_adts": len(tmc_totals),
        "unmatched_titles": dict(unmatched_titles.most_common()),
        "unmatched_colleges": dict(unmatched_colleges),
    }

    payload = {
        "_meta": meta,
        "extra_tmcs": EXTRA_TMCS,
        "by_college": dict(sorted(by_college.items())),
        "tmc_totals": tmc_totals,
    }

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED by tmc/_build_college_adts.py — DO NOT EDIT BY HAND.\n")
        f.write("// Per-college approved-ADT overlay for the TMC Builder tab.\n")
        f.write("// Source: COCI program export (the authoritative ADT-approval set).\n")
        f.write("window.CPL_TMC_COLLEGE_ADTS = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    bucket_tally = Counter(rec["b"] for rec in best.values())
    print(f"Wrote {os.path.relpath(OUT, ROOT)}")
    print(f"  ADT rows read={len(rows)} mapped={len(best)} "
          f"colleges={len(by_college)} tmcs_with_adts={len(tmc_totals)}")
    print("  per (college,TMC) bucket: " + " · ".join(
        f"{b}={bucket_tally.get(b, 0)}"
        for b in ("active", "approved", "in_progress", "teachout", "inactive", "other")))
    if unmatched_titles:
        print(f"  unmatched titles (dropped, not ADTs): {sum(unmatched_titles.values())} rows, "
              f"{len(unmatched_titles)} distinct")
        for t, c in unmatched_titles.most_common(8):
            print(f"      {c:3d}  {t!r}")


if __name__ == "__main__":
    main()
