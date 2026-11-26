#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Butte: the three records s721e still holds, one collected with a named gap (kb/_program_piles_s740_butte.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own;
and a named gap must be true of its record. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the three keys are s721e's holds that still fail; 1 collected (no new kind), 2 held;
  * 33579: the record's fourth list is a 'Select one' of AGS 20 and AGS 40 at 3 units, a name it shares with the
    statistics list; without it today's scorer gives the printed 23 at both ends; with it, without the statistics
    list instead, or with another course in it, the check fails; the gap files both notes;
  * the holds: 01312's degree reads 60-61 below the map's 62-69; 14583's arithmetic is incomplete and its page was
    read for 43185 too.

Run from repo root: python3 tests/program_piles_s740_butte_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_butte as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG
HELD = {"01312": ["60-61", "62-69", "S636"], "14583": ["an incomplete read", "43185"]}

t = T.run(W, rows={"33579": "required_list_outside_total"}, held=HELD, scores={"required_list_outside_total": 70},
          day="2026-11-26", boundaries=3)
check = t.check

f = copy.deepcopy(W.load("33579"))
words = f["score"]["gaps"][0]["words"]
f["score"].pop("gaps")
f["score"].pop("confidence")
e = M.REVIEWED["33579"]
names = [b["name"] for b in f["record"]["blocks"]]
lst = f["record"]["blocks"][e["list"]]
check(names.count("Select one") == 2 and lst["name"] == "Select one" and B.pair(lst["stated"]) == [3.0, 3.0]
      and [c["code"] for c in lst["courses"]] == ["AGS 20", "AGS 40"],
      "33579: its fourth list is a 'Select one' of AGS 20 and AGS 40 at 3 units, a name another list shares")
check(M.without_list(f, e) and not B.closes(f, f["record"]),
      "33579: without that list today's scorer gives the printed 23; with it the record does not close")
check(not M.without_list(f, dict(e, list=1)) and not M.without_list(f, dict(e, courses=["AGS 20"]))
      and not M.without_list(f, dict(e, gap="noted_figures_differ")),
      "33579: another list, another course set or another kind fails the check")
g = copy.deepcopy(f)
g["record"]["program"]["total_units"] = {"min": 24, "max": 24}
check(not W.kind_closes(g, e), "33579: against a total one unit off the reading does not close")
check(e["words"] in words and e["also_words"] in words and not W.shared_with("33579"),
      "33579: the gap files both notes, and its page is its own")

f = W.load("01312")
a = f["score"]["arithmetic"]
check(B.same(a["computed"], [60, 61]) and B.same(a["stated"], [62, 69]) and a["against"] == "degree"
      and not f["score"].get("gaps") and NG.units_within_printed_range(f) is None,
      "01312: its degree reads 60-61 below the map's 62-69, and it carries no gap")
f = W.load("14583")
check(f["score"]["arithmetic"]["status"] == "incomplete" and "43185" in W.shared_with("14583")
      and not f["score"].get("gaps"),
      "14583: its arithmetic is incomplete, its page was read for 43185 too, and it carries no gap")

sys.exit(t.done())
