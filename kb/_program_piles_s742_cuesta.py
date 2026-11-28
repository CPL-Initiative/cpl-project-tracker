#!/usr/bin/env python3
"""S742, lane 1 (keys) at Cuesta: the two Aviation Mechanic certificates lane 1 held, each collected with its gap named.

S739's wave A pinned Aviation Mechanic - Powerplant 43053 to its own curriQunet entry, read it (run 45787691549) and
loaded it (load 45801917046); its sister, Airframe & Powerplant 41744, was read at the college's first run
(39063368678) and loaded then (load 39074969343). Both records place every listed course and both fail on their
units for one reason, which S739 to S741 carried as a hold with its recipe named (lessons, S741, holds by key).
Sam's ruling (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap named and a
lower score on the 0-100 bar. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below), pair_read_as_alternatives (50):
  43053  Aviation Mechanic - Powerplant certificate: the record holds five required courses at 5 units under
         'Program Requirements' (25), and lists AVMT 110A and AVMT 110B (2.5 each) as two alternatives of AVMT 110,
         and AVMT 120A and AVMT 120B as two alternatives of AVMT 120. Its own note: the halves are taken together
         in place of the course, 'both A and B courses are required as a pair, not either one alone'. Read singly,
         each row runs from 2.5 to 5, so the courses add to 20-25 against the printed 25. With each pair at its
         5 units the courses add to 25 at both ends.
  41744  Aviation Mechanic - Airframe & Powerplant certificate: the same two rows under 'Required Courses (40
         units)' with six more courses at 5; its own note says the alternatives 'must be taken together, not either
         one alone'. Read singly the courses add to 35-40 against the printed 40; with each pair at 5, to 40.

What the page prints is the reader's own note on each record: no page read of either entry is committed, and each
entry is the program's own (no other record was read from it). The capture finds each course the entry names.

43053's live run: load 45801917046 inserted it and held two runs, so its receipt names no run for the key. The
record file's newest commit on main is the commit that filed that load's receipt (FILE_HISTORY, read through the
hosting API's commits by path), so the file's run, 45787691549, is the row's
(d-multi-run-load-history-proves-run-s731c). 41744's run is the one run of the load that inserted it.

    python3 kb/_program_piles_s742_cuesta.py --dry-run
    python3 kb/_program_piles_s742_cuesta.py --tag s742k1

Guard: tests/program_piles_s742_cuesta_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
COLLEGE = "Cuesta College"
SLUG = "cuesta"
TAG = "s742k1"
# No earlier plan held these two: they are lane 1's holds by key, as the lane and lessons (S741) list them.
HELD_BY = "docs/program_requirements_harvest_lessons.md, S741, holds by key (Cuesta 43053 and 41744)"
KEYS = ("41744", "43053")
# The record file's commits on main, newest first, read through the hosting API's commits by path at READ_AT: the
# newest is the commit that filed load 45801917046's receipt (#3884).
READ_AT = "2026-11-27T12:46Z"
LOAD_COMMITS = {"45801917046": "91a3a856612f9d9f72b7d6addcf4700ad8e5fb3c"}
FILE_HISTORY = {"43053": ["91a3a856612f9d9f72b7d6addcf4700ad8e5fb3c", "20a9b442486602bc106c7bd34422ab71e41cd06f"]}
_PAIRS = [("pair", "AVMT 110", ["AVMT 110A", "AVMT 110B"], 5), ("pair", "AVMT 120", ["AVMT 120A", "AVMT 120B"], 5)]
_COURSES = ["AVMT110", "AVMT120"]

REVIEWED = {
    "43053": {"gap": "pair_read_as_alternatives", "computed": [20, 25], "stated": [25, 25],
              "words": "both A and B courses are required as a pair, not either one alone",
              "ops": _PAIRS, "courses": _COURSES},
    "41744": {"gap": "pair_read_as_alternatives", "computed": [35, 40], "stated": [40, 40],
              "words": "The alternatives are recorded on one entry but must be taken together, not either one alone",
              "ops": _PAIRS, "courses": _COURSES},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Cuesta", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, file_history=FILE_HISTORY, load_commits=LOAD_COMMITS,
            read_at=READ_AT)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
