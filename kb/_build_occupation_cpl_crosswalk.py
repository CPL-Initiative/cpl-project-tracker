#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build an OCCUPATION-anchored statewide CPL crosswalk workbook.

    "I work in this occupation. Which California Community College will give me
     credit for the training I already have, for which course, and where?"

First run: San Joaquin Department of Adult Education (SJCOE), Electrical / Fire /
Wildland Fire, all California Community Colleges (2026-09-14, for Ashley). It is
the fourth instrument in the San Joaquin crosswalk lineage:

  kb/_build_partner_crosswalk.py           a partner's occupations -> CPL, statewide
  kb/_build_college_offering_crosswalk.py  those occupations -> ONE college's offerings
  kb/_build_domain_cpl_crosswalk.py        a DOMAIN -> every college, where the chain breaks
  kb/_build_occupation_cpl_crosswalk.py    an OCCUPATION -> every verified exhibit/college/course

WHY A FOURTH INSTRUMENT
-----------------------
Per docs/kb-notes/methodology-a-scoped-question-may-need-a-different-instrument.md,
state the best outcome before reusing a tool. The domain tool's best outcome is a
DEFECT IN THE CHAIN - analysis, for the MAP team, planning what to build. This
one's is a REFERRAL - "present this credential at this college for this course",
for a student at an adult school. A chain-break analysis is the wrong artifact to
hand a student; a referral list is the wrong artifact to plan from. Neither is a
filter on the other.

EVERY ROW IS A VERIFIED ARTICULATION, NOT AN ELIGIBILITY
--------------------------------------------------------
The request was explicit: "Do not include an exhibit unless it can be verified as
available through the MAP platform." So a row is emitted only where MAP records
BOTH that the college adopted the exhibit (statewide_data.js `adopter_names`) AND
the local course that receives the credit (credential_reference_data.js
`articulations[].local[]`). The `potential_names` set - colleges that COULD adopt -
is deliberately never emitted; it is an opportunity, not an opportunity a student
can act on today, and the two are indistinguishable once they are rows in the same
spreadsheet.

AN ARTICULATION'S COLLEGE LIST BELONGS TO THE GROUP, NOT TO EACH COURSE IN IT
-----------------------------------------------------------------------------
This is the correctness trap in this dataset. A C-ID-keyed articulation carries a
set of local course variants and a set of colleges, and the colleges apply to the
GROUP - not to each variant. Emitting the cross product claims San Diego Miramar
teaches FIRE B1, FIRETEC 2, FT 1 and FSC 111; it teaches none of them (its fire
prefix is FIPT). Measured on the first build: 21 of 27 rows for one
(occupation, college, exhibit) were phantom, and 7,332 rows fell to a verified
core once gated. So every row is re-attached to its college through the COCI
per-college catalog (tmc_college_courses.js) and dropped if that college does not
actually list that subject and number. The gate is what makes "College" and
"Course Name" mean the same thing in every row.

