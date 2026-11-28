#!/usr/bin/env python3
"""S748, lane 2's cheap piles, batch s748b: two records at two colleges, each collected with its gap named.

One plan over two piles (kb/_program_piles_s748.py Batch, S742's: each college's own self-recall and receipt, one
pre-read, one guarded UPDATE and one rollback over the two rows). Each row was held by S741's or S742's plan and is
read again by key; its live run is posted by the committed receipts and the conductor's live reads, and its gap
stands on a free page read's own lines, committed in the read's plan file under its run:

  Orange Coast 03993       figure_within_variable_units (60)  kb/_program_piles_s748_orangecoast.py
  East Los Angeles 41231   total_differs (50)                 kb/_program_piles_s748_ela.py

No catalog read by a model, no reconcile, no record changed, no new kind.

The other holds of S720's and S721's at the seven colleges of this lane, each with its reason in its pile's HAND or
below (no pile: nothing to plan):
  Orange Coast 08663, 08670, 36032, 42331, 43100; East Los Angeles 31017: their piles.
  Santa Barbara City 30746 (s748a's pile) and 05934 (d-sbcc-05934-keeps-hold-s727).
  Fullerton 18166 (coverage and invented fail; its Category C list is cut off), 18749 (THEA 231 F) and 36863 (PE 108
    F); City College of San Francisco 32079 (MATH 115) and 41315 (PSYC 23): coverage fails on a course the state's
    file lists and the page does not print. A plan changes no record, and no committed reading files a missing
    course's reason: COVERAGE_LEVER below.
  City College of San Francisco 19037 (its note says its page reads as 17954's section) and 17954 (no live row).
  College of the Sequoias 06770 (two concentration lists read as alternatives, beside 13 units the page lets count
    twice) and 45030 (the Cal-GETC certificate, the Cal-GETC lane's).

    python3 kb/_program_piles_s748b.py --dry-run
    python3 kb/_program_piles_s748b.py

Guard: tests/program_piles_s748b_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s748 as B10  # noqa: E402
import _program_piles_s748_ela as ELA  # noqa: E402
import _program_piles_s748_orangecoast as OCC  # noqa: E402

TAG = "s748b"
BATCH = B10.Batch(tag=TAG, piles=[OCC.W, ELA.W])
# Counted over every filed record on 2026-11-28 (tests/program_piles_s748b_test.py counts it again): a record that
# fails coverage on unexplained listed courses alone, where the capture finds none of those courses on the page.
COVERAGE_LEVER = ("a reading that files 'not in the text' for a listed course the capture does not find on the page "
                  "(shared reader code: its self-recall and a second reader first), then a free reconcile and a reread")


if __name__ == "__main__":
    sys.exit(BATCH.main(doc=__doc__))
