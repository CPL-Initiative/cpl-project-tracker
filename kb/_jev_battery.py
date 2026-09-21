#!/usr/bin/env python3
"""The variable battery — ask Jev DIFFERENT questions about the band it cannot order.

Sam, 2026-09-21: "go ahead and build the battery".

WHY A BATTERY, AND WHY THESE VARIABLES
--------------------------------------
`kb/_jev_score.py` measured the 2026-09-20 run against Sam's 51 verdicts:

  · p >= 0.85 folded 25/25 — the gate is real and precision there is 1.00.
  · BELOW the gate, 26 pairs and 838 rows, NOTHING Jev is asked today orders
    the band: AUC(p_same) 0.441, AUC(care) 0.450, against 0.50 for chance.

So asking the same two questions harder cannot help. The band has to be asked
about the things that actually distinguish a fold from a keep, and Sam already
named them when he ruled on over-merging (2026-09-20): *"level, scope, units,
lab against lecture, vendor-specific, a different course"*. Each is a REASON TO
HOLD SEPARATE, so each is phrased that way and a HIGH answer predicts KEEP.

All six ride one call — Jev answers a question set at once, which is what makes
a battery cheap where a Workflow of adjudicators would not be.

⚠️ THE EVALUATION SET IS 26 PAIRS: 16 fold, 10 keep. THAT IS SMALL.
An AUC over 160 comparisons with 10 positives has wide error bars, and six
variables tested at once will hand you roughly one spurious winner at p<0.05 by
construction. So the rule for keeping a variable is FIXED HERE, BEFORE ANY
ANSWER EXISTS (see SELECTION), and a variable that passes on this set is a
HYPOTHESIS to re-test on the next batch, never a finding.

Run it on a runner — typesafe.ai is egress-blocked from the agent sandbox:
    python3 kb/_jev_battery.py --ask            # spends 26 calls, writes profiles
    python3 kb/_jev_battery.py --score <file>   # offline, no key, no network
"""

import argparse
import itertools
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

HERE = os.path.dirname(os.path.abspath(__file__))
RECEIPT = os.path.join(HERE, "receipts", "cr_reference_decisions_2026-09-20_s280.json")
OUT = os.path.join(HERE, "jev_out")
GATE = 0.85

# ── the battery ─────────────────────────────────────────────────────────────
# Sam's own vocabulary. Each is a REASON TO HOLD SEPARATE, so a high answer
# predicts KEEP and AUC is read in that direction for every one of them —
# no per-variable sign convention to get backwards later.
VARIABLES = {
    "level": ("Do these two recommendations sit at different levels — one "
              "introductory and one advanced, or a first and a second course in "
              "a sequence?",
              "Different levels.", "Same level."),
    "scope": ("Does one of these cover materially more or less content than the "
              "other, rather than the same content under different words?",
              "One covers more.", "The same ground."),
    "units": ("Is the difference in hours a real difference in student workload, "
              "rather than local convention about how the same course is counted?",
              "A real workload difference.", "Local convention only."),
    "lab": ("Does one include a laboratory, clinical or practicum component that "
            "the other does not?",
            "One has a lab or practicum the other lacks.", "Neither does, or both do."),
    "vendor": ("Is one of these tied to a specific vendor, product or proprietary "
               "curriculum where the other is generic?",
               "One is vendor-specific.", "Both are generic."),
    "different_course": ("Would a college catalog list these as two different "
                         "courses rather than one course described two ways?",
                         "Two different courses.", "One course, two descriptions."),
}

# ── SELECTION, PRE-REGISTERED ───────────────────────────────────────────────
# ⚠️ FIXED BEFORE ANY ANSWER EXISTS. Written down here so the threshold cannot
# drift toward whatever the results happen to show — which is the failure mode
# of picking winners from a 26-row set.
MIN_AUC = 0.65          # below this, not worth a call even if p is small
ALPHA = 0.05            # on the permutation test
CORRECTION = "holm"     # among the six; an uncorrected sweep buys ~1 false winner
PERMUTATIONS = 20000
SEED = 7                # fixed, so the p-values are reproducible

