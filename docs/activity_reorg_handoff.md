---
title: COBI Activities reorg — handoff (continue from SkyPlan)
date: 2026-07-21
session: SkyPlan → next
tags: [cobi, dashboard, activities, handoff, remint]
related:
  - docs/activity_reorg_lessons.md
  - docs/activity_reorg_scope.md
  - kb/activity_reorg_alias_map.json
pr: "#872"
---

# You are picking up the COBI Activities Tab reorg

Sam commissioned a reorg of the **Activities** tab (`#tab-activities-projects`).
The **taxonomy is fully locked** and the spec is committed; what remains is the
generator render, the consumer wiring, and the **live Supabase re-key** (needs
Sam's ~15-min hold). This is a **SkyPlan side-lane** — leave the CCR mainline's
numbered handoff + `cpl_todos.json` untouched.

## Read in this order
1. **`kb/activity_reorg_alias_map.json`** — the authoritative old→new crosswalk
   (`_meta.final: true`). Everything downstream consumes it.
2. **`docs/activity_reorg_scope.md`** — decisions + phased migration plan.
3. **`docs/activity_reorg_lessons.md`** — the full story + what shipped.
4. The approved blueprint: https://claude.ai/code/artifact/c8b5eae3-2ccd-4724-9916-8dee1085138a

## Locked decisions (do NOT re-litigate)
- **4 Activities** (dissolve the phantom "Activity 5"). Keep the **"Activities"**
  label; **drop the 3 CPL-Goal chips** from cards (Path A; keep `cpl_goal` in data).
- **Render = Option B**: keep the Activity metric cards + their KPI/RACI/Update/
  Nudge affordances; nest every project **under its parent Activity**; delete the
  separate Projects grid (Activities tab) + the Projects table (Workplan Goals tab).
- **Sprints**: Veteran `4.1` (parents `4.1.1` 29 Palms) + Apprenticeship `4.2` kept
  as slim Activity-4 nodes; tracking lives in `3.1.2`/`3.1.3`; Statewide Adoption
  folds into `3.3`; a new `sprint_tag` (nullable, on `projects`) drives a filter chip.
- **Clean renumber**; `3.1.4` "Other Populations" is net-new (lead **Terence Nelson**);
  `5.1` AI-Ready CA is **held out** (tabled, not renumbered); Activity 3 retitled
  "Scale CPL Access, Awards, and Procedures".

## Already shipped (PR #872, draft)
📄 Workplan link (both HTMLs) · `PID_TO_KPI_KEY`/`PID_TO_KPI_BREAKDOWN` lockstep
(`4.1`/`3.1.3`) · Activity-3 fallback-label retitle · the spec (alias map + scope).

## The remaining build (order matters)

**Step 1 — Generator (Option B render).** In `excel_to_dashboard.py`:
- `render_activity_kpis_html` (~L1924): render each Activity group's **projects
  nested under it** (they already carry `workplan_activity`; nest deeper by dotted-id
  depth). Preserve the per-card KPI + `👥 RACI`/`📝 Update`/`📣 Nudge` affordances.
- **Delete** the separate-category injections: `render_projects_grid_html` (~L2911,
  the `<h2>Projects (N)</h2>` grid grouped by Goal) + `render_awg_projects_section_html`
  (~L3124, the Workplan-Goals Projects table) + the `activity_layer_ids` `"5."`
  carve-out (~L11208) + the injection blocks (~L11994, ~L12230).
- Unwind the **sprint-composite** (`SPRINT_IDS` L1460 = the old 4.1.x list;
  `build_activity_kpis` 4.1 composite L1641-1685) — 4.1/4.2 are now real nodes.
- Remove the `"5"` key from the 3 fallback dicts (L1626/L2367/L10226) + the
  id-prefix→"5" backfills (L10320, L10036).
- **Drop the Goal chips** (Path A) + **emit `sprint_tag`** onto cards + a filter chip.
- ⚠ The generator reads Supabase, so it **won't fully run in the sandbox** — `py_compile`
  + reason carefully; the true verification is the regen on the runner (Step 5).

**Step 2 — Static HTML (both, Rule 4).** Remove the `data-sections` "Projects"
scroll-spy entry (~L4231) + the `#projectsGrid`/`#awgProjectsSection` shells if they
don't regenerate away. Keep `CPL_Dashboard.html` == `index.html` (diff to confirm).

**Step 3 — Consumers + tests.** `project_add.js` suggestId → `N.x` under the chosen
Activity (not `5.N`, L44-52); drop the `5.`-carve-out in `project_lifecycle.js`
(L303) + `raci.js`; reconcile the drifted `ACTIVITY_DESC` dicts (`master_report.js`
L43, `report_generator.js`/`generate_reports.js` L236, `annual_report.js` L237).
Update `raci.test.js`, `project_lifecycle.test.js`, `assoc_editor.test.js`,
`master_report.test.js`; add a "no Activity 5 / `sprint_tag` filters" guard.
`npm test` green.

**Step 4 — LIVE RE-KEY (Phase 2 — gate on Sam's hold).** Rule 9: fresh live read
at write-time. **Re-run a dry-run first** (the committed map was validated against an
earlier draft — see the lessons caveat). Then, in ONE transaction, the **two-phase
permutation** (`TMP__` prefix → final) across `projects.id`, `item_raci.item_id`,
`item_updates.item_id`, `project_lifecycle.project_id`, `workplan_goals` assoc; plus
`alter table projects add column sprint_tag text` + populate; insert `3.1.4`; merge
dissolves (union RACI; re-key updates); retitle Activity 3 across every Activity-3
`workplan_activity`. Preserve the non-project header rows (`item_raci` 1-4;
`item_updates` 1/3). Commit a receipt.

**Step 5 — Regen + verify + merge.** `workflow_dispatch` `daily-dashboard.yml`,
**inspect the regenerated HTML** (Activities tab: 4 Activities, projects nested, no
Projects grid, no Goal chips, sprint filter works; KPI cards resolve), then mark #872
ready + squash-merge on green.

## Safety patterns to honor
- Rule 9 (fresh read at write-time; Sam curates live). Rule 4 (HTMLs identical).
  Rule 1 (generator replaces sections — change the generator, not the HTML, except
  the static wrapper header/tab shells).
- The re-key is a live PK renumber on a table Sam curates against → **atomic, verified,
  with a fresh dry-run.** The alias map IS the rollback map.

## Moniker
SkyPlan named this lane. Coin your own or carry SkyPlan-II. Sam's tone is rapid-fire
redlines — prototype visuals, lock, then build.
