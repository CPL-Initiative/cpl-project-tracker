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
j = U.judge(f, {})
check(j["rule"] == "A6" and j["arith"]["computed"] == [9.0, 9.0], "A6 drops the summed figure and lands at 9")
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

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: program requirements units rules" % (checks[0], checks[0]))
