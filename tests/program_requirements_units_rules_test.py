#!/usr/bin/env python3
"""The units rules (Commons Clarity's Part A: A1, A4, A5, A6, A8) keep a correction only when it lands exactly.

WHY. kb/_program_requirements_units_rules.py moves filed records from "units unequal" to passing with free
corrections, and the live UPDATE follows its receipt. A correction that fires where the page did not say it,
or a sum computed without the closed list's units, would pass a record the catalog does not support. Pinned on
fixtures, never on the committed records:

  * each correction fires on its own pattern and lands the fixture's sum on the printed total;
  * the self-check keeps a record as filed when the corrected sum misses the total at either end;
  * A1 never grants an electives fill (the page text would have to confirm it);
  * a record whose sum the committed files cannot reproduce exactly is left alone;
  * the collection lane's colleges are left out (kb/collection_lane.py);
  * A11's named gaps: a general-education pattern certificate by its title, a program the state lists twice,
    and neither at a college the collection lane holds.

Run from repo root: python3 tests/program_requirements_units_rules_test.py
"""
import copy
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_units_rules as U  # noqa: E402
import _harvest_gap_census as G  # noqa: E402
import collection_lane as CL  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def filed(blocks, total, award="Certificate of Achievement", college="Butte College", program=None):
    rec = {"program": dict({"measure": "units", "total_units": {"min": total[0], "max": total[1]}}, **(program or {})),
           "blocks": blocks}
    a = U.arith(rec, award)
    return {"college": college, "control_number": "1", "award": award, "extracted_run": "9", "record": rec,
            "score": {"arithmetic": dict(a, status="unequal", pass_=False)}}


def course(code, units=None, units_max=None, alts=None):
    c = {"code": code}
    if units is not None:
        c["units"] = units
    if units_max is not None:
        c["units_max"] = units_max
    if alts is not None:
        c["alternatives"] = alts
    return c


# A4: a blank "or" alternative takes its row's units.
f = filed([{"name": "Required", "rule": "all",
            "courses": [course("ESTH 142", 4, alts=[{"code": "ESTH 144", "units": None}]), course("ESTH 150", 3)]}],
          (7, 7))
f["score"]["arithmetic"]["computed"] = [5.0, 7.0]   # the filed run read ESTH 144 at 2 from its closed list
j = U.judge(f, {})
check(j["rule"] == "A4" and U.lands(j["arith"]), "A4 fills the blank alternative and lands (%s)" % j.get("rule"))
check(j["record"]["blocks"][0]["courses"][0]["alternatives"][0]["units"] == 4, "A4 copies the row's units")
# A4's lab: printed with no units right after its lecture, it counts 0.
f = filed([{"name": "Required", "rule": "all", "courses": [course("BIOL C1001", 4), course("BIOL C1001L")]}], (4, 4))
f["score"]["arithmetic"].update(status="unequal", computed=[5.0, 5.0])
j = U.judge(f, {})
check(j["rule"] == "A4" and j["record"]["blocks"][0]["courses"][1]["units"] == 0, "A4 counts a blank lab after its lecture 0")

# A6: a choose list printed with the sum of every option (Chaffey History's pattern).
blocks = [{"name": "Core", "rule": "all", "courses": [course("HIST 1", 3), course("HIST 2", 3)]},
          {"name": "List A - Group 1", "rule": "choose_courses", "minimum": 1, "stated": {"min": 9, "max": 9},
           "courses": [course("HIST 10", 3), course("HIST 11", 3), course("HIST 12", 3)]}]
f = filed(blocks, (9, 9), award="A.A.-T Degree")
check(U.arith(f["record"], f["award"])["computed"] == [15.0, 15.0], "the fixture fails as filed, 15 against 9")
check(not U.A6_ON and U.judge(f, {})["rule"] is None, "A6 is off (F5): its record stays as filed")
new6, notes6 = U.a6_sum_of_options(f["record"])
check(notes6 and U.arith(new6, f["award"])["computed"] == [9.0, 9.0], "A6's code still drops the summed figure")
# A6 never fires when the printed figure is not the sum of every option.
b2 = copy.deepcopy(blocks)
b2[1]["stated"] = {"min": 6, "max": 6}
check(not U.a6_sum_of_options({"blocks": b2})[1], "A6 leaves a list printing a real figure alone")

