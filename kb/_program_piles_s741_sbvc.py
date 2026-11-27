#!/usr/bin/env python3
"""S741, lane 1 (keys) at San Bernardino Valley: the seven records s740c3 held, 2 collected with named gaps, 5 held.

Plan s740c3 (kb/_program_piles_s740_sbvc.py) collected six of the college's census records and held seven. They are
read again here, by key, from the committed records, their notes and each program's own page as the capture reads it:
college page read 45953233659 (kb/college_reads/s741_keys_san_bernardino_valley_pages.json: 35833, 04894, 17829 and
22784) and S740's read 45835049303 (04873, 39483 and 22821). Sam's ruling (sam-collect-with-gaps-2026-11-17): a
record with a true gap is collected with the gap named and a lower score on the 0-100 bar. No catalog read, no
reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below):
  units_within_printed_range (50)  35833 Geographic Information Systems certificate: the page prints six required rows
        at 3 units (18), 'Elective Courses - One course from the following:' CS 102 (3), CS 120 (4), 'GIS 098 GIS Work
        Experience 1-4', 'GIS 222 ... 1-3' and WST 238 (3), and 'Total Units 18.5-22'. The record places all 14
        listed courses and reads each figure as printed, so the lists add to 19-22: inside the printed 18.5-22, its
        top the range's top. Nothing else differs. Filed by key (f-units-within-range-by-key-only-s740).
  waived_course_counted (50)  22784 Automotive Wheel Alignment and Brakes certificate: the page prints seven required
        rows that add to 16, then 'Complete the following or place into a Transfer-Level MATH course:' over 'TECALC
        087 Technical Calculations 4', and 'Total Units 16-20': the requirement runs from zero to the course's four
        units. The record counts the course, so its 20 is the printed range's top (its own note). The same waiver
        as 22771 and 22776 (s740c3; d-waived-course-counted-at-range-top-s740). S740 held it only because no
        committed receipt names its live run: load 45362852938 inserted it and held five runs. The record file's
        newest commit on main is the commit that filed that load's receipt (FILE_HISTORY, read through the hosting
        API's commits by path), so the file's run, 45355976381, is the row's
        (d-multi-run-load-history-proves-run-s731c); the conductor's live read of 2026-11-27T06:37Z shows the same
        run.

HELD (5), each reason in HAND:
  17829  Environmental Science A.S.: the filed arithmetic is an older scorer's (50-60 against the major's printed
         50-63). Today's scorer passes the major (its low end meets the printed range's low end, Sam's short-high
         reading of 2026-11-17) and reads the degree: the record holds the 60 the page's description prints and a
         general education pattern with no units, and the page prints none ('To earn an SBVC Associate Degree
         students must complete one of the following General Education (GE) patterns'). That is ge_units_not_read on
         today's arithmetic and no kind on the filed one, and a gap filed over the filed score would not survive a
         reconcile's rescore. A free reconcile, its reread, then the record rule.
  04873  Audio Production A.A.: the page itself prints one course under 'Two courses from the following:' and two
         under 'Four courses from the following:' (read 45835049303). No filed kind names a list shorter than its
         count; a new kind is shared code (the follow-up's).
  04894  Music A.A.: the page adds to its printed 27-37 with the applied pair at the 2 units its heading prints
         ('Complete 4 semesters totaling 2 units' over 'MUS 141X2 & MUS 241X2 ... 1'; read 45953233659). The record
         leaves MUS 241X2 without units, the state's file prices it at 0.5, and the scorer adds 1.5 for the pair. No
         gap is true of the page; today's scorer passes the record without the state's list. A reconcile step for
         the pair's printed figure, or a scorer change (the follow-up's).
  22821  Pharmacy Technology certificate: not the program's own page (read from the department page); its own page
         prints seven required courses and 'Total Units 20' (read 45835049303). A site_pages pin and a paid read.
  39483  Nutrition and Dietetics A.S.-T: the record holds the two biology sequences as lists of their own, and the
         page prints them inside 'List A - One to two courses' with no units beside them. Read as the page prints it,
         the lists still do not add to the printed 'Major Total 27-30' (16, one to two courses of 4 or 5 units or a
         sequence, and 3-5), so a paid reread is not shown to close it, and no note quotes two figures.

    python3 kb/_program_piles_s741_sbvc.py --dry-run
    python3 kb/_program_piles_s741_sbvc.py --tag s741k3

Guard: tests/program_piles_s741_sbvc_test.py.
"""
from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s730_saddleback as SD  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
COLLEGE = "San Bernardino Valley College"
SLUG = "san_bernardino_valley"
TAG = "s741k3"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_san_bernardino_valley_2026-11-26_s740c3.json"
READ = "college-page-read run 45953233659"
READ_S740 = "college-page-read run 45835049303"
KEYS = ("04873", "04894", "17829", "22784", "22821", "35833", "39483")
PLACE_INTO = re.compile(r"\bor\s+place\s+into\b", re.I)
# 22784's live run: load 45362852938 inserted it and held five runs, so its receipt names no run for the key. The
# record file's commits on main, newest first, read through the hosting API's commits by path at READ_AT: the newest
# is the commit that filed the load's receipt (#3758), so the file's run is the row's.
READ_AT = "2026-11-27T06:52Z"
LOAD_COMMITS = {"45362852938": "a16777d90094bcde916e4884de6c63cc7c4693e5"}
FILE_HISTORY = {"22784": ["a16777d90094bcde916e4884de6c63cc7c4693e5", "677c408dfaf779344c374f4d8bcc1686c1b4df39"]}
LIVE_READ = {"at": "2026-11-27T06:37:19Z", "by": "the conductor", "22784": "45355976381"}
_MATH = "Complete the following or place into a Transfer-Level MATH course:"


