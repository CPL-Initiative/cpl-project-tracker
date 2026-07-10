#!/usr/bin/env python3
"""TRAIL CREW 🥾 — assembly (deterministic post-pass after the magic half).

Consumes the adjudication verdicts (the Workflow output saved as JSON) and the
method findings, and produces the receipted, FIRE-ABLE outputs — nothing here
writes to Supabase; firing stays a deliberate curator-authorized step:

  adjudicated.json   every finding + its verdict + any adversarial-verify result
  trail_report.md    the human report, by rule, with the counts + judgment queue
  staged_fixes.json  the fire-able plan, classified:
     clean_renames      confirmed renames whose target collides with NOTHING —
                        fire as INSERT-only unified_title_override rows
     merge_candidates   confirmed merges that SURVIVED adversarial verify —
                        fire as rename + the PR-5b merge-confirm pair (per-row)
     issuer_canon       confirmed issuer consolidations — these UPDATE existing
                        (often curator-authored) issuing_agency_override rows,
                        so they fire ONLY with explicit per-cluster approval
     judgment_queue     investigate/uncertain verdicts — Sam's eyes
     rejected           findings the magic half rejected (with reasons)

Usage: python3 kb/_trail_crew_assemble.py --verdicts <workflow_out.json>
         [--out kb/trail_crew_out/<date>]
"""
import argparse
import json
import os
import re
from collections import defaultdict
from datetime import date


def load_bake(path="credential_reference_data.js"):
    src = open(path, encoding="utf-8").read()
    return json.loads(src[src.find("{"):src.rstrip().rstrip(";").rfind("}") + 1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verdicts", required=True)
    ap.add_argument("--findings", default=None)
    ap.add_argument("--out", default="kb/trail_crew_out/" + date.today().isoformat())
    args = ap.parse_args()
    out_dir = args.out
    findings_path = args.findings or os.path.join(out_dir, "findings.json")

    fdoc = json.load(open(findings_path))
    fmap = {f["id"]: f for f in fdoc["findings"]}
    batches = json.load(open(args.verdicts))

    bake = load_bake()
    keys = {r["ut"] for r in bake["unified_titles"]}
    display = {}
    for r in bake["unified_titles"]:
        display[r["ut"]] = r["ut"]

    adjudicated = []
    verify_by_id = {}
    for b in batches:
        for v in b.get("verify") or []:
            verify_by_id[v["id"]] = v
        for v in b.get("verdicts") or []:
            f = fmap.get(v["id"])
            if not f:
                continue
            adjudicated.append({**f, "verdict": v["verdict"], "action": v["action"],
                                "proposed": v.get("proposed"), "reason": v["reason"],
                                "confidence": v.get("confidence"),
                                "adversarial": verify_by_id.get(v["id"])})

    staged = {"clean_renames": [], "merge_candidates": [], "issuer_canon": [],
              "judgment_queue": [], "rejected": []}
    proposed_targets = defaultdict(list)
    for a in adjudicated:
        if a["verdict"] == "reject" or a["action"] == "keep":
            staged["rejected"].append(a)
            continue
        if a["action"] == "investigate" or (a.get("confidence") or 0) < 0.6:
            staged["judgment_queue"].append(a)
            continue
        if a["action"] == "merge":
            adv = a.get("adversarial")
            if adv and adv.get("refuted"):
                a["reason"] += " [adversarial verifier REFUTED: " + adv.get("reason", "") + "]"
                staged["judgment_queue"].append(a)
            else:
                staged["merge_candidates"].append(a)
            continue
        if a["rule"] in ("issuer_variant_cluster", "issuer_family_mixed"):
            staged["issuer_canon"].append(a)
            continue
        if a["action"] in ("rename", "fix") and a.get("proposed"):
            proposed_targets[a["proposed"]].append(a)

    # collision classification for renames/fixes
    for target, group in proposed_targets.items():
        collides_existing = target in keys
        for a in group:
            if a["key"] == target:
                staged["rejected"].append({**a, "reason": a["reason"] + " [no-op: already the key]"})
            elif collides_existing or len(group) > 1:
                a["collision"] = ("existing key" if collides_existing else "") + \
                    (" + batch twin" if len(group) > 1 else "")
                staged["merge_candidates"].append(a)
            else:
                staged["clean_renames"].append(a)

    meta = {
        "_generated_at": date.today().isoformat(),
        "_generated_by": "kb/_trail_crew_assemble.py",
        "counts": {k: len(v) for k, v in staged.items()},
        "adjudicated": len(adjudicated),
    }
    json.dump({"_meta": meta, "adjudicated": adjudicated},
              open(os.path.join(out_dir, "adjudicated.json"), "w"), indent=1, ensure_ascii=False)
    json.dump({"_meta": meta, **staged},
              open(os.path.join(out_dir, "staged_fixes.json"), "w"), indent=1, ensure_ascii=False)

    lines = ["# Trail Crew 🥾 — run report (" + meta["_generated_at"] + ")", "",
             "The crew walked " + str(fdoc["_meta"]["rows_scanned"])
             + " canonical credentials (bake " + str(fdoc["_meta"].get("_bake"))
             + " ⊕ live overlay). Method findings: " + str(len(fmap))
             + " · adjudicated: " + str(len(adjudicated)) + ".", ""]
    for k, label in [("clean_renames", "Clean renames (fire-ready)"),
                     ("merge_candidates", "Merge candidates (fire via the ⇒ Merge-confirm lane)"),
                     ("issuer_canon", "Issuer canon consolidations (per-cluster approval)"),
                     ("judgment_queue", "Judgment queue (Sam's eyes)"),
                     ("rejected", "Rejected / keep-as-is")]:
        lines.append("## " + label + " — " + str(len(staged[k])))
        for a in staged[k][:60]:
            t = a.get("title") or a.get("evidence") or ""
            p = (" → " + a["proposed"]) if a.get("proposed") else ""
            lines.append("- `" + (a.get("key") or "") + "` " + t[:70] + p[:80]
                         + "  — " + (a.get("reason") or "")[:90])
        if len(staged[k]) > 60:
            lines.append("- … +" + str(len(staged[k]) - 60) + " more (see staged_fixes.json)")
        lines.append("")
    open(os.path.join(out_dir, "trail_report.md"), "w").write("\n".join(lines) + "\n")
    print(json.dumps(meta["counts"], indent=1))


if __name__ == "__main__":
    main()
