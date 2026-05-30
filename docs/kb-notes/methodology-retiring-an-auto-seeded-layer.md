---
title: Retiring an auto-seeded data layer — check for curator decisions riding on it
created: 2026-05-30
updated: 2026-05-30
tags: [methodology, kb, curation, supabase, data-migration, dissolution]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
artifacts:
  - kb/coci_curation.json
  - kb/coci_unified_courses.json
---

# Retiring an auto-seeded data layer — check for curator decisions riding on it

> **One-sentence summary** — Before deleting a machine-seeded layer, prove its
> rows are non-load-bearing AND grep every curation/pointer that references it,
> because curators quietly attach durable decisions to scaffolding.

## Context

This project carries several machine-seeded staging layers (minted M-IDs,
variant-unification clusters, discipline inferences). They feel disposable —
"just regenerate it" — but a layer that's been *visible in a curator tab* for a
while accumulates human decisions that point INTO it. Deleting the layer
silently orphans those decisions. Learned dissolving the `UC-XXXXX` clusters
(Session 19, 2026-05-30): 9 of 1,385 carried curator `merge_into` decisions.

## The claim

**A "regenerable" layer is only safe to delete after two independent checks:**

1. **Load-bearing check — are its rows duplicated elsewhere?** Trace every
   consumer (renderer, exports, indexes, lazy files). If the layer's content is
   *derived from* rows that exist independently (e.g. cluster members are
   singletons already emitted as Stand-Alone), dissolving it removes a
   duplicate, not data. If the layer is the *sole* home of some rows, deletion
   loses them — stop.

2. **Pointer check — does any curation/articulation/index reference it?** Grep
   the curation overlay (`merge_into`, key-by-id), articulation `course_id`, and
   any search index for ids in the layer. Curators attach decisions to whatever
   row is in front of them; a seeded id can become a merge target or a merge
   *source*. These pointers are the real migration scope.

**Then migrate the pointers BEFORE deleting**, and measure the migration first —
the work is often already half-done. (Here, 16/17 per-member equivalents already
existed because the curator had also used the level-safe worklist; the "bulk
migration" was 1 insert + 9 deletes.)

## Mechanics that made it safe

- **Source-of-truth first.** Curation lives in Supabase (`kb_curation`),
  projected to git JSON by a daily sync. A durable migration writes Supabase
  (one atomic transaction on the composite PK), then mirrors the same edit into
  the committed JSON so `main` matches what the next sync reproduces. Editing
  only the JSON gets wiped on the next sync.
- **Archive before emptying** (`archive/<file>_<date>_pre-dissolution.json`) +
  stamp `_dissolved_at`/`_dissolved_note`/`_dissolved_archive` on the live file.
  Reversible, and the next reader knows what happened and why.
- **Verify in isolation** via a test-seam output dir (here `UC_OUT_DIR=/tmp/…`)
  so you confirm the post-dissolution artifact (counts, members intact, pointers
  resolve) without clobbering production files another job owns.
- **Watch for a quieted auditor as confirmation.** Removing the redundant
  cluster-key merges cleared 9 `cluster_member_unresolved` findings — the
  auditor had been flagging exactly the scaffolding we retired. A clean drop in
  a relevant rule count is corroboration the migration was correct.

## Anti-patterns this guards against

- **"It's machine-generated, just delete it."** True for the *bulk*, false for
  the rows a human has touched. The 9 curated clusters looked identical to the
  1,376 junk ones until you read the curation table.
- **One label, two mechanisms.** "Cluster" meant both auto-seeds and curator
  merge targets here; the auditor only ever saw the latter, so the headline
  count (10) hid the real population (1,385). Disambiguate a category before
  "eliminating" it, or you'll delete the wrong half.
