#!/usr/bin/env python3
"""S740, lane 1 (reads), the cheap pile at Santa Ana: the census's wording-rule records a reconcile did not pass.

The census on main (kb/status/harvest_gap_census.json, run 45816008322, written 2026-11-26 12:06Z) lists 15 Santa Ana
College records under the reconcile_steps lever. Four pass since the college's first reconcile (run 45841675928,
staged from the filed capture, free): the three Liberal Arts emphases 18581, 18582 and 19268 by the college's
pool_lists step (kb/program_requirements_reconcile.json), and Earth Science 31980 by today's scorer alone. They are no
keys here. The other 11 are read from the committed records, their notes, today's capture and the college page read
of each program's own entry (run 45835379921, kb/college_reads/s740_reads_santa_ana_pages.json, each entry read as
the capture reads it). Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with
its gap named and a lower score on the 0-100 bar, never held, unless the record is not the program's own; and a named
gap must be true for its record (d-within-range-sums-hold-for-units-kind-s739). No catalog read, no reconcile, no
record changed, no new kind. The college has no earlier piles module, so its live runs are read by the shared
module's LiveRuns: load 38909293531 inserted every key at run 38843461766, and reread 45841675928's receipt posts the
rows the reconcile restamped.

COLLECTED WITH A NAMED GAP (7, REVIEWED below; each entry's page words are the page read's):
  required_list_outside_total (70)  32096 Kinesiology A.A.-T: the page asks for 'a maximum of one (1) course from any
        three (3) of the following areas for a minimum of three units', prints each area at 0.0 and prints 'Total :
        18.0- 20.5', which is the required 11 and the electives' 7.0-9.5. The record counts the three units; without
        that list the courses add to the printed 18-20.5.
  pair_read_as_alternatives (50)    08720 Engineering CAD Drafting A.S.: the Mechanical Option prints 12.0 over four
        3-unit rows, the last two 'ENGR 105 OR MNFG 105' and 'MNFG 106 Solidworks Drawings 3.0', with the OR after
        MNFG 106 standing between the two options. The record keeps MNFG 106 as a third alternative of ENGR 105, so
        the option adds to 9 and the low end to 18 against the printed 21-24. With the option at its printed 12 the
        courses add to 21-24.
  noted_figures_differ (40)         five records whose page prints two figures that disagree:
        18780 Pharmacy Technology Basic Option certificate: 'Required Courses: 16.5- 20.5' and 'Total : 16.5- 20.5'
              over PHAR 048 (2.0) and a group printed 14.0- 15.5, which add to 16-17.5; its note quotes both.
        04230 Pharmacy Technology A.S.: 'Total : 28.0- 32.0' over groups printed 2.0, 20.5- 21.0, 0.5- 1.0 and
              1.5- 5.0, which add to 24.5-29; its note quotes both.
        21748 Accounting certificate: 'Core Requirements: 15.0- 16.0' over courses that add to 14-15 (4, 4, 3, and
              ACCT 210 at 3 or BA 188 and BA 189 together at 4), with stray group figures '2.0' and '2.0- 3.0'; with
              the core at its printed 15-16 the lists add to the printed 21-24. Two gaps on one row: the record also
              keeps BA 188 and BA 189 as separate alternatives (pair_read_as_alternatives, 50); the lower score is
              filed and both notes.
        31887 Elementary Teacher Education A.A.-T: 'Required Core Courses 45.0' adds only with the biology choice at
              4 units, and the page prints that choice at '3.0- 4.0' (BIOL 109H alone at 3.0; BIOL 109 with BIOL
              109L at 4); with the core at its printed 45 the lists add to the printed 52. It is the reverse
              containment: the printed 52 lies inside the record's sum, 51-52, by the biology choice's 3-4 units.
        04256 Economics A.A.: 'Course 22.0- 23.5' over courses that add to 21-22.5, and 'Total : 25.0- 26.5', which
              adds the 3.0 the page heads 'Recommended electives:'. With the requirements at their printed 22-23.5
              and the 3 units counted, the figures add to the printed total. Two gaps on one row, both notes filed.
HELD (4), each reason in HAND:
  04238  English A.A.: not the program's own. It was read from the entry of English A.A.-T 32436, whose page prints
         'Program Control Number: 32436'.
  21789  Pharmacy Technology Advanced Option certificate: its groups add to 24.5-29, inside the printed 'Total :
         24.0- 30.0'. It waits on units_within_printed_range (d-within-range-sums-hold-for-units-kind-s739), filed
         by key once that kind is on main.
  31859  Political Science A.A.-T: its sum, 19-19.5, sits inside the printed 'Total : 18.0- 19.5' (List A prints
         6.0- 7.5 and also takes a core course, where its two listed rows carry 7-7.5): the within-range case S739
         rejected for a lists kind (d-lists-gap-holds-range-sums-s703). It waits, with 21789, on
         units_within_printed_range, filed by key once that kind is on main.
  32533  Spanish A.A.-T: the record counts the 'Substitution Courses' list (10 units), which a student takes only in
         place of Spanish 101 and 102; without it the courses add to the printed 23-24. No kind names a substitute
         list counted, and required_list_outside_total would be false for it (the program does not require the list).

    python3 kb/_program_piles_s740_santa_ana.py --dry-run
    python3 kb/_program_piles_s740_santa_ana.py --tag s740r2

Guard: tests/program_piles_s740_santa_ana_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Santa Ana College"
SLUG = "santa_ana"
TAG = "s740r2"
HELD_BY = "kb/status/harvest_gap_census.json (reconcile_steps at Santa Ana College, written 2026-11-26 12:06Z)"
PAGE_READ = "45835379921"
# The census's 15, less the four the college's first reconcile passed (run 45841675928).
RECONCILED = ("18581", "18582", "19268", "31980")
KEYS = ("04230", "04238", "04256", "08720", "18780", "21748", "21789", "31859", "31887", "32096", "32533")

_AREAS = ("Select a maximum of one (1) course from any three (3) of the following areas for a minimum of three units: "
          "Aquatics, Combatives, Team Sports, Individual Sports, Fitness, Dance")
_REQS = ("Requirements", "Requirements (BUS 150 or MATH 145)", "Requirements (Statistics)")

REVIEWED = {
    "32096": {"gap": "required_list_outside_total", "computed": [21, 23.5], "stated": [18, 20.5],
              "words": "The printed total 18.0-20.5 equals 11 required units plus 7.0-9.5 elective units; it appears "
                       "not to count the minimum 3 units from the movement areas",
              "ops": [("drop", _AREAS)],
              "page": "each area's heading prints 0.0 ('Select a maximum of one (1) course from the Aquatics area: | "
                      "0.0'); 'Required Courses | 11.0'; 'Elective Courses: Select two courses | 7.0- 9.5'; 'Total : "
                      "18.0- 20.5'"},
    "08720": {"gap": "pair_read_as_alternatives", "computed": [18, 24], "stated": [21, 24],
              "words": "Read with the 12-unit option total (3+3+3+3), MNFG 106 is probably a separate required course",
              "ops": [("choose", "Mechanical Option", 12)],
              "page": "'Mechanical Option | 12.0' over four 3.0 rows: 'ENGR 103 OR MNFG 103', 'ENGR 104 OR MNFG "
                      "104', 'ENGR 105 OR MNFG 105' and 'MNFG 106 Solidworks Drawings ( Historical ) 3.0', then 'OR | "
                      "Civil Option | 14.0'; 'Total : 21.0- 24.0'"},
    "18780": {"gap": "noted_figures_differ", "computed": [16, 17.5], "stated": [16.5, 20.5],
              "words": "The printed totals (Required Courses 16.5-20.5; Total 16.5-20.5) do not match the sum of the "
                       "required courses",
              "shape": ["note_quotes"], "quotes": {"stated": "Total 16.5-20.5", "computed": "16.0-17.5"},
              "page": "'Required Courses: | 16.5- 20.5', 'PHAR 048 ... 2.0', a group printed '14.0- 15.5', 'Total : "
                      "16.5- 20.5'"},
    "04230": {"gap": "noted_figures_differ", "computed": [24.5, 29], "stated": [28, 32],
              "words": "Printed total 28.0-32.0 does not match the sum of the printed group units",
              "shape": ["note_quotes"], "quotes": {"stated": "28.0-32.0", "computed": "24.5-29.0"},
              "page": "'Required Course: | 28.0- 32.0', 'PHAR 048 ... 2.0', groups printed '20.5- 21.0', '0.5- 1.0' "
                      "and '1.5- 5.0', 'Total : 28.0- 32.0'"},
    "21748": {"gap": "noted_figures_differ", "computed": [19, 22], "stated": [21, 24],
              "words": "the core is stated as 15.0-16.0, which does not obviously match 4+4+3+(3 or 4)=14-15",
              "also_words": "The alternative to ACCT 210 (3.0) is the pair BA 188 AND BA 189 (2.0 each) taken "
                            "together, not either one alone",
              "ops": [("choose", "Core Requirements", 15, 16)],
              "page": "'Core Requirements: | 15.0- 16.0' over ACCT 101 4.0, ACCT 102 4.0, '3.0 | BUS 222 OR MGMT "
                      "122' and '2.0 | 2.0- 3.0 | ACCT 210 3.0 OR BA 188 2.0 AND BA 189 2.0'; 'Select a minimum of 6 "
                      "units from the following: | 6.0- 8.0'; 'Total : 21.0- 24.0'"},
    "31887": {"gap": "noted_figures_differ", "computed": [51, 52], "stated": [52, 52],
              "words": "the 45-unit core total only adds up with 4 units here",
              "hand": "the reverse containment: the printed 52 lies inside the record's sum, 51-52, which runs from "
                      "the biology choice at 3 units (BIOL 109H alone) to 4; the page prints that choice at '3.0- "
                      "4.0' and the core at 45.0, which adds only at 4",
              "ops": [("choose", "Required Core Courses", 45)],
              "page": "'Required Core Courses | 45.0'; the biology choice prints '1.0 | 3.0- 4.0 | BIOL 115 4.0 OR "
                      "BIOL 109H 3.0 OR BIOL 109 3.0 AND BIOL 109L 1.0'; 'Total : 52.0'"},
    "04256": {"gap": "noted_figures_differ", "computed": [22, 22.5], "stated": [25, 26.5],
              "words": "The Requirements group prints a total of 22.0-23.5 units",
              "also_words": "the printed Total 25.0-26.5 appears to include these 3 units (22.0-23.5 + 3.0)",
              "ops": [("pool", list(_REQS), 22, 23.5), ("choose", "Recommended electives:", 3)],
              "page": "'Course | 22.0- 23.5' over ACCT 101 4.0, ACCT 102 4.0, ECON C2002 3.0, ECON C2001 3.0, '3.0- "
                      "4.0 | BUS 150 OR MATH 145' and '4.0- 4.5 | STAT C1000 OR STAT C1000H OR STAT C1000E'; "
                      "'Recommended electives: | 3.0 | 3.0 | BUS 101 OR BUS 120'; 'Total : 25.0- 26.5'"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "04238": ("held: not the program's own: the record was read from the entry of English A.A.-T 32436 (34297/36122/"
              "35925), whose page prints 'English : A.A.-T Degree for Transfer' and 'Program Control Number: 32436' "
              "(college page read 45835379921); its own note says the only section in the text is the A.A.-T's"),
    "21789": ("held: its groups add to 24.5-29, inside the printed 'Total : 24.0- 30.0' and matching neither end; it "
              "waits on the units within-range kind, units_within_printed_range "
              "(d-within-range-sums-hold-for-units-kind-s739), filed by key once that kind is on main; no kind filed "
              "here is true for it"),
    "31859": ("held: its sum, 19-19.5, sits inside the printed 'Total : 18.0- 19.5' (List A prints 6.0- 7.5 and also "
              "takes a core course, where its two listed rows carry 7-7.5): the within-range case S739 rejected for a "
              "lists kind (d-lists-gap-holds-range-sums-s703). It waits, with 21789, on the units within-range kind, "
              "units_within_printed_range, filed by key once that kind is on main"),
    "32533": ("held: the record counts the 'Substitution Courses' list (10 units), which the page says a student "
              "with credit for Spanish 101 and 102 takes in their place; without it the courses add to the printed "
              "23-24. No kind names a substitute list counted, and required_list_outside_total would be false for it: "
              "a reader change (the scorer's substitute list reads Glendale's wording alone)"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Santa Ana", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
