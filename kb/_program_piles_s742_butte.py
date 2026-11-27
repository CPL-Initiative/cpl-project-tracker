#!/usr/bin/env python3
"""S742, lane 2's cheap piles at Butte: the two records s740h held, one collected with a named gap.

S740's plan (kb/_program_piles_s740_butte.py, s740h) held 01312 and 14583. The conductor's live read of 2026-11-27
07:31Z (kb/receipts/program_requirements_reread_s741_piles_checked.json) holds 01312's live row at its committed run
(42973457189). Free page read 46003175201 (kb/college_reads/s742_piles_butte_real_estate.json, the capture's own calls
for the entry) prints the page's map row by row. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  degree_electives_not_printed (50)  01312  Real Estate A.S. The major adds to its printed 39-40 ('Required courses:
        39.00- 40.00'), general education is the Local pattern's 21 (Butte's reconcile step), and the two add to
        60-61 under the 62-69 the record takes from 'Map (Butte GE)'. The map's rows, as the page read prints them:
        the major's courses and three 'Select one' groups, seven general education area choices ('Area 1A Choice (See
        GE Guide) 3.00- 4.00' and so on, Area 4 with 'Only necessary if not already met.') and 'Graduation
        Requirement Choice (See GE Guide) 2.00', 'Department recommends BUS 62.' No row is an elective, and no line
        says electives fill the degree. The kind's own check is S721's degree_rest (the major passes, the general
        education units were read, the two fall short of the printed degree total at both ends, no electives figure
        and no word that electives fill the rest). S721 named this kind for the record before the kind was on main
        (tests/program_piles_s721_butte_test.py); S740 held it. Both of the record's notes are filed: the one that
        says where the 62-69 comes from, and the one on the map's 2-unit Graduation Requirement line, which Butte's
        reconcile step keeps out of general education by S636's call and which is the 2 units between the record's
        60 and the map's 62.

HELD (1), its reason in HAND:
  14583  Registered Nursing A.S.: read from the Accelerated Track's page (43185's). S741 pinned it to its own page
         (site_pages, node 28324); the free capture and a paid read follow.

    python3 kb/_program_piles_s742a.py --dry-run     # the batch this pile is in

Guard: tests/program_piles_s742a_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s721_paloverde as PV  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402

B, NG = B9.B, B9.NG
COLLEGE = "Butte College"
SLUG = "butte"
TAG = "s742a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s740_butte_2026-11-26_s740h.json"
KEYS = ("01312", "14583")
PAGE_READ = "46003175201"
RUN = "42973457189"


def degree_rest(filed: dict, e: dict) -> bool:
    """degree_electives_not_printed: S721's own check (kb/_program_piles_s721_paloverde.py degree_rest)."""
    return PV.degree_rest(filed)


def _break_degree_rest(g: dict, e: dict) -> dict:
    """The degree's sum at its printed total: nothing is short, and the shape names nothing."""
    g["score"]["arithmetic"]["computed"] = list(g["score"]["arithmetic"]["stated"])
    return g


REVIEWED = {
    "01312": {"gap": "degree_electives_not_printed", "computed": [60, 61], "stated": [62, 69],
              "words": "degree_total 62-69 is taken from the 'Map (Butte GE)' semester plan ('Units: 62.00- 69.00')",
              "also_words": "The map's Graduation Requirement Choice (2 units, GE) notes 'Department recommends BUS "
                            "62'",
              "shape": ["degree_rest"],
              "page": "the entry's own rows: 'Required courses: 39.00- 40.00'; 'Area 2 Choice (See GE Guide) 3.00- "
                      "5.00', 'Area 1A Choice (See GE Guide) 3.00- 4.00', 'Area 1B/C Choice (See GE Guide) 3.00', "
                      "'Area 4 Choice (See GE Guide) 3.00', 'Only necessary if not already met.', 'Area 3 Choice (See "
                      "GE Guide) 3.00- 4.00', 'Area 5 Choice (See GE Guide) 3.00- 5.00', 'Area 6 Choice (See GE "
                      "Guide) 3.00', 'Graduation Requirement Choice (See GE Guide) 2.00', 'Department recommends BUS "
                      "62.'; terms of 15.00- 17.00, 15.00 and 17.00- 20.00 with the first; no elective row"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "14583": ("held: an incomplete read from the Accelerated Track's page (43185's, whose heading names program code "
              "43185). S741 pinned it to its own page (site_pages, node 28324, 'AS Degree in Registered Nursing'): "
              "the free capture that shows the pin binds, then a paid read"),
})

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Butte", prior=B9.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"degree_rest": degree_rest},
            breaks={"degree_rest": _break_degree_rest})
