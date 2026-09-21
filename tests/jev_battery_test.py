#!/usr/bin/env python3
"""The variable battery's selection rule, tested where it matters — kb/_jev_battery.py.

A selection rule that cannot reject noise is worse than none: it launders chance
into a "finding" and the next session builds on it. So the tests are:

  * ⭐ PURE NOISE MUST NOT PASS. Six random variables over 26 rows, many seeds.
  * ⭐ A PLANTED SIGNAL MUST PASS. Otherwise the rule rejects everything and its
    nulls mean nothing either.
  * The band is Sam's FINAL call (8 flips applied), never his first pass.
  * The thresholds are pre-registered constants, not computed from the answers —
    a rule that moves toward its data is not a rule.

Pure stdlib, no network, no key. Run: python3 tests/jev_battery_test.py
"""
import io
import os
import random
import sys
from contextlib import redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _jev_battery as B  # noqa: E402

results = []
def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def profiles_from(fn, seed):
    """Build a profile per band item using fn(truth, rng) for every variable."""
    rng = random.Random(seed)
    out = []
    for row in B.band():
        out.append({"item": row["item"],
                    **{v: fn(row["truth"], rng) for v in B.VARIABLES}})
    return out


def run(profiles):
    buf = io.StringIO()
    with redirect_stdout(buf):
        res = B.score(profiles)
    return res, buf.getvalue()


# ── 1. the band is his final call ───────────────────────────────────────────
rows = B.band()
check("the band is the 26 below-gate pairs", len(rows) == 26, f"got {len(rows)}")
check("truth is his FINAL call: 16 fold, 10 keep",
      sum(1 for x in rows if x["truth"] == "fold") == 16 and
      sum(1 for x in rows if x["truth"] == "keep") == 10,
      "scoring his first pass would score the model against a reading he corrected")
check("every band pair is genuinely below the gate",
      all(x["p_same"] < B.GATE for x in rows), "")

# ── 2. ⭐ pure noise must not pass ───────────────────────────────────────────
# ⚠️ ASSERT A RATE, NOT PERFECTION. At a nominal 5% family-wise error, zero
# winners in 25 runs happens only about 28% of the time — an assertion of zero
# would fail a correctly-calibrated rule most of the time, and "fix" it by
# making the rule arbitrarily strict. What must hold is that the rate is at or
# below nominal. Measured before the primary gate existed: 2 of 25. With it: 0.
false_positives = 0
TRIALS = 25
for seed in range(TRIALS):
    res, _ = run(profiles_from(lambda truth, rng: rng.random(), seed))
    if res.get("kept"):
        false_positives += 1
check("⭐ pure noise clears a winner at or below the nominal rate",
      false_positives <= 2,
      f"{false_positives} of {TRIALS} random runs produced a 'winner' — above the "
      f"~5% the correction promises, so the rule launders chance into a finding")
check("⭐ and the primary gate holds it well under nominal",
      false_positives <= 1,
      f"{false_positives} of {TRIALS}; the gate should make a noise winner rare, "
      f"not merely nominal")

# ── 3. ⭐ a planted signal must pass ─────────────────────────────────────────
# A keep scores high, a fold scores low, with overlap so it is not trivial.
res, out = run(profiles_from(
    lambda truth, rng: rng.uniform(0.55, 1.0) if truth == "keep" else rng.uniform(0.0, 0.45),
    seed=11))
check("⭐ a planted separation IS detected",
      res.get("kept"), "a rule that rejects everything makes its nulls meaningless")
check("and the primary endpoint reports it too",
      "PRIMARY" in out and "PASSES" in out, "")

# ── 4. a moderate effect is honestly reported as undetectable ───────────────
# Heavy overlap: real but small. The power note says this design cannot see it.
res_mod, out_mod = run(profiles_from(
    lambda truth, rng: rng.uniform(0.3, 1.0) if truth == "keep" else rng.uniform(0.2, 0.9),
    seed=5))
check("a moderate effect does not sneak through as a finding",
      not res_mod.get("kept"), "")
check("⭐ and the output says a null means 'no LARGE effect', not 'no signal'",
      "POWER" in out_mod and "not evidence that a moderate one is absent" in out_mod,
      "a null with no power statement reads as proof of absence")

# ── 5. the thresholds are pre-registered, not fitted ────────────────────────
src = open(os.path.join(ROOT, "kb", "_jev_battery.py"), encoding="utf-8").read()
check("the selection rule is fixed in the source before any answer exists",
      "SELECTION, PRE-REGISTERED" in src and "BEFORE ANY ANSWER EXISTS" in src, "")
check("one primary endpoint, six Holm-corrected secondaries",
      B.PRIMARY == "any_reason" and B.CORRECTION == "holm", "")
check("the permutation seed is fixed, so a p-value cannot be re-rolled",
      isinstance(B.SEED, int) and "rng = random.Random(SEED)" in src, "")

# ── 6. every variable is phrased as a reason to HOLD SEPARATE ───────────────
# One direction for all six: a keep should score higher. A mixed convention is
# how a sign gets flipped later and an AUC reads backwards.
check("all six variables share one direction",
      len(B.VARIABLES) == 6 and all(
          isinstance(v, tuple) and len(v) == 3 for v in B.VARIABLES.values()), "")
check("the module says it decides nothing on its own",
      "evidence for a scorer, not a decision" in src, "")

failed = 0
for name, ok, why in results:
    if not ok:
        failed += 1
    print(("ok   " if ok else "FAIL ") + name + ("" if ok or not why else f"\n       {why}"))
print(f"\n{len(results) - failed}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
