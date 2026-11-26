#!/usr/bin/env python3
"""S739, lane 2's cheap piles at College of the Canyons: the 14 records s727a held, 7 passed and 6 with named gaps.

S727's plan (kb/_program_piles_s727_canyons.py, s727a) collected 7 of the census's 20 wording-rule records and held
14. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and
a lower score, never held, unless the record is not the program's own. The 14 are read again here, by key, from the
committed records, their notes and today's capture. No catalog read, no reconcile, no record changed, no new kind.

PASSED BY A RENAME (7, PASSED below). S727 held seven records whose arithmetic already passes and whose coverage and
invented fail on a code the page prints otherwise than the state's file lists it; each record's own note names both
codes as one course. The filed score is rescored with those renames alone (P.rescore_common_numbers, S721's rename at
Porterville), and coverage and invented then pass beside the arithmetic. Each rename stays in this plan:
  WE-186ID for the file's WWE 186ID (Work Experience Education Interior Design, the same title): Interior Design
      A.S. 10302 and its certificate 19386, Sustainable Design and Development 33814.
  WE-486ARCH for the file's WE ARCH486: Building Performance B.S. 44260.
  ANTRHO-103 and ANTRHO-103H, a misspelled subject, for ANTHRO 103 and 103H: Public Health A.S.-T 44657.
  PSCYH-104 and ATNHRO-105, two typos, for PSYCH 104 and ANTHRO 105: Applied GIS and Spatial Studies 40090.
  PSYC-104 for PSYCH 104 (the prefix alias S691 filed for the college after this record's run): Kinesiology A.A.-T
      32723.
A course the page prints that the state's file does not list at all (ID-101B, ARCHT-250, CONST-105 and 106) stays a
catalog addition, as the record flags it.

COLLECTED WITH A NAMED GAP (6, REVIEWED below):
  unit_line_not_read (40)    02277 Computer Science A.S.: the non-transfer path is MATH-211 and 'Nine additional
        units from the above CMPSCI courses', a line of units with no course named, which the record leaves out;
        with the path read at its printed 14 the courses add to the printed 37-38. S727 held it on the cheaper lever
        (a wording rule on a reconcile); the lever is named in the receipt.
  noted_unit_floor (70)      15477 Filmmaking A.A.: the capstone 'needs only one unit of WE-186MEA', a course printed
        at a range from 0.05 units; at that one unit the courses add to the printed 29. S727's cheaper lever, named.
  lists_not_closed (30)      32815 Spanish A.A.-T: its last list is a substitution list for a student who tests out
        of a required course; it prints no unit figure, and without it the courses add to the printed 23.
  noted_figures_differ (40)  40384 Advanced Diagnosis and Performance certificate: 'Units Required' prints 36, and
        the required courses add to 36 before the 'minimum of one unit' of WE-186AUTO (37); 40383, the degree the
        same section serves, was filed so by s727a. 45528 Modern Policing A.S.: 'Units Required: 51 - 54' against
        listed requirements that add to 54-57; its note quotes both.
  repeat_read_once (60)      41576 Music A.A.: MUSIC-189 and MUSIC-190, 1 unit each, are each taken 4 times for the
        list's printed 8; with the repeats the courses add to the printed 26. S727 held it because today's capture
        does not find MUSIC 189 or 190: the state's file stores both with no space (MUSIC189), and the capture finds
        every spaced code of this program's list and none of its eight unspaced ones, so the miss is the matcher's;
        the record places both.

HELD (1): 36793 Hospitality Management A.S.-T: its 19-22 sits inside the printed 18-22 (the list 'two courses ... for
six to ten units' carries 7 to 10), no note names it, and no kind's sentence is true of a units sum inside a printed
range (d-lists-gap-holds-range-sums-s703 keeps it out of lists_past_their_figure): a scorer reading, not a reread.

    python3 kb/_program_piles_s739_canyons.py --dry-run
    python3 kb/_program_piles_s739_canyons.py --tag s739c

Guard: tests/program_piles_s739_canyons_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s727_canyons as PRIOR  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "College of the Canyons"
SLUG = "college_of_the_canyons"
TAG = "s739c"
HELD_BY = "kb/receipts/program_requirement_records_piles_s727_canyons_2026-11-25_s727a.json"
KEYS = ("02277", "10302", "15477", "19386", "32723", "32815", "33814", "36793", "40090", "40384", "41576", "44260",
        "44657", "45528")

_WE = {"WE-186ID": "WWE 186ID"}
PASSED = {
    "10302": {"renames": _WE,
              "words": "WE-186ID (Work Experience Education Interior Design) is printed with subject 'WE'; the closed "
                       "list has 'WWE 186ID' with the same title"},
    "19386": {"renames": _WE,
              "words": "Catalog prints the work experience course as 'WE-186ID'; treated as the closed list's WWE "
                       "186ID (same title"},
    "33814": {"renames": _WE,
              "words": "treated as the closed-list course WWE 186ID (same title)",
              "own_heading": "Certificate of Achievement: Sustainable Design and Development"},
    "44260": {"renames": {"WE-486ARCH": "WE ARCH486"},
              "words": "WE-486ARCH (catalog) was matched to closed-list WE ARCH486"},
    "44657": {"renames": {"ANTRHO-103": "ANTHRO 103", "ANTRHO-103H": "ANTHRO 103H"},
              "words": "Catalog prints 'ANTRHO-103' and 'ANTRHO-103H'; treated as closed-list ANTHRO 103/103H (subject "
                       "misspelling)"},
    "40090": {"renames": {"PSCYH-104": "PSYCH 104", "ATNHRO-105": "ANTHRO 105"},
              "words": "'PSCYH-104' is printed as such (typo); read as closed-list PSYCH 104",
              "also_words": "'ATNHRO-105' is printed as such (typo); read as closed-list ANTHRO 105"},
    "32723": {"renames": {"PSYC-104": "PSYCH 104"},
              "words": "Catalog prints PSYC-104 Statistics for the Behavioral Sciences; closed list has PSYCH 104 with "
                       "the same title"},
}

_LEVER = "a wording rule on a Canyons reconcile passes it (S727's reason); a reconcile's rescore drops the gap when it does"
_SUBSTITUTION = ("If students need to substitute units due to testing out of required courses, they may choose from "
                 "the courses listed below if not already taken above")
REVIEWED = {
    "02277": {"gap": "unit_line_not_read", "computed": [28, 38], "stated": [37, 38],
              "words": "'Nine additional units from the above CMPSCI courses that have not already been taken.' The 9 "
                       "units are not recorded as a separate block",
              "ops": [("choose", "Plus 14 units from the following (for non-transfer students)", 14)],
              "lever": _LEVER, "own_heading": "Associate in Science Degree: Computer Science"},
    "15477": {"gap": "noted_unit_floor", "computed": [28.05, 32], "stated": [29, 29],
              "words": "recorded as 'all' (MEA-295 plus one unit of WE-186MEA); this reading makes the blocks sum to "
                       "the stated 29 units",
              "ops": [("units", "WE-186MEA", 1)], "lever": _LEVER,
              "own_heading": "Associate in Arts Degree: Filmmaking"},
    "32815": {"gap": "lists_not_closed", "computed": [23, 23], "stated": [23, 23],
              "words": "The last block is a substitution list used only when a student tests out of required courses; "
                       "it adds no units to the 23-unit total and prints no unit count",
              "ops": [("drop", _SUBSTITUTION)], "shape": ["open"], "open": _SUBSTITUTION, "lever": _LEVER,
              "own_heading": "Associate in Arts for Transfer Degree: Spanish"},
    "40384": {"gap": "noted_figures_differ", "computed": [37, 37], "stated": [36, 36],
              "words": "Units Required is printed as 36, but the required courses sum to 36 plus a minimum of 1 unit "
                       "of WE-186AUTO (37 total)",
              "ops": [("drop", "Plus a minimum of one unit from the following")],
              "own_heading": "Certificate of Achievement: Advanced Diagnosis and Performance"},
    "45528": {"gap": "noted_figures_differ", "computed": [54, 57], "stated": [51, 54],
              "words": "Printed 'Units Required: 51 - 54' does not match the sum of the listed requirements",
              "shape": ["note_quotes"], "quotes": {"stated": "51 - 54", "computed": "54-57"},
              "own_heading": "Associate in Science Degree: Modern Policing"},
    "41576": {"gap": "repeat_read_once", "computed": [20, 20], "stated": [26, 26],
              "words": "MUSIC-189 and MUSIC-190 are printed at 1.0 unit each but must each be taken 4 times",
              "ops": [("repeat", "MUSIC-189", 4), ("repeat", "MUSIC-190", 4)], "courses": ["MUSIC189", "MUSIC190"],
              "own_section": "Read only the 'Associate in Arts Degree: Music' section"},
}
HAND = {cn: B.PASSES for cn in PASSED}
HAND.update({cn: e["gap"] for cn, e in REVIEWED.items()})
HAND["36793"] = ("held: its 19-22 sits inside the printed 18-22: the list 'two courses from the following for six to "
                 "ten units' carries 7 to 10, and the printed range counts it at 6. No note names it, and no kind's "
                 "sentence is true of a units sum inside a printed range (d-lists-gap-holds-range-sums-s703 keeps it "
                 "out of lists_past_their_figure): a scorer reading, not a reread")

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="College of the Canyons", prior=PRIOR, keys=KEYS,
           reviewed=REVIEWED, passed=PASSED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
