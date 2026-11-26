#!/usr/bin/env python3
"""S740, lane 1 (reads), Copper Mountain after the reissue's read: the seven records read 45855512160 left failing, 1 collected with a named gap and 6 held.

Plan s740r3 (kb/_program_piles_s740_copper_mountain.py) held eight records for a read of the reissued 2026-2027
catalog. Read 45855512160 (only= those eight, on the college's fourteen course_renumbers pairs) filed them again:
Liberal Arts: Social and Behavioral Sciences 18519 passes, and the other seven place every listed course and read
unequal. They are read again here from the committed records and their notes. Sam's ruling, as
kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and a lower score on
the 0-100 bar, never held, unless the record is not the program's own; and a named gap must be true for its record.
No catalog read, no reconcile, no record changed, no new kind. The live runs are read by the shared module's
LiveRuns: reread 45855512160's receipt posts every key at that run.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  prerequisites_counted (70)  16657 Registered Nursing A.S.: 'Total Units for the Major 37' is the nursing courses
        alone (N 010 through N 045), and the record also counts the two lists the page heads 'to be completed PRIOR
        to applying to RN program' and 'must be completed before admission to RN program' (its own note); without
        them the courses add to the printed 37.

HELD (6), each reason in HAND:
  14737, 20094  Vocational Nursing A.S. and certificate: the courses add to 54.6 against the printed 'Total Units for
         the Major 56', and no reading closes it; this read's notes quote no second figure. total_differs is true for
         them and is filed only by its own procedure (kb/program_total_differs.json).
  14751  Fire Technology A.S.: the major adds to 42-48 against the printed 42 (EMT 084 printed '3-9'), and the degree
         to 63-69 against the printed 60; two figures on one row, and no one reading closes both.
  43854  History A.A.: the major adds to its printed 24, and the degree's 58-67 holds the printed 60 inside it: the
         units within-range kind (units_within_printed_range), filed by key once that kind is on main.
  45594  Elementary Teacher Education A.A.-T: the lists add to 36-49 against the printed 32-49; List C prints '3-12'
         beside 'Up to 12 additional units', and no reading its note names gives 32.
  14710  General Business A.S.: the restricted electives' figure depends on the work experience units taken, and the
         concentrations print totals their courses do not add to; no one kind is true for the row.

    python3 kb/_program_piles_s740_copper_mountain_read.py --dry-run
    python3 kb/_program_piles_s740_copper_mountain_read.py --tag s740r4

Guard: tests/program_piles_s740_copper_mountain_read_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Copper Mountain College"
SLUG = "copper_mountain"
TAG = "s740r4"
READ = "45855512160"
HELD_BY = ("kb/receipts/program_requirement_records_piles_s739_copper_mountain_2026-11-26_s740r3.json (its holds, read "
           "again by read 45855512160)")
PASSED_BY_THE_READ = ("18519",)
KEYS = ("14710", "14737", "14751", "16657", "20094", "43854", "45594")

_PRIOR = "RN Program electives to be completed PRIOR to applying to RN program"
_BEFORE = "The following must be completed before admission to RN program"
REVIEWED = {
    "16657": {"gap": "prerequisites_counted", "computed": [69, 69], "stated": [37, 37],
              "words": "'Total Units for the Major 37' equals the sum of the nursing courses only (N 010 through N 045)",
              "ops": [("drop", _PRIOR), ("drop", _BEFORE)]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
_VN = ("held: the courses add to 54.6 against the printed 'Total Units for the Major 56', and no reading closes it; "
       "this read's notes quote no second figure. total_differs is true for it and is filed only by its own "
       "procedure (kb/program_total_differs.json)")
HAND.update({
    "14737": _VN,
    "20094": _VN,
    "14751": ("held: the major adds to 42-48 against the printed 42 (EMT 084 printed '3-9'), and the degree to 63-69 "
              "against the printed 60; two figures on one row, and no one reading closes both"),
    "43854": ("held: the major adds to its printed 24, and the degree's 58-67 holds the printed 60 inside it, matching "
              "neither end: the units within-range kind, units_within_printed_range, filed by key once that kind is "
              "on main (d-within-range-sums-hold-for-units-kind-s739)"),
    "45594": ("held: the lists add to 36-49 against the printed 32-49; List C prints '3-12' beside 'Up to 12 "
              "additional units', and no reading its note names gives 32"),
    "14710": ("held: the restricted electives' figure depends on the work experience units taken, and the "
              "concentrations print totals their courses do not add to; no one kind is true for the row: a person"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Copper Mountain", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
