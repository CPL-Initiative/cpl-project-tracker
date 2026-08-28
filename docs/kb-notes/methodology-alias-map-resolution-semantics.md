---
title: "Alias maps are permutations, not graphs: resolution semantics for stacked re-keys"
created: 2026-06-11
kb-status: published
tags: [methodology, alias-map, re-key, remint, slot-reuse, data-integrity, promotions, ccr]
artifacts:
  - kb/_rekey_promotions.py (the corrected resolver + V1–V5 gates)
  - kb/_analyze_official_fold_evidence.py (lockstep analyzer)
  - kb/promotions_rekey_out/2026-06-11-slotfix/ (the corrective apply receipt)
related:
  - docs/kb-notes/methodology-witness-kinship-gate.md (the sibling lesson, one layer up)
  - docs/kb-notes/methodology-rekey-every-id-keyed-artifact.md (why the re-key exists at all)
  - docs/ccr_cluster_cleanup_lessons.md (Session 42 — the discovery story)
---

# Alias maps are permutations, not graphs

## The failure class

A re-key apply emits an alias receipt (`old_id → new_id`). A later tool wants
to resolve historical keys to current ids, so it loads every receipt and walks
them like a directed graph — "follow edges until stable." That walk is wrong
twice whenever the id space has **slot reuse** (one apply retires `A` and
simultaneously moves a *different* row into `A`):

1. **Within-map iteration follows slot-occupancy history, not the row.**
   A catalog-wide re-sequence produces entries like `ECON M1001 → ECON M1005`
   *and* `ECON M1005 → ECON M1010` in ONE receipt. Those are two simultaneous,
   independent moves. Iterating telescopes them into a nine-hop walk that
   lands a key on an unrelated course (`AGR M1001` ended at "INTRO TO
   STATISTICS"; its family is at `ECON M1001` "Agricultural Economics").
2. **A liveness shortcut ("key still exists → unchanged") pins records to
   slot-mates.** Under slot reuse, the slot being occupied says nothing about
   *who* occupies it. 830 of the 941 records the defective run called
   "unchanged" belonged to families that had moved away.

Measured on this repo's `kb/promotions.json`: **51% of the evidence index
(1,066 / 2,083 records) was mis-keyed** by the graph-walk version — and every
validation gate passed, because witness totals, target sets, key liveness, and
idempotency are all conserved by mis-routing.

A third trap compounds it: **status headers lie.** The chain included one map
whose directory said "apply" while its `_status` said DRY-RUN (the apply had
consumed the dry-run plan verbatim without restamping), and one genuinely
staged-only plan that was never dispatched. One was real, one was phantom —
the header couldn't tell them apart.

## The rules

1. **Apply each map AT MOST ONCE, in chronological order.** The carried id at
   each step is the row's id at that apply's moment; cross-map chains
   (subj4 → FL split → twin merge) compose correctly, within-map iteration
   never does.
2. **No liveness shortcut.** "Unchanged" is a *result* (`resolve(k) == k`),
   never a precondition.
3. **Only apply-confirmed maps enter the chain.** Confirm with apply receipts
   and ground truth, not the `_status` header. A staged plan joins the chain
   the day it is dispatched, not before.
4. **Era-stamp the re-keyed artifact** (`_rekeyed_through`: the list of maps
   folded into its keys). A later run applies only the suffix of new maps —
   re-running is a no-op, and a future re-mint just appends its map. Refuse
   mixed-era inputs (an artifact half-re-keyed by a defective run cannot be
   repaired in place; rebuild from the pre-defect baseline in git).
5. **Validate against per-row provenance stamps.** A stamp written on the row
   at apply time (`_subj4_remint_from`) travels WITH the row through every
   later re-key — it is the one artifact immune to slot reuse. Gate the apply
   on it (V5 here: 1,954 resolutions checked against stamps, 0 conflicts
   required).
6. **Restamp the receipt's `_status` at apply time.** If the apply consumes a
   dry-run plan verbatim, the copied header now describes a different reality.
   The stale header is what made the phantom and the real map
   indistinguishable.
7. **Self-test the resolver semantics on every run** — a three-line fixture
   (`{A→B, B→C}` must resolve `A→B`, not `A→C`) catches a regression to
   graph-walking forever.

## Relation to the kinship gate

The witness-kinship gate (the sibling note) validates evidence *content*
against the row at consume time; this note fixes evidence *keying* at re-key
time. They compose: the slot-fix puts receipts on the right rows, the gate
checks them there. The gate alone masked half the damage here — it correctly
blocked mis-keyed evidence as "stale" (lane noise), but could not know the
same evidence was *correct* for a row two slots over. After the slot-fix, 187
of 310 "stale-receipt" lane groups dissolved into legitimate auto-folds.

## The reusable checklist

When resolving historical keys through stacked re-key receipts:

1. List every receipt; for each, prove it was APPLIED (apply receipt +
   stamps), not just planned.
2. Establish whether any apply reused retired slots (count old-keys that are
   live in today's catalog — nonzero means permutation semantics).
3. Resolve single-step chronological, no shortcuts; era-stamp the output.
4. Cross-validate against per-row provenance stamps; assert zero conflicts.
5. Eyeball the destinations of the highest-witness records by title before
   shipping — and pick a validation family the bug could actually reach
   (Spanish was immune by construction here; it validated nothing).
