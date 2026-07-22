---
title: COBI Activities Tab reorg — lessons (SkyPlan)
date: 2026-07-21
session: SkyPlan
tags: [cobi, dashboard, activities, projects, workplan-goals, supabase, remint, lessons]
artifacts:
  - kb/activity_reorg_alias_map.json
  - docs/activity_reorg_scope.md
  - excel_to_dashboard.py
  - CPL_Dashboard.html
  - index.html
related:
  - docs/activity_reorg_handoff.md
  - docs/annual_workplan_authoritative_scope.md
  - docs/kb-notes/methodology-adversarial-verify-crosswalk-before-live-rekey.md
blueprint: https://claude.ai/code/artifact/c8b5eae3-2ccd-4724-9916-8dee1085138a
pr: "#872"
---

# COBI Activities Tab reorg — lessons

## 2026-07-21 — SkyPlan (taxonomy locked, spec shipped, generator render + re-key pending)

### The ask (Sam)
Realign the COBI **Activities** tab to the CPL Workplan: get the levels right
(goal / activity / sub-activity), **consolidate the separate "Projects" category
into the Activities**, fold the **Veteran/Apprenticeship Sprints** (which duplicate
Activity work) into the right Activities, and add a **link to the CPL Workplan** on
the tab.

### The keystone finding
The [authoritative CPL Workplan (July 2025)](https://map.rccd.edu/wp-content/uploads/2025/07/credit-for-prior-learning-workplan.pdf)
— read from the canonical copy at `cpl-knowledge-base/policy-and-funding/cpl-workplan-2025.md`
because **`map.rccd.edu` is egress-blocked from the sandbox** — has exactly **4
Activities** (+ 3 cross-cutting CPL Goals). The tracker's **"Activity 5: Strategic
Initiatives & Special Projects" is invented** — it exists ONLY as a hardcoded
fallback label; the *data never held an Activity 5*. Every `5.x` project already
declared its true parent in `workplan_activity`. So "fold projects into activities"
was **already how the data was wired** — the render just overrode it to force a
separate Projects bucket. Activity 4 literally *is* "Coordinate CPL Sprints,
Targeted Projects, and Partnerships," so the sprints belong there by definition.

### The sprint "duplication"
A Sprint is authoritatively a **cross-cutting campaign** (`cpl-knowledge-base/methodology/sprint-based-execution.md`;
the Veteran Sprint Plan: *"the master project, delivered through components"*)
whose goals ARE Activity-2/3 work — which is why they read as duplicates. Five
overlap pairs found (e.g. `4.1.1 Veteran Sprint` and `3.1.2 Veterans tracking`
pinned to the *same* live Military figure; `4.1.3 Statewide Adoption`'s own budget
field literally said *"Included in 3.3"*).

### Decisions locked (all Sam, 2026-07-21)
1. **Workplan model** — 4 Activities; the 3 CPL Goals were Vision-2030 overlay.
2. **Blend + Sprint tag** — Veteran (`4.1`) + Apprenticeship (`4.2`) kept as slim
   Activity-4 campaign nodes (Veteran parents the `4.1.1` 29 Palms demo — Sam's call:
   a demo is a *component* of the sprint, so it nests under it); tracking numbers
   live once in `3.1.2`/`3.1.3`; Statewide Adoption folds into `3.3`; a cross-cutting
   `sprint_tag` preserves the campaign view. Veteran KPI card untouched.
3. **Clean renumber** — re-key PKs; carry `item_raci`+`item_updates` across.
4. **Render = Option B** — keep the Activity metric cards + their KPI/RACI/Update/
   Nudge affordances; nest every project *under its parent Activity*; delete the
   separate Projects grid + the Workplan-Goals Projects table. (Not the blueprint-tree
   port — that'd mean re-wiring every affordance.)
5. **Goals = Path A** — KEEP "Activities" as the label; **DROP the 3 CPL-Goal chips**
   from the cards (redundant Vision-2030 overlay). Do NOT rename Activities→"Goals":
   it collides with the workplan PDF's own CPL Goals 1-3, right next to the link we
   just added. `cpl_goal` stays in data for the annual report.

Final structure (32 active items, A1:7 A2:4 A3:12 A4:9) + the old→new crosswalk:
**`kb/activity_reorg_alias_map.json`** (authoritative).

### What was validated (and a caveat)
Ran the **`verify-activity-reorg-crosswalk` workflow** (live Supabase ground-truth
+ blind classify + adversarial validation) *before* any live write. It caught two
real defects folded into the map: (a) `3.1.2`/`3.3` are KEPT **and** are dissolve
targets (an earlier draft omitted them → their rows would've dropped); (b) old `4.1`
is **not empty** — 1 RACI + 2 update rows must re-home before drop. ⚠ The workflow
validated the *earlier* draft; the sprint-symmetry (`4.2` Apprenticeship) + `1.1.x`
nesting edits post-date it → **re-run a dry-run before the live re-key.** (KB note:
`methodology-adversarial-verify-crosswalk-before-live-rekey.md`.)

### Shipped this session (PR #872, draft)
- Spec: `kb/activity_reorg_alias_map.json` + `docs/activity_reorg_scope.md`.
- **📄 CPL Workplan link** on the Activities header (both HTMLs, Rule 4; header is
  static — generator only emits `kpi-section-title` for CPL Analytics / KPI Metrics).
- **KPI-map lockstep**: `veteran_sprint` `4.1.1`→`4.1`; apprentice breakdown
  `3.1.2a`→`3.1.3` (`PID_TO_KPI_KEY`/`PID_TO_KPI_BREAKDOWN`).
- Activity-3 fallback-label retitle (×3 dicts).

### Remaining (next session — see the handoff)
- **Generator Option-B render** (the big piece): `render_activity_kpis_html` nests
  projects under each Activity; delete `render_projects_grid_html` +
  `render_awg_projects_section_html` injections + their static shells + the
  `data-sections` "Projects" entry; unwind the sprint-composite (`SPRINT_IDS` L1460,
  `build_activity_kpis` L1641-1685) + the 3 Activity-5 fallback `"5"` keys; drop the
  Goal chips; emit `sprint_tag` + a filter chip. **Only fully verifies at regen on
  the runner** (generator reads Supabase — sandbox can't).
- **Consumers**: `project_add.js` mint `N.x` (not `5.N`); drop `5.`-carve-outs in
  `project_lifecycle.js`/`raci.js`; reconcile the drifted `ACTIVITY_DESC` title dicts
  in `report_generator.js`/`master_report.js`/`generate_reports.js`/`annual_report.js`.
- **Tests**: `raci.test.js`, `project_lifecycle.test.js`, `assoc_editor.test.js`,
  `master_report.test.js` + a "no Activity 5 / sprint_tag filters" guard.
- **Live re-key** (Phase 2, gated on Sam's ~15-min hold): fresh dry-run → two-phase
  permutation on `projects`/`item_raci`/`item_updates`/`project_lifecycle`/
  `workplan_goals` + add `projects.sprint_tag` + insert `3.1.4` + retitle Activity 3.
- **Regen + verify + merge.**

### Patterns that worked
- **Read the authoritative source doc first.** The whole reorg turned on the
  workplan having 4 (not 5) activities — cheap to confirm, reframed everything.
- **Fast-feedback blueprint artifact** (prototype→lock, the EACR pattern). Sam
  iterated ~4 rounds of redlines on the visual before any code — cheap to change a
  chip, expensive to change a live re-key.
- **Adversarial verify before a live PK renumber** — caught 2 real defects.
- **Small AskUserQuestion batches** for the taxonomy forks (levels / sprints / IDs).

## 2026-07-22 — SkyPlan-II (Phase 3 built + verified; Phase 2 staged; render locked-pending)

Picked up SkyPlan's draft PR #872 and built the remaining phases on the same branch.

### Shipped this session (all on `claude/cobi-activity-reorg-az2o2y`, #872 still draft)
- **Generator Option-B render** (`excel_to_dashboard.py`): `build_activity_kpis` now
  nests EVERY active project under its Activity (dropped the `core_ids` ladder gate +
  the 4.1 sprint composite); `render_activity_kpis_html` renders one grid per Activity
  (no Goal banners — Path A), child-depth accent, filter data-attrs, ◆ sprint badge.
  Dissolved the standalone Projects grid + the AWG Projects table (kept the Tabled &
  Archived ledger for the held-out 5.1). Removed the phantom "Activity 5" fallbacks.
- **Consumers**: `raci.js` ACTIVITIES titles canonicalized; `project_add.js`
  `suggestId(ids, activityNum)` mints `N.x` under the chosen Activity; `dashboard_filters.js`
  gains a **◆ Sprint filter** (filters `.activity-kpi-card[data-sprint]`, collapses empty
  groups); static actions bar gains `#filterSprint` (both HTMLs, Rule 4); dead "projects"
  scroll-spy entry removed. Tests green (167 files) + a new `activities_sprint_filter.test.js`.
- **Phase 2 re-key STAGED** (`kb/activity_reorg_out/2026-07-21/`): a fresh **read-only**
  dry-run against live Supabase confirmed the crosswalk is CLEAN (all 34 ids covered once;
  RACI/updates counts match; the 2 content-judgment steps resolved from live data), plus
  the two-phase `rekey.sql` ready to run at Sam's hold. **Not executed.**

### The method win — offline render verification (no Supabase, no runner)
The generator's three-tier loader falls back to the committed `kb/projects_snapshot.json`
when `SUPABASE_SERVICE_KEY` is unset. So I built a scratch harness that (a) loads the real
34 projects, (b) applies the alias map **locally** to produce the 4-activity target, (c)
calls the render functions, and (d) Chromium-screenshots the result wrapped in the real
dashboard CSS. This turned "only verifies at regen on the runner" into a same-session
visual lock — the faithful preview I sent Sam. Reproduces the alias map's exact
`A1:7 · A2:4 · A3:12 · A4:9`.

### Caveat that bit me (don't repeat)
Running the **full** offline generator (`python excel_to_dashboard.py`) for an integration
check while a subagent was concurrently editing the same HTML **regenerated ~100 MB of
artifacts** (CPL_Data.js, unified_courses_*, both HTMLs) and raced the subagent's edits.
Recovery: `git checkout` the pure-regen artifacts, revert the HTMLs to the committed base,
and re-apply ONLY the 2 static edits by hand. Lesson: the full generator is a **writer** —
never run it as a "does it compile" check next to a file-editing subagent; use the isolated
render-function harness (zero repo writes) instead. Integration ran clean on its own (exit 0,
grid dissolved, all projects nested) — just isolate it.

### Sam's 3 calls — RESOLVED (2026-07-22)
- **Visual** ✅ locked ("Looks great!").
- **Report titles** ✅ aligned to canonical (A3 "Scale CPL Access, Awards, and Procedures",
  A4 "Sprints, Projects & Partnerships") in `master_report.js` + `generate_reports.js`
  (title + shortTitle; descriptions already fit). `21625b3`.
- **Tabling** ✅ kept — rewired the 🗄 control onto the nested `.activity-kpi-card`s (was
  grid-only) + dropped the now-everything `activityLayerIds()` immune gate; every active
  sub-activity is tableable again (gated + reversible). `project_lifecycle.js` + test (53).
  `268d6bc`. The assoc-editor being obsolete (nesting IS the association) was accepted.

### Remaining (Sam's hold)
- **Execute the live re-key** (`rekey.sql`) within Sam's hold (fresh read first, Rule 9),
  then `workflow_dispatch daily-dashboard.yml` → inspect the regenerated Activities tab →
  mark #872 ready → squash-merge on green.
