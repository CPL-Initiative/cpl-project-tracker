#!/usr/bin/env python3
"""THE alias chain — one declaration of the applied re-mint receipts, one
resolver, one era guard. Every id-keyed artifact in this repo resolves through
THIS module; nothing declares its own chain.

⚠️ WHY THIS FILE EXISTS (Session 232, Sam's ruling 8 of 2026-09-05). The chain
used to be copy-pasted, and the copy in kb/_analyze_official_fold_evidence.py
sat under a comment reading "Must stay in lockstep with kb/_rekey_promotions.py
ALIAS_MAPS" while carrying SEVEN maps against the real fifteen — eight applies
behind, for months, silently. A comment is not a mechanism. The lockstep is now
structural (there is one list) and `tests/alias_chain_single_source_test.py`
fails any file that declares `ALIAS_MAPS` of its own.

RESOLUTION SEMANTICS (corrected 2026-06-11, Session 42 — read before editing):

An alias map is the receipt of ONE apply — a *simultaneous permutation* of the
id space, NOT a digraph to walk. Two consequences the first resolver got wrong
(the "slot-reuse telescoping" defect, receipt kb/promotions_rekey_out/
2026-06-11/ — 1,066 of 2,083 records mis-keyed):

  1. NEVER iterate within a map. The SUBJ4 canonicalization re-sequenced whole
     (SUBJ4, band) buckets, so a retired slot is routinely re-occupied by a
     DIFFERENT row in the same apply ("ECON M1001" -> "ECON M1005" while
     "AGR M1001" -> "ECON M1001"). Following A->B then B->C tracks the
     *slot-occupancy history*, not the row: B->C is the move of the unrelated
     row that previously held B. Each map is applied by ONE lookup.
  2. NEVER skip a key because it is live today. Under slot reuse, a baseline
     key being live means only that the SLOT is occupied — possibly by a
     different family ("ANTH M1023" stayed live while its family moved to
     "ANTH M1035"). Every key resolves through every pending map; "unchanged"
     is a RESULT (resolve(k) == k), not a precondition.

Maps are applied in chronological order, each at most once. Cross-map chains
are correct (subj4 moves K->B, the FL split moves B->C, the twin merge C->W):
at each map, the carried id IS the row's id at that apply's moment.

ONLY APPLY-CONFIRMED maps belong in the chain. Status headers can lie:
  * kb/subj4_apply/alias_map.json said "DRY-RUN" for 19 days — it is the
    frozen copy of the dry-run plan that kb/subj4_apply/report.md confirms
    was APPLIED verbatim 2026-05-23 (65,311 moves, including fate:"no_change"
    rows whose SUBJ4 stayed but whose number re-sequenced). The per-row
    `_subj4_remint_from` stamps on minted courses + singletons are the ground
    truth and confirm every move.
  * kb/overmerge_out/2026-05-29/alias_map.json is EXCLUDED: that plan is
    STAGED, never dispatched (Sam gates the apply — docs/roadmap_archive.md,
    Session 18). 1,259 of its 1,299 "retired" old ids are still live and 0
    apply receipts exist. If/when Sam dispatches the over-merge apply, append
    its map HERE (after the maps below, keeping chronology).

ERA STAMPING: after an apply, a re-keyed doc carries `_rekeyed_through` (the
list of maps already folded into its keys). A later run applies only maps NOT
yet in that list, which must form a chronological SUFFIX of the chain — see
`pending_maps`. Re-running is therefore a no-op and a future re-mint just
appends its map here.

Doctrine: docs/kb-notes/methodology-alias-map-resolution-semantics.md ·
docs/coursecontrolnumber_remint.md · docs/reference/mid_lifecycle.md.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Apply-confirmed re-mints only, chronological. See the module docstring for
# why kb/overmerge_out/2026-05-29/alias_map.json is NOT here.
# ⚠️ THE ONLY declaration in the repo — do not copy this list into a script.
ALIAS_MAPS = [
    "kb/subj4_apply/alias_map.json",                      # 2026-05-23 (stamps confirm)
    "kb/crossdisc_out/alias_map.json",                    # 2026-06-09
    "kb/fl_subj4_out/2026-06-09/alias_map.json",          # 2026-06-09
    "kb/kin_pe_out/2026-06-10/alias_map.json",            # 2026-06-10
    "kb/drama_theater_out/2026-06-10/alias_map.json",     # 2026-06-10
    "kb/convergence_singletons_out/2026-06-10/alias_map.json",  # 2026-06-10
    "kb/twin_merge_out/2026-06-10/alias_map.json",        # 2026-06-10
    "kb/twin_merge_out/2026-06-12/alias_map.json",        # 2026-06-12 (statewide twins, Session 46)
    "kb/subj4_fold_out/2026-06-12/alias_map.json",        # 2026-06-12 (the canonical SUBJ4 fold, Session 50 — stamps: _subj4_fold_from)
    "kb/twin_merge_out/2026-06-12-postfold/alias_map.json",  # 2026-06-12 (post-fold statewide twins, Session 50)
    "kb/kin_pe_pass2_out/2026-06-12/alias_map.json",      # 2026-06-12 (KIN/PE pass 2, Session 51 — stamps: _kin_pe_pass2_from; no V5 stamp-era hookup needed: applied after the fold map was already folded in)
    "kb/pols_remint_out/2026-07-10/alias_map.json",       # 2026-07-10 (POSC->POLS CCN convergence, Session 111 — CSR pass CSR0006)
    "kb/authority_recode_out/2026-09-03/alias_map.json",  # 2026-09-03 (the authority recode, items 7-16, Session 224 — stamps: _authority_recode_from)
    "kb/zband_retire_out/2026-09-03/alias_map.json",      # 2026-09-03 (the Z-band retirement, items 20-21, Session 224 — stamps: _zband_retired_from; materialized records carry no earlier id)
    "kb/prefix_fold_out/2026-09-03/alias_map.json",       # 2026-09-04 (the prefix fold, Session 225 — stamps: _prefix_fold_from; scope all, nothing ruled held; Sam's yes to all 2026-09-04)
]


def load(rel):
    """Read a repo-relative JSON file."""
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def load_alias(rel):
    """One receipt's map. Every receipt wraps it differently (alias / aliases /
    alias_map), and some are the bare mapping."""
    m = load(rel)
    for k in ("alias", "aliases", "alias_map"):
        if isinstance(m, dict) and k in m:
            return m[k]
    return m


def load_maps(paths):
    """The maps for these receipt paths, in the order given."""
    return [load_alias(p) for p in paths]


def step(v):
    """One alias-map hop: a flat string, {new_id}, or an over-merge split
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


