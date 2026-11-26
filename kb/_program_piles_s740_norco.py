#!/usr/bin/env python3
"""S740, lane 1 (the census's reconcile_steps lever) at Norco: 14 records, 2 collected with a named gap, 12 held.

The census on main (kb/status/harvest_gap_census.json, written 2026-11-26 12:06Z) lists 14 Norco College records under
the reconcile_steps lever. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected
with its gap named and a lower score, never held, unless the record is not the program's own. The brief of S740 adds
one more hold: a record whose fix is a change to shared reader code is held with the change named. The 14 are read from
the committed records, their notes and today's capture, and five of their pages were read free, as the capture reads
them (college-page-read run 45835049303, kb/college_reads/s740_reconcile_norco_pages.json). No reconcile, no record
changed, no new kind. The college has no earlier piles module, so its live runs are read by the shared module's
LiveRuns.

COLLECTED WITH A NAMED GAP (2, REVIEWED below):
  lists_not_closed (30)  30107 Math & Sciences A.S.: 'The remaining units may be taken from any of the following courses'
        to reach the 18-unit total, a list with no figure of its own. 30109 Humanities, Philosophy & Arts A.A.: the
        studio list is a cap ('Up to three units may be taken in a studio course'), read as a list with no figure;
        without it the 18 units of the disciplines list add to the printed 18.

HELD (12):
  THE FLATTENED TABLE (11): 30091, 40079, 32830, 33751, 33854, 37311, 39998, 40064, 41680, 44792, 44961. Norco's
        curriQunet page prints a figure over Required Courses that the rows under it do not add to as the capture's
        text gives them. Philosophy A.A.-T 32830 prints 'Units: 9.00' over two 'Choose one course' groups of 3.00 (PHI-10,
        PHI-10H, PHI-12; then PHI-32, MATH-32); Drafting Technology 30091 and 40079 print 'Units: 14.00-15.00' over four
        'Select one of the following' groups that add to 11-12 (DFT-51, ENE-51, CON-62 and DFT-62 under one '2.00-3.00');
        Social Justice Studies 41680 prints 'Units: 10.00' over groups of 3 and 4 (the page read printed each). The text
        is flat: a row that follows a group may be a required course of its own, and nothing in the text says where a
        group ends. 44792's own note says it: 'The flattened table loses indentation, so it is unclear which rows are
        standalone required courses and which belong to a preceding Select one of the following group'. The fix is the
        capture's (kb/_program_requirements_college.py, the curriQunet text): keep each group's end in the text it
        hands the reader, then a paid reread. The page's own data carries the grouping: a group's row is marked
        data-is-group-with-condition and its rows sit in a block-entry-children wrapper (college-page-read run
        45840110369, kb/college_reads/s740_reconcile_norco_structure.json), which the text drops. A change to
        shared reader code is out of S740's scope, so each is held
        with that reason; no named kind says 'the text lost the grouping', and noted_figures_differ would state a
        disagreement in the catalog that the catalog's own layout may settle.
  30061  not collectable: the reader's own note says MAG-200 'should be catalog_addition true' and the record files it
         as a listed course, so the invented check fails though the units add up (30 = 30). No record is edited by
         hand: a paid reread.

    python3 kb/_program_piles_s740_norco.py --dry-run
    python3 kb/_program_piles_s740_norco.py --tag s740c1

Guard: tests/program_piles_s740_norco_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Norco College"
SLUG = "norco"
TAG = "s740c1"
HELD_BY = "kb/status/harvest_gap_census.json (reconcile_steps at Norco College, written 2026-11-26 12:06Z)"
READ = "college-page-read run 45835049303"
KEYS = ("30061", "30091", "30107", "30109", "32830", "33751", "33854", "37311", "39998", "40064", "40079", "41680",
        "44792", "44961")
STUDIO = "Applicable Studio Courses Include:"

REVIEWED = {
    "30107": {"gap": "lists_not_closed", "computed": [7, 16], "stated": [18, 18],
              "words": "no numeric minimum is printed, so minimum is null",
              "shape": ["open"], "open": "Elective Courses"},
    "30109": {"gap": "lists_not_closed", "computed": [18, 18], "stated": [18, 18],
              "words": "The studio block is a cap ('Up to three units may be taken in a studio course'), not a "
                       "minimum, so its minimum is null",
              "ops": [("drop", STUDIO)], "shape": ["open"], "open": STUDIO},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
FLAT = ("held: the flattened table: the page prints %s, and the capture's text is flat, so a row after a 'Select one' "
        "group may be a required course of its own and nothing says where the group ends (" + READ + "; 44792's own "
        "note: 'The flattened table loses indentation'). The page's own data nests a group's rows (a row marked "
        "data-is-group-with-condition over a block-entry-children wrapper: college-page-read run 45840110369). The "
        "fix is the capture's: keep each group's end in the curriQunet text it hands the reader, then a paid "
        "reread. A change to shared reader code is out of S740's scope")
HAND.update({
    "30091": FLAT % "'Units: 14.00-15.00' over four 'Select one of the following' groups that add to 11-12",
    "40079": FLAT % "'Units: 14.00-15.00' over four 'Select one of the following' groups that add to 11-12",
    "32830": FLAT % "'Units: 9.00' over two 'Choose one course' groups of 3.00",
    "41680": FLAT % "'Units: 10.00' over two 'Select one' groups of 3.00 and 4.00",
    "33751": FLAT % "'Total: 33.00-34.00' over nine 'Choose one' groups whose printed figures add to 26-27",
    "33854": FLAT % "'Total: 33.00-34.00' over nine 'Choose one' groups whose printed figures add to 26-27",
    "39998": FLAT % "'Units: 16.00' over APP-450 at 4.00 and 'Units: 14.00-15.00' over five 'Choose one course' "
                    "groups with four courses between them",
    "40064": FLAT % "'Units: 16.00' over APP-450 at 4.00 and 'Units: 14.00-15.00' over five 'Choose one course' "
                    "groups with four courses between them",
    "44792": FLAT % "'Units: 48.00' over thirteen 'Select one of the following' groups that add to 42 as read",
    "44961": FLAT % "'Units: 26.00- 27.00' over seven 'Select one of the following' groups that add to 23-24",
    "37311": FLAT % "'Electives - List A 15.00' over rows that add to 14 as read, GEG-1L (1 unit) listed as a choice "
                    "beside GEG-1",
    "30061": ("held: not collectable: the reader's own note says MAG-200 'should be catalog_addition true' and the "
              "record files it as a listed course, so the invented check fails though the units add up (30 = 30); no "
              "record is edited by hand: a paid reread"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Norco", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
