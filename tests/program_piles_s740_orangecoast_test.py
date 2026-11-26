#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Orange Coast: 41373, rolled back from s739j, collected under units_within_printed_range (kb/_program_piles_s740_orangecoast.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. s739j filed 41373 as noted_figures_differ and
its row was rolled back: its 29 sits inside the printed 28-29, so no two figures disagree
(d-within-range-sums-hold-for-units-kind-s739). The units twin of hours_within_printed_range is true of it. The
shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the one key is s739j's rolled-back row: s739j's receipt names it, the rollback's SQL file names it and no other,
    and the rollback's receipt says one row went back;
  * its before-image here is s739j's before-image: the row this plan guards is the row the rollback restored;
  * its sum sits inside its printed range, above the range's low end; the words filed are the kind's own with the
    record's note;
  * the own-page guard: its page was also read for 32086, and its heading goes beyond that title (own_heading).

Run from repo root: python3 tests/program_piles_s740_orangecoast_test.py
"""
import copy
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_orangecoast as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG
ROOT = T.ROOT

t = T.run(W, rows={"41373": B7.WITHIN}, held={}, scores={B7.WITHIN: 50}, day="2026-11-26", boundaries=7,
          prior_held={"41373"}, own={"41373": "own_heading"})
check = t.check

with open(os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s739_orange_coast_2026-11-26_s739j.json"),
          encoding="utf-8") as fh:
    s739j = json.load(fh)
was = next(r for r in s739j["records"] if r["control_number"] == "41373")
with open(os.path.join(ROOT, M.HELD_BY), encoding="utf-8") as fh:
    rollback = fh.read()
check(was["moves_to"] == "noted_figures_differ" and "'41373'" in rollback
      and not any("'%s'" % r["control_number"] in rollback for r in s739j["records"] if r["control_number"] != "41373"),
      "41373 is s739j's row, and the rollback's SQL names it and no other row")
done = [p for p in glob.glob(os.path.join(NG.RECEIPTS, "migration_s739j_41373_rollback_*.json"))]
check(len(done) == 1, "the rollback's apply left its receipt")
with open(W.receipt_path("2026-11-26"), encoding="utf-8") as fh:
    rec = json.load(fh)
row = rec["records"][0]
check(row["before_image"]["checks"] == was["before_image"]["checks"]
      and row["before_image"]["record"] == was["before_image"]["record"]
      and str(row["extracted_run"]) == str(was["extracted_run"]),
      "its before-image is s739j's before-image: the row the rollback restored")
f, e = W.load("41373"), M.REVIEWED["41373"]
words = f["score"]["gaps"][0]["words"]
check(len(f["score"]["gaps"]) == 1 and f["score"]["gaps"][0]["gap"] == B7.WITHIN
      and words.startswith("the courses' units add to 29, within the printed 28-29 units | ") and e["words"] in words,
      "the gap files the kind's own words, from its figures, and the record's note")
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) == (B7.WITHIN, words) and NG.answer(bare) is None,
      "the entry stands on the record as it was filed, and no record rule names a kind for it")
check(W.shared_with("41373") == ["32086"] and W.own(f, e) == "own_heading",
      "its page was also read for 32086, and its heading goes beyond that title")
g = copy.deepcopy(bare)
g["record"]["program"]["section_heading"] = "Business Administration, Associate in Science Degree for Transfer (AS-T)"
check(W.own(g, e) is None, "with 32086's heading the record is not shown to be its own")

sys.exit(t.done())
