#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Los Angeles Trade-Technical: the 11 records s730a held, 3 passed and 3 with named gaps.

S730's plan (kb/_program_piles_s730_lattc.py, s730a) collected 6 of the census's 17 wording-rule records and held 11.
Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and a
lower score, never held, unless the record is not the program's own. The 11 are read again here, by key, from the
committed records, their notes and today's capture. No catalog read, no reconcile, no record changed, no new kind.

PASSED BY A RENAME (3, PASSED below): the arithmetic already passes, and coverage and invented fail only on a code
the page prints otherwise than the state's file lists it (P.rescore_common_numbers, S721's rename at Porterville).
  'PLUMBING 028', a misspelled subject, for the file's PLUMBNG 28 (Plumbing Code I): Plumbing A.S. 02911 and its
      certificate 21855, whose own notes name it, and Energy Efficiency Technician A.S. 31090, which prints the same
      code and whose own notes are silent on it: its rename stands on 02911's note (note_of), the same catalog's
      misprint. 21855's section prints no course list and names the A.S. degree's lists as its own (own_section).

COLLECTED WITH A NAMED GAP (3, REVIEWED below):
  pool_figure_not_read (40)  18857 Liberal Arts & Sciences, Mathematics, Physical and Natural Sciences: 'Complete 18
        units with a minimum of 3 units from each of the following categories', which the record reads as three
        lists of 3; as one pool at 18 it closes at the printed 18. S730 held it on the cheaper lever (the pooled
        reading's next); the lever is named in the receipt.
  noted_no_total (40)        38737 Industrial Safety, Regulatory and Biomanufacturing: its note says no total is
        printed and took the page's line 'T038737D C - 11 - 11' for the preceding program's tail. That line carries
        this program's own state code, and with its 11 the courses add to it; S730 held the record on that lever (a
        fill step reading the row). The gap files what the note says, and the receipt names the lever.
  noted_figures_differ (40)  37706 Pre-Health Professions II: the printed 18-19 against courses that add to 16-17,
        both quoted in its note. S730 held it on the own-page guard (p.200 is shared with Pre-Health Professions I
        38452); its heading names Pre-Health Professions II, the capture found it, and 38452's record carries another.

