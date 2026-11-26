#!/usr/bin/env python3
"""S740, lane 1 (the census's reconcile_steps lever) at San Bernardino Valley: 15 records, 2 passed by the reconcile,
6 collected with a named gap, 7 held.

The census on main (kb/status/harvest_gap_census.json, written 2026-11-26 12:06Z) lists 15 San Bernardino Valley
College records under the reconcile_steps lever. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.

THE RECONCILE FIRST. The college's reconcile entry (kb/program_requirements_reconcile.json, S740) reads CDEV 160 and
SOCI 110, 110H, 130, 141 and 141H as the file's CD and SOC rows. The free reconcile 45844530701 rescored the filed records
on the branch: History A.A.-T 40833 and Child and Adolescent Development A.A.-T 41756 pass, and its reread posts them.
They are no keys here.

COLLECTED WITH A NAMED GAP (6, REVIEWED below), from the committed records, their notes and today's capture; four of the
pages were read free, as the capture reads them (college-page-read run 45835049303,
kb/college_reads/s740_reconcile_san_bernardino_valley_pages.json):
  total_differs (50)          32309 Political Science A.A.-T: the page prints 'Major Total Units 18-19' over four required
        courses (12), 'List A - Two courses' (6-7) and 'List B - One course' (3), which add to 21-22. 35802 Music A.A.-T:
        'Major Total 21-22' over required courses (12), the Applied Music pair (1), 'Select four units' (4) and 'List A -
        (3-4 units)', which add to 20-21. Each is listed with both figures in kb/program_total_differs.json, read from
        the page itself, and the record reads both exactly: the record rule names the gap.
  waived_course_counted (50)  22771 Automatic and Manual Transmission and 22776 Automotive Technician certificates: the
        page prints 'Complete the following or place into a transfer-level MATH course' over TECALC 087 at 0-4 units, the
        record counts the course, and its units match the top of the printed range (24 against 20-24, 44 against 40-44).
  noted_figures_differ (40)   22820 Graphic Design certificate: 'Total Units 43' against required courses that add to 31.
        12197 Child Development - Master Teacher certificate: the description's 37 units and 16 of general education
        against the course list's 'Total Units 49'. Each note quotes both figures.

HELD (7):
  04873  Audio Production A.A.: the page prints one course under 'Two courses from the following' and two under 'Four
         courses from the following' (the same read), so no reading adds its lists to the printed 24-25. No filed kind
         names a list shorter than its count; a new kind is shared code, which S740 does not add.
  04894  Music A.A.: today's scorer passes its own arithmetic without the state's list and fails with it. 'MUS 141X2 &
         MUS 241X2' print one figure for the pair, the reading left MUS 241X2 without units, and the state's file
         prices it at 0.5 (26.5-36.5 against 27-37). A record today's scorer passes is never gap-filed.
  17829  Environmental Science A.S.: two gaps on one row, and no kind's check closes either: the printed major total
         50-63 against lists that add to 50-60, and a degree total over a general education pattern with no units.
  22784  Automotive Wheel Alignment and Brakes certificate: the same waiver as 22771, and its record's run 45355976381
         is not shown to be its live row's by the committed receipts (its load held several runs).
  22821  Pharmacy Technology certificate: not the program's own page. The record was read from the department page; the
         certificate's own page prints seven required courses and 'Total Units 20' (the same read). A site_pages pin
         and a paid read of 22821 are its lever.
  35833  Geographic Information Systems certificate: its 19-22 sits inside the printed 18.5-22
         (d-within-range-sums-hold-for-units-kind-s739).
  39483  Nutrition and Dietetics A.S.-T: the page prints the two biology sequences inside 'List A - One to two courses'
         (the same read), and the record holds them as lists of their own. The reading is the reader's, and no note
         quotes two figures that disagree: a paid reread.

    python3 kb/_program_piles_s740_sbvc.py --dry-run
    python3 kb/_program_piles_s740_sbvc.py --tag s740c3

Guard: tests/program_piles_s740_sbvc_test.py.
"""
from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s730_saddleback as SD  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "San Bernardino Valley College"
SLUG = "san_bernardino_valley"
TAG = "s740c3"
HELD_BY = ("kb/status/harvest_gap_census.json (reconcile_steps at San Bernardino Valley College, written 2026-11-26 "
           "12:06Z)")
