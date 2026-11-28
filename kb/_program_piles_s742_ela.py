#!/usr/bin/env python3
"""S742, lane 2's cheap piles at East Los Angeles: the four records s741d held, one collected with a named gap.

S741's plan (kb/_program_piles_s741_ela.py, s741d) held 02456, 31017, 37510 and 41231. Three of them were committed at
the free reconcile 45176404274 while their live rows sat on older runs (f-ela-committed-passes-live-older-s741), so no
plan could name them. S742's keep-better (plan_code_own: a heading that prints the program's own Academic Plan code,
over its own state list) kept the reconcile's ten records, and the conductor's reread (force 45176404274) posted them;
its committed receipt posts each row at that run. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  unit_line_not_read (40)  02456  Medical Assistant A.S. Its note: the Required Core's 48-50 includes 'Completion of
        Intermediate Algebra or its equivalent or higher Math course 3-5', a line with no course code, which the
        record does not hold; its fourteen courses add to 45, and with the line's 3-5 the 45 is the printed 48-50
        (the kind's own check: the record re-added with that line closes at both ends under today's scorer). No
        other record was read from its page; its heading is its own Academic Plan code, E002456C.

HELD (3), each reason in HAND:
  31017  Kinesiology A.A.-T: posted by the reread, and still failing: its major reads 20-27 equal to the printed
         subtotal, and with Cal-GETC's 34 the degree reads 54-67 around the printed 60 with electives that fill it;
         no filed kind's sentence is true of a sum that holds its printed total (s720e's reason: a reread).
  37510  Automotive Fundamentals (noncredit): posted by the reread; it prints no total, no hours and no units, reads
         'unstated' and passes as the live table counts it: no gap.
  41231  Environmental Science A.S.-T: s720e's reason, unchanged (a reread).

    python3 kb/_program_piles_s742_ela.py --dry-run
    python3 kb/_program_piles_s742_ela.py --tag s742b

Guard: tests/program_piles_s742_ela_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s720_ela as S720  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402

B, NG = B9.B, B9.NG
COLLEGE = "East Los Angeles College"
SLUG = "east_los_angeles"
TAG = "s742b"
HELD_BY = "kb/receipts/program_requirement_records_piles_s741_east_los_angeles_2026-11-27_s741d.json"
KEYS = ("02456", "31017", "37510", "41231")
RUN = "45176404274"

REVIEWED = {
    "02456": {"gap": "unit_line_not_read", "computed": [45, 45], "stated": [48, 50], "ops": [("line", 3, 5)],
              "words": "The Required Core (48-50) includes 'Completion of Intermediate Algebra or its equivalent or "
                       "higher Math course 3-5', which has no course code and is not recorded as a course"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "31017": ("held: posted by the reread of the reconcile's records (force " + RUN + ") and still failing: its major "
              "reads 20-27, equal to the printed subtotal, and with Cal-GETC's 34 the degree reads 54-67 around the "
              "printed 60 with electives that fill it; no filed kind's sentence is true of a sum that holds its "
              "printed total. " + S720.HAND["31017"]),
    "37510": ("held: posted by the reread of the reconcile's records (force " + RUN + "); the page prints no total, "
              "no hours and no units, the record reads 'unstated' and passes as the live table counts it: no gap"),
    "41231": S720.HAND["41231"],
})

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="East Los Angeles", prior=B9.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
