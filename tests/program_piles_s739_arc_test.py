#!/usr/bin/env python3
"""S739, lane 2's cheap piles at American River: the seven records s727b held, five collected with named gaps (kb/_program_piles_s739_arc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the seven keys are s727b's holds; 5 collected (no new kind), 2 held as another award's section;
  * 12191's unit line closes it (37 + 23 is the printed 60), and its cheaper lever is named in the receipt;
  * the own-page guard: 12238 by its own heading (the capture found it; 07206's record carries another), 30595 and
    39341 by their own list (30595's page-mate holds another list; the award's unit band tells 39341 from 39731 and
    39732, whose bands the printed 48 sits outside);
  * 39731 and 39732 stay held whatever entry they are given: the band refuses them.

Run from repo root: python3 tests/program_piles_s739_arc_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_arc as A  # noqa: E402

W = A.W
ROWS = {"07207": "option_lists_read_apart", "12238": "option_lists_read_apart", "12191": "unit_line_not_read",
        "30595": "heading_not_in_text", "39341": "heading_not_in_text"}
HELD = {"39731": ["not the program's own", "8 to fewer than 16 units"],
        "39732": ["not the program's own", "16 to fewer than 30 units"]}
SCORES = {"option_lists_read_apart": 40, "unit_line_not_read": 40, "heading_not_in_text": 20}
OWN = {"12238": "own_heading", "30595": "own_list", "39341": "own_list"}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=26, own=OWN)
check = t.check

# 12191: the unit line alone closes it, and its lever is named.
f = W.load("12191")
check(B.closes(f, B.apply_ops(f, [("line", 23)])) and not B.closes(f, B.apply_ops(f, [("line", 22)])),
      "12191: 37 + 23 is the printed 60, and no other line closes it")
check("unit_line" in A.REVIEWED["12191"]["lever"], "12191: its cheaper lever is named")

# The own-page guard. 12238: the capture's finding and the heading both carry it.
f = W.load("12238")
e = A.REVIEWED["12238"]
check(W.shared_with("12238") == ["07206"], "12238 was read from 07206's page")
g = copy.deepcopy(f)
g["record"]["program"]["section_heading"] = "A.A. in CIS: Microcomputer Applications"
check(W.own(g, e) is None, "12238: with 07206's heading its section is not shown its own")
saved = W._sources
W._sources = copy.deepcopy(W.sources())
W._sources["12238"]["source"]["heading_named"] = False
check(W.own(f, e) == "own_heading", "12238: without the capture's finding, its own state list placed still shows it")
g = copy.deepcopy(f)
g["score"]["coverage"]["pass"] = False
check(W.own(g, e) is None, "12238: with neither the capture's finding nor its list placed, its heading alone does not")
W._sources = saved
g = copy.deepcopy(f)
g["record"]["notes"].append("The program heading is not printed in the text; section_heading uses the title.")
check(W.own(g, e) is None, "12238: a note saying the heading is not in the text refuses its heading")
check(W.own(f, e) == "own_heading", "12238: its own heading, found by the capture")

# 39341 against 39731 and 39732: one list, told apart by the award's unit band alone.
check(W.shared_with("39341") == ["39731", "39732"], "39341 shares its text with 39731 and 39732")
check(B.in_band(W.load("39341")["award"], [48, 48]) is True and B.in_band(W.load("39731")["award"], [48, 48]) is False
      and B.in_band(W.load("39732")["award"], [48, 48]) is False, "the printed 48 sits inside 39341's band alone")
for cn in ("39731", "39732"):
    g = W.load(cn)
    check(W.own(g, dict(A.REVIEWED["39341"])) is None, "%s: 39341's entry does not show it its own" % cn)
check(B.codes(W.load("39341")) == B.codes(W.load("39731")), "39341 and 39731 hold one course list")
check(len(B.codes(W.load("30595")) & B.codes(W.load("19330"))) == 0, "30595's page-mate holds another list")
check(B.band("Certificate of Achievement requiring 60+S/90+Q units") == (60.0, None)
      and B.band("A.S. Degree") is None, "an open band and no band read as such")

sys.exit(t.done())
