#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Gavilan: the six records s739m held, four collected under the units within-range kind.

S739's plan (kb/_program_piles_s739_gavilan.py, s739m) collected five of s721d's holds and held six. Four of the six
held because each sum sits inside its printed range, so no two figures disagree and noted_figures_differ's sentence
is not true of them (d-within-range-sums-hold-for-units-kind-s739): they waited for a units twin of
hours_within_printed_range. That kind is units_within_printed_range (kb/_program_named_gaps.py, score 50; the shared
code and its statewide self-recall: kb/_program_piles_s740.py). The six are read again here, by key, from the
committed records and their notes. Each was read from a catalog page of its own address, which no other record was
read from. No catalog read, no reconcile, no record changed.

COLLECTED WITH A NAMED GAP (4, REVIEWED below), units_within_printed_range (50): the words filed are the kind's own,
from the record's figures, with the note that quotes them:
  08460  Cosmetology A.S.: three 12-unit courses add to 36 under a printed 'Units: 30- 36'; its note says the 30 is
         not explained by the text.
  19378  Child Development and Educational Studies certificate: a core of 14 and 10 units of electives add to 24
         under a printed 'Total: 14- 24'.
  38787  Elementary Teacher Education A.A.-T: 53-60 under a printed 48-60; the core prints 'Units: 42- 48' over
         courses that add to 47-48, and the page's range counts the core at its printed 42 (both notes filed).
  41394  Business Administration 2.0 A.S.-T: 27 under a printed 26-27; one choice prints 3-4 over two courses listed
         at 4 (both notes filed).

HELD (2), each reason in HAND:
  08464  Liberal Arts (Multiple Subjects) A.A.: on no proved live run (s739m's reason, unchanged).
  45357  Cal-GETC certificate: no gap is true of it. It was read in two parts that left five lists with no course
         beside their twins, so its arithmetic is incomplete on the read itself, not on what the page prints: a
         reread.

    python3 kb/_program_piles_s740_gavilan.py --dry-run
    python3 kb/_program_piles_s740_gavilan.py --tag s740a

Guard: tests/program_piles_s740_gavilan_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
COLLEGE = "Gavilan College"
SLUG = "gavilan"
TAG = "s740a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_gavilan_2026-11-26_s739m.json"
KEYS = ("08460", "08464", "19378", "38787", "41394", "45357")
_W = {"gap": B7.WITHIN, "words_from": "figures", "shape": ["within"]}

REVIEWED = {
    "08460": dict(_W, computed=[36, 36], stated=[30, 36],
                  words="The requirements block states 'Units: 30- 36', but the three listed courses total 36 units"),
    "19378": dict(_W, computed=[24, 24], stated=[14, 24],
                  words="The printed total is 'Total: 14- 24', recorded as printed; the two blocks (14 + 10) sum to "
                        "24"),
    "38787": dict(_W, computed=[53, 60], stated=[48, 60],
                  words="Total: 48-60 is recorded as the major total (core 42-48 + List A 3 + List B 3 + List C 0-6)",
                  also_words="The Required Core prints 'Units: 42- 48', while the listed courses sum to 47-48 units"),
    "41394": dict(_W, computed=[27, 27], stated=[26, 27],
                  words="total_units taken from 'Units Required for the Major: 26 - 27'",
                  also_words="STAT C1000 appears in place of closed-list MATH 5 (listed at 4 units, while the block "
                             "range 3-4 suggests a 3-unit option existed)"),
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "08464": ("held: on no proved live run: its committed record holds run 44090922437, and reread 44118718575 "
              "replaced its live row at run 44112314553 afterward, so the committed record is not the live row's "
              "(on_live_run); it carries no notes. The committed record brought to its live row's read, then a "
              "reading"),
    "45357": ("held: no gap is true of it: it was read in two parts that left five lists with no course beside "
              "their twins, so its arithmetic is incomplete on the read itself, not on what the page prints, and its "
              "own notes say the section prints IGETC's older course list under the Cal-GETC heading: a reread"),
})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Gavilan", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
