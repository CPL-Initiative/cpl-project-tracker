#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Long Beach City: the four records s731c held, one collected with its gap named.

S731's plan (kb/_program_piles_s731_lbcc.py, s731c) passed 3 and collected 9 of the census's 16 wording-rule records
and held 4. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap
named and a lower score, never held, unless the record is not the program's own. The four are read again here, by key,
from the committed records, their notes and today's capture. No catalog read, no reconcile, no record changed, no new
kind.

COLLECTED (1, REVIEWED below):
  noted_section_cut_off (20)  44848 Cal-GETC certificate, read from the catalog's own Cal-GETC page: its text is cut
        off partway through the Area 4 list, so Areas 5A, 5B, 5C and 6 are not in the record, and it reads no total.
        S731 held it for a wider text window (a reread); the gap is named instead, and course-list match is capped at
        50, since the record places the courses it read, not the pattern's whole list.

HELD (3):
  43021  the state's file lists Registered Nursing A.S. twice (02677 and 43021), and both records were read from the
         one Registered Nursing A.S. page under one heading. Today's scorer passes it (63 against the printed 63-64),
         but which control number that page is is the inventory's call: nothing in the committed files shows the page
         to be 43021's own and not 02677's.
  37213  not the program's own: CSU GE-Breadth read from the LBCC-GE Plan A page, which its own note says is 'not the
         CSU GE-Breadth certificate named in the request'. A page search is its lever.
  42970  d-lbcc-42970-no-units-read-or-hold-s731 stands: no_units_printed is off statewide (its matcher failed its own
         self-recall), no_units_read's own check refuses the row, and a record its replacement kind refuses stays
         held. The page read free first is S681's lever.

    python3 kb/_program_piles_s739_lbcc.py --dry-run
    python3 kb/_program_piles_s739_lbcc.py --tag s739g

Guard: tests/program_piles_s739_lbcc_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s731_lbcc as PRIOR  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Long Beach City College"
SLUG = "long_beach_city"
TAG = "s739g"
HELD_BY = "kb/receipts/program_requirement_records_piles_s731_lbcc_2026-11-25_s731c.json"
KEYS = ("43021", "37213", "44848", "42970")

REVIEWED = {
    "44848": {"gap": "noted_section_cut_off", "computed": [25, 32], "stated": None,
              "words": "Catalog text is cut off partway through the Area 4 list",
              "also_words": "The page prints no total units for the pattern; total_units is null",
              "shape": ["cut", "no_total"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "43021": ("held: the state's file lists Registered Nursing A.S. twice (02677 and 43021), and both records were read "
              "from the one Registered Nursing A.S. page under one heading; today's scorer passes it (short_high, 63 "
              "against the printed 63-64), but nothing in the committed files shows the page to be 43021's own and not "
              "02677's: which control number the page is is the inventory's call"),
    "37213": ("held: not the program's own: CSU GE-Breadth read from the LBCC-GE Plan A page, which its own note says "
              "is 'not the CSU GE-Breadth certificate named in the request'; a page search is its lever"),
    "42970": ("held: d-lbcc-42970-no-units-read-or-hold-s731 stands: no_units_printed is off statewide "
              "(NG.NO_UNITS_PRINTED_ON: its matcher failed its own self-recall) and no_units_read's own check refuses "
              "it, so a record its replacement kind refuses stays held: S681's reason, '%s'" % NG.HOLD_NO_UNITS_PRINTED),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Long Beach City", prior=PRIOR, keys=KEYS, reviewed=REVIEWED,
           hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
