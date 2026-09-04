#!/usr/bin/env python3
"""The Rule-7 post-apply chain driver (Session 50 — Sam liked the idea).

After a re-mint apply (and any bundled twin merge) has mutated the KB and the
corresponding alias maps are registered in kb/_rekey_promotions.py ALIAS_MAPS,
this driver runs the NONE-SKIPPABLE downstream chain in order, fail-fast:

  1. promotions   python3 kb/_rekey_promotions.py --apply
                  (re-keys the Phase A/B official-ID fold evidence — the 5th
                  id-keyed artifact class; skipping it severed 53% of the
                  evidence once: docs/official_id_fold_scope.md)
  1b. crnc-mirrors python3 kb/_rekey_crnc_mirrors.py --apply
                  (re-keys kb/crnc_mirrors.json — the 6th id-keyed class, read
                  by the dashboard's D-3 suppression; it carries curated
                  overlay work so it is re-keyed, never regenerated. Missing
                  from the chain until 2026-09-04: the recode left 398 of its
                  keys on retired ids.)
  2. csr-seed     python3 kb/_seed_canonical_subj4.py
                  (CSR re-seed — variants_observed collapses to canonical;
                  curator-reviewed picks are preserved by the seeder)
  2b. authority   python3 kb/_seed_authority_codes.py
                  (the C-ID / CCN chip fields + canonical_source — item 19 of
                  the 2026-09-03 rulings; the source flips when a fold lands)
  3. audit        python3 kb/_row_audit.py
                  (refresh the Trust-Card overlay; for the SUBJ4 fold the
                  receipt is subject_collision_signal -> ~0)
  4. desc-receipt python3 kb/_desc_consolidation_dryrun.py
  5. title-receipt python3 kb/_title_consolidation_dryrun.py
                  (both committed worklist receipts re-run against the folded
                  KB so the queues never show dead ids)
  6. fold-verify  SUBJ4_DRYRUN_OUT=<tmp> python3 kb/_subj4_dryrun.py
                  (post-state no-op proof: re_key must be 0; runs into a temp
                  dir so the frozen pre-apply receipt files aren't churned)

Artifact regen (unified_courses_*.js etc.) is deliberately NOT here — per the
artifact policy the post-merge `workflow_dispatch` of daily-dashboard.yml
publishes those from the runner.

Usage (from repo root):
  python3 kb/_post_apply_chain.py             # run all steps
  python3 kb/_post_apply_chain.py --from audit  # resume after a fixed failure
  python3 kb/_post_apply_chain.py --steps csr-seed,audit
Prints a before/after subject_collision_signal receipt when the audit step runs.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_LATEST = os.path.join(ROOT, "kb", "row_audit", "latest.json")

STEPS = [
    ("promotions", [sys.executable, "kb/_rekey_promotions.py", "--apply"], None),
    ("crnc-mirrors", [sys.executable, "kb/_rekey_crnc_mirrors.py", "--apply"], None),
    ("csr-seed", [sys.executable, "kb/_seed_canonical_subj4.py"], None),
    ("authority", [sys.executable, "kb/_seed_authority_codes.py"], None),
    ("audit", [sys.executable, "kb/_row_audit.py"], None),
    ("desc-receipt", [sys.executable, "kb/_desc_consolidation_dryrun.py"], None),
    ("title-receipt", [sys.executable, "kb/_title_consolidation_dryrun.py"], None),
    ("fold-verify", [sys.executable, "kb/_subj4_dryrun.py"],
     {"SUBJ4_DRYRUN_OUT": os.path.join(tempfile.gettempdir(), "subj4_fold_verify")}),
]


def _collision_count():
    try:
        with open(AUDIT_LATEST, encoding="utf-8") as f:
            return json.load(f)["stats"]["tag_counts"].get("subject_collision_signal", 0)
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="from_step", help="resume at this step name")
    ap.add_argument("--steps", help="comma-separated subset, in chain order")
    args = ap.parse_args()

    names = [n for n, _, _ in STEPS]
    todo = names
    if args.steps:
        todo = [s.strip() for s in args.steps.split(",")]
        bad = [s for s in todo if s not in names]
        if bad:
            sys.exit(f"unknown step(s) {bad} — chain order is {names}")
    if args.from_step:
        if args.from_step not in names:
            sys.exit(f"unknown --from step {args.from_step!r} — chain order is {names}")
        todo = [s for s in todo if names.index(s) >= names.index(args.from_step)]

    pre_collisions = _collision_count()
    print(f"[post-apply chain] steps: {todo}")
    if pre_collisions is not None:
        print(f"  subject_collision_signal before: {pre_collisions}")

    for name, cmd, extra_env in STEPS:
        if name not in todo:
            continue
        env = dict(os.environ)
        if extra_env:
            env.update(extra_env)
        t0 = time.time()
        print(f"\n── step {name}: {' '.join(cmd[1:])}")
        proc = subprocess.run(cmd, cwd=ROOT, env=env)
        dt = time.time() - t0
        if proc.returncode != 0:
            sys.exit(f"✗ step {name} FAILED (rc={proc.returncode}, {dt:.0f}s) — fix, "
                     f"then resume with: python3 kb/_post_apply_chain.py --from {name}")
        print(f"   ✓ {name} ({dt:.0f}s)")

    if "audit" in todo:
        post_collisions = _collision_count()
        print(f"\nreceipt: subject_collision_signal {pre_collisions} → {post_collisions}")
    print("chain complete. Remaining (operator): Supabase ops in the same window; "
          "commit + PR + merge + workflow_dispatch for artifact regen.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
