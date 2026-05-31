---
title: Full Excel Retirement — Final Scope (KPI ladder + D.* helpers + read_projects sunset)
date: 2026-05-31
kb-status: published
kb-type: playbook
tags: [excel-to-supabase, retirement, kpi-ladder, read_projects, scope, phase-final]
related:
  - docs/kb-notes/phase-2-projects-migration-scope.md (the Phase 2 template this builds on)
  - docs/kb-notes/playbook-measure-first-supabase-migration.md (the 5-step migration template)
  - docs/excel_to_supabase_lessons.md (the workstream notebook)
  - CLAUDE.md §11 (Excel→Supabase roadmap)
artifacts:
  - excel_to_dashboard.py::read_projects (the last Excel reader of the project-list master)
  - excel_to_dashboard.py::build_activity_kpis (consumes the D.* helper rows)
  - CPL_Data.js (the generator output the report JS consume)
  - report_generator.js / generate_reports.js (the 2 KPI-ladder consumers)
  - public.workplan_goals (already holds the ladder as kind='project' rows)
  - CPL_Initiative_Project_List_v3.xlsx (the master to retire)
---

# Full Excel Retirement — Final Scope

**No code is cut from this doc — it's the contract for Sam to review before any
PR ships under it.** Phases 1–3 already landed (Workplan Goals, Projects, Budget
read-path). This doc scopes the *finale*: what's actually left before the
`CPL_Initiative_Project_List_v3.xlsx` master can be deleted.

## Corrected state — the remaining surface is small

A fresh measure-first pass (2026-05-31) corrects several stale roadmap entries:

