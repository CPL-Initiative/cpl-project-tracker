#!/usr/bin/env python3
"""Re-key kb/crnc_mirrors.json through the applied alias chain.

The CR/NC mirror classes (kb/_detect_crnc_mirrors.py; Doctrine v0.3 Q-CREDITNC)
are keyed by identity id and read by excel_to_dashboard.py's flags_of() to mark
a same-college credit/noncredit pair as a Credit-by-Exam CPL pairing instead of
a band-mix over-merge. Two facts make this a RE-KEY and not a regeneration:

  * the committed file carries curated work — eleven cross-college mirrors
    folded in from the 2026-07-12 agent re-adjudication (kb/crnc_out/2026-07-12/,
    see its `_overlay_note`) — which a plain re-run of the detector drops;
  * it was never in the post-apply chain, so the 2026-09-03 authority recode
    and Z-band retirement left 398 of its 2,836 keys on ids that no longer
    exist (measured 2026-09-04: every one resolves in one hop to a live
    membership key; none converge). For those identities the D-3 suppression
    had silently stopped.

Same resolution semantics and era stamping as kb/_rekey_promotions.py (read its
docstring before editing): each map is applied AT MOST ONCE, in chronological
order, with no within-map iteration and no liveness shortcut; `_rekeyed_through`
on the doc names the maps already folded into its keys, and the pending maps
must be a chronological suffix of ALIAS_MAPS. The `pairs` inside a class are
local (subject, number) codes, not ids — they never move.

First run on a doc with no era list: pass --baseline-through <map path> naming
the LAST map already reflected in its keys. For the committed file (generated
2026-07-12) that is kb/pols_remint_out/2026-07-10/alias_map.json.

Gates (apply aborts if any fails):
  V1 count conserved — a re-key never merges two classes; two keys converging
     on one id is an error, not a fold.
  V2 every output key is live in kb/coci_minted_memberships.json — a mirror
     class exists only for an identity with members.
  V3 idempotent — re-running with no pending maps changes nothing.

Usage (from repo root):
  python3 kb/_rekey_crnc_mirrors.py                                  # dry-run
  python3 kb/_rekey_crnc_mirrors.py --baseline-through <map> --apply # first run
  python3 kb/_rekey_crnc_mirrors.py --apply                          # later runs (the chain)
Receipt: kb/crnc_rekey_out/<date>/rekey_receipt.json (the moved pairs; a second run the
same day writes rekey_receipt_2.json, never over the first).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from _rekey_promotions import ALIAS_MAPS, _load_alias, resolve  # noqa: E402

MIRRORS = os.path.join(HERE, "crnc_mirrors.json")
MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
OUT_DIR = os.path.join(HERE, "crnc_rekey_out")


def pending_maps(applied_already, baseline_through=None, chain=None):
    """The maps still to fold in, as (paths, applied_after). A doc with no era
    list needs the baseline map named; the pending set must be a chronological
    suffix of the chain."""
    chain = list(chain if chain is not None else ALIAS_MAPS)
    if not applied_already:
        if not baseline_through:
            raise SystemExit("ABORT: crnc_mirrors.json carries no _rekeyed_through — pass "
                             "--baseline-through <the last map already reflected in its keys>.")
        if baseline_through not in chain:
            raise SystemExit(f"ABORT: --baseline-through {baseline_through} is not in ALIAS_MAPS.")
        applied_already = chain[:chain.index(baseline_through) + 1]
    pending = [p for p in chain if p not in applied_already]
    k = len(chain) - len(pending)
    if chain[k:] != pending or not all(p in applied_already for p in chain[:k]):
        raise SystemExit(f"ERA FAIL: _rekeyed_through {applied_already} is not a prefix of ALIAS_MAPS")
    return pending, chain[:k] + pending


def receipt_path(out_dir):
    """rekey_receipt.json, then rekey_receipt_2.json, _3 ... — two runs on one day
    (2026-09-04: the recode's 398 keys in the morning, the fold's 29 that night)
    must both keep their receipt."""
    n = 1
    while True:
        name = "rekey_receipt.json" if n == 1 else f"rekey_receipt_{n}.json"
        path = os.path.join(out_dir, name)
        if not os.path.exists(path):
            return path
        n += 1


def rekey(mirrors, maps, live_keys):
    """Pure transform: (new_mirrors, moved {old: new}, problems). Gates V1 and V2
    are reported as problems, never silently fixed."""
    out, moved, problems, hits = {}, {}, [], {}
    for old, cls in mirrors.items():
        new, _hops = resolve(old, maps)
        if new != old:
            moved[old] = new
        hits.setdefault(new, []).append(old)
        out[new] = cls
    converging = {n: olds for n, olds in hits.items() if len(olds) > 1}
    if converging:
        problems.append(f"V1 count not conserved: {len(converging)} ids receive more than one class "
                        f"(sample {dict(list(converging.items())[:3])})")
    dead = sorted(k for k in out if k not in live_keys)
    if dead:
        problems.append(f"V2 {len(dead)} keys not live in memberships after the re-key (sample {dead[:5]})")
    return out, moved, problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write kb/crnc_mirrors.json + the receipt")
    ap.add_argument("--baseline-through", help="first run only: the last alias map already reflected in the keys")
    args = ap.parse_args()

    with open(MIRRORS, encoding="utf-8") as f:
        doc = json.load(f)
    with open(MEMBERSHIPS, encoding="utf-8") as f:
        live = set(json.load(f)["memberships"])
    pending, through = pending_maps(doc.get("_rekeyed_through") or [], args.baseline_through)
    maps = [_load_alias(p) for p in pending]
    mirrors = doc["mirrors"]
    before_dead = sum(1 for k in mirrors if k not in live)
    out, moved, problems = rekey(mirrors, maps, live)
    again, moved_again, _ = rekey(out, [], live)
    if moved_again or again != out:
        problems.append("V3 not idempotent: a second pass with no maps changed the keys")
    print(f"[rekey_crnc_mirrors] maps pending: {len(pending)} " + " ".join(os.path.basename(os.path.dirname(p)) for p in pending))
    print(f"  keys: {len(mirrors)} -> {len(out)} ({len(moved)} re-keyed, {len(mirrors) - len(moved)} unchanged)")
    print(f"  keys not live in memberships: {before_dead} before -> {sum(1 for k in out if k not in live)} after")
    for p in problems:
        print("  ✗ " + p)
    if problems:
        sys.exit("✗ gate failure — NOTHING written.")
    print("  V1-V3 PASS")
    if not args.apply:
        print("\nDRY-RUN — no files written. Re-run with --apply.")
        return 0
    today = date.today().isoformat()
    doc["mirrors"] = out
    doc["_rekeyed_through"] = through
    doc["_rekeyed_at"] = today
    doc["_rekeyed_by"] = "kb/_rekey_crnc_mirrors.py"
    tmp = MIRRORS + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, MIRRORS)
    out_dir = os.path.join(OUT_DIR, today)
    os.makedirs(out_dir, exist_ok=True)
    receipt = receipt_path(out_dir)
    with open(receipt, "w", encoding="utf-8") as f:
        json.dump({"_about": "kb/crnc_mirrors.json re-keyed through the applied alias chain (old -> new)",
                   "_at": today, "maps_applied": pending, "rekeyed_through": through,
                   "count": len(moved), "moved": dict(sorted(moved.items()))}, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"\nAPPLIED: kb/crnc_mirrors.json re-keyed ({len(moved)} keys); receipt at "
          f"{os.path.relpath(receipt, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
