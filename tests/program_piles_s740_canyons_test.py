#!/usr/bin/env python3
"""S740, lane 2's cheap piles at College of the Canyons: 36793, the one record s739c held, collected under units_within_printed_range (kb/_program_piles_s740_canyons.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. s739c held 36793 because its 19-22 sits inside
the printed 18-22 and no kind's sentence was true of that (d-within-range-sums-hold-for-units-kind-s739). The units
twin of hours_within_printed_range is. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the one key is s739c's one hold;
  * its sum sits inside its printed range, above the range's low end; no note of the record names the difference, so
    the words filed are the kind's own, from the figures, and nothing else;
  * the own-page guard: its PDF page was also read for 02309, the A.S. of the same title; its heading names the
    transfer degree and 02309's the A.S. (own_heading); with 02309's heading it is not shown to be its own.

Run from repo root: python3 tests/program_piles_s740_canyons_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_canyons as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG

t = T.run(W, rows={"36793": B7.WITHIN}, held={}, scores={B7.WITHIN: 50}, day="2026-11-26", boundaries=6,
          own={"36793": "own_heading"})
check = t.check

f, e = W.load("36793"), M.REVIEWED["36793"]
a = f["score"]["arithmetic"]
check(B.same(a["computed"], [19, 22]) and B.same(a["stated"], [18, 22]),
      "its 19-22 sits inside the printed 18-22, above the range's low end")
check(len(f["score"]["gaps"]) == 1 and f["score"]["gaps"][0]["gap"] == B7.WITHIN
      and f["score"]["gaps"][0]["words"] == "the courses' units add to 19-22, within the printed 18-22 units"
      and not e.get("words"),
      "the gap files the kind's own words, from its figures, and nothing else")
check(not any("18" in x and "22" in x for x in B.notes(f)), "no note of the record names the two figures")
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) is not None and NG.answer(bare) is None,
      "the entry stands on the record as it was filed, and no record rule names a kind for it")
mate = W.load("02309")
check(W.shared_with("36793") == ["02309"] and mate["title"] == f["title"] and mate["award"] != f["award"]
      and W.own(f, e) == "own_heading",
      "its page was also read for 02309, the A.S. of the same title, and its heading names the transfer degree")
g = copy.deepcopy(bare)
g["record"]["program"]["section_heading"] = mate["record"]["program"]["section_heading"]
check(W.own(g, e) is None, "with 02309's heading the record is not shown to be its own")

sys.exit(t.done())
