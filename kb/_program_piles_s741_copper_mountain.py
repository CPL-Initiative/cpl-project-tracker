#!/usr/bin/env python3
"""S741, lane 1 (keys) at Copper Mountain: four of the six records s740r4 held, each collected with the gap its own page shows.

Plan s740r4 (kb/_program_piles_s740_copper_mountain_read.py) read the seven records read 45855512160 left failing,
collected Registered Nursing 16657 and held six. Each was read on 2026-11-26 from the catalog's reissue of
2026-11-18, and each record's own section is printed line for line by college page read 45953233659
(kb/college_reads/s741_keys_copper_mountain_pages.json; one load of the PDF, free). Sam's ruling
(sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap named and a lower score on the
0-100 bar. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (4, REVIEWED below):
  total_differs (50)   14737 Vocational Nursing A.S. (PDF p.113) and 20094 Vocational Nursing certificate (PDF p.114):
        each section prints the same seven required courses, BIOL 022 (4), BIOL 023 (4), HS 065 (3), PSYC 003 (3), VN
        010 (9), VN 020 (16) and VN 030 (15.6), which add to 54.6, under 'Total Units for the Major 56' (the degree) and
        'MINIMUM CERTIFICATE UNITS 56' (the certificate). Each is listed with both figures in
        kb/program_total_differs.json, read from the page itself, and the record reads both exactly, so the record
        rule names the gap (its own procedure, as handoff 741 asked). The two records were read from one PDF page;
        each record's heading names its own award and not its sister's (the own-page guard's own_heading).
  units_within_printed_range (50)  45594 Elementary Teacher Education: Integrated Programs A.A.-T (PDF p.93): the
        section prints nine required rows that add to 26, 'List A - Select one (4-8 units)' over G 010 (4) or CH 003
        AND PH 001 (8), 'List B - Select one (3 units)' (3), 'List C - Up to 12 additional units from: ... 3-12' and
        'Total Units for the Major 32-49'. The record places all 18 listed courses and reads each printed figure as
        printed, so the lists add to 36-49: inside the printed 32-49, its top the range's top. Nothing else differs
        (its degree passes). Filed by key (f-units-within-range-by-key-only-s740), the words the kind's own.
  lists_not_closed (30)  14710 General Business A.S. (PDF p.78): the section prints 'The required number of units for
        restricted electives is dependent on the number of work experience units a student completes' over 'Take at
        least one (1) unit of work experience. A maximum of four (4) units may be counted', the restricted electives
        at 17 or a concentration at 20, 11, 14, 18 or 15, 'Minimum units needed for the major 42' and 'Additional
        restricted electives as needed.' A list whose figure depends on another choice: the record's lists add to
        36-45 against the printed 42. Two gaps on one row: the concentrations print totals with no units beside their
        courses, which the record's second note names; the lower-scored kind is filed with both notes. S740 held the
        row for want of one kind; the page's own sentence is the kind's second clause.

NO KEYS HERE (the other two of s740r4's holds): History A.A. 43854 and Fire Technology A.S. 14751. Each major adds
to its printed total under today's scorer, and each page words the degree's units as a floor ('MINIMUM TRANSFERABLE
UNITS 60', 'MINIMUM DEGREE UNITS 60'), which a reconcile step from the catalog's own wording reads
(kb/program_requirements_reconcile.json, Copper Mountain College; tests/program_reconcile_s741_copper_mountain_test.py).
43854 is not the units within-range kind: its sum is read against the degree, and the printed 60 lies inside the
record's 58-67, the reverse of the kind's figures.

    python3 kb/_program_piles_s741_copper_mountain.py --dry-run
    python3 kb/_program_piles_s741_copper_mountain.py --tag s741k2

Guard: tests/program_piles_s741_copper_mountain_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
COLLEGE = "Copper Mountain College"
SLUG = "copper_mountain"
TAG = "s741k2"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_copper_mountain_2026-11-26_s740r4.json"
PAGE_READ = "45953233659"
READ = "45855512160"
KEYS = ("14710", "14737", "20094", "45594")
BY_THE_RECONCILE = ("14751", "43854")
_ELECTIVES = "Restricted Electives: Select seventeen (17) units from the following for general business studies"

REVIEWED = {
    "14737": {"gap": "total_differs", "computed": [54.6, 54.6], "stated": [56, 56], "rule": True,
              "own_heading": "Associate in Science in VOCATIONAL NURSING with emphasis on employment preparation",
              "page": "PDF p.113: 'BIOL 022 Human Anatomy 4', 'BIOL 023 Human Physiology 4', 'HS 065 Basic "
                      "Pharmacology 3', 'PSYC 003 Developmental Psychology 3', 'VN 010 Vocational Nursing I 9', 'VN "
                      "020 Vocational Nursing II 16', 'VN 030 Vocational Nursing III 15.6', 'Total Units for the "
                      "Major 56', 'CMC General Education Requirement 18', 'MINIMUM DEGREE UNITS 74'"},
    "20094": {"gap": "total_differs", "computed": [54.6, 54.6], "stated": [56, 56], "rule": True,
              "own_heading": "Certificate of Achievement in VOCATIONAL NURSING with emphasis on employment "
                             "preparation",
              "page": "PDF p.114: the same seven courses at the same units under 'Certificate of Achievement in "
                      "VOCATIONAL NURSING with emphasis on employment preparation', then 'MINIMUM CERTIFICATE UNITS "
                      "56'"},
    "45594": {"gap": B7.WITHIN, "words_from": "figures", "shape": ["within"], "computed": [36, 49],
              "stated": [32, 49],
              "words": "Printed major total 32-49 does not reconcile exactly with block sums",
              "page": "PDF p.93: nine required rows (3, 1, 4, 3, 3, 3, 3, 3 and 'HIST 003 OR ENGL C1002 3'), 'List A "
                      "- Select one (4-8 units): G 010 The Earth Sciences 4 OR CH 003 AND PH 001 8', 'List B - Select "
                      "one (3 units): ART 010, MUS 010, TA 001 3', 'List C - Up to 12 additional units from: HIST "
                      "C1002, HIST 019, HS 001, MATH 016 3-12', 'Total Units for the Major 32-49', 'Cal-GETC General "
                      "Education Units 34', 'Transferable elective units as needed.', 'MINIMUM TRANSFERABLE UNITS "
                      "60'"},
    "14710": {"gap": "lists_not_closed", "computed": [36, 45], "stated": [42, 42],
              "words": "Catalog states the required number of restricted elective units depends on the number of "
                       "work experience units completed",
              "also_words": "Printed concentration totals may not match the sum of listed course units",
              "shape": ["depends"], "depends": _ELECTIVES,
              "page": "PDF p.78: 'Take at least one (1) unit of work experience. A maximum of four (4) units may be "
                      "counted toward this degree.'; 'The required number of units for restricted electives is "
                      "dependent on the number of work experience units a student completes.'; 'Restricted "
                      "Electives: Select seventeen (17) units from the following for general business studies: ... "
                      "17'; 'Or select a concentration area:' Accounting 20, e-business 11, Hospitality 14, Real "
                      "Estate 18, Skilled Office Professional 15; 'Minimum units needed for the major 42'; 'CMC "
                      "General Education Requirement 21'; 'Additional restricted electives as needed.'; 'MINIMUM "
                      "DEGREE UNITS 63'"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Copper Mountain", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
