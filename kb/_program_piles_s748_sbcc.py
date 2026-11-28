#!/usr/bin/env python3
"""S748, lane 2's cheap piles at Santa Barbara City: the two records s739d held, one collected with a named gap.

S739's plan (kb/_program_piles_s739_sbcc.py, s739d) held 30746 and 43553. S742's free reconcile 46010148668 rescored
43553 to its page's own figures, and the reread (force 46010148668) posted it; its committed receipt
(kb/receipts/program_requirement_records_college_reread_santa_barbara_city_46015714377.json) posts the row at that
run. S740's free page read 45837455365 (kb/college_reads/s740_piles_sbcc_figures.json, each page as the capture reads
it) prints both pages line for line. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  total_differs (50)  43553  Law, Public Policy, and Society A.A.-T. The page's Requirements tab prints 'Required
        Core 26-29 units', 'List A - Complete two courses from two of the areas listed below: (NOTE: courses must
        have not been taken in the Required Core) 6-8 units' and 'Total Units 35.00-41.00': its two figures add to
        32-37 under the 35-41 it prints. The record reads both figures exactly (32-37 against 35-41), so the record
        rule names the gap from kb/program_total_differs.json, where the program is listed with the page read's run.
        S739 and S740 held it because the record then added to 30-37, not the page's own 32-37; the reconcile's
        rescore reads each list at its printed figure. No other record was read from its page.

HELD (1), its reason in HAND:
  30746  Sociology A.A.-T: not collectable, coverage fails. The state's list names PSY 200, which the record does
         not place and no note explains; page read 45837455365 shows the page prints no PSY 200 in any list. The
         record's missing_explained names ANTH 110 alone, and a plan changes no record: a reread or a reconcile
         step that files the missing course's reason is its lever.

    python3 kb/_program_piles_s748a.py --dry-run     # the batch this pile is in

Guard: tests/program_piles_s748a_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s748 as B10  # noqa: E402

B, NG = B10.B, B10.NG
COLLEGE = "Santa Barbara City College"
SLUG = "santa_barbara_city"
TAG = "s748a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_santa_barbara_city_2026-11-26_s739d.json"
KEYS = ("30746", "43553")
PAGE_READ = "45837455365"
PLAN = "kb/college_reads/s740_piles_sbcc_figures.json"
RUN = "46010148668"

REVIEWED = {
    "43553": {"gap": "total_differs", "computed": [32, 37], "stated": [35, 41], "rule": True,
              "page": "the Requirements tab, as the capture reads it: 'Required Core 26-29 units'; 'List A - Complete "
                      "two courses from two of the areas listed below: (NOTE: courses must have not been taken in "
                      "the Required Core) 6-8 units'; 'Total Units 35.00-41.00'; one course with units beside it, "
                      "'ECON C2001 Principles of Microeconomics 3-4'"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "30746": ("held: not collectable: coverage fails. The state's list names PSY 200, which the record does not place "
              "and no note explains (its missing_explained names ANTH 110 alone); college page read " + PAGE_READ
              + " shows the page prints no PSY 200 in any list. A plan changes no record: a reread or a reconcile "
              "step that files the missing course's reason is its lever"),
})

W = B10.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Santa Barbara City", prior=B10.LiveRead(COLLEGE, SLUG),
             keys=KEYS, reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)
