---
title: SUBJ4 Canonicalization Apply — Phase 1e
date: 2026-05-23
session: 5c (Bruh Quad)
status: APPLIED — kb files mutated in place
tags: [remint, phase-1e, subj4-canonicalization, apply, m-id]
artifacts:
  - kb/subj4_apply/alias_map.json
  - kb/subj4_apply/validation.md
  - kb/subj4_dryrun/alias_map.json (source of truth pre-apply)
---

# SUBJ4 Canonicalization Apply — Phase 1e

## TL;DR

- **65311** aliases applied across 6 kb files.
- Apply timestamp: `2026-05-23T19:22:06Z`
- Source alias_map: dry-run dated `2026-05-23`.

## Per-file mutation counts

See `kb/subj4_apply/validation.md` for the per-file table.

## Downstream verification (handled by the apply workflow)

1. **Re-run dry-run** (`kb/_subj4_dryrun.py`) on the mutated state. Expected:
   - 0 `re_key` fates remaining (everything's now on canonical)
   - 100% `no_change` for all M-IDs with a discipline
   - 0 `subject_collision_signal` flags (post-apply receipt)
2. **Re-run auditor** (`kb/_row_audit.py`). Expected:
   - `subject_collision_signal` rule fires **zero** times
   - `mid_id_off_scheme` rule fires zero times (4-letter invariant clean)
3. **Apply Supabase live updates** — workflow loops through `aliases`,
   issuing `UPDATE kb_curation SET course_id = new_id WHERE course_id = old_id`
   for each. Best-effort per record with verbose logging — a single
   transient failure shouldn't strand the apply (operator can re-run
   the Supabase sweep from the alias map).

## Rollback (if needed)

Inverse alias map = `kb/subj4_apply/alias_map.json` read right-to-left
(new_id → old_id). Same rollback discipline as the 2026-05-22 re-mint:

1. `git revert` the apply commit on `main`.
2. Supabase: re-loop, swapping the UPDATE direction.
3. Stay inside one 10:17 UTC cron window — daily-dashboard.yml's
   simplified workflow doesn't touch the kb files, but its concurrency
   group serializes against the apply workflow.