# ⚠️ ONE PRIMARY ENDPOINT, SIX DIAGNOSTICS. Six independent tests all carry the
# correction penalty, and the question being asked is not really six questions:
# "should these stay separate?" is "is ANY of these reasons present?". So the
# PRIMARY test is `any_reason`, the max across the battery — one comparison, no
# correction — and the six singletons are secondary, Holm-corrected among
# themselves, to say WHICH reason is doing the work.
PRIMARY = "any_reason"

# ⚠️ WHAT THIS DESIGN CAN AND CANNOT SEE — measured 2026-09-21, before any call
# was spent. At 16 fold against 10 keep:
#     primary (1 test, uncorrected):  detects AUC >= ~0.75
#     secondary (6 tests, Holm):      detects AUC >= ~0.80
# A real but moderate variable at AUC 0.70 is INVISIBLE here. So a null result
# means "no large effect in 26 pairs", never "no signal" — and a variable that
# does pass is carrying a big effect, which is why one batch cannot confirm it.
DETECTABLE_PRIMARY = 0.75
DETECTABLE_SECONDARY = 0.80


def band():
    """The 26 pairs below the gate, with Sam's final verdict on each.

    ⚠️ His FINAL call: he answered 51, then flipped eight from keep to fold
    after review. `kept_after_review` is the authoritative keep set."""
    r = json.load(open(RECEIPT, encoding="utf-8"))
    kept = set(r["calibration"]["kept_after_review"])
    rows = []
    for it in r["items"]:
        p = it.get("p_same")
        if not isinstance(p, (int, float)) or p >= GATE:
            continue
        rows.append({
            "item": it["item"], "p_same": p, "care": it.get("care"),
            "truth": "keep" if it["item"] in kept else "fold",
            "anchor_key": it.get("anchor_key"), "cand_key": it.get("cand_key"),
            "anchor_rec": it.get("anchor_rec", ""), "cand_rec": it.get("cand_rec", ""),
            "canonical": it.get("canonical", ""), "rows": it.get("rows") or 0,
        })
    return rows


def ask_one(pair, key):
    """All six variables in ONE call. State stays tight — TypeSafe's guidance is
    that irrelevant detail costs accuracy, and the 2026-09-20 run held to three
    keys.

    ⚠️ A NOUL ANSWER IS A PROBABILITY, NOT A BOOLEAN (the named note on the
    trial: an earlier cut tested `is True`, which a float never satisfies, and
    would have reported zero of everything while looking like a clean result)."""
    from _typesafe_smoke import noul, system_one
    state = {
        "published_recommendation": pair["anchor_rec"],
        "candidate_recommendation": pair["cand_rec"],
        "shared_course": pair["canonical"],
    }
    questions = {
        name: noul(q, {"true": t, "false": f}) for name, (q, t, f) in VARIABLES.items()
    }
    answers = (system_one(state, questions, key).get("answers") or {})
    return {name: (answers.get(name) or {}).get("noul") for name in VARIABLES}


def auc(keeps, folds, key):
    """P(a keep scores higher than a fold) on one variable. 0.50 is chance.

    Every variable is phrased as a REASON TO HOLD SEPARATE, so a keep SHOULD
    score higher — one direction for all six, and no sign to get backwards."""
    w = t = 0
    for k, f in itertools.product(keeps, folds):
        a, b = key(k), key(f)
        if a is None or b is None:
            return None
        if a > b:
            w += 1
        elif a == b:
            t += 1
    return (w + 0.5 * t) / (len(keeps) * len(folds))


