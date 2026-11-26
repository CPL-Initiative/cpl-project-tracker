#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Santa Barbara City: five records s727d held, three collected with their gaps named.

S727's plan (kb/_program_piles_s727_sbcc.py, s727d) passed 6 and collected 6 of the census's 18 wording-rule records
and held 6. 05934 keeps its hold (d-sbcc-05934-keeps-hold-s727) and is no key here. Sam's ruling, as
kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and a lower score, never
held, unless the record is not the program's own. The five are read again here, by key, from the committed records,
their notes and today's capture. Each was read from its own catalog page (a sitemap page no other program was read
from). No catalog read, no reconcile, no record changed, no new kind.

COLLECTED (3, REVIEWED below):
  lists_not_closed (30)      19012 Creative Writing: Professional certificate: its 'List of Electives' is a
        substitution list ('students may substitute two of the courses from the list of electives below'), read as a
        choice list with no count, so its arithmetic is incomplete; without it the core and the emphasis add to the
        printed 19-21. 46520 Spanish for Heritage Speakers certificate: 'Substitution Courses' lists approved
        substitutions for a student who places out of a core course; without it the core adds to the printed 20.
        S727 held both on the cheaper lever (a substitution-list reading passes them); the lever is named.
  pair_read_as_alternatives (50)  45452 Elementary Teacher Education A.A.-T: BIOL 100 (4), or BIOL 140 and BIOL
        141 taken together, on a row that prints 4-5; the record reads the two as separate alternatives of BIOL
        100, so its low end takes one of them alone and falls short. With the pair read as one alternative at the
        row's 5 the courses add to the printed 35-40. S727 held it for two gaps at once; List A's six lecture and
        lab combinations already add to their printed 4-8 as the scorer reads them, so the pair is its one gap.

HELD (2):
  30746  not collectable: coverage fails. The state's list names PSY 200, which the record does not place and no
         note explains, and today's capture does not find it on the page either. A page read that says whether the
         page prints it is its lever (a reread).
  43553  the catalog's own figures: its two lists print 26-29 and 6-8, which add to 32-37 under a printed total of
         35-41, and no note names the difference. total_differs is filed only from a page read
         (kb/program_total_differs.json), and noted_figures_differ needs a note that quotes both figures.

    python3 kb/_program_piles_s739_sbcc.py --dry-run
    python3 kb/_program_piles_s739_sbcc.py --tag s739d

Guard: tests/program_piles_s739_sbcc_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s727_sbcc as PRIOR  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Santa Barbara City College"
SLUG = "santa_barbara_city"
TAG = "s739d"
HELD_BY = "kb/receipts/program_requirement_records_piles_s727_sbcc_2026-11-25_s727d.json"
KEYS = ("19012", "30746", "43553", "45452", "46520")

_LEVER = ("a substitution-list reading on a reconcile passes it (S727's reason, the lever Orange Coast 32737 waits "
          "on); a reconcile's rescore drops the gap when it does")
REVIEWED = {
    "19012": {"gap": "lists_not_closed", "computed": [19, 19], "stated": [19, 21],
              "words": "The List of Electives is not separately required: students may substitute up to two elective "
                       "courses for two of the four Professional Writing Emphasis courses",
              # Without the list today's scorer passes it: 19 against the printed 19-21 (short_high: the emphasis block
              # prints 12-14 and its courses print no units of their own).
              "ops": [("drop", "List of Electives")], "closes": "passes", "shape": ["open"], "open": "List of Electives",
              "lever": _LEVER},
    "46520": {"gap": "lists_not_closed", "computed": [20, 20], "stated": [20, 20],
              "words": "The Substitution Courses block is not an additional requirement: it lists approved "
                       "substitutions only for students who place out of a core course",
              "ops": [("drop", "Substitution Courses")], "shape": ["open"], "open": "Substitution Courses",
              "lever": _LEVER},
    "45452": {"gap": "pair_read_as_alternatives", "computed": [33, 40], "stated": [35, 40],
              "words": "both BIOL 140 and BIOL 141 recorded as alternatives to BIOL 100 but must be completed as a "
                       "pair",
              "ops": [("pair", "BIOL 100", ["BIOL 140", "BIOL 141"], 5)],
              "courses": ["BIOL100", "BIOL140", "BIOL141"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "30746": ("held: not collectable: coverage fails (collected_with_gaps, kb/_harvest_gap_census.py). The state's list "
              "names PSY 200, which the record does not place and no note explains (ANTH 110 is explained), and "
              "today's capture does not find it on the page: a page read that says whether the page prints it (a "
              "reread)"),
    "43553": ("held: the catalog's own figures: its two lists print 26-29 and 6-8, which add to 32-37 under a printed "
              "total of 35-41, and no note names the difference. total_differs is filed only from a page read "
              "(kb/program_total_differs.json), and noted_figures_differ needs a note that quotes both figures: a "
              "page read"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Santa Barbara City", prior=PRIOR, keys=KEYS, reviewed=REVIEWED,
           hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
