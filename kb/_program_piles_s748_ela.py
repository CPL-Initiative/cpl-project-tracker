#!/usr/bin/env python3
"""S748, lane 2's cheap piles at East Los Angeles: two records s742b held, one collected with a named gap.

S742's plan (kb/_program_piles_s742_ela.py, s742b) held 31017, 37510 and 41231; 37510 passes since its reread and is
no key. Free page read 46120012715 (kb/college_reads/s748_piles_east_los_angeles_environmental.json and
..._kinesiology.json, the catalog PDF's pp.91-93 and 239-241 whole) prints both sections line for line; the lines
are committed in the plan files under the run. No catalog read by a model, no reconcile, no record changed, no new
kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  total_differs (50)  41231  Environmental Science A.S.-T (Academic Plan E041231H). PDF p.92 prints 'CHOOSE OPTION 1
        OR OPTION 2 AND ALL COURSES LISTED BELOW 41-45' over rows whose printed units add to 39-45: the option's 15,
        ENV SCI 001 (3), a geology choice (4 or 5), a statistics choice (3 or 4), 'MATH 261 Calculus I 5' OR 'MATH
        261S Calculus I With Support 3', ECON C2001 (3) and a physics pair (8 or 10). The low end the page prints
        is what the rows add to with MATH 261 at 5; with the 3 units it prints beside MATH 261S they add to 39. The
        record reads every row and the total exactly, so the record rule names the gap from
        kb/program_total_differs.json. S720 held it as 'a sequence read one course short: a reread'; the page read
        shows the read is whole. Its section_heading is its own plan line, '(Academic Plan E041231H)', and no other
        record was read from its page.

HELD (1), its reason in HAND:
  31017  Kinesiology A.A.-T: no filed kind is true of a sum on both sides of its printed total (54-67 around 60).
         Its lever is a reading: the movement list at its printed '(minimum 3 units)' (kb/program_requirements_
         reconcile.json, East Los Angeles's list_minimum_units step, S748; a second reader, then a free reconcile).

    python3 kb/_program_piles_s748b.py --dry-run     # the batch this pile is in

Guard: tests/program_piles_s748b_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s748 as B10  # noqa: E402

B, NG = B10.B, B10.NG
COLLEGE = "East Los Angeles College"
SLUG = "east_los_angeles"
TAG = "s748b"
HELD_BY = "kb/receipts/program_requirement_records_piles_s742_east_los_angeles_2026-11-27_s742b.json"
KEYS = ("31017", "41231")
PAGE_READ = "46120012715"
PLAN = "kb/college_reads/s748_piles_east_los_angeles_environmental.json"
RUN = "43357061643"

REVIEWED = {
    "41231": {"gap": "total_differs", "computed": [39, 45], "stated": [41, 45], "rule": True,
              "page": "PDF pp.92-93: 'CHOOSE OPTION 1 OR OPTION 2 AND ALL COURSES LISTED BELOW 41-45'; 'OPTION 1' "
                      "BIOLOGY 006 5, BIOLOGY 007 5, CHEM 101 5; 'OR · OPTION 2' BIOLOGY 006 5, CHEM 101 5, CHEM 102 "
                      "5; 'Subtotal 15'; 'AND ALL COURSES LISTED BELOW' ENV SCI 001 3; GEOLOGY 001 3 AND GEOLOGY "
                      "006 1, OR GEOLOGY 004 4, OR GEOG 001 3 AND GEOG 015 2; BUS 015 3 OR ECON 020 3 OR PSYCH 091 4 "
                      "OR STAT C1000 4 OR STAT C1000E 4; 'MATH 261* Calculus I 5', 'OR', 'MATH 261S Calculus I With "
                      "Support 3'; ECON C2001 3; PHYSICS 006 4 AND PHYSICS 007 4, OR PHYSICS 101 5 AND PHYSICS 102 "
                      "5; 'Cal-GETC GE Pattern'; 'Total 62-66'"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "31017": ("held: posted by S742's reread (force 45176404274) and still failing: its major passes and the degree "
              "reads 54-67 on both sides of the printed 60, with electives that fill it; no filed kind's sentence is "
              "true of such a sum. Its lever is a reading, the movement list at its printed '(minimum 3 units)' "
              "(college page read " + PAGE_READ + ", PDF p.240): East Los Angeles's list_minimum_units reconcile "
              "step, S748, which needs a second reader and then a free reconcile and a reread"),
})

W = B10.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="East Los Angeles", prior=B10.LiveRead(COLLEGE, SLUG),
             keys=KEYS, reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)