def placement_waiver(filed: dict, e: dict) -> bool:
    """waived_course_counted where the page words the waiver as a placement and prints no figure beside it: the
    named block's own heading says 'or place into', it holds the one course, and read at 0 to the course's units
    today's scorer gives the printed range, whose low end is the record's sum less the course
    (kb/_program_piles_s730_saddleback.py waiver_closes)."""
    bs = B.blocks(filed, e["block"])
    if len(bs) != 1 or not PLACE_INTO.search(str(bs[0].get("name") or "")):
        return False
    courses = bs[0].get("courses") or []
    w = e["waived"]
    if len(courses) != 1 or B.S.norm_code(courses[0].get("code")) != B.S.norm_code(w["code"]):
        return False
    return SD.waiver_closes(filed, e)


REVIEWED = {
    "35833": {"gap": B7.WITHIN, "words_from": "figures", "shape": ["within"], "computed": [19, 22],
              "stated": [18.5, 22],
              "words": "Printed total is 18.5-22 units; required courses sum to 18 and electives range 1-4",
              "page": "'Required Courses:' GEOG 100 (or GIS 100), GIS 130 (or GEOG 130), GIS 133, GIS 134, GIS 135 "
                      "and GIS 137 at 3; 'Elective Courses - One course from the following:' 'CS 102 ... 3', 'CS 120 "
                      "... 4', 'GIS 098 GIS Work Experience 1-4', 'GIS 222 Independent Study in Geographic "
                      "Information Systems 1-3', 'WST 238 ... 3'; 'Total Units 18.5-22' (" + READ + ")"},
    "22784": {"gap": "waived_course_counted", "computed": [20, 20], "stated": [16, 20],
              "waived": {"code": "TECALC 087", "units": 4}, "block": _MATH, "shape": ["placement_waiver"],
              "courses": ["TECALC87"],
              "words": "TECALC 087 can be waived by placing into a transfer-level MATH course, which explains the "
                       "16-20 total range",
              "page": "'Required Courses:' AUTO 050 (3), AUTO 050L (1), AUTO 052 (3), AUTO 052L (1), AUTO 064 or "
                      "HMDT 064 (4), AUTO 084 (3) and AUTO 084L (1); 'Complete the following or place into a "
                      "Transfer-Level MATH course:' 'TECALC 087 Technical Calculations 4'; 'Total Units 16-20' (" +
                      READ + "). The page prints no figure beside the placement line; the total's range runs from "
                      "the requirement at zero units to its four"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "17829": ("held: its filed arithmetic is an older scorer's (the major's 50-60 against the printed 50-63). Today's "
              "scorer passes the major (the short-high reading) and reads the degree, the 60 the page's description "
              "prints over a general education pattern with no units (" + READ + "), which is ge_units_not_read on "
              "today's arithmetic and no kind on the filed one. A gap filed over the filed score would not survive a "
              "reconcile's rescore (tests/reconcile_keeps_named_gaps_test.py), so a free reconcile first brings its "
              "score to today's, its reread posts it, and the record rule then names the gap"),
    "04873": ("held: the page itself prints one course under 'Two courses from the following:' (FTVM 112) and two "
              "under 'Four courses from the following:' (FTVM 213, THART 131), over 'Total Units 24-25' (" + READ_S740
              + "), so no reading adds its lists to the printed total; no filed kind names a list shorter than its "
              "count, and a new kind is shared code: the follow-up's"),
    "04894": ("held: no gap is true of the page, which adds to its printed 27-37 with the applied pair at the 2 "
              "units its heading prints ('Complete 4 semesters totaling 2 units' over 'MUS 141X2 & MUS 241X2 ... 1'; "
              + READ + "); the record leaves MUS 241X2 without units, the state's file prices it at 0.5, and the "
              "scorer adds 1.5 for the pair (26.5-36.5). Today's scorer passes the record without the state's list, "
              "and a record it passes is never gap-filed: a reconcile step for the pair's printed figure, or a "
              "scorer change, the follow-up's"),
    "22821": ("held: not the program's own page: read from the Pharmacy Technology department page; the "
              "certificate's own page prints seven required courses and 'Total Units 20' (" + READ_S740 + "): a "
              "site_pages pin and a paid read of 22821 are its lever"),
    "39483": ("held: the record holds the two biology sequences as lists of their own, and the page prints them "
              "inside 'List A - One to two courses from the following:' with no units beside them (" + READ_S740 +
              "). Read as the page prints it the lists still do not add to the printed 'Major Total 27-30' (16, one "
              "to two List A courses of 4 or 5 units or a sequence, and List B's 3-5), so a paid reread is not shown "
              "to close it; no note quotes two figures that disagree, and no kind is true of it"),
})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="San Bernardino Valley", prior=B.LiveRuns(COLLEGE, SLUG),
            keys=KEYS, reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"placement_waiver": placement_waiver},
            file_history=FILE_HISTORY, load_commits=LOAD_COMMITS, read_at=READ_AT)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
