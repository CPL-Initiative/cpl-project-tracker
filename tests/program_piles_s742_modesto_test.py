#!/usr/bin/env python3
"""S742, lane 1 (readers) at Modesto Junior: Spanish A.A.-T 35127, filed by key under the units within-range kind (kb/_program_piles_s742_modesto.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. Plan s731p held 35127 with no kind naming its
gap (two learner paths the catalog's lists do not encode); units_within_printed_range, added in S740, names exactly
its figures and files only by a reviewed key list (f-units-within-range-by-key-only-s740). The shared checks are
tests/program_piles_s739_common.py's. Pinned here:

  * the key is a hold of s731p's receipt; it is collected under the kind (score 50), none held;
  * its sum sits inside its printed range, at the range's top and above its low end, on the record's filed figures;
  * nothing else is wrong with the record: every listed course is placed, no course is invented, its page is its
    own (no other record was read from it), and no record rule names another kind for it;
  * the record's lists as the page prints them: 10 (SPAN 101 and 102), 5 (SPAN 109 or SPAN 103), 5 (SPAN 110) and
    List A's 3 add to the record's 23, and the page's low end, 19, is four units below it;
  * the words filed are the kind's own, from the figures, with the record's note on the two paths; with the note
    gone the entry names nothing;
  * the entry carries its page's words, from college page read 45768981024, whose plan file reads the record's own
    page;
  * the kind's reviewed lists (kb/_program_piles_s740.py) name this plan's module and the key;
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s742_modesto_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s742_modesto as M  # noqa: E402

W = M.W
B, NG, S = B7.B, B7.NG, B7.S
ROWS = {"35127": B7.WITHIN}

t = T.run(W, rows=ROWS, held={}, scores={B7.WITHIN: 50}, day="2026-11-27", boundaries=6)
check = t.check

check(isinstance(W, B7.Pile)
      and W.receipt_path("2026-11-27").endswith("piles_s740_modesto_junior_2026-11-27_s742r1.json"),
      "the plan is s742r1, on S740's shared code")
check(not W.shared_with("35127"), "the record was read from a page no other record was read from")
f, e = W.load("35127"), M.REVIEWED["35127"]
a = f["score"]["arithmetic"]
check(B.same(a["computed"], e["computed"]) and B.same(a["stated"], e["stated"])
      and e["stated"][0] < e["computed"][0] and e["computed"][1] == e["stated"][1],
      "35127: its sum, 23, sits at the top of its printed 19-23, above the range's low end")
cov, inv = f["score"]["coverage"], f["score"]["invented"]
check(cov["pass"] and cov["placed"] == cov["listed"] == 12 and not cov["missing"] and inv["pass"]
      and f["score"]["repeated"]["pass"],
      "35127: all 12 listed courses are placed, none is invented and none repeats")
words = f["score"]["gaps"][0]["words"]
check(f["score"]["gaps"][0]["gap"] == B7.WITHIN and len(f["score"]["gaps"]) == 1
      and words.startswith("the courses' units add to 23, within the printed 19-23 units | ") and e["words"] in words,
      "35127: the gap files the kind's own words, from its figures, and the record's note on the two paths (%s)"
      % words[:90])
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) == (B7.WITHIN, words), "35127: the entry stands on the record as it was filed")
g = copy.deepcopy(bare)
g["record"]["notes"] = [x for x in B.notes(g) if e["words"] not in x]
check(W.gap_noted(g) is None, "35127: with the note gone the entry names nothing")
check(NG.answer(bare) is None, "35127: no record rule names a kind for it")


def stated(b):
    return B.pair(b.get("stated"))


blocks = f["record"]["blocks"]
units = [[c["units"] for c in b["courses"]] for b in blocks]
check(len(blocks) == 4 and [stated(b) for b in blocks] == [[10.0, 10.0], [5.0, 5.0], [5.0, 5.0], [3.0, 3.0]]
      and units[0] == [5, 5] and units[1] == [5, 5] and units[2] == [5] and units[3] == [3] * 7,
      "35127: the four lists carry the page's printed 10, 5, 5 and 3 over the units printed beside each course")
check([b["rule"] for b in blocks] == ["all", "choose_units", "all", "choose_units"]
      and blocks[1]["minimum"] == 5 and blocks[3]["minimum"] == 3
      and 10 + 5 + 5 + 3 == a["computed"][0] == a["computed"][1] and a["stated"] == [19.0, 23.0],
      "35127: read as printed the lists add to 23; the page's low end, 19, is the path that starts at SPAN 109")
check(f["source_url"].endswith("/program/spanish-for-transfer-degree-mjc-fall-2025")
      and "Spanish for Transfer Degree (Total 19 - 23)" in e["page"] and "Total Units: 19.0 - 23.0 Units" in e["page"]
      and "REQUIRED COURSES (10 - 20 units) (Total 20)" in e["page"] and "Native/Heritage" in e["page"],
      "35127: its entry carries its own page's words")
with open(os.path.join(B7.ROOT, "kb", "college_reads", "modesto_pooled_next_s739.json"), encoding="utf-8") as fh:
    plan = json.load(fh)
check(M.PAGE_READ == "45768981024"
      and any("spanish-for-transfer-degree-mjc-fall-2025" in p["url"] for p in plan["pages"]),
      "the page words are college page read 45768981024's, whose plan reads the record's own entry")

# The kind's reviewed lists name this plan.
check("_program_piles_s742_modesto" in B7.PLAN_MODULES
      and B7.WITHIN_HELD.get((M.COLLEGE, "35127"), (None,))[0] == B7.WITHIN,
      "the kind's reviewed lists name this plan's module and the key")

sys.exit(t.done())
