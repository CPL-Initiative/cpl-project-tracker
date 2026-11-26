#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Saddleback: the two records s730b still holds, both collected with named gaps (kb/_program_piles_s739_saddleback.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the two keys are s730b's holds that its repeat reread did not replace (the seven it replaced pass and are no keys);
  * 04073: the piano requirements from zero and the ensemble at its printed 4-8 close it at 20-34 together, and
    neither alone does; the kind filed is the lower score of the two;
  * 36625: each pathway at the page's 3-5 closes it at 12-14, at another figure it does not, and one pathway left at
    its course sum does not.

Run from repo root: python3 tests/program_piles_s739_saddleback_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_saddleback as M  # noqa: E402

W = M.W
ROWS = {"04073": "waived_course_counted", "36625": "pool_figure_not_read"}
SCORES = {"waived_course_counted": 50, "pool_figure_not_read": 40}
REPEAT = ("19050", "19051", "41420", "41422", "41423", "41425", "41426")

t = T.run(W, rows=ROWS, held={}, scores=SCORES, day="2026-11-26", boundaries=7)
check = t.check

check(not set(REPEAT) & set(W.keys) and all(B.S.passes_live(W.load(cn)["score"]) for cn in REPEAT),
      "the seven the repeat reread replaced pass and are no keys")

f = W.load("04073")
check(B.closes(f, M.music_reading(f)), "04073: both readings give the printed 20-34")
check(not B.closes(f, M.music_reading(f, semesters=False)) and not B.closes(f, M.music_reading(f, waived=False)),
      "04073: neither reading alone gives it")
check(B.NG.ARITH_SCORE["waived_course_counted"] < B.NG.ARITH_SCORE["repeat_read_once"],
      "04073: the kind filed is the lower score of its two gaps")
gap = f["score"]["gaps"][0]
check("proficiency exam" in gap["words"] and "four semesters including repeated classes" in gap["words"],
      "04073: the gap files both notes")

f = W.load("36625")
ops = M.REVIEWED["36625"]["ops"]
check(B.closes(f, B.apply_ops(f, ops)) and not B.closes(f, B.apply_ops(f, ops[:-1]))
      and not B.closes(f, B.apply_ops(f, [("stated", n, 3, 6) for n in M._PATHWAYS])),
      "36625: every pathway at the page's 3-5 closes it at 12-14, and nothing less does")
check("reconcile" in M.REVIEWED["36625"]["lever"], "36625: its cheaper lever is named")

sys.exit(t.done())
