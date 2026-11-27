#!/usr/bin/env python3
"""S741, lane 2's cheap piles at Orange Coast, second plan: 32790, the Cal-GETC certificate, collected with a named gap.

s739j held 32790 with its gap already named: 'its text is cut off mid-Area 5A and it reads no total, and no committed
receipt posts its committed run (44747523200) to its live row ... A file-history proof of its run, then
noted_section_cut_off'. s741b kept that hold. The conductor's live read of 2026-11-27 07:31Z
(kb/receipts/program_requirements_reread_s741_piles_checked.json) holds the live row at that run, with the committed
record and checks by md5, which is the proof (kb/_program_piles_s741.py LiveRead). No catalog read, no reconcile, no
record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  noted_section_cut_off (20)  32790  Cal-GETC certificate, read from the catalog's own Cal-GETC page: its note says
        the text is cut off mid-row in Area 5A (at PHYS A280), and Areas 5B, 5C and 6, the American Institutions
        requirement and Language Other than English are named in the page's tabs with no list in the text. The
        record states no total and its areas add to 25-37 (Long Beach City 44848's reading, s739k).

    python3 kb/_program_piles_s741_orangecoast2.py --dry-run
    python3 kb/_program_piles_s741_orangecoast2.py --tag s741f

Guard: tests/program_piles_s741_orangecoast2_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s741 as B8  # noqa: E402

B, NG = B8.B, B8.NG
COLLEGE = "Orange Coast College"
SLUG = "orange_coast"
TAG = "s741f"
HELD_BY = "kb/receipts/program_requirement_records_piles_s741_orange_coast_2026-11-27_s741b.json"
KEYS = ("32790",)
RUN = "44747523200"

REVIEWED = {
    "32790": {"gap": "noted_section_cut_off", "computed": [25, 37], "stated": None, "shape": ["cut"],
              "words": "The catalog text is cut off mid-row in Area 5A (at PHYS A280)"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B8.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Orange Coast", prior=B8.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
