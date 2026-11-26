#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Shasta: the three records s739b held, 18655 collected with a named gap (kb/_program_piles_s740_shasta.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. 18655 was not collectable until its SOC C1000
was read as the state's SOCI C1000: a cited course renumber, the free reconcile 45841957622 and reread 45849365599.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the three keys are s739b's holds; 1 collected (no new kind), 2 held;
  * the live run: reread 45849365599 replaced 18655's row at run 45841957622, the run its committed record holds;
    the record's blocks are those s739b read (the reconcile changed its score alone);
  * 18655: one option group holds three emphases, two of them in more than one list; the scorer's option-parts
    reading does not pair them; with the lists out of their group the shape names nothing; the words filed are its
    heading's;
  * the own-page guard: its heading carries its own title (own_heading); with another heading it is not shown its
    own;
  * the holds: 18625 with s739b's reason; 32162 with the own-page reason, the kind true of its figures and no gap
    filed.

Run from repo root: python3 tests/program_piles_s740_shasta_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_shasta as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG
HELD = {"18625": ["not the program's own", "Emphasis in Coastal Science Technician"],
        "32162": ["not shown to be its own", "18094", "29 of its 32"]}

t = T.run(W, rows={"18655": "option_lists_read_apart"}, held=HELD, scores={"option_lists_read_apart": 40},
          day="2026-11-26", boundaries=5, own={"18655": "own_heading"})
check = t.check

with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_shasta_%s.json" % M.REREAD),
          encoding="utf-8") as fh:
    reread = json.load(fh)
f = W.load("18655")
check(reread["replaced_keys"] == ["18655"] and str(reread["extracted_run"]) == M.RECONCILE
      and str(f["extracted_run"]) == M.RECONCILE and not reread.get("error"),
      "reread 45849365599 replaced 18655's row alone, at run 45841957622, the run its committed record holds")
with open(W.receipt_path("2026-11-26"), encoding="utf-8") as fh:
    row = json.load(fh)["records"][0]
check(str(row["extracted_run"]) == M.RECONCILE and row["before_image"]["checks"].get("coverage") is True,
      "the plan's before-image is the reconciled row: its run, and coverage passing")

e = M.REVIEWED["18655"]
bare = copy.deepcopy(f)
words = bare["score"].pop("gaps")[0]["words"]
bare["score"].pop("confidence")
groups = [b.get("name") for b in bare["record"]["blocks"] if b.get("option_group")]
check(len(groups) == 7 and sum(1 for n in groups if n.startswith(M._EMPHASES[0])) == 2
      and sum(1 for n in groups if n.startswith(M._EMPHASES[2])) == 4
      and len({b.get("option_group") for b in bare["record"]["blocks"] if b.get("option_group")}) == 1,
      "18655: one option group holds seven lists: Geology in two, Atmospheric Sciences in one, Earth Systems in four")
check(B.shape_option_names(bare, e) and not B.S.option_parts(bare["record"]),
      "18655: its options take more than one list each, and the scorer's option-parts reading does not pair them")
g = copy.deepcopy(bare)
for b in g["record"]["blocks"]:
    b["option_group"] = None
check(not W.kind_closes(g, e), "18655: with the lists out of their group the shape names nothing")
check(words == bare["record"]["program"]["section_heading"] and e["words"] in words and not B.notes(bare),
      "18655: it carries no notes, and the words filed are its heading's, which prints '20-22 Unit Emphasis'")
check(W.gap_noted(bare) == ("option_lists_read_apart", words) and NG.answer(bare) is None,
      "18655: the entry stands on the reconciled record, and no record rule names another kind")
g = copy.deepcopy(bare)
g["record"]["program"]["section_heading"] = "Physical Sciences University Studies – 22 Unit Emphasis"
check(W.shared_with("18655") and W.own(g, e) is None, "18655: with another heading it is not shown to be its own")

check(W.hand["18625"] == M.S739.HAND["18625"] and not W.load("18625")["score"].get("gaps"),
      "18625: s739b's reason, and no gap")
f = W.load("32162")
check(W.hand["32162"] == B7.SHASTA_32162 and NG.units_within_printed_range(f) is not None
      and not f["score"].get("gaps") and W.own(f, {"gap": "heading_not_in_text", "own_list": True}) is None,
      "32162: the kind is true of its figures, its section is not shown its own, and it carries no gap")

sys.exit(t.done())
