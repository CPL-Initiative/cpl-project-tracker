#!/usr/bin/env python3
"""S741, lane 2's cheap piles at Orange Coast: the eleven records s739j still held, four collected.

S739's plan (kb/_program_piles_s739_orangecoast.py, s739j) held 13; S740's paid read (45858495107) passed 03954 and
31217 and filed 08664 again, unequal. The eleven are read again here, by key, from the committed records and their
notes. No catalog read, no reconcile, no record changed, no new kind.

PASSED BY A RESCORE (3, PASSED below), S721's rename at Porterville (kb/_program_piles_s739.py renamed_score):
  19473  Building Construction Second Award certificate,
  19474  Building Construction Third Award certificate and
  08628  Construction Technology: Residential Construction Dev A.S.: the page prints the two cross-listed courses as
         'ARCH/CNST A196' and 'ARCH/CNST A197', and the state's file lists them as CNST A196 and CNST A197. Each
         record's own note says so and reads them as those two courses; the scorer, which reads codes alone, counted
         the printed codes as off the state's list (invented) and the listed ones as unplaced (coverage). s739j held
         all three as not collectable on exactly those two codes. With the two renames read, coverage and invented
         pass, and the arithmetic was already equal (36 against 36, 54 against 54, 18 against 18). The rename stays
         in the plan.
         s739j also held 08628 because its page's heading reads 'Building Construction, Associate in Science Degree'
         where the state's title is 'Construction Technology: Residential Construction Dev'. The page, read free as
         the capture reads it (college-page-read run 45955333186,
         kb/college_reads/s741_piles_orange_coast_figures.json), prints 'Control Number: 08628' under that heading:
         it is 08628's own page under the college's newer title, as the sister pages 19473 and 19474 were read from
         are titled 'Building Construction Second Award' and 'Third Award'. No other record was read from it.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  noted_figures_differ (40)  08664  Food and Beverage Management Advanced A.S., as read 45858495107 filed it: its note
        quotes the two figures the page prints for the prerequisite certificate, '(20.5 Units)' in the list's heading
        and 'Total Units 22' under its courses. The record adds the list at 22 (40-41.5) and the page's total counts
        it at 20.5 (38.5-40): with the list at its heading's 20.5 today's scorer gives the printed total at both
        ends. Its sister certificate 43362 carries the same gap (s739j).

HELD (7), each reason in HAND:
  08663  not the program's own (s739j's reason). Page read 45953358884 found its own page, which prints 'Control
         Number: 08663' (.../food-beverage-management/food-beverage-management-coa/): a site_pages pin and a paid
         read.
  42331  today's scorer passes it on its record (9.5-16, equal: the page prints no units beside the two courses of
         its 0-4 choice, and the 11.5 comes from the state's file): a closed-list rescore, never a gap (the
         follow-up's, as Fullerton 33680 and 42143).
  03993, 08670, 32790, 36032, 43100  s739j's reasons, unchanged.

08626 is no key (s739j's NOTE_08626): it passes as filed, read from the wrong page. The same page read found its
own page, which prints 'Powerplant, Associate in Science Degree' and 'Control Number: 08626'
(.../aviation-maintenance-technology/powerplant-associate-science-degree/): a site_pages pin and a paid read.

    python3 kb/_program_piles_s741_orangecoast.py --dry-run
    python3 kb/_program_piles_s741_orangecoast.py --tag s741b

Guard: tests/program_piles_s741_orangecoast_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739_orangecoast as S739  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402

B, NG = B8.B, B8.NG
COLLEGE = "Orange Coast College"
SLUG = "orange_coast"
TAG = "s741b"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_orange_coast_2026-11-26_s739j.json"
KEYS = ("03993", "08628", "08663", "08664", "08670", "19473", "19474", "32790", "36032", "42331", "43100")
READ = "45858495107"
PAGE_READ = "45953358884"   # kb/college_reads/s741_piles_orange_coast_own_pages.json
_CROSS = {"ARCH/CNST A196": "CNST A196", "ARCH/CNST A197": "CNST A197"}
_PREREQ = ("Required Prerequisites: Food and Beverage Management Certificate of Achievement (20.5 Units) - Required "
           "Courses")

PASSED = {
    "19473": {"renames": _CROSS,
              "words": "ARCH/CNST A196 and ARCH/CNST A197 are cross-listed codes matched to closed-list CNST A196 and "
                       "CNST A197"},
    "19474": {"renames": _CROSS,
              "words": "ARCH/CNST A196 and ARCH/CNST A197 are printed as cross-listed codes; matched to closed-list "
                       "CNST A196 and CNST A197"},
    "08628": {"renames": _CROSS,
              "words": "ARCH/CNST A196 and ARCH/CNST A197 are cross-listed codes; matched to closed-list CNST A196 and "
                       "CNST A197"},
}
# 08628's page prints the college's newer title over the state's: 'Building Construction, Associate in Science
# Degree' and 'Control Number: 08628' (college-page-read run CONTROL_READ, the page as the capture reads it).
CONTROL_READ = "45955333186"   # kb/college_reads/s741_piles_orange_coast_figures.json
CONTROL_08628 = {"plan": "kb/college_reads/s741_piles_orange_coast_figures.json", "run": CONTROL_READ,
                 "prints": "Control Number: 08628", "heading": "Building Construction, Associate in Science Degree"}
REVIEWED = {
    "08664": {"gap": "noted_figures_differ", "computed": [40, 41.5], "stated": [38.5, 40],
              "words": "The prerequisite certificate heading says '(20.5 Units)' but its course list prints 'Total "
                       "Units 22'; the block's stated uses the list total of 22",
              "ops": [("choose", _PREREQ, 20.5)]},
}
HAND = {cn: B.PASSES for cn in PASSED}
HAND.update({cn: e["gap"] for cn, e in REVIEWED.items()})
HAND.update({cn: S739.HAND[cn] for cn in ("03993", "08670", "32790", "36032", "43100")})
HAND.update({
    "08663": ("held: not the program's own: it was read from the Food and Beverage Management, Advanced certificate's "
              "page (43362's). Page read " + PAGE_READ + " found its own page, "
              "https://catalog.cccd.edu/orange-coast/pathways/hospitality-food-tourism/food-beverage-management/"
              "food-beverage-management-coa/, which prints 'Food and Beverage Management, Certificate of Achievement' "
              "and 'Control Number: 08663': a site_pages pin and a paid read"),
    "42331": ("held: today's scorer passes it on its record (9.5-16, equal: the page prints no units beside the two "
              "courses of its 0-4 choice, and the filed 11.5 takes them from the state's file): a closed-list rescore, "
              "never a gap"),
})

W = B8.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Orange Coast", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, passed=PASSED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
