#!/usr/bin/env python3
"""R1 of docs/official_id_fold_scope.md — re-key kb/promotions.json through the
applied alias chain so Phase A/B official-ID fold evidence speaks CURRENT ids.

RESOLUTION SEMANTICS: kb/alias_chain.py is the single source for the chain,
the resolver and the era guard — read ITS docstring before editing anything
here. Summarized, because getting it wrong mis-keyed 1,066 of 2,083 records:

an alias map is a SIMULTANEOUS PERMUTATION, not a digraph: one lookup per map,
in chronological order, never iterated within a map and never short-circuited
because a key is live today.

ERA STAMPING: after an apply, the doc carries `_rekeyed_through` (the list of
maps already folded into its keys). A later run applies only maps NOT yet in
that list (which must form a chronological suffix), so re-running is a no-op
and future re-mints just append their map. A doc with `_rekeyed_at` but NO
`_rekeyed_through` was keyed by the defective first version — its keys are a
MIX of eras and unrecoverable in place: rebuild from the pre-R1 baseline
(`--baseline`, e.g. `git show <ref>:kb/promotions.json`).

What it does per key: resolves to the current id; FOLDS records whose keys
converge on one current id (witness counts sum, college lists union; e.g. the
SUBJ4 dedup + twin-merge Spanish convergences); refreshes
`minted_remnant_members` to the current membership grain; flags keys whose
resolution is not live `"_unresolved": true` (kept in place, listed in the
receipt — nothing is deleted).

Gates (apply aborts if any fails):
  V1 witness conservation — total official_targets member count unchanged.
  V2 target conservation — the set of official target ids unchanged.
  V3 key liveness — every non-flagged output key exists in minted courses or
     singletons.
  V4 idempotency — re-running on the output (zero pending maps) is a no-op.
  V5 stamp ground truth — when the SUBJ4 map is among the pending maps, every
     resolution of a key that some live row claims as its `_subj4_remint_from`
     must land on exactly that row. (2026-06-11 run: 1,954 checked, 0
     conflicts.)
  Plus a synthetic self-test of the resolution semantics on every run.

Usage (from repo root):
  python3 kb/_rekey_promotions.py                       # dry-run (default)
  python3 kb/_rekey_promotions.py --apply               # write + receipt
  python3 kb/_rekey_promotions.py --baseline /tmp/p.json --tag slotfix --apply

Playbook note: every future re-mint apply MUST re-key this manifest (it is the
5th id-keyed artifact class, with memberships, articulations, curation, and
Supabase). See docs/coursecontrolnumber_remint.md and
docs/kb-notes/methodology-alias-map-resolution-semantics.md.
"""
import argparse
import json
import os
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# THE chain, the resolver, the era guard and the semantics self-test all live in
# kb/alias_chain.py — this module holds none of its own (Sam's ruling 8,
# 2026-09-05). The names below are re-exported because five scripts and three
# tests import them from here.
from alias_chain import (  # noqa: E402
    ALIAS_MAPS, load_alias as _load_alias, resolve, selftest as _selftest,
)


def _load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def rekey(promos, maps, live_minted, live_single, memberships,
          rev_stamp=None, check_stamps=False):
    """Pure transform: returns (new_promotions, receipt, stamp_gate)."""
    live = set(live_minted) | set(live_single)
    out = {}
    receipt = {"rekeyed": [], "folded": [], "unresolved": [], "unchanged": 0}
    stamp_gate = {"checked": 0, "conflicts": []}
    for old, rec in promos.items():
        rec = json.loads(json.dumps(rec))  # deep copy — folds must not mutate the source
        rec.pop("_unresolved", None)  # idempotency: re-derive the flag
        new, hops = resolve(old, maps)
        if check_stamps and rev_stamp and old in rev_stamp and old != new:
            stamp_gate["checked"] += 1
            if rev_stamp[old] != new:
                stamp_gate["conflicts"].append(
                    {"key": old, "resolver": new, "stamp": rev_stamp[old]})
        if new not in live:
            rec["_unresolved"] = True
            out[old] = rec
            receipt["unresolved"].append({"key": old, "resolves_to": new})
            continue
        if new != old:
            receipt["rekeyed"].append({"old": old, "new": new, "hops": hops})
        else:
            receipt["unchanged"] += 1
        if new in out and not out[new].get("_unresolved"):
            # fold: two historical keys converged (subj4 dedup, twin loser -> winner)
            tgt = out[new].setdefault("official_targets", {})
            for t, w in (rec.get("official_targets") or {}).items():
                if t in tgt:
                    tgt[t]["members"] += w.get("members", 0)
                    tgt[t]["colleges"] = sorted(set(tgt[t].get("colleges") or [])
                                                | set(w.get("colleges") or []))
                else:
                    tgt[t] = dict(w)
            receipt["folded"].append({"into": new, "from": old})
        else:
            out[new] = rec
        # remnant count: make the field true again (current membership grain)
        if new in out and not out[new].get("_unresolved"):
            out[new]["minted_remnant_members"] = (
                len(memberships.get(new, [])) if new in live_minted else 1)
    return out, receipt, stamp_gate