| Area | Real status | Excel still needed? |
|---|---|---|
| Workplan Goals (Phase 1) | Supabase + editor | No |
| Projects (Phase 2) | Supabase + editor (34 grid cards) | No (for the cards) |
| **Personnel** (was "Phase 5 queued") | **Already Supabase** via the budget cutover (`build_budget_from_supabase(funding_rows, personnel_rows…)`, PR #189) | **No** |
| **Vision 2030** (was "Phase 4 queued") | **Static cards + computed/config progress** (`_v2030_g1_progress = students/250000`, `V2030_G2_PROGRESS` config overrides). The per-project `v2030` field is already Supabase-sourced. **Not an Excel data table.** | **No** |
| Budget (Phase 3) | Read-path cut over (PR #189) | No (read); inline **editor** still missing (optional) |
| **KPI ladder** (10 cols `kpi_goal_2526…kpi_stretch_2930`) | `read_projects()` (Excel) → `CPL_Data.js`; consumed by **2** report JS | **YES — the crux** |
| **`D.*` cohort-helper rows** (15) | `read_projects()` (Excel) → `build_activity_kpis()` cohort composites | **YES** |
| `excel_row` (Excel-web deep-links) | `read_projects()` per-project field | Minor — drop or replace |
| The Excel **fallback** in `load_projects/budget/workplan` | Ultimate safety net | Remove last |

**Net:** "abandon Excel" reduces to **(1) migrate the KPI ladder off Excel, (2)
migrate the 15 `D.*` helper rows, (3) delete `read_projects()` + the Excel
fallback + the `.xlsx`.** Vision 2030 and Personnel need *no* migration; Budget
needs only an optional editor.

## The crux — KPI ladder, and the blank-vs-`0` fidelity gap

The 10 ladder columns are read by `read_projects()`, formatted to strings
(blank→`""`, number→`fmt_number`), embedded per-project into `CPL_Data.js`, and
read by:

- `report_generator.js` — `p.kpi_goal_2526`, `p.kpi_stretch_2526` (first year only)
- `generate_reports.js` — the full ladder + `p.kpi_target_2026/2030`
- `college_report_generator.js` — **does not read the ladder** (corrects the
  "3 consumers" note; it's 2)

The same values **already live in Supabase `workplan_goals`** as `kind='project'`
GOAL/STRETCH rows (Phase 1). So why does Excel still feed `CPL_Data.js`?

> **`workplan_goals` conflates a blank cell with a literal `0`** (e.g. project
> `1.4` has a real `0` target, indistinguishable from "no goal this year"). The
> Excel string formatting preserves the distinction (`""` vs `"0"`); the numeric
> `workplan_goals` storage does not. Repointing naively would turn legitimate
> blanks into `0`s (or vice-versa) in the Word reports.

**This is the keystone to resolve.** Once the distinction is representable in
the Supabase ladder, the generator can build `CPL_Data.js`'s ladder fields from
`workplan_goals` and `read_projects()` loses its last unique responsibility for
the cards.

## PR plan (smaller than Phase 2 — most of the migration is already done)

### PR-1 — ladder fidelity + generator repoint *(the keystone)*
1. **Make blank-vs-`0` representable in `workplan_goals`.** Decide the
   representation (Fork A below) — likely a nullable year value (`NULL`=blank,
   `0`=literal) or a per-row "has-value" mask. One-shot data fix to set the
   currently-ambiguous `0`s correctly (measure first: how many rows have a real
   `0` vs a blank — `1.4` is the known case; find the rest).
2. **Generator builds the `CPL_Data.js` ladder from `workplan_goals`** (join on
   `id == workplan_goals.activity_id AND kind='project'`), emitting the *exact*
   `p.kpi_goal_2526…` / `p.kpi_stretch_…` string fields the 2 consumers expect —
   **zero JS-consumer changes**. (Same contract-preservation pattern as Phase 2
   PR-4's projects join.)
3. Verify by diffing the regenerated `CPL_Data.js` ladder fields against the
   Excel-sourced ones for all 34 projects — they must match string-for-string
   (including the `1.4` `0` and every blank). This is the go/no-go gate.

### PR-2 — `D.*` cohort helpers off Excel
The 15 `D.*` rows feed `build_activity_kpis()` cohort composites (3.1.x, 4.1
sprint). Decide their home (Fork B): a small Supabase table, or fold into
`workplan_goals` as a new `kind='kpi_helper'`. Migrate the 15 rows, repoint
`build_activity_kpis()` + `derive_core_activity_ids()`. Validator + dry-run +
apply mirror the Phase 1/2 gates (tiny: 15 rows).

### PR-3 — Budget inline editor *(optional, parallel)*
Self-contained; mirrors `projects_editor.js` / `workplan_goals.js` exactly
(magic-link `cpl_sb`, optimistic paint, RLS already gates `budget_funding` /
`personnel` writes — verify). No fork dependency. Good momentum-builder.

### PR-4 — sunset `read_projects()` + drop the Excel master
After PR-1 + PR-2 ship and one daily cron confirms parity:
- Delete `read_projects()`, the Excel `kpi_goal_*`/`kpi_stretch_*`/`D.*` reads,
  `excel_row` (Fork C), and the `EXCEL_FILE` fallback branches in
  `load_projects/budget/workplan`.
- Keep a **periodic Supabase→xlsx export** as a backup artifact (decouples
  "Excel as source" from "Excel as a downloadable snapshot").
- `kb/reference/coci_course_list.xlsx` is **NOT** in scope — it's the MAP COCI
  data extract (the course universe), an input, not the hand-maintained master.

## Forks for Sam to lock BEFORE PR-1

1. **Editing UX after Excel (the big one).** Once the `.xlsx` is gone, how do
   you edit the KPI ladder year-targets? (a) a dashboard inline editor on the
   Workplan Goals tab (build it — the ladder cells are already rendered there),
   or (b) Supabase-direct (SQL/MCP). This shapes whether PR-1 bundles an editor.
   *Rec: dashboard editor — keeps you out of SQL and matches every other tab.*
2. **Blank-vs-`0` representation.** Nullable year value (`NULL`=blank, `0`=real)
   vs an explicit mask. *Rec: nullable — simplest, and PostgREST/JS already
   handle `null` cleanly.* Needs a one-shot data fix + a Supabase migration
   (§8 sign-off).
3. **`D.*` helpers' home.** Own table vs `workplan_goals kind='kpi_helper'`.
   *Rec: `kind='kpi_helper'` — reuses the existing table, RLS, loader, snapshot;
   no new migration surface.*
4. **`excel_row` fate.** It powers Excel-web deep-links from project cards. Drop
   it, or replace with a Supabase-row deep-link / nothing? *Rec: drop — Excel is
   going away, so the deep-link target won't exist.*
5. **Keep a Supabase→xlsx backup export?** *Rec: yes — a weekly/daily export job
   so there's always a portable snapshot, without Excel being the source.*

## Cost estimate

Much smaller than Phase 2 (the data is largely migrated already):
- PR-1 (ladder fidelity + repoint): ~2-3 h — the only non-trivial piece (the
  blank-vs-`0` data fix + the parity gate).
- PR-2 (`D.*` migrate): ~1-2 h (15 rows, tiny).
- PR-3 (Budget editor): ~2 h (mirrors existing editors; independent).
- PR-4 (sunset + backup export): ~1-2 h.

**One focused session, two with buffer.** The keystone is PR-1's parity gate; if
the regenerated ladder matches Excel string-for-string, the rest is mechanical.

## Sam's decision point

Lock Forks 1–3 (editing UX, blank-vs-`0`, `D.*` home) before PR-1 — they shape
the migration. Forks 4–5 are low-stakes. Then PR-1 → PR-2 → PR-4 retires Excel;
PR-3 (Budget editor) can run in parallel whenever.
