#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Santa Monica: the three records s720s held, 41797 collected under units_within_printed_range (kb/_program_piles_s740_smc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. s720s held 41797 off catalog_figures_differ,
whose own check it fails (its lists meet the printed total's top). Its 14-15 sits inside the printed 13-15, the shape
the units twin of hours_within_printed_range names. The shared checks are tests/program_piles_s739_common.py's.
Pinned here:

  * the three keys are s720s's holds; 1 collected, 2 held with s720s's own reasons;
  * 41797: its sum sits inside its printed range, above the range's low end; catalog_figures_differ's own check
    still refuses it; the words filed are the kind's own, from its figures;
  * the own-page guard: its PDF page was also read for 38087, 38088 and 38524, none of which shares a course or a
    heading with it (own_heading); with a page-mate's heading it is not shown to be its own;
  * the statewide held list (kb/_program_piles_s740.py WITHIN_HELD) answers the kind for 41797 and names this plan.

Run from repo root: python3 tests/program_piles_s740_smc_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_smc as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG
HELD = {"21026": ["its notes quote only the printed 26.5"], "43767": ["its Barbering heading is inferred"]}

t = T.run(W, rows={"41797": B7.WITHIN}, held=HELD, scores={B7.WITHIN: 50}, day="2026-11-26", boundaries=6,
          own={"41797": "own_heading"})
check = t.check

f, e = W.load("41797"), M.REVIEWED["41797"]
a = f["score"]["arithmetic"]
check(B.same(a["computed"], [14, 15]) and B.same(a["stated"], [13, 15]),
      "its 14-15 sits inside the printed 13-15, above the range's low end")
check(len(f["score"]["gaps"]) == 1 and f["score"]["gaps"][0]["gap"] == B7.WITHIN
      and f["score"]["gaps"][0]["words"] == "the courses' units add to 14-15, within the printed 13-15 units",
      "the gap files the kind's own words, from its figures, and nothing else")
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) is not None and NG.answer(bare) is None and NG.figures_differ_fails(bare) is not None,
      "the entry stands on the record as filed; no record rule names a kind, and catalog_figures_differ refuses it")
mates = W.shared_with("41797")
check(mates == ["38087", "38088", "38524"] and W.own(f, e) == "own_heading"
      and all(not (B.codes(f) & B.codes(W.load(m))) for m in mates),
      "its page was also read for three certificates that share no course with it, and its heading is its own")
g = copy.deepcopy(bare)
g["record"]["program"]["section_heading"] = W.load("38088")["record"]["program"]["section_heading"]
check(W.own(g, e) is None, "with a page-mate's heading the record is not shown to be its own")
answer, where = B7.WITHIN_HELD[(M.COLLEGE, "41797")]
check(answer == B7.WITHIN and "_program_piles_s740_smc" in where and (M.COLLEGE, "41797") in B7.reviewed_keys(),
      "the statewide held list answers the kind for 41797 and names this plan")
for cn in HELD:
    check(not W.load(cn)["score"].get("gaps") and W.hand[cn] == M.S720.HAND[cn],
          "%s: it carries no gap, and its reason is s720s's own" % cn)

sys.exit(t.done())
