#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Cabrillo: the 13 records s720b held, seven collected with named gaps.

S720's plan (kb/_program_piles_s720_cabrillo.py, s720b) collected eight of the census's wording-rule records and held
13. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named
and a lower score, never held, unless the record is not the program's own. A named gap must be true of its record.
The 13 are read again here, by key, from the committed records and their notes. Each was read from a catalog page of
its own address, which no other record was read from. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (7, REVIEWED below):
  catalog_figures_differ (50), the kind's own check (NG.figures_differ_fails: each list matches its printed figure,
        and the lists with general education sum past the printed degree total at both ends):
        06328  Biology A.S.: three lists of 15, general education's 24 and 6 of electives add to 75 under 'Complete
               the following number of credits: 60'. Its note says the page does not print the two last lists as
               alternatives, which would make 60. S720 held it because the note only suspects that; the gap says
               what the page prints.
        06341  Engineering A.S.: 'Required' 27, one focus at 11 to 14, additional electives 0-7 and general
               education's 24 add to 62-72 under a printed 60.
        06385  Early Childhood Education A.S.: the core's 3, 3 and 28.5, special topics 1-3, electives 3.5 and
               general education's 24 add to 63-65 under a printed 60-62.
  unit_line_not_read (40)  41186  Liberal Arts and Sciences, Kinesiology and Wellness A.A.: 'Group 3 (maximum 3 units
        from any Athletics (ATH) or Kinesiology (KIN) course), 3' names no course and the record leaves the line out;
        with it the 57 is the printed 60. S720 held it for the electives fill, which the record already counts.
  pool_figure_not_read (40)  06349  Music A.A., two gaps on one row: 'Recommended Performance Ensemble Electives' prints
        4 over two option lists that each print 0, and MUS16 is taken four times and counted once
        (repeat_read_once is 60, so the lower score is filed with both notes). With the ensembles at 4 and MUS16
        four times the 53 is the printed 60.
  noted_figures_differ (40)  32291  Music A.A.-T: a core list prints 4 credits over MUS16 at 0.5 units taken four
        times, which its note says is 2; at the list's printed 4 the 56.5 is the printed 60.
  repeat_read_once (60)  43556  Piano certificate: MUS40 is taken twice, and MUS68 and/or MUS68CP four times
        between them; the record counts each once. With MUS40 twice and the two ensembles at four the 14 is the
        printed 17 (the reading takes MUS68 three times and MUS68CP once; any split of the four adds the same).

