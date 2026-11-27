#!/usr/bin/env python3
"""S742, lane 2's cheap piles at Cabrillo: the six records s740d held, one collected with a named gap.

S740's plan (kb/_program_piles_s740_cabrillo.py, s740d) held six. The conductor's live read of 2026-11-27 07:31Z
(kb/receipts/program_requirements_reread_s741_piles_checked.json) holds 45306's and 11293's live rows at their
committed run (44090886950), the proof S740 lacked. Free page read 46001469210
(kb/college_reads/s742_piles_cabrillo_spanish.json and s742_piles_cabrillo_recommended.json, each page's own content
call) prints the pages word for word. The six are read again here, by key. No catalog read, no reconcile, no record
changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  lists_not_closed (30)  45306  Spanish Intermediate Proficiency certificate. The page prints 'Complete the following
        number of credits: 16' over two lists: 'Required', 'Complete the following number of credits: 13-15',
        'Students must take a minimum of 3 courses in Spanish' (six courses at 4 or 5 units); and 'Electives',
        'Complete the following number of credits: 1-3'. The lists' own figures add to 14-18 around the printed 16:
        the electives a student needs are what the Spanish courses leave of the 16 (13 and 3, 14 and 2, 15 and 1),
        so the Electives figure depends on the other choice and the lists alone do not add the program's units. The
        stray '4 - 5' its note names is the unit range printed beside the Spanish courses' sentence, no figure of the
        list. Both of the record's notes on the two figures are filed. S740 held it for that unread '4 - 5' and for
        the live run.

HELD (5), each reason in HAND:
  06352, 06380, 06381, 44992  every list is headed 'Recommended' and read as counting nothing. The page read shows
         the page counts each at its figure ('Psychology - Associate in Arts (A.A.)', 'Complete the following number
         of credits: 60', 'Cabrillo College General Education 24', 'Recommended Major Requirements', 'Complete the
         following number of credits: 3', and so on), and with the lists read as units to choose today's scorer
         passes all four: a reconcile step that reads them so, then a free reconcile and a reread. No gap is true of
         a list the page counts.
  11293  Art Studio A.A.: read with the same lists counted, it adds to 49-58 under the printed 60; the page prints
         'Recommended Major Electives', 'Complete the following number of credits: 9-14', one focus, over focus
         lists the record holds as separate options. No filed kind's own check names it (option_lists_read_apart's
         does not): the same reconcile, then a second look.

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
COLLEGE = "Cabrillo College"
SLUG = "cabrillo"
TAG = "s742a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s740_cabrillo_2026-11-26_s740d.json"
KEYS = ("06352", "06380", "06381", "11293", "44992", "45306")
PAGE_READ = "46001469210"
RUN = "44090886950"

REVIEWED = {
    "45306": {"gap": "lists_not_closed", "computed": [14, 18], "stated": [16, 16],
              "words": "Electives block: 'Complete the following number of credits: 1-3'; minimum recorded as 1",
              "also_words": "Required block: catalog says 'Complete the following number of credits: 13-15'",
              "shape": ["depends"], "depends": "Electives",
              "page": "the page's content call: 'Spanish Intermediate Proficiency Certificate of Achievement', 'Complete "
                      "the following number of credits: 16'; 'Required', 'Complete the following number of credits: "
                      "13-15', 'Students must take a minimum of 3 courses in Spanish 4 - 5' over SPAN1 5, SPAN2 5, "
                      "SPAN3 5, SPAN4 5, SPAN3S 4, SPAN17 4; 'Electives', 'Complete the following number of credits: "
                      "1-3'"},
}
_RECOMMENDED = ("held: every list is headed 'Recommended' and read as counting nothing, so the record adds to general "
                "education alone. College page read " + PAGE_READ + " shows the page counts each list at its figure "
                "(under 'Complete the following number of credits: 60': 'Cabrillo College General Education 24', then "
                "each 'Recommended' list with its own 'Complete the following number of credits: N'), and with the "
                "lists read as units to choose today's scorer passes it. No gap is true of a list the page counts: a "
                "reconcile step that reads the lists so, then a free reconcile and a reread")
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({cn: _RECOMMENDED for cn in ("06352", "06380", "06381", "44992")})
HAND.update({
    "11293": ("held: read with its 'Recommended' lists counted, it adds to 49-58 under the printed 60. College page "
              "read " + PAGE_READ + " prints 'Recommended Major Electives', 'Complete the following number of credits: "
              "9-14' over the focus lists, which the record holds as separate options; no filed kind's own check "
              "names it (option_lists_read_apart's does not). The Recommended reconcile step, then a second look"),
})

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Cabrillo", prior=B9.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)
