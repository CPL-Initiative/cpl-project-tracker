#!/usr/bin/env python3
"""S740, lane 2's cheap piles at El Camino: the eight records s720m held, four collected with named gaps.

S720's plan (kb/_program_piles_s720_elcamino.py, s720m) collected 14 of the census's wording-rule records and held
eight. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named
and a lower score, never held, unless the record is not the program's own. A named gap must be true of its record.
The eight are read again here, by key, from the committed records and their notes (S739's reconcile 45768189197 and
reread 45774563911 brought seven of them to one run; the live-run guard reads the receipts). No catalog read, no
reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (4, REVIEWED below):
  required_list_outside_total (70)  02520  Radiologic Technology A.S.: the page prints 'Total Units for Major: 58' over
        the required courses and 'Program Total Units: 64.5' with two 'Post ECC Graduation Courses (required)' (6.5),
        which the record counts; without that list the courses add to the printed 58 (the reading closes the major;
        the degree's 60 is printed as a minimum, which the major and general education's 24 pass, and its note is
        filed beside). S720 held it because no two figures differ, which is so: this kind (S727's) says what the
        page prints.
  noted_figures_differ (40)  02518  Nursing A.S.: its note says the printed course units (49) with the 3-unit
        humanities line are 52 against the stated 51, and that the page's other track shows the same one-unit
        difference; the record adds to the 49 and states the 51 (both notes filed).
        15251  Visual Communications certificate: the '2-3 units from' list prints a 2-unit minimum over courses
        of 3 units each; the record counts the list from 2, so it adds to 32-35 against the printed 33-35, and with
        the list at its courses' 3 it adds to the printed 33-35.
  noted_section_cut_off (20)  45290  Cal-GETC certificate: its text is cut off mid-Area 5 and it reads no total
        (Long Beach City 44848's reading, s739g).

HELD (4), each reason in HAND:
  19857  on no proved live run (33 against 36; S720's reason was a reread).
  19883  not the program's own: read from the Photography A.S. page, which prints no certificate section.
  31319  Commercial Music certificate: 19 against the printed 20, and no note names a figure that closes it (MUSI 182
         printed 3 where the state's file stores 2 moves it the other way): a reread.
  42541  Business Administration 2.0 A.S.-T: 27-30 against the printed 28-30 (the sum's low end below the range's);
         no note names the difference and no kind's sentence is true of it: a reread.

    python3 kb/_program_piles_s740_elcamino.py --dry-run
    python3 kb/_program_piles_s740_elcamino.py --tag s740e

Guard: tests/program_piles_s740_elcamino_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B, NG = B7.B, B7.NG
COLLEGE = "El Camino College"
SLUG = "el_camino"
TAG = "s740e"
HELD_BY = "kb/receipts/program_requirement_records_piles_s720_elcamino_2026-11-24_s720m.json"
KEYS = ("02518", "02520", "15251", "19857", "19883", "31319", "42541", "45290")
_POST = "Post ECC Graduation Courses (required)"

REVIEWED = {
    "02520": {"gap": "required_list_outside_total", "computed": [64.5, 64.5], "stated": [58, 58],
              "ops": [("drop", _POST)], "closes": "major",
              "words": "The page also prints 'Program Total Units: 64.5'. This includes the Post ECC Graduation "
                       "Courses RTEC 216 and RTEC 328 (6.5 units)",
              "also_words": "degree_total is the printed 'Minimum Degree Total: 60 units'",
              "courses": ["RTEC 216"]},
    "02518": {"gap": "noted_figures_differ", "computed": [49, 49], "stated": [51, 51],
              "words": "Sum of printed course units (49) plus 3-unit Humanities is 52, not the stated 51",
              "also_words": "Requirement 'Humanities: Any 3 unit course from Area 3 of the Associate of Arts and "
                            "Associate of Science Degree' is a GE-area choice with no listed courses",
              "shape": ["note_quotes"], "quotes": {"stated": "the stated 51", "computed": "(49)"}},
    "15251": {"gap": "noted_figures_differ", "computed": [32, 35], "stated": [33, 35],
              "ops": [("choose", "2-3 units from", 3)],
              "words": "The '2-3 units from' list states a 2-unit minimum though every listed course is 3 units; "
                       "minimum recorded as printed"},
    "45290": {"gap": "noted_section_cut_off", "computed": [28, 36], "stated": None,
              "words": "The catalog text is cut off mid-Area 5 (at 'GEOL 36 - Geolo')",
              "also_words": "No total units for the certificate are printed in the visible text",
              "shape": ["cut", "no_total"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "19857": ("held: on no proved live run: no committed receipt posts its committed run to its live row "
              "(on_live_run); its 33 against the printed 36 then needs a reread"),
    "19883": ("held: not the program's own: the certificate was read from the Photography A.S. page (02512's), which "
              "prints no certificate section, so its identity is unconfirmed: a page-finding step"),
    "31319": ("held: 19 against the printed 20, and no note names a figure that closes it (MUSI 182 printed 3 where "
              "the state's file stores 2 moves it the other way); no kind's sentence is true of it: a reread"),
    "42541": ("held: 27-30 against the printed 28-30, the sum's low end below the range's; no note names the "
              "difference and no kind's sentence is true of it: a reread"),
})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="El Camino", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
