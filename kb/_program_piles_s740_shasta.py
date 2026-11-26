#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Shasta: the three records s739b held, one collected with a named gap.

S739's plan (kb/_program_piles_s739_shasta.py, s739b) collected 12 of s727c's holds and held three. 18655 held because
it was not collectable: its page prints SOC C1000 where the state's file lists SOCI C1000. S740 filed that pair as a
cited course renumber (kb/program_requirements_reconcile.json, college-page-read run 45837455365), the free reconcile
45841957622 rescored the record with it read, and reread 45849365599 posted it: coverage and invented now pass, the
record itself unchanged, and its arithmetic still reads 5-21 against the printed 20-22. The three are read again
here, by key, from the committed records. No catalog read, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  option_lists_read_apart (40)  18655  University Studies - Earth Sciences A.A.: three emphases in one option group,
        'Emphasis in Geology and Earth History' in two lists and 'Emphasis in Earth Systems' in four, every list an
        alternative of its own, under the heading's '20-22 Unit Emphasis' (18626's reading, s739b). The record
        carries no notes, so the words filed are its heading's, which prints the option's own figure. Its PDF pages
        were also read for other emphases; its heading carries its own title (own_heading).

HELD (2), each reason in HAND:
  18625  not the program's own (s739b's reason, unchanged). Page read 45837455365 found no 'Coastal Oceanographic'
         heading between pp.74 and 100.
  32162  its 23-27 sits inside the printed 22-27 and units_within_printed_range is true of its figures, but its
         section is not shown to be its own (kb/_program_piles_s740.py SHASTA_32162). Page read 45837455365 found the
         words 'Kinesiology for Transfer' on p.100 alone, in running text, so the page before prints no heading the
         read could have held under those words.

    python3 kb/_program_piles_s740_shasta.py --dry-run
    python3 kb/_program_piles_s740_shasta.py --tag s740i

Guard: tests/program_piles_s740_shasta_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s727_shasta as PRIOR  # noqa: E402
import _program_piles_s739_shasta as S739  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402

COLLEGE = "Shasta College"
SLUG = "shasta"
TAG = "s740i"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_shasta_2026-11-26_s739b.json"
KEYS = ("18625", "18655", "32162")
RECONCILE, REREAD = "45841957622", "45849365599"
_EMPHASES = ("Emphasis in Geology and Earth History", "Emphasis in Atmospheric Sciences", "Emphasis in Earth Systems")

REVIEWED = {
    "18655": {"gap": "option_lists_read_apart", "computed": [5, 21], "stated": [20, 22],
              "words": "Earth Sciences University Studies – 20-22 Unit Emphasis", "words_at": "heading",
              "shape": ["option_names"], "options": _EMPHASES,
              "own_heading": "Earth Sciences University Studies – 20-22 Unit Emphasis: SC Program: AA.1515"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({"18625": S739.HAND["18625"], "32162": B7.SHASTA_32162})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Shasta", prior=PRIOR, keys=KEYS, reviewed=REVIEWED, hand=HAND,
            held_by=HELD_BY, file_history=S739.FILE_HISTORY, load_commits=S739.LOAD_COMMITS, read_at=S739.READ_AT)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
