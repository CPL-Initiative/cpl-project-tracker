#!/usr/bin/env python3
"""S739, lane 2's cheap piles at American River: the seven records s727b held, five collected with their gaps named.

S727's plan (kb/_program_piles_s727_arc.py, s727b) collected 12 of the census's 19 wording-rule records and held seven,
each for a reason Sam's ruling no longer takes as a hold (kb/_program_piles_s739.py: a record held for a gap is
collected with its gap named and a lower score, never held, unless the record is not the program's own). The seven are
read again here, by key, from the committed records, their notes and today's capture. No catalog read, no reconcile, no
record changed, no new kind.

COLLECTED (5), each entry in REVIEWED:
  07207  option_lists_read_apart (40)  CIS: Computer Programming A.S., its own page (p.431, no other program read from
         it). The Java concentration is two lists (its required courses and 'A minimum of 3 units') kept in one option
         group with C++'s list, and the page prints a total for each concentration (C++ 19-21, Java 18-20) and none
         for the award. S727 held it because its note says the text 'does not explicitly say select one': the gap
         files that note too, so the reading is named as the reader's.
  12238  option_lists_read_apart (40)  CIS: Computer Networking Management A.S.: three concentrations (CISCO, Linux,
         Windows) of two lists each in one option group, a printed total for each and none for the award. Read from
         p.429 with 07206 (CIS: Microcomputer Applications A.A.). S727 held it for want of a note naming its own
         section; its section_heading is 'A.S. in CIS: Computer Networking Management', the capture found that
         heading on the pages read (heading_named), and 07206's record carries another (own_heading).
  12191  unit_line_not_read (40)       Site Supervisor certificate: the page prints 'A minimum of 23 units from the
         following: 23', a line of units with no course named, which the record leaves out; with it the 37 units of
         courses add to the printed 60. S727 held it on the cheaper lever (a unit_line reconcile step keyed on that
         line passes it): the lever is named in the receipt, and a reconcile's rescore drops the gap when it passes.
  30595  heading_not_in_text (20)      Psychology A.A.-T: the record's own section_heading says the AA-T heading is
         'on the page before 852, not in the text'; its first block is 'Required Program (continued from previous
         page)', and its four unplaced courses are explained as cut off before page 852. It adds to 12-13 against the
         printed 18-19. Its record carries no note, so the gap files the heading's own words. Read from p.852 with
         19330 (Political Science A.A.), whose record holds another course list (own_list).
  39341  heading_not_in_text (20)      Refrigeration Service Technician Apprenticeship certificate: the text begins
         mid-table on p.211 and its heading is not in it; the first list's rule is on the page before, so the record
         adds to 99 against the printed 48. The same text was read for 39731 (Level I) and 39732 (Level II), and the
         three records hold one course list; the printed 48 sits inside this award's band (30 to fewer than 60 units)
         and outside both of theirs (own_list, by the award's own unit band).

HELD (2), not the program's own: 39731 (Level I, 8 to fewer than 16 units) and 39732 (Level II, 16 to fewer than 30)
were read from the section whose printed total is 48, which fits neither award; their own notes say so. Each needs
its own section found: a page read.

    python3 kb/_program_piles_s739_arc.py --dry-run
    python3 kb/_program_piles_s739_arc.py --tag s739a

Guard: tests/program_piles_s739_arc_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s727_arc as PRIOR  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "American River College"
SLUG = "american_river"
TAG = "s739a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s727_arc_2026-11-25_s727b.json"
KEYS = ("07207", "12191", "12238", "30595", "39341", "39731", "39732")

_UNIT_LINE_LEVER = ("an American River reconcile step of the unit_line kind, keyed on 'A minimum of 23 units from the "
                    "following: 23', passes it at 60 = 60 (S727's second reader, round 1); a reconcile's rescore "
                    "drops the gap when it passes")
REVIEWED = {
    "07207": {"gap": "option_lists_read_apart", "computed": [9, 22], "stated": None,
              "words": "The Java concentration is recorded as two blocks (required courses plus the 'minimum of 3 "
                       "units' choice), both in option_group 'Concentration'",
              "also_words": "though the text does not explicitly say 'select one'",
              "shape": ["option_lists", "no_total"]},
    "12238": {"gap": "option_lists_read_apart", "computed": [17, 31], "stated": None,
              "words": "the student completes every block of a single concentration",
              "also_words": "The catalog prints a separate Total Units for each concentration",
              "shape": ["option_lists", "no_total"],
              "own_heading": "A.S. in CIS: Computer Networking Management"},
    "12191": {"gap": "unit_line_not_read", "computed": [37, 37], "stated": [60, 60],
              "words": "The certificate also requires 'A minimum of 23 units from the following: 23'",
              "also_words": "37 + 23 = 60, matching the printed Total Units: 60",
              "ops": [("line", 23)], "lever": _UNIT_LINE_LEVER},
    "30595": {"gap": "heading_not_in_text", "computed": [12, 13], "stated": [18, 19],
              "words": "heading on the page before 852, not in the text", "words_at": "heading",
              "shape": ["heading_gone", "cut"], "own_list": True},
    "39341": {"gap": "heading_not_in_text", "computed": [99, 99], "stated": [48, 48],
              "words": "The extracted text begins mid-table on page 211; the program heading, description and the "
                       "heading/rule over the first course list are not present",
              "shape": ["heading_gone"], "own_list": True},
}
_OTHER_AWARD = ("held: not the program's own: read from the p.211 section text that 39341 and %s were read from, whose "
                "printed 'Total Units: 48' sits outside this award's band (%s); its own note says %s: a page read "
                "that finds its own section")
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "39731": _OTHER_AWARD % ("39732", "8 to fewer than 16 units",
                             "'The text may belong to the full Refrigeration Service Technician Apprenticeship "
                             "certificate rather than Level I'"),
    "39732": _OTHER_AWARD % ("39731", "16 to fewer than 30 units",
                             "'Printed total of 48 units does not fit the award category'"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="American River", prior=PRIOR, keys=KEYS, reviewed=REVIEWED,
           hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
