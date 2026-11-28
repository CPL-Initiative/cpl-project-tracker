#!/usr/bin/env python3
"""S748, worker gaps at Mt. San Antonio: the 14 filed records the gap census counts as failing, read by key.

The harvest gap census of 2026-11-28 00:44Z (run 46089216929, kb/status/harvest_gap_census.json) counts 83 of
Mt. San Antonio's active programs without a passing record: 41 with no closed list in the state's file, 28 whose
page the capture did not find, and 14 with a filed record that fails (13 units unequal, 1 units incomplete). The 14
are read here, by key, from the committed records and their notes. Sam's ruling
(sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap named and a lower score on
the 0-100 bar, never held for another night. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below):
  44520  Histotechnology B.S., noted_no_total (40): the note says the catalog states no single total for the major
         (lower division 46-47, upper division 39, a degree total of 128-129 with general education), and the
         record states none.
  37603  Hospitality Management A.S.-T, lists_not_closed (30): List B's figure depends on the List A choice (the
         note: 'Students who choose HRM 52 for List A must choose a minimum of 7 units in List B'), and List B
         also takes any course not used in List A, so the lists add to 17-22 under the printed 18-22.

HELD (12), each reason in HAND. Eight pass under today's scorer (their filed arithmetic is an older scorer's): a
record today's scorer passes is never gap-filed, and a free reconcile of the college rescores them
(program-requirements-college.yml, step reconcile, extract 0; then the conductor's reread). Four carry a list
shape no filed kind's own check reads from the record.

    python3 kb/_program_piles_s748g1.py --dry-run     # the batch this pile is in

Guard: tests/program_piles_s748g1_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s742 as B9  # noqa: E402

B, NG = B9.B, B9.NG
COLLEGE = "Mt. San Antonio College"
SLUG = "mt_san_antonio"
TAG = "s748g1"
HELD_BY = "kb/status/harvest_gap_census.json (run 46089216929, the census of 2026-11-28 00:44Z)"
# Today's scorer passes these eight on the committed record and the state's list (kb/_program_piles_s739.py
# arithmetic): their lever is the free reconcile, never a gap.
RESCORE = ("02990", "08045", "16544", "30762", "36697", "39709", "39710", "44689")
KEYS = ("02990", "08045", "10180", "16544", "18242", "30762", "31865", "36697", "37603", "38731", "39709", "39710",
        "44520", "44689")

REVIEWED = {
    "44520": {"gap": "noted_no_total", "computed": [85, 86], "stated": None, "shape": ["no_total"],
              "words": "The catalog states no single total for the major"},
    "37603": {"gap": "lists_not_closed", "computed": [17, 22], "stated": [18, 22], "shape": ["depends"],
              "depends": "List B",
              "words": "Students who choose HRM 52 for List A must choose a minimum of 7 units in List B",
              "also_words": "or any course not already used in List A"},
}
_RESCORE = ("held: today's scorer passes it (the filed arithmetic is an older scorer's), so no gap is filed; the "
            "free reconcile of the college rescores it and a reread posts it")
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({cn: _RESCORE for cn in RESCORE})
HAND.update({
    "10180": "held: 'Select additional 9 units from any course not already used in category 1, 2, or 3' is a "
             "fourth choice the record's three lists do not hold (9 against 18); a reconcile step is its lever",
    "18242": "held: one 18-22 unit rule spans six groups the record keeps at a minimum of 0 each (0 against "
             "18-22); pool_figure_not_read's check wants the pool's figure on a list, and none carries it",
    "31865": "held: MUS 160 is taken to 2 units and the ensembles over four semesters (19.5-23.5 against 21-25), "
             "repeat_read_once's shape; the kind's check is a reading (ops) no hand has written and proved here",
    "38731": "held: 'Required Electives 11-15' covers three tracks of which one is taken, and the record adds the "
             "tracks' own minimums (27-37 against 33-37); pool_figure_not_read's check wants the pool's figure on "
             "a list, and the note says none carries it",
})

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Mt. San Antonio", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