def permutation_p(keeps, folds, key, observed):
    """How often chance alone reaches this AUC. Exact enough at n=26, and the
    seed is fixed so the number is reproducible rather than re-rolled."""
    vals = [key(x) for x in keeps] + [key(x) for x in folds]
    if any(v is None for v in vals):
        return None
    nk = len(keeps)
    rng = random.Random(SEED)
    hits = 0
    for _ in range(PERMUTATIONS):
        rng.shuffle(vals)
        kk, ff = vals[:nk], vals[nk:]
        w = t = 0
        for a, b in itertools.product(kk, ff):
            if a > b:
                w += 1
            elif a == b:
                t += 1
        if (w + 0.5 * t) / (nk * len(ff)) >= observed:
            hits += 1
    # (hits+1)/(N+1), not hits/N: the observed arrangement is itself one of the
    # permutations, and a p of exactly 0 is never a thing a finite test earns.
    return (hits + 1) / (PERMUTATIONS + 1)


def holm(pvals):
    """Holm-Bonferroni. Six variables tested at once will hand you about one
    winner at p<0.05 by construction; correcting is the difference between a
    result and a coincidence."""
    order = sorted(pvals, key=lambda k: pvals[k] if pvals[k] is not None else 2)
    m = len([k for k in order if pvals[k] is not None])
    out, running = {}, 0.0
    for i, k in enumerate(order):
        if pvals[k] is None:
            out[k] = None
            continue
        adj = min(1.0, (m - i) * pvals[k])
        running = max(running, adj)      # Holm is monotone
        out[k] = running
    return out


