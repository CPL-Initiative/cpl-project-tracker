#!/usr/bin/env python3
"""S742, lane 2's cheap piles at East Los Angeles: the four records s741d held, one collected with a named gap
(kb/_program_piles_s742_ela.py, plan s742b).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held. S741 held 02456 because its live row sat on an older extraction than its committed record, the free
reconcile 45176404274's (f-ela-committed-passes-live-older-s741). S742's keep-better kept that reconcile's ten records
on their own Academic Plan codes (plan_code_own), the conductor's reread (force 45176404274) posted them, and its
committed receipt posts each row at that run. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the four keys are s741d's holds; 1 collected, 3 held;
  * the reread's receipt posts 02456 at run 45176404274, the run its committed record holds; S741's live read, taken
    before the reread, held the row at an older run, so the reread is what proves the run;
  * 02456: its note names the line the record leaves out; with the line's 3-5 the 45 is the printed 48-50, and with
    3-4 or 4-5 it is not; no other record was read from its page;
  * the holds carry their reasons, and each carries no gap.

Run from repo root: python3 tests/program_piles_s742_ela_test.py
"""
import copy
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s742_ela as M  # noqa: E402

W = M.W
B, NG = B9.B, B9.NG
ROOT = T.ROOT
HELD = {"31017": ["still failing", "a reread"], "37510": ["unstated", "no gap"], "41231": ["a reread"]}

t = T.run(W, rows={"02456": "unit_line_not_read"}, held=HELD, scores={"unit_line_not_read": 40}, day="2026-11-27",
          boundaries=4)
check = t.check

# The live run's proof: the reread's receipt, and what stood before it.
posted = []
for path in glob.glob(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_%s_*.json" % M.SLUG)):
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    if str(d.get("extracted_run")) == M.RUN and "02456" in [str(k) for k in (d.get("replaced_keys") or [])
                                                          + (d.get("carried_keys") or [])]:
        posted.append(os.path.basename(path))
f = W.load("02456")
check(posted and str(f["extracted_run"]) == M.RUN, "a committed reread receipt posts 02456 at run 45176404274: %r" % posted)
with open(os.path.join(NG.RECEIPTS, "program_requirements_reread_s742_piles_checked.json"), encoding="utf-8") as fh:
    live = json.load(fh)
check(str(live["live_runs"][M.COLLEGE]["02456"]) == "39063389278" and not live["by_college"][M.COLLEGE],
      "before the reread the live read held the row at 39063389278, an older run, and no person had checked a row")

e = M.REVIEWED["02456"]
words = f["score"]["gaps"][0]["words"]
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) == ("unit_line_not_read", words) and e["words"] in words and NG.answer(bare) is None,
      "02456: the entry stands on the record as it was filed, with its note's words, and no record rule names a kind")
a = bare["score"]["arithmetic"]
check(B.same(a["computed"], [45, 45]) and B.same(a["stated"], [48, 50]) and a["against"] == "program"
      and sum(len(b["courses"]) for b in bare["record"]["blocks"]) == 14,
      "02456: fourteen courses add to 45 under the printed 48-50")
check(B.closes(bare, B.apply_ops(bare, e["ops"]))
      and not B.closes(bare, B.apply_ops(bare, [("line", 3, 4)]))
      and not B.closes(bare, B.apply_ops(bare, [("line", 4, 5)])),
      "02456: with the line's 3-5 the record closes at the printed 48-50; with 3-4 or 4-5 it does not")
check(not W.shared_with("02456")
      and bare["record"]["program"]["section_heading"] == "(Academic Plan E0%sC)" % "02456",
      "02456: no other record was read from its page, and its heading is its own Academic Plan code")
for cn in HELD:
    g = W.load(cn)
    check(not g["score"].get("gaps") and cn not in M.REVIEWED, "%s: a hold, with no gap" % cn)

sys.exit(t.done())
