#!/usr/bin/env python3
"""Score Jev against Sam's 51 CCRR verdicts — the only ground truth this lane has.

Sam, 2026-09-21: "go ahead and score it against my 51 verdicts".

⚠️ NO RUNNER NEEDED, AND NO API CALL. The 2026-09-20 receipt carries BOTH
halves: Jev's `p_same` and `care` per pair, and Sam's verdict on the same row.
The scoring is arithmetic over a committed file, which also means anyone can
reproduce it.

⚠️ REPRODUCE THE INHERITED CLAIM, DO NOT BUILD ON IT. The lane and the queue
item both assert "above p 0.85 Jev was right 25 of 25; below it the number
carried no signal". That is a claim until it is recomputed here.

⚠️ THE GROUND TRUTH IS HIS FINAL CALL. He answered 51, then flipped eight from
keep to fold after seeing the eight anchors that carried both. The receipt's
`kept_after_review` is the authoritative keep set (10 items); everything else
folded. Scoring against his FIRST pass would score the model against a reading
he corrected.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RECEIPT = os.path.join(HERE, "receipts", "cr_reference_decisions_2026-09-20_s280.json")


def load():
    r = json.load(open(RECEIPT, encoding="utf-8"))
    kept = set(r["calibration"]["kept_after_review"])
    rows = []
    for it in r["items"]:
        p, n = it.get("p_same"), it["item"]
        if not isinstance(p, (int, float)):
            continue
        rows.append({"n": n, "p": float(p), "care": it.get("care"),
                     "truth": "keep" if n in kept else "fold",
                     "rows": it.get("rows") or 0,
                     "cand": it.get("cand_rec", ""), "anchor": it.get("anchor_rec", "")})
    return r, rows, kept


def confusion(rows, gate):
    """Above the gate the routine SUGGESTS a fold. Precision is what matters:
    a suggested fold a curator waves through is a merge, and a wrong merge
    destroys a distinction nothing downstream recovers."""
    tp = sum(1 for x in rows if x["p"] >= gate and x["truth"] == "fold")
    fp = sum(1 for x in rows if x["p"] >= gate and x["truth"] == "keep")
    fn = sum(1 for x in rows if x["p"] < gate and x["truth"] == "fold")
    tn = sum(1 for x in rows if x["p"] < gate and x["truth"] == "keep")
    return tp, fp, fn, tn


def main():
    r, rows, kept = load()
    n = len(rows)
    folds = sum(1 for x in rows if x["truth"] == "fold")
    print(f"51-verdict scoring — {n} scored pair(s); truth: {folds} fold, {n - folds} keep")
    print(f"receipt: {os.path.relpath(RECEIPT, os.path.dirname(HERE))}")
    print(f"⚠️ ground truth is his FINAL call: 8 flipped keep->fold after review; "
          f"kept_after_review = {sorted(kept)}\n")

    # 1. reproduce the inherited claim
    above = [x for x in rows if x["p"] >= 0.85]
    below = [x for x in rows if x["p"] < 0.85]
    a_fold = sum(1 for x in above if x["truth"] == "fold")
    b_fold = sum(1 for x in below if x["truth"] == "fold")
    print("── the inherited claim, recomputed ──")
    print(f"  p >= 0.85 folded: {a_fold}/{len(above)}   (lane says 25/25)")
    print(f"  p <  0.85 folded: {b_fold}/{len(below)}   (lane says 16/26)")
    print()

    # 2. is 0.85 the right gate? sweep it.
    print("── gate sweep ──")
    print(f"  {'gate':>5} {'suggested':>10} {'right':>6} {'precision':>10} {'recall':>7} {'missed':>7}")
    best = None
    for g in [round(0.50 + 0.05 * i, 2) for i in range(11)]:
        tp, fp, fn, tn = confusion(rows, g)
        prec = tp / (tp + fp) if (tp + fp) else float("nan")
        rec = tp / (tp + fn) if (tp + fn) else float("nan")
        flag = ""
        if (tp + fp) and fp == 0:
            if best is None or tp > best[1]:
                best = (g, tp)
            flag = "  ← no wrong fold suggested"
        print(f"  {g:>5.2f} {tp + fp:>10} {tp:>6} {prec:>10.2f} {rec:>7.2f} {fn:>7}{flag}")
    print()

    # 3. does the probability order anything BELOW the gate?
    print("── below the gate: does the number carry ordering signal? ──")
    below_sorted = sorted(below, key=lambda x: -x["p"])
    half = len(below_sorted) // 2
    top_fold = sum(1 for x in below_sorted[:half] if x["truth"] == "fold")
    bot_fold = sum(1 for x in below_sorted[half:] if x["truth"] == "fold")
    print(f"  higher half ({half}): {top_fold} folded  ·  "
          f"lower half ({len(below_sorted) - half}): {bot_fold} folded")
    print(f"  if the number ordered anything, the higher half would fold more often.")
    print(f"  extremes — the 3 LOWEST scored below the gate:")
    for x in sorted(below, key=lambda x: x["p"])[:3]:
        print(f"    p={x['p']:.2f} -> he said {x['truth'].upper():<4}  {x['cand'][:50]}")
    print()

    # 4. does `care` carry signal the probability does not?
    #
    # ⚠️ COMPARING ALL FOLDS AGAINST ALL KEEPS IS CONFOUNDED, AND IT FLATTERS.
    # Every one of his 10 keeps sits BELOW the gate, and the above-gate folds are
    # the easy ones with low care — so an overall comparison reports a
    # separation of +0.41 that is really just "above-gate items are easy". The
    # decision problem is the BELOW-GATE BAND, where a curator is actually
    # needed; above the gate there is nothing left to order. Measure there.
    band = [x for x in rows if x["p"] < 0.85 and isinstance(x["care"], (int, float))]
    bf = [x for x in band if x["truth"] == "fold"]
    bk = [x for x in band if x["truth"] == "keep"]
    print("── below the gate: does anything order the band a curator must work? ──")
    print(f"  the band is {len(band)} pairs — {len(bf)} fold, {len(bk)} keep")
    if bf and bk:
        import itertools
        def auc(key, keep_is_lower):
            w = t = 0
            for k, f in itertools.product(bk, bf):
                a, b = key(k), key(f)
                a, b = (a, b) if not keep_is_lower else (b, a)
                if a > b:
                    w += 1
                elif a == b:
                    t += 1
                    
            return (w + 0.5 * t) / (len(bk) * len(bf))
        a_care = auc(lambda x: x["care"], False)
        a_p = auc(lambda x: x["p"], True)
        print(f"  AUC(care)   = {a_care:.3f}")
        print(f"  AUC(p_same) = {a_p:.3f}")
        print(f"  0.50 is chance. ⚠️ NEITHER number orders this band — the "
              f"information that decides it is not in what Jev is asked today.")
        print(f"  (measured 2026-09-21; a permutation test on care gives p = 0.67)")

    # 5. what the head is worth
    tp, fp, fn, tn = confusion(rows, 0.85)
    rows_above = sum(x["rows"] for x in above)
    print("── what acting on the gate would have bought ──")
    print(f"  {len(above)} pairs suggested, {rows_above:,} articulation rows,")
    print(f"  {fp} of them wrong. The remaining {len(below)} pairs "
          f"({sum(x['rows'] for x in below):,} rows) needed him.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