THE RECOMMENDATION IS MATCHED TO THE COURSE THAT RECEIVES IT
------------------------------------------------------------
A credential publishes several recommendation lines ("3 hours in Fire Protection
Organization", "3 hours in Fire Behavior and Combustion"). Printing the credential's
first line against every one of its courses would misattribute units. Each local
course is matched to the recommendation line naming THAT course, and falls back to
the credential-level recommendation only when no line matches.
(docs/kb-notes/methodology-follow-the-recommendation-to-the-course-that-receives-it.md)

    python3 kb/_build_occupation_cpl_crosswalk.py --slug sjcoe-electrical-fire

Outputs to kb/occupation_crosswalk_out/<date>-<slug>/ : the workbook and
crosswalk.json (the run receipt). Per the repo artifact policy the workbook is
REGENERABLE and is not committed; the map and the receipt are.
"""
import argparse, datetime, json, os, re, sys
from collections import defaultdict

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_window_json(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        s = fh.read()
    return json.loads(s[s.index("{"):].rstrip().rstrip(";"))


def jload(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return json.load(fh)


def ckey(t):
    return re.sub(r"[^a-z0-9]+", "", (t or "").lower())


def norm_college(s):
    s = (s or "").lower().replace("\u00f1", "n")
    s = re.sub(r"\b(community|junior|college)\b", "", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def course_catalog():
    """(college -> {(SUBJ, NUM): catalog title}) from the COCI per-college course
    export. This is the authority on whether a college actually lists a course."""
    d = load_window_json("tmc_college_courses.js")
    names, courses = d["colleges"], d["courses"]
    cat, by_norm = {}, {}
    for i, name in enumerate(names):
        rows = courses.get(str(i)) or []
        m = {}
        for r in rows:
            subj, num = str(r[0]).strip().upper(), str(r[1]).strip().upper()
            if subj and num: m.setdefault((subj, num), str(r[2]).strip())
        cat[name] = m
        by_norm.setdefault(norm_college(name), name)
    return cat, by_norm, d["_meta"].get("_generated_at", "")


# ------------------------------------------------------------- scoping ------
def make_domain(DM, OM):
    """Scope an exhibit title to a lane using MAP'S OWN PROGRAM AREAS FIRST.

    Ashley, 2026-09-14: "use the knowledge base in the MAP Platform". MAP publishes
    its statewide CPL program areas at map.rccd.edu/statewidecpl/, mirrored in
    kb/statewide_exhibit_categories.json, and that taxonomy — not this repo's
    regexes — is the authority on what counts as Fire, Wildland or Electrical.

    It resolves in MAP's own order:
      1. MAP's explicit title -> category assignment.
      2. MAP's own fallback patterns, in MAP's order (which deliberately tests
         paramedic / emt / emergency-medical BEFORE fire, and wildland before fire).
      3. Only for titles MAP's logic does not reach — overwhelmingly LOCAL exhibits,
         since MAP's list covers the statewide set — this repo's committed lane
         regex from kb/fire_electrical_domain_map.json.

    ⚠️ "Emergency Medical Services" is a HARD EXCLUSION that overrides step 3. MAP
    files Firefighter EMT Certificate and Fire Fighter Paramedic Journeyperson
    Certificate there, not under Fire Technology; a fire-shaped title is not a fire
    program if MAP says it is EMS.

    ⚠️ MAP has no Electrical category — its electrical credentials (C-10, C-46, NCCER
    Commercial/Industrial Electrician 1-4, both apprenticeships) sit inside
    Construction Technology, which also holds masonry, plumbing and carpentry. So a
    Construction Technology title is in scope only if it is also electrical TRADE,
    which is what the false-positive lists are for.
    """
    SC = jload("kb/statewide_exhibit_categories.json")
    TITLES = SC["titles"]
    PATTERNS = [(re.compile(pat, re.I), cat) for pat, cat in SC["patterns"]]

    S = DM["scoping"]
    FIRE_FP = re.compile(S["fire_false_positives"], re.I)
    ELEC_FP = re.compile(S["electrical_false_positives"], re.I)
    ELEC_FP2 = re.compile(OM["extra_electrical_false_positives"]["pattern"], re.I)
    ELEC_TRADE = re.compile(r"electric|wireman|lineman|lineworker|ibew|c-10\b|c-46\b"
                            r"|photovoltaic|solar|motors and controls", re.I)

    CAT_TO_LANE = {"Fire Technology": "Fire", "Fire Technology - Wildland": "Wildland Fire"}

    def map_category(title):
        if title in TITLES: return TITLES[title]
        for rx, cat in PATTERNS:
            if rx.search(title): return cat
        return None

    def is_electrical_trade(t):
        return bool(ELEC_TRADE.search(t)) and not (ELEC_FP.search(t) or ELEC_FP2.search(t))

    def domain(t, issuers):
        cat = map_category(t)

        # MAP has spoken: its category decides, and EMS is never fire.
        if cat == "Emergency Medical Services": return None
        if cat in CAT_TO_LANE:
            return None if FIRE_FP.search(t) else CAT_TO_LANE[cat]
        if cat == "Construction Technology":
            return "Electrical" if is_electrical_trade(t) else None
        if cat is not None:
            return None                      # every other MAP program area is out of scope

        # MAP's list does not reach this title (a local exhibit). Repo regex, same order.
        s = t.lower(); iss = " ".join(issuers).lower()
        if FIRE_FP.search(s): return None
        if re.search(r"wildland|nwcg|wildfire", s) or "wildfire coordinating" in iss:
            return "Wildland Fire"
        if re.search(r"paramedic|\bemt\b|emergency medical", s): return None   # EMS, per MAP
        if (re.search(r"\bfire\b|firefight|fire fighter|fire officer|fire inspector|fire apparatus"
                      r"|fire instructor|fire prevention|rescue systems|hazardous materials"
                      r"|driver/operator|fire academy|fire service|fire control|fire behavior"
                      r"|fire protection|fire science|fire technology", s)
                or "state fire training" in iss or "cal fire" in iss):
            return "Fire"
        if is_electrical_trade(s): return "Electrical"
        return None
    return domain


# -------------------------------------------------------------- units -------
PREFIX = re.compile(r"^\s*\d+(?:\.\d+)?\s*(?:-|–|to)?\s*\d*(?:\.\d+)?\s*(?:hours?|units?)\s+in\s+", re.I)


def rec_course(line_text):
    """'3 hours in Fire Protection Organization' -> 'Fire Protection Organization'."""
    return PREFIX.sub("", line_text or "").strip()


# --------------------------------------------------------------- build ------
def build(slug):
    DM = jload("kb/fire_electrical_domain_map.json")
    OM = jload("kb/sjcoe_occupation_scope_map.json")
    domain = make_domain(DM, OM)

    sw = load_window_json("statewide_data.js")
    cr = load_window_json("credential_reference_data.js")
    recs = load_window_json("fact-sheet/statewide_recs.js")

    region = {r["college"]: r["region"] for r in DM["receipts"]["college_courses"]}
    CAT, CAT_NORM, CAT_AT = course_catalog()
    ALIAS = DM["join"]["aliases"]
    FOLD = {k: v for k, v in DM["join"]["folds"].items() if not k.startswith("_")}

    def catalog_for(college):
        n = FOLD.get(college, college)
        if n in CAT: return CAT[n]
        n2 = ALIAS.get(n)
        if n2 and n2 in CAT: return CAT[n2]
        hit = CAT_NORM.get(norm_college(n))
        return CAT.get(hit) if hit else None

    dropped = defaultdict(int)

    # unified title -> issuers / discipline / adopters, and (title, college) -> exhibit id
    meta = defaultdict(lambda: dict(iss=set(), disc=set(), adopt=set()))
    ex_by_college = defaultdict(dict)          # ut -> college -> exhibit_id
    ex_any = defaultdict(list)                 # ut -> [exhibit_id]
    for e in sw["exhibits"]:
        ut = e.get("unified_title") or e.get("title")
        m = meta[ut]
        if e.get("issuing_agency"): m["iss"].add(e["issuing_agency"])
        if e.get("discipline"): m["disc"].add(e["discipline"])
        adopters = e.get("adopter_names") or []
        m["adopt"].update(adopters)
        ids = [x for x in (e.get("exhibit_ids") or [e.get("exhibit_id")]) if x]
        ex_any[ut].extend(ids)
        for c in adopters:
            if ids and c not in ex_by_college[ut]:
                ex_by_college[ut][c] = ids[0]

    cr_ut = {u["ut"]: u for u in cr["unified_titles"]}

    # lane -> [unified titles]
    lane_titles = defaultdict(list)
    for ut, m in meta.items():
        d = domain(ut, m["iss"])
        if d: lane_titles[d].append(ut)

    FAM = {k: re.compile(v, re.I) for k, v in OM["families"].items() if not k.startswith("_")}
    OCC = {k: v for k, v in OM["occupations"].items() if not k.startswith("_")}
    # EMS credentials attach only to the fire-service occupations that name them.
    LANE_POOL = {"Fire": ["Fire"], "Wildland Fire": ["Wildland Fire"], "Electrical": ["Electrical"]}

    rows, unmatched = [], []
    for occ, spec in OCC.items():
        lane = spec["lane"]
        pools = list(LANE_POOL[lane])
        fams = spec["families"]
        if "WILDLAND" in fams and "Wildland Fire" not in pools: pools.append("Wildland Fire")
        cands = {t for p in pools for t in lane_titles.get(p, [])}
        pats = [FAM[f] for f in fams if f in FAM]
        titles = sorted(t for t in cands if any(p.search(t) for p in pats))

        before = len(rows)
        for ut in titles:
            u = cr_ut.get(ut)
            if not u: continue
            lines = recs.get(ut) or []
            by_course = {}
            for l in lines:
                c = rec_course(l.get("t"))
                if c: by_course.setdefault(ckey(c), l.get("t").strip())
            fallback = (u.get("ccc_rec") or u.get("gen_rec") or "").strip()
            disc_modal = (u.get("disc_modal") or "").strip() or "; ".join(sorted(meta[ut]["disc"]))

            for art in u.get("articulations", []):
                # The credential's modal discipline, not the articulation group's.
                # The group's `disc` is the discipline of the unified COURSE and
                # drifts from the credential: it labelled "CEM 155 Blueprint
                # Reading" under General Electrician Certification as "Welding".
                # The column answers "discipline of the credit recommendation",
                # and a recommendation belongs to the credential.
                art_disc = (art.get("disc") or "").strip()
                for loc in art.get("local", []):
                    course_t = (loc.get("t") or "").strip()
                    if not course_t: continue
                    subj = (loc.get("subj") or "").strip().upper()
                    num = str(loc.get("num") or "").strip().upper()
                    rec = by_course.get(ckey(course_t)) or fallback
                    for college in (loc.get("colleges") or []):
                        # GATE 1 — MAP records this college as having adopted the exhibit.
                        if college not in meta[ut]["adopt"]:
                            dropped["not_an_adopter"] += 1; continue
                        # GATE 2 — the college's own catalog lists this subject + number.
                        cat = catalog_for(college)
                        if cat is None:
                            dropped["college_not_in_catalog"] += 1; continue
                        if not subj or not num or (subj, num) not in cat:
                            dropped["course_not_at_this_college"] += 1; continue
                        title = cat[(subj, num)] or course_t
                        rows.append(dict(
                            occupation=occ, lane=lane,
                            region=region.get(college, "Statewide / unmapped"),
                            rec=rec, discipline=disc_modal or art_disc,
                            exhibit_id=ex_by_college[ut].get(college) or (ex_any[ut][0] if ex_any[ut] else ""),
                            exhibit_title=ut, college=college,
                            course=f"{subj} {num} — {title}"))
        if len(rows) == before:
            unmatched.append(dict(occupation=occ, lane=lane,
                                  credentials_considered=len(titles),
                                  note=("credentials exist but no college has both adopted one and "
                                        "recorded a receiving course" if titles else
                                        "no MAP exhibit in this lane aligns with this occupation")))

    # de-duplicate on the whole visible row
    seen, out = set(), []
    for r in rows:
        k = (r["occupation"], r["region"], r["rec"], r["discipline"], r["exhibit_id"],
             r["exhibit_title"], r["college"], r["course"])
        if k in seen: continue
        seen.add(k); out.append(r)
    out.sort(key=lambda r: (r["occupation"].lower(), r["region"], r["college"],
                            r["exhibit_title"].lower(), r["course"].lower()))
    return out, unmatched, OM, sw, cr, dict(dropped), CAT_AT


# --------------------------------------------------------------- excel ------
NAVY = "002F6D"; LIGHT = "EEF3FA"; RULE = "C9D6E8"
COLS = [("Occupation", 34), ("Region", 20), ("Credit Recommendation", 46), ("Discipline", 24),
        ("Exhibit ID", 22), ("Exhibit Title", 42), ("College", 30), ("Course Name", 46)]
KEYS = ["occupation", "region", "rec", "discipline", "exhibit_id", "exhibit_title", "college", "course"]


def style_header(ws, headers, widths):
    thin = Side(style="thin", color=RULE)
    for i, (h, w) in enumerate(zip(headers, widths), 1):
        c = ws.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF", size=11)
        c.fill = PatternFill("solid", fgColor=NAVY)
        c.alignment = Alignment(vertical="center", horizontal="left", wrap_text=True)
        c.border = Border(bottom=thin)
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[1].height = 30
    ws.freeze_panes = "A2"


def write_workbook(path, rows, unmatched, OM, meta_note):
    wb = Workbook()
    ws = wb.active; ws.title = "CPL Crosswalk"
    style_header(ws, [c[0] for c in COLS], [c[1] for c in COLS])
    thin = Side(style="thin", color=RULE)
    for ri, r in enumerate(rows, start=2):
        for ci, k in enumerate(KEYS, 1):
            c = ws.cell(row=ri, column=ci, value=r[k])
            c.alignment = Alignment(vertical="top", wrap_text=(k in ("rec", "course", "exhibit_title")))
            c.border = Border(bottom=thin)
            if ri % 2 == 0:
                c.fill = PatternFill("solid", fgColor=LIGHT)
    ws.auto_filter.ref = f"A1:{get_column_letter(len(COLS))}{max(2, len(rows)+1)}"

    # Occupations carrying no verified opportunity - stated, never fabricated.
    ws2 = wb.create_sheet("Occupations Without a Match")
    style_header(ws2, ["Occupation", "Program Area", "MAP Credentials Considered", "Why No Rows"],
                 [42, 18, 26, 74])
    if not unmatched:
        ws2.cell(row=2, column=1, value="None — every in-scope occupation has at least one "
                                       "verified CPL opportunity in this crosswalk.").alignment = \
            Alignment(vertical="top", wrap_text=True)
        ws2.merge_cells(start_row=2, start_column=1, end_row=2, end_column=4)
    for ri, u in enumerate(unmatched, start=2):
        for ci, v in enumerate([u["occupation"], u["lane"], u["credentials_considered"], u["note"]], 1):
            cell = ws2.cell(row=ri, column=ci, value=v)
            cell.alignment = Alignment(vertical="top", wrap_text=(ci == 4))

    ws3 = wb.create_sheet("About This Crosswalk")
    style_header(ws3, ["Field", "Detail"], [30, 108])
    for ri, (k, v) in enumerate(meta_note, start=2):
        a = ws3.cell(row=ri, column=1, value=k); a.font = Font(bold=True)
        a.alignment = Alignment(vertical="top")
        b = ws3.cell(row=ri, column=2, value=v); b.alignment = Alignment(vertical="top", wrap_text=True)
    wb.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", default="sjcoe-electrical-fire")
    a = ap.parse_args()

    rows, unmatched, OM, sw, cr, dropped, cat_at = build(a.slug)
    date = datetime.date.today().isoformat()
    outdir = os.path.join(ROOT, "kb/occupation_crosswalk_out", f"{date}-{a.slug}")
    os.makedirs(outdir, exist_ok=True)

    occs = sorted({r["occupation"] for r in rows})
    colleges = sorted({r["college"] for r in rows})
    regions = sorted({r["region"] for r in rows})
    exhibits = sorted({r["exhibit_title"] for r in rows})

    meta_note = [
        ("Prepared for", "San Joaquin Department of Adult Education (SJCOE)"),
        ("Prepared by", "MAP team, CPL Initiative — California Community Colleges Chancellor's Office"),
        ("Date", date),
        ("Scope", "Electrical, Fire and Wildland Fire program areas only, drawn from the SJCOE "
                  "occupation list. Occupations outside these three areas are not included."),
        ("How program areas were decided", "MAP's own statewide CPL program areas "
                                           "(map.rccd.edu/statewidecpl) are the authority. In scope: "
                                           "Fire Technology, Fire Technology - Wildland, and the "
                                           "electrical trade credentials MAP files under Construction "
                                           "Technology. Emergency Medical Services is a separate MAP "
                                           "program area and is excluded — MAP files Firefighter EMT "
                                           "and Fire Fighter Paramedic certificates there, not under "
                                           "Fire Technology."),
        ("What a row means", "A California Community College has adopted this MAP exhibit AND recorded "
                             "the local course that receives the credit. A student holding the credential "
                             "can present it to that college for that course."),
        ("What is not included", "Colleges that could adopt an exhibit but have not yet done so. Every row "
                                 "is an opportunity available today, not a potential one."),
        ("Credit Recommendation", "The published recommendation line naming that specific course. Where a "
                                  "credential publishes several lines, each course carries its own."),
        ("Exhibit ID", "The MAP exhibit identifier for that college's adoption of the exhibit."),
        ("How courses were verified", "A credit recommendation can name several equivalent course numbers "
                                      "used at different colleges. Each course here was checked against that "
                                      "college's own COCI catalog listing, so the course named in a row is a "
                                      "course that college actually offers."),
        ("Regions", "The nine California Community Colleges macro-regions, applied to all 116 colleges."),
        ("Sources", f"MAP statewide exhibit extract (statewide_data.js, {sw.get('generated_at','')}); "
                    f"MAP credential reference + articulations (credential_reference_data.js, "
                    f"{cr.get('_generated_at','')}); published statewide credit recommendations "
                    f"(fact-sheet/statewide_recs.js); CCCCO COCI per-college course catalog "
                    f"(tmc_college_courses.js, {cat_at[:10]})."),
        ("Coverage", f"{len(rows)} opportunities · {len(occs)} occupations · {len(exhibits)} exhibits · "
                     f"{len(colleges)} colleges · {len(regions)} regions."),
        ("Note on EMS", "Excluded. EMT and Paramedic credentials are their own MAP program area. "
                        "Fire-service occupations that require them (FIRE MEDIC, FIRE FIGHTER "
                        "PARAMEDIC, Firefighter EMT) remain in the crosswalk and show their fire "
                        "credentials; ask the MAP team if you want the EMS side as a separate sheet."),
        ("Questions", "MAP@rccd.edu"),
    ]

    xlsx = os.path.join(outdir, f"{date.replace('-','')}_Statewide_CPL_Crosswalk_SJCOE_Electrical_Fire_Wildland.xlsx")
    write_workbook(xlsx, rows, unmatched, OM, meta_note)

    receipt = dict(
        _generated_at=datetime.datetime.now().isoformat(timespec="seconds"),
        _generated_by="kb/_build_occupation_cpl_crosswalk.py",
        slug=a.slug, n_rows=len(rows), n_occupations=len(occs), n_exhibits=len(exhibits),
        n_colleges=len(colleges), regions=regions, occupations=occs,
        unmatched=unmatched, dropped_by_gate=dropped, rows=rows)
    with open(os.path.join(outdir, "crosswalk.json"), "w", encoding="utf-8") as fh:
        json.dump(receipt, fh, indent=1, ensure_ascii=False)

    print(f"rows={len(rows)}  occupations={len(occs)}  exhibits={len(exhibits)}  "
          f"colleges={len(colleges)}  regions={len(regions)}  unmatched={len(unmatched)}")
    print(f"dropped by gate: {dropped}")
    print(xlsx)
    return 0


if __name__ == "__main__":
    sys.exit(main())
