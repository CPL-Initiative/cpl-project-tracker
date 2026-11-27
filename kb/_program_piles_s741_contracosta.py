#!/usr/bin/env python3
"""S741, lane 2's cheap piles at Contra Costa: the three records s740g held, two collected with named gaps.

S740's plan (kb/_program_piles_s740_contracosta.py, s740g) held 01400 and 40761 as on no proved live run: no committed
receipt posts their committed run (44687786167) to a live row. The conductor's live read of 2026-11-27 07:31Z
(kb/receipts/program_requirements_reread_s741_piles_checked.json) holds both live rows at that run, and the md5 of
each live record and checks is the committed file's, so the run is proved (kb/_program_piles_s741.py LiveRead). The
three are read again here, by key, from the committed records and their notes. No catalog read, no reconcile, no
record changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below):
  degree_summary_ge_none (50)  01400  Auto Collision Repair Technology A.S.: its nine courses add to the printed 37
        ('37 Credits', 'Major or Area of Emphasis 37 / 37'), and its note quotes the unit summary: 'Total Program
        60 / 60' with Local GE 'None', CSU/IGETC GE 'N/A' and electives 'None'. The record holds the major alone
        against the degree's 60 (01415's reading, s740g; the kind's own check is s740g's major_equal).
  noted_unit_floor (70)  40761  Information Technology certificate: CIS099 Occupational Work Experience prints 1-4
        units, and its note says the description requires 2 units of occupational work experience; with CIS099 at
        2 the courses add to the printed 22 (4+4+2+4+3+3+2).

HELD (1), its reason in HAND:
  33660  Physical Education/Kinesiology A.S.: s740g's reason stands (its notes quote general education as 'None' and
         'N/A' and say nothing of its electives row). Page read 45955333186 printed the page's shell and course rows
         and not its Unit Summary, so the electives row is still unread: a page read that prints the summary (the
         page's own data call), then degree_summary_ge_none.

    python3 kb/_program_piles_s741_contracosta.py --dry-run
    python3 kb/_program_piles_s741_contracosta.py --tag s741e

Guard: tests/program_piles_s741_contracosta_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740_contracosta as S740  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402

B, NG = B8.B, B8.NG
COLLEGE = "Contra Costa College"
SLUG = "contra_costa"
TAG = "s741e"
HELD_BY = "kb/receipts/program_requirement_records_piles_s740_contra_costa_2026-11-26_s740g.json"
KEYS = ("01400", "33660", "40761")
RUN = "44687786167"

REVIEWED = {
    "01400": {"gap": "degree_summary_ge_none", "computed": [37, 37], "stated": [60, 60], "today": True,
              "shape": ["major_equal"],
              "words": "The summary lists Local GE as 'None', CSU/IGETC GE as 'N/A' and electives as 'None'"},
    "40761": {"gap": "noted_unit_floor", "computed": [21, 24], "stated": [22, 22], "ops": [("units", "CIS099", 2)],
              "words": "the description says the program requires 2 units of occupational work experience",
              "courses": ["CIS099"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "33660": (S740.HAND["33660"] + ". Page read 45955333186 printed the page's shell and course rows and not its "
              "Unit Summary, so the electives row is still unread: a page read that prints the summary, then "
              "degree_summary_ge_none"),
})

W = B8.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Contra Costa", prior=B8.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"major_equal": S740.major_equal})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
