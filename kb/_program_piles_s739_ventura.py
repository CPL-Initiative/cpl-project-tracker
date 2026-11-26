#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Ventura: the 17 records s720t held, seven collected with named gaps.

S720's plan (kb/_program_piles_s720_ventura.py, s720t) collected five of the census's wording-rule records and held
17. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named
and a lower score, never held, unless the record is not the program's own. The 17 are read again here, by key, from
the committed records, their notes and today's capture. Each was read from a catalog page of its own address, which
no other record was read from. No catalog read, no reconcile, no record changed, no new kind.

LIVE RUNS. S720 held 06973 and 32834 because no receipt posted their run: load 39628631068 inserted them over two
runs. Reread 39629266949 kept both at run 39622549965, the later of that load's two runs, so the rows hold it (the
shared module's kept-key rule). 31298 is still on no proved run.

COLLECTED WITH A NAMED GAP (7, REVIEWED below):
  pool_figure_not_read (40)       06973 Music A.A.: 'Required Additional Units 20-22' is printed once over the
        additional courses and Lists A, B and C, which the record adds apart; as one pool at 20-22 the major closes
        at the printed 36-38. S720's own entry, held then for its live run alone.
  lists_not_closed (30)           32834 Geography A.A.-T: List B also takes any course unused from List A, and the
        page prints 'Required Additional Units 9-15' over the two together, so the lists alone add short (16-19
        against 19-21). S720's own entry, held then for its live run alone.
        20599 Criminal Justice certificate: the forensic pair and the 'May Select 3 units' list are, by its notes,
        ways to fill List A's nine additional units, and the record adds them beside it (28 against 21-22); with both
        inside List A it adds to 21, the printed range's low end.
  prerequisites_counted (70)      39961 Veterinary Technology A.S.: the record counts the 17 prerequisite units,
        which the page prints apart from its '52-unit Total Major Units'; without them the major closes at 52. The
        degree's own line (17 + 52 + 24 - 12 = 81) is filed beside it.
  unit_line_not_read (40)         39995 Veterinary Assistant, two gaps on one row, both notes filed: the core's 'One
        course from: VCCCD GE Area 1b, 6 or 7' (3 units) names no course and the record leaves it out, and the lab
        BIOL C1001L is added at the state file's unit beside the 4 units the page prints for the pair. With the line
        and the lab inside the pair's 4 the courses add to the printed 44.5.
  noted_no_total (40)             42967 Heavy Equipment and Industrial Systems and 45427 Small Business Management
        A.S.: each note says the page prints no total for the award and took the plan of study's 'Total Units/Hours'
        for the plan's own sum. For 42967 that figure, 29, is what its courses add to: a wording rule reading it as
        the award's total passes it (S720's reason; the lever, named in the receipt).

HELD (10), each reason in HAND:
  06948, 08253, 35654, 37415, 44994, 44995  the requirements tab is not in the text the reader saw: a reread.
  30587, 32578  today's scorer passes each on its own record: a closed-list rescore, never a gap.
  31298  on no proved live run: load 44545902736 inserted it over three runs and no reread has kept it since.
  45348  a bachelor's whose degree total counts 10 units of upper-division general education that the record's
         blocks and its general education range both leave out; the page names the three courses, so
         unit_line_not_read's sentence is not true of it, and no other kind's is: a new kind with its self-recall,
         or a scorer reading of a bachelor's upper-division general education.

    python3 kb/_program_piles_s739_ventura.py --dry-run
    python3 kb/_program_piles_s739_ventura.py --tag s739n

Guard: tests/program_piles_s739_ventura_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Ventura College"
SLUG = "ventura"
TAG = "s739n"
HELD_BY = "kb/receipts/program_requirement_records_piles_s720_ventura_2026-11-24_s720t.json"
KEYS = ("06948", "06973", "08253", "20599", "30587", "31298", "32578", "32834", "35654", "37415", "39961", "39995",
        "42967", "44994", "44995", "45348", "45427")
_POOL = ["Required Additional Courses",
         "List A: Select 1 course from the following and repeat it for four semesters",
         "List B: Select 4 units from the following (repeated courses are allowed)",
         "List C: Select 2 courses from the following"]
