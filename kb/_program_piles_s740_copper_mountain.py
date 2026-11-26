#!/usr/bin/env python3
"""S740, lane 1 (reads), the cheap pile at Copper Mountain: the census's 9 wording-rule records, 1 collected with a named gap and 8 held.

The census on main (kb/status/harvest_gap_census.json, run 45816008322, written 2026-11-26 12:06Z) lists 9 Copper
Mountain College records under the reconcile_steps lever. They are read from the committed records, their notes,
today's capture and the reissued 2026-2027 catalog's course descriptions (college page reads 45835379921 and
45849832859, kb/college_reads/s740_reads_copper_mountain_renumbers*.json). Sam's ruling, as
kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and a lower score on
the 0-100 bar, never held, unless the record is not the program's own; and a named gap must be true for its record.
No catalog read, no reconcile, no record changed, no new kind. The college has no earlier piles module, so its live
runs are read by the shared module's LiveRuns: load 39035576595 inserted every key at run 39035222722.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  noted_figures_differ (40)  42178 Biology A.S.-T: the page prints 'Required Courses 32-33' over courses that add to
        30 (22 core and one 8-unit physics series); its note quotes both.

HELD (8), each reason in HAND. Every filed record here was read from the 09.03.26 file, whose address answers 404;
the reissue is another address, so a reconcile's moved-page guard would leave each as filed and the renumber pairs
reach them only through a read of the reissue (the capture lists these programs as moved; no force is needed):
  18519  Liberal Arts: Social and Behavioral Sciences A.A.: its arithmetic passes (18 against 18) and coverage fails only
         on four courses the catalog prints under a new subject code (PSYC 003, PSYC 005, SOCI 002, SOCI 004 for PSY 3,
         PSY 5, SOC 2, SOC 4; its own note, and each course description's 'Formerly known as'). The pairs are in the
         college's reconcile entry now. Its page is shared with 18520 and its heading prints '&' for the title's
         'and', so the shared own-heading form does not show it: a read of the reissue passes it.
  14737, 20094  Vocational Nursing A.S. and certificate: not collectable until PSYC 003 reads as the state's PSY 3 (the
         pair is in the college's entry now); then noted_figures_differ fits (54.6 against the printed 56, both in
         its note). Two steps, a rename and then a gap: a read of the reissue first.
  16657  Registered Nursing A.S.: not collectable until PSYC 003 and COMM 007 read as PSY 3 and SP 7 (the pairs are in
         the entry now); then prerequisites_counted fits (the printed 37 is the nursing courses alone). A free
         reconcile first.
  14710  General Business A.S.: the restricted electives' figure depends on the work experience units taken, and three
         concentrations print totals their courses do not add to; no one kind is true for the row.
  14751  Fire Technology A.S.: the filed arithmetic (42-48 against the major's 42) is an older scorer's, and today's
         reads the degree (63-69 against 60); a read of the reissue files today's before any gap is read.
  43854  History A.A.: the major adds to its printed 24, and the degree's 58-67 holds the printed 60 inside it: the
         units within-range kind (d-within-range-sums-hold-for-units-kind-s739).
  45594  Elementary Teacher Education A.A.-T: List C prints '3-12' beside 'Up to 12 additional units', and the printed
         32-49 adds only with that list from zero; its notes quote no second figure, and CD 10 is unplaced until
         CDEV C1000 reads as it.

    python3 kb/_program_piles_s740_copper_mountain.py --dry-run
    python3 kb/_program_piles_s740_copper_mountain.py --tag s740r3

Guard: tests/program_piles_s740_copper_mountain_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Copper Mountain College"
SLUG = "copper_mountain"
TAG = "s740r3"
HELD_BY = "kb/status/harvest_gap_census.json (reconcile_steps at Copper Mountain College, written 2026-11-26 12:06Z)"
KEYS = ("14710", "14737", "14751", "16657", "18519", "20094", "42178", "43854", "45594")

REVIEWED = {
    "42178": {"gap": "noted_figures_differ", "computed": [30, 30], "stated": [32, 33],
              "words": "The printed 'Required Courses 32-33' does not match the listed courses",
              "shape": ["note_quotes"],
              "quotes": {"stated": "'Required Courses 32-33'", "computed": "sum to 30 units"}},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
_VN = ("held: not collectable until PSYC 003 reads as the state's PSY 3 (the pair is in the college's reconcile entry "
       "now); then noted_figures_differ fits, its note quoting the courses' 54.6 against 'Total Units for the Major "
       "56'. Two steps, a rename and then a gap: a read of the reissue first")
HAND.update({
    "14737": _VN,
    "20094": _VN,
    "16657": ("held: not collectable until PSYC 003 and COMM 007 read as the state's PSY 3 and SP 7 (the pairs are in "
              "the college's reconcile entry now); then prerequisites_counted fits, the printed 37 being the nursing "
              "courses alone (its note). Two steps, a rename and then a gap: a read of the reissue first"),
    "18519": ("held: its arithmetic passes (18 against the printed 18) and coverage fails only on PSY 3, PSY 5, SOC 2 "
              "and SOC 4, which the catalog prints as PSYC 003, PSYC 005, SOCI 002 and SOCI 004 (its own note; the "
              "pairs are in the college's reconcile entry now). Its page is shared with 18520, and its heading prints "
              "'&' where the state's title says 'and', so the shared own-heading form does not show the section its "
              "own: a read of the reissue, with the pairs, passes it"),
    "14710": ("held: the restricted electives' figure depends on the work experience units taken, and three "
              "concentrations print totals their courses do not add to (20, 11 and 14); no one kind is true for the "
              "row: a reread, or a person"),
    "14751": ("held: the filed arithmetic (42-48 against the major's 42) is an older scorer's, and today's reads the "
              "degree (63-69 against 60): a read of the reissue files today's before any gap is read"),
    "43854": ("held: the major adds to its printed 24, and the degree's 58-67 holds the printed 60 inside it, matching "
              "neither end: it waits on the units within-range kind (d-within-range-sums-hold-for-units-kind-s739)"),
    "45594": ("held: List C prints '3-12' beside 'Up to 12 additional units', and the printed 32-49 adds only with "
              "that list from zero; its notes quote no second figure, and CD 10 is unplaced until CDEV C1000 reads as "
              "it: a read of the reissue with the pair, then a gap"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Copper Mountain", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