HELD (5):
  41150  Fashion Media: its arithmetic passes, and coverage and invented fail on DIGMD 100, 101 and 104 printed for
         the state file's DIGLMD. Its note matches them, and the same note says DIGLMD 100's listed title
         ('Introduction to Digital Video') is not the printed one ('Introduction to Digital Media'); no committed
         file shows the printed courses to be the listed ones, so no rename is filed (S739's second reader, round 1).
  31280  not collectable: with 'Plumbing 028' renamed, CRPNTRY 111C is still unplaced and unexplained.
  31089  not collectable: coverage and invented fail on BLDGTCQ 007, 008 and 009 printed for BLDGCTQ and PLUMBING 028
         read as an alternative, and its arithmetic (37-38 against the printed 42) waits on those.
  41011  a noncredit program that reads no total (unstated), and its page prints VOC ED 460 where the state's file
         lists 463, which its note calls a 'possible renumbering or catalog error': the college's to say.
  45285  not collectable (53 of 99 placed): its text holds only page 65, the Cal-GETC pattern's Areas 4 to 6; a page
         pin with its section's own pages is its lever (a reread).

    python3 kb/_program_piles_s739_lattc.py --dry-run
    python3 kb/_program_piles_s739_lattc.py --tag s739e

Guard: tests/program_piles_s739_lattc_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s730_lattc as PRIOR  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Los Angeles Trade Technical College"
SLUG = "los_angeles_trade_technical"
TAG = "s739e"
HELD_BY = "kb/receipts/program_requirement_records_piles_s730_lattc_2026-11-25_s730a.json"
KEYS = ("02911", "21855", "31090", "31280", "41150", "31089", "41011", "45285", "18857", "38737", "37706")

_PLUMB = {"PLUMBING 028": "PLUMBNG 28"}
PASSED = {
    "02911": {"renames": _PLUMB,
              "words": "'PLUMBING 028' is printed with a misspelled subject; read as PLUMBNG 28 (Plumbing Code I)",
              "own_heading": "PLUMBING Associate in Science Degree"},
    "21855": {"renames": _PLUMB,
              "words": "'PLUMBING 028' is printed with a misspelled subject; it is taken as PLUMBNG 28 (Plumbing Code "
                       "I)",
              "own_section": "The Certificate of Achievement section (page 145) prints no course list; it says the "
                             "certificate is earned by completing 45 units of Required Courses and 3 units of "
                             "Electives listed under the Associate degree in Plumbing"},
    "31090": {"renames": _PLUMB, "note_of": "02911",
              "words": "'PLUMBING 028' is printed with a misspelled subject; read as PLUMBNG 28 (Plumbing Code I)",
              "own_heading": "ENERGY EFFICIENCY TECHNICIAN ▌ Associate in Science Degree"},
}

REVIEWED = {
    "18857": {"gap": "pool_figure_not_read", "computed": [9, 9], "stated": [18, 18],
              "words": "Rule reads: 'Complete 18 units with a minimum of 3 units from each of the following "
                       "categories.'",
              "ops": [("pool", ["LIST A: LIFE SCIENCES", "LIST B: PHYSICAL SCIENCES", "LIST C: MATHEMATICS"], 18)],
              "lever": "the pooled reading's next (S.pooled_figures reading 'with a minimum of 3 units from each' as "
                       "pooled words) passes it at 18 = 18 (S730's reason); a reconcile's rescore drops the gap when "
                       "it does"},
    "38737": {"gap": "noted_no_total", "computed": [11, 11], "stated": None,
              "words": "No total units are printed for the certificate; total_units left null (the listed courses sum "
                       "to 11 units, not recorded)",
              "also_words": "The lines above it (T038737D C - 11 - 11",
              "ops": [("total", 11)], "shape": ["no_total"],
              "lever": "a Los Angeles Trade-Technical fill step that reads the major figure of the page's row for its "
                       "own state code, 'T038737D C - 11 - 11', fills its total, and today's scorer then passes it at "
                       "11 = 11 (S730's reason); a reconcile's rescore drops the gap when it does",
              "own_section": "section_heading uses 'PROGRAM OVERVIEW', the first heading of the Industrial Safety, "
                             "Regulatory and Biomanufacturing certificate section"},
    "37706": {"gap": "noted_figures_differ", "computed": [16, 17], "stated": [18, 19],
              "words": "The printed major total (18-19 units) does not match the listed courses",
              "shape": ["note_quotes"], "quotes": {"stated": "18-19", "computed": "16-17"},
              "own_heading": "PRE-HEALTH PROFESSIONS II Certificate of Achievement"},
}
HAND = {cn: B.PASSES for cn in PASSED}
HAND.update({cn: e["gap"] for cn, e in REVIEWED.items()})
_NOT = "held: not collectable (collected_with_gaps, kb/_harvest_gap_census.py): "
HAND.update({
    "41150": ("held: today's scorer passes its arithmetic, and coverage and invented fail on DIGMD 100, 101 and 104 "
              "printed for the state file's DIGLMD. Its note matches them, and the same note says the listed title of "
              "DIGLMD 100 ('Introduction to Digital Video') is not the printed one ('Introduction to Digital Media'); "
              "no committed file shows the printed courses to be the listed ones, so no rename is filed (S739's second "
              "reader, round 1): a course renumber the catalog's own course pages confirm, or a page read"),
    "31280": _NOT + ("with 'Plumbing 028' renamed to PLUMBNG 28, as its note has it, CRPNTRY 111C is still unplaced and "
                     "unexplained, so coverage fails; a read of its section, or a missing-course note, is its lever"),
    "31089": _NOT + ("coverage and invented fail on BLDGTCQ 007, 008 and 009 printed for BLDGCTQ and PLUMBING 028 read "
                     "as an alternative; its arithmetic (37-38 against the printed 42) waits on those: course renumbers "
                     "in the college's reconcile entry, then a free reconcile"),
    "41011": ("held: a noncredit program whose arithmetic reads no total (unstated), and its page prints VOC ED 460 where "
              "the state's file lists VOC ED 463, which its own note calls a 'possible renumbering or catalog error': "
              "which course the L1 row names is the college's to say in COCI"),
    "45285": _NOT + ("53 of 99 placed: its text holds only page 65, the Cal-GETC pattern's Areas 4 to 6, and its note "
                     "says the heading and Areas 1 to 3 are on earlier pages; a page pin with its section's own pages "
                     "is its lever (a reread)"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Los Angeles Trade-Technical", prior=PRIOR, keys=KEYS,
           reviewed=REVIEWED, passed=PASSED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
