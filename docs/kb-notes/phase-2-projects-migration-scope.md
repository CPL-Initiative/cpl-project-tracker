---
title: Phase 2 — Projects Table Migration (Scope)
date: 2026-05-28
kb-status: published
kb-type: playbook
tags: [excel-to-supabase, phase-2, projects, migration, scope]
related:
  - docs/kb-notes/playbook-measure-first-supabase-migration.md (the 5-step template)
  - docs/excel_to_supabase_lessons.md (Phase 1 workstream notebook)
  - CLAUDE.md §11 (Excel→Supabase roadmap)
artifacts:
  - excel_to_dashboard.py::read_projects (current Excel reader)
  - CPL_Data.js (current generator output that downstream JS consumes)
  - public.projects (Supabase target — empty today)
  - public.workplan_goals (already source-of-truth for KPI ladders)
---

# Phase 2 — Projects Table Migration (Scope)

A scoping doc for the next architectural mountain after Phase 1. **No code is
cut from this doc — it's the contract for Sam to review before any PR ships
under it.** Mirrors the Phase 1 measure-first-supabase-migration playbook;
this doc fills the per-PR shape with project-table specifics.

## Why this is the right Phase 2 entry point

- The Supabase `projects` table is **empty (0 rows)**. So Phase 2 PR-3 (apply)
  is `0 → 27 INSERTs + 0 UPDATEs + 0 DELETEs` — the smallest possible blast
  radius for a "migration" step.
- The `projects` data is the **largest unlock** Bruh Baker flagged. Three
  downstream JS consumers (`generate_reports.js`, `report_generator.js`,
  `college_report_generator.js`) read project KPI fields off `CPL_Data.js`
  today; Phase 2 can preserve their contract without JS changes.
- It exercises every column type the existing schema supports (text, numeric,
  date, timestamp) — proves the migration pattern handles all of them before
  Budget / Vision 2030 / Personnel.

## Column mapping — Excel `read_projects()` → Supabase `projects`

The Excel reader produces ~28 fields per project. The Supabase schema has 25
columns. Mapping with rename / type-change / gap analysis:

| Excel field | Supabase column | Type change | Notes |
|---|---|---|---|
| `id` | `id` | — | PK (text) |
| `name` | `name` | — | NOT NULL |
| `desc` | **`description`** | — | rename |
| `activity` | **`workplan_activity`** | — | rename |
| `v2030` | **`vision_2030_action`** | — | rename |
| `goal` | **`cpl_goal`** | — | rename |
| `budget_source` | `budget_source` | — | match |
| `budget` | `budget` | — | match (kept as text — values like "$2.5M") |
| `lead` | `lead` | — | match |
| `team` | `team` | — | match |
| `status` | `status` | — | match (default `'Not Started'`) |
| `pct` | **`percent_complete`** | int→numeric | rename + type widen |
| `start` | **`start_date`** | str→date | rename + type change |
| `end` | **`end_date`** | str→date | rename + type change |
| `milestones` | `milestones` | — | match |
| `update` | **`latest_update`** | — | rename |
| `update_date` | `update_date` | str→date | type change |
| `kpi_metric` | `kpi_metric` | — | match |
| `kpi_unit` | `kpi_unit` | — | match |
| `workplan_notes` | **`wp_notes`** | — | rename |
| `kpi_order` | `kpi_order` | int→int | match |
| **(none)** | `kpi_target_2026` | — | already in schema; Phase 2 leaves NULL (the ladder data is in `workplan_goals`) |
| **(none)** | `kpi_target_2030` | — | same |
| **(none)** | `created_at` / `updated_at` | — | default `now()` |
| `override` | **DROP** | — | Excel-side config artifact; not a project field |
| `excel_row` | **DROP** | — | source-mapping artifact; not data |
| `kpi_goal_2526` … `kpi_stretch_2930` (10 cols) | **see "KPI ladder" below** | — | not in projects schema; the data lives in `workplan_goals` already |

**Eight column renames; three type changes (str→date × 2 + int→numeric × 1);
two drops; ten Excel fields handled out-of-band.** Renames are the riskier
audit point — every downstream consumer needs to either map back to the
Excel name or learn the Supabase name. Type changes are mechanical (string
date `"2026-05-28"` → Postgres `date`).

## KPI ladder handling — the contract preservation

The 10 KPI ladder Excel columns (`kpi_goal_2526` … `kpi_stretch_2930`) are
read by `read_projects()` and embedded per-project into `CPL_Data.js`. Three
downstream JS consumers read them straight off `p.kpi_goal_2526`, etc.