def _witness_total(promos):
    return sum(w.get("members", 0)
               for rec in promos.values()
               for w in (rec.get("official_targets") or {}).values())


def _target_set(promos):
    return {t for rec in promos.values()
            for t in (rec.get("official_targets") or {})}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write promotions.json + receipt")
    ap.add_argument("--baseline", help="read promotions from this path instead of "
                                       "kb/promotions.json (rebuild after a defective re-key)")
    ap.add_argument("--tag", help="suffix for the receipt dir, e.g. 'slotfix'")
    args = ap.parse_args()

    _selftest()

    if args.baseline:
        with open(args.baseline, encoding="utf-8") as f:
            doc = json.load(f)
    else:
        doc = _load("kb/promotions.json")
    if doc.get("_rekeyed_at") and not doc.get("_rekeyed_through"):
        sys.exit("ABORT: this file was keyed by the defective pre-Session-42 re-key "
                 "(_rekeyed_at without _rekeyed_through) — its keys mix id eras and "
                 "cannot be resolved in place. Rebuild from the pre-re-key baseline: "
                 "git show 462dd99^:kb/promotions.json > /tmp/promotions_baseline.json "
                 "&& python3 kb/_rekey_promotions.py --baseline /tmp/promotions_baseline.json")
    promos = doc["promotions"]

    applied_already = doc.get("_rekeyed_through") or []
    pending_paths = [p for p in ALIAS_MAPS if p not in applied_already]
    # era guard: the pending maps must be a chronological suffix of the chain
    k = len(ALIAS_MAPS) - len(pending_paths)
    assert ALIAS_MAPS[k:] == pending_paths and all(p in applied_already for p in ALIAS_MAPS[:k]), \
        f"ERA FAIL: _rekeyed_through {applied_already} is not a prefix of ALIAS_MAPS"
    maps = [_load_alias(p) for p in pending_paths]

    live_minted = set(_load("kb/coci_minted_courses.json")["courses"])
    sgd = _load("kb/coci_minted_singletons.json")
    live_single = set(sgd.get("singletons") or sgd.get("courses") or sgd)
    memberships = _load("kb/coci_minted_memberships.json")["memberships"]

    # V5 ground truth: live rows carry the historical id they moved from.
    # Exactly ONE permutation-era stamp source is checked per run — the one
    # whose map is earliest among the pending maps. A pre-fold id and a
    # pre-2026-05-23 id can collide via slot reuse, so checking a stamp field
    # against keys of a DIFFERENT era would compare against the wrong family
    # (the Session-42 lesson, one layer up).
    if "kb/subj4_apply/alias_map.json" in pending_paths:
        stamp_field = "_subj4_remint_from"   # rebuild-from-baseline era
    elif "kb/subj4_fold_out/2026-06-12/alias_map.json" in pending_paths:
        stamp_field = "_subj4_fold_from"     # the Session-50 fold era
    else:
        stamp_field = None
    check_stamps = stamp_field is not None
    rev_stamp = {}
    if check_stamps:
        for rel in ("kb/coci_minted_courses.json", "kb/coci_minted_singletons.json"):
            for i, r in _load(rel)["courses"].items():
                s = r.get(stamp_field)
                if s and s != i:
                    rev_stamp[s] = i

    w0, t0 = _witness_total(promos), _target_set(promos)  # baselines BEFORE transform
    new, receipt, stamp_gate = rekey(promos, maps, live_minted, live_single,
                                     memberships, rev_stamp, check_stamps)

    # V1 witness conservation
    w1 = _witness_total(new)
    assert w0 == w1, f"V1 FAIL: witness total {w0} -> {w1}"
    # V2 target conservation
    t1 = _target_set(new)
    assert t0 == t1, f"V2 FAIL: target drift {t0 ^ t1}"
    # V3 key liveness
    bad = [k for k, v in new.items()
           if not v.get("_unresolved")
           and k not in live_minted and k not in live_single]
    assert not bad, f"V3 FAIL: dead non-flagged keys {bad[:5]}"
    # V4 idempotency: zero pending maps on the output is a no-op
    again, r2, _ = rekey(new, [], live_minted, live_single, memberships)
    assert again == new and not r2["rekeyed"] and not r2["folded"], "V4 FAIL: not idempotent"
    # V5 stamp ground truth
    assert not stamp_gate["conflicts"], \
        f"V5 FAIL: resolver disagrees with _subj4_remint_from stamps: {stamp_gate['conflicts'][:5]}"

    n_live = sum(1 for k in new if k in live_minted or k in live_single)
    print(f"maps applied this run: {len(pending_paths)} "
          f"({', '.join(p.split('/')[1] for p in pending_paths) or 'none — already current'})")
    print(f"keys: {len(promos)} -> {len(new)} "
          f"({len(receipt['rekeyed'])} re-keyed, {len(receipt['folded'])} folded, "
          f"{len(receipt['unresolved'])} unresolved-flagged, {receipt['unchanged']} unchanged)")
    print(f"live keys: {n_live}/{len(new)} | witnesses conserved: {w0} | "
          f"targets conserved: {len(t0)}")
    print(f"V5 stamp gate: {stamp_gate['checked']} checked, "
          f"{len(stamp_gate['conflicts'])} conflicts")
    print("V1-V5 PASS")

    if not args.apply:
        print("\nDRY-RUN — no files written. Re-run with --apply.")
        return 0

    dirname = date.today().isoformat() + (f"-{args.tag}" if args.tag else "")
    odir = os.path.join(ROOT, "kb", "promotions_rekey_out", dirname)
    # Never overwrite an earlier same-day receipt (Session 50 nearly clobbered
    # Session 46's — same lesson as the twin merge's --tag): auto-suffix.
    n = 2
    while os.path.exists(odir):
        odir = os.path.join(ROOT, "kb", "promotions_rekey_out", f"{dirname}-{n}")
        n += 1
    os.makedirs(odir)
    with open(os.path.join(odir, "rekey_receipt.json"), "w", encoding="utf-8") as f:
        json.dump({"date": date.today().isoformat(),
                   "baseline": args.baseline or "kb/promotions.json",
                   "maps_applied": pending_paths,
                   "witness_total": w0, "targets": len(t0),
                   "stamp_gate": {"checked": stamp_gate["checked"],
                                  "conflicts": len(stamp_gate["conflicts"])},
                   "counts": {k: (v if isinstance(v, int) else len(v))
                              for k, v in receipt.items()},
                   **receipt}, f, indent=1, ensure_ascii=False)
    doc["promotions"] = dict(sorted(new.items()))
    doc["count"] = len(new)
    doc["_rekeyed_at"] = date.today().isoformat()
    doc["_rekeyed_through"] = applied_already + pending_paths
    doc["_rekey_note"] = ("keys re-keyed to current ids through the applied alias chain "
                          "(chronological single-step per map — an alias map is a "
                          "simultaneous permutation, never iterated; see the module "
                          "docstring of kb/_rekey_promotions.py); folded keys sum "
                          "witnesses; _unresolved entries kept for investigation; "
                          "receipt: kb/promotions_rekey_out/")
    with open(os.path.join(ROOT, "kb", "promotions.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    print(f"\nAPPLIED: kb/promotions.json re-keyed; receipt at {odir}/rekey_receipt.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