READ = "college-page-read run 45835049303"
RECONCILE = "45844530701"
PASSED_BY_RECONCILE = ("40833", "41756")
LEVER = ("04873", "04894", "12197", "17829", "22771", "22776", "22784", "22820", "22821", "32309", "35802", "35833",
         "39483", "40833", "41756")
KEYS = tuple(cn for cn in LEVER if cn not in PASSED_BY_RECONCILE)
PLACE_INTO = re.compile(r"\bor\s+place\s+into\b", re.I)


def placement_waiver(filed: dict, e: dict) -> bool:
    """waived_course_counted where the page words the waiver as a placement: the named block's own heading says 'or
    place into', it holds the one course, the record prints the block at 0 to the course's units, and read at 0 to
    its units today's scorer gives the printed range (kb/_program_piles_s730_saddleback.py waiver_closes)."""
    bs = B.blocks(filed, e["block"])
    if len(bs) != 1 or not PLACE_INTO.search(str(bs[0].get("name") or "")):
        return False
    courses = bs[0].get("courses") or []
    w = e["waived"]
    if len(courses) != 1 or B.S.norm_code(courses[0].get("code")) != B.S.norm_code(w["code"]):
        return False
    if B.pair(bs[0].get("stated")) != [0.0, float(w["units"])]:
        return False
    return SD.waiver_closes(filed, e)


_MATH = "Complete the following or place into a transfer-level MATH course:"
_WAIVED = {"gap": "waived_course_counted", "waived": {"code": "TECALC 087", "units": 4}, "block": _MATH,
           "shape": ["placement_waiver"], "courses": ["TECALC87"]}
REVIEWED = {
    "32309": {"gap": "total_differs", "computed": [21, 22], "stated": [18, 19], "rule": True},
    "35802": {"gap": "total_differs", "computed": [20, 21], "stated": [21, 22], "rule": True},
    "22771": dict(_WAIVED, computed=[24, 24], stated=[20, 24],
                  words="TECALC 087 is required unless the student places into a transfer-level MATH course; the block "
                        "prints 0-4 units, which accounts for the 20-24 total range"),
    "22776": dict(_WAIVED, computed=[44, 44], stated=[40, 44],
                  words="TECALC 087 is required unless the student places into a transfer-level MATH course; block "
                        "recorded as 'all' with the printed 0-4 units"),
    "22820": {"gap": "noted_figures_differ", "computed": [31, 31], "stated": [43, 43],
              "words": "The printed Total Units is 43, but the required courses listed sum to 31 units",
              "shape": ["note_quotes"], "quotes": {"stated": "Total Units is 43", "computed": "sum to 31 units"}},
    "12197": {"gap": "noted_figures_differ", "computed": [53, 53], "stated": [49, 49],
              "words": "37 + 16 = 53 does not equal the printed 49",
              "shape": ["note_quotes"], "quotes": {"stated": "the printed 49", "computed": "= 53 does not equal"}},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "04873": ("held: the page prints one course under 'Two courses from the following' and two under 'Four courses "
              "from the following' (" + READ + "), so no reading adds its lists to the printed 24-25; no filed kind "
              "names a list shorter than its count, and a new kind is shared code, which S740 does not add"),
    "04894": ("held: today's scorer passes its own arithmetic without the state's list and fails with it: 'MUS 141X2 "
              "& MUS 241X2' print one figure for the pair, the reading left MUS 241X2 without units, and the state's "
              "file prices it at 0.5 (26.5-36.5 against 27-37); a record today's scorer passes is never gap-filed"),
    "17829": ("held: two gaps on one row and no kind's check closes either: the printed major total 50-63 against "
              "lists that add to 50-60, and a degree total over a general education pattern with no units"),
    "22784": ("held: the same waiver as 22771 (waived_course_counted), and its record's run 45355976381 is not shown "
              "to be its live row's by the committed receipts (its load held several runs)"),
    "22821": ("held: not the program's own page: read from the Pharmacy Technology department page; the certificate's "
              "own page prints seven required courses and 'Total Units 20' (" + READ + "): a site_pages pin and a "
              "paid read of 22821 are its lever"),
    "35833": ("held: its 19-22 sits inside the printed 18.5-22 (d-within-range-sums-hold-for-units-kind-s739): the "
              "label would overstate"),
    "39483": ("held: the reader's own reading: the page prints the two biology sequences inside 'List A - One to two "
              "courses' (" + READ + ") and the record holds them as lists of their own; no note quotes two figures "
              "that disagree: a paid reread"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="San Bernardino Valley", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"placement_waiver": placement_waiver})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
