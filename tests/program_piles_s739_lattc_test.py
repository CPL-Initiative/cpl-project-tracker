#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Los Angeles Trade-Technical: the 11 records s730a held, 4 passed by a rename and 3 collected with named gaps (kb/_program_piles_s739_lattc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 11 keys are s730a's holds; 4 passed, 3 collected (no new kind), 4 held;
  * each rename: the record prints the code, the listed course is on the state's list and was missing, the filed
    score names the plan's renames alone and passes; 31090's rename stands on 02911's note (note_of), 02911 prints
    the same code, and without that note it does not stand;
  * 18857's three lists as one pool close at 18 alone; 38737 closes with the 11 its own table row prints, and its
    lever is named; 37706's note quotes both figures;
  * the holds: 31280 is still not collectable with its rename read, 31089 and 45285 are not collectable, 41011 reads
    no total.

Run from repo root: python3 tests/program_piles_s739_lattc_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_lattc as M  # noqa: E402

W = M.W
S = B.S
PASSED = ("02911", "21855", "31090", "41150")
ROWS = {cn: B.PASSES for cn in PASSED}
ROWS.update({"18857": "pool_figure_not_read", "38737": "noted_no_total", "37706": "noted_figures_differ"})
HELD = {"31280": ["not collectable", "CRPNTRY 111C"], "31089": ["not collectable", "BLDGTCQ"],
        "41011": ["unstated", "VOC ED 463"], "45285": ["not collectable", "a reread"]}
SCORES = {"pool_figure_not_read": 40, "noted_no_total": 40, "noted_figures_differ": 40}
OWN = {"02911": "own_heading", "21855": "own_section", "31090": "own_heading", "41150": "own_heading",
       "37706": "own_heading"}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=29, own=OWN)
check = t.check

for cn in PASSED:
    f = W.load(cn)
    e = M.PASSED[cn]
    table = {S.norm_code(k): S.norm_code(v) for k, v in e["renames"].items()}
    listed = {S.norm_code(c.get("code")) for c in B.C.closed_list(M.COLLEGE, cn)}
    check(set(table) <= B.codes(f) and set(table.values()) <= listed and not set(table) & listed,
          "%s: the record prints each renamed code, and only the listed course is on the state's list" % cn)
    got = {(S.norm_code(r["printed"]), S.norm_code(r["listed"])) for r in f["score"]["course_renumbers"]}
    check(got == set(table.items()) and S.passes_live(f["score"]) and W.renamed_score(f) is not None,
          "%s: the filed score names the plan's renames alone and passes" % cn)

# 31090: its rename stands on 02911's note.
e = M.PASSED["31090"]
check(e["note_of"] == "02911" and not any("PLUMBING 028" in n for n in B.notes(W.load("31090")))
      and any(e["words"] in n for n in B.notes(W.load("02911"))) and S.norm_code("PLUMBING 028") in B.codes(W.load("02911")),
      "31090: its own notes are silent, and 02911, which prints the same code, names the misprint")
saved = e.pop("note_of")
check(W.renamed_score(W.load("31090")) is None, "31090: without 02911's note its rename does not stand")
e["note_of"] = saved
check(W.renamed_score(W.load("31090")) is not None, "31090: with it, it stands")

f = W.load("18857")
names = M.REVIEWED["18857"]["ops"][0][1]
check(B.closes(f, B.apply_ops(f, [("pool", names, 18)])) and not B.closes(f, B.apply_ops(f, [("pool", names, 17)])),
      "18857: its three lists as one pool close at 18 alone")
f = W.load("38737")
check(B.closes(f, B.apply_ops(f, [("total", 11)])) and not B.closes(f, B.apply_ops(f, [("total", 12)]))
      and "T038737D" in M.REVIEWED["38737"]["lever"] and W.sources()["38737"]["source"]["h1"] == "T038737D C - 11 - 11",
      "38737: the 11 of its own table row closes it, and the lever names that row")
f = W.load("37706")
check(B.shape_note_quotes(f, M.REVIEWED["37706"]) and W.shared_with("37706") == ["38452"],
      "37706: its note quotes 18-19 and 16-17, and its page is shared with 38452")
g = copy.deepcopy(W.load("38452"))
check(W.own(g, M.REVIEWED["37706"]) is None, "38452 does not own the Pre-Health Professions II section")

for cn in ("31280", "31089", "45285"):
    check(not B.NG.collectable(W.load(cn)["score"]), "%s is not collectable" % cn)
rn = B.P.rescore_common_numbers(W.load("31280"), name_of=lambda c: "PLUMBNG28" if S.norm_code(c) == S.norm_code("PLUMBING 028") else None,
                                key="course_renumbers")
check(rn is not None and not S.passes_live(rn["score"]) and "CRPNTRY111C" in rn["score"]["coverage"]["unexplained"],
      "31280: with its rename read CRPNTRY 111C is still unexplained")
check(W.load("41011")["score"]["arithmetic"]["status"] == "unstated", "41011 reads no total")

sys.exit(t.done())
