#!/usr/bin/env python3
"""S740, lane 2's cheap piles at College of the Canyons: the one record s739c held, collected under the units within-range kind.

S739's plan (kb/_program_piles_s739_canyons.py, s739c) collected 13 of s727a's 14 holds. 36793 held because its sum
sits inside its printed range and no kind's sentence was true of that
(d-within-range-sums-hold-for-units-kind-s739). The kind is units_within_printed_range (kb/_program_named_gaps.py,
score 50; the shared code and its statewide self-recall: kb/_program_piles_s740.py). The record is read again here,
by key, from the committed record. No catalog read, no reconcile, no record changed.

COLLECTED WITH A NAMED GAP (1, REVIEWED below), units_within_printed_range (50):
  36793  Hospitality Management A.S.-T: HOSP-101's 3, nine units from a list and 'two courses from the following for
         six to ten units' at the 7 to 10 its courses carry add to 19-22 under a printed 18-22; the printed range
         counts that list at 6. No note of the record names the difference, so the words filed are the kind's own,
         from the record's figures. Its PDF page was also read for 02309 (Hospitality Management A.S.); its heading
         names the transfer degree and 02309's names the A.S. (own_heading).

    python3 kb/_program_piles_s740_canyons.py --dry-run
    python3 kb/_program_piles_s740_canyons.py --tag s740c

Guard: tests/program_piles_s740_canyons_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s727_canyons as PRIOR  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402

COLLEGE = "College of the Canyons"
SLUG = "college_of_the_canyons"
TAG = "s740c"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_college_of_the_canyons_2026-11-26_s739c.json"
KEYS = ("36793",)

REVIEWED = {
    "36793": {"gap": B7.WITHIN, "words_from": "figures", "shape": ["within"], "computed": [19, 22],
              "stated": [18, 22],
              "own_heading": "Associate in Science for Transfer Degree: Hospitality Management"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="College of the Canyons", prior=PRIOR, keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
