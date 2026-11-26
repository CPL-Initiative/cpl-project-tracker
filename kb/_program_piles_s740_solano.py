#!/usr/bin/env python3
"""S740, lane 1 (the census's reconcile_steps lever) at Solano: 14 records, 6 passed by the reconcile, 3 with named gaps.

The census on main (kb/status/harvest_gap_census.json, written 2026-11-26 12:06Z) lists 14 Solano Community College
records under the reconcile_steps lever. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap
is collected with its gap named and a lower score, never held, unless the record is not the program's own.

THE RECONCILE FIRST. Solano's reconcile entry (kb/program_requirements_reconcile.json, S740) reads SOCI 002, 023, 040,
045 and 075 as the file's SOC rows, each quoted from its course description's '(Formerly SOC 0nn)' (college-page-read
run 45835049303, PDF page 430). The free reconcile 45840125172 rescored the filed records on the branch: 06555, 08337,
19450, 30678, 35213 and 43144 pass, and its reread posts them. They are no keys here (PASSED_BY_RECONCILE): the plan's
keys are the lever's other eight.

COLLECTED WITH A NAMED GAP (3, REVIEWED below), from the committed records, their notes and today's capture:
  pool_figure_not_read (40)  06559 Science, General A.A.: 'Required Major Total Units minimum of 18' over the Biological
        Science and Physical Science lists together, read as one course from each; as one list at 18 the record adds
        to the printed 18.
  noted_figures_differ (40)  37919 Dance A.A.: 'Required Major Total Units 19' against listed lines that add to 22; its
        note quotes both.
  total_not_printed (40)     32917 Psychology A.A.-T: the section prints its lists and no major total, read from the
        page itself (the same read, PDF page 413; kb/program_total_not_printed.json). The record rule names it.

HELD (5):
  30184, 30185  Mechatronics A.S. and its certificate: one section, 'Mechatronics Certificate of Achievement and
         Associate in Science', printed for both awards, and each record was read from it. A heading that names both
         awards shows neither record its own (the own-page guard, S739's third reader); each note quotes 'Required
         Major Total Units is printed as 37' against courses that add to 36, so noted_figures_differ is the gap once
         the guard reads a section printed for two awards as each one's own.
  43134  World Languages A.A.: the state's file lists the program twice (06538 and 43134), and both records were read
         from the one World Languages section; nothing in the committed files shows the page to be 43134's own. Which
         control number the section is is the inventory's call.
  38591  American Sign Language A.A.: not shown to be the program's own. Its own note says the state's list (ASL 53,
         54, 57) 'matches the separate ASL/English Interpreter Training Certificate of Achievement and Associate in
         Arts section on page 343 more closely than this section'. A page pin and a paid reread are its lever.
  42041  Social Work and Human Services A.A.-T: the reconcile's rescore reads its course list (SOCI 002) and it still
         names no total; its section prints none (the same read, PDF page 303). It takes total_not_printed once the
         reread of run 45840125172 posts its row: the plan after that reread lists it.

    python3 kb/_program_piles_s740_solano.py --dry-run
    python3 kb/_program_piles_s740_solano.py --tag s740c2

Guard: tests/program_piles_s740_solano_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Solano Community College"
SLUG = "solano_community"
TAG = "s740c2"
HELD_BY = "kb/status/harvest_gap_census.json (reconcile_steps at Solano Community College, written 2026-11-26 12:06Z)"
RECONCILE = "45840125172"
PASSED_BY_RECONCILE = ("06555", "08337", "19450", "30678", "35213", "43144")
LEVER = ("06555", "06559", "08337", "19450", "30184", "30185", "30678", "32917", "35213", "37919", "38591", "42041",
         "43134", "43144")
KEYS = tuple(cn for cn in LEVER if cn not in PASSED_BY_RECONCILE)
LISTS = ["Biological Science", "Physical Science"]

REVIEWED = {
    "06559": {"gap": "pool_figure_not_read", "computed": [2.5, 10], "stated": [18, 18],
              "words": "Blocks record only the one-course minimum per area; the 18-unit total and 12-lab-unit "
                       "requirement apply across both lists",
              "ops": [("pool", LISTS, 18)]},
    "37919": {"gap": "noted_figures_differ", "computed": [22, 22], "stated": [19, 19],
              "words": "The catalog prints 'Required Major Total Units 19', but the listed lines sum to 22",
              "shape": ["note_quotes"], "quotes": {"stated": "Required Major Total Units 19", "computed": "sum to 22"}},
    "32917": {"gap": "total_not_printed", "computed": [19, 20], "stated": None, "rule": True},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
_MECH = ("held: one section, 'Mechatronics Certificate of Achievement and Associate in Science', printed for both "
         "awards, and its page-mate %s was read from it too: a heading that names both awards shows neither record its "
         "own (the own-page guard). Its note quotes 'Required Major Total Units is printed as 37' against courses that "
         "add to 36: noted_figures_differ once the guard reads a section printed for two awards as each one's own")
HAND.update({
    "30184": _MECH % "30185",
    "30185": _MECH % "30184",
    "43134": ("held: the state's file lists World Languages A.A. twice (06538 and 43134), and both records were read "
              "from the one World Languages section; nothing in the committed files shows the page to be 43134's own "
              "and not 06538's: which control number the section is is the inventory's call"),
    "38591": ("held: not shown to be the program's own: its own note says the state's list 'matches the separate "
              "ASL/English Interpreter Training Certificate of Achievement and Associate in Arts section on page 343 "
              "more closely than this section'; a page pin and a paid reread are its lever"),
    "42041": ("held: the reconcile's rescore reads its course list and it still names no total; its section prints "
              "none (college-page-read run 45835049303, PDF page 303). It takes total_not_printed once the reread of "
              "run %s posts its row: the plan after that reread lists it" % RECONCILE),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Solano", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
