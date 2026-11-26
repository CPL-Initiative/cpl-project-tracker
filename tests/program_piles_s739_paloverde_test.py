#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Palo Verde: the five records s721a held, each collected with its gap named (kb/_program_piles_s739_paloverde.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the five keys are s721a's holds, all five collected, no new kind, none held;
  * the live runs: reread 39891946981 replaced four of the keys at run 39852997888 and the one-run load
    39891599387 inserted 45359 at it, the run each record holds;
  * 17998: S721's degree_rest stands as it does on 18000 and 18045, the sisters s721a filed under the kind; an
    electives figure, or a word that electives fill the degree, names no gap;
  * 41242: S721's spans_figure stands and its figures add to the printed 30; a required figure outside its courses'
    range names no gap;
  * 41227: its figures add to the note's 29.75 against the note's 30, a quarter unit apart, so S721's kind does not
    stand on it and the two-figure kind does; figures that add to the total name no gap;
  * 45359: the three science lists print no figure, and as one pool at 7 the record adds to 35 inside 34-38; a list
    with its own figure names no gap;
  * 17999: every course of Lists A and B is on the emphasis list, and without them the major closes at 18; a course
    off the emphasis list names no gap.

Run from repo root: python3 tests/program_piles_s739_paloverde_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_paloverde as M  # noqa: E402

W = M.W
NG, PV = B.NG, M.PV
ROWS = {"17998": "degree_electives_not_printed", "41242": "figure_within_variable_units",
        "41227": "noted_figures_differ", "45359": "pool_figure_not_read", "17999": "lists_not_closed"}
SCORES = {"degree_electives_not_printed": 50, "figure_within_variable_units": 60, "noted_figures_differ": 40,
          "pool_figure_not_read": 40, "lists_not_closed": 30}

t = T.run(W, rows=ROWS, held={}, scores=SCORES, day="2026-11-26", boundaries=16)
check = t.check

# The live runs.
posted = W.prior.posted_runs(skip=(W.tag,))
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_palo_verde_39891946981.json"),
          encoding="utf-8") as fh:
    reread = json.load(fh)
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_palo_verde_39891599387.json"),
          encoding="utf-8") as fh:
    load = json.load(fh)
check(all(cn in [str(k) for k in reread["replaced_keys"]] and max(posted[cn]) == (reread["at"], "39852997888")
          for cn in ROWS if cn != "45359"),
      "reread 39891946981 replaced four of the keys at run 39852997888")
check(load["extracted_runs"] == ["39852997888"] and "45359" in [str(k) for k in load["inserted_keys"]]
      and posted["45359"] == [(load["at"], "39852997888")],
      "the one-run load 39891599387 inserted 45359 at run 39852997888")
check(all(str(W.load(cn)["extracted_run"]) == "39852997888" for cn in ROWS), "each record holds run 39852997888")
check(all(not W.shared_with(cn) for cn in ROWS), "each record was read from a page no other record was read from")

# 17998: the shape of its sisters.
f = W.load("17998")
check(PV.degree_rest(f) and all(PV.degree_rest(W.load(cn)) and
                                [g["gap"] for g in W.load(cn)["score"]["gaps"]] == ["degree_electives_not_printed"]
                                for cn in ("18000", "18045")),
      "17998 holds degree_rest as 18000 and 18045 do, which s721a filed under the kind")
g = copy.deepcopy(f)
g["record"]["program"]["degree_elective_units"] = {"min": 4, "max": 8}
check(not W.kind_closes(g, M.REVIEWED["17998"]), "17998: an electives figure names no gap")
g = copy.deepcopy(f)
g["record"]["program"]["electives_fill_degree"] = True
check(not W.kind_closes(g, M.REVIEWED["17998"]), "17998: a word that electives fill the degree names no gap")

# 41242: the Fire Science shape.
f = W.load("41242")
check(PV.spans_figure(f) and B.same(PV._figures(f), [30, 30]), "41242: its 17.25 and 12.75 add to the printed 30")
g = copy.deepcopy(f)
g["record"]["blocks"][0]["stated"] = {"min": 30.25, "max": 30.25}
check(not W.kind_closes(g, M.REVIEWED["41242"]), "41242: a required figure outside its courses' range names no gap")

# 41227: two figures a quarter unit apart.
f = W.load("41227")
check(B.same(PV._figures(f), [29.75, 29.75]) and not M.spans_total(f, {}) and M.figures_short(f, M.REVIEWED["41227"]),
      "41227: its figures add to 29.75 against 30, so S721's kind does not stand and the two-figure kind does")
g = copy.deepcopy(f)
g["record"]["blocks"][1]["stated"] = {"min": 10.5, "max": 10.5}
check(not W.kind_closes(g, M.REVIEWED["41227"]), "41227: figures that add to the printed total name no gap")
check(not M.figures_short(f, dict(M.REVIEWED["41227"], quotes={"sum": "summing to 29.75", "stated": "Credits: 31.0"})),
      "41227: a total its note does not quote names no gap")
check("FST 090 0.25-12" in f["score"]["gaps"][0]["words"] and "summing to 29.75" in f["score"]["gaps"][0]["words"],
      "41227: the gap files both notes")

# 45359: one figure over three lists.
f = W.load("45359")
e = M.REVIEWED["45359"]
check(M.pool_inside(f, e) and all(B.S._span(B.blocks(f, n)[0].get("stated")) is None for n in M._SCIENCES),
      "45359: the three science lists print no figure, and as one pool at 7 the record adds to 35 inside 34-38")
g = copy.deepcopy(f)
[b for b in g["record"]["blocks"] if b["name"] == "Lab"][0]["stated"] = {"min": 1, "max": 1}
check(not W.kind_closes(g, e), "45359: a science list with its own figure names no gap")
check(not M.pool_inside(f, dict(e, figure=10, pooled=[38, 38])) and not M.pool_inside(f, dict(e, pooled=[34, 34])),
      "45359: a figure its note does not quote, or another pooled sum, names no gap")

# 17999: the lists printed after the emphasis are on it.
f = W.load("17999")
e = M.REVIEWED["17999"]
check(M.sublists(f, e) and B.closes(f, B.apply_ops(f, e["ops"]), major=True),
      "17999: every course of Lists A and B is on the emphasis list, and without them the major closes at 18")
g = copy.deepcopy(f)
[b for b in g["record"]["blocks"] if b["name"] == M._LISTS[0]][0]["courses"][0]["code"] = "MAT 110"
check(not W.kind_closes(g, e), "17999: a listed course off the emphasis list names no gap")
check(B.arithmetic(f).get("degree", {}).get("within") is True and "CalGETC 34-38" in f["score"]["gaps"][0]["words"],
      "17999: its degree's 60-61 holds the 59-64 of the lists read apart, and the gap files the degree's note")

sys.exit(t.done())
