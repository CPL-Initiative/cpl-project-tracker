#!/usr/bin/env python3
"""S741, lane 2's cheap piles at Shasta: the two records s740i held, one collected with a named gap.

S740's plan (kb/_program_piles_s740_shasta.py, s740i) held 32162 and 18625. Both are read again here, by key, from the
committed records and from the catalog's own pages as two free page reads print them. No catalog read by the model,
no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  units_within_printed_range (50)  32162  Kinesiology A.A.-T: its lists add to 23-27 inside the printed 'Major 22-27'.
        S740 held it on the own-page guard: its heading sits on PDF p.99, which the read did not hold, and 18094
        (University Studies - Physical Education) was read from the same p.100 with 29 of its 32 courses. The guard
        clears on what p.100 itself prints (college-page-read run 45837455365, S740's
        kb/college_reads/s740_piles_shasta_sections.json, [pdf page 100]): above the record's lists, 'students must
        complete the core courses listed below for the Associate in Arts in Kinesiology for Transfer Degree'; then
        REQUIRED CORE, Movement Based Courses and LIST A, the three lists the record holds; then the section's own
        closing line, 'ASSOCIATE IN ARTS IN KINESIOLOGY FOR TRANSFER DEGREE REQUIREMENTS: Major 22-27, General
        Education (Cal-GETC) 34, Additional Electives 6-14, Degree Total Will Not Exceed 60 Units'; and only after
        it the next heading, 'Physical Education University Studies - 18 Unit Emphasis: SC Program: AA.1493', which
        is 18094's section ('Choose 18 units from at least 3 areas'), and after that 18095's ('Physical Sciences
        University Studies - 22 Unit Emphasis', the third record read from p.100). The record's lists sit between
        two lines that
        name this degree, and its stated 22-27 is the closing line's Major figure (own_lines,
        kb/_program_piles_s741.py). The kind files by reviewed key alone (f-units-within-range-by-key-only-s740).

HELD (1), its reason in HAND:
  18625  General Studies - Coastal Oceanographic Studies A.S.: not the program's own. Page read 45953358884
         (kb/college_reads/s741_piles_shasta_coastal.json, pp.76-79 whole) prints 'Geosciences Technician, General
         Studies - 26-30 Unit Emphasis, SC Program: AS.1602' on p.77 and its 'Emphasis in Coastal Science Technician'
         on p.78, the list the record holds: 18626's section. No page read prints a 'Coastal Oceanographic' heading,
         so the catalog is not shown to print this program: a rule D capture, then a prior-year read.

    python3 kb/_program_piles_s741_shasta.py --dry-run
    python3 kb/_program_piles_s741_shasta.py --tag s741a

Guard: tests/program_piles_s741_shasta_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s727_shasta as PRIOR  # noqa: E402
import _program_piles_s739_shasta as S739  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402

B, NG = B8.B, B8.NG
COLLEGE = "Shasta College"
SLUG = "shasta"
TAG = "s741a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s740_shasta_2026-11-26_s740i.json"
KEYS = ("18625", "32162")
PAGE_READ = "45837455365"
COASTAL_READ = "45953358884"   # kb/college_reads/s741_piles_shasta_coastal.json, pp.76-79 whole
OWN_32162 = {
    "plan": "kb/college_reads/s740_piles_shasta_sections.json", "run": PAGE_READ, "page": 100,
    "opens": "students must complete the core courses listed below for the Associate in Arts in Kinesiology for "
             "Transfer Degree",
    "closes": "ASSOCIATE IN ARTS IN KINESIOLOGY FOR TRANSFER DEGREE REQUIREMENTS: Major 22-27",
    "next": "Physical Education University Studies – 18 Unit Emphasis: SC Program: AA.1493",
}

REVIEWED = {
    "32162": {"gap": B8.WITHIN, "words_from": "figures", "shape": ["within"], "computed": [23, 27],
              "stated": [22, 27], "own_lines": OWN_32162},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "18625": ("held: not the program's own: its blocks are the 'Emphasis in Coastal Science Technician' of the "
              "Geosciences Technician degree ('General Studies – 26-30 Unit Emphasis', SC Program AS.1602, 18626's), "
              "whose heading page read " + COASTAL_READ + " prints on PDF p.77 above the list on p.78; pp.76-79 and "
              "the pages " + PAGE_READ + " printed between pp.74 and 100 carry no 'Coastal Oceanographic' heading, so "
              "the 2026-2027 catalog is not shown to print this program: a rule D capture, then a prior-year read "
              "(kb/_program_discontinued.py)"),
})

W = B8.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Shasta", prior=PRIOR, keys=KEYS, reviewed=REVIEWED, hand=HAND,
            held_by=HELD_BY, file_history=S739.FILE_HISTORY, load_commits=S739.LOAD_COMMITS, read_at=S739.READ_AT)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
