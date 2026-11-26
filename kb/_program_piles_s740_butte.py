#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Butte: the three records s721e still holds, one collected with a named gap.

S721's plan (kb/_program_piles_s721_butte.py, s721e) held 12 records; nine pass since (S727's reconcile step for the
map's 'Only necessary if ...' line), and three still fail: 01312, 14583 and 33579. Sam's ruling, as
kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and a lower score,
never held, unless the record is not the program's own. A named gap must be true of its record. The three are read
again here, by key, from the committed records and their notes. No catalog read, no reconcile, no record changed, no
new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  required_list_outside_total (70)  33579  Agriculture Business A.S.-T: the requirements print AGS 20 / AGS 40 as a
        'Select one' of their own, which the record counts, and print 'Total : 23.00', which leaves that list out
        (the page's map lists the two courses inside List A, its note says). Without the list the courses add to the
        printed 23. S721 held it for a reread to settle which placement is the program's; the gap says what the
        requirements print, and both notes are filed.

HELD (2), each reason in HAND:
  01312  Real Estate A.S.: the major adds up, and the degree's 60-61 falls short of the map's 62-69 (s721e's reason,
         unchanged: Butte's reconcile step keeps the map's Graduation Requirement line out by S636's call); no
         kind's sentence is true of a sum below its printed range.
  14583  an incomplete read on a page read for 43185 too, whose heading names 43185 (s721e's reason, unchanged).

    python3 kb/_program_piles_s740_butte.py --dry-run
    python3 kb/_program_piles_s740_butte.py --tag s740h

Guard: tests/program_piles_s740_butte_test.py.
"""
from __future__ import annotations

import copy
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B, NG, S = B7.B, B7.NG, B7.S
COLLEGE = "Butte College"
SLUG = "butte"
TAG = "s740h"
HELD_BY = "kb/receipts/program_requirement_records_piles_s721_butte_2026-11-24_s721e.json"
KEYS = ("01312", "14583", "33579")


def without_list(filed: dict, e: dict) -> bool:
    """required_list_outside_total, where the list shares its name with another (two 'Select one' lists, so no op
    can name it): the list at e["list"], its place among the record's lists, holds exactly the entry's courses
    (e["courses"]); and with that list left out today's scorer gives the printed total at both ends."""
    rec = copy.deepcopy(filed.get("record") or {})
    bl = rec.get("blocks") or []
    if e["gap"] != "required_list_outside_total" or e["list"] >= len(bl):
        return False
    held = {S.norm_code(c.get("code")) for c in bl[e["list"]].get("courses") or []}
    if held != {S.norm_code(c) for c in e["courses"]}:
        return False
    del bl[e["list"]]
    return B.closes(filed, rec)


REVIEWED = {
    "33579": {"gap": "required_list_outside_total", "computed": [26, 26], "stated": [23, 23],
              "shape": ["without_list"], "list": 3, "courses": ["AGS 20", "AGS 40"],
              "words": "The map lists AGS 20 and AGS 40 within List A, whereas the requirements list them as a "
                       "separate 'Select one'; the requirements section was followed",
              "also_words": "The 23.00 printed beside 'Required courses:' and 'Total : 23.00' is the major total"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "01312": ("held: the major adds up, and the degree's 60-61 falls short of the map's 62-69; the map's 2-unit "
              "Graduation Requirement line closes the low end only, and Butte's reconcile step keeps that line out by "
              "S636's call; no kind's sentence is true of a sum below its printed range"),
    "14583": ("held: an incomplete read (the requirements table is not in the text read; HELD_INCOMPLETE), on a page "
              "read for 43185 too, whose section heading names program code 43185: the own-section guard"),
})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Butte", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"without_list": without_list})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