# A5: "any course from List A not already used".
blocks = [{"name": "List A", "rule": "choose_courses", "minimum": 1, "courses": [course("ECON 1", 3), course("ECON 2", 4)]},
          {"name": "List B: Select two courses. Any course from LIST A not already used", "rule": "choose_courses",
           "minimum": 2, "courses": [course("FSM 35", 4), course("HSP 1", 4)]}]
f = filed(blocks, (10, 12), award="A.S.-T Degree")
check(U.arith(f["record"], f["award"])["computed"] == [11.0, 12.0], "the fixture fails as filed, 11-12 against 10-12")
j = U.judge(f, {})
check(j["rule"] == "A5" and j["arith"]["computed"] == [10.0, 12.0], "A5 adds List A's courses and lands")

# The self-check: a correction that does not land leaves the record as filed.
blocks6 = copy.deepcopy([{"name": "Core", "rule": "all", "courses": [course("HIST 1", 3), course("HIST 2", 3)]},
                         {"name": "Pick", "rule": "choose_courses", "minimum": 1, "stated": {"min": 9, "max": 9},
                          "courses": [course("HIST 10", 3), course("HIST 11", 3), course("HIST 12", 3)]}])
f = filed(blocks6, (8, 8))
check(U.judge(f, {})["rule"] is None, "a correction that misses the total keeps the record as filed")

# A1 refuses an electives fill: the page would have to name the electives.
f = filed([{"name": "Required", "rule": "all", "courses": [course("BUS 1", 3)]}], (12, 12),
          program={"electives_fill_degree": True})
check(U.judge(f, {})["rule"] is None, "A1 never grants an electives fill without page text")
# A1 passes a record today's rules pass as filed (a low end that meets the printed total exactly).
f = filed([{"name": "Required", "rule": "all", "courses": [course("BUS 1", 3), course("BUS 2", 3, 4)]}], (6, 6))
check(U.judge(f, {})["rule"] == "A1", "A1 rescores a record today's rules pass")

# Exactness: a record whose sum used the closed list's units, which the committed files lack, is left alone.
f = filed([{"name": "Required", "rule": "all", "courses": [course("BUS 1", 3), course("BUS 9")]}], (6, 6))
f["score"]["arithmetic"].update(computed=[6.0, 6.0], status="unequal")
check(not U.exact(f, f["record"]), "a sum the committed files cannot reproduce is not exact")

# A8: the college's own general education total, where every filed local degree carries one figure.
deg = {"degree_total": {"min": 60, "max": 60}}
files = [{"college": "Butte College", "award": "A.S. Degree",
          "record": {"program": {"ge_units": {"min": 21, "max": 21}}}} for _ in range(3)]
ge = U.college_ge_totals(files)
check(ge.get("Butte College") == (21.0, 21.0), "a college whose local degrees carry one general education total")
check(not U.college_ge_totals(files[:2]), "fewer than three records name no college total")
rec = {"program": dict(deg, measure="units", degree_elective_units={"min": 18, "max": 18}),
       "blocks": [{"name": "Major", "rule": "all", "courses": [course("AG %d" % i, 3) for i in range(7)]}]}
new, notes = U.a8_college_ge(rec, "A.S. Degree", ge["Butte College"])
check(notes and U.lands(U.arith(new, "A.S. Degree")), "A8 gives the degree its college total and lands at 60")
check(not U.a8_college_ge(rec, "A.S.-T Degree", ge["Butte College"])[1], "A8 never fills a transfer degree")

# The collection lane's colleges are left out.
check(U.held("Lassen College") and U.held("Santiago Canyon College") and not U.held("Butte College"),
      "the collection lane's twelve colleges are held, others are not")
check(len(CL.COLLECTION_LANE_S680) == 12, "one named constant holds the twelve")

# A11's named gaps.
col = {"college": "Butte College", "titles": {"100": "Cal-GETC", "200": "English", "300": "English"},
       "awards": {"100": "Certificate of Achievement", "200": "A.A. Degree", "300": "A.A. Degree"},
       "listed": {"100": 0, "200": 0, "300": 12}}
