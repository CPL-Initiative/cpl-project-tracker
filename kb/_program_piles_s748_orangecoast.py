#!/usr/bin/env python3
"""S748, lane 2's cheap piles at Orange Coast: the six records s741b held and left, one collected with a named gap.

S741's plan (kb/_program_piles_s741_orangecoast.py, s741b) held 03993, 08663, 08670, 32790, 36032, 42331 and 43100;
s741f collected 32790. The other six are read again here, by key. S741's second free page read 45955333186
(kb/college_reads/s741_piles_orange_coast_figures.json, each page as the capture reads it) prints the Dance A.A.
page's REQUIREMENTS tab line for line; its lines are committed in that plan file under the run. No catalog read, no
reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  figure_within_variable_units (60)  03993  Dance A.A. The page prints eight core rows, seven at fixed units that add
        to 13 and 'DANC A211 Repertoire I 1-4', then 'Select four units of the following: 4' and 'Program Major Units
        20': 18-21 around the printed 20, and no line says how many of its 1-4 units the major takes. With DANC A211
        at 3 the courses add to the printed 20 at both ends (the kind's own check, as S739 read Gavilan 06128 and
        S740 San Jose City 22241: one figure printed over the program's lists, a variable-unit course under it). No
        note of the record names the course's range (S741 held it for that); the page read's line does, and the
        words filed are the page's. No other record was read from its page.

HELD (5), each reason in HAND:
  08663  Food and Beverage Management certificate: not the program's own page; its pin binds in free capture
         45999669017 and the paid read (only 08663,08626; force 08626) is the conductor's.
  08670  Advanced Culinary Arts A.S.: 62.5-63.5 inside the printed 60-63.5, whose low end the page prints as a
         minimum: a scorer reading, S741's reason.
  36032  Global Studies A.A.-T: the degree reads 55-64 around the printed 60 with electives that fill it, the
         shape of East Los Angeles 31017: no filed kind is true of a sum on both sides of its printed total.
  42331  Residential Electrical certificate: today's scorer passes it on its record; a closed-list rescore.
  43100  Athletic Training Level 2 certificate: coverage fails on PSYC A160, which its page does not print.

    python3 kb/_program_piles_s748b.py --dry-run     # the batch this pile is in

Guard: tests/program_piles_s748b_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740_sjcc as SJCC  # noqa: E402
import _program_piles_s741_orangecoast as S741  # noqa: E402
import _program_piles_s748 as B10  # noqa: E402

B, NG = B10.B, B10.NG
COLLEGE = "Orange Coast College"
SLUG = "orange_coast"
TAG = "s748b"
HELD_BY = "kb/receipts/program_requirement_records_piles_s741_orange_coast_2026-11-27_s741b.json"
KEYS = ("03993", "08663", "08670", "36032", "42331", "43100")
PAGE_READ = "45955333186"
PLAN = "kb/college_reads/s741_piles_orange_coast_figures.json"
REPERTOIRE = "DANC A211 Repertoire I 1-4"


def variable_course(filed: dict, e: dict) -> bool:
    """figure_within_variable_units, one figure printed over the program's lists: S740's own check
    (kb/_program_piles_s740_sjcc.py variable_course: the named course prints a range of units, and the printed total
    falls strictly inside the record's sum)."""
    return SJCC.variable_course(filed, e)


def _break_variable(g: dict, e: dict) -> dict:
    """The course at one fixed figure: nothing is variable, and the shape names nothing."""
    for row in B.course_rows(g, e["variable"]):
        row["units_max"] = None
    return g


REVIEWED = {
    "03993": {"gap": "figure_within_variable_units", "computed": [18, 21], "stated": [20, 20],
              "words_at": "page_read", "words": REPERTOIRE,
              "page_read": {"plan": PLAN, "run": PAGE_READ, "line": "repertoire"},
              "ops": [("units", "DANC A211", 3)], "shape": ["variable_course"], "variable": "DANC A211",
              "courses": ["DANCA211"],
              "page": "the REQUIREMENTS tab, as the capture reads it: 'Core Courses', 'DANC A150 Dance Improvisation "
                      "I 1', 'DANC A250 Dance Improvisation II 1', 'DANC A170 Music for Dancers 2', 'DANC A143 Jazz "
                      "Dance III 2', 'or DANC A243 Jazz IV', 'DANC A144 Ballet III 2', 'or DANC A244 Ballet IV', "
                      "'DANC A145 Contemporary/Modern Dance 3 2', 'or DANC A245 Contemporary/ Modern Dance 4', 'DANC "
                      "A160 Dance Composition/Choreography I 3', 'DANC A211 Repertoire I 1-4', 'or DANC A203 "
                      "Performing Dance Ensemble I'; 'Restricted Electives', 'Select four units of the following: "
                      "4'; 'Program Major Units 20'"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "08663": S741.HAND["08663"] + ". S742's free capture 45999669017 binds the pin (coverage 0.6); the paid read "
                                  "(only 08663,08626; force 08626) is the conductor's",
    "08670": S741.HAND["08670"],
    "36032": S741.HAND["36032"] + ". The shape of East Los Angeles 31017: no filed kind is true of a sum on both "
                                  "sides of its printed total",
    "42331": S741.HAND["42331"],
    "43100": S741.HAND["43100"] + ". College page read " + PAGE_READ + " prints its page with no PSYC A160 on any "
                                  "line: a reading that files the missing course's reason, then a reread",
})

W = B10.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Orange Coast", prior=B10.LiveRead(COLLEGE, SLUG), keys=KEYS,
             reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"variable_course": variable_course},
             breaks={"variable_course": _break_variable})
