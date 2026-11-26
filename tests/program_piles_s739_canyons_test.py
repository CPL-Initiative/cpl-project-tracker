#!/usr/bin/env python3
"""S739, lane 2's cheap piles at College of the Canyons: the 14 records s727a held, 7 passed by a rename and 6 collected with named gaps (kb/_program_piles_s739_canyons.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 14 keys are s727a's holds; 7 passed, 6 collected (no new kind), 1 held (36793, a sum inside its printed range);
  * each rename: the record prints the code, its note names both codes, the listed course is on the state's list and
    was missing, the printed code is not on the list, the rescore is exact and renames those codes alone, and the
    arithmetic was already equal; a rename the note does not name moves nothing;
  * each gap's reading closes its record at the printed total, and a reading one unit off does not;
  * 41576: today's capture finds none of the list's unspaced codes and every spaced one, so MUSIC 189 and 190 stand
    on the record's own placing; a course the record does not place still fails the claim check;
  * 45528's note quotes both figures, and they are the filed arithmetic's.

Run from repo root: python3 tests/program_piles_s739_canyons_test.py
"""
import copy
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_canyons as M  # noqa: E402

W = M.W
S = B.S
PASSED = ("10302", "19386", "33814", "44260", "44657", "40090", "32723")
ROWS = {cn: B.PASSES for cn in PASSED}
ROWS.update({"02277": "unit_line_not_read", "15477": "noted_unit_floor", "32815": "lists_not_closed",
             "40384": "noted_figures_differ", "45528": "noted_figures_differ", "41576": "repeat_read_once"})
HELD = {"36793": ["19-22", "18-22", "a scorer reading, not a reread"]}
SCORES = {"unit_line_not_read": 40, "noted_unit_floor": 70, "lists_not_closed": 30, "noted_figures_differ": 40,
          "repeat_read_once": 60}
OWN = {"02277": "own_heading", "15477": "own_heading", "32815": "own_heading", "33814": "own_heading",
       "40384": "own_heading", "45528": "own_heading", "41576": "own_section"}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=53, own=OWN)
check = t.check

# The renames. The filed score, as the plan wrote it, names each; the record still prints the code.
listed_of = {cn: {S.norm_code(c.get("code")) for c in B.C.closed_list(M.COLLEGE, cn)} for cn in PASSED}
for cn in PASSED:
    f = W.load(cn)
    e = M.PASSED[cn]
    table = {S.norm_code(k): S.norm_code(v) for k, v in e["renames"].items()}
    check(set(table) <= B.codes(f), "%s: the record prints each renamed code" % cn)
    check(set(table.values()) <= listed_of[cn] and not set(table) & listed_of[cn],
          "%s: each listed course is on the state's list, and no printed code is" % cn)
    check(f["score"]["arithmetic"]["status"] == "equal" and S.passes_live(f["score"]),
          "%s: the filed score passes, its arithmetic equal" % cn)
    got = {(S.norm_code(r["printed"]), S.norm_code(r["listed"])) for r in f["score"]["course_renumbers"]}
    check(got == set(table.items()), "%s: the filed score names the plan's renames alone" % cn)
    # A rename its note does not name moves nothing: the entry with other words does not stand.
    check(W.renamed_score(f) is not None, "%s: its entry stands on the filed score" % cn)
    saved = dict(e)
    e["words"] = "words the record does not carry"
    check(W.renamed_score(f) is None, "%s: without its note's words the rename does not stand" % cn)
    e.clear()
    e.update(saved)
check(all(re.search(r"typo|misspelling|same title|matched to closed-list", M.PASSED[cn]["words"]
                    + M.PASSED[cn].get("also_words", "")) for cn in PASSED),
      "each rename's note says the two codes are one course")

# Each gap's reading closes its record; one unit off does not.
f = W.load("02277")
name = "Plus 14 units from the following (for non-transfer students)"
check(B.closes(f, B.apply_ops(f, [("choose", name, 14)])) and not B.closes(f, B.apply_ops(f, [("choose", name, 13)])),
      "02277: the non-transfer path at its printed 14 closes it, and at 13 does not")
f = W.load("15477")
check(B.closes(f, B.apply_ops(f, [("units", "WE-186MEA", 1)])) and not B.closes(f, B.apply_ops(f, [("units", "WE-186MEA", 2)])),
      "15477: WE-186MEA at its one unit closes it, and at 2 does not")
f = W.load("41576")
check(B.closes(f, B.apply_ops(f, [("repeat", "MUSIC-189", 4), ("repeat", "MUSIC-190", 4)]))
      and not B.closes(f, B.apply_ops(f, [("repeat", "MUSIC-189", 4), ("repeat", "MUSIC-190", 3)])),
      "41576: both courses four times close it, and one repeat short does not")
f = W.load("32815")
check(f["score"]["arithmetic"]["status"] == "incomplete" and B.closes(f, B.apply_ops(f, [("drop", M._SUBSTITUTION)])),
      "32815: incomplete as filed, and equal at 23 without its substitution list")

# 41576's claim: the capture's miss is its matcher's. Every unspaced code of the list is unfound, every spaced one found.
src = W.sources()["41576"]
found = {S.norm_code(x) for x in src["codes_found"]}
raw = [str(c.get("code")) for c in B.C.closed_list(M.COLLEGE, "41576")]
unspaced = [c for c in raw if " " not in c.strip() and "-" not in c]
check(len(unspaced) == 8 and not any(S.norm_code(c) in found for c in unspaced)
      and all(S.norm_code(c) in found for c in raw if c not in unspaced),
      "41576: the capture finds every spaced code of the list and none of its 8 unspaced ones")
check("MUSIC189" in unspaced and "MUSIC190" in unspaced and W.claim(W.load("41576")) == "stands",
      "41576: MUSIC 189 and 190 are stored unspaced, and its claim stands")
saved = M.REVIEWED["41576"]["courses"]
M.REVIEWED["41576"]["courses"] = saved + ["MUSIC999"]
check(W.claim(W.load("41576")) == "a named course not found", "a course the record does not place fails the claim")
M.REVIEWED["41576"]["courses"] = saved

# 45528: the note quotes both figures.
f = W.load("45528")
check(B.shape_note_quotes(f, M.REVIEWED["45528"])
      and not B.shape_note_quotes(f, dict(M.REVIEWED["45528"], quotes={"stated": "51 - 54", "computed": "55-57"})),
      "45528: its note quotes 51 - 54 and 54-57, the filed figures")
g = copy.deepcopy(W.load("40384"))
check(W.own(g, M.REVIEWED["40384"]) == "own_heading" and W.load("40383")["score"]["gaps"][0]["gap"] == "noted_figures_differ",
      "40384: its own heading, and the degree the section also serves carries the same kind")

sys.exit(t.done())
