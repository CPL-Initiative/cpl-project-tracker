#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Cosumnes River: the census's 16 wording-rule records, 4 passed and 7 with named gaps.

The census on main (kb/status/harvest_gap_census.json, written 2026-11-26 06:54Z) lists 17 Cosumnes River College
records under the reconcile_steps lever. 33542 is lane 1's (plan s739l, applied, option_lists_read_apart) and is no key
here. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named
and a lower score, never held, unless the record is not the program's own. The 16 are read from the committed records,
their notes and today's capture. No catalog read, no reconcile, no record changed, no new kind. The college has no
earlier piles module, so its live runs are read by the shared module's LiveRuns (S731's rule): every key was inserted
by load 39048319477, which held one run.

PASSED BY A RENAME (4, PASSED below): the arithmetic already passes, and coverage and invented fail on one course the
state's file lists under a fused code, the printed code with a run of digits after it. The committed state list shows
it (FUSED below checks each: the listed code is the printed code followed by digits alone), and each record's own note
names both codes:
  MKT 495 for the file's 'MKT 495 23085': Marketing A.A. 04596 and its certificate 35899.
  RE 296 for the file's 'RE296282560' (Internship in Real Estate, the title its note gives for both): Real Estate
      Broker certificate 20197 and Real Estate Salesperson certificate 39139.

