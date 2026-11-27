#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Gavilan: the six records s739m held, four collected under units_within_printed_range (kb/_program_piles_s740_gavilan.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. S739's reader held these four because a sum
inside its printed range holds no two figures that disagree (d-within-range-sums-hold-for-units-kind-s739); the units
twin of hours_within_printed_range is the kind whose sentence is true of them. The shared checks are
tests/program_piles_s739_common.py's. Pinned here:

  * the six keys are s739m's holds; 4 collected under the kind (score 50), 2 held (08464 on no proved live run, 45357
    a reread, no gap being true of it);
  * each row's sum sits inside its printed range with its low end above the range's, on the record's filed figures;
  * the words filed are the kind's own, from the figures, with the record's note that quotes them (38787 and 41394
    carry two notes); with the note gone the entry names nothing;
  * each record was read from a page no other record was read from;
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s740_gavilan_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_gavilan as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG
ROWS = {cn: B7.WITHIN for cn in ("08460", "19378", "38787", "41394")}
HELD = {"08464": ["44090922437", "44118718575", "on_live_run"], "45357": ["a reread", "two parts", "no gap is true"]}
FIGURES = {"08460": ("36", "30-36"), "19378": ("24", "14-24"), "38787": ("53-60", "48-60"), "41394": ("27", "26-27")}

t = T.run(W, rows=ROWS, held=HELD, scores={B7.WITHIN: 50}, day="2026-11-26", boundaries=24)
check = t.check

check(isinstance(W, B7.Pile) and W.receipt_path("2026-11-26").endswith("piles_s740_gavilan_2026-11-26_s740a.json"),
      "the plan is s740a, on S740's shared code")
check(all(not W.shared_with(cn) for cn in M.KEYS), "each record was read from a page no other record was read from")
for cn, (comp, st) in FIGURES.items():
    f, e = W.load(cn), M.REVIEWED[cn]
    a = f["score"]["arithmetic"]
    check(B.same(a["computed"], e["computed"]) and B.same(a["stated"], e["stated"])
          and e["stated"][0] < e["computed"][0] and e["computed"][1] <= e["stated"][1],
          "%s: its sum sits inside its printed range, above the range's low end" % cn)
    words = f["score"]["gaps"][0]["words"]
    check(f["score"]["gaps"][0]["gap"] == B7.WITHIN and len(f["score"]["gaps"]) == 1
          and words.startswith("the courses' units add to %s, within the printed %s units | " % (comp, st))
          and e["words"] in words and e.get("also_words", "") in words,
          "%s: the gap files the kind's own words, from its figures, and the record's note" % cn)
    bare = copy.deepcopy(f)
    bare["score"].pop("gaps")
    bare["score"].pop("confidence")
    check(W.gap_noted(bare) == (B7.WITHIN, words), "%s: the entry stands on the record as it was filed" % cn)
    g = copy.deepcopy(bare)
    g["record"]["notes"] = [x for x in B.notes(g) if e["words"] not in x]
    check(W.gap_noted(g) is None, "%s: with the note gone the entry names nothing" % cn)
    check(NG.answer(bare) is None, "%s: no record rule names a kind for it" % cn)
check(sum(1 for cn in ("38787", "41394") if M.REVIEWED[cn].get("also_words")) == 2
      and all(" | " in W.load(cn)["score"]["gaps"][0]["words"].split(" | ", 1)[1] for cn in ("38787", "41394")),
      "38787 and 41394 file two notes beside the figures")

f = W.load("45357")
check(sum(1 for b in f["record"]["blocks"] if not b.get("courses")) == 5
      and f["score"]["arithmetic"]["status"] == "incomplete" and any("Read in 2 parts" in x for x in B.notes(f))
      and not f["score"].get("gaps") and NG.units_within_printed_range(f) is None,
      "45357: read in two parts, five of its lists hold no course, its arithmetic is incomplete, and it carries no gap")
# S742's plan s742a files 08464 as lists_not_closed (the page's own sentence from a page read, its run proved by the
# conductor's live read): no gap and no proved live run as s740a left it, or that kind alone.
f = W.load("08464")
kinds = [x["gap"] for x in f["score"].get("gaps") or []]
check((not kinds and not W.on_live_run(f)) or kinds == ["lists_not_closed"],
      "08464: on no proved live run with no gap, or S742's lists_not_closed alone")

sys.exit(t.done())