_LIST_B = "List B: Select a minimum of 6 units from the following"
_MAY = "May Select 3 units from the following courses as part of the 9 units additionally required"
_PAIRS = ["Select one of the following: CJ V35 & V35L", "Select one of the following: ANTH V35 & V35L"]

REVIEWED = {
    "06973": {"gap": "pool_figure_not_read", "computed": [34.5, 36.5], "stated": [36, 38],
              "words": "The catalog prints 'Required Additional Units 20-22' covering the Required Additional Courses "
                       "together with Lists A, B and C",
              "also_words": "Degree table: Required Major Units 36-38, VCCCD General Education Units 24",
              "ops": [("pool", _POOL, 20, 22)], "closes": "major"},
    "32834": {"gap": "lists_not_closed", "computed": [16, 19], "stated": [19, 21],
              "words": "List B also accepts 'Any course unused from List A'",
              "also_words": "'Required Additional Units 9-15' is printed for List A and List B combined",
              "shape": ["depends"], "depends": _LIST_B},
    "20599": {"gap": "lists_not_closed", "computed": [28, 28], "stated": [21, 22],
              "words": "The CJ V90/CJ V96 block is optional",
              "also_words": "this pair choice may count as one of the 'Required Additional Courses' selections",
              "ops": [("drop", _MAY), ("drop", _PAIRS[0]), ("drop", _PAIRS[1])], "closes": "passes"},
    "39961": {"gap": "prerequisites_counted", "computed": [70, 70], "stated": [52, 52],
              "words": "Prerequisite courses (17 units) must be completed before application; they are counted "
                       "separately from the 52-unit Total Major Units",
              "also_words": "Degree calculation as printed: Prerequisite 17 + Major 52 + VCCCD GE 24 - Double-Counted "
                            "(12) + Elective 0 = 81",
              "ops": [("drop", "Required Prerequisite Courses")], "closes": "major"},
    "39995": {"gap": "unit_line_not_read", "computed": [42.5, 42.5], "stated": [44.5, 44.5],
              "words": "The Required Core Courses block also includes 'One course from: VCCCD GE Area 1b, 6 or 7' (3 "
                       "units), which is a general education area choice and is not recorded as a course",
              "also_words": "BIOL C1001 & C1001L are printed as one row with 4 units for the pair",
              "ops": [("line", 3), ("units", "BIOL C1001L", 0)]},
    "42967": {"gap": "noted_no_total", "computed": [29, 29], "stated": None,
              "words": "Both plans print 'Total Units/Hours 29', but this is a plan-of-study total rather than a "
                       "stated requirements total, so total_units was left null",
              "shape": ["no_total"],
              "lever": "a wording rule that reads the plan of study's 'Total Units/Hours 29' as the award's total "
                       "passes it at 29 = 29 (S720's reason); a reconcile's rescore drops the gap when it does"},
    "45427": {"gap": "noted_no_total", "computed": [39, 39], "stated": None,
              "words": "No major total or GE unit total is printed in the text",
              "also_words": "The plan prints 'Total Units/Hours 61' for the two-year sequence including GE; it is not "
                            "stated as the award's total",
              "shape": ["no_total"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
_TAB = "held: the requirements tab is not in the text the reader saw (an incomplete read, never a gap): a reread"
_SCORER = "held: today's scorer passes it on its own record: a closed-list rescore, never a gap"
HAND.update({
    "06948": _TAB, "08253": _TAB, "35654": _TAB, "37415": _TAB, "44994": _TAB, "44995": _TAB,
    "30587": _SCORER, "32578": _SCORER,
    "31298": ("held: on no proved live run: no committed receipt posts its committed run (44514835321) to its live "
              "row: load 44545902736 inserted it over three runs, and no reread has kept it since. A file-history "
              "proof of its run, then pair_read_as_alternatives (S720's entry)"),
    "45348": ("held: a bachelor's whose degree total (126-141) counts 10 units of upper-division general education "
              "that the record's blocks and its general education range (34-49) both leave out; the page names the "
              "three courses, so unit_line_not_read's sentence is not true of it, and no other kind's is: a new kind "
              "with its self-recall, or a scorer reading of a bachelor's upper-division general education"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Ventura", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
