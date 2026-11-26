#!/usr/bin/env python3
"""S740, lane 1 at San Jose City, after the reconcile's reread: the two records plan s740c4 held, each with its gap named.

Plan s740c4 (kb/_program_piles_s740_sjcc.py) held 32078 and 08859 until the reread of the free reconcile 45840981324
posted their rows: the reconcile reads their course lists (CA 005 and SOLAR 102 for the file's cut-off names), and each
still fails on its units. The reread posted them (kb/receipts/
program_requirement_records_college_reread_san_jose_city_45847599186.json), so each is read here from its committed
record, its notes and today's capture. No record changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below):
  required_list_outside_total (70)  32078 Medical Assisting: Clinical A.S.: the page prints 'Approved Program Electives
        (as needed to reach 60 units)' after 'Total Units 31-32' and counts them as the degree's 2 elective units
        ('Major Requirements 31-32 · General Education Requirements 27 · Approved Program Electives 2 · Total Units
        60'). The record counts the list inside the major; without it the courses add to the printed 31-32.
  total_differs (50)          08859 Construction Technology: Residential Maintenance, Level 2: the page prints 'Required
        15', 'Approved Major Electives 9' and 'Total Units 36' (college-page-read run 45835049303); its own figures add
        to 24. kb/program_total_differs.json lists it, the record reads both figures, and the record rule names the gap.

    python3 kb/_program_piles_s740_sjcc2.py --dry-run
    python3 kb/_program_piles_s740_sjcc2.py --tag s740c5

Guard: tests/program_piles_s740_sjcc2_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "San Jose City College"
SLUG = "san_jose_city"
TAG = "s740c5"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_san_jose_city_2026-11-26_s740c4.json"
RECONCILE = "45840981324"
REREAD = "kb/receipts/program_requirement_records_college_reread_san_jose_city_45847599186.json"
KEYS = ("32078", "08859")
ELECTIVES = "Approved Program Electives (as needed to reach 60 units)"

REVIEWED = {
    "32078": {"gap": "required_list_outside_total", "computed": [33, 34], "stated": [31, 32],
              "words": "The Approved Program Electives block lies outside the 31-32 unit major total",
              "ops": [("drop", ELECTIVES)], "closes": "major"},
    "08859": {"gap": "total_differs", "computed": [24, 24], "stated": [36, 36], "rule": True},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="San Jose City", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
