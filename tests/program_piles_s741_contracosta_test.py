#!/usr/bin/env python3
"""S741, lane 2's cheap piles at Contra Costa: the three records s740g held, two collected with named gaps
(kb/_program_piles_s741_contracosta.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held. s740g held 01400 and 40761 because no committed receipt posted their run to a live row. The
conductor's live read of 2026-11-27 (kb/receipts/program_requirements_reread_s741_piles_checked.json) holds both live
rows at the committed run, which kb/_program_piles_s741.py LiveRead reads as the proof. The shared checks are
tests/program_piles_s739_common.py's. Pinned here:

  * the three keys are s740g's holds; 2 collected, 1 held;
  * the live read names both rows at run 44687786167, the run the committed records hold; without the live read
    neither row is on a proved live run (the receipts alone post none), and a live read naming another run refuses it;
  * 01400: the kind's own check (s740g's major_equal: read against the degree, the major equal, no general education
    read) and its note's words; with general education read the shape names nothing;
  * 40761: CIS099 at the 2 units its note names closes the record at the printed 22; at 1 or 3 it does not;
  * 33660 holds: its notes say nothing of its electives row.

Run from repo root: python3 tests/program_piles_s741_contracosta_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402
import _program_piles_s741_contracosta as M  # noqa: E402

W = M.W
B, NG = B8.B, B8.NG
ROOT = T.ROOT
HELD = {"33660": ["say nothing of its electives", "Unit Summary"]}
SCORES = {"degree_summary_ge_none": 50, "noted_unit_floor": 70}

t = T.run(W, rows={"01400": "degree_summary_ge_none", "40761": "noted_unit_floor"}, held=HELD, scores=SCORES,
          day="2026-11-27", boundaries=7)
check = t.check

# The live run's proof.
with open(os.path.join(NG.RECEIPTS, "program_requirements_reread_s741_piles_checked.json"), encoding="utf-8") as fh:
    live = json.load(fh)
runs = live["live_runs"][M.COLLEGE]
check(live["read_at"].startswith("2026-11-27T") and all(str(runs[cn]) == M.RUN for cn in ("01400", "40761"))
      and all(str(W.load(cn)["extracted_run"]) == M.RUN for cn in ("01400", "40761")),
      "the conductor's live read holds both rows at run 44687786167, the run the committed records hold")
rows = {r["cn"]: r for r in live["rows"] if r["college"] == M.COLLEGE}
check(all(rows[cn]["checked"] is False and not rows[cn]["gaps"] and rows[cn]["arithmetic"] == "unequal"
          for cn in ("01400", "40761")),
      "at the read each live row was unchecked, failing as unequal and carried no gap")
receipts_alone = B.LiveRuns(M.COLLEGE, M.SLUG)
check(not any(receipts_alone.on_live_run(W.load(cn), skip=(W.tag,)) for cn in ("01400", "40761")),
      "the committed receipts alone post neither row's run (s740g's hold)")
other = B8.LiveRead(M.COLLEGE, M.SLUG)
other.live_read = lambda: {"01400": [("2026-11-27T07:31:18Z", "1")], "40761": [("2026-11-27T07:31:18Z", "1")]}
check(not any(other.on_live_run(W.load(cn), skip=(W.tag,)) for cn in ("01400", "40761")),
      "a live read naming another run shows neither row on its live run (on the receipts before this plan's apply)")

f, e = W.load("01400"), M.REVIEWED["01400"]
words = f["score"]["gaps"][0]["words"]
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) == ("degree_summary_ge_none", words) and e["words"] in words and NG.answer(bare) is None,
      "01400: the entry stands on the record as it was filed, with its note's words, and no record rule names a kind")
now = B.arithmetic(bare)
check(now["against"] == "degree" and now["major"]["status"] == "equal" and B.same(now["computed"], [37, 37])
      and B.same(now["stated"], [60, 60]) and M.S740.major_equal(bare, e),
      "01400: read against the degree's 60, its major equal at 37, no general education read")
g = copy.deepcopy(bare)
g["record"]["program"]["ge_units"] = {"min": 18, "max": 18}
g["record"]["program"]["ge_pattern"] = "local"
check(not M.S740.major_equal(g, e) and not W.kind_closes(g, e), "01400: with general education read the shape names nothing")
check(not W.shared_with("01400") and not W.shared_with("40761"), "no other record was read from either page")

f, e = W.load("40761"), M.REVIEWED["40761"]
words = f["score"]["gaps"][0]["words"]
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) == ("noted_unit_floor", words) and e["words"] in words and NG.answer(bare) is None,
      "40761: the entry stands on the record as it was filed, with its note's words, and no record rule names a kind")
row = B.course_rows(bare, "CIS099")[0]
check(row["units"] == 1 and row["units_max"] == 4, "40761: CIS099 prints 1-4 units")
check(B.closes(bare, B.apply_ops(bare, e["ops"]))
      and not B.closes(bare, B.apply_ops(bare, [("units", "CIS099", 1)]))
      and not B.closes(bare, B.apply_ops(bare, [("units", "CIS099", 3)])),
      "40761: CIS099 at its note's 2 units closes the record at the printed 22; at 1 or 3 it does not")

f = W.load("33660")
check(not f["score"].get("gaps") and W.hand["33660"].startswith(M.S740.HAND["33660"])
      and not any("lective" in n and ("None" in n or "N/A" in n) for n in B.notes(f)),
      "33660: s740g's reason stands, no note of its own names its electives row, and it carries no gap")

sys.exit(t.done())
