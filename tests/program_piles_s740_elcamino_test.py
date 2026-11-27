#!/usr/bin/env python3
"""S740, lane 2's cheap piles at El Camino: the eight records s720m held, four collected with named gaps (kb/_program_piles_s740_elcamino.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own;
and a named gap must be true of its record. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the eight keys are s720m's holds; 4 collected (no new kind), 4 held;
  * 02520: without the 'Post ECC Graduation Courses (required)' list the major closes at the printed 58 under today's
    scorer; the list's two courses add to the 6.5 between 'Program Total Units: 64.5' and the major's 58; with the
    list kept, or another list dropped, the reading does not close;
  * 02518: its note quotes the 49 the record adds to and the stated 51; another figure names no gap;
  * 15251: with the '2-3 units from' list at its courses' 3 the record adds to the printed 33-35 at both ends; at the
    printed 2 it does not; every course of that list prints 3 units;
  * 45290: cut off mid-Area 5 with no total read (the record states none);
  * the holds: 19857 on no proved live run; 19883 read from a page 02512 was read from; 31319 and 42541 carry no gap,
    and neither figures kind is true of them.

Run from repo root: python3 tests/program_piles_s740_elcamino_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_elcamino as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG
ROWS = {"02520": "required_list_outside_total", "02518": "noted_figures_differ", "15251": "noted_figures_differ",
        "45290": "noted_section_cut_off"}
HELD = {"19857": ["on no proved live run", "on_live_run"], "19883": ["not the program's own", "Photography A.S."],
        "31319": ["19 against the printed 20", "a reread"], "42541": ["27-30 against the printed 28-30", "a reread"]}
SCORES = {"required_list_outside_total": 70, "noted_figures_differ": 40, "noted_section_cut_off": 20}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=16)
check = t.check


def bare(cn):
    f = copy.deepcopy(W.load(cn))
    f["score"].pop("gaps", None)
    f["score"].pop("confidence", None)
    return f


check(isinstance(W, B7.Pile) and all(not W.shared_with(cn) for cn in ROWS),
      "the plan runs on S740's shared code, and each row was read from a page no other record was read from")

# 02520: a required list the printed total leaves out.
f, e = bare("02520"), M.REVIEWED["02520"]
post = next(b for b in f["record"]["blocks"] if b["name"] == M._POST)
check(sum(c["units"] for c in post["courses"]) == 6.5 and B.same(f["score"]["arithmetic"]["computed"], [64.5, 64.5])
      and B.same(f["score"]["arithmetic"]["stated"], [58, 58]),
      "02520: the list's two courses add to the 6.5 between the record's 64.5 and the printed 58")
check(B.closes(f, B.apply_ops(f, e["ops"]), major=True) and not B.closes(f, f["record"], major=True)
      and not B.closes(f, B.apply_ops(f, [("drop", "Required Courses")]), major=True),
      "02520: without that list the major closes at the printed 58; with it, or without another list, it does not")
words = W.load("02520")["score"]["gaps"][0]["words"]
check(e["words"] in words and e["also_words"] in words, "02520: the gap files the program-total note and the degree's")

# 02518: the note quotes both figures.
f, e = bare("02518"), M.REVIEWED["02518"]
check(B.shape_note_quotes(f, e) and not B.shape_note_quotes(f, dict(e, quotes=dict(e["quotes"], stated="is 52"))),
      "02518: its note quotes the 49 the record adds to and the stated 51, and another figure names no gap")

# 15251: one list's printed minimum against its courses.
f, e = bare("15251"), M.REVIEWED["15251"]
lst = next(b for b in f["record"]["blocks"] if b["name"] == "2-3 units from")
check(all(c["units"] == 3 and not c.get("units_max") for c in lst["courses"]) and lst["minimum"] == 2,
      "15251: the list prints a 2-unit minimum over courses of 3 units each")
check(B.closes(f, B.apply_ops(f, e["ops"])) and not B.closes(f, B.apply_ops(f, [("choose", "2-3 units from", 2)])),
      "15251: with the list at 3 the record adds to the printed 33-35; at the printed 2 it does not")

# 45290: cut off, no total.
f, e = bare("45290"), M.REVIEWED["45290"]
check(f["score"]["arithmetic"].get("stated") is None and B.shape_cut(f, e) and B.shape_no_total(f, e)
      and any("cut off mid-Area 5" in n for n in B.notes(f)),
      "45290: its text is cut off mid-Area 5, and it states no total")

# The holds.
f = W.load("19857")
check(not W.on_live_run(f) and not f["score"].get("gaps"), "19857: on no proved live run, and it carries no gap")
# S742: the Acalog road reads site_pages pins, and paid read 46007782666 read 19883 from its own page (poid 3640);
# before it the record sat on the Photography A.S. page with 02512. Read in either state.
check(W.shared_with("19883") == ["02512"]
      or ("poid=3640" in W.load("19883")["source_url"] and not W.shared_with("19883")),
      "19883: read from a page 02512 was read from, or since S742 from its own page (poid 3640)")
# s741c files both since under total_differs, from a page read of each page (kb/_program_piles_s741_elcamino.py,
# kb/program_total_differs.json): each carries no gap as s740e left it, or that kind alone.
for cn in ("31319", "42541"):
    f = W.load(cn)
    check([g.get("gap") for g in f["score"].get("gaps") or []] in ([], ["total_differs"])
          and NG.units_within_printed_range(f) is None
          and NG.figures_differ_fails(f) is not None and W.gap_noted(f) is None,
          "%s: neither figures kind is true of it, and it carries no gap, or s741c's total_differs alone" % cn)

sys.exit(t.done())
