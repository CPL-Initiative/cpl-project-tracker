#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""What CPL can THIS college create or adopt, against the occupations its REGION needs?

Built for the CPL Initiative's regional college meetings (Sam, Ashley and Sigrid,
2026-09-16). A college sits in the room and wants one thing: show me, against the
occupations my area actually has, what I could award CPL for today and what I would
have to build. Fifth instrument in the San Joaquin crosswalk lineage, and the first
that takes the REGION's occupation list rather than one partner's:

  kb/_build_partner_crosswalk.py           a partner's occupations -> CPL, statewide
  kb/_build_college_offering_crosswalk.py  those occupations -> ONE college, hand-curated
  kb/_build_domain_cpl_crosswalk.py        a DOMAIN -> every college, where the chain breaks
  kb/_build_occupation_cpl_crosswalk.py    an occupation -> every verified exhibit/college/course
  kb/_build_regional_cpl_opportunity.py    THIS ONE: a region's occupations x one college

THE DELIVERABLE IS THE CROSS, NOT EITHER COLUMN
-----------------------------------------------
Inherited unchanged from the Delta run, and it is the whole point:

                    | exhibit exists, college on it | exists, not on it | nothing anywhere
    college teaches |  ADOPT NOW (paperwork only)   |  ADOPT            |  BUILD FIRST-IN-STATE
    partial         |  ...                          |  ...              |  ...
    teaches nothing |  (not this college's move)    |  ...              |  (not a CPL question)

⚠️ "No exhibit exists anywhere" and "an exhibit exists and this college is not on
it" are the SAME EMPTY CELL and OPPOSITE next steps. Never collapse them.

EVERY MATCH IS A CANDIDATE WITH ITS EVIDENCE ATTACHED
-----------------------------------------------------
The Delta run answered "does this college teach it" from a HAND-CURATED offering map
-- 139 subject-matter rulings for one college. That does not scale to a region, so
here the match is MECHANICAL and is never presented as a determination. Every row
carries the program title, the course code and the exhibit title that produced it,
so the college staff in the room can confirm or kill it on sight. In a regional
meeting the curator IS in the room; this tool's job is to put a short, checkable
list in front of them, not to decide.

⚠️ A CAPABILITY CAN BE INVISIBLE TO A PROGRAM SEARCH (Delta run, 2026-08-19): its
10-course plumbing apprenticeship sits under no plumbing-named COCI program and the
prefix reads as construction. So the COURSE catalog is searched too, and a course-only
hit is reported as `partial`, never as `none`.

    python3 kb/_build_regional_cpl_opportunity.py \
        --college "Santa Rosa Junior College" \
        --occupations kb/reference/bay_region_coe_demand_2024_2029.json \
        --region-label "Bay Region"

Outputs to kb/regional_cpl_out/<date>-<slug>/ : the workbook, the HTML page, and
crosswalk.json (the run receipt). Per the artifact policy the workbook and page are
REGENERABLE and are not committed; the receipt is.
"""
import argparse, base64, datetime, html, json, math, os, re, sys
from collections import defaultdict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_window_json(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        s = fh.read()
    return json.loads(s[s.index("{"):].rstrip().rstrip(";"))


def jload(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return json.load(fh)


# ── tokenizing ───────────────────────────────────────────────────────────────
# SOC titles are long and full of connective tissue ("Except", "All Other").
# Stopping them is what keeps "Helpers, Except ..." from matching everything.
STOP = set("""a an and or of the for to in on with without except all other others general
miscellaneous not elsewhere classified including includes level entry first line workers worker
occupations occupation specialists specialist technicians technician assistants assistant
managers manager supervisors supervisor helpers helper operators operator installers installer
repairers repairer tenders tender setters setter services service related support
studies study technology technologies science sciences program programs certificate certification
introduction introductory beginning intermediate advanced fundamentals basic basics principles
skills training course courses degree associate applied management
""".split())


EXCEPT = re.compile(r",?\s*\b(except|excluding|other than)\b[^,;]*", re.I)
ALLOTHER = re.compile(r",?\s*\ball other\b.*$", re.I)


def clean_title(s):
    """Strip the exclusion clauses SOC titles use. 'Dispatchers, Except Police,
    Fire, and Ambulance' is about dispatchers and is explicitly NOT about police
    or fire; tokenizing the whole string inverts its meaning."""
    return ALLOTHER.sub("", EXCEPT.sub("", s or "")).strip(" ,;")


def toks(s):
    return [t for t in re.split(r"[^a-z0-9]+", (s or "").lower())
            if len(t) > 2 and t not in STOP]


def _dedupe(seq):
    """The same course arrives from two articulations. Keep first-seen order."""
    seen, out = set(), []
    for x in seq:
        if x not in seen:
            seen.add(x); out.append(x)
    return out


# ⚠️ -er / -or DERIVE AN AGENT *AND* END ORDINARY WORDS, so stripping them can
# land on a DIFFERENT word. Measured 2026-09-16 joining the 369 California
# licenses to the 541 COE occupations: "engineer" reduced to "engine" and put Bus
# and Truck Mechanics and Diesel Engine Specialists against Engineer In Training
# (8 pairs), and "actors" reduced to "act" and put Actors against the California
# Residential Mortgage Lending Act. The coverage rule cannot catch either — by
# the time coverage runs, the collapsed token is a genuine member of both sets.
#
# ⚠️ "IS THE BARE WORD ALSO IN PLAY" IS THE WRONG TEST, AND IT WAS TRIED FIRST.
# For a true agent noun the bare word being present is exactly when the merge is
# RIGHT: Roofers/Roof, Floral Designers/Floral Design, Data Entry Keyers/10-Key.
# That rule cost Santa Rosa three correct rows before the before/after run caught
# it. What separates engineer and actor is that they are not agent derivations of
# the word the strip produces — engineer is not "one who engines", and the "act"
# an actor performs is not the "Act" a legislature passes.
#
# So the guard names the FORBIDDEN LANDING POINTS, not a condition. A strip that
# lands on one of these falls through to the next suffix, which leaves the plural
# strip intact: engineers -> engineer, actors -> actor. Two spellings of the same
# occupation still reach each other, and neither reaches engine or act.
#
# Extend it when a join measures a new collision. Each entry earns its place by
# a counted false pair, never by suspicion.
AGENT_SUF = ("ers", "ors", "er", "or")
NOT_AGENT_ROOTS = frozenset({
    "engine",   # engineer/engineers — 8 false pairs, 2026-09-16
    "act",      # actor/actors — 1 false pair, 2026-09-16
})


def stem(t):
    for suf in ("ing", "ers", "er", "ors", "or", "ies", "es", "s"):
        if len(t) > 4 and t.endswith(suf):
            base = t[: -len(suf)]
            if suf in AGENT_SUF and base in NOT_AGENT_ROOTS:
                continue          # try the next suffix; the plural strip is safe
            return base
    return t


def tokset(s):
    return {stem(t) for t in toks(s)}


class Matcher:
    """Conservative title matcher. A hit needs either two shared significant
    tokens, or one token rare enough across the corpus to carry alone
    ('cosmetology' does; 'medical' does not). Rarity is measured, not guessed."""

    def __init__(self, corpus):
        self.df = Counter()
        self.n = max(1, len(corpus))
        for s in corpus:
            for t in tokset(clean_title(s)):
                self.df[t] += 1

    def idf(self, t):
        return math.log(self.n / (1 + self.df.get(t, 0)))

    def rare(self, t):
        # present in under ~2% of the corpus -> distinctive enough to stand alone
        return self.df.get(t, 0) <= max(1, int(0.02 * self.n))

    def hit(self, a, b):
        """`a` is the occupation, `b` the candidate. A shared token is not enough:
        the shared set must COVER a real share of the occupation's meaning.
        Measured 2026-09-16 — without coverage, Santa Rosa returned 233 "adopt
        now" rows against Delta's 42, and the samples were wrong (a solar
        programme for Security and Fire Alarm Installers, Medical Assisting for
        Diagnostic Medical Sonographers). Generic words like "medical" and
        "manufacturing" clear a rarity test on a 150-row corpus while carrying
        almost no meaning; coverage is what rejects them."""
        A, B = tokset(clean_title(a)), tokset(clean_title(b))
        if not A:
            return None
        shared = A & B
        if not shared:
            return None
        cover = len(shared) / len(A)
        # ⚠️ ONE SHARED WORD IS A MATCH ONLY WHEN IT IS THE WHOLE OF ONE SIDE.
        # Measured 2026-09-16 on Santa Rosa: without this, "Audiovisual Equipment
        # Installers" matched "Diesel Equipment Technology" on `equipment`, and
        # "Aircraft Service Attendants" matched "Personal Care Attendant" on
        # `attendant`. Both titles carry two domain words and agree on the weaker
        # one. "Paralegals and Legal Assistants" against "Paralegal Studies"
        # survives because `studies` is generic framing and the programme side
        # reduces to {paralegal} alone.
        # ⚠️ RARITY WAS TRIED HERE AND IS THE WRONG SIGNAL (2026-09-16, measured).
        # Gating this path on `rare(shared)` was meant to stop "Engineering" —
        # a whole title that reduces to one token — collecting Locomotive, Ship,
        # Rail Yard and Stationary Engineers, none of whom is an engineer in the
        # academic sense. It did not even do that (at 220 programs the 2% floor
        # still called `engineer` rare) and it cost real rows: Welders, Cutters,
        # Solderers and Brazers stopped reaching Welding, Automotive Body and
        # Related Repairers stopped reaching Auto Body, Nursing Assistants
        # stopped reaching Nursing. Delta's decision F1 fell 0.653 -> 0.630.
        # The reason is that rarity runs BACKWARDS here: a college with several
        # welding programs serves welders MORE, not less. What is left is a
        # homograph problem, and it wants a sense distinction, not a frequency.
        ok = (len(shared) >= 2 and cover >= 0.50) or \
             (len(shared) == 1 and (len(A) == 1 or len(B) == 1))
        if not ok:
            return None
        return dict(shared=sorted(shared), cover=round(cover, 2),
                    score=round(sum(self.idf(t) for t in shared), 2))


# ── identity ─────────────────────────────────────────────────────────────────
def make_resolver():
    """College name -> canonical, through the committed roster. Never hand-rolled:
    COCI ships SHORT_CAPS ('ALAMEDA'), MAP ships display names."""
    DM = jload("kb/fire_electrical_domain_map.json")
    roster = jload("kb/college_short_names.json")["colleges"]
    ALIAS = DM["join"]["aliases"]
    FOLD = {k: v for k, v in DM["join"]["folds"].items() if not k.startswith("_")}
    caps = {c["short_caps"]: c["canonical"] for c in roster}

    def norm(s):
        s = (s or "").lower().replace("ñ", "n")
        s = re.sub(r"\b(community|junior|college)\b", "", s)
        return re.sub(r"[^a-z0-9]+", "", s)

    n2c = {}
    for c in roster:
        for k in [c["canonical"], c["short"], c["short_caps"]] + c.get("aliases", []):
            n2c.setdefault(norm(k), c["canonical"])

    def R(n):
        n = FOLD.get(n, n)
        r = ALIAS.get(n) or caps.get(n) or n2c.get(norm(n))
        return FOLD.get(r, r) if r else None
    return R, DM


# ── who is in the room ───────────────────────────────────────────────────────
IDENTITY = "kb/college_identity/2026-08-23/crosswalk.json"


def identity_rows():
    """The committed college/district taxonomy: 120 entities, 73 districts.

    It carries no region field, so region selection reads a separate roster —
    see `swp_colleges()`.

    ⚠️ THIS DOCSTRING USED TO SAY THE SWP ROSTER EXISTED NOWHERE IN THIS REPO
    AND THAT NO REGION SCHEME MAY STAND IN FOR IT. The first half stopped being
    true on 2026-09-16, when the roster was derived from county and applied to
    `map_colleges.swp_region`; the second half was sound, and `--region` was
    violating it at the same time by reading the fire/electrical macro-region.
    Measured 2026-09-17: `--region "Bay Area"` returned 23 colleges where the
    consortium has 28, dropping Berkeley City, Cabrillo, Cañada, Hartnell and
    Monterey Peninsula with nothing on the page to say so. Use `--swp-region`
    for a consortium; `--region` stays for the proximity grouping it names."""
    return jload(IDENTITY)["colleges"]


SWP_ROSTER = "kb/reference/swp_region_roster.json"


def swp_colleges(code_or_name):
    """Every college in one Strong Workforce consortium, by code (`Bay`) or name
    (`Bay Area`). Reads the roster committed at `kb/reference/swp_region_roster.json`
    rather than Supabase, because the sandbox cannot reach `*.supabase.co`
    (Rule 10c) — the file carries the query that refreshes it."""
    R = jload(SWP_ROSTER)["regions"]
    want = (code_or_name or "").strip().lower()
    for code, blk in R.items():
        if want in (code.lower(), blk["name"].lower()):
            return blk["colleges"], blk["name"]
    raise SystemExit("Unknown Strong Workforce region %r. Known: %s"
                     % (code_or_name, ", ".join(sorted(R))))


def select_colleges(names, districts, region, R, swp_region=None):
    """Resolve a multi-select into a set of canonical college names, and say
    where each came from so the page can show the filter that produced it."""
    rows = identity_rows()
    by_district = defaultdict(list)
    for r in rows:
        if r.get("district") and r.get("entity_kind") == "college":
            by_district[r["district"]].append(r["college_name"])

    picked, why = {}, {}
    for n in (names or []):
        c = R(n) or n
        picked[c] = True
        why[c] = "college"
    for d in (districts or []):
        matches = [k for k in by_district if k.lower() == d.lower()] or \
                  [k for k in by_district if d.lower() in k.lower()]
        if not matches:
            raise SystemExit("No district matches %r. Known districts: %d — try e.g. %r"
                             % (d, len(by_district), sorted(by_district)[0]))
        for k in matches:
            for c in by_district[k]:
                c = R(c) or c
                picked.setdefault(c, True)
                why.setdefault(c, "district: %s" % k)
    if swp_region:
        cols, label = swp_colleges(swp_region)
        for c in cols:
            c = R(c) or c
            picked.setdefault(c, True)
            why.setdefault(c, "Strong Workforce region: %s" % label)
    if region:
        DM = jload("kb/fire_electrical_domain_map.json")
        for r in DM["receipts"]["college_courses"]:
            if r["region"].lower() == region.lower():
                c = R(r["college"]) or r["college"]
                picked.setdefault(c, True)
                why.setdefault(c, "region: %s" % r["region"])
    return sorted(picked), why


# ── what we tell a college about how good these matches are ─────────────────
# ⚠️ ONE SOURCE, THREE SURFACES. The workbook, the screen page and the handout all
# carry this; three copies would drift the first time the score moves. Numbers
# come from kb/_score_occupation_matcher.py against the 139 occupations a human
# ruled on at San Joaquin Delta College — re-run it and update BOTH here.
MATCH_ACCURACY = dict(
    rulings=139,
    precision="about nine in ten",
    recall="roughly half",
    scored_on="2026-09-16",
)
ACCURACY_HEAD = "How good are these matches?"
ACCURACY_BODY = (
    "Checked against %(rulings)d occupations reviewed by hand at one college: "
    "%(precision)s of the rows shown hold up, and the list finds %(recall)s of what "
    "the reviewer found. Read a row as a candidate and a gap as unconfirmed. "
    "Faculty confirm every match before a college acts on it." % MATCH_ACCURACY
)


# ── the college's own capability ─────────────────────────────────────────────
def college_capability(college, R):
    """What this college actually offers: Active/Approved COCI programs (CTE flagged)
    and its full course catalog. Both, because a capability can be invisible to a
    program search."""
    d = load_window_json("coci_programs_data.js")
    CO, AW, ST = d["colleges"], d["awards"], d["statuses"]
    progs = []
    for r in d["rows"]:
        if R(CO[r[0]]) != college or ST[r[6]] not in ("Active", "Approved"):
            continue
        progs.append(dict(title=r[2].strip(), award=AW[r[5]], units=r[7], cte=(r[9] == 1)))

    t = load_window_json("tmc_college_courses.js")
    names, courses = t["colleges"], t["courses"]
    cat = []
    for i, nm in enumerate(names):
        if R(nm) != college:
            continue
        for row in (courses.get(str(i)) or []):
            cat.append(dict(subj=str(row[0]).strip(), num=str(row[1]).strip(),
                            title=str(row[2]).strip(),
                            units=(row[3] if len(row) > 3 else None)))
    return progs, cat


# ── MAP: which credentials exist, and is this college on them ────────────────
def map_exhibits(_unused=None):
    """unified title -> exhibit ids, adopters, potential, cpl types, discipline."""
    sw = load_window_json("statewide_data.js")
    info = defaultdict(lambda: dict(ids=set(), adopt=set(), pot=set(), types=set(),
                                    disc=set(), statewide=False))
    for e in sw["exhibits"]:
        ut = e.get("unified_title") or e.get("title")
        i = info[ut]
        for x in (e.get("exhibit_ids") or [e.get("exhibit_id")]):
            if x:
                i["ids"].add(x)
        i["adopt"].update(e.get("adopter_names") or [])
        i["pot"].update(e.get("potential_names") or [])
        if e.get("cpl_type"):
            i["types"].add(e["cpl_type"])
        if e.get("discipline"):
            i["disc"].add(e["discipline"])
        if e.get("collaborative_type") == "CCC Collaborative":
            i["statewide"] = True
    return info


# ── the cross ────────────────────────────────────────────────────────────────
FIT_ORDER = {"confirmed": 0, "partial": 1, "none": 2}
EX_ORDER = {"on_it": 0, "exists": 1, "nowhere": 2}

PRIORITY = {
    ("confirmed", "exists"):   ("P1", "Adopt now — you teach it, the exhibit exists, you are not on it"),
    ("confirmed", "on_it"):    ("P0", "Already yours — you teach it and you are on the exhibit"),
    ("confirmed", "nowhere"):  ("P2", "Build first-in-state — you teach it, no exhibit exists anywhere"),
    ("partial", "exists"):     ("P3", "Check the fit — courses look close, the exhibit exists"),
    ("partial", "on_it"):      ("P3", "Check the fit — you are on the exhibit, programs are indirect"),
    ("partial", "nowhere"):    ("P4", "Build later — partial capability, nothing to adopt"),
    ("none", "exists"):        ("P5", "Not yours today — the exhibit exists, you do not teach it"),
    ("none", "on_it"):         ("P5", "On the exhibit without the programs — worth a look"),
    ("none", "nowhere"):       ("P6", "Out of scope — no capability, no exhibit"),
}


def load_occupations(occ_path, occ_region=None):
    """The statewide COE file carries all nine regions (4,869 rows). Matching the
    whole thing against one college is nine times the work for one region's answer,
    so a multi-region file MUST be filtered."""
    doc = jload(occ_path)
    occs = doc["occupations"] if isinstance(doc, dict) else doc
    codes = {o.get("region_code") for o in occs if o.get("region_code")}
    if len(codes) > 1:
        if not occ_region:
            raise SystemExit("%s carries %d regions (%s). Pass --occ-region."
                             % (occ_path, len(codes), ", ".join(sorted(codes))))
        occs = [o for o in occs if o.get("region_code") == occ_region]
        if not occs:
            raise SystemExit("No rows for --occ-region %r. Known: %s"
                             % (occ_region, ", ".join(sorted(codes))))
    return occs


def build(colleges, occ_path, region_label, why=None, occ_region=None):
    """Cross a region's occupation list against EVERY selected college at once.
    The exhibit match is college-independent, so it is computed once and only the
    adoption check varies per college — 541 occupations x 2,617 exhibit titles is
    the expensive half and it should not run N times."""
    R, DM = make_resolver()
    canon_all = [R(c) or c for c in colleges]
    ex = map_exhibits(None)

    occs = load_occupations(occ_path, occ_region)

    ex_titles = list(ex.keys())
    mx = Matcher(ex_titles)
    occ_ex = {}
    for o in occs:
        t = o.get("title") or o.get("occupation") or ""
        hits = [(x, h) for x in ex_titles if (h := mx.hit(t, x))]
        hits.sort(key=lambda z: -z[1]["score"])
        occ_ex[t] = [x for x, _ in hits[:4]]

    per = {}
    for canon in canon_all:
        per[canon] = build_one(canon, occs, occ_ex, ex, R)

    agg = aggregate(occs, per, occ_ex, ex, canon_all)
    return dict(colleges=canon_all, why=why or {}, region=region_label,
                n_occupations=len(agg), per_college={c: v["summary"] for c, v in per.items()},
                rows=agg, detail=per)


def build_one(canon, occs, occ_ex, ex, R):
    progs, cat = college_capability(canon, R)
    mp = Matcher([p["title"] for p in progs])
    mc = Matcher([c["title"] for c in cat])
    rows = []
    for o in occs:
        title = o.get("title") or o.get("occupation") or ""
        if not title:
            continue

        pm = [(p, h) for p in progs if (h := mp.hit(title, p["title"]))]
        pm.sort(key=lambda x: -x[1]["score"])
        cm = [(c, h) for c in cat if (h := mc.hit(title, c["title"]))]
        cm.sort(key=lambda x: -x[1]["score"])
        fit = "confirmed" if pm else ("partial" if cm else "none")

        xt = occ_ex.get(title, [])
        on_it = [t for t in xt if canon in ex[t]["adopt"]]
        st = "on_it" if on_it else ("exists" if xt else "nowhere")

        pri, label = PRIORITY[(fit, st)]
        rows.append(dict(
            occupation=title, soc=o.get("soc", ""), education=o.get("education", ""),
            fit=fit, exhibit_status=st, priority=pri, priority_label=label,
            programs=[p["title"] for p, _ in pm[:4]],
            program_evidence="; ".join(sorted({t for _, h in pm[:4] for t in h["shared"]})),
            courses=_dedupe([f"{c['subj']} {c['num']} — {c['title']}"
                             + (f" ({c['units']} units)" if c.get("units") else "")
                             for c, _ in cm[:8]])[:5],
            exhibits=xt[:4],
            exhibit_ids=sorted({i for t in xt[:4] for i in ex[t]["ids"]})[:4],
            exhibits_adopted=on_it[:4],
            cpl_types=sorted({y for t in xt[:4] for y in ex[t]["types"]}),
            n_programs=len(pm), n_courses=len(cm), n_exhibits=len(xt)))

    rows.sort(key=lambda r: (r["priority"], -r["n_programs"], r["occupation"].lower()))
    grid = Counter((r["fit"], r["exhibit_status"]) for r in rows)
    return dict(rows=rows, summary=dict(
        college=canon, n_programs=len(progs), n_cte=sum(1 for p in progs if p["cte"]),
        n_courses=len(cat),
        adopt_now=grid.get(("confirmed", "exists"), 0),
        already=grid.get(("confirmed", "on_it"), 0),
        build=grid.get(("confirmed", "nowhere"), 0)))


def aggregate(occs, per, occ_ex, ex, colleges):
    """One row per OCCUPATION, naming which colleges could act and how. A regional
    meeting has several colleges in the room; the useful unit is the occupation,
    with the colleges listed against it — not N separate reports to cross-read."""
    byocc = {}
    for c in colleges:
        for r in per[c]["rows"]:
            byocc.setdefault(r["occupation"], {})[c] = r
    out = []
    for o in occs:
        t = o.get("title") or o.get("occupation") or ""
        if not t or t not in byocc:
            continue
        m = byocc[t]
        teaches = [c for c in colleges if m[c]["fit"] == "confirmed"]
        partial = [c for c in colleges if m[c]["fit"] == "partial"]
        xt = occ_ex.get(t, [])
        on_it = [c for c in colleges if m[c]["exhibit_status"] == "on_it"]
        adopt = [c for c in teaches if c not in on_it and xt]
        build = [c for c in teaches if not xt]
        if xt:
            head = "Adopt" if adopt else ("Already held" if on_it else "Exhibit exists")
        else:
            head = "Build first-in-state" if teaches else "No exhibit, no programs"
        out.append(dict(
            occupation=t, soc=o.get("soc", ""), education=o.get("education", ""),
            headline=head, exhibits=xt[:3],
            exhibit_ids=sorted({i for x in xt[:3] for i in ex[x]["ids"]})[:3],
            n_teaching=len(teaches), teaching=teaches,
            n_partial=len(partial), partial=partial,
            already_on_it=on_it, could_adopt=adopt, could_build=build,
            evidence={c: (m[c]["programs"][:2] or m[c]["courses"][:2]) for c in teaches},
            courses={c: m[c]["courses"][:4] for c in colleges if m[c]["courses"]}))
    rank = {"Adopt": 0, "Build first-in-state": 1, "Already held": 2,
            "Exhibit exists": 3, "No exhibit, no programs": 4}
    out.sort(key=lambda r: (rank[r["headline"]], -r["n_teaching"], r["occupation"].lower()))
    return out


# ── outputs ──────────────────────────────────────────────────────────────────
# ⚠️ openpyxl IS IMPORTED INSIDE write_workbook(), NOT HERE. At module scope it
# made this file unimportable anywhere the library is absent, and CI's python
# lint steps are stdlib-only by convention — so
# tests/occupation_matcher_stemming_test.py, which only wants stem/toks/Matcher,
# died on `ModuleNotFoundError: openpyxl` on the runner while passing locally
# (2026-09-17). A generator should be importable for its logic without dragging
# in the library that writes its spreadsheet.

NAVY, LIGHT, RULE = "002F6D", "EEF3FA", "C9D6E8"
COLS = [("What to do", 22), ("Occupation", 42), ("SOC", 10), ("Entry level", 26),
        ("Colleges that teach it", 15), ("Could adopt — the exhibit exists", 46),
        ("Could build — no exhibit anywhere", 46), ("Already on the exhibit", 34),
        ("MAP exhibit", 40), ("Exhibit ID", 22)]
KEYS = ["headline", "occupation", "soc", "education", "n_teaching", "could_adopt",
        "could_build", "already_on_it", "exhibits", "exhibit_ids"]


def write_workbook(path, res):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    wb = Workbook(); ws = wb.active; ws.title = "CPL Opportunities"
    thin = Side(style="thin", color=RULE)
    for i, (h, w) in enumerate(COLS, 1):
        c = ws.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF", size=11)
        c.fill = PatternFill("solid", fgColor=NAVY)
        c.alignment = Alignment(vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[1].height = 30; ws.freeze_panes = "A2"
    for ri, r in enumerate(res["rows"], start=2):
        for ci, k in enumerate(KEYS, 1):
            v = r[k]
            if isinstance(v, list): v = "; ".join(v)
            c = ws.cell(row=ri, column=ci, value=v)
            c.alignment = Alignment(vertical="top", wrap_text=k not in ("soc", "n_teaching"))
            c.border = Border(bottom=thin)
            if ri % 2 == 0: c.fill = PatternFill("solid", fgColor=LIGHT)
    ws.auto_filter.ref = f"A1:{get_column_letter(len(COLS))}{max(2, len(res['rows'])+1)}"

    w2 = wb.create_sheet("Colleges in this view")
    for i, (h, w) in enumerate([("College", 36), ("Why it is here", 34), ("Programs", 12),
                                ("CTE", 10), ("Courses", 12), ("Could adopt", 14),
                                ("Could build", 14), ("Already held", 14)], 1):
        c = w2.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=NAVY)
        w2.column_dimensions[get_column_letter(i)].width = w
    for ri, (col, sm) in enumerate(sorted(res["per_college"].items()), start=2):
        for ci, v in enumerate([col, res["why"].get(col, ""), sm["n_programs"], sm["n_cte"],
                                sm["n_courses"], sm["adopt_now"], sm["build"], sm["already"]], 1):
            w2.cell(row=ri, column=ci, value=v).alignment = Alignment(vertical="top")

    w3 = wb.create_sheet("How to read this")
    for i, (h, w) in enumerate([("Field", 28), ("Detail", 110)], 1):
        c = w3.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=NAVY)
        w3.column_dimensions[get_column_letter(i)].width = w
    notes = [
        ("What a row is", "One job the region has. The columns say which of the selected colleges "
                          "could act on it, and how."),
        ("Could adopt", "The college teaches it and a MAP exhibit already exists, but the college is "
                        "not on that exhibit. This is an articulation — paperwork, not new curriculum."),
        ("Could build", "The college teaches it and no exhibit exists anywhere in California. Whoever "
                        "does it is first in the state."),
        ("Two kinds of blank", "'An exhibit exists and we are not on it' and 'no exhibit exists' look "
                               "identical in a spreadsheet and are opposite next steps. They are kept "
                               "in separate columns on purpose."),
        ("EVERY MATCH IS A CANDIDATE", "Matches are made by comparing wording, not by a curriculum "
                                       "review. Some will be wrong. The programs and courses behind "
                                       "each one are in the receipt so a college can reject it on "
                                       "sight. Faculty decide, always."),
        (ACCURACY_HEAD, ACCURACY_BODY),
        ("Region occupation list", res["region"]),
        ("Colleges selected", "%d — see the 'Colleges in this view' sheet" % len(res["colleges"])),
        ("Built", datetime.date.today().isoformat()),
        ("Sources", "CCCCO COCI program export and per-college course catalog; MAP statewide exhibit "
                    "extract; the region's occupation list as supplied."),
        ("Questions", "MAP@rccd.edu"),
    ]
    for ri, (k, v) in enumerate(notes, start=2):
        a = w3.cell(row=ri, column=1, value=k); a.font = Font(bold=True)
        a.alignment = Alignment(vertical="top")
        w3.cell(row=ri, column=2, value=v).alignment = Alignment(vertical="top", wrap_text=True)
    wb.save(path)


PAGE_CSS = """
:root{--ink:#11223a;--muted:#55637a;--line:#c9d6e8;--bg:#f4f7fb;--card:#ffffff;
--navy:#002f6d;--cobalt:#0047ab;--soft:#eef3fa;--accent:#7da1d4;--measure:none}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ink:#e7eef9;
--muted:#a6b4ca;--line:#2b3a52;--bg:#0e1522;--card:#151f2e;--navy:#7da1d4;
--cobalt:#7da1d4;--soft:#1a2637;--accent:#7da1d4}}
:root[data-theme="dark"]{--ink:#e7eef9;--muted:#a6b4ca;--line:#2b3a52;--bg:#0e1522;
--card:#151f2e;--navy:#7da1d4;--cobalt:#7da1d4;--soft:#1a2637;--accent:#7da1d4}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.skip{position:absolute;left:-9999px}
.skip:focus{left:12px;top:12px;position:fixed;z-index:9;background:var(--card);
color:var(--ink);padding:10px 14px;border:2px solid var(--cobalt);border-radius:8px}
.wrap{max-width:1200px;margin:0 auto;padding-block:30px;padding-left:16px;padding-right:16px}
h1{font-size:clamp(1.45rem,3.2vw,2.1rem);margin:0 0 .15em;color:var(--navy)}
h2{font-size:clamp(1.05rem,2vw,1.3rem);margin:2em 0 .2em;color:var(--navy)}
.sub{color:var(--muted);margin:0 0 .6em}
.filters{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 22px}
.chip{display:inline-block;padding:3px 11px;border:1px solid var(--line);border-radius:999px;
font-size:.83rem;background:var(--card)}
.chip b{font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:13px;margin:6px 0 8px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.card .n{font-size:2.1rem;font-weight:700;color:var(--cobalt);line-height:1.05}
.card .l{font-weight:600;margin:.3em 0 .15em}
.card .d{color:var(--muted);font-size:.89rem}
.note{background:var(--soft);border:1px solid var(--line);border-left:4px solid var(--accent);
border-radius:10px;padding:13px 16px;margin:22px 0;color:var(--ink)}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--card);
margin-top:.7em}
table{border-collapse:collapse;width:100%;font-size:.91rem;table-layout:fixed}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--soft);font-weight:600}
td.who{color:var(--muted);font-size:.87rem}
tbody tr:last-child td{border-bottom:none}
a{color:var(--cobalt)}
:focus-visible{outline:3px solid var(--cobalt);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (max-width:560px){.wrap{padding-block:20px}table{font-size:.85rem}
.card .n{font-size:1.8rem}}
"""


def write_page(path, res):
    E = html.escape
    rows = res["rows"]
    adopt = [r for r in rows if r["headline"] == "Adopt"]
    build = [r for r in rows if r["headline"] == "Build first-in-state"]
    held = [r for r in rows if r["headline"] == "Already held"]
    check = [r for r in rows if r["n_teaching"] == 0 and r["n_partial"] > 0]
    P = []
    P.append("<title>CPL opportunities — %s</title>" % E(res["region"]))
    P.append("<style>%s</style>" % PAGE_CSS)
    P.append('<a class="skip" href="#main">Skip to the opportunities</a>')
    P.append('<div class="wrap">')
    P.append("<h1>What CPL could these colleges create or adopt?</h1>")
    P.append('<p class="sub">Jobs in %s, crossed with what each college already teaches '
             "and what already exists in MAP.</p>" % E(res["region"]))

    # the filter that produced this view, stated plainly
    P.append('<div class="filters">')
    seen = []
    for c in res["colleges"]:
        w = res["why"].get(c, "college")
        lab = w if w.startswith("district") or w.startswith("region") else None
        if lab and lab not in seen:
            seen.append(lab)
            P.append('<span class="chip"><b>%s</b></span>' % E(lab))
    for c in res["colleges"]:
        if res["why"].get(c, "college") == "college":
            P.append('<span class="chip">%s</span>' % E(c))
    P.append('<span class="chip">%d colleges in view</span>' % len(res["colleges"]))
    P.append("</div>")

    cards = [(len(adopt), "Could adopt now",
              "A college teaches it and the credit already exists in MAP — it just is not signed up. "
              "Paperwork, not new curriculum."),
             (len(build), "Could build first in the state",
              "A college teaches it and no credit exists anywhere in California."),
             (len(held), "Already held",
              "Teaches it and is already on the exhibit."),
             (len(check), "Worth a look",
              "No matching program, but courses came close.")]
    P.append('<div class="grid">')
    for n, l, d in cards:
        P.append('<div class="card"><div class="n">%d</div><div class="l">%s</div>'
                 '<div class="d">%s</div></div>' % (n, E(l), E(d)))
    P.append("</div>")
    P.append('<div class="note"><strong>Read these as suggestions.</strong> '
             "The matcher compares wording. Faculty supply the curriculum review, so some rows "
             "will be wrong. Each row shows the program and the exhibit behind it so the "
             "college in the room can say yes or no on sight. Faculty decide.</div>")

    P.append('<div id="main">')
    def table(title, lede, items, third_head, third):
        if not items:
            return
        P.append("<h2>%s</h2>" % E(title))
        P.append('<p class="sub">%s</p>' % E(lede))
        P.append('<div class="scroll" role="region" aria-label="%s" tabindex="0"><table>' % E(title))
        P.append('<colgroup><col style="width:27%"><col style="width:9%">'
                 '<col style="width:32%"><col style="width:32%"></colgroup>')
        P.append("<thead><tr><th scope=\"col\">Job</th><th scope=\"col\">Entry level</th>"
                 "<th scope=\"col\">%s</th><th scope=\"col\">%s</th></tr></thead><tbody>"
                 % (E(third_head), "Credit that exists in MAP"))
        for r in items[:60]:
            who = "; ".join(third(r)) or "—"
            ex = "; ".join(r["exhibits"][:2]) or "Nothing in MAP yet"
            edu = (r["education"] or "").replace(" or equivalent", "")
            P.append("<tr><td>%s</td><td class=\"who\">%s</td><td class=\"who\">%s</td>"
                     "<td class=\"who\">%s</td></tr>"
                     % (E(r["occupation"]), E(edu), E(who), E(ex)))
        P.append("</tbody></table></div>")
        if len(items) > 60:
            P.append('<p class="sub">Showing the first 60 of %d — the spreadsheet has them all.</p>'
                     % len(items))

    table("Could adopt now", "The credit already exists. These colleges teach the subject and are "
          "not on the exhibit yet.", adopt, "Colleges that could adopt",
          lambda r: r["could_adopt"])
    table("Could build first in the state", "These colleges teach the subject and no credit for it "
          "exists anywhere in California.", build, "Colleges that teach it",
          lambda r: r["could_build"])
    table("Already held", "Teaching it and already on the exhibit.", held,
          "Colleges already on it", lambda r: r["already_on_it"])
    P.append("</div>")

    P.append("<h2>The colleges in this view</h2>")
    P.append('<div class="scroll" role="region" aria-label="Colleges in this view" tabindex="0"><table>')
    P.append('<colgroup><col style="width:32%"><col style="width:26%"><col style="width:14%">'
             '<col style="width:14%"><col style="width:14%"></colgroup>')
    P.append('<thead><tr><th scope="col">College</th><th scope="col">Why it is here</th>'
             '<th scope="col">Programs</th><th scope="col">Could adopt</th>'
             '<th scope="col">Could build</th></tr></thead><tbody>')
    for c, sm in sorted(res["per_college"].items()):
        P.append("<tr><td>%s</td><td class=\"who\">%s</td><td>%d</td><td>%d</td><td>%d</td></tr>"
                 % (E(c), E(res["why"].get(c, "college")), sm["n_programs"],
                    sm["adopt_now"], sm["build"]))
    P.append("</tbody></table></div>")
    P.append('<div class="note" style="margin-top:26px"><strong>%s</strong> %s</div>'
             % (E(ACCURACY_HEAD), E(ACCURACY_BODY)))
    P.append('<p class="sub" style="margin-top:14px">Built %s · CCCCO COCI programs and course '
             "catalog · MAP statewide exhibits · occupation list as supplied · MAP@rccd.edu</p>"
             % datetime.date.today().isoformat())
    P.append("</div>")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("".join(P))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--college", action="append", default=[],
                    help="repeatable; one or many")
    ap.add_argument("--district", action="append", default=[],
                    help="repeatable; expands to every college in the district")
    ap.add_argument("--region", default=None,
                    help="our internal ~9-way proximity macro-region, from the "
                         "fire/electrical domain map. For a Strong Workforce "
                         "consortium use --swp-region: the two disagree (Bay Area "
                         "is 23 here against the consortium's 28).")
    ap.add_argument("--swp-region", default=None,
                    help="a Strong Workforce consortium, by code (Bay, CVML, FN, GS, "
                         "IE/D, LA, OC, SCC, SD/I) or name. Expands to every member "
                         "college from kb/reference/swp_region_roster.json.")
    ap.add_argument("--occupations", required=True)
    ap.add_argument("--region-label", default="the region")
    ap.add_argument("--occ-region", default=None,
                    help="region code to filter a multi-region occupation file "
                         "(Bay, CVML, FN, GS, IE/D, LA, OC, SCC, SD/I)")
    ap.add_argument("--slug", required=True)
    a = ap.parse_args()

    R, _ = make_resolver()
    colleges, why = select_colleges(a.college, a.district, a.region, R, a.swp_region)
    if not colleges:
        raise SystemExit("Select at least one --college, --district, --region or --swp-region.")

    res = build(colleges, a.occupations, a.region_label, why, a.occ_region)
    date = datetime.date.today().isoformat()
    out = os.path.join(ROOT, "kb/regional_cpl_out", f"{date}-{a.slug}")
    os.makedirs(out, exist_ok=True)
    xlsx = os.path.join(out, f"{date.replace('-', '')}_{a.slug}_CPL_Opportunities.xlsx")
    # ⚠️ THE DEPENDENCY-FREE OUTPUTS GO FIRST, AND THE WORKBOOK LAST. The build
    # above is the expensive part (~6.5 min for 28 colleges); write_workbook is
    # the only step that needs a third-party library, and while it ran first a
    # machine without openpyxl threw the ENTIRE run away — page, handout and the
    # receipt included, none of which need it. Measured 2026-09-17.
    page = os.path.join(out, f"{a.slug}_cpl_opportunities.html")
    write_page(page, res)
    hand = os.path.join(out, f"{a.slug}_handout.html")
    write_handout(hand, res, xlsx)
    with open(os.path.join(out, "crosswalk.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(_generated_at=datetime.datetime.now().isoformat(timespec="seconds"),
                       _generated_by="kb/_build_regional_cpl_opportunity.py", **res),
                  fh, indent=1, ensure_ascii=False)
    try:
        write_workbook(xlsx, res)
    except ImportError as e:
        xlsx = None
        print("workbook skipped (%s). The page, handout and receipt are written." % e)
    adopt = sum(1 for r in res["rows"] if r["headline"] == "Adopt")
    build_n = sum(1 for r in res["rows"] if r["headline"] == "Build first-in-state")
    print(f"{len(colleges)} colleges | {res['n_occupations']} occupations | "
          f"adopt {adopt} · build first-in-state {build_n}")
    if xlsx: print(xlsx)
    print(page); print(hand)
    return 0



# ── the handout ──────────────────────────────────────────────────────────────
# Ashley's format, taken from the Cal-JAC Credit Opportunities guide (7.2026):
# a college heading carrying its own counts, then rows grouped by the thing the
# credit attaches to. One self-contained file — print it, or attach it to mail.
HANDOUT_CSS = """
:root{--ink:#11223a;--muted:#55637a;--line:#c9d6e8;--bg:#f4f7fb;--card:#ffffff;
--navy:#002f6d;--cobalt:#0047ab;--soft:#eef3fa;--gold:#f5a800;--measure:none}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.sheet{max-width:1020px;margin:0 auto;background:var(--card);
padding-block:0;padding-left:0;padding-right:0}
.masthead{display:flex;align-items:center;justify-content:space-between;gap:20px;
flex-wrap:wrap;padding:22px 30px 18px;border-bottom:3px solid var(--navy)}
.masthead img.cpl{height:46px;width:auto;max-width:100%}
.masthead img.seal{height:62px;width:auto}
.partner{font-size:.68rem;letter-spacing:.16em;color:var(--muted);
text-transform:uppercase;margin:0 0 6px}
.inner{padding:24px 30px 34px}
h1{font-size:1.6rem;margin:0 0 .3em;color:var(--navy);line-height:1.2}
.lede{color:var(--ink);margin:0 0 18px;max-width:var(--measure,none)}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 22px}
.btn{font:inherit;font-weight:600;padding:9px 16px;border-radius:8px;
border:1px solid var(--navy);background:var(--navy);color:#fff;cursor:pointer;
text-decoration:none;display:inline-block}
.btn.alt{background:var(--card);color:var(--navy)}
.btn:hover{background:var(--cobalt);border-color:var(--cobalt);color:#fff}
.summary{display:flex;gap:26px;flex-wrap:wrap;padding:14px 18px;background:var(--soft);
border:1px solid var(--line);border-radius:10px;margin:0 0 24px}
.summary div{min-width:120px}
.summary .n{font-size:1.6rem;font-weight:700;color:var(--navy);line-height:1.1}
.summary .l{font-size:.82rem;color:var(--muted)}
.college{margin:26px 0 0;break-inside:avoid}
.college h2{display:flex;justify-content:space-between;align-items:baseline;gap:14px;
flex-wrap:wrap;font-size:1.02rem;letter-spacing:.06em;text-transform:uppercase;
color:var(--navy);margin:0 0 .35em;padding-bottom:7px;border-bottom:2px solid var(--gold)}
.college h2 .counts{font-size:.76rem;letter-spacing:.09em;color:var(--muted);
font-weight:600;white-space:nowrap}
.band{font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;font-weight:700;
color:var(--navy);background:var(--soft);padding:6px 10px;margin:14px 0 0;
border-left:3px solid var(--cobalt)}
table{border-collapse:collapse;width:100%;font-size:.88rem;table-layout:fixed}
th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:.7rem;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);
font-weight:700}
td.q{color:var(--muted)}
.note{border:1px solid var(--line);border-left:4px solid var(--gold);background:var(--soft);
border-radius:8px;padding:12px 15px;margin:22px 0 0}
.foot{margin:26px 0 0;padding-top:14px;border-top:1px solid var(--line);
color:var(--muted);font-size:.82rem}
a{color:var(--cobalt)}
:focus-visible{outline:3px solid var(--cobalt);outline-offset:2px}
@media (max-width:620px){.inner,.masthead{padding-left:16px;padding-right:16px}
h1{font-size:1.32rem}table{font-size:.82rem}}
@media print{
  @page{margin:0.45in}
  body{background:#fff;font-size:10.5pt}
  .sheet{max-width:none}
  .toolbar,.skip{display:none!important}
  .masthead{padding:0 0 10px}
  .inner{padding:12px 0 0}
  .college,tr,.band{break-inside:avoid}
  .college h2{break-after:avoid}
  thead{display:table-header-group}
  a{text-decoration:none;color:var(--ink)}
}
"""


def write_handout(path, res, xlsx_path):
    E = html.escape
    logos = jload("kb/reference/handout_logos.json")
    with open(xlsx_path, "rb") as fh:
        xb64 = base64.b64encode(fh.read()).decode()
    xname = os.path.basename(xlsx_path)

    adopt = [r for r in res["rows"] if r["headline"] == "Adopt"]
    build = [r for r in res["rows"] if r["headline"] == "Build first-in-state"]
    by_college = defaultdict(lambda: {"adopt": [], "build": []})
    for r in adopt:
        for c in r["could_adopt"]:
            by_college[c]["adopt"].append(r)
    for r in build:
        for c in r["could_build"]:
            by_college[c]["build"].append(r)

    P = ["<title>CPL Credit Opportunities — %s</title>" % E(res["region"]),
         "<style>%s</style>" % HANDOUT_CSS, '<div class="sheet">']
    P.append('<div class="masthead"><div>'
             '<p class="partner">In partnership with the</p>'
             '<img class="cpl" alt="California Community Colleges Credit for Prior Learning Initiative" '
             'src="data:image/png;base64,%s"></div>'
             '<img class="seal" alt="California Community Colleges Chancellor\'s Office seal" '
             'src="data:image/png;base64,%s"></div>' % (logos["cpl"], logos["seal"]))
    P.append('<div class="inner">')
    P.append("<h1>CPL Credit Opportunities — %s</h1>" % E(res["region"]))
    P.append('<p class="lede">This guide maps the occupations %s needs to the courses these '
             "colleges already teach, and shows where Credit for Prior Learning can be adopted "
             "from an existing MAP exhibit or built for the first time in California.</p>"
             % E(res["region"]))
    P.append('<div class="toolbar">'
             '<button class="btn" type="button" onclick="window.print()">Print or save as PDF</button>'
             '<a class="btn alt" download="%s" href="data:application/vnd.openxmlformats-officedocument'
             '.spreadsheetml.sheet;base64,%s">Download the spreadsheet</a></div>' % (E(xname), xb64))
    P.append('<div class="summary">'
             '<div><div class="n">%d</div><div class="l">Colleges</div></div>'
             '<div><div class="n">%d</div><div class="l">Ready to adopt</div></div>'
             '<div><div class="n">%d</div><div class="l">First in the state</div></div>'
             '<div><div class="n">%d</div><div class="l">Occupations reviewed</div></div></div>'
             % (len(res["colleges"]), len(adopt), len(build), res["n_occupations"]))

    for col in sorted(by_college):
        blk = by_college[col]
        P.append('<div class="college"><h2>%s<span class="counts">%d TO ADOPT &nbsp;·&nbsp; '
                 "%d TO BUILD</span></h2>" % (E(col), len(blk["adopt"]), len(blk["build"])))
        for key, label in (("adopt", "Adopt — the credit already exists in MAP"),
                           ("build", "Build — first in California")):
            items = blk[key]
            if not items:
                continue
            P.append('<p class="band">%s</p>' % E(label))
            head3 = "MAP exhibit to adopt" if key == "adopt" else "Your courses that carry it"
            P.append('<table><colgroup><col style="width:26%"><col style="width:30%">'
                     '<col style="width:44%"></colgroup><thead><tr>'
                     '<th scope="col">Occupation</th><th scope="col">' + E(head3) + '</th>'
                     '<th scope="col">Your courses and units</th></tr></thead><tbody>')
            for r in sorted(items, key=lambda z: z["occupation"].lower())[:25]:
                mid = ("; ".join(r["exhibits"][:2]) if key == "adopt"
                       else "No exhibit exists in California") or "—"
                crs = r.get("courses", {}).get(col) or r["evidence"].get(col) or []
                cell = "<br>".join(E(c) for c in crs[:4]) or "—"
                P.append('<tr><td>' + E(r["occupation"]) + '</td><td class="q">' + E(mid)
                         + '</td><td class="q">' + cell + "</td></tr>")
            P.append("</tbody></table>")
            if len(items) > 25:
                P.append('<p class="q" style="font-size:.82rem;margin:.5em 0 0">'
                         "and %d more in the spreadsheet</p>" % (len(items) - 25))
        P.append("</div>")

    P.append('<div class="note"><strong>%s</strong> The matches compare course and occupation '
             "wording. %s</div>" % (E(ACCURACY_HEAD), E(ACCURACY_BODY)))
    P.append('<p class="foot">Built %s · Sources: CCCCO COCI program and course catalogs, MAP '
             "statewide exhibits, and the regional occupation list · Questions: MAP@rccd.edu</p>"
             % datetime.date.today().isoformat())
    P.append("</div></div>")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("".join(P))

if __name__ == "__main__":
    sys.exit(main())
