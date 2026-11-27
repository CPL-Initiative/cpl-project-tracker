#!/usr/bin/env python3
"""S741, lane 2's cheap piles at Orange Coast, second plan: 32790, the Cal-GETC certificate, collected under
noted_section_cut_off (kb/_program_piles_s741_orangecoast2.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held. s739j named 32790's gap and held it only because no committed receipt posted its run to its live
row. The conductor's live read of 2026-11-27 (kb/receipts/program_requirements_reread_s741_piles_checked.json) holds
the live row at the committed run, which kb/_program_piles_s741.py LiveRead reads as the proof. The shared checks are
tests/program_piles_s739_common.py's. Pinned here:

  * the key is one of s741b's holds, the one s739j named this gap for;
  * the live read names its row at run 44747523200, the committed record's; the receipts alone post none;
  * its note says the text is cut off mid-row in Area 5A, the record states no total, and the kind's own shape holds
    (a record that states no total or adds short of it); with a stated total its areas meet, the shape names nothing;
  * no other record was read from its page, the catalog's own Cal-GETC page.

Run from repo root: python3 tests/program_piles_s741_orangecoast2_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402
import _program_piles_s741_orangecoast2 as M  # noqa: E402

W = M.W
B, NG = B8.B, B8.NG
ROOT = T.ROOT

with open(os.path.join(ROOT, M.HELD_BY), encoding="utf-8") as fh:
    s741b = {h["control_number"]: h["why"] for h in json.load(fh)["held"]}
t = T.run(W, rows={"32790": "noted_section_cut_off"}, held={}, scores={"noted_section_cut_off": 20},
          day="2026-11-27", boundaries=3, prior_held={"32790"})
check = t.check

check("32790" in s741b and "noted_section_cut_off" in s741b["32790"] and M.RUN in s741b["32790"],
      "32790 is one of s741b's holds, held for its run's proof with this gap named")
with open(os.path.join(NG.RECEIPTS, "program_requirements_reread_s741_piles_checked.json"), encoding="utf-8") as fh:
    live = json.load(fh)
row = next(r for r in live["rows"] if r["college"] == M.COLLEGE and r["cn"] == "32790")
f = W.load("32790")
check(str(live["live_runs"][M.COLLEGE]["32790"]) == M.RUN == str(f["extracted_run"]) and row["checked"] is False
      and not row["gaps"] and row["arithmetic"] == "incomplete",
      "the conductor's live read holds its row at run 44747523200, unchecked, incomplete and with no gap")
check(not B.LiveRuns(M.COLLEGE, M.SLUG).on_live_run(f, skip=(W.tag,)),
      "the committed receipts alone post no run for it (s739j's hold)")

e = M.REVIEWED["32790"]
words = f["score"]["gaps"][0]["words"]
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
a = bare["score"]["arithmetic"]
check(W.gap_noted(bare) == ("noted_section_cut_off", words) and e["words"] in words and NG.answer(bare) is None,
      "32790: the entry stands on the record as it was filed, with its note's words, and no record rule names a kind")
check(a["stated"] is None and B.same(a["computed"], [25, 37]) and B.shape_cut(bare, e)
      and "Area 5B" in words and "not in the text" in words,
      "32790: it states no total, its areas add to 25-37, and its note names the areas the text does not hold")
g = copy.deepcopy(bare)
g["score"]["arithmetic"] = dict(a, stated=[25, 37], status="equal")
check(not B.shape_cut(g, e) and not W.kind_closes(g, e),
      "32790: with a stated total its areas meet, the shape names nothing")
check(not W.shared_with("32790") and "general-education-patterns" in f["source_url"],
      "32790: no other record was read from its page, the catalog's own Cal-GETC page")

sys.exit(t.done())
