#!/usr/bin/env python3
"""ESL packaging proposal → a payload the CCR Atlas can draw.

READ-ONLY. Writes one file under prototype/. Nothing reaches kb_curation.

Joins the 2026-07-15 classification to today's curation reality (via
kb/_esl_package_actionable.py's receipt) so the picture shows what an apply
would ACTUALLY do — not what the stale plan claims. Carries per-identity
confidence and signal, because the 983 medium-confidence rows are the thing
Sam has to spot-check and a preview that hides them is worse than no preview.

  python3 kb/_esl_package_actionable.py          # produces the receipt
  python3 kb/_build_esl_fold_preview.py          # then this
"""
import argparse, json, os
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLD = ("Beginning ESL", "Intermediate ESL", "Advanced ESL")


def load_js(fname):
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window."); i = src.index("=", i) + 1
    return json.loads(src[i:].strip().rstrip(";"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", default="kb/esl_package_out/2026-07-15/esl_package_plan.json")
    ap.add_argument("--actionable", default="kb/esl_package_out/2026-08-24/esl_actionable.json")
    ap.add_argument("--out", default="prototype/ccr_atlas_esl.json")
    ap.add_argument("--sample", type=int, default=90,
                    help="member rows carried per bucket for the review list")
    args = ap.parse_args()

    plan = json.load(open(os.path.join(ROOT, args.plan), encoding="utf-8"))
    P = {r["id"]: r for r in plan["identities"]}
    act = json.load(open(os.path.join(ROOT, args.actionable), encoding="utf-8"))
    actionable = set(act["actionable"])
    # ⚠️ The receipt's skipped-lists are scoped to the FOLD buckets, so a
    # carve-out id appears in none of them. Reading them for carve-outs reports
    # "22 of 22 still standing" when the true answer is 8 — a clean bill of
    # health produced by asking a question the data cannot answer. Derive both
    # sets from the authoritative sources instead.
    curation = json.load(open(os.path.join(ROOT, "kb/coci_curation.json"),
                              encoding="utf-8"))["curations"]
    curated = {k for k, v in curation.items()
               if isinstance(v, dict) and v.get("merge_into")}
    human = {k for k in curated
             if "@bot" not in ((curation[k] or {}).get("reviewed_by", "") or "").lower()}

    # how many local college courses ride on each identity — the real weight
    mem = load_js("unified_courses_members.js")["members"]
    idx = {r[0]: r for r in load_js("unified_courses_index.js")}
    sa = {r["id"]: r for r in load_js("unified_courses_standalone.js")["rows"]}
    live_rows = set(idx) | set(sa)
    gone = {i for i in P if i not in live_rows and i not in curated}

    def weight(i):
        return len(mem.get(i) or []) or 1

    def title(i):
        if i in idx: return idx[i][1]
        if i in sa:  return sa[i].get("title", "")
        return (P.get(i) or {}).get("title", "")

    buckets = {}
    for b in FOLD + ("ESL Citizenship", "Vocational ESL (VESL)", "Transfer-level ESL (review)"):
        ids = [i for i, r in P.items() if r.get("bucket") == b]
        is_carve = b not in FOLD
        # A carve-out is not a fold candidate, so `actionable` (which covers only
        # the three comprehensives) says nothing about it. What matters for a
        # carve-out is how many still STAND as their own identity — which is the
        # question the transfer-level bucket answered badly.
        live = ([i for i in ids if i not in curated and i not in gone] if is_carve
                else [i for i in ids if i in actionable])
        # review list: medium/review confidence first — that is the spot-check
        ranked = sorted(live, key=lambda i: (P[i]["confidence"] == "high",
                                             -weight(i), P[i]["title"]))
        buckets[b] = {
            "planned": len(ids),
            "would_fold": 0 if is_carve else len(live),
            "still_standing": len(live) if is_carve else None,
            "already_curated": len([i for i in ids if i in curated]),
            "curated_by_a_human": len([i for i in ids if i in human]),
            "no_longer_a_row": len([i for i in ids if i in gone]),
            "local_courses": sum(weight(i) for i in live),
            "confidence": dict(Counter(P[i]["confidence"] for i in live)),
            "signal": dict(Counter(P[i]["signal"] for i in live)),
            "is_carveout": is_carve,
            "sample": [{
                "id": i, "t": title(i) or P[i]["title"],
                "n": weight(i),
                "conf": P[i]["confidence"], "sig": P[i]["signal"],
                "u": P[i].get("units"), "cs": P[i].get("credit_status"),
            } for i in ranked[: args.sample]],
        }

    out = {
        "_about": "ESL packaging PROPOSAL — read-only preview. Nothing written to "
                  "kb_curation. Joins the 2026-07-15 classification to today's "
                  "curation state so the figures are what an apply would really do.",
        "_plan": args.plan,
        "_plan_generated": plan.get("_generated_at"),
        "_curation_synced": act.get("_curation_synced"),
        "_blocked_on": [
            "the three comprehensive identities do not exist yet — they need names",
            f"{act['confidence_of_what_would_write'].get('medium', 0)} of "
            f"{act['counts']['would_write_today']} rows are medium confidence and "
            "the plan asks for a spot-check of exactly those",
        ],
        "totals": act["counts"],
        "buckets": buckets,
    }
    path = os.path.join(ROOT, args.out)
    json.dump(out, open(path, "w", encoding="utf-8"), separators=(",", ":"))
    kb = os.path.getsize(path) / 1024
    print(f"wrote {args.out}  ({kb:.0f} KB)")
    for b, v in buckets.items():
        if v["is_carveout"]:
            print(f"  {b:30s} carve-out      stands {v['still_standing']:4d} of "
                  f"{v['planned']:4d}  (curated away {v['already_curated']}, "
                  f"vanished {v['no_longer_a_row']})")
        else:
            print(f"  {b:30s} COMPREHENSIVE  folds {v['would_fold']:5d}  "
                  f"({v['local_courses']:5d} local courses)  conf={v['confidence']}")


if __name__ == "__main__":
    main()
