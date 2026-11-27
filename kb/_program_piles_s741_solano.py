#!/usr/bin/env python3
"""S741, lane 1 (keys) at Solano: the four records S740 left held on the own-page guard, 3 collected with a named gap, 1 held.

Plan s740c2 (kb/_program_piles_s740_solano.py) held Mechatronics A.S. 30184 and its certificate 30185, World
Languages A.A. 43134 and American Sign Language A.A. 38591, each on a question about whose section the record was read
from. College page read 45953233659 (kb/college_reads/s741_keys_solano_pages.json) prints each section line for line
from the 2026-27 catalog PDF, free. Sam's ruling (sam-collect-with-gaps-2026-11-17): a record with a true gap is
collected with the gap named and a lower score on the 0-100 bar, unless the record is not the program's own. No
catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (3, REVIEWED below), total_differs (50), each listed with its page's two figures in
kb/program_total_differs.json and read exactly by its record, so the record rule names the gap:
  30184, 30185  Mechatronics A.S. and certificate (PDF p.118): ten required courses at 3 units and '6 units from List
         A ... 6' add to 36 under 'Required Major Total Units 37'. One section, headed 'Mechatronics', 'Certificate of
         Achievement and Associate in Science', is printed for both awards, and the page says so in words: 'The
         Associate in Science Degree can be obtained by completing the 37-unit major, the general education
         requirements, and electives as needed to complete a minimum of 60 units. The Certificate of Achievement can
         be obtained by completing the 37-unit major.' Each record's own note names the section as serving its award
         (the own-page guard's own_section). S739's third reader held a heading that names both awards as showing
         neither sister its own (Palomar's 'A.A. Degree Major or Certificate of Achievement', the own_heading form);
         here the showing is the page's sentence and the record's note, never the heading.
  38591  American Sign Language A.A. (PDF p.342): the one list, 'American Sign Language (select 18 units)' over nine
         3-unit courses, under 'Required Major Total Units 27' and 'the 27-unit major'. S740 held it as not shown to
         be the program's own, on its note that the state's list (ASL 53, 54, 57) matches the ASL/English Interpreter
         Training section more closely. The page read settles it: p.342 is headed 'American Sign Language',
         'Associate in Arts', the program's title and award; the interpreter awards (36455, 36457) have their own
         section on p.343 and their own records; no other record was read from p.342. The section is whole on the
         page, so the record's guess that part of the table is missing does not stand: the page's own figures differ.

HELD (1):
  43134  World Languages A.A.: the state's file lists the award twice (06538 and 43134), and both records were read
         from the one section on p.341. Nothing on the page tells one control number from the other (as Long Beach
         City 43021 and 02677, which the guard leaves unshown). Which control number the section is is the
         inventory's call.

    python3 kb/_program_piles_s741_solano.py --dry-run
    python3 kb/_program_piles_s741_solano.py --tag s741k4

Guard: tests/program_piles_s741_solano_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Solano Community College"
SLUG = "solano_community"
TAG = "s741k4"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_solano_community_2026-11-26_s740c2.json"
PAGE_READ = "45953233659"
KEYS = ("30184", "30185", "38591", "43134")
_BOTH = ("PDF p.118: 'Mechatronics', 'Certificate of Achievement and Associate in Science'; 'The Associate in Science "
         "Degree can be obtained by completing the 37-unit major, the general education requirements, and electives "
         "as needed to complete a minimum of 60 units. The Certificate of Achievement can be obtained by completing "
         "the 37-unit major.'; ten required courses at 3; '6 units from List A ... 6'; 'Required Major Total Units "
         "37'")

REVIEWED = {
    "30184": {"gap": "total_differs", "computed": [36, 36], "stated": [37, 37], "rule": True,
              "own_section": "the same requirements list appears to serve both awards", "page": _BOTH},
    "30185": {"gap": "total_differs", "computed": [36, 36], "stated": [37, 37], "rule": True,
              "own_section": "the certificate is earned by completing the 37-unit major", "page": _BOTH},
    "38591": {"gap": "total_differs", "computed": [18, 18], "stated": [27, 27], "rule": True,
              "page": "PDF p.342: 'American Sign Language', 'Associate in Arts'; 'The American Sign Language "
                      "Associate in Arts can be obtained by completing the 27-unit major'; 'American Sign Language "
                      "(select 18 units)' over ASL 001, 002, 003, 004, 005, 006, 007, 011 and 052 at 3; 'Required "
                      "Major Total Units 27'"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "43134": ("held: the state's file lists World Languages A.A. twice (06538 and 43134), and both records were read "
              "from the one section on PDF p.341 (college-page-read run " + PAGE_READ + "); nothing on the page tells "
              "one control number from the other, so the own-page guard leaves both unshown (as Long Beach City 43021 "
              "and 02677): which control number the section is is the inventory's call"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Solano", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