HELD (6), each reason in HAND:
  06352, 06380, 06381, 44992  every list is headed 'Recommended' and read as counting nothing, so the record adds to
         general education alone. No gap is true of a list the page counts: a reconcile wording rule ('Recommended ...
         Complete the following number of credits: N' reads as N units to choose) is their lever (the follow-up's).
  11293  Art Studio A.A.: on no proved live run (s720b's reason, unchanged).
  45306  Spanish Intermediate Proficiency certificate: its lists print 13-15 and 1-3, which add to 14-18 around the
         printed 16; no kind's sentence is true of a printed total inside the lists' own range, and the stray '4 - 5'
         its note names is unread: a reread.

    python3 kb/_program_piles_s740_cabrillo.py --dry-run
    python3 kb/_program_piles_s740_cabrillo.py --tag s740d

Guard: tests/program_piles_s740_cabrillo_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B, NG = B7.B, B7.NG
COLLEGE = "Cabrillo College"
SLUG = "cabrillo"
TAG = "s740d"
HELD_BY = "kb/receipts/program_requirement_records_piles_s720_cabrillo_2026-11-24_s720b.json"
KEYS = ("06328", "06341", "06349", "06352", "06380", "06381", "06385", "11293", "32291", "41186", "43556", "44992",
        "45306")
_VOCAL, _INSTRUMENTAL = "Recommended Vocal Ensemble Electives", "Recommended Instrumental Ensemble Electives"


def figures_differ(filed: dict, e: dict) -> bool:
    """catalog_figures_differ's own check, on the record as filed (NG.figures_differ_fails): each list matches its
    printed figure, and the lists sum past the printed total at both ends."""
    return e["gap"] == "catalog_figures_differ" and NG.figures_differ_fails(filed) is None


REVIEWED = {
    "06328": {"gap": "catalog_figures_differ", "computed": [75, 75], "stated": [60, 60], "shape": ["figures_differ"],
              "words": "Arithmetic suggests the second 'Recommended Major Requirements' block (15) and the "
                       "'Biotechnology Focus' block (15) may be alternatives (24 GE + 15 + 15 + 6 electives = 60, "
                       "whereas all three 15-unit blocks would total 75)"},
    "06341": {"gap": "catalog_figures_differ", "computed": [62, 72], "stated": [60, 60], "shape": ["figures_differ"],
              "words": "The page prints 'Complete the following number of credits: 60' for the whole degree "
                       "(recorded as degree_total) and 'Cabrillo College General Education 24' (recorded as "
                       "ge_units)",
              "also_words": "The five Focus blocks are recorded as one option_group ('Focus')"},
    "06385": {"gap": "catalog_figures_differ", "computed": [63, 65], "stated": [60, 62], "shape": ["figures_differ"],
              "words": "'Complete the following number of credits: 60-62' is recorded as degree_total, and 'Cabrillo "
                       "College General Education 24' as ge_units",
              "also_words": "'General electives: any transferable or degree applicable course.' is printed with 0 "
                            "beside it and no unit amount"},
    "41186": {"gap": "unit_line_not_read", "computed": [57, 57], "stated": [60, 60], "ops": [("line", 3)],
              "words": "Group 3 ('maximum 3 units from any Athletics (ATH) or Kinesiology (KIN) course', 3) names no "
                       "specific courses; it is not recorded as a block"},
    "06349": {"gap": "pool_figure_not_read", "computed": [53, 53], "stated": [60, 60],
              "ops": [("stated", _VOCAL, 4), ("stated", _INSTRUMENTAL, 4), ("repeat", "MUS16", 4)],
              "words": "'Recommended Performance Ensemble Electives' (4 credits) says students can take four units in "
                       "the Vocal Ensemble Electives block or the Instrumental Ensemble Electives block",
              "also_words": "MUS16 block prints 4 credits with the note 'students should take MUS16 for a total of "
                            "four times'",
              "courses": ["MUS16"]},
    "32291": {"gap": "noted_figures_differ", "computed": [56.5, 56.5], "stated": [60, 60],
              "ops": [("units", "MUS16", 4)],
              "words": "Second 'Major Requirements - Core' block states 4 credits but lists only MUS16 at 0.5 units "
                       "with a note to take it four times (4 x 0.5 = 2 units), which does not match the stated 4",
              "courses": ["MUS16"]},
    "43556": {"gap": "repeat_read_once", "computed": [14, 14], "stated": [17, 17],
              "ops": [("repeat", "MUS40", 2), ("repeat", "MUS68", 3)],
              "words": "'MUS68 and/or MUS68CP need to be repeated 4 times to reach a total of 4 units' (4) and 'MUS40 "
                       "needs to be repeated 2 time to reach a total of 2 units' (2)",
              "courses": ["MUS40", "MUS68", "MUS68CP"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
_RECOMMENDED = ("held: every list is headed 'Recommended' and read as counting nothing, so the record adds to general "
                "education alone; no gap is true of a list the page counts: a reconcile wording rule ('Recommended ... "
                "Complete the following number of credits: N' reads as N units to choose) is its lever, the "
                "follow-up's")
HAND.update({cn: _RECOMMENDED for cn in ("06352", "06380", "06381", "44992")})
HAND.update({
    "11293": ("held: on no proved live run: its live row is on 44112287720 and its committed record is "
              "44090886950's (on_live_run)"),
    "45306": ("held: its lists print 13-15 and 1-3, which add to 14-18 around the printed 16; no kind's sentence is "
              "true of a printed total inside the lists' own range, and the stray '4 - 5' its note names is unread: "
              "a reread"),
})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Cabrillo", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"figures_differ": figures_differ})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
