#!/usr/bin/env python3
"""S742, lane 1 (keys) at San Bernardino Valley: the four records s741k3 still held, 2 collected with named gaps, 2 held.

Plan s741k3 (kb/_program_piles_s741_sbvc.py) held five of the college's records; 22821 has passed since by its pin
and a paid read. The other four are read again here, by key, from the committed records, their notes and each
program's own page as the capture reads it (college page reads 45835049303 and 45953233659, the reads S740 and S741
quote). Sam's ruling (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap named and
a lower score on the 0-100 bar, never held for another night. No catalog read, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below), lists_not_closed (30): a choice list prints no unit figure of its own,
so the lists alone cannot add the program's units. Each entry's words are the record's own note, which says what
its list prints:
  04873  Audio Production A.A.: the page prints 'Required Courses:' (FTVM 130, 114, 111 and 110 at 3), 'Two courses
         from the following:' over one course (FTVM 112), 'Four courses from the following:' over two (FTVM 213,
         THART 131), a work experience list of at least three units, 'Electives - One course from the following:' and
         'Total Units 24-25' (read 45835049303). Neither short list prints a unit figure, and each asks for more
         courses than it prints, so no reading adds the lists to the printed total: the record's courses add to 18
         with both lists open. S741 held it for want of a kind that names a list shorter than its count; the kind's
         sentence is true of the page as it stands, and the note filed beside it says which lists and how short.
  39483  Nutrition and Dietetics A.S.-T: the page prints 'Required Courses:' (16 units), 'List A - One to two
         courses from the following:' with no unit figure, over CHEM 151 (5), CHEM 212 (5), 'One Biology Course
         Sequence' (BIOL 250 & 251, or BIOL 260 & 261, no units beside either) and the statistics row (4), then 'List
         B - One course from the following:' (3 to 5) and 'Major Total 27-30' (read 45835049303). List A takes one
         course or two, a sequence among them, and prints no figure that says which, so the lists alone cannot add
         to the printed 27-30: read as the page prints them they run from 23 to 31. The record holds each sequence
         as a list of its own and adds 31-34.

HELD (2), each reason in HAND:
  17829  Environmental Science A.S.: its filed arithmetic is an older scorer's. The free reconcile of this session
         brings its score to today's, keep-better's S741 ranking keeps it, and the reread posts it; its gap
         (ge_units_not_read on today's arithmetic) is filed on the reread row, never on the filed score
         (d-reread-before-rebuilt-plan-s741).
  04894  Music A.A.: no gap is true of the page, which adds to its printed 27-37 with the applied pair at the 2
         units its heading prints ('Complete 4 semesters totaling 2 units' over 'MUS 141X2 & MUS 241X2 ... 1'; read
         45953233659). Today's scorer passes the record without the state's list, and a record it passes is never
         gap-filed. The scorer change S741 named (a required list's printed figure ahead of the state's price for a
         course read without units) was measured this session over 18,970 records: 9 fail to pass and 22 pass to
         fail, so it is not proposed. What is left is the college's own reconcile steps for the row (and_units for
         the '&' row, then the heading's total), which need the entry's awards opened to credit programs.

    python3 kb/_program_piles_s742_sbvc.py --dry-run
    python3 kb/_program_piles_s742_sbvc.py --tag s742k2

Guard: tests/program_piles_s742_sbvc_test.py.
"""
from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B = B7.B
S = B.S
COLLEGE = "San Bernardino Valley College"
SLUG = "san_bernardino_valley"
TAG = "s742k2"
HELD_BY = "kb/receipts/program_requirement_records_piles_s740_san_bernardino_valley_2026-11-27_s741k3.json"
READ_S740 = "college-page-read run 45835049303"
READ_S741 = "college-page-read run 45953233659"
KEYS = ("04873", "04894", "17829", "39483")
COUNT_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6}
COUNT_RANGE = re.compile(r"\b(%s)\s+to\s+(%s)\s+courses?\b" % ("|".join(COUNT_WORDS), "|".join(COUNT_WORDS)), re.I)


def short_lists(filed: dict, e: dict) -> bool:
    """lists_not_closed where the page prints fewer courses under a list than the list asks for: each named list
    chooses courses, prints no unit figure of its own, asks for more courses than it holds, and every course it
    holds carries its units (so nothing is missing from a row: the list itself is short)."""
    names = e.get("short") or []
    if len(names) < 1:
        return False
    for name in names:
        bs = B.blocks(filed, name)
        if len(bs) != 1:
            return False
        b = bs[0]
        courses = b.get("courses") or []
        n = S._num(b.get("minimum"))
        if b.get("rule") != "choose_courses" or S._span(b.get("stated")) is not None or n is None \
                or not courses or len(courses) >= n or any(S._num(c.get("units")) is None for c in courses):
            return False
    return True


