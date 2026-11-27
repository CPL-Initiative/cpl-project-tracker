#!/usr/bin/env python3
"""S742, lane 2's cheap piles at Santa Monica: the two records s740f held, one collected with a named gap.

S740's plan (kb/_program_piles_s740_smc.py, s740f) held 21026 and 43767. S741's free page read 45953358884
(kb/college_reads/s741_piles_santa_monica_cosmetology.json, the catalog PDF's pp.120-122 whole) prints both sections
line for line, and the conductor's live read of 2026-11-27 07:31Z
(kb/receipts/program_requirements_reread_s741_piles_checked.json) holds 21026's live row at its committed run
(44739378155). The two are read again here, by key. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  total_differs (50)  21026  Cosmetology certificate. PDF p.121 prints 'Cosmetology, Associate Degree or Certificate
        of Achievement', 'Area of Emphasis: (26.5 units)', and 23 required courses whose printed units add to 25.5
        (Related Science 7.5, Hair Cutting 3, Hair Styling 2, Hair Coloring 2, Permanent Wave 1, Curly Hair Technique
        1, Nail Care 3, Esthetician 4, Salon Management 2), then 'students must enroll in one or more of the following
        Salon courses (2 units minimum)': 27.5 under the printed 26.5. The record reads both figures exactly, so the
        record rule names the gap from kb/program_total_differs.json. S740 held it because no note of its own quotes
        both figures; the page read does. PDF p.121 was also read for 43767 (Barbering A.S.), 40812 (Esthetician)
        and 03302, the Cosmetology A.S., which shares this one section: its heading names both awards, and p.120
        says each award is granted on 'Completion of the area of emphasis'. A heading naming both awards shows
        neither sister its own (S739's third reader), so the showing is the record's own note, which names the
        section as serving both awards (own_section, S741's form at Solano 30184 and 30185).

HELD (1), its reason in HAND:
  43767  Barbering A.S.: its live row holds run 37548804006, an older run than its committed record's 39567439681
         (the conductor's live reads of 07:31Z and 08:51Z), and keep-better names no dispatch for it (main never
         filed the live row's run: a person compares the two). The page read shows its heading, 'Barbering, Associate
         Degree or Certificate of Achievement', at the foot of PDF p.120 and its lists on p.121, the page it was read
         from: once the committed record is live, heading_not_in_text is its kind.

    python3 kb/_program_piles_s742a.py --dry-run     # the batch this pile is in

Guard: tests/program_piles_s742a_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s742 as B9  # noqa: E402

B, NG = B9.B, B9.NG
COLLEGE = "Santa Monica College"
SLUG = "santa_monica"
TAG = "s742a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s740_santa_monica_2026-11-26_s740f.json"
KEYS = ("21026", "43767")
PAGE_READ = "45953358884"
RUN = "44739378155"

REVIEWED = {
    "21026": {"gap": "total_differs", "computed": [27.5, 27.5], "stated": [26.5, 26.5], "rule": True,
              "own_section": "The section heading covers both the Associate Degree and the Certificate of "
                             "Achievement",
              "page": "PDF p.121: 'Cosmetology, Associate Degree or Certificate of Achievement'; 'Area of Emphasis: "
                      "(26.5 units)'; 23 required courses at their printed units, 25.5 in all; 'students must enroll "
                      "in one or more of the following Salon courses (2 units minimum)': COSM 95A (1), 95B (2), "
                      "95C (3)"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "43767": ("held: its live row holds run 37548804006, an older run than its committed record's 39567439681 (the "
              "conductor's live reads of 2026-11-27 07:31Z and 08:51Z), and keep-better names no dispatch for it, "
              "since main never filed the live row's run: a person compares the two. College page read " + PAGE_READ
              + " shows its heading, 'Barbering, Associate Degree or Certificate of Achievement', at the foot of PDF "
              "p.120 and its lists on p.121, the page it was read from: once the committed record is live, "
              "heading_not_in_text"),
})

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Santa Monica", prior=B9.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)
