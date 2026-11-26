#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Cosumnes River: the census's 16 wording-rule records, 4 passed by a rename and 7 collected with named gaps (kb/_program_piles_s739_cosumnes.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 16 keys are the census's 17 less 33542, lane 1's (plan s739l), which carries its own gap and is no key;
  * the live-run reading (B.LiveRuns, the shared module's, for a college with no earlier piles module): every row was
    inserted by the one-run load 39048319477 at the run its record holds; a reread that replaced a key posts the
    reread's run, and a load over several runs posts none;
  * each rename: the state's code is the printed code with digits fused after it, on the committed state list; the
    record prints the code; the filed score names the plan's renames alone and passes; a rename that is not fused
    (PHOTO 390 for PHOT3904859) is refused by the rule;
  * 31053's note quotes both figures; the five cut-off records add short of their total or state none;
  * the holds: 11340 and 11341 take no rename, 11346 and 17868 are not collectable, 38017's capture names another page.

Run from repo root: python3 tests/program_piles_s739_cosumnes_test.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_cosumnes as M  # noqa: E402

W = M.W
S, NG = B.S, B.NG
PASSED = ("04596", "35899", "20197", "39139")
CUT = ("04616", "15249", "15326", "39679", "20153")
ROWS = {cn: B.PASSES for cn in PASSED}
ROWS.update({cn: "noted_section_cut_off" for cn in CUT})
ROWS.update({"31053": "noted_figures_differ", "45203": "noted_no_total"})
HELD = {"11340": ["no rename is filed", "PHOT3904859"], "11341": ["no rename is filed", "PHO372250530"],
        "11346": ["ART325", "ge_units_not_read"], "17868": ["not collectable", "a reread"],
        "38017": ["38750", "a reread"]}
SCORES = {"noted_section_cut_off": 20, "noted_figures_differ": 40, "noted_no_total": 40}
OWN = {"04596": "own_heading", "35899": "own_heading", "20197": "own_heading", "39139": "own_heading",
       "15326": "own_section", "20153": "own_heading"}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=45, own=OWN, prior_held=set(M.KEYS))
check = t.check

f = W.load("33542")
check("33542" not in M.KEYS and M.LANE_1 == ("33542",) and bool(f["score"].get("gaps")),
      "33542 is lane 1's, carries its own gap and is no key")

# The live-run reading.
live = W.prior
posted = live.posted_runs(skip=(W.tag,))
check(all(posted.get(cn) and max(posted[cn])[1] == "39047009824" == str(W.load(cn)["extracted_run"]) for cn in ROWS),
      "every row was posted at run 39047009824, the run its record holds, before this plan's apply")
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_cosumnes_river_39048319477.json"),
          encoding="utf-8") as fh:
    load = json.load(fh)
check(load["extracted_runs"] == ["39047009824"] and set(ROWS) <= set(load["inserted_keys"]),
      "load 39048319477 held one run and inserted every row")
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_cosumnes_river_44917693465.json"),
          encoding="utf-8") as fh:
    multi = json.load(fh)
only_multi = [k for k in multi["inserted_keys"] if k not in load["inserted_keys"]]
check(len(multi["extracted_runs"]) > 1 and all(not any(at == multi.get("at") for at, _ in posted.get(k) or [])
                                              for k in only_multi),
      "a load over several runs posts no run of its own")
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_cosumnes_river_43523284838.json"),
          encoding="utf-8") as fh:
    reread = json.load(fh)
check(all((reread["at"], str(reread["extracted_run"])) in (posted.get(str(k)) or [])
          for k in reread.get("replaced_keys") or []), "a reread posts its replaced keys at its own run")
g = dict(W.load("04596"), extracted_run="1")
check(not live.on_live_run(g) and live.on_live_run(W.load("04596"), skip=(W.tag,)),
      "a record at another run is not on its live run")

# The renames: fused codes on the committed state list.
for cn in PASSED:
    f = W.load(cn)
    table = {S.norm_code(k): S.norm_code(v) for k, v in M.PASSED[cn]["renames"].items()}
    listed = {S.norm_code(c.get("code")) for c in B.C.closed_list(M.COLLEGE, cn)}
    check(set(table) <= B.codes(f) and set(table.values()) <= listed and not set(table) & listed,
          "%s: the record prints the code, and only the fused code is on the state's list" % cn)
    check(all(M.fused(k, v) for k, v in M.PASSED[cn]["renames"].items()), "%s: its rename is a fused code" % cn)
    got = {(S.norm_code(r["printed"]), S.norm_code(r["listed"])) for r in f["score"]["course_renumbers"]}
    check(got == set(table.items()) and S.passes_live(f["score"]), "%s: the filed score names the rename and passes" % cn)
check(not M.fused("PHOTO 390", "PHOT3904859") and not M.fused("MUIVI 495", "MUIV49545560")
      and not M.fused("ARTH 325", "ART325") and not M.fused("MKT 495", "MKT 495"),
      "a code that is not the printed code with digits after it is no fused code")

f = W.load("31053")
check(B.shape_note_quotes(f, M.REVIEWED["31053"]), "31053: its note quotes Total Units: 33 and the 30 its courses add to")
for cn in CUT:
    check(B.shape_cut(W.load(cn), {}), "%s adds short of its stated total, or states none" % cn)
    check(W.load(cn)["score"]["confidence"]["course_list_match"] <= 50, "%s: its course-list match is capped at 50" % cn)

for cn in ("11340", "11341", "11346", "17868"):
    check(not NG.collectable(W.load(cn)["score"]), "%s is not collectable" % cn)
f = W.load("38017")
check(W.shared_with("38017") == ["38750"] and not B.notes(f)
      and W.sources()["38017"]["source"]["url"] != f["source_url"],
      "38017 carries no note, shares its page with 38750, and today's capture names another page for it")

sys.exit(t.done())