def resolve(old, maps):
    """Chronological single-step resolution: each map applied AT MOST ONCE, in
    order, no within-map iteration, no liveness shortcut (see the module
    docstring — both were the telescoping defect).

    Returns (current_id, hops)."""
    cur, hops = old, []
    for m in maps:
        if cur in m:
            nxt = step(m[cur])
            if nxt and nxt != cur:
                hops.append(nxt)
                cur = nxt
    return cur, hops


def resolve_id(old, maps):
    """`resolve` without the hop trail — for call sites that only want the id."""
    return resolve(old, maps)[0]


def pending_maps(applied_already, baseline_through=None, chain=None):
    """The maps still to fold into a doc's keys, as (pending, new_era).

    A doc with no `_rekeyed_through` needs its baseline map named — we cannot
    guess which era its keys are in, and guessing wrong silently re-applies a
    permutation. The pending set must be a chronological SUFFIX of the chain;
    anything else means the doc's era list is not a prefix of history, which is
    unrecoverable in place (rebuild from a pre-re-key baseline).

    Raises SystemExit with an operator-readable reason — these are apply-time
    aborts, not exceptions to catch."""
    chain = list(chain if chain is not None else ALIAS_MAPS)
    if not applied_already:
        if not baseline_through:
            raise SystemExit("ABORT: the document carries no _rekeyed_through — pass the "
                             "baseline (the last map already reflected in its keys).")
        if baseline_through not in chain:
            raise SystemExit(f"ABORT: baseline {baseline_through} is not in ALIAS_MAPS.")
        applied_already = chain[:chain.index(baseline_through) + 1]
    pending = [p for p in chain if p not in applied_already]
    k = len(chain) - len(pending)
    if chain[k:] != pending or not all(p in applied_already for p in chain[:k]):
        raise SystemExit(f"ERA FAIL: _rekeyed_through {applied_already} is not a prefix of ALIAS_MAPS")
    return pending, chain[:k] + pending


def selftest():
    """The two failure modes the corrected semantics must hold against. Called
    by every apply before it touches a file."""
    slot_reuse = {"A": "B", "B": "C"}   # one apply re-sequencing: A->B, B->C
    later = {"C": "D"}                  # a later apply
    maps = [slot_reuse, later]
    assert resolve("A", maps)[0] == "B", "within-map telescoping regression"
    assert resolve("B", maps)[0] == "D", "cross-map chaining broken"
    assert resolve("C", maps)[0] == "D", "single-map resolution broken"
    assert resolve("Z", maps)[0] == "Z", "untouched key must be identity"


if __name__ == "__main__":
    selftest()
    missing = [p for p in ALIAS_MAPS if not os.path.exists(os.path.join(ROOT, p))]
    print(f"alias chain: {len(ALIAS_MAPS)} applied maps, {len(missing)} missing on disk")
    for p in missing:
        print(f"  MISSING {p}")
    print("selftest: PASS")
