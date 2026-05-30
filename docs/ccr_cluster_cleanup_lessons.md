---
title: CCR Cluster Cleanup — Lessons & State
date: 2026-05-30
last_updated: 2026-05-30
session: 19 (CCR cluster dissolution)
tags: [ccr, unified-courses, cluster, dissolution, curation-migration, supabase, m-id]
artifacts:
  - kb/coci_unified_courses.json (clusters dict emptied)
  - kb/coci_curation.json (9 cluster-key merges → per-member)
  - excel_to_dashboard.py (export_unified_courses cluster-load note)
  - archive/coci_unified_courses_clusters_2026-05-30_pre-dissolution.json
related:
  - docs/kb-notes/methodology-retiring-an-auto-seeded-layer.md (the durable pattern)
  - CLAUDE.md "Cluster lifecycle" rule (Knowledge Base & Unified Courses section)
  - kb/README.md (_seed_coci_unified_courses.py row)
---

# CCR Cluster Cleanup — Lessons & State

Running record for the Common Course Reference (CCR) cluster-dissolution
workstream. Sam's ask: "camp on the common course crosswalk and clean up all
the courses tagged as Cluster … change our CCR rules to clarify why or if they
are needed — hopefully, just eliminate the whole cluster category."

## TL;DR / current state (2026-05-30)

- **Dissolved** the 1,385 auto-seeded `UC-XXXXX` variant-unification clusters
  (`coci_unified_courses.json` `clusters` dict → `{}`; archived first).
- **Migrated** the 9 clusters that carried curator `merge_into` decisions to
  **per-member `merge_into`** rows in Supabase `kb_curation` + `coci_curation.json`
  BEFORE dissolving, so no curator decision was lost.
- **Result:** CCR `id_system: Cluster` rows dropped from ~1,376 → **10**
  (9 curator merge-target M-IDs + 1 `UC-CUR-*`). Those 10 come from the
  `merge_members` path, NOT from `coci_unified_courses.json`.
- **Open follow-on (Sam's call):** whether merge targets should keep the
  `"Cluster"` label or revert to their native `id_system` (M-ID), which would
  retire the category *name* entirely.

## What the auto-seeded clusters were

A one-shot 2026-05-21 pass (`_seed_coci_unified_courses.py`) tried to merge
M-IDs that are spelling/word-order/abbreviation *variants* of the same course
("Intro to Psychology" == "Introduction to Psychology"). Its grouping key:
lowercase → strip punctuation → drop filler words → **sort the remaining
tokens** → join.

**The defect:** sorting tokens collapses distinct course *levels*. "Algebra 1:
Part 2" and "Algebra 2: Part 1" both sort to `1 2 algebra part` → wrongly merged
into one cluster. Confirmed empirically. The seed's own header claims "LEVEL
words/numbers are PRESERVED so course levels never collapse" — true for
"I"/"II" in trailing position, but token-sort defeats it for mid-title numbers
like "Part 1"/"Part 2".

## Why dissolution was safe (traced every consumer)

1. **Members already double-emitted.** Cluster members are singleton M-IDs that
   the standalone-row loop emits regardless of cluster membership (it only skips
   `merge_into`/`merge_members`, which are curation-sourced — never the
   `UC-XXXXX` member lists). So dissolving removed a *duplicate* grouping, not
   the underlying rows. Verified post-regen: MATH M10AC/M10AD, FIRE M10AR/M10AS,
   etc. all present as Stand-Alone.
2. **Zero articulations** reference any cluster (`course_id`/`identity_system`
   are all M-ID or C-ID). No payoff-layer linkage lost.
3. **Members file / xlsx / details** all derive cluster content from members →
   singletons cover them.
4. **Suggested-merges worklist is the safety net.** The dissolved cross-college
   members resurface as `singleton_groups` (1,350 after regen) for proper,
   level-safe, curator-confirmed review.
5. **Client + generator handle empty gracefully** — every `for … in clusters`
   loop no-ops; Kind/Source filters return empty.

## The migration discovery (the session's measure-first win)

The plan said "migrate the 9 curated clusters to per-member merges." Measuring
the actual curation state revealed **16 of the 17 per-member merges already
existed** — Sam had used the worklist, which writes per-member `merge_into`. The
9 `UC-XXXXX`-keyed merges were **redundant duplicates** riding alongside. So the
migration shrank to:

- **Add 1** missing per-member merge: `PHYS M11WB → PHYS M1265` (UC-00527 had
  PHYS M11WA per-member but not its sibling).
- **Delete the 9** redundant cluster-key rows (explicit IDs, never the
  `value`-side `UC-CUR-*`).

Applied atomically in one Supabase transaction (composite PK `(course_id,
field)`), mirrored into `coci_curation.json` (48 → 40 entries) to match what the
next daily `_apply_curation.py` sync produces.

**Side-benefit:** cleared all 9 `cluster_member_unresolved` auditor findings —
they fired *because* the redundant cluster-key merges added unresolvable
`UC-XXXXX` ids to each target's member set. Honest data → quieter auditor.

## Lessons

- **Measure the curation state before "migrating" it.** The redundancy
  (16/17 already done) meant the risky-sounding migration was a 1-insert /
  9-delete operation. Counting first turned a feared bulk-rewrite into a
  surgical edit.
- **An auto-seeded layer can have curator decisions riding on it.** The 9
  curated clusters were the trap: dissolving naively would have orphaned
  `merge_into` decisions. Always grep curation/articulation/index pointers INTO
  a layer before deleting it. (Generalized in the KB note.)
- **Verify in isolation with the `UC_OUT_DIR` test seam.** `export_unified_courses()`
  to `/tmp` proved the dissolved state (10 Cluster rows, 0 UC-0, members intact)
  without clobbering the daily-run-owned production files.
- **Two mechanisms shared one label.** "Cluster" meant both the auto-seeds AND
  curator merge targets. Naming-overload like that hides the real population —
  the auditor only ever saw the 10 curator clusters; the 1,376 auto-seeds were
  invisible to it. Disambiguate before "eliminating a category."

## Roadmap / next steps

1. **Surface the merge-target-label follow-on to Sam.** Keep "Cluster" for
   curator merges, or relabel them M-ID (retires the category name; touches the
   `merge_members` emission at `excel_to_dashboard.py` ~5503 + the auditor's
   cluster-from-merge logic + the CCR Kind filter).
2. **Continue camping on the crosswalk** (Sam's stated intent): the
   Suggested-merges worklist (`singleton_groups`, 1,350 candidates; 214
   same-college flagged) is now the front door for variant unification —
   curator-confirmed, level-safe.
3. If clusters never come back, consider removing the now-dead
   `coci_unified_courses.json` load + emission loops from the generator (kept
   for now as graceful no-ops + provenance).
