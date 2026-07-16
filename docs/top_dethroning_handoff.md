---
title: "TOP-dethroning side-lane — continuation handoff"
date: 2026-07-16
tags: [handoff, top-code, discipline, subj4, identity, starboard, side-lane]
related:
  - "[[top_dethroning_lessons]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
---

# TOP-dethroning side-lane — continuation handoff

You are picking up the **StarBoard** side-lane: unburdening the schema from the
"tyranny of TOP." TOP codes are faculty-entered in COCI with no data-entry
gatekeeper → unreliable → **never a gatekeeper / primary determination**; only a
**last-in-line corroborator** or a **fuzzy search/filter** aid. This is a
side-lane (named handoff + lessons doc); the **numbered** `session_<N>_handoff.md`
and `kb/cpl_todos.json` belong to the CCR-convergence mainline — leave them.

## Read first (in order)
1. `docs/top_dethroning_lessons.md` — the full story + roadmap.
2. `docs/kb-notes/methodology-top-is-a-last-in-line-signal.md` — the doctrine
   anchor (three-role rule, signal ladder, identity-boundary ruling).
3. `CLAUDE.md §7` — the standing TOP caveat + the StarBoard §11 subsection.
4. `kb/_top_gate.py` — the shared predicate every fold/vote should consult.

## What shipped (both merged to main)
- **PR A #799** — doctrine + `_row_audit.py` TOP demotion (inferred-high→low),
  `merge_flag` relabel, `_overmerge_apply.py` source-label fix. Test 8/8.
- **PR B #800** — `kb/_top_gate.py` predicate; `_seed_canonical_subj4.py` gates
  TOP-sourced rows out of the canonical-SUBJ4 vote (+ `top_only` /
  `corroborated_voters` fields); read-only dry-run + receipt
  `kb/top_gate_out/2026-07-16/`. Test 13/13. **0 canonical values changed** —
  the gate is provably non-disruptive.

## Priority carryover
1. **Fold/re-key enforcement (the ruling's second half).** Wire
   `discipline_is_corroborated(rec)` into the fold/apply scripts
   (`_subj4_apply.py`, `_apply_canonical_subj4.py`, `_overmerge_apply.py`, the
   convergence applies) so a TOP-only row waits un-folded until corroborated.
   **Dry-run-first, dispatched apply per Rule 7** — never a casual re-key. Low
   urgency (the gate already showed 0 value changes).
2. **`excel_to_dashboard.py` fallback label** (EACR statewide card, ~L4626):
   TOP→discipline fallback uses an arbitrary alphabetical-first tie-break — use
   modal TOP + a low-confidence label. Small, generator-only (Rule 1).
3. **Public-KB caveat** (curation-gated): append the "candidates for faculty
   validation / TOP→CIP this fall" note to
   `cpl-knowledge-base/playbooks/map-exhibit-analysis.md` L29/L62 via
   `CURATION.md` — never a checkpoint side-effect.
4. **The parked Miramar comparison** (parallel CPL-Pathways lane): Sam's
   AskUserQuestion fork on how to present CPL magnitude on the card (the 104.2u
   is inflated by mutually-exclusive academies + tiny CE modules). Recommended
   option: counts-only + a lower/upper-division scope note. See the pathways
   lessons/handoff.

## Safety patterns honored
- Rule 7: measured before touching identity (the dry-run); did NOT regenerate the
  curated `discipline_canonical_subj4.json`.
- Rule 9: no `kb_curation` writes; the identity map is curator-owned.
- Merge-on-green (clean OR unstable); code-only PRs, cron/dispatch publishes
  artifacts. Side-lane discipline: numbered handoff + `cpl_todos.json` untouched.

## Moniker
StarBoard served this lane. Claim your own (Star*/Sky* precedent) or take Sam's
greeting if he names one.