check(G.named_gap(col, "100", "no_closed_list") == ("ge_pattern_certificate", None), "a Cal-GETC certificate is named")
check(G.named_gap(col, "100", "units_unequal") is None, "the label holds only in the no-list and page-not-found piles")
check(G.named_gap(col, "200", "no_closed_list") == ("listed_twice", "300"), "a program listed twice names its other listing")
check(G.named_gap(col, "300", "no_closed_list") is None, "the listing with the course list is not labeled")
check(G.named_gap(dict(col, college="Lassen College"), "100", "no_closed_list") is None,
      "no label at a college the collection lane holds")

# A11 self-recall over the held titles (second reader's F2): every committed program title a looser search finds
# (general education, GETC, IGETC, CSU, breadth, transfer curriculum, GE) is either a hit or a pinned non-pattern.
# A new title in neither fails, so a person judges it before the label reaches it.
import glob  # noqa: E402
import json  # noqa: E402
import re  # noqa: E402
LOOSE = re.compile(r"general\s+ed|getc|igetc|\bcsu\b|breadth|transfer\s+curriculum|\bGE\b", re.I)
NOT_PATTERNS = {  # held answers: not a general-education pattern certificate
    "CSU/UC Preparation", "GENERAL EDUCATION DIPLOMA", "GENERAL EDUCATION DIPLOMA (GED)",
    "GENERAL EDUCATION DIPLOMA - BILINGUAL", "General Education Development Preparation",
    "General Educational Development Program", "Media Arts: Graphic Design (CSU Option)",
}
held_titles = set()
for sp in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "sources.json")):
    with open(sp, encoding="utf-8") as fh:
        held_titles |= {(e.get("title") or "").strip() for e in json.load(fh) if LOOSE.search(e.get("title") or "")}
hit = lambda t: bool(G.GE_PATTERN_TITLE.search(t) and not G.NOT_GE_PATTERN_TITLE.search(t))
right = sum(1 for t in held_titles if hit(t) != (t in NOT_PATTERNS))
wrong = sorted(t for t in held_titles if hit(t) == (t in NOT_PATTERNS))
check(not wrong, "GE pattern self-recall over %d held titles: right %d, wrong %d (%s)"
      % (len(held_titles), right, len(wrong), "; ".join(wrong[:5])))
for t in ("GENERAL EDUCATION DIPLOMA", "General Education Development Preparation"):
    check(G.named_gap({"college": "Pasadena City College", "titles": {"1": t}}, "1", "page_not_found") is None,
          "a diploma or GED takes no GE pattern label: %s" % t)
check(hit("Intersegmental GE Transfer Curriculum") and hit("SRJC Local GE"), "IGETC spelled out and a local GE pattern")

# listed_twice self-recall over held answers: a program whose own listing has a course list never takes the label.
lt_right = lt_wrong = 0
for d in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*")):
    if not os.path.isfile(os.path.join(d, "sources.json")):
        continue
    col = G.read_college_dir(d)
    for cn, n in (col.get("listed") or {}).items():
        if n:
            if G.named_gap(col, cn, "no_closed_list") and G.named_gap(col, cn, "no_closed_list")[0] == "listed_twice":
                lt_wrong += 1
            else:
                lt_right += 1
check(lt_wrong == 0, "listed_twice on held listings with a course list: right %d, wrong %d" % (lt_right, lt_wrong))
print("self-recall: GE pattern %d held titles, right %d, wrong %d; listed_twice on %d listings with their own course "
      "list, right %d, wrong %d" % (len(held_titles), right, len(wrong), lt_right + lt_wrong, lt_right, lt_wrong))

