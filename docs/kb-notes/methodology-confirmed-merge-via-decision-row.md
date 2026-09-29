---
title: "Confirmed merges via a decision row — never infer, never block the clean set"
created: 2026-07-08
kb-status: published
tags: [kb-notes, methodology, curation, rename, merge, supabase]
artifacts:
  - kb/_cred_rename_dryrun.py
  - kb/_cred_rename_apply.py
  - credential_reference.js (mergeTargetFor / pending-merges strip)
related:
  - "[[methodology-reserved-key-namespaces-on-overrides-table]]"
  - "[[adr-supersede-dont-mutate-synthetic-layer]]"
  - "[[methodology-paginate-postgrest-reads]]"
---

# Confirmed merges via a decision row

**Context.** A curator rename whose target already exists as an identity key
is ambiguous: typo, or deliberate merge? The CER rename pipeline (Cred-Ref
PR-5b) hit this live on 2026-07-08 — six AoJ code rows retitled onto
C-ID-anchored titles that already existed as credentials. Guessing either way
corrupts data: auto-merging a typo destroys a credential; auto-rejecting a
merge strands curator intent.

**The pattern (three rules):**

1. **A collision is a non-blocking decision QUEUE, never a gate on decided
   work.** The clean renames apply regardless. Prove disjointness rather than
   assuming it: here, a collision source always exists as an identity key
   while a clean target never does, so applying the clean set cannot touch a
   queued row. (The original `apply_safe` blanket-held the whole batch on any
   collision — 49 recorded renames stranded behind 6 undecided ones.)

2. **The merge decision is its own recorded row, naming the EXACT target.**
   `unified_title_merge_confirm` = the target string, written only by an
   explicit curator click behind a confirm dialog (same-save detection) or
   the pending-merges strip (for collisions saved before the affordance
   existed). The dry-run treats a confirm as valid ONLY when it equals the
   current override target — a re-title after confirming makes the confirm
   STALE and the row re-queues. Never infer a merge from the collision
   itself; never widen who can write the decision.

3. **Apply = fold + re-key, receipted, drift-guarded.** Records fold into the
   existing key with dedupe on the natural identity (normalized
   issuer+trainer); value re-keys reuse the rename machinery (a merge IS a
   rename downstream — the cardinality check `old_pre + new_pre == post` is
   additive-correct). Guard target drift (target renamed away between dry-run
   and apply → abort). Merges are NOT swap-reversible like renames (dedupe
   drops records) — the frozen receipt + git history are the rollback basis,
   and the receipt says so explicitly.

**Chain hazard worth remembering:** a confirmed merge whose target is itself
retitled in the same batch must stay queued (`merge_target_itself_retitled_
this_batch`) — otherwise the fold lands on a key the rename pass is about to
move, and the order of operations decides the outcome silently.

**Reusable when:** any curator-override lane can name an existing identity as
its new value — CCR merge targets, CSR canonical picks, discipline renames.
The ingredients: an exact-target decision row, a non-blocking queue, and an
apply that re-reads fresh state.
