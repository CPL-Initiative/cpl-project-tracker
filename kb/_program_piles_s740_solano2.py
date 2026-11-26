#!/usr/bin/env python3
"""S740, lane 1 at Solano, after the reconcile's reread: the one record plan s740c2 held for it, with its gap named.

Plan s740c2 (kb/_program_piles_s740_solano.py) held Social Work and Human Services A.A.-T 42041 until the reread of
the free reconcile 45840125172 posted its row: the reconcile reads its course list (SOCI 002 for the file's SOC 2), and
it still names no total. The reread posted it (kb/receipts/
program_requirement_records_college_reread_solano_community_45851759328.json), so it is read here from its committed
record and the page itself. No record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  total_not_printed (40)  42041: the section prints REQUIRED COURSES and Lists A, B and C, and no 'Required Major Total
        Units' line, which the next section on the page does print (college-page-read run 45835049303, PDF page 303;
        kb/program_total_not_printed.json). The record rule names it.

s740c2's other four holds stand as that plan filed them (30184, 30185, 43134 by the own-page guard; 38591 as not shown
to be the program's own).

    python3 kb/_program_piles_s740_solano2.py --dry-run
    python3 kb/_program_piles_s740_solano2.py --tag s740c6

Guard: tests/program_piles_s740_solano2_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Solano Community College"
SLUG = "solano_community"
TAG = "s740c6"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_solano_community_2026-11-26_s740c2.json"
RECONCILE = "45840125172"
REREAD = "kb/receipts/program_requirement_records_college_reread_solano_community_45851759328.json"
KEYS = ("42041",)

REVIEWED = {
    "42041": {"gap": "total_not_printed", "computed": [28.5, 31.5], "stated": None, "rule": True,
              "own_heading": "Associate in Arts in Social Work and Human Services for Transfer (ADT: A.A.-T)"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Solano", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
