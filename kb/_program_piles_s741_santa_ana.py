#!/usr/bin/env python3
"""S741, lane 1 (keys) at Santa Ana: the two records s740r2 held for the units within-range kind, filed by key.

Plan s740r2 (kb/_program_piles_s740_santa_ana.py) collected seven of Santa Ana's census records with named gaps and
held four. Two of the four held because each sum sits inside its printed range, so no two figures disagree and no
kind then on main was true of them (d-within-range-sums-hold-for-units-kind-s739; s740r2's second reader moved 31859
out of a lists kind for that reason). The kind is units_within_printed_range (kb/_program_named_gaps.py, score 50),
and it files only by a reviewed key list (f-units-within-range-by-key-only-s740; the shared code and its statewide
self-recall: kb/_program_piles_s740.py). Both records are read again here, by key, from the committed record and
from each program's own catalog entry as the capture reads it (college page read 45835379921,
kb/college_reads/s740_reads_santa_ana_pages.json: each entry prints its own 'Program Control Number', and no other
record was read from it). No catalog read, no reconcile, no record changed.

COLLECTED WITH A NAMED GAP (2, REVIEWED below), units_within_printed_range (50): the words filed are the kind's own,
from the record's figures, with the note that says why:
  31859  Political Science A.A.-T: the entry prints 'Required Core: Select 9 units | 9.0', 'List A (select 2): 6-7.5
         Units. (Any course not selected from Core and a below course. Or, two below courses.) | 6.0- 7.5' over POLT
         235 (3.0) and the statistics choice (4.0- 4.5), 'List B (select one) 3 Units | 3.0' and 'Total : 18.0- 19.5'.
         The record places all 13 listed courses and reads each printed unit figure as printed; its List A holds the
         two rows printed under it, 7-7.5, so the courses add to 19-19.5. The page's 6 at List A's low end is a core
         course taken there, a choice the record's blocks do not hold (its own note). Nothing else differs: the sum
         sits inside the printed range and its top is the range's top.
  21789  Pharmacy Technology Advanced Option certificate: the entry prints 'Required Courses: | 24.0- 30.0', PHAR 048
         (2.0), a group printed 20.0 (PHAR 055, 051, 052, 056, 057, 060), two lab choices each printed 0.5- 1.0, the
         externship group printed 1.5- 5.0 (PHAR 072A 0.5- 2.0, 072B 0.5- 1.5, 072C 0.5- 1.5), 'Recommended electives |
         0.0' and 'Total : 24.0- 30.0'. The record places all 18 listed courses and reads each figure as printed; the
         printed groups themselves add to 24.5-29 (2 + 20 + 0.5-1 + 0.5-1 + 1.5-5), the record's sum, inside the
         printed 24-30 and matching neither end. Nothing else differs.

The other two of s740r2's holds are no keys here and keep its reasons: English A.A. 04238 (read from English A.A.-T
32436's entry) and Spanish A.A.-T 32533 (a substitute list counted, a reader change).

    python3 kb/_program_piles_s741_santa_ana.py --dry-run
    python3 kb/_program_piles_s741_santa_ana.py --tag s741k1

Guard: tests/program_piles_s741_santa_ana_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
COLLEGE = "Santa Ana College"
SLUG = "santa_ana"
TAG = "s741k1"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_santa_ana_2026-11-26_s740r2.json"
PAGE_READ = "45835379921"
KEYS = ("21789", "31859")
_W = {"gap": B7.WITHIN, "words_from": "figures", "shape": ["within"]}

REVIEWED = {
    "31859": dict(_W, computed=[19, 19.5], stated=[18, 19.5],
                  words="List A allows any core course not selected from the Required Core plus one listed course, "
                        "or two listed courses",
                  page="'Required Core: Select 9 units | 9.0'; 'List A (select 2): 6-7.5 Units. (Any course not "
                       "selected from Core and a below course. Or, two below courses.) | 6.0- 7.5' over 'POLT 235 ... "
                       "3.0' and '4.0- 4.5 | STAT C1000 4.0 OR STAT C1000H 4.0 OR STAT C1000E 4.5 OR PSYC 210 4.0'; "
                       "'List B (select one) 3 Units ... | 3.0'; 'Total : 18.0- 19.5'; 'Program Control Number: "
                       "31859'"),
    "21789": dict(_W, computed=[24.5, 29], stated=[24, 30],
                  words="the 24.0-30.0 'Required Courses' figure is recorded as the certificate total",
                  page="'Required Courses: | 24.0- 30.0'; 'PHAR 048 ... 2.0'; '20.0' over PHAR 055 2.0, PHAR 051 3.5, "
                       "PHAR 052 3.5, PHAR 056 4.5, PHAR 057 2.0 and PHAR 060 4.5; '0.5- 1.0' over 'PHAR 056L OR "
                       "PHAR 057L OR PHAR 060L'; '0.5- 1.0' over 'PHAR 072L-1 OR PHAR 072L-2'; '1.5- 5.0' over PHAR "
                       "072A 0.5- 2.0, PHAR 072B 0.5- 1.5 and PHAR 072C 0.5- 1.5; 'Recommended electives | 0.0'; "
                       "'Total : 24.0- 30.0'; 'Program Control Number: 21789'"),
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Santa Ana", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
