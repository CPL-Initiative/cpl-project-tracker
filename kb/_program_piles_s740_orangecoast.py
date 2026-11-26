#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Orange Coast: 41373, rolled back from s739j, collected under the units within-range kind.

S739's plan (kb/_program_piles_s739_orangecoast.py, s739j) filed 41373 as noted_figures_differ, and its row was
rolled back at 11:10Z on 2026-11-26 (kb/migrations/2026-11-26_s739j_41373_rollback.sql): its 29 sits inside the
printed 28-29, so no two figures disagree (d-within-range-sums-hold-for-units-kind-s739). The kind that is true of it
is units_within_printed_range (kb/_program_named_gaps.py, score 50; the shared code and its statewide self-recall:
kb/_program_piles_s740.py). The record is read again here, by key, from the committed record, which the rollback put
back at s739j's before-image. No catalog read, no reconcile, no record changed.

COLLECTED WITH A NAMED GAP (1, REVIEWED below), units_within_printed_range (50):
  41373  Business Administration 2.0 A.S.-T: eight required courses add to 29 under a printed 'Total Major Units
         28-29' (its note quotes both). Its page was also read for 32086 (Business Administration); its heading goes
         beyond that title (own_heading, as s739j read it).

Orange Coast's other holds (s739j's 13, and 08626 on the wrong page) are not this plan's keys.

    python3 kb/_program_piles_s740_orangecoast.py --dry-run
    python3 kb/_program_piles_s740_orangecoast.py --tag s740b

Guard: tests/program_piles_s740_orangecoast_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
COLLEGE = "Orange Coast College"
SLUG = "orange_coast"
TAG = "s740b"
# 41373 is s739j's rolled-back row: its receipt names it as a row, and the rollback's SQL file took it back.
HELD_BY = "kb/migrations/2026-11-26_s739j_41373_rollback.sql"
KEYS = ("41373",)

REVIEWED = {
    "41373": {"gap": B7.WITHIN, "words_from": "figures", "shape": ["within"], "computed": [29, 29],
              "stated": [28, 29],
              "words": "Catalog prints 'Total Major Units 28-29', but the listed required courses sum to 29 units",
              "own_heading": "Business Administration 2.0, Associate in Science Degree for Transfer (AS-T)"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Orange Coast", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
