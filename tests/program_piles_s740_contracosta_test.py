#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Contra Costa: five of the six records s720k held, two collected with named gaps (kb/_program_piles_s740_contracosta.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own;
and a named gap must be true of its record. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the five keys are s720k's holds less 01417, which carries entry_path_range since S727; 2 collected, 3 held;
  * 01415: its filed arithmetic is an older scorer's (19 against the major's 19-22); today's scorer reads it against
    the degree's 60 and passes the major, and the record names no general education pattern or units, so
    degree_summary_ge_none is read against today's arithmetic; with a pattern named the kind's check fails;
  * 33370: with the four half-unit courses, the instrument and the ensemble at their headings' figures the major
    closes at the printed 47 under today's scorer; one of them left at its printed range does not close it; the gap
    files the heading note and the degree's;
  * the holds: 01400 and 40761 on no proved live run; 33660 with no gap.

Run from repo root: python3 tests/program_piles_s740_contracosta_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_contracosta as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG
ROWS = {"01415": "degree_summary_ge_none", "33370": "noted_figures_differ"}
HELD = {"01400": ["on no proved live run", "44687786167"], "40761": ["on no proved live run", "44687786167"],
        "33660": ["say nothing of its electives", "the second reader, S720"]}

t = T.run(W, rows=ROWS, held=HELD, scores={"degree_summary_ge_none": 50, "noted_figures_differ": 40},
          day="2026-11-26", boundaries=7)
check = t.check


def bare(cn):
    f = copy.deepcopy(W.load(cn))
    f["score"].pop("gaps", None)
    f["score"].pop("confidence", None)
    return f


check(set(M.KEYS) | set(M.COLLECTED_SINCE) == {"01400", "01415", "01417", "33370", "33660", "40761"}
      and [g["gap"] for g in W.load("01417")["score"]["gaps"]] == ["entry_path_range"],
      "the keys are s720k's six holds less 01417, which carries entry_path_range")
check(all(not W.shared_with(cn) for cn in M.KEYS), "each record was read from a page no other record was read from")

# 01415: the unit summary prints general education and electives as None.
f, e = bare("01415"), M.REVIEWED["01415"]
a, now = f["score"]["arithmetic"], B.arithmetic(f)
check(a.get("against") == "program" and B.same(a["computed"], [19, 19]) and B.same(a["stated"], [19, 22]),
      "01415: its filed arithmetic is an older scorer's, 19 against the major's 19-22")
check(now["against"] == "degree" and B.same(now["computed"], [19, 19]) and B.same(now["stated"], [60, 60])
      and now["major"]["status"] == "equal" and M.major_equal(f, e) and e.get("today"),
      "01415: today's scorer reads it against the degree's 60 and passes the major")
g = copy.deepcopy(f)
g["record"]["program"]["ge_pattern"] = "Cal-GETC"
check(not M.major_equal(g, e) and not M.major_equal(f, dict(e, gap="noted_figures_differ")),
      "01415: with a general education pattern named, or under another kind, the check fails")
with open(W.receipt_path("2026-11-26"), encoding="utf-8") as fh:
    rec = json.load(fh)
row = next(r for r in rec["records"] if r["control_number"] == "01415")
check("today's arithmetic" in row["read_against"] and row["after_image"]["checks"].get("gaps") == [e["gap"]],
      "01415: the receipt says the gap is read against today's arithmetic")

# 33370: the headings' figures against the printed ranges.
f, e = bare("33370"), M.REVIEWED["33370"]
check(B.closes(f, B.apply_ops(f, e["ops"]), major=True) and not B.closes(f, f["record"], major=True),
      "33370: with each course at its heading's figure the major closes at the printed 47")
for i in range(len(e["ops"])):
    short = e["ops"][:i] + e["ops"][i + 1:]
    check(not B.closes(f, B.apply_ops(f, short), major=True),
          "33370: with %s left at its printed range the major does not close" % e["ops"][i][1])
words = W.load("33370")["score"]["gaps"][0]["words"]
check(e["words"] in words and e["also_words"] in words, "33370: the gap files the heading note and the degree's")

# The holds.
# s741e files both since, their run proved by the conductor's live read (kb/_program_piles_s741_contracosta.py): on
# the receipts as they stood before that plan each is on no proved live run, and each carries no gap, or s741e's.
for cn, later in (("01400", "degree_summary_ge_none"), ("40761", "noted_unit_floor")):
    f = W.load(cn)
    check(not W.on_live_run(f, skip=("s741e",))
          and [g.get("gap") for g in f["score"].get("gaps") or []] in ([], [later]),
          "%s: on no proved live run by the receipts before s741e, with no gap, or s741e's alone" % cn)
f = W.load("33660")
check(not f["score"].get("gaps") and W.gap_noted(f) is None
      and any("'None'" in n and "'N/A'" in n for n in B.notes(f)),
      "33660: it carries no gap, and its note prints general education as None and N/A")

sys.exit(t.done())
