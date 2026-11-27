#!/usr/bin/env python3
"""S742, lane 1 (keys) at Cuesta: the two Aviation Mechanic certificates collected with their gap named (kb/_program_piles_s742_cuesta.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. Both records place every listed course and
fall short of their printed total at the low end for one reason their own notes state: the halves AVMT 110A and 110B
(and 120A and 120B) are taken together in place of AVMT 110 (and 120), and the record lists each half as an
alternative of its own. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the two keys are lane 1's holds; both are collected under pair_read_as_alternatives (score 50), none held;
  * each record holds the two rows as the entry reads them: AVMT 110 and AVMT 120 at 5 units, each with its A and B
    halves at 2.5 as two alternatives, and every other course at 5;
  * read singly the courses add to the filed figures (20-25 against 25, 35-40 against 40); with each pair at its 5
    units today's scorer gives the printed total at both ends; with one pair alone it does not;
  * nothing else is wrong with either record: every listed course is placed, no course is invented or repeated, its
    page is its own (no other record was read from it), and no record rule names another kind for it;
  * the words filed are the record's own note, and with the note gone the entry names nothing;
  * 43053's live run is proved by its record file's history: the multi-run load 45801917046 inserted it, and the
    commit that filed that load's receipt is the file's newest commit on main; 41744's run is the one run of the load
    that inserted it;
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s742_cuesta_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s742_cuesta as M  # noqa: E402

W = M.W
B, NG, S = B7.B, B7.NG, B7.S
KIND = "pair_read_as_alternatives"
ROWS = {cn: KIND for cn in ("41744", "43053")}
FIGURES = {"43053": ([20, 25], [25, 25], 5), "41744": ([35, 40], [40, 40], 8)}

t = T.run(W, rows=ROWS, held={}, scores={KIND: 50}, day="2026-11-27", boundaries=8, prior_held=set(M.KEYS))
check = t.check

check(isinstance(W, B7.Pile) and W.receipt_path("2026-11-27").endswith("piles_s740_cuesta_2026-11-27_s742k1.json"),
      "the plan is s742k1, on S740's shared code")
check(set(M.KEYS) == set(ROWS) and all(not W.shared_with(cn) for cn in M.KEYS),
      "the two keys, each read from a page no other record was read from")
for cn, (comp, st, n) in FIGURES.items():
    f, e = W.load(cn), M.REVIEWED[cn]
    a = f["score"]["arithmetic"]
    check(B.same(a["computed"], comp) and B.same(a["stated"], st) and e["computed"] == comp and e["stated"] == st,
          "%s: read singly the courses add to %s against the printed %s" % (cn, comp, st))
    blocks = f["record"]["blocks"]
    rows = {S.norm_code(c["code"]): c for c in blocks[0]["courses"]}
    check(len(blocks) == 1 and blocks[0]["rule"] == "all" and len(rows) == n
          and all(c["units"] == 5 for c in rows.values()),
          "%s: one required list of %d courses at 5 units" % (cn, n))
    for code in ("AVMT110", "AVMT120"):
        alts = rows[code]["alternatives"]
        check([S.norm_code(x["code"]) for x in alts] == [code + "A", code + "B"]
              and [x["units"] for x in alts] == [2.5, 2.5] and not any(x.get("together") for x in alts),
              "%s: %s lists its A and B halves at 2.5 as two alternatives" % (cn, code))
    check(all(not c.get("alternatives") for k, c in rows.items() if k not in ("AVMT110", "AVMT120")),
          "%s: no other course carries an alternative" % cn)
    cov, inv = f["score"]["coverage"], f["score"]["invented"]
    check(cov["pass"] and cov["placed"] == cov["listed"] and not cov["missing"] and inv["pass"]
          and f["score"]["repeated"]["pass"],
          "%s: every listed course is placed, none is invented and none repeats" % cn)
    gaps = f["score"]["gaps"]
    check(len(gaps) == 1 and gaps[0]["gap"] == KIND and e["words"] in gaps[0]["words"]
          and f["score"]["confidence"]["unit_arithmetic"] == 50,
          "%s: the gap files the record's own note, at unit arithmetic 50" % cn)
    bare = copy.deepcopy(f)
    bare["score"].pop("gaps")
    bare["score"].pop("confidence")
    check(W.gap_noted(bare) == (KIND, gaps[0]["words"]), "%s: the entry stands on the record as it was filed" % cn)
    g = copy.deepcopy(bare)
    g["record"]["notes"] = [x for x in B.notes(g) if e["words"] not in x]
    check(W.gap_noted(g) is None, "%s: with the note gone the entry names nothing" % cn)
    check(NG.answer(bare) is None, "%s: no record rule names a kind for it" % cn)
    check(B.closes(bare, B.apply_ops(bare, e["ops"])), "%s: with each pair at 5 the courses add to the printed total" % cn)
    check(not B.closes(bare, B.apply_ops(bare, e["ops"][:1])) and not B.closes(bare, B.apply_ops(bare, e["ops"][1:])),
          "%s: one pair alone does not close it" % cn)

# The live runs.
f = W.load("43053")
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_cuesta_45801917046.json"),
          encoding="utf-8") as fh:
    multi = json.load(fh)
check(len(multi["extracted_runs"]) == 2 and "43053" in multi["inserted_keys"]
      and str(f["extracted_run"]) in multi["extracted_runs"] and str(f["extracted_run"]) == "45787691549",
      "43053: a load over two runs inserted it, and its file's run is one of them")
check(M.FILE_HISTORY["43053"][0] == M.LOAD_COMMITS["45801917046"] and W.history_live(f),
      "43053: the commit that filed the load's receipt is its record file's newest commit on main")
g = dict(f, extracted_run="1")
check(not W.history_live(g) and not W.on_live_run(g, skip=(W.tag,)), "43053: at another run it is on no live run")
f = W.load("41744")
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_cuesta_39074969343.json"),
          encoding="utf-8") as fh:
    one = json.load(fh)
check(one["extracted_runs"] == ["39063368678"] == [str(f["extracted_run"])] and "41744" in one["inserted_keys"],
      "41744: the one-run load 39074969343 inserted it at the run its record holds")

sys.exit(t.done())
