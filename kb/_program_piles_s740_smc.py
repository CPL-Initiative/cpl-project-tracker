#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Santa Monica: the three records s720s held, one collected under the units within-range kind.

S720's plan (kb/_program_piles_s720_smc.py, s720s) collected 20 of the census's wording-rule records and held three.
41797 held because its lists add to 14-15 under a printed 13-15: catalog_figures_differ needs the lists past the total
at both ends, and no note quotes a second total. That is a units sum inside its printed range, the shape
units_within_printed_range names (kb/_program_named_gaps.py, score 50; the shared code and its statewide self-recall:
kb/_program_piles_s740.py). The three are read again here, by key, from the committed records. No catalog read, no
reconcile, no record changed.

COLLECTED WITH A NAMED GAP (1, REVIEWED below), units_within_printed_range (50):
  41797  QuickBooks Virtual Enterprise certificate: Accounting at 5 or 6, Excel's 3 and Other Specialty's 6 add to
         14-15 under a printed 13-15. No note of the record names the difference, so the words filed are the kind's
         own, from the record's figures. Its PDF page was also read for three other certificates; its heading carries
         its own title and none of theirs does (own_heading).

HELD (2), s720s's reasons, read from its module:
  21026  its notes quote only the printed 26.5, so no kind's sentence holds on its own words; it is also on no
         proved live run, and its page was read for five other records.
  43767  its Barbering heading is inferred, on a page the read did not hold, and its page was read for other
         records: whether it read its own section is a page read.

    python3 kb/_program_piles_s740_smc.py --dry-run
    python3 kb/_program_piles_s740_smc.py --tag s740f

Guard: tests/program_piles_s740_smc_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s720_smc as S720  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
COLLEGE = "Santa Monica College"
SLUG = "santa_monica"
TAG = "s740f"
HELD_BY = "kb/receipts/program_requirement_records_piles_smc_2026-11-24_s720s.json"
KEYS = ("21026", "41797", "43767")

REVIEWED = {
    "41797": {"gap": B7.WITHIN, "words_from": "figures", "shape": ["within"], "computed": [14, 15],
              "stated": [13, 15], "own_heading": "Quickbooks Virtual Enterprise, Certificate of Achievement"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({cn: S720.HAND[cn] for cn in ("21026", "43767")})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Santa Monica", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
