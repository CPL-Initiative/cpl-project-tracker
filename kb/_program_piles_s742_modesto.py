#!/usr/bin/env python3
"""S742, lane 1 (readers) at Modesto Junior: Spanish A.A.-T 35127, filed by key under the units within-range kind.

Plan s731p (kb/_program_piles_s731_pooled.py) held 35127 because no kind then on main named its gap: the page lays
out two learner paths the catalog's list structure does not encode, and the record's lists add to 23 where the page
prints 19-23. S740 added the kind for exactly that shape, units_within_printed_range (kb/_program_named_gaps.py,
score 50), filed only by a reviewed key list (f-units-within-range-by-key-only-s740; the shared code and its
statewide self-recall: kb/_program_piles_s740.py, whose held answers listed this record as "two learner paths, no
kind fits"). It is read again here, by key, from the committed record and from its own catalog entry as the capture
reads it (college page read 45768981024, kb/college_reads/modesto_pooled_next_s739.json: the eLumen publish call
for spanish-for-transfer-degree-mjc-fall-2025, the page the record was read from, which no other record was read
from). No catalog read, no reconcile, no record changed.

COLLECTED WITH A NAMED GAP (1, REVIEWED below), units_within_printed_range (50): the words filed are the kind's own,
from the record's figures, with the note that says why:
  35127  Spanish A.A.-T: the entry prints 'Spanish for Transfer Degree (Total 19 - 23)' over 'REQUIRED COURSES (10 -
         20 units) (Total 20)', whose three parts print 'REQUIRED COURSES (Total 10)' (SPAN101 5, SPAN102 5),
         'REQUIRED COURSES (Total 5)' (SPAN109 5 or SPAN103 5) and 'REQUIRED COURSES (Total 5)' (SPAN110 5), then
         'LIST A - SELECT AT LEAST ONE (Total 3)' over seven 3-unit courses, and 'Total Units: 19.0 - 23.0 Units'.
         The record places all 12 listed courses and reads each printed figure as printed, so its lists add to 23,
         the range's top. The page's 19 is the Native/Heritage path, which starts at SPAN 109, then SPAN 110, 'using
         List A elective courses to complete the required minimum units for the major': the '10 - 20 units' the
         outer heading prints, a choice the record's blocks do not hold (its own note). Nothing else differs.

    python3 kb/_program_piles_s742_modesto.py --dry-run
    python3 kb/_program_piles_s742_modesto.py --tag s742r1

Guard: tests/program_piles_s742_modesto_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
COLLEGE = "Modesto Junior College"
SLUG = "modesto_junior"
TAG = "s742r1"
HELD_BY = "kb/receipts/program_requirement_records_piles_s731_pooled_2026-11-25_s731p.json"
PAGE_READ = "45768981024"
KEYS = ("35127",)

REVIEWED = {
    "35127": {"gap": B7.WITHIN, "words_from": "figures", "shape": ["within"],
              "computed": [23, 23], "stated": [19, 23],
              "words": "the description lays out two paths: non-native learners take SPAN 101, 102, 103, 110 plus "
                       "one List A course; native/heritage learners take SPAN 109 and 110 plus List A electives to "
                       "reach the minimum",
              "page": "'Spanish for Transfer Degree (Total 19 - 23)'; 'Complete the following number of credits: "
                      "19-23'; 'REQUIRED COURSES (10 - 20 units) (Total 20)' over 'REQUIRED COURSES (Total 10) · "
                      "Complete all of the following · SPAN101 - Spanish 1 5 · SPAN102 - Spanish 2 5', 'REQUIRED "
                      "COURSES (Total 5) · Complete the following number of credits: 5 · SPAN109 - Spanish for "
                      "Spanish Speakers 1 5 · SPAN103 - Spanish 3 5' and 'REQUIRED COURSES (Total 5) · Complete the "
                      "following number of credits: 5 · SPAN110 - Spanish for Spanish Speakers 2 5'; 'LIST A - "
                      "SELECT AT LEAST ONE (Total 3) · Complete the following number of credits: 3' over SPAN112, "
                      "SPAN173, ENGL172, ENGL173, HIST125, HIST145 and SOCIO156 at 3 each; 'Total Units: 19.0 - "
                      "23.0 Units'; 'B) Native/Heritage Spanish-speaking Learner Path: ... Students are advised to "
                      "start at Spanish 109, followed by Spanish 110, using List A elective courses to complete "
                      "the required minimum units for the major'; 'TOTAL UNITS IN A.A. -T MAJOR ... 19-23'"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Modesto Junior", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
