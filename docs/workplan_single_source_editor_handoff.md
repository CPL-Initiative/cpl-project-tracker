---
title: Workplan single-source editor + reflect-all + reorg-rekey completion — workstream handoff
created: 2026-07-27
updated: 2026-07-27
tags: [handoff, workplan, annual-workplan-goals, editor, associations, rekey, dashboard-tab, parallel-session]
related:
  - "[[CLAUDE]]"
  - "[[docs/workplan_single_source_editor_lessons]]"
---

# Handoff — the workplan single-source / reflect-all lane (from SkyElemental, 2026-07-27)

You are picking up a **dashboard side-lane** (not the CCR/M-ID mainline — leave the numbered
`session_<N>_handoff.md` + `cpl_todos.json` to that lane). Five merges + two live re-keys this run.

## What shipped (chronological)
- **#900 — COBI Element Map refresh** (`Dashboard_Element_Map.html`): Excel→Supabase, current
  4-Activity structure, read-only callout. Hand-maintained static file, Pages-served.
- **#902 — single-source title/description editor**: the Annual Workplan Goals tab is the ONE
  place to edit workplan titles + brief descriptions. `workplan_goals.js`
  `startDescEdit`(→`projects.description`) / `startActivityTitleEdit`(→`workplan_goals.name`) /
  `startActivityDescEdit`(→`workplan_goals.description`); generator emits `activity_desc`;
  `raci.js`/`master_report.js`/`generate_reports.js` de-hardcoded.
- **#905 — repeated-Activity-headers fix**: group `annual_goals` by the project's HOME Activity
  (`workplan_activity`), not `activity_ids[0]`; sort by (home, natural id). 9 headers → 4.
- **#909 — reflect EVERY project + finish the #872 re-key** (the big one; see below). Path A +
  X.Y.Z nesting + `has_ladder` read-only gating + the `is_percentage` all-zero fix.
- **4.7 → 4.5.1 re-home** (live data + regen, no PR): Legislative Advocacy nested under 4.5.

## Data changes applied live (receipts in `kb/`)
- `kb/supabase_workplan_goals_description.sql` (#902): +`workplan_goals.description`, 10 primary
  association backfills, Activity-5 purge, `5.1` delete, Activity-4 retitle.
- `kb/supabase_workplan_goals_rekey.sql` (#909): **the #872 crosswalk applied to `workplan_goals`**
  (two-phase TMP__ permutation) + dissolved `4.1`/`4.1.3` deleted + names synced to `projects.name`
  + 10 orphan association rows cleaned + `3.1.4` description filled.
- **4.7→4.5.1 rename** (this run — capture it in a receipt if you touch this area):
  `UPDATE projects / item_raci / item_updates / workplan_activity_associations
   SET id|item_id|project_id = '4.5.1' WHERE = '4.7'`. Verified: no `4.7` left, `4.5.1` under Activity 4.

## THE key finding (durable)
The **#872 Activities reorg re-keyed `projects` + `item_raci` + `item_updates` but LEFT
`workplan_goals` + `workplan_activity_associations` on the OLD numbering.** That silently mis-aligned
every Activity-4 ladder (off-by-one under the dissolved "4.1 Sprints and Projects" wrapper) and hid
10 projects from Annual Goals. **When you re-key, re-key EVERY project-keyed table** — discover the
full set from `information_schema.columns`. Project-keyed tables today: `projects`, `item_raci`,
`item_updates`, `workplan_activity_associations`, `workplan_goals`, `project_lifecycle`, `update_log`.
(⚠ `project_lifecycle` + `update_log` were NOT part of #872's SQL either — spot-check them before the
next re-key; they had no `4.7` rows this time but that's luck, not coverage.)

## Architecture now (Path A)
`projects` is the single source of the sub-activity tree; `workplan_goals` is a **by-id ladder
overlay**. `build_workplan_goals_from_supabase` builds `annual_goals` from the `projects` set, so
the Activities tab + Annual Goals can't drift again. A three-level id (X.Y.Z) nests under its X.Y
parent (indent + ↳); nesting is id-prefix based (`methodology-tree-from-dotted-ids-stable-keys`), so
re-homing = renumbering (like `4.7`→`4.5.1`). Blank-ladder projects render year/Current cells
read-only (gated on `has_ladder`); title + description stay editable (they PATCH `projects`).

## Read in order
1. `docs/workplan_single_source_editor_lessons.md` (both dated sections — the full story).
2. `docs/kb-notes/methodology-single-source-of-truth-flows-via-snapshot.md` (de-hardcode + the
   Path A "entity table authoritative, ladder as overlay" section).
3. `docs/kb-notes/methodology-rekey-every-id-keyed-artifact.md` (finish-every-keyed-table +
   the information_schema discovery step).
4. `docs/kb-notes/reference-workplan-activity-project-linking-model.md` (home field vs N-to-N).

## Carryover / next steps (this lane, all optional)
1. **Retire dead code**: `projects_editor.js` still loads (no-ops); `render_projects_grid_html` /
   `_render_single_project_card` defined-but-never-called + their CSS (static + generator injection).
   Focused follow-up PR, touches both Rule-4 HTMLs.
2. **Nest X.Y.Z on the Activities-tab CARDS** too (today only the Annual Goals *table* nests;
   `render_activity_kpis_html` groups flat by Activity). Confirm with Sam if he wants it there.
3. **"Add targets" affordance** so a curator can give a blank-ladder project (e.g. 1.1.1, 3.7, 4.5.1)
   year targets from the Annual Goals tab — would INSERT a `workplan_goals` GOAL+STRETCH pair (the
   add-row insert path exists at `workplan_goals.js:~1086`).

## Patterns / safety that worked
- **Fresh-read at write-time (Rule 9)** before each live re-key; verify with a post-write block.
- **Trace consumers with a subagent before a data/generator change** (Sam's standing reminder) —
  it confirmed RACI/Fact Sheet/reports need no change AND caught the 3 blank-row fixes.
- **The generator can't run in-sandbox** (openpyxl + no Supabase) — `pip install openpyxl` lets the
  pure functions import for the committed Python tests; verify end-to-end via a post-merge dispatch
  + a scheduled self-check.
- **Concurrency-serialized regens** (`daily-dashboard.yml` has `concurrency: group, cancel:false`) →
  a fresh dispatch queues safely behind an in-progress one; no push race.

## Moniker
I was **SkyElemental**. Next in this lane: coin your own (Sky*/Star*).
