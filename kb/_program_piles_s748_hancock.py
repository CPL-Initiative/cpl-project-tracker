#!/usr/bin/env python3
"""S748, worker gaps at Allan Hancock: the 17 filed records the gap census counts as failing, read by key.

The harvest gap census of 2026-11-28 00:44Z (run 46089216929, kb/status/harvest_gap_census.json) counts 87 of
Allan Hancock's active programs without a passing record: 47 with no closed list in the state's file, 23 whose page
the capture did not find, and 17 with a filed record that fails (14 units unequal, 1 units incomplete, 2 placing
none of their courses). No cheap-piles plan ever read those 17: kb/collection_lane.py has held the college out of
every plan since S681, a hold no session lifted. They are read here, by key, from the committed records and their
notes. Sam's ruling (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap named and
a lower score on the 0-100 bar, never held for another night. No catalog read, no reconcile, no record changed, no
new kind, no new matcher.

COLLECTED WITH A NAMED GAP (7, REVIEWED below):
  05874  Dental Assisting A.S., ge_units_not_read (50), the record rule's own words: the major adds to its printed
         32.5, the degree names the AHC GE or Cal-GETC pattern, and no units were read for it.
  19928  Human Services: General certificate, lists_past_their_figure (the record rule's): the core list prints 22
         over nine courses that carry 24, and 22 with the 6-unit list gives the printed 28.
  30934  Floral Design (noncredit), hours_total_differs (the record rule's): the courses' hours add to 73-120
         against the printed 96 hours.
  31093  Clothing Construction (noncredit), hours_total_differs (the record rule's): 345-391 against the printed 368.
  12129  Mathematics: Physics A.A., noted_figures_differ (40): the note quotes 'A major of 26 units is required for
         the degree' and the requirements' 'Total : 25.0'; the record states the first and adds to the second.
  30363  Recreation Management A.S., noted_figures_differ (40): the note quotes 'A major of 21 units is required for
         the degree' and the page's 'Total : 19.0'; the record states 21 and adds to 19.
  40003  Basic Law Enforcement Academy certificate, units_within_printed_range (50): the page prints 21-22, the
         record adds to 22, and its note says the one unit is LE 310, required of self-sponsored students alone.

HELD (10), each reason in HAND: eight whose notes describe a nested or cross-counted list no filed kind's own check
reads from the record (a free page read is their next step), and Viticulture Levels 2 and 3, which place none of
their courses (the capture handed each another award's entry; kb/program_requirements_college/allan_hancock/
named_gaps_s730.json).

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
COLLEGE = "Allan Hancock College"
SLUG = "allan_hancock"
TAG = "s748g1"
HELD_BY = "kb/status/harvest_gap_census.json (run 46089216929, the census of 2026-11-28 00:44Z)"
KEYS = ("05874", "07176", "12129", "18574", "19904", "19928", "19936", "30363", "30934", "31093", "32611", "33594",
        "40002", "40003", "42208", "42210", "42487")

REVIEWED = {
    "05874": {"gap": "ge_units_not_read", "rule": True, "computed": [32.5, 32.5], "stated": [60, 67.5]},
    "19928": {"gap": "lists_past_their_figure", "rule": True, "computed": [30, 30], "stated": [28, 28]},
    "30934": {"gap": "hours_total_differs", "rule": True, "computed": [73, 120], "stated": [96, 96]},
    "31093": {"gap": "hours_total_differs", "rule": True, "computed": [345, 391], "stated": [368, 368]},
    "12129": {"gap": "noted_figures_differ", "computed": [25, 25], "stated": [26, 26], "shape": ["note_quotes"],
              "words": "Unit totals conflict: the page states",
              "quotes": {"stated": "'A major of 26 units is required for the degree'", "computed": "'Total : 25.0'"}},
    "30363": {"gap": "noted_figures_differ", "computed": [19, 19], "stated": [21, 21], "shape": ["note_quotes"],
              "words": "Totals conflict: the text states",
              "quotes": {"stated": "'A major of 21 units is required for the degree'", "computed": "'Total : 19.0'"}},
    "40003": {"gap": B9.WITHIN, "words_from": "figures", "shape": ["within"], "computed": [22, 22],
              "stated": [21, 22],
              "words": "LE 310 is required only for self-sponsored students; this explains the stated 21-22 unit "
                       "total range"},
}
_NEXT = "; a free page read of its own entry is the next step"
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "07176": "held: its note puts Categories A and B under one 15-unit figure with lab pairs inside, and no filed "
             "kind's own check reads that from the record (the lists add to 31-49 against 36)" + _NEXT,
    "18574": "held: every course row prints 0.0 units (the note calls it a display artifact), so the record adds to "
             "0 against 18; no_units_read names a course with no units, and these carry a printed 0" + _NEXT,
    "19904": "held: its note says two lists may be nested within Lists A and B (26-27 against 24), which is a "
             "reading of the page, never a figure the note quotes" + _NEXT,
    "19936": "held: its note nests three one-course choices inside the 15-unit list and a fourth inside the 34-unit "
             "core (57.5-59 against 49); a reconcile step is its lever, with the page read first",
    "32611": "held: the core prints '(14 units)' in its name and 12.0-17.5 in its column, and the area choice is "
             "one list in the record; today's scorer already passes its degree with the overlap reading" + _NEXT,
    "33594": "held: its note says List A and List B together total 10 units (47 + 3 + 7 against the major's 50), a "
             "pool no figure in the record holds" + _NEXT,
    "40002": "held: its note reads a one-course choice inside the 27-unit core from the Suggested Course Sequence "
             "(35-61 against 36)" + _NEXT,
    "42487": "held: MUS 170 at 0.5 units is taken four times (the note: 'A total of 2 units of MUS 170 is "
             "required'), repeat_read_once's shape; the kind's check is a reading (ops) no hand has written and "
             "proved here",
    "42208": "held: the record places none of its 17 listed courses; the capture handed it Viticulture Level 1's "
             "entry (named_gaps_s730.json), so it is not the program's own",
    "42210": "held: the record places none of its 20 listed courses; the capture handed it the Winemaking "
             "certificate's entry (named_gaps_s730.json), so it is not the program's own",
})

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Allan Hancock", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
