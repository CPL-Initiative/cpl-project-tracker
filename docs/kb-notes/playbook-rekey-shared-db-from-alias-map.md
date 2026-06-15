---
title: Re-keying a shared DB from a committed re-mint alias map
created: 2026-06-15
updated: 2026-06-15
tags: [playbook, remint, supabase, alias-map, re-key, data-integrity, rule-7]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/coursecontrolnumber_remint]]"
  - "[[docs/kb-notes/methodology-alias-map-resolution-semantics]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
artifacts:
  - kb/_rekey_kb_curation_supabase.py
  - .github/workflows/supabase-rekey.yml
  - kb/uc_cur_zscheme_out/2026-06-15/alias_map.json
---

# Re-keying a shared DB from a committed re-mint alias map

> A re-mint must re-key the LIVE shared table too, but its alias map is thousands
> of arbitrary pairs — too large to hand-pass as SQL. Read the committed alias
> file from a service-key script run in CI, and verify with an md5 set-equality.

## Context

Every Rule-7 re-mint re-keys two things in one cron window: the git overlay
(deterministic, offline — the `*_apply.py` scripts) **and** the live Supabase
source-of-truth (because the daily cron rebuilds the git overlay *from* Supabase,
so a git-only re-key is reverted on the next sync). The live half is the
operationally awkward one. Discovered doing the UC-CUR → Z re-mint (Session 56,
PR #439): 4,053 `course_id` renames + 4,053 `merge_into` value rewrites.

## The claim

**Do not hand-pass a re-mint alias map into a SQL tool.** The mapping is N
arbitrary `(old, new)` pairs (here ~106 KB of `VALUES`); an agent cannot
faithfully reproduce that many random strings into a tool parameter, and a single
garbled pair silently mis-keys a live row — the worst kind of data bug. Three
rules:

1. **Read the alias file; don't retype it.** The committed `alias_map.json`
   receipt is the exact mapping. A small script loads it and applies the re-key —
   no thousands-of-pairs string ever passes through a prompt or a tool call.
   `kb/_rekey_kb_curation_supabase.py` is the reusable tool: it PATCHes
   `kb_curation` (course_id rename + `merge_into` value rewrite) via PostgREST,
   idempotent (a clean bijection, so a re-run only touches rows still on an old
   key), retried with backoff, and self-verifies 0 old keys remain.

2. **Run it where the secret lives — CI, not the session.** The service-role key
   is a GitHub Actions secret, never in the session env. A one-shot
   `workflow_dispatch` workflow (`.github/workflows/supabase-rekey.yml`, input
   `alias_map_path`) runs the script with `SUPABASE_SERVICE_KEY`. Reusable for
   every future re-mint — just point the input at its receipt.

3. **Verify with an md5 set-equality, both sides, twice.** Before the write, prove
   the re-key *surface* hasn't drifted: `md5(string_agg(id ORDER BY id))` of the
   old-key set, git vs live — byte-identical is the fresh-read safeguard. After
   the write, prove the result is *exactly right*: the same md5 of the resulting
   new-key set vs the alias map's `new_id`s — an exact match proves correctness
   independent of how the re-key ran. One number, definitive, cheap.

## How we got here

The naïve path — pass `UPDATE … FROM (VALUES …)` to the SQL MCP — fails on size
and on reproduction fidelity. A temp-table form halves the bytes (pairs once, not
twice) and compacting the shared `UC-CUR-AUTO` prefix shaves more, but it is still
~106 KB of irreducibly-random pairs that an agent cannot emit token-perfect. The
service-key-script-in-CI path sidesteps the problem entirely (the file is the
source of truth) and is the same shape the manual "re-keyed Supabase live in the
same session" step of past re-mints should have been. The md5 checks made the
whole thing auditable: the pre-write git↔live match (no drift → the dry-run alias
map is valid against live) and the post-write set match (`60b1995…` == the alias
map's Z-set) bracketed the live write with proof.

## When this applies (and when it doesn't)

- **Applies** to any re-key of a LIVE shared table whose mapping is large and
  arbitrary (re-mints, bulk renames). The bigger the map, the more this matters.
- **Doesn't apply** when the transform is *formulaic* (derivable in SQL from
  existing columns) — then a small hand-written `UPDATE` is fine and a file is
  overkill. The Z re-key was hash→semantic (a title-sorted seq), so not formulaic.
- The **git** half stays offline + deterministic (the `*_apply.py` scripts); this
  note is only about the **live shared** half.
- Idempotency depends on a **clean bijection** (no slot reuse). If a re-key reuses
  retired keys, see `[[docs/kb-notes/methodology-alias-map-resolution-semantics]]`
  — re-running is no longer a safe no-op.

## See also

- `[[docs/ccr_cluster_cleanup_lessons]]` — Session 56, the workstream that produced this
- `[[docs/uc_cur_zscheme_remint_scope]]` — the re-mint scope
- PR `#439` — the implementation
- `[[docs/coursecontrolnumber_remint]]` — the canonical re-mint playbook

---

*Authoring check: durable (re-mints recur), reusable (the script + workflow are
general infra), distilled (one concept: read-the-file-in-CI + md5-verify),
self-contained.*
