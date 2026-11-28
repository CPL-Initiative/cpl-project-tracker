#!/usr/bin/env python3
"""S748, lane 2's cheap piles, batch s748a: two records at two colleges, each collected with its gap named.

One plan over two piles (kb/_program_piles_s748.py Batch, S742's: each college's own self-recall and receipt, one
pre-read, one guarded UPDATE and one rollback over the two rows). These are the gap plans S742's rereads unlocked
(lane NEXT (3)): each row was held by an earlier plan, was read again or rescored on its own page by S742, and is read
here by key; its live run is posted by its reread's committed receipt, and its gap stands on its own note or on a
free page read:

  Butte 14583               noted_section_cut_off (20)  kb/_program_piles_s748_butte.py
  Santa Barbara City 43553  total_differs (50)          kb/_program_piles_s748_sbcc.py

No catalog read by a model, no reconcile, no record changed, no new kind.

HELD, no pile here (a pile that plans no row cannot join a batch): East Los Angeles 31017, Kinesiology A.A.-T, the
third of the lane's three. Its reread (force 45176404274) posted it, still failing: the major reads 20-33 around the
printed subtotal 20-27 and passes ('meets'), and with Cal-GETC's 34 the degree reads 54-67 around the printed 60 with
electives that fill it. No filed kind's sentence is true of it. The scorer's fill reading stands only where the sum
sits at or under the total, its overlap reading only where the low end runs past it, and a sum on both sides of the
total takes neither (S457, Sheet 120 card 1, 'narrow': Sam's). lists_past_their_figure needs a list past its figure
at its least, and the movement list's least, three 1-unit courses, is its printed '(minimum 3 units)'. The page's own
figures do not close it either (college page read 46120012715, PDF pp.240-241): the printed Subtotal 20-27 is the
core's 11, the movement list at 3 to 6 and List A's 6 to 10, and with Cal-GETC's 34 the printed figures give 54-61
around the printed 60. The record stays held, its reason in kb/_program_piles_s748_ela.py's HAND. A reconcile step
that read the movement list at exactly 3 units passed the record only by a ceiling the catalog does not print; its
second reader refused it in S748 (NO GO) and it was removed.

    python3 kb/_program_piles_s748a.py --dry-run
    python3 kb/_program_piles_s748a.py

Guard: tests/program_piles_s748a_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s748 as B10  # noqa: E402
import _program_piles_s748_butte as BUTTE  # noqa: E402
import _program_piles_s748_sbcc as SBCC  # noqa: E402

TAG = "s748a"
BATCH = B10.Batch(tag=TAG, piles=[BUTTE.W, SBCC.W])
# East Los Angeles 31017, the reading its second reader refused (S748, NO GO), kept for the guard alone: the movement
# list at exactly 3 units passes today's scorer short of the printed subtotal's high end, by a ceiling the catalog
# does not print. No reconcile step reads it, and the record stays held.
ELA_31017_REFUSED = [("choose", "Movement-based courses", 3, 3)]


if __name__ == "__main__":
    sys.exit(BATCH.main(doc=__doc__))
