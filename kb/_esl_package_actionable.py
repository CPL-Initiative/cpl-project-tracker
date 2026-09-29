#!/usr/bin/env python3
"""ESL packaging plan → what an apply would ACTUALLY write, today.

READ-ONLY. Writes only a receipt under kb/esl_package_out/<date>/.

WHY THIS EXISTS
---------------
`_esl_package_dryrun.py` classifies the ESL identity space out of
`coci_minted_courses.json` + `coci_minted_singletons.json`. Those files are the
AI-drafted BASELINE and are deliberately static (`_generated_at 2026-05-22`);
curation is an OVERLAY applied on top of them at export time, which is what
makes curation regen-safe. Re-running the dry-run therefore cannot produce
fresher numbers — it reproduces itself byte for byte.

So the plan describes the PRE-CURATION world. Between it and reality sit 28,797
committed curation decisions. This script closes that gap: it subtracts the rows
that curation has already spoken for and the rows that no longer exist, and
reports the set an apply would genuinely insert.

Run:  python3 kb/_esl_package_actionable.py [--plan <path>] [--date <YYYY-MM-DD>]
"""
import argparse, json, os, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLD_BUCKETS = {"Beginning ESL", "Intermediate ESL", "Advanced ESL"}


def load_js(fname):
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window."); i = src.index("=", i) + 1
    return json.loads(src[i:].strip().rstrip(";"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", default="kb/esl_package_out/2026-07-15/esl_package_plan.json")
    ap.add_argument("--date", default=None, help="receipt directory (default: today)")
    args = ap.parse_args()

    plan = json.load(open(os.path.join(ROOT, args.plan), encoding="utf-8"))
    P = {r["id"]: r for r in plan["identities"]}

    cur = json.load(open(os.path.join(ROOT, "kb/coci_curation.json"), encoding="utf-8"))
    curations = cur["curations"]
    merged = {k for k, v in curations.items() if isinstance(v, dict) and v.get("merge_into")}
    by_reviewer = {k: (v or {}).get("reviewed_by", "") for k, v in curations.items()}

    # every identity the published artifacts still carry as its own row
    live = {r[0] for r in load_js("unified_courses_index.js")}
    live |= {r["id"] for r in load_js("unified_courses_standalone.js")["rows"]}

    folders = [i for i, r in P.items() if r.get("bucket") in FOLD_BUCKETS]
    carve = [i for i, r in P.items() if r.get("bucket") not in FOLD_BUCKETS]

    skip_curated = [i for i in folders if i in merged]
    skip_gone = [i for i in folders if i not in merged and i not in live]
    actionable = [i for i in folders if i not in merged and i in live]

    # a curator's own row is the one an apply must never fight (Rule 10)
    human = [i for i in skip_curated
             if "@bot" not in (by_reviewer.get(i) or "").lower()]

    date = args.date or __import__("datetime").date.today().isoformat()
    outdir = os.path.join(ROOT, "kb", "esl_package_out", date)
    os.makedirs(outdir, exist_ok=True)

    receipt = {
        "_status": "READ-ONLY — the actionable subset of the plan. Nothing written "
                   "to kb_curation or the identity files.",
        "_plan": args.plan,
        "_plan_generated": plan.get("_generated_at"),
        "_curation_synced": cur.get("_synced_at"),
        "_baseline_note": "the dry-run's inputs are the static AI-drafted baseline; "
                          "curation is an overlay, so the plan counts pre-curation rows",
        "counts": {
            "plan_identities": len(P),
            "plan_folds_claimed": len(folders),
            "would_write_today": len(actionable),
            "skipped_already_curated": len(skip_curated),
            "skipped_curated_by_a_human": len(human),
            "skipped_no_longer_a_row": len(skip_gone),
            "carve_outs": len(carve),
        },
        "confidence_of_what_would_write": dict(Counter(P[i]["confidence"] for i in actionable)),
        "signal_of_what_would_write": dict(Counter(P[i]["signal"] for i in actionable)),
        "bucket_of_what_would_write": dict(Counter(P[i]["bucket"] for i in actionable)),
        "skipped_curated_by_a_human_ids": sorted(human),
        "actionable": sorted(actionable),
        "skipped_already_curated_ids": sorted(skip_curated),
        "skipped_no_longer_a_row_ids": sorted(skip_gone),
    }
    path = os.path.join(outdir, "esl_actionable.json")
    json.dump(receipt, open(path, "w", encoding="utf-8"), indent=1)

    c = receipt["counts"]
    print(f"plan generated {plan.get('_generated_at')}  ·  curation synced {cur.get('_synced_at')}")
    print(f"\n  plan claims folds ............. {c['plan_folds_claimed']:>6,}")
    print(f"  WOULD WRITE TODAY ............. {c['would_write_today']:>6,}")
    print(f"    skipped, already curated .... {c['skipped_already_curated']:>6,}")
    print(f"      ...by a HUMAN curator ..... {c['skipped_curated_by_a_human']:>6,}")
    print(f"    skipped, no longer a row .... {c['skipped_no_longer_a_row']:>6,}")
    print(f"  carve-outs (not folded) ....... {c['carve_outs']:>6,}")
    print(f"\n  confidence: {receipt['confidence_of_what_would_write']}")
    print(f"  buckets:    {receipt['bucket_of_what_would_write']}")
    print(f"\nwritten: {os.path.relpath(path, ROOT)}")
    if c["skipped_curated_by_a_human"]:
        print(f"\n  NOTE {c['skipped_curated_by_a_human']} identities carry a HUMAN curator's "
              f"decision and are protected by ON CONFLICT DO NOTHING (Rule 10).")


if __name__ == "__main__":
    main()
