#!/usr/bin/env python3
"""S748, lane 2's cheap piles at Butte: the one record s742a held, collected with its gap named.

S742's plan (kb/_program_piles_s742_butte.py, s742a) held 14583, Registered Nursing A.S., as read from the
Accelerated Track's page. S741 pinned it to its own page (site_pages, node 28324); S742's free capture 45999110725
bound the pin at coverage 1.0, paid read 46012628995 read the page ('AS Degree in Registered Nursing'), and the reread
(force 46012628995) posted that record, whose committed receipt
(kb/receipts/program_requirement_records_college_reread_butte_46013543943.json) posts the row at that run. The record
is the program's own now, and no other record was read from its page. No catalog read, no reconcile, no record
changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  noted_section_cut_off (20)  14583  Its note: 'The catalog text appears cut off after the second program learning
        outcome (it ends mid-sentence without a period); the nursing course requirements table, unit totals, and any
        further outcomes are not in the provided text.' The capture's text of the page is 3,285 characters
        (sources.json): the application prerequisites and two outcomes. The record holds the prerequisites alone, as
        two required lists with no units, states no total and adds to nothing, which is the kind's own shape (S727's
        cut_short: a record that states no total). The record rule holds it out of no_units_read by name
        (kb/_program_named_gaps.py HELD_INCOMPLETE, S680's second reader), so no rule names another kind.

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
COLLEGE = "Butte College"
SLUG = "butte"
TAG = "s748a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s742_butte_2026-11-27_s742a.json"
KEYS = ("14583",)
RUN = "46012628995"
CAPTURE = "45999110725"

REVIEWED = {
    "14583": {"gap": "noted_section_cut_off", "computed": [0, 0], "stated": None, "shape": ["cut"],
              "words": "The catalog text appears cut off after the second program learning outcome"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B10.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Butte", prior=B10.LiveRead(COLLEGE, SLUG), keys=KEYS,
             reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)
