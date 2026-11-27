#!/usr/bin/env python3
"""S741, lane 1 at Norco, after the reread of the group-end read: five records plan s740c1 held, each with its gap named.

Plan s740c1 (kb/_program_piles_s740_norco.py) held eleven records for a change to the capture: the curriQunet text
never said where a 'Select one' group ends. S741 made that change (kb/_program_requirements_college.py
cq_group_ends), paid read 45964327019 re-read the eleven and 30061, and reread 45969610504 posted the twelve
(kb/receipts/program_requirement_records_college_reread_norco_45969610504.json). Seven pass. The five below still fail
on their units, each for a cause the page itself prints, so each is read here from its committed record, its notes
and today's capture. No record changed, no new kind.

COLLECTED WITH A NAMED GAP (5, REVIEWED below):
  ge_units_not_read (50)     32830 Philosophy A.A.-T, 37311 Environmental Science A.S.-T, 44961 Law, Public Policy, and
        Society A.A.-T: with the group ends marked each major now adds to its printed total (18, 41, 32-33). Each
        record names the degree's 60 units and the Cal-GETC pattern, and the page prints no units for the pattern
        (32830's note: 'no GE unit figure printed'). The record rule names the gap; its words are the rule's own.
  noted_figures_differ (40)  39998 and 40064 Apprenticeship: Manufacturing Technician 2 (the certificate and the A.S.,
        one page): the page prints 'Units: 16.00' over Required courses, whose one row is APP-450 at 4.00, and
        'Total : 30.00- 31.00' (16 + 14-15). Each record adds APP-450 at its printed 4 and reads 18-19; at 16 it adds
        to the printed 30-31 at both ends. College-page-read 45954122786 printed the rows as they nest: a group
        headed 16.00 holding APP-450 at 4.00. Each record's own note quotes both figures.

    python3 kb/_program_piles_s741_norco.py --dry-run
    python3 kb/_program_piles_s741_norco.py --tag s741r1

Guard: tests/program_piles_s741_norco_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Norco College"
SLUG = "norco"
TAG = "s741r1"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_norco_2026-11-26_s740c1.json"
READ = "45964327019"
REREAD = "kb/receipts/program_requirement_records_college_reread_norco_45969610504.json"
KEYS = ("32830", "37311", "44961", "39998", "40064")

REVIEWED = {
    "32830": {"gap": "ge_units_not_read", "computed": [18, 18], "stated": [60, 60], "rule": True},
    "37311": {"gap": "ge_units_not_read", "computed": [41, 41], "stated": [60, 60], "rule": True},
    "44961": {"gap": "ge_units_not_read", "computed": [32, 33], "stated": [60, 60], "rule": True},
    # One page holds both awards (the entry is titled '... - Associate of Science Degree and Certificate of
    # Achievement - NAS967/C/NCE967'), so each record is shown its own by its own note (own_section, S720's form):
    # the note says the section covers both awards with one set of requirements, and which award the record reads.
    "39998": {"gap": "noted_figures_differ", "computed": [18, 19], "stated": [30, 31],
              "ops": [("units", "APP-450", 16)],
              "words": "Required courses block states 16.00 units but lists only APP-450 at 4.00 units",
              "own_section": "shared by both awards and recorded here for the certificate"},
    "40064": {"gap": "noted_figures_differ", "computed": [18, 19], "stated": [30, 31],
              "ops": [("units", "APP-450", 16)],
              "words": "Required courses block prints 'Units: 16.00' but lists only APP-450 at 4.00 units",
              "own_section": "this record reads them for the A.S. Degree"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Norco", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
