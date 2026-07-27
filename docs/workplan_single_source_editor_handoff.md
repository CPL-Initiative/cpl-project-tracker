---
title: Workplan single-source editor + linking cleanup — workstream handoff
created: 2026-07-27
updated: 2026-07-27
tags: [handoff, workplan, annual-workplan-goals, editor, associations, dashboard-tab, parallel-session]
related:
  - "[[CLAUDE]]"
  - "[[docs/workplan_single_source_editor_lessons]]"
---

# Handoff — the workplan single-source editor lane (from SkyElemental, 2026-07-27)

You are picking up a **dashboard side-lane** (not the CCR/M-ID mainline — leave the numbered
`session_<N>_handoff.md` + `cpl_todos.json` to that lane). Two PRs merged this run.

## What shipped
- **#900 — COBI Element Map refresh** (`Dashboard_Element_Map.html`): rewrote the stale
  Excel-era doc to Supabase-first; new `tag-supabase`/`supa-ref` tokens; Section 2 = current
  4-Activity structure; read-only callout explaining edits happen via the signed-in editors.
  Hand-maintained static file, Pages-served, not regenerated, not Rule-4-mirrored.
- **#902 — single-source title/description editor**: the Annual Workplan Goals tab is now the ONE
  place to edit workplan titles + brief descriptions. `workplan_goals.js` gained `startDescEdit`
  (→ `projects.description`), `startActivityTitleEdit` (→ `workplan_goals.name`, keeps the
  "Activity N: " prefix), `startActivityDescEdit` (→ `workplan_goals.description`, new column),
  sharing one `inlineTextEditor`. Generator wires `activity_desc` store→`CPL_Data.js`. `raci.js`
  / `master_report.js` / `generate_reports.js` de-hardcoded to derive Activity titles from the
  snapshot. **A regen (`daily-dashboard.yml`) was dispatched post-merge** to publish it all.

## Data changes applied live (receipt: `kb/supabase_workplan_goals_description.sql`)
- Added + seeded `workplan_goals.description` (Activities 1–4).
- Backfilled real primary associations for the 10 projects that had none.
- Purged the dissolved Activity 5 (label rows + all associations + the 5.1/5.5 ghosts).
- Deleted tabled `5.1` AI-Ready California everywhere (re-addable later).
- Retitled Activity 4 → "Coordinate CPL Sprints, Targeted Projects, Professional Learning, and
  Strategic Partnerships".

## Read in order
1. `docs/workplan_single_source_editor_lessons.md` (the full story).
2. `docs/kb-notes/methodology-single-source-of-truth-flows-via-snapshot.md` (the de-hardcode +
   join-key pattern).
3. `docs/kb-notes/reference-workplan-activity-project-linking-model.md` (the two-links model).

## Carryover / next steps (this lane)
1. **Confirm the regen landed green** — the generator changes (render_annual_goals_table_html
   editable spans, build_activity_kpis `activity_desc`, `_load_workplan_goals` description select)
   could NOT be run in the sandbox (no Supabase reach). A self-check was scheduled ~12 min after
   merge; if the run tripped, read the job log and fix.
2. **Deferred — retire dead code**: `projects_editor.js` still loads via `<script>` in both HTMLs
   (no-ops, no `#projectsGrid`) + its CSS (static ~L3014 + generator injection ~L9924);
   `render_projects_grid_html` / `_render_single_project_card` are defined-but-never-called.
   Removal touches both Rule-4 HTMLs + the generator CSS injection — a focused follow-up PR.
3. **Optional — display the sub-activity description on the main Activities-tab cards**
   (`render_activity_kpis_html` renders only `kpi['name']`; the description is editable on the
   Annual Workplan Goals tab + shows in the RACI card summary, but not on the Activities cards).
   Low-severity; confirm with Sam whether he wants it visible there.

## Patterns / safety that worked
- **Measure the store before assuming the UI.** Sam said "no projects rows"; the DB had 33 — the
  `projects` table IS the sub-activity store (the reorg removed the Projects *grid*, not the rows).
  Reconciled before building. Keep the table, unify the UI.
- **Adversarial-review the diff.** It caught a dead de-hardcode (wrong join key) that py_compile +
  the passing tests missed. Guard the failure mode with a rename-flow test.
- **Fresh-read before destructive Supabase writes** (Rule 9). "Delete Activity 5" was 6 tables deep.
- **The generator can't run locally** — verify via py_compile + jsdom tests + a post-merge dispatch.

## Moniker
I was **SkyElemental**. Next in this lane: coin your own (Sky*/Star*).
