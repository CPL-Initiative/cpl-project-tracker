#!/usr/bin/env python3
"""S740, lane 1 (the census's reconcile_steps lever) at San Jose City: 15 records, 9 passed by the reconcile, 4 collected
with a named gap, 2 held for the reconcile's reread.

The census on main (kb/status/harvest_gap_census.json, written 2026-11-26 12:06Z) lists 15 San Jose City College records
under the reconcile_steps lever. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is
collected with its gap named and a lower score, never held, unless the record is not the program's own.

THE RECONCILE FIRST. The college's reconcile entry (kb/program_requirements_reconcile.json, S740) reads eleven courses
the state's file lists under a cut-off subject name or number as the file's rows, and prices BIOL 020 at the 4 units
the catalog prints for it (college-page-read run 45835049303). The free reconcile 45840981324 rescored the filed records
on the branch: nine of the lever's fifteen pass (06185, 06202, 18921, 22220, 22237, 32214, 38113, 38498, 39391), and
its reread posts them. They are no keys here.

COLLECTED WITH A NAMED GAP (4, REVIEWED below), from the committed records, their notes and today's capture:
  figure_within_variable_units (60)  22241 Alcohol & Drug Studies certificate: the one list prints 'Total Units 41', and
        ADS 138 Work Experience prints 1-6 units; the page does not say how many it takes. At 4 the courses add to 41.
  noted_unit_floor (70)       33857 Dance A.A.: THEAT 033 prints 1-3 units and 'must be completed for 3 units for this
        degree'; at 3 the courses add to the printed 23.
  lists_not_closed (30)       30403 Medical Assisting: Administrative A.S.: 'Approved Program Electives (as needed to
        reach 60 units)' prints no figure of its own. 37604 Spanish A.A.-T: how many List A courses a student takes
        depends on which option the student's placement gives ('Complete One Course (or Complete Two or Three Courses
        based on which option is used)').

HELD (2), each until the reread of the reconcile posts its row, then a named gap (the plan after that reread):
  32078  Medical Assisting: Clinical A.S.: the reconcile reads its course list (CA 005). Its record counts the Approved
         Program Electives both as a list of the major and as the degree's 2 elective units; the page prints 'Major
         Requirements 31-32' without them. required_list_outside_total.
  08859  Construction Technology: Residential Maintenance, Level 2: the reconcile reads its course list (SOLAR 102). The
         page prints 'Required 15', 'Approved Major Electives 9' and 'Total Units 36' (the same read): total_differs,
         once kb/program_total_differs.json lists it.

    python3 kb/_program_piles_s740_sjcc.py --dry-run
    python3 kb/_program_piles_s740_sjcc.py --tag s740c4

Guard: tests/program_piles_s740_sjcc_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "San Jose City College"
SLUG = "san_jose_city"
TAG = "s740c4"
HELD_BY = "kb/status/harvest_gap_census.json (reconcile_steps at San Jose City College, written 2026-11-26 12:06Z)"
READ = "college-page-read run 45835049303"
RECONCILE = "45840981324"
PASSED_BY_RECONCILE = ("06185", "06202", "18921", "22220", "22237", "32214", "38113", "38498", "39391")
LEVER = ("06185", "06202", "08859", "18921", "22220", "22237", "22241", "30403", "32078", "32214", "33857", "37604",
         "38113", "38498", "39391")
KEYS = tuple(cn for cn in LEVER if cn not in PASSED_BY_RECONCILE)
ELECTIVES = "Approved Program Electives (as needed to reach 60 units)"
LIST_A = "List A: Complete One Course (or Complete Two or Three Courses based on which option is used)"


def variable_course(filed: dict, e: dict) -> bool:
    """figure_within_variable_units, where one figure is printed over the program's one list: the named course
    (e["variable"]) prints a range of units, every other course a fixed figure, and the printed total falls strictly
    inside the record's sum."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    rows = B.course_rows(filed, e["variable"])
    if len(rows) != 1 or comp is None or st is None:
        return False
    lo, hi = B.S._num(rows[0].get("units")), B.S._num(rows[0].get("units_max"))
    return lo is not None and hi is not None and lo < hi \
        and comp[0] + NG.FIG_EPS < st[0] and st[1] + NG.FIG_EPS < comp[1]


REVIEWED = {
    "22241": {"gap": "figure_within_variable_units", "computed": [38, 43], "stated": [41, 41],
              "words": "Course units sum to 38-43 with ADS 138 at 1-6 units; the catalog states Total Units 41",
              "ops": [("units", "ADS 138", 4)], "shape": ["variable_course"], "variable": "ADS 138"},
    "33857": {"gap": "noted_unit_floor", "computed": [21, 23], "stated": [23, 23],
              "words": "THEAT 033 is printed as 1-3 units, but the catalog states it must be completed for 3 units for "
                       "this degree",
              "ops": [("units", "THEAT 033", 3)]},
    "30403": {"gap": "lists_not_closed", "computed": [33, 34], "stated": [33, 34],
              "words": "Approved Program Electives are taken 'as needed to reach 60 units'; no unit minimum printed",
              "shape": ["open"], "open": ELECTIVES},
    "37604": {"gap": "lists_not_closed", "computed": [13, 31], "stated": [19, 25],
              "words": "The List A course count depends on the option",
              "shape": ["depends"], "depends": LIST_A},
}
# ADS 138 and THEAT 033 are catalog additions (the state's file does not list them), so today's capture, which looks
# for listed courses, names neither: the two entries carry no "courses" claim, and each stands on its record's own row.
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "32078":("held: until the reread of the reconcile posts its row: the reconcile reads its course list (CA 005 for "
              "the file's ComputerAppl). Its record counts the Approved Program Electives both as a list of the major "
              "and as the degree's 2 elective units, and the page prints 'Major Requirements 31-32' without them: "
              "required_list_outside_total, in the plan after that reread"),
    "08859": ("held: until the reread of the reconcile posts its row: the reconcile reads its course list (SOLAR 102 "
              "for the file's SolarRenewab). The page prints 'Required 15', 'Approved Major Electives 9' and 'Total "
              "Units 36' (" + READ + "): total_differs, once kb/program_total_differs.json lists it, in the plan "
              "after that reread"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="San Jose City", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"variable_course": variable_course})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
