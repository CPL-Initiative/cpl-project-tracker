#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Santa Barbara City: five records s727d held, three collected with named gaps (kb/_program_piles_s739_sbcc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the five keys are s727d's holds less 05934, which keeps its hold (d-sbcc-05934-keeps-hold-s727) and is no key;
  * 19012 and 46520: each substitution list prints no figure, and without it today's scorer passes the record;
  * 45452: the BIOL pair read as one alternative at the row's 5 closes it at 35-40, a pair at 3 does not, and
    its List A already adds to its printed 4-8 (one gap, not the two S727 held it for);
  * the holds: 30746 is not collectable and the capture does not find PSY 200; 43553's two lists' printed figures add
    to its computed sum, under the printed total.

Run from repo root: python3 tests/program_piles_s739_sbcc_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_sbcc as M  # noqa: E402

W = M.W
ROWS = {"19012": "lists_not_closed", "46520": "lists_not_closed", "45452": "pair_read_as_alternatives"}
HELD = {"30746": ["not collectable", "PSY 200", "a reread"], "43553": ["32-37", "35-41", "a page read"]}
SCORES = {"lists_not_closed": 30, "pair_read_as_alternatives": 50}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=14)
check = t.check

check("05934" not in W.keys and "05934" not in W.hand, "05934 keeps its hold and is no key")
for cn, name in (("19012", "List of Electives"), ("46520", "Substitution Courses")):
    f = W.load(cn)
    check(f["score"]["arithmetic"]["status"] == "incomplete" and B.shape_open(f, {"open": name}),
          "%s: incomplete as filed, on a list that prints no figure" % cn)
    check(B.closes(f, B.apply_ops(f, [("drop", name)]), verdict=True), "%s: without the list today's scorer passes it" % cn)
    check("reconcile" in M.REVIEWED[cn]["lever"], "%s: its cheaper lever is named" % cn)
f = W.load("46520")
check(B.closes(f, B.apply_ops(f, [("drop", "Substitution Courses")])), "46520: its core is the printed 20 at both ends")

f = W.load("45452")
(pair,) = M.REVIEWED["45452"]["ops"]
check(B.closes(f, B.apply_ops(f, [pair])) and not B.closes(f, B.apply_ops(f, [("pair", "BIOL 100", ["BIOL 140", "BIOL 141"], 3)])),
      "45452: the pair as one alternative at the row's 5 closes it at 35-40, and a pair at 3 does not")
names = [b["name"] for b in f["record"]["blocks"] if b.get("option_group") == "List A"]
check(len(names) == 6 and B.same(B.C.fresh_score(dict(f, record=B.apply_ops(f, [("pool", names, 4, 8)])))["arithmetic"]["computed"],
                                 B.arithmetic(f)["computed"]),
      "45452: List A read at its printed 4-8 moves nothing, so it is no second gap")

f = W.load("30746")
found = {B.S.norm_code(x) for x in W.sources()["30746"]["codes_found"]}
check(not B.NG.collectable(f["score"]) and "PSY200" in f["score"]["coverage"]["missing"] and "PSY200" not in found,
      "30746: coverage fails on PSY 200, which the capture does not find")
f = W.load("43553")
stated = [B.pair(b.get("stated")) for b in f["record"]["blocks"]]
check(B.same([sum(x[0] for x in stated), sum(x[1] for x in stated)], B.arithmetic(f)["computed"])
      and B.same(B.arithmetic(f)["stated"], [35, 41]) and not any("35" in n and "32" in n for n in B.notes(f)),
      "43553: its lists' printed figures add to 32-37 under the printed 35-41, and no note quotes both")

sys.exit(t.done())
