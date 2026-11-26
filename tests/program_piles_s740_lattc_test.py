#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Los Angeles Trade-Technical: four of s739e's five holds, 31089 collected with a named gap (kb/_program_piles_s740_lattc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. 31089 and 41150 were not collectable until
their misspelled codes were read as the state's: cited course renumbers, the free reconcile 45844759766 and reread
45849372771. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the four keys are s739e's holds less 41150, which passes since the reread; 1 collected (no new kind), 3 held with
    s739e's own reasons;
  * the live run: reread 45849372771 replaced 31089 and 41150 at run 45844759766, the run each committed record
    holds; 41150 passes as the live table counts it and carries no gap;
  * 31089: its required list prints 38, its courses add to 33-34, its note quotes the 33 and the 38, and the page's
    figures (38 and 4) are the stated 42, which the record's 37 is not; a list whose courses reach its figure, a
    figure the note does not quote, or a total the figures do not add to names nothing;
  * the own-page guard: its PDF page was also read for 31082, the certificate of the same title; its heading names
    the degree (own_heading).

Run from repo root: python3 tests/program_piles_s740_lattc_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_lattc as M  # noqa: E402

W = M.W
B, NG, S = B7.B, B7.NG, B7.S
HELD = {"31280": ["not collectable", "CRPNTRY 111C"], "41011": ["VOC ED 460"], "45285": ["53 of 99 placed"]}

t = T.run(W, rows={"31089": "noted_figures_differ"}, held=HELD, scores={"noted_figures_differ": 40},
          day="2026-11-26", boundaries=4, own={"31089": "own_heading"})
check = t.check

with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_%s_%s.json" % (M.SLUG, M.REREAD)),
          encoding="utf-8") as fh:
    reread = json.load(fh)
check(sorted(reread["replaced_keys"]) == ["31089", "41150"] and str(reread["extracted_run"]) == M.RECONCILE
      and not reread.get("error") and all(str(W.load(cn)["extracted_run"]) == M.RECONCILE for cn in ("31089", "41150")),
      "reread 45849372771 replaced 31089 and 41150 at run 45844759766, the run each committed record holds")
f = W.load("41150")
check(set(M.KEYS) | set(M.PASSES_SINCE) == {"31089", "31280", "41011", "41150", "45285"}
      and S.passes_live(f["score"]) and not f["score"].get("gaps") and W.plan(write=False)["rows"] == [],
      "the keys are s739e's five holds less 41150, which passes and carries no gap")
check(all(W.hand[cn] == M.S739.HAND[cn] and not W.load(cn)["score"].get("gaps") for cn in HELD),
      "each hold carries s739e's own reason, and no gap")

f, e = copy.deepcopy(W.load("31089")), M.REVIEWED["31089"]
words = f["score"].pop("gaps")[0]["words"]
f["score"].pop("confidence")
lst = f["record"]["blocks"][0]
adds = S.block_units_summed(lst, {}, False)[0]
check(B.pair(lst["stated"]) == [38.0, 38.0] and list(adds) == [33.0, 34.0] and M.G.printed_low(f) == 42
      and B.same(f["score"]["arithmetic"]["computed"], [37, 38]) and B.same(f["score"]["arithmetic"]["stated"], [42, 42]),
      "31089: its required list prints 38 over courses that add to 33-34, and the page's 38 and 4 are the stated 42")
check(M.list_short(f, e) and W.gap_noted(f) == ("noted_figures_differ", words) and e["words"] in words
      and NG.answer(f) is None, "31089: the entry stands on the reconciled record, and its note quotes the 33 and the 38")
g = copy.deepcopy(f)
g["record"]["blocks"][0]["stated"] = {"min": 34, "max": 34}
check(not M.list_short(g, e), "31089: a list whose courses reach its printed figure names nothing")
check(not M.list_short(f, dict(e, quotes=dict(e["quotes"], figure="the stated 40")))
      and not M.list_short(f, dict(e, quotes=dict(e["quotes"], sum="sum to 30 units")))
      and not M.list_short(f, dict(e, gap="catalog_figures_differ")),
      "31089: a figure or a sum the note does not quote, or another kind, names nothing")
g = copy.deepcopy(f)
g["record"]["blocks"].append({"name": "one more list", "rule": "all", "stated": {"min": 3, "max": 3},
                              "option_group": None, "courses": []})
check(not M.list_short(g, e), "31089: figures that do not add to the stated total name nothing")
mate = W.load("31082")
check(W.shared_with("31089") == ["31082"] and W.own(f, e) == "own_heading"
      and B.award_kind(mate["award"]) != B.award_kind(f["award"]),
      "31089: its page was also read for 31082, the certificate of the same title, and its heading names the degree")
g = copy.deepcopy(f)
g["record"]["program"]["section_heading"] = mate["record"]["program"]["section_heading"]
check(W.own(g, e) is None, "31089: with the certificate's heading it is not shown to be its own")

sys.exit(t.done())