def score(profiles):
    """Score a returned profile set against the band. Offline, no key."""
    rows = {x["item"]: x for x in band()}
    merged = []
    for p in profiles:
        row = rows.get(p["item"])
        if row:
            merged.append({**row, **{k: p.get(k) for k in VARIABLES}})
    keeps = [x for x in merged if x["truth"] == "keep"]
    folds = [x for x in merged if x["truth"] == "fold"]
    print(f"band: {len(merged)} pair(s) with a profile — {len(folds)} fold, {len(keeps)} keep")
    if not keeps or not folds:
        print("  nothing to score against")
        return {}

    # The primary endpoint: any reason at all to hold separate.
    def any_reason(x):
        vals = [x.get(n) for n in VARIABLES if isinstance(x.get(n), (int, float))]
        return max(vals) if vals else None
    a_pri = auc(keeps, folds, any_reason)
    p_pri = permutation_p(keeps, folds, any_reason, a_pri) if a_pri is not None else None
    print(f"\n  PRIMARY — {PRIMARY} (max across the battery)")
    primary_passes = False
    if a_pri is None:
        print("    unanswered")
    if a_pri is not None:
        primary_passes = a_pri >= MIN_AUC and p_pri is not None and p_pri <= ALPHA
        print(f"    AUC {a_pri:.3f}   p {p_pri:.4f}   "
              f"{'PASSES' if primary_passes else 'does not pass'} "
              f"(uncorrected; it is the one primary)")
        if not primary_passes:
            print("    → no secondary can be kept: if no reason at all separates the "
                  "band, one reason passing is chance.")

    aucs, ps = {}, {}
    for name in VARIABLES:
        a = auc(keeps, folds, lambda x, n=name: x.get(n))
        aucs[name] = a
        ps[name] = permutation_p(keeps, folds, lambda x, n=name: x.get(n), a) if a is not None else None
    adj = holm(ps)
    print("\n  SECONDARY — which reason is doing the work (Holm-corrected among the six)")

    print(f"\n  {'variable':<18} {'AUC':>6} {'p':>7} {'p(holm)':>9}  verdict")
    kept = []
    for name in sorted(VARIABLES, key=lambda n: -(aucs[n] or 0)):
        a, p, q = aucs[name], ps[name], adj[name]
        if a is None:
            print(f"  {name:<18} {'--':>6} {'--':>7} {'--':>9}  unanswered")
            continue
        # ⚠️ THE PRIMARY GATES THE SECONDARIES. If no reason at all separates the
        # band, one reason "passing" is overwhelmingly chance — six tests over
        # 26 rows will hand you a winner about one run in twenty on pure noise
        # (measured: 2 of 25 random runs before this gate existed). Requiring
        # the primary first is both the semantically right order — "is there any
        # reason?" precedes "which reason?" — and what holds the family-wise
        # error down to something a small set can honestly support.
        passes = (primary_passes and a >= MIN_AUC
                  and q is not None and q <= ALPHA)
        if passes:
            kept.append(name)
        verdict = "KEEP — re-test on the next batch" if passes else "discard"
        print(f"  {name:<18} {a:>6.3f} {p:>7.3f} {q:>9.3f}  {verdict}")

    print(f"\n  pre-registered: AUC >= {MIN_AUC}, {CORRECTION}-corrected p <= {ALPHA}, "
          f"{PERMUTATIONS:,} permutations, seed {SEED}")
    print(f"  baseline to beat (measured 2026-09-21): p_same 0.441, care 0.450")
    print(f"  ⚠️ POWER: this set detects AUC >= ~{DETECTABLE_PRIMARY} on the primary and "
          f">= ~{DETECTABLE_SECONDARY} on a secondary. A null here means NO LARGE EFFECT "
          f"in 26 pairs — it is not evidence that a moderate one is absent.")
    if not kept:
        print("  ⚠️ NOTHING PASSED. That is a result: the band's distinction is not in "
              "these six questions either, and the next move is a different kind of "
              "evidence (member course titles, units spread, TOP/CIP corroboration), "
              "never a seventh rephrasing.")
    else:
        print(f"  ⚠️ {len(kept)} passed on 26 pairs with 10 keeps. A HYPOTHESIS, not a "
              f"finding — it earns its place by holding on a batch it did not pick: "
              f"{', '.join(kept)}")
    return {"aucs": aucs, "p": ps, "p_holm": adj, "kept": kept}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--ask", action="store_true", help="spend the calls (needs a runner)")
    ap.add_argument("--score", metavar="PROFILES.json", help="score a profile set, offline")
    ap.add_argument("--dry-run", action="store_true", help="show the band and the questions")
    a = ap.parse_args()

    if a.dry_run:
        rows = band()
        print(f"band: {len(rows)} pairs — {sum(1 for x in rows if x['truth']=='fold')} fold, "
              f"{sum(1 for x in rows if x['truth']=='keep')} keep")
        print(f"{len(VARIABLES)} variables, one call each:")
        for n, (q, _t, _f) in VARIABLES.items():
            print(f"  {n:<18} {q[:74]}")
        print(f"\ncost: {len(rows)} calls")
        return 0

    if a.score:
        payload = json.load(open(a.score, encoding="utf-8"))
        score(payload["profiles"] if isinstance(payload, dict) else payload)
        return 0

    if not a.ask:
        ap.print_help()
        return 0

    key = (os.environ.get("TYPESAFE_API_KEY") or "").strip()
    if not key:
        print("❌ TYPESAFE_API_KEY is not set. typesafe.ai is egress-blocked from the "
              "agent sandbox — dispatch .github/workflows/typesafe-smoke.yml instead.")
        return 2
    rows = band()
    profiles = []
    for i, pair in enumerate(rows, 1):
        try:
            prof = ask_one(pair, key)
        except SystemExit as e:
            print(f"  stopped at {i}: {e}")
            break
        profiles.append({"item": pair["item"], **prof})
        shown = " ".join(f"{n}={prof[n]:.2f}" if isinstance(prof[n], (int, float)) else f"{n}=--"
                         for n in VARIABLES)
        print(f"  {pair['item']:>3}  {shown}  {pair['cand_rec'][:40]}")
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "battery.json")
    json.dump({"_doc": "Jev variable battery over the below-gate band. SUGGESTS nothing "
                       "on its own — this is evidence for a scorer, not a decision.",
               "_variables": {n: q for n, (q, _, _) in VARIABLES.items()},
               "profiles": profiles}, open(path, "w", encoding="utf-8"), indent=1)
    print(f"\nWrote {path}")
    score(profiles)
    return 0


if __name__ == "__main__":
    sys.exit(main())
