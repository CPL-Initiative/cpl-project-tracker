#!/usr/bin/env python3
"""The level ordering in kb/_build_ccr_universe.py (Sam, 2026-09-09).

"see if you can further arrange courses in better proximity to each other …
if you can also use level (beg, int, adv) when you have some indicator."

⚠️ THE INDICATOR IS THIN, AND THAT IS THE POINT OF THESE CHECKS. Only 12% of the
49,896 points carry a level word. So the reorder must gather the levelled
minority WITHOUT disturbing the other 88%, whose order already carries the match
score that decided which ring they sit on. A plain sort would throw that away;
the guard below is that `by_level` is STABLE.

Run:  python3 tests/ccr_level_layout_test.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kb"))
import importlib

mod = importlib.import_module("_build_ccr_universe")

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


# ── the rule matches the client's, or the map and the panel disagree ─────────
check("Beginning is recognized", mod.level_rank("Beginning Welding") == 0)
check("beginner / basic / elementary are the same rung",
      mod.level_rank("Beginner Spanish") == 0 and mod.level_rank("Basic Drawing") == 0
      and mod.level_rank("Elementary Algebra") == 0)
check("Intermediate is its own rung", mod.level_rank("Intermediate Welding") == 1)
check("Advanced is its own rung", mod.level_rank("Advanced Welding") == 2)
check("advance / advanced both read as Advanced",
      mod.level_rank("Advance Machining") == 2 and mod.level_rank("Advanced Machining") == 2)
# ⚠️ Most specific first: an Advanced course may still say "basic".
check("⭐ 'Advanced Basic Skills' is ADVANCED, not beginning — specificity wins",
      mod.level_rank("Advanced Basic Skills") == 2)
check("a title naming no level ranks last, never guessed at",
      mod.level_rank("Welding Practice") == 3 and mod.level_rank("") == 3
      and mod.level_rank(None) == 3)
# A level word must be a WORD: "Advanced" inside another token is not a level.
check("the match is word-bounded", mod.level_rank("Preadvancement Studies") == 3,
      "rank=%r" % mod.level_rank("Preadvancement Studies"))

# ── ⭐ stability: the 88% keep the order the score gave them ─────────────────
rows = [{"t": "Welding Practice A"}, {"t": "Advanced Welding"}, {"t": "Welding Practice B"},
        {"t": "Beginning Welding"}, {"t": "Welding Practice C"}, {"t": "Intermediate Welding"}]
out = mod.by_level(rows, lambda r: r["t"])
titles = [r["t"] for r in out]
check("⭐ levelled courses gather in ladder order",
      titles[:3] == ["Beginning Welding", "Intermediate Welding", "Advanced Welding"], titles)
check("⭐ the unlevelled keep their incoming order — the sort is STABLE",
      titles[3:] == ["Welding Practice A", "Welding Practice B", "Welding Practice C"], titles)
check("nothing is added or lost", len(out) == len(rows))

# An all-unlevelled ring must come back byte-identical: 88% of rings are this.
plain = [{"t": "Welding %d" % i} for i in range(8)]
check("⭐ a ring with no level words is returned untouched",
      [r["t"] for r in mod.by_level(plain, lambda r: r["t"])] == [r["t"] for r in plain])

ok = sum(1 for _, c, _ in results if c)
for name, c, why in results:
    print(("PASS" if c else "FAIL") + "  " + name + ("" if c or not why else "  — " + str(why)))
print("\n%d/%d checks passed" % (ok, len(results)))
sys.exit(0 if ok == len(results) else 1)