def count_range(filed: dict, e: dict) -> bool:
    """lists_not_closed where a list's heading prints a range of courses and no unit figure: the named list chooses
    courses, prints no unit figure of its own, its heading names a count from n to m and the record keeps n; and
    the sequences the page prints inside it sit in the record as lists of their own (e["inside"]), one option
    group, each with no figure and no units beside its courses."""
    bs = B.blocks(filed, e.get("open") or "")
    if len(bs) != 1:
        return False
    b = bs[0]
    m = COUNT_RANGE.search(str(b.get("name") or ""))
    if b.get("rule") != "choose_courses" or S._span(b.get("stated")) is not None or not m \
            or S._num(b.get("minimum")) != COUNT_WORDS[m.group(1).lower()] \
            or COUNT_WORDS[m.group(2).lower()] <= COUNT_WORDS[m.group(1).lower()]:
        return False
    inside = [x for name in e.get("inside") or [] for x in B.blocks(filed, name)]
    return len(inside) == len(e.get("inside") or []) >= 1 and len({x.get("option_group") for x in inside}) == 1 \
        and inside[0].get("option_group") is not None \
        and all(S._span(x.get("stated")) is None and x.get("courses")
                and all(S._num(c.get("units")) is None for c in x["courses"]) for x in inside)


_LIST_A = "List A - One to two courses from the following:"
REVIEWED = {
    "04873": {"gap": "lists_not_closed", "computed": [18, 18], "stated": [24, 25], "shape": ["short_lists"],
              "short": ["Two courses from the following:", "Four courses from the following:"],
              "words": "block lists only one course (FTVM 112) and the 'Four courses from the following:' block "
                       "lists only two (FTVM 213, THART 131)",
              "courses": ["FTVM112", "FTVM213", "THART131"],
              "page": "'Required Courses:' FTVM 130, FTVM 114, FTVM 111 and FTVM 110 at 3; 'Two courses from the "
                      "following:' over FTVM 112 (3) alone; 'Four courses from the following:' over FTVM 213 (3) and "
                      "THART 131 (3); 'Work Experience - Complete a minimum of three units from the following:'; "
                      "'Electives - One course from the following:'; 'Total Units 24-25' (" + READ_S740 + ")"},
    "39483": {"gap": "lists_not_closed", "computed": [31, 34], "stated": [27, 30], "shape": ["count_range"],
              "open": _LIST_A,
              "inside": ["One Biology Course Sequence: BIOL 250 & BIOL 251",
                         "One Biology Course Sequence: BIOL 260 & BIOL 261"],
              "words": "a sequence appears to count as one of the List A choices rather than being independently "
                       "required",
              "courses": ["CHEM151", "CHEM212", "BIOL250", "BIOL251", "BIOL260", "BIOL261"],
              "page": "'Required Courses:' FN 162 (3), PSYC C1000 (3), CHEM 150 (5) and BIOL 270 (5); 'List A - One "
                      "to two courses from the following:' with no unit figure, over CHEM 151 (5), CHEM 212 (5), "
                      "'One Biology Course Sequence' BIOL 250 & BIOL 251 or BIOL 260 & BIOL 261 with no units beside "
                      "them, and STAT C1000 (4); 'List B - One course from the following:' (3 to 5); 'Major Total "
                      "27-30' (" + READ_S740 + ")"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "17829": ("held: its filed arithmetic is an older scorer's (the major's 50-60 against the printed 50-63). The free "
              "reconcile of this session brings its score to today's, keep-better's S741 ranking keeps a re-read "
              "whose major equals over a filed record whose major does not, and a reread posts it; its gap, "
              "ge_units_not_read on today's arithmetic (" + READ_S741 + "), is filed on the reread row, never over "
              "the filed score (d-reread-before-rebuilt-plan-s741)"),
    "04894": ("held: no gap is true of the page, which adds to its printed 27-37 with the applied pair at the 2 "
              "units its heading prints ('Complete 4 semesters totaling 2 units' over 'MUS 141X2 & MUS 241X2 ... 1'; "
              + READ_S741 + "). Today's scorer passes the record without the state's list, and a record it passes "
              "is never gap-filed. The scorer change (a required list's printed figure ahead of the state's price "
              "for a course read without units) moves 9 records fail to pass and 22 pass to fail over 18,970, so it "
              "is not proposed; the college's own reconcile steps for the '&' row and the heading's total are what "
              "is left, the follow-up's"),
})


class Pile(B7.Pile):
    """S740's Pile with the two list shapes' own boundary readings."""

    def break_shape(self, g: dict, e: dict, sh: str) -> dict | None:
        if sh == "short_lists":
            # The first short list filled to its count: a list that holds what it asks for is not short.
            b = B.blocks(g, e["short"][0])[0]
            while len(b["courses"]) < S._num(b["minimum"]):
                b["courses"].append(dict(b["courses"][0], code="%s (%d)" % (b["courses"][0]["code"], len(b["courses"]))))
            return g
        if sh == "count_range":
            # The list prints its own unit figure: its units no longer depend on which choice is taken.
            B.blocks(g, e["open"])[0]["stated"] = {"min": 4, "max": 10}
            return g
        return super().break_shape(g, e, sh)


W = Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="San Bernardino Valley", prior=B.LiveRuns(COLLEGE, SLUG),
         keys=KEYS, reviewed=REVIEWED, hand=HAND, held_by=HELD_BY,
         shapes={"short_lists": short_lists, "count_range": count_range})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