Phase 1's PR-4/5 already moved these values into `workplan_goals` (as
`kind='project'` rows). The Excel still carries them because the JS consumers
still read off `CPL_Data.js`. **Phase 2 retires the Excel side** while
**preserving the `CPL_Data.js` field contract**:

```
Old: Excel ladder cols → read_projects() → CPL_Data.js → JS consumers
New: workplan_goals kind='project' → load → merge into projects dict
   → CPL_Data.js → JS consumers (unchanged contract)
```

So Phase 2's generator step builds `CPL_Data.js`'s project entries by:

1. Fetching the project rows from Supabase `projects` (Phase 2 data)
2. Fetching the project ladder rows from Supabase `workplan_goals`
   (Phase 1 data)
3. Joining on `id == workplan_goals.activity_id` AND
   `workplan_goals.kind == 'project'`
4. Emitting the same `p.kpi_goal_2526` etc. fields the JS consumers expect

This means **no JS consumer changes** for Phase 2. The Excel KPI ladder
columns retire only when the JS consumers themselves migrate (Phase 3+).

## 5-step PR plan (mirroring Phase 1)

### PR-1 — validator + snapshots (no writes)

`kb/_validate_projects.py`:
- Excel-A+ derivation: read every Project List row with at least one
  non-zero KPI cell, excluding `D.*` (same A+ rules as workplan_goals)
- Fetch Supabase `projects` rows
- Diff: missing-in-Supabase, value mismatches, orphans-in-Supabase
- Write `kb/projects_validation.md`

Pre-state snapshots:
- `archive/CPL_Initiative_Project_List_v3_<date>_pre-projects.xlsx` (the
  Excel snapshot — copy of the canonical file)
- `archive/projects_supabase_<date>_pre-seed.json` (the Supabase snapshot —
  empty today, but committed for forensic continuity)

Expected initial diff: **27 missing + 0 mismatches + 0 orphans** (Supabase is
empty; every Excel project is "missing" in Supabase).

### PR-2 — dry-run seed plan (no writes)

`kb/_seed_projects.py` consumes the validator's output, classifies each row
as `INSERT` / `UPDATE` / `NO-OP` / `DELETE`, writes
`kb/projects_seed_plan.md`. Expected: **27 INSERTs / 0 UPDATEs / 0 NO-OPs / 0
DELETEs**.

### PR-3 — apply script + workflow_dispatch (gated writes)

`kb/_seed_projects_apply.py` plus `.github/workflows/projects-seed-apply.yml`
(manual trigger; `workflow_dispatch`; concurrency group `daily-dashboard`).

V1-V4 apply gates (modeled on Phase 1):
- **V1 (apply_safe)** — fresh Excel A+ produces N > 0 projects
- **V2 (source-exists)** — every UPDATE/DELETE matches ≥ 1 Supabase row
- **V3 (cardinality)** — post-apply project row count == |A+ projects|
  (no dual GOAL/STRETCH multiplier because projects is single-row-per-id)
- **V4 (validator)** — `_validate_projects.py` re-runs clean (exit 0)

Sam dispatches the workflow when ready. Apply log + plan snapshot at
`kb/projects_seed_out/<date>/`. Pre-apply snapshot at
`archive/projects_supabase_<date>_pre-apply.json`.

### PR-4 — generator switch + snapshot fallback

`kb/_load_projects.py` mirrors `kb/_load_workplan_goals.py`:
- Fetch fresh from Supabase + write `kb/projects_snapshot.json`
- On Supabase failure, read snapshot + return rows with `_fetched_at` date
  stamp
- Both fail → loud `RuntimeError`

`excel_to_dashboard.py::main()` switches:
- `read_projects()` becomes a fallback (`# DEPRECATED: kept for X PRs as a
  safety net`)
