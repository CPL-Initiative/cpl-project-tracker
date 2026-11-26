#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Orange Coast: the 17 records s721b held, four collected with named gaps (kb/_program_piles_s739_orangecoast.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 17 keys are s721b's holds; 4 collected (no new kind), 13 held; 08626 is no key (it passes as filed);
  * the live runs: 32737 and 36732 are on run 39726645292 through reread 44909976872's kept keys (S731's rule: no
    other receipt posts them); 32790 is on no proved run and holds;
  * 32737's substitution list prints no figure, and without it today's scorer passes the record; 36732's Related
    Fields list prints no figure, and its note names the figures that do not match;
  * 43362 and 41373: each note quotes both figures, and each heading goes beyond its page-mate's title, so the mate
    does not own it.

Run from repo root: python3 tests/program_piles_s739_orangecoast_test.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_orangecoast as M  # noqa: E402

W = M.W
NG = B.NG
ROWS = {"32737": "lists_not_closed", "36732": "lists_not_closed", "43362": "noted_figures_differ",
        "41373": "noted_figures_differ"}
TAB = ["Requirements tab is not in the text", "a reread"]
HELD = {"03954": TAB, "08664": TAB, "31217": TAB, "03993": ["no kind", "a reread"],
        "08628": ["not collectable"], "19473": ["not collectable"], "19474": ["not collectable"],
        "43100": ["not collectable"], "08663": ["not the program's own", "43362"],
        "32790": ["44747523200", "no committed receipt posts"], "08670": ["60-63.5", "a scorer reading"],
        "36032": ["a scorer reading"], "42331": ["9.5-16", "a scorer reading"]}
SCORES = {"lists_not_closed": 30, "noted_figures_differ": 40}
OWN = {"43362": "own_heading", "41373": "own_heading"}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=19, own=OWN)
check = t.check

check("08626" not in W.keys and B.S.passes_live(W.load("08626")["score"]) and "wrong page" in M.NOTE_08626,
      "08626 passes as filed and is no key")

# The live runs.
posted = W.prior.posted_runs(skip=(W.tag,))
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_orange_coast_44909976872.json"),
          encoding="utf-8") as fh:
    reread = json.load(fh)
for cn in ("32737", "36732"):
    check(cn in [str(k) for k in reread["kept_keys"]] and posted.get(cn) == [(reread["at"], "39726645292")]
          and str(W.load(cn)["extracted_run"]) == "39726645292",
          "%s is on run 39726645292 through the reread's kept keys alone" % cn)
check(not posted.get("32790") and not W.on_live_run(W.load("32790"), skip=(W.tag,)), "32790 is on no proved live run")
check(not any(NG.collectable(W.load(cn)["score"]) for cn in ("08628", "19473", "19474", "43100")),
      "the four coverage holds are not collectable")

f = W.load("32737")
check(f["score"]["arithmetic"]["status"] == "incomplete" and B.closes(f, B.apply_ops(f, [("drop", M._SUBSTITUTION)])),
      "32737: incomplete as filed, and the printed 23-25 without its substitution list")
f = W.load("36732")
check(B.shape_open(f, {"open": "Related Fields"}) and "12 core + 3-7 does not match 18-19" in f["score"]["gaps"][0]["words"],
      "36732: Related Fields prints no figure, and the gap files the note on the figures too")
for cn, mate in (("43362", "08663"), ("41373", "32086")):
    f = W.load(cn)
    check(B.shape_note_quotes(f, M.REVIEWED[cn]) and W.shared_with(cn) == [mate], "%s: its note quotes both figures" % cn)
    g = W.load(mate)
    check(g["record"]["program"]["section_heading"] == f["record"]["program"]["section_heading"]
          and W.own(g, {"gap": "noted_figures_differ", "own_heading": g["record"]["program"]["section_heading"]}) is None,
          "%s carries %s's heading and does not own it" % (mate, cn))

sys.exit(t.done())