COLLECTED WITH A NAMED GAP (7, REVIEWED below):
  noted_section_cut_off (20)  five records whose note says the text begins or ends mid-table, part of the requirements
        on a page the read did not hold: 04616 Theatre Arts A.A. (core courses before p.604), 15249 Geography A.S.
        (core and the elective list's rule on p.573), 15326 Digital Media A.A. (first required courses on p.297; its
        own note says the certificate's section on the page was not recorded), 39679 Social Justice Studies: Gender
        Studies A.A.-T (core and the areas' rule on the page before 578), 20153 Horticulture, Sustainable Landscape
        Technology certificate (cut off mid-table at HORT 306, no total read; its heading names the certificate, and
        the degree of the same title read from the page is a sister award).
  noted_figures_differ (40)   31053 Film/Digital Cinema Production A.A.: the printed 'Total Units: 33' against listed
        requirements that add to 30; its note quotes both.
  noted_no_total (40)         45203 Cal-GETC certificate: no units print beside any course and no total for the
        certificate.

HELD (5):
  11340, 11341  not collectable, and no rename is filed: their notes match PHOTO 390, 392, 370 and 372 to state codes
         (PHOT3904859, PHOT3921686, PHOT37018370, PHO372250530) whose listed titles the same notes say differ from the
         printed ones, and the codes are not the printed code with digits after it (s739e's round 1 on 41150).
  11346  American Studies A.A.: coverage fails on ARTH 325, which its note says the state's file lists as ART325 under
         the same title; with that read its major passes and the degree names a pattern with no units
         (ge_units_not_read). Two steps, a rename and then a gap: a free reconcile with a course renumber.
  17868  Liberal Arts - Arts and Humanities A.A.: not collectable (74 of 114 placed); its list begins on p.464, which
         the read did not hold: a reread.
  38017  Entrepreneurial Arts - Independent Music Instructor: its list's beginning is cut off at a page break, it
         carries no note, its page is shared with 38750, and today's capture names another page for it, so nothing
         shows the record its own: a reread.

    python3 kb/_program_piles_s739_cosumnes.py --dry-run
    python3 kb/_program_piles_s739_cosumnes.py --tag s739i

Guard: tests/program_piles_s739_cosumnes_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Cosumnes River College"
SLUG = "cosumnes_river"
TAG = "s739i"
HELD_BY = "kb/status/harvest_gap_census.json (reconcile_steps at Cosumnes River College, written 2026-11-26 06:54Z)"
LANE_1 = ("33542",)
KEYS = ("04596", "04616", "11340", "11341", "11346", "15249", "15326", "17868", "20153", "20197", "31053", "35899",
        "38017", "39139", "39679", "45203")

_MKT = {"MKT 495": "MKT 495 23085"}
_RE = {"RE 296": "RE296282560"}
PASSED = {
    "04596": {"renames": _MKT,
              "words": "Closed-list entry 'MKT 495 23085' matched to the catalog's MKT 495 Independent Studies in "
                       "Marketing",
              "own_heading": "A.A. in Marketing"},
    "35899": {"renames": _MKT,
              "words": "Closed list stores MKT 495 as 'MKT 495 23085'; matched to catalog's MKT 495",
              "own_heading": "Marketing Certificate"},
    "20197": {"renames": _RE,
              "words": "Closed-list code 'RE296282560' (Internship in Real Estate) appears malformed; it was matched "
                       "to the catalog's RE 296 Internship in Real Estate",
              "own_heading": "Real Estate Broker Certificate"},
    "39139": {"renames": _RE,
              "words": "The closed-list code 'RE296282560' (Internship in Real Estate) appears to be a malformed code "
                       "for RE 296",
              "own_heading": "Real Estate Salesperson Certificate"},
}


def fused(printed: str, listed: str) -> bool:
    """The state's code is the printed code with a run of digits fused after it ('MKT 495 23085' for MKT 495)."""
    p, li = B.S.norm_code(printed), B.S.norm_code(listed)
    return li.startswith(p) and li[len(p):].isdigit() and len(li) > len(p)


FUSED = all(fused(k, v) for e in PASSED.values() for k, v in e["renames"].items())
if not FUSED:
    raise SystemExit("a rename is not the printed code with digits after it")

_CUT = {"gap": "noted_section_cut_off", "shape": ["cut"]}
REVIEWED = {
    "04616": dict(_CUT, computed=[9, 9], stated=[24, 24],
                  words="The extracted text begins mid-table on page 604: the A.A. section heading, description, core "
                        "courses and the rule/heading of the list containing TAP 360-363 are not in the text"),
    "15249": dict(_CUT, computed=[0, 0], stated=[19, 20],
                  words="The text begins mid-table on page 574; the section heading, description, required core "
                        "courses and the heading/rule/unit count of the elective list are on page 573 and not provided"),
    "15326": dict(_CUT, computed=[15, 15], stated=[30, 30],
                  words="The excerpt starts mid-table on page 298: the A.A. heading and the first required courses are "
                        "on page 297 and are missing",
                  own_section="The Digital Media Certificate of Achievement section (18 units) was not recorded"),
    "39679": dict(_CUT, computed=[15, 16], stated=[18, 18],
                  words="The excerpt begins mid-section on page 578: the program heading, any required core (likely "
                        "SJS 300 and SJS 310, perhaps SOC 341) and the instruction governing Areas 1-5 are on the "
                        "preceding page and not in the text"),
    "20153": dict(_CUT, computed=[12, 12], stated=None,
                  words="The catalog text is cut off mid-table in the Sustainable Landscape Technology Certificate "
                        "section (at 'HORT 306 Plant Id')",
                  own_heading="Horticulture, Sustainable Landscape Technology Certificate"),
    "31053": {"gap": "noted_figures_differ", "computed": [30, 30], "stated": [33, 33],
              "words": "The printed 'Total Units: 33' does not match the listed requirements, which sum to 30 units",
              "shape": ["note_quotes"], "quotes": {"stated": "Total Units: 33", "computed": "sum to 30 units"}},
    "45203": {"gap": "noted_no_total", "computed": [34, 42], "stated": None,
              "words": "No total units for the certificate is printed", "shape": ["no_total"]},
}
HAND = {cn: B.PASSES for cn in PASSED}
HAND.update({cn: e["gap"] for cn, e in REVIEWED.items()})
_PHOTO = ("held: not collectable, and no rename is filed: its note matches %s to state codes (%s) whose listed titles "
          "the same note says differ from the printed ones, and the codes are not the printed code with digits after "
          "it (s739e's round 1 on 41150): which courses the state's entries are is the college's to say in COCI")
HAND.update({
    "11340": _PHOTO % ("PHOTO 390 and 392", "PHOT3904859, PHOT3921686"),
    "11341": _PHOTO % ("PHOTO 370 and 372", "PHOT37018370, PHO372250530"),
    "11346": ("held: coverage fails on ARTH 325, which its note says the state's file lists as ART325 under the same "
              "title; with that read its major passes (21 = 21) and the degree names a pattern with no units "
              "(ge_units_not_read). Two steps, a rename and then a gap: a course renumber in the college's reconcile "
              "entry, then a free reconcile"),
    "17868": ("held: not collectable (74 of 114 placed): its list begins on page 464, which the read did not hold, and "
              "its block's own header is not in the excerpt: a reread"),
    "38017": ("held: its list's beginning is cut off at a page break and it carries no note; its page is shared with "
              "38750 and today's capture names another page for it, so nothing shows the record its own: a reread"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Cosumnes River", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, passed=PASSED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
