#!/usr/bin/env python3
"""R1 of docs/official_id_fold_scope.md — re-key kb/promotions.json through the
applied alias chain so Phase A/B official-ID fold evidence speaks CURRENT ids.

The manifest's keys are the 2026-05-22 re-mint's minted ids; four re-keys since
(canonical-SUBJ4 fold, over-merge splits, FL SUBJ4 split, the KIN/PE +
Drama/Theater convergences + twin merges) moved the live ids without moving the
manifest, severing 53% of the evidence (1,111 of 2,083 records) from
_row_official() in export_unified_courses(), which looks ids up exactly.

What it does:
  - resolves every promotions key through every APPLIED alias map (in
    chronological order, iterating until stable; over-merge splits follow the
    plurality branch — the identity-continuity successor);
  - FOLDS records whose keys converge on one current id (twin losers into
    winners): official_targets witness counts sum, college lists union;
  - refreshes `minted_remnant_members` to the CURRENT membership count (the old
    values described 2026-05-22 remnants);
  - keeps unresolvable keys in place flagged `"_unresolved": true` (nothing is
    deleted; they're listed in the receipt for investigation);
  - stamps `_rekeyed_at` + writes a receipt under kb/promotions_rekey_out/<date>/.

Gates (apply aborts if any fails):
  V1 witness conservation — total official_targets member count unchanged.
  V2 target conservation — the set of official target ids unchanged.
  V3 key liveness — every non-flagged output key exists in minted courses or
     singletons.
  V4 idempotency — re-running on the output is a no-op.

Usage (from repo root):
  python3 kb/_rekey_promotions.py            # dry-run (default)
  python3 kb/_rekey_promotions.py --apply    # write promotions.json + receipt

Playbook note: every future re-mint apply MUST re-key this manifest (it is the
5th id-keyed artifact class, with memberships, articulations, curation, and
Supabase). See docs/coursecontrolnumber_remint.md.
"""
import json
import os
import sys
from datetime import date
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ALIAS_MAPS = [  # applied re-mints only, chronological; dry-run receipts excluded
    "kb/subj4_apply/alias_map.json",
    "kb/overmerge_out/2026-05-29/alias_map.json",
    "kb/crossdisc_out/alias_map.json",
    "kb/fl_subj4_out/2026-06-09/alias_map.json",
    "kb/kin_pe_out/2026-06-10/alias_map.json",
    "kb/drama_theater_out/2026-06-10/alias_map.json",
    "kb/convergence_singletons_out/2026-06-10/alias_map.json",
    "kb/twin_merge_out/2026-06-10/alias_map.json",
]


def _load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def _load_alias(rel):
    m = _load(rel)
    for k in ("alias", "aliases", "alias_map"):
        if isinstance(m, dict) and k in m:
            return m[k]
    return m


def _step(v):
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        if v.get("new_id"):
            return v["new_id"]
        if v.get("splits"):
            pl = [s for s in v["splits"] if s.get("is_plurality")]
            return (pl or v["splits"])[0]["new_id"]
    return None


def rekey(doc, maps, live_minted, live_single, memberships):
    """Pure transform: returns (new_promotions, receipt)."""
    def resolve(old):
        cur, changed, guard = old, True, 0
        hops = []
        while changed and guard < 10:
            changed, guard = False, guard + 1
            for m in maps:
                if cur in m:
                    nxt = _step(m[cur])
                    if nxt and nxt != cur:
                        hops.append((cur, nxt))
                        cur, changed = nxt, True
        return cur, hops

    out = {}
    receipt = {"rekeyed": [], "folded": [], "unresolved": [], "unchanged": 0}
    for old, rec in doc.items():
        rec = json.loads(json.dumps(rec))  # deep copy — folds must not mutate the source
        rec.pop("_unresolved", None)  # idempotency: re-derive the flag
        if old in live_minted or old in live_single:
            new, hops = old, []
        else:
            new, hops = resolve(old)
        if new not in live_minted and new not in live_single:
            rec["_unresolved"] = True
            out[old] = rec
            receipt["unresolved"].append({"key": old, "resolves_to": new})
            continue
        if new != old:
            receipt["rekeyed"].append({"old": old, "new": new,
                                       "hops": [h[1] for h in hops]})
        else:
            receipt["unchanged"] += 1
        if new in out and not out[new].get("_unresolved"):
            # fold: two historical keys converged (e.g. twin loser -> winner)
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
    return out, receipt


def _witness_total(promos):
    return sum(w.get("members", 0)
               for rec in promos.values()
               for w in (rec.get("official_targets") or {}).values())


def _target_set(promos):
    return {t for rec in promos.values()
            for t in (rec.get("official_targets") or {})}


def main():
    apply = "--apply" in sys.argv
    maps = [_load_alias(p) for p in ALIAS_MAPS]
    doc = _load("kb/promotions.json")
    promos = doc["promotions"]
    live_minted = set(_load("kb/coci_minted_courses.json")["courses"])
    sgd = _load("kb/coci_minted_singletons.json")
    live_single = set(sgd.get("singletons") or sgd.get("courses") or sgd)
    memberships = _load("kb/coci_minted_memberships.json")["memberships"]

    w0, t0 = _witness_total(promos), _target_set(promos)  # baselines BEFORE transform
    new, receipt = rekey(promos, maps, live_minted, live_single, memberships)

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
    # V4 idempotency
    again, r2 = rekey(new, maps, live_minted, live_single, memberships)
    assert again == new and not r2["rekeyed"] and not r2["folded"], "V4 FAIL: not idempotent"

    n_live = sum(1 for k in new if k in live_minted or k in live_single)
    print(f"keys: {len(promos)} -> {len(new)} "
          f"({len(receipt['rekeyed'])} re-keyed, {len(receipt['folded'])} folded, "
          f"{len(receipt['unresolved'])} unresolved-flagged, {receipt['unchanged']} unchanged)")
    print(f"live keys: {n_live}/{len(new)} | witnesses conserved: {w0} | "
          f"targets conserved: {len(t0)}")
    print("V1-V4 PASS")

    if not apply:
        print("\nDRY-RUN — no files written. Re-run with --apply.")
        return 0

    odir = os.path.join(ROOT, "kb", "promotions_rekey_out", date.today().isoformat())
    os.makedirs(odir, exist_ok=True)
    with open(os.path.join(odir, "rekey_receipt.json"), "w", encoding="utf-8") as f:
        json.dump({"date": date.today().isoformat(),
                   "witness_total": w0, "targets": len(t0),
                   "counts": {k: (v if isinstance(v, int) else len(v))
                              for k, v in receipt.items()},
                   **receipt}, f, indent=1, ensure_ascii=False)
    doc["promotions"] = dict(sorted(new.items()))
    doc["count"] = len(new)
    doc["_rekeyed_at"] = date.today().isoformat()
    doc["_rekey_note"] = ("keys re-keyed to current ids through the applied alias "
                          "chain (R1, docs/official_id_fold_scope.md); folded keys "
                          "sum witnesses; _unresolved entries kept for investigation; "
                          "receipt: kb/promotions_rekey_out/")
    with open(os.path.join(ROOT, "kb", "promotions.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    print(f"\nAPPLIED: kb/promotions.json re-keyed; receipt at {odir}/rekey_receipt.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
