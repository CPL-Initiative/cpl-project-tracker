---
title: COBI Activities reorg — live re-key DRY-RUN receipt
date: 2026-07-21
session: SkyPlan-II
status: DRY-RUN CLEAN — staged, NOT executed (gated on Sam's ~15-min hold)
project: hvuwhnbuahrtptokpqfh (Work Plan)
crosswalk: kb/activity_reorg_alias_map.json
sql: kb/activity_reorg_out/2026-07-21/rekey.sql
tags: [cobi, activities, remint, supabase, dry-run, receipt]
---

# Live re-key dry-run — read-only verification (2026-07-21)

Re-ran the crosswalk against **live** Supabase (per the lessons caveat: the alias
map was edited after the original `verify-activity-reorg-crosswalk` run, so the
sprint-symmetry + `1.1.x` nesting edits needed a fresh check). **Result: CLEAN —
no defects; every current row is covered exactly once.** Execution is still gated
on Sam's hold + a final fresh read at write-time (Rule 9).

## 1. Coverage — all 34 live `projects` ids accounted for, exactly once
- **Unchanged (16):** 1.1–1.4, 2.1–2.4, 3.1, 3.1.1, 3.1.2, 3.2, 3.3, 3.4, 3.5, 3.6
- **Re-keyed (15):** 3.1.2a→3.1.3 · 4.1.1→4.1 · 4.1.4→4.1.1 · 4.1.2→4.2 · 4.2→4.3 ·
  4.3→4.4 · 4.4→4.5 · 4.5→4.6 · 5.2→1.1.1 · 5.3→1.1.2 · 5.6→1.1.3 · 5.4→3.7 ·
  5.7→3.8 · 5.5→4.4.1 · 5.8→4.7
- **Dissolved (2):** 4.1 (wrapper, delete) · 4.1.3 (Statewide Adoption → merge 3.3)
- **Held out (1):** 5.1 (AI-Ready California, tabled — untouched)
- **New (1):** 3.1.4 Other Populations (lead Terence Nelson)

Final: **33 project rows** (32 active + tabled 5.1), per-activity **A1:7 · A2:4 ·
A3:12 · A4:9** — matches `alias_map.counts`.

## 2. History rows (keyed by `item_type='project'`, `item_id`)
- **`item_raci`:** every one of the 34 projects has exactly 1 RACI row; the
  activity headers `1`,`2`,`3`,`4` (`item_type='activity'`) are present and are
  **left untouched** by the re-key (they stay valid — Activities 1–4 are retained).
- **`item_updates`:** activity headers `1`,`3` present (untouched). Project update
  rows exist for most ids; notable counts: `3.3`×2, `3.6`×3, `4.1`×2, `4.5`×2,
  `5.4`×2. No update rows for `4.1.3`, `4.3`, `5.8` (nothing to carry there).

## 3. The two content-judgment steps (both resolved from live data)
- **Old `4.1` wrapper's 2 update rows** → re-homed by content:
  - `id 73` (2026-07-02) — *"The Apprenticeship Sprint is building CPL
    infrastructure…"* → **new `4.2`** (Apprenticeship). Unambiguous.
  - `id 61` (2026-07-02) — *"All four Sprints or Demo Projects are well
    underway…"* → **new `4.1`** (Veteran node) per the alias map. ⚠ This one is a
    **general** all-sprints note, not Veteran-specific — confirm with Sam at
    execution whether it should instead live at the Activity-4 level or on 4.1.
- **`4.1.3` RACI → merge into `3.3` (union):** `3.3`'s R = Terence Nelson; `4.1.3`'s
  R = Crystal Nasio, who is **already in `3.3`'s C list**. A/C/I lists are otherwise
  identical. So "keep 3.3's assignment, add any 4.1.3 assignee not already present"
  = **3.3's RACI is effectively preserved unchanged.** Low-risk.

## 4. Execution checklist (at Sam's hold)
1. Fresh coverage query (§1's query in the git history of this file / rekey.sql
   header) — confirm the live id set is still exactly these 34.
2. Confirm `item_raci`/`item_updates` have **no FK** to `projects.id`.
3. Run `rekey.sql` as ONE transaction; inspect the VERIFICATION block; COMMIT only
   if every value matches. Roll back otherwise (the alias map is the rollback map).
4. Then: `workflow_dispatch daily-dashboard.yml` → inspect the regenerated
   Activities tab → mark #872 ready → squash-merge on green.

**No live write was performed in this dry-run.**