- New code path: `load_projects_full()` returns `(rows, fetched_at, source)`
- The CPL_Data.js builder joins project rows with workplan_goals
  `kind='project'` rows to preserve the KPI ladder contract (see "KPI
  ladder handling" above)
- A subtle "Data as of YYYY-MM-DD" stamp on the project cards section
  signals snapshot freshness

The daily workflow gains a step to `git add kb/projects_snapshot.json` so
the snapshot pulls forward each day.

### PR-5 — inline editor

Mirrors `workplan_goals.js`'s editor pattern. Project fields editable:
- Top-level cells: `name`, `lead`, `team`, `status`, `start_date`,
  `end_date`, `kpi_metric`, `kpi_unit`, `budget`, `budget_source`,
  `pct`, `update_date`
- Multi-line cells (modal-driven): `description`, `milestones`,
  `latest_update`, `wp_notes`, `cpl_goal`

Same magic-link auth shared session (`cpl_sb`). RLS tightening (mirroring
`workplan_goals_rls_tighten_to_allowed_reviewers`) lands as a Supabase
migration — needs Sam sign-off per CLAUDE.md §8.

### PR-6 — retire `read_projects()` (the legacy fallback)

After PR-5 ships and one daily cron run confirms parity, retire
`read_projects()` and any Excel-side helpers. Excel KPI ladder columns stay
alive (still readable by `workplan_goals` data through the join in PR-4).

## Forks for Sam to lock BEFORE PR-1

These materially affect the migration shape; bring them to Sam at PR-1
opening time, not during it:

1. **Type changes for `start_date` / `end_date`** — Excel currently stores
   `str` (formatted dates). Supabase schema is `date`. PR-3 needs a parser
   for the existing Excel string formats (`"2026-05-28"`, `"5/28/2026"`,
   blank). Strict parsing or lenient with fallback to NULL?

2. **`budget` as `text` not `numeric`** — Excel has "$2.5M" and similar
   shorthand. Schema is `text`. Phase 2 leaves it text; bigger refactor to
   parse + normalize is a separate concern.

3. **`status` enum?** — current Excel free-form (`"Not Started"`, `"On
   Track"`, `"Goal Met"`, `"Foundational Year"`, etc.). Schema is `text`
   with a `'Not Started'` default. Phase 2 keeps free-form; a CHECK
   constraint is a follow-up.

4. **`override`, `excel_row` drop** — confirm these are safe to drop. Both
   are Excel-side artifacts not used elsewhere in the dashboard. Should be
   trivial but worth Sam's eyes.

5. **JS consumer contract — `kpi_target_2026` / `kpi_target_2030`** — the
   schema has these but Excel doesn't. `generate_reports.js` has fallback
   reads (`p.kpi_goal_2930 || p.kpi_target_2030`). Phase 2 leaves them NULL;
   a future PR can backfill from `workplan_goals` aggregates if curators
   want a separate "aggregate target" knob.

6. **RLS shape** — mirror `kb_curation` / `workplan_goals` policy:
   `is_allowed_reviewer()` gating INSERT/UPDATE/DELETE; public SELECT.
   Today `allowed_reviewers` = [`map@rccd.edu`]. Need Sam confirmation that
   this scope is fine for projects too (a project edit affects the public
   dashboard immediately).

## Open / parked

- **Excel KPI ladder retirement** — out of Phase 2 (still needed for the
  JS consumers). When all three JS consumers migrate (Phase 3+), the
  Excel-side `kpi_goal_*` / `kpi_stretch_*` columns can finally die.
- **`update_log` table population** — empty today. Project edits in PR-5
  could log a change to `update_log` for audit. Out of scope; track as a
  follow-up.
- **`projects.activity_id` association** — the Phase 1 PR-A model added
  `workplan_activity_associations` for workplan-goals. Should projects ALSO
  carry an activity_ids list? Today they implicitly do (via the leading
  digit). Out of scope; PR-B chips already work from the workplan-goals
  associations table.

## Cost estimate

Phase 1 was 5 functional PRs + 1 RLS migration + 1 checkpoint =
~6-7 PRs across a single focused session. Phase 2 (projects only) follows
the same shape:

- PR-1 (validator): ~1-2 hours
- PR-2 (seed plan): ~1 hour (mostly re-using PR-1 derivation)
- PR-3 (apply + workflow): ~2 hours (workflow_dispatch + V1-V4 + synthetic
  test)
- PR-4 (generator switch + snapshot): ~2 hours (mirrors PR-4 of Phase 1)
- PR-5 (editor): ~2-3 hours (more fields than workplan_goals; multi-line
  modal flow)
- PR-6 (retire dead code): ~30 min

**One focused session for Phase 2 if uninterrupted; two sessions with
buffer.**

After Phase 2, the remaining Phase 3-5 follow the same shape on Budget /
Vision 2030 / Personnel. Personnel already has 26 rows in Supabase so its
Phase 3 (or 5) PR-3 will have UPDATEs to deal with (not just INSERTs).

## Sam's decision point

Before any PR ships under this scope, confirm the six forks above
(particularly #1-4 which affect the apply shape). The rest of the playbook
is mechanical — same shape as Phase 1, same gates, same snapshot pattern.
