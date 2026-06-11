#!/usr/bin/env python3
"""Read-only analyzer: how much official-ID (C-ID/CCN) fold evidence is
currently SEVERED from Phase A/B by stale promotions keys, and what a
re-keyed + tiered rule would do.

Background (Session 40, 2026-06-10 — the SPAN 200 case): kb/promotions.json
is the ONLY evidence source for the automatic Phase A badge / Phase B
official-ID consolidation in export_unified_courses(). Its keys were the
2026-05-22 re-mint's minted ids, but subsequent APPLIED re-keys (the
canonical-SUBJ4 fold, the FL SUBJ4 split, the KIN/PE + Drama/Theater
convergences + twin merges — NOT the staged-only over-merge plan) re-keyed
the live identities without re-keying the manifest — and _row_official()
looks ids up EXACTLY (no alias resolution). Result: rows like FLSP M1342
"Intermediate Spanish I" carry 30 control-number-exact member mappings to
C-ID SPAN 200 that the generator could no longer see. (Fixed by
kb/_rekey_promotions.py — this analyzer is era-aware via `_rekeyed_through`.)

This script resolves every promotions key through the full applied-alias
chain (the same receipts Rule 7 mandates), aggregates official_targets onto
CURRENT ids, and reports:
  1. severance counts (live-as-is / re-keyed-resolvable / dead),
  2. evidence tiers at the proposed thresholds (auto-fold >=80% share with
     >=2 witnesses; queue single-witness; queue 50-80%; review <50%),
  3. the Spanish family table (the motivating case),
  4. validation against the curator's existing hand-confirmed merges.

Never mutates anything. Scope doc: docs/official_id_fold_scope.md.
Run from repo root: python3 kb/_analyze_official_fold_evidence.py
"""
import json
import os
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# APPLY-CONFIRMED re-mints only, in chronological order. Must stay in lockstep
# with kb/_rekey_promotions.py ALIAS_MAPS (see its module docstring for the
# resolution semantics and why kb/overmerge_out/2026-05-29/alias_map.json — a
# STAGED, never-dispatched plan — is excluded).
ALIAS_MAPS = [
    "kb/subj4_apply/alias_map.json",
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


def load_alias(rel):
    """Every receipt wraps its map differently (alias / aliases / alias_map)."""
    m = _load(rel)
    for k in ("alias", "aliases", "alias_map"):
        if isinstance(m, dict) and k in m:
            return m[k]
    return m


def _step(v):
    """One alias-map hop: flat string, {new_id}, or an over-merge split
    (follow the plurality split — the identity-continuity branch)."""
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        if v.get("new_id"):
            return v["new_id"]
        if v.get("splits"):
            pl = [s for s in v["splits"] if s.get("is_plurality")]
            return (pl or v["splits"])[0]["new_id"]
    return None


def main():
    promo_doc = _load("kb/promotions.json")
    # Era awareness: only resolve through maps NOT already folded into the
    # file's keys (kb/_rekey_promotions.py stamps `_rekeyed_through`).
    done = set(promo_doc.get("_rekeyed_through") or [])
    pending = [p for p in ALIAS_MAPS if p not in done]
    maps = [load_alias(p) for p in pending]
    if done:
        print(f"promotions.json already re-keyed through {len(done)} maps; "
              f"resolving through {len(pending)} pending")

    def resolve(old):
        # Chronological single-step: each map applied AT MOST ONCE, in order.
        # An alias map is a simultaneous permutation — iterating it follows
        # slot-occupancy chains across unrelated rows (the Session-42
        # telescoping defect). Lockstep with kb/_rekey_promotions.py.
        cur = old
        for m in maps:
            if cur in m:
                nxt = _step(m[cur])
                if nxt and nxt != cur:
                    cur = nxt
        return cur

    promotions = promo_doc["promotions"]
    courses = _load("kb/coci_minted_courses.json")["courses"]
    sgd = _load("kb/coci_minted_singletons.json")
    singletons = sgd.get("singletons") or sgd.get("courses") or sgd
    memberships = _load("kb/coci_minted_memberships.json")["memberships"]

    # Sanity: remnant members must carry no live official ids (the re-mint
    # split those members out) — confirms promotions is the ONLY evidence.
    n_live_cid = sum(1 for ms in memberships.values() for m in ms
                     if m.get("c_id") or m.get("cid") or m.get("ccn"))
    print(f"membership records carrying a live c_id/ccn: {n_live_cid} "
          f"(expected 0 — evidence lives only in promotions.json)")

    evid = defaultdict(lambda: defaultdict(int))
    asis = rekeyed = 0
    dead = []
    for k, v in promotions.items():
        # No liveness shortcut: under slot reuse a live key may be occupied by
        # a DIFFERENT family ("ANTH M1023" stayed live while its family moved
        # to "ANTH M1035") — resolve every key, "as-is" is a result.
        cur = resolve(k)
        if cur not in courses and cur not in singletons:
            dead.append((k, cur))
            continue
        if cur == k:
            asis += 1
        else:
            rekeyed += 1
        for t, w in (v.get("official_targets") or {}).items():
            evid[cur][t] += w["members"]

    print(f"\npromotions keys: {len(promotions)} total")
    print(f"  live as-is:               {asis}")
    print(f"  re-keyed but resolvable:  {rekeyed}  <- SEVERED from Phase A/B today")
    print(f"  dead ends:                {len(dead)}")
    if dead:
        print("  dead samples:", ", ".join(f"{a}->{b}" for a, b in dead[:8]))

    minted_ev = {c: tg for c, tg in evid.items() if c in courses}
    sing_ev = {c: tg for c, tg in evid.items() if c in singletons}

    def tier(tg):
        tot = sum(tg.values())
        share = max(tg.values()) / tot
        if share >= 0.8 and tot >= 2:
            return "1 AUTO-FOLD    (>=80% share, >=2 witnesses)"
        if share >= 0.8:
            return "2 QUEUE        (single witness)"
        if share >= 0.5:
            return "3 QUEUE        (50-80% plurality)"
        return "4 REVIEW/SPLIT (<50% top share)"

    tiers = defaultdict(lambda: [0, 0])
    for c, tg in minted_ev.items():
        t = tier(tg)
        tiers[t][0] += 1
        tiers[t][1] += len(memberships.get(c, []))
    print(f"\nminted CCR rows with official-id evidence after re-key: {len(minted_ev)}")
    for t in sorted(tiers):
        n, mn = tiers[t]
        print(f"  {t:<46} {n:>5} rows / {mn:>5} member courses")
    print(f"stand-alone (singleton) ids with evidence: {len(sing_ev)}")

    # The motivating case: the Spanish family on current ids.
    print("\n=== Spanish family evidence (current ids) ===")
    for c, tg in sorted(evid.items()):
        if not any("SPAN" in t for t in tg):
            continue
        rec = courses.get(c) or singletons.get(c) or {}
        title = rec.get("common_title") or rec.get("title") or "?"
        layer = "minted" if c in courses else "single"
        tgs = ", ".join(f"{t.split(':', 1)[1]}:{n}"
                        for t, n in sorted(tg.items(), key=lambda x: -x[1]))
        print(f"  {c:<14} [{layer}] {str(title)[:44]:<44} {{{tgs}}}")

    # Validation: does the rule agree with the curator's hand-confirmed merges?
    cur_doc = _load("kb/coci_curation.json")["curations"]
    items = (cur_doc.items() if isinstance(cur_doc, dict)
             else ((e.get("course_id"), e) for e in cur_doc))
    agree = held = contradict = no_ev = 0
    for cid_, e in items:
        tgt = (e or {}).get("merge_into")
        if not tgt:
            continue
        tg = evid.get(cid_)
        if not tg:
            no_ev += 1
            continue
        top_t, top_n = max(tg.items(), key=lambda x: x[1])
        top_official = top_t.split(":", 1)[1]
        share = top_n / sum(tg.values())
        if top_official == tgt:
            if share >= 0.8 and sum(tg.values()) >= 2:
                agree += 1
            else:
                held += 1
        else:
            contradict += 1
    print("\n=== validation vs existing curator merge_into pointers ===")
    print(f"  rule reproduces the merge (tier 1):   {agree}")
    print(f"  same target, held for review (tier<1): {held}")
    print(f"  rule CONTRADICTS the curator:          {contradict}")
    print(f"  curator merge with no evidence:        {no_ev}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
