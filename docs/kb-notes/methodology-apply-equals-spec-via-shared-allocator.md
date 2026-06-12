---
title: Re-mint applies — recompute through the dry-run's own allocator, gate on byte-fidelity to the reviewed plan
date: 2026-06-12
kb-status: published
type: methodology
tags: [kb, remint, apply, dry-run, alias-map, subj4, playbook, supabase]
artifacts:
  - kb/_subj4_dryrun.py (compute_plan — the shared allocator)
  - kb/_subj4_apply.py (the consumer: P1–P3 + G1–G8 gates)
  - kb/_post_apply_chain.py (the downstream chain driver)
  - kb/subj4_fold_out/2026-06-12/ (first receipts under this pattern)
related:
  - docs/kb-notes/methodology-alias-map-resolution-semantics.md
  - docs/coursecontrolnumber_remint.md
  - docs/ccr_cluster_cleanup_lessons.md (Session 50)
---

# Re-mint applies: recompute through the dry-run's own allocator, gate on byte-fidelity to the reviewed plan

## The problem

A re-mint has two conflicting needs at apply time:

1. **The operator approved a specific frozen plan** (the dry-run receipt) —
   the apply must execute *that*, not something new.
2. **Inputs are live** (curation keeps moving; the THEA revert landed one
   minute after a cron read) — the apply must run against *fresh* state,
   never a stale snapshot.

The two naive designs each fail one need. *Consume the frozen plan verbatim*
(the 2026-05-23 apply) executes the approval but goes blind to drift — and
leaves the consumed receipt's `_status` lying (`DRY-RUN` on an applied map
misled two later sessions; Session 42). *Recompute from scratch* is fresh but
unreviewed.

## The pattern

- **Extract the allocator into a pure function** (`compute_plan()`) inside
  the dry-run module; prove the refactor by re-running the dry-run and
  byte-diffing its artifacts. The dry-run and the apply now share one
  allocation brain — apply == spec **by construction**, not by careful
  copying.
- **The apply recomputes the plan at write-time** from fresh inputs
  (including a `--curation-export` fresh-read whose rebuild must equal the
  committed overlay — gate P3), then **byte-compares the recomputed plan to
  the frozen reviewed plan** (gate P1). Identical → the approval transfers to
  the fresh run. Drift → ABORT and re-review (an explicit
  `--allow-plan-drift` exists for the re-approved case).
- **Restamp the consumed plan's `_status`** at apply time (a receipt's
  status is itself a receipt), and write the apply's own receipt to a NEW
  dated dir — never over a receipt already registered in
  `_rekey_promotions.py` ALIAS_MAPS.
- **Simulate mirror-op ordering against the live PK before executing.**
  Under slot reuse, chained re-sequencing (`M1006→M1005` while
  `M1005→M1004`) transiently collides on a `(course_id, field)` PK if a fill
  precedes its vacate. One loop over the op list against the exported key
  set proves the order safe (or demands a two-phase rename). Verify the
  post-write state by checksum AND by rebuilding the overlay from a fresh
  export — it must equal the committed file, making the next cron sync a
  content no-op.
- **Pass-through copies for planning, pristine reloads for writing.** The
  allocator overlays curated disciplines onto its in-memory view; the apply
  must reload the files separately so curated values are never baked into
  the KB baseline.

## Proof it pays

First use (the 2026-06-12 SUBJ4 canonical fold): 71,037-alias permutation,
48,820 moves, recomputed == frozen byte-identically, 119 Supabase ops with 0
transient PK collisions in simulated order, post-write md5 == derived
expectation, `subject_collision_signal` 1,206 → 3. Total incremental cost of
the pattern over a verbatim-consume apply: one refactor proven by byte-diff
plus ~40 lines of gates.
