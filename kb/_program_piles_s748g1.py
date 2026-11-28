#!/usr/bin/env python3
"""S748, worker gaps, batch s748g1: records at Allan Hancock and Mt. San Antonio, each collected with its gap named.

One plan over two piles (kb/_program_piles_s742.py Batch: each college's own self-recall and receipt, one pre-read,
one guarded UPDATE and one rollback over every row). The keys are the filed records the gap census of 2026-11-28
00:44Z (run 46089216929) counts as failing at the two colleges; each row's live run is the run its committed load
or reread receipt posted (kb/_program_piles_s739.py LiveRuns), and the plan's pre-read and guarded UPDATE check the
live row itself.

  Allan Hancock    05874 ge_units_not_read, 19928 lists_past_their_figure, 30934 and 31093 hours_total_differs,
                   12129 and 30363 noted_figures_differ, 40003 units_within_printed_range
                   (kb/_program_piles_s748_hancock.py)
  Mt. San Antonio  44520 noted_no_total, 37603 lists_not_closed (kb/_program_piles_s748_mtsac.py)

No catalog read by a model, no reconcile, no record changed, no new kind, no new matcher.

    python3 kb/_program_piles_s748g1.py --dry-run
    python3 kb/_program_piles_s748g1.py

Guard: tests/program_piles_s748g1_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s748_hancock as HANCOCK  # noqa: E402
import _program_piles_s748_mtsac as MTSAC  # noqa: E402

TAG = "s748g1"
BATCH = B9.Batch(tag=TAG, piles=[HANCOCK.W, MTSAC.W])


if __name__ == "__main__":
    sys.exit(BATCH.main(doc=__doc__))
