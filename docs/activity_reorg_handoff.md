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

## Already shipped (PR #872, draft) — Steps 1-3 DONE + verified, Step 4 STAGED

**SkyPlan-II built Steps 1-3 and staged Step 4** (2026-07-22, all on the branch;
`npm test` green, 167 files). Full story: `docs/activity_reorg_lessons.md` (2026-07-22).

- ✅ **Step 1 — Generator Option-B render** (`excel_to_dashboard.py`): `build_activity_kpis`
  nests every active project under its Activity (dropped `core_ids` gate + the 4.1
  composite; carries `sprint_tag` + `depth`); `render_activity_kpis_html` = one grid per
  Activity, no Goal banners (Path A), child-depth accent, filter data-attrs, ◆ sprint badge;
  the standalone Projects grid + AWG Projects table injections dissolved (kept Tabled &
  Archived); phantom "Activity 5" fallbacks removed. **Verified offline** (snapshot + local
  re-key → render → Chromium screenshots; full generator regen exit 0).
- ✅ **Step 2 — Static HTML** (both, Rule 4, identical): dropped the "projects" scroll-spy
  entry; added `#filterSprint` to the static actions bar.
- ✅ **Step 3 — Consumers + tests**: `raci.js` titles canonical; `project_add.js`
  `suggestId(ids, activityNum)`; `dashboard_filters.js` ◆ Sprint filter (+ collapse empty
  groups); new `tests/activities_sprint_filter.test.js`. (Report `ACTIVITY_DESC` titles
  left UNCHANGED — see the open decision below.)
- ✅ **Step 4 — re-key STAGED** (`kb/activity_reorg_out/2026-07-21/`): fresh **read-only**
  dry-run against live Supabase = CLEAN (all 34 ids covered once); `rekey.sql` ready. Also
  already on-branch from SkyPlan: 📄 Workplan link + the `PID_TO_KPI_KEY`/`_BREAKDOWN` lockstep.

## Sam's decisions — RESOLVED (2026-07-22)
1. **Visual** ✅ LOCKED — "Looks great!" on the preview.
2. **Report titles** ✅ ALIGNED — `master_report.js` + `generate_reports.js` A3 title/shortTitle
   → "Scale CPL Access, Awards, and Procedures" / "CPL Access, Awards & Procedures"; A4 →
   "Sprints, Projects & Partnerships" (descriptions already fit, left as-is). Commit `21625b3`.
3. **Tabling** ✅ KEPT — Sam: "keep tabling function somewhere." The 🗄 control now mounts on the
   nested `.activity-kpi-card`s (was grid-only); the `activityLayerIds()` immune gate is dropped
   from mount + reconcile (post-reorg it marked everything immune). Every active sub-activity is
   now tableable (reviewer-gated + reversible). `project_lifecycle.js` + its test (53 assertions).
   Commit `268d6bc`. (The assoc-editor being obsolete was accepted implicitly — nesting is the
   association now.)

## Re-key EXECUTED + MERGED (2026-07-22)
The live re-key ran in Sam's hold — a fresh read confirmed the 34-id set unchanged + no FK on
the history tables; the inline verification gate passed → committed. #872 squash-merged
(`89e6de1`); regen dispatched (`701c06a`) → the Activities tab is **live** (33 projects, sprint
tags, Activity-3 retitle, 3.1.4, RACI/updates carried across). Regenerated HTML verified: 0
`#projectsGrid`, 0 goal-subheaders, 32 nested `data-sprint` cards, `#filterSprint` present,
`CPL_Dashboard.html == index.html`.

## ⚠ KNOWN FOLLOW-UP — re-key the `workplan_activity_associations` table (NOT yet done)
The live re-key covered `projects` / `item_raci` / `item_updates` but **missed the N-to-N
`workplan_activity_associations` table** (the alias map's apply-order listed it; `rekey.sql`
didn't). It still holds OLD project ids (`5.2`, `4.1.1`, `3.1.2a`…) + rows pointing at the
dissolved **Activity 5** → the Workplan-Goals tab's "Contributes to" chips + editor show a
stale "Activity 5". **The main Activities tab is unaffected.** (Supabase MCP disconnected at
wrap-time, so this is staged, not run.)

**Recommended fix** — reorg-aligned: one primary per project = its nesting Activity; cleanly
drops Activity 5 + the now-obsolete N-to-N secondaries. Check the table's columns/NOT-NULL
defaults first, then:
```sql
BEGIN;
DELETE FROM public.workplan_activity_associations;
INSERT INTO public.workplan_activity_associations (project_id, activity_id, is_primary)
SELECT id, substring(workplan_activity from 'Activity[[:space:]]*([0-9]+)'), true
  FROM public.projects
 WHERE workplan_activity ~ 'Activity[[:space:]]*[0-9]';
COMMIT;
```
**Alternative** (preserve Sam's curated secondaries): two-phase re-key `project_id` old→new
like the main re-key, `UPDATE` the `activity_id='5'` rows to each project's real Activity,
dedup, drop the dissolved-project rows (old `4.1` wrapper, `4.1.3`). Either way, then dispatch
`daily-dashboard.yml` to republish. Sam declined to pick the approach at wrap-time — confirm
with him first.

**Step 5 — Regen + verify + merge.** `workflow_dispatch` `daily-dashboard.yml`,
**inspect the regenerated HTML** (Activities tab: 4 Activities, projects nested, no
Projects grid, no Goal banners, sprint filter works; KPI cards resolve), then mark #872
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