# F1: after the rewrite the college load posts exactly the plan's after-image for every full-row record, so a
# later load or a dry run of it reports no change for them.
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_units_rules_2026-11-18_s680.json")
if os.path.isfile(RECEIPT):
    import _program_requirements_college as C  # noqa: E402
    with open(RECEIPT, encoding="utf-8") as fh:
        rc = json.load(fh)
    full = [r for r in rc["records"] if r["i"] in set(rc["plan"]["full_row"])]
    images = {}
    for college in sorted({r["college"] for r in full}):
        for row in C.load_rows(college)[0]:
            images[(college, str(row["control_number"]))] = row
    same = sum(1 for r in full if (images.get((r["college"], str(r["control_number"]))) or {}).get("record")
               == r["after_image"]["record"] and images[(r["college"], str(r["control_number"]))]["checks"]
               == r["after_image"]["checks"])
    check(full and same == len(full), "the load posts the after-image for %d of %d full-row records" % (same, len(full)))
    check(all(r["before_image"]["record"] != r["after_image"]["record"] for r in full),
          "every full-row record's blocks change (else it belongs in the checks-only part)")
    check(not set(rc["plan"]["checks_only"]) & set(rc["plan"]["full_row"])
          and all(r["rule"] == "A1" for r in rc["records"] if r["i"] in set(rc["plan"]["checks_only"])),
          "A1 alone is checks-only")
    check(not any(r["rule"] == "A6" for r in rc["records"]), "A6 is not in the plan")
    # The checks-only apply ran (migrate run 44259625861, 17 returned, none checked): its rows are marked applied
    # and its rollback names exactly the returned rows.
    ap_ = (rc.get("applied") or {}).get("checks_only") or {}
    check(ap_.get("returned") == 17 and sorted(ap_.get("keys") or []) == sorted(rc["plan"]["checks_only"])
          and all((r.get("applied") or {}).get("part") == "checks_only" for r in rc["records"]
                  if r["i"] in set(ap_.get("keys") or [])) and "e(expect) as (values (17))" in rc["rollback_checks_only"],
          "the 17 checks-only rows are marked applied and the rollback names them")
    # The full-row apply ran (migrate run 44261575737, 39 returned, none checked): marked applied, its rollback
    # names exactly the returned rows, and the committed apply is byte for byte the file that ran.
    apr = (rc.get("applied") or {}).get("full_row") or {}
    check(apr.get("returned") == 39 and sorted(apr.get("keys") or []) == sorted(rc["plan"]["full_row"])
          and all((r.get("applied") or {}).get("part") == "full_row" for r in rc["records"]
                  if r["i"] in set(apr.get("keys") or [])) and "e(expect) as (values (39))" in rc["rollback_full_row"],
          "the 39 full-row rows are marked applied and the rollback names them")
    import hashlib  # noqa: E402
    mig_dir = os.path.join(ROOT, "kb", "migrations")
    for part, run_ in (("apply_rows", "44261575737"), ("apply_checks", "44259625861")):
        rp = os.path.join(ROOT, "kb", "receipts", "migration_s680_prreq_units_rules_%s_%s.json" % (part, run_))
        if os.path.isfile(rp):
            with open(rp, encoding="utf-8") as fh:
                want = json.load(fh)["sha256"]
            with open(os.path.join(mig_dir, "2026-11-18_s680_prreq_units_rules_%s.sql" % part), "rb") as fh:
                check(hashlib.sha256(fh.read()).hexdigest() == want, "%s is the file migrate run %s applied" % (part, run_))
    # MiraCosta 21976 is live on an older run than its filed record: out of the full-row plan, a load question.
    check(len(rc["plan"]["full_row"]) == 39 and "e(expect) as (values (39))" in rc["apply_full_row"]
          and "e(expect) as (values (39))" in rc["rollback_full_row"]
          and [(h["college"], h["control_number"]) for h in rc.get("held_out") or []] == [("MiraCosta College", "21976")]
          and not any((r["college"], r["control_number"]) == ("MiraCosta College", "21976") for r in rc["records"])
          and "'MiraCosta College', '21976'" not in rc["apply_full_row"],
          "the full-row plan is 39 rows, MiraCosta 21976 held out")
    with open(os.path.join(ROOT, "kb", "program_requirements_college", "miracosta", "records", "21976.json"),
              encoding="utf-8") as fh:
        check("units_rules_" not in fh.read(), "MiraCosta 21976's record file is main's, with no units-rules note")
    for k in ("apply_checks_only", "apply_full_row", "rollback_checks_only", "rollback_full_row"):
        sql = rc[k]
        check("r.checked is not true" in sql and "e(expect) as (values (" in sql and "skipped_checked" in sql
              and "::int::text::json" in sql,
              "%s skips a checked row, lists it, and aborts unless it matches the plan less those rows" % k)

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: program requirements units rules" % (checks[0], checks[0]))
