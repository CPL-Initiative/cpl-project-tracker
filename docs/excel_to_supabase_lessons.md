---
title: Excel → Supabase Migration — Workstream Lessons
date: 2026-05-28
tags: [excel-to-supabase, workplan-goals, phase-1, migration, source-of-truth, lessons]
artifacts:
  - kb/_validate_workplan_goals.py
  - kb/_seed_workplan_goals.py
  - kb/_seed_workplan_goals_apply.py
  - .github/workflows/workplan-goals-seed-apply.yml
  - kb/workplan_goals_validation.md
  - kb/workplan_goals_seed_plan.md
  - archive/CPL_Initiative_Project_List_v3_2026-05-28_pre-supabase-migration.xlsx
  - archive/workplan_goals_supabase_2026-05-28_pre-seed.json
related:
  - CLAUDE.md §11 "Excel→Supabase Phase 1" roadmap row
  - docs/coursecontrolnumber_remint.md (the playbook this migration adapts)
  - docs/exhibit_canonicalization_lessons.md (Bruh Dec's Mode B credential-rename, the V1-V4 gate template)
  - docs/kb-notes/playbook-measure-first-supabase-migration.md (the playbook distilled, Session 13)
---

# Excel → Supabase Migration — Workstream Lessons

A live notebook for the Phase 1 work (Workplan Goals tab) and the larger
4-phase project. Append a dated section at every checkpoint.

## 2026-05-28 — Session 13 (Bruh Baker), checkpoint 1

### What's been learned

**1. "Source-of-truth migrations" need a survey-before-scope before they need a plan.**
Bruh El and Bruh Dec both parked this workstream in their handoffs because the
scoping conversation never happened. When the scoping conversation DID happen
(Session 13 opening), the survey-before-scope Explore-agent inventory paid for
itself within ten minutes: it caught the fact that `workplan_goals` was already
populated in Supabase (20 rows, partial), that the daily cron already injects
`SUPABASE_SERVICE_KEY` into the env, and that the curator-tab pattern was already
battle-tested in 3 places. Without that inventory, the conversation would have
mis-framed the problem as "build everything from scratch" instead of "wire up
the third leg of a tripod."

**2. There can be more than two sources of truth, and the third one is the worst.**
Going in, I expected Excel ↔ Supabase drift. The validator surfaced **three-way**
drift: Excel had the canonical recent data, Supabase had stale seed data, and
the renderer's hardcoded `core_ids` list had its OWN view that matched neither.
The latent renderer bugs (4.1 sprint aggregation expecting `4.1a/b/c/d`, all of
Activity 5 invisible, cohort family invisible) were silently affecting the
dashboard for weeks. The validator was supposed to be a check for the migration —
it turned out to be a diagnostic that surfaced the existing rot. **Always
diff every source you can identify, not just the two obvious ones.**

**3. "Auto-derive from data" closes the maintenance-list trap.**
The renderer's hardcoded `core_ids = [...]` was a textbook drift source: every
time a new sub-activity got added to Excel, someone had to remember to update
this list, and no-one did. The "A+" approach Sam picked (auto-derive every
Project List row with a non-zero KPI cell, excluding `D.*`) eliminates the list
entirely. The renderer learns from data; future additions appear automatically.
This is the same instinct as Bruh El's "derive whitelists from rendered DOM"
pattern (sidebar tab routing) — anywhere a const list mirrors something
discoverable from data, derive instead of mirror.

**4. The supersede-don't-mutate ADR is for synthetic identities, but its
*sibling* is "snapshot before destructive write."** This migration WILL overwrite
Supabase rows that have drifted (Excel A+ wins by construction). That's
destructive of the old Supabase content. The supersede-don't-mutate ADR doesn't
apply (this isn't synthetic identity), but the sibling principle does: snapshot
the old state somewhere git-versioned BEFORE writing. Hence
`archive/workplan_goals_supabase_2026-05-28_pre-seed.json` — the rollback input
if V4 ever fails post-apply.

**5. V1-V4 apply gates generalize cleanly across re-mint workstreams.**
Bruh Dec's credential-rename apply (PR-5b/1) used V1-V4 gates that I adapted
directly:
- V1: fresh re-derivation produces a coherent plan (else abort)
- V2: every UPDATE/DELETE row exists at apply time (PostgREST
  `Prefer: return=representation` lets you detect 0-row PATCH matches as
  failures; this is the cleanest "source exists" check for REST writes)
- V3: post-apply cardinality matches expectation
- V4: re-run the validator; exit 0

These gates aren't migration-specific. The same shape will apply to Phase 2-4.
Worth distilling into a playbook (see KB note `playbook-measure-first-supabase-migration`).

**6. End-to-end synthetic test catches plumbing bugs the gates miss.**
The 30-line monkey-patched test I wrote for PR-3 caught **nothing** this round,
but it gave me confidence the per-row INSERT/UPDATE/DELETE → V3/V4 sequence
actually wires up correctly before pushing the button. Same pattern Bruh Dec
established. Worth writing the test BEFORE the apply ships, not after a failure.

### Current state

**PR-1 (validator + Excel snapshot) merged** — `kb/_validate_workplan_goals.py`
+ `archive/CPL_Initiative_Project_List_v3_2026-05-28_pre-supabase-migration.xlsx`
+ initial three-way drift report. Surfaced 9 missing-from-Supabase activities,
18 value mismatches across 9 overlapping ones, 1 orphan.

**PR-2 (A+ derivation + dry-run seed plan) merged** — auto-derive replaces
hardcoded `core_ids`. 27 A+ activities discovered (vs 19 hardcoded). Seed plan:
34 INSERTs + 20 UPDATEs + 0 NO-OPs + 0 DELETEs. Notable: `2.4` flips from stale
"AI-Ready California Demonstration" → "Validated Skills" (AI-Ready moved to `5.1`).

**PR-3 (seed apply + workflow_dispatch) merged** — apply script + workflow
ready. V1-V4 in-script gates + per-row apply log. End-to-end synthetic test
green. **Awaits Sam clicking the workflow_dispatch button** to actually run
against live Supabase.

### Strategic roadmap

- **Immediate:** Sam dispatches `workplan-goals-seed-apply` workflow from
  Actions tab. Apply runs end-to-end, V4 reports green, Supabase becomes the
  source of truth.
- **PR-4 (next architectural mountain):** generator switch +
  `kb/workplan_goals_snapshot.json` fallback. `read_workplan_goals_from_supabase()`
  replaces Excel KPI-column reads. Daily cron writes snapshot post-fetch;
  generator falls back to snapshot on Supabase outage. Subtle "as of YYYY-MM-DD"
  staleness signal in the tab header (Sam's call: subtle, not loud). Scope
  wrinkle: only the GOAL/STRETCH ladder switches; Excel `kpi_metric` (the
  "Current" column) stays Excel-sourced until Phase 2.
- **PR-5:** inline editor + add-new-activity. Validates the CRUD architecture
  Pushback 3 of the scoping conversation called out. Magic-link auth + REST
  API writes, modeled on `canonical_subj4.js`.
- **PR-6:** retire Excel KPI ladder columns from `read_projects`. Documents
  the cutover.
- **Phase 2-4:** projects (`kpi_metric` + project metadata), budget, personnel,
  vision-2030 alignment. Each repeats the Phase 1 pattern: snapshot-validate-
  seed-cutover-editor.

### Next concrete step

Sam dispatches `.github/workflows/workplan-goals-seed-apply.yml` from the
Actions tab. After V4 green, PR-4 (generator + snapshot fallback) ships.

## 2026-05-28 — Session 13 (Bruh Baker), session-end

### What shipped after checkpoint 1

The morning checkpoint left PRs 1-3 + plan, awaiting Sam's dispatch. By
session end:

- **Workflow dispatched** — Sam clicked Run workflow on the seed-apply.
  V4 reported green on the first run: 27 A+ activities × 2 row_types = 54
  rows, 54 matches, 0 mismatches/missing/orphans. The apply landed as
  commit `6778fd7` with full receipts under `kb/workplan_goals_seed_out/2026-05-28/`.
- **PR #166 (PR-4)** — generator switched to Supabase reads + daily snapshot
  fallback. New `kb/_load_workplan_goals.py` with the
  fetch→snapshot-write→fallback chain. Subtle "Data as of YYYY-MM-DD" line
  in the rendered tab header. First daily run after merge confirmed the
  snapshot wires + rendered 27 activities cleanly (Sam's "Dash update
  complete and clean!" confirmation).
- **PR #167 (PR-6)** — retired the dead `build_workplan_goals_from_projects`
  (~148 lines). Excel KPI ladder columns stay alive in `read_projects()` for
  three downstream JS report consumers (`generate_reports.js`,
  `report_generator.js`, `college_report_generator.js`); migrating those is
  deferred to Phase 2 when project metadata also moves.
- **PR #168 (PR-5)** — the inline editor. ~300 lines of JS hydrating the
  Python-rendered tables with click-to-edit + magic-link auth + dual-table
  mirroring. Cell edits fan out to both the grouped activity card AND the
  comprehensive annual_goals table via shared `data-aid`/`data-rt`/
  `data-yr-key` selectors. Narrow scope per Sam's mid-session call: edit
  only, no add-flow, kpi_metric (Current column) stays Excel-sourced.
- **RLS tightening** — `workplan_goals` was wide open (any authenticated
  user could write). Migration `workplan_goals_rls_tighten_to_allowed_reviewers`
  dropped the `"Allow auth write"` ALL policy and added per-command policies
  gating on `is_allowed_reviewer()`. Today `allowed_reviewers` is just
  `map@rccd.edu`. Public read unchanged. Mirrors `kb_curation`'s policy
  shape exactly.

### Additional lessons (post-PR-3)

**7. The migration shape generalized end-to-end without surprises.** The
five-step playbook (snapshot → validate → dry-run → workflow_dispatch
apply with V1-V4 → cutover) survived contact with reality. V4 reported
green on the first apply attempt; the generator switch landed cleanly;
the snapshot fallback wired correctly. The KB note
`playbook-measure-first-supabase-migration` captures the shape for Phases
2-4.

**8. The validator's "0/18/9/1" headline became "54/0/0/0" exactly as
expected.** Pre-seed: 0 matches, 18 mismatches, 9 missing, 1 orphan.
Post-apply: 54 matches, 0 mismatches, 0 missing, 0 orphans. The numbers
predicted by the plan (34 INSERTs + 20 UPDATEs + 0 DELETEs = 54 row
operations to reach 54 expected rows) matched reality with zero
adjustments. **The dry-run plan was the contract; the apply just executed
it.** Worth remembering for Phase 2: if your dry-run plan doesn't predict
exactly the post-apply state, you're not done planning yet.

**9. The dual-table editor pattern is reusable.** Two render functions
produced two HTML tables for the same data. Rather than picking one to be
the "editable" table, I tagged ALL editable cells in both renderings with
shared `data-aid`/`data-rt`/`data-yr-key` attributes; the editor's save
handler uses `querySelectorAll` to fan optimistic paint + final state out
to all matching cells. Cost: 4 lines of selector logic. Benefit: no
"why doesn't the other table update?" confusion. Reusable wherever the
same data appears in multiple rendered surfaces.

**10. Narrow PR-5 was the right call.** Sam's mid-session context drop
about Activity↔Project N-to-N associations would have made a broader
PR-5 (with the add-flow) ship a data model we'd later regret. Pausing
the scoping conversation for THAT data model preserved future optionality
without delaying today's editor ship. The instinct: when a user surfaces
architectural context mid-PR, narrow the current PR rather than
re-scoping it on the fly.

### Current state at session end

**Phase 1 is functionally complete at the dashboard-tab level:**

- ✅ Supabase `workplan_goals` is the source of truth (27 activities × 2 row_types = 54 rows, all in sync with Excel A+)
- ✅ Generator reads from Supabase + snapshot fallback
- ✅ Curators can sign in + edit GOAL/STRETCH cells live
- ✅ RLS gates writes to `allowed_reviewers` (today: 1 user, `map@rccd.edu`)
- ✅ Dead code retired

**Excel still feeds:**

- `kpi_metric` (the "Current" column in annual_goals) — Phase 2 territory
- The 10 KPI ladder columns for three JS report consumers
  (`generate_reports.js`, `report_generator.js`, `college_report_generator.js`)
- All other project metadata (status, lead, milestones, etc.) — Phase 2

### Strategic roadmap

The deferred work for the NEXT session, scoped during wind-down:

- **PR-A (next session, top of menu):** schema migration. Add `kind` column
  to `workplan_goals` (default `'project'`; pre-seed 5 `'activity'` rows
  from the hardcoded `activity_labels` dict so they're editable from day
  one). Add `workplan_activity_associations(project_id, activity_id)`
  table for N-to-N. Backfill obvious 1-to-1 associations from the
  activity_id prefix.
- **PR-B:** generator + renderer update. Consume the new model; render
  Activities section + Projects section separately on the page.
- **PR-C:** editor + add-flow. Modal with Activity/Project radio + ladder
  fields + (for Project) multi-select of associated Activities.
- **PR-D (optional):** split Workplan Goals into its own top-level tab if
  the page gets too dense, OR keep as one section under existing tab.
  Sam's prior preference: ONE page with two sections.

Phase 2 (Dashboard project cards, Budget, Vision 2030, Personnel) is the
next big-rock workstream after PR-A through PR-D. The
`playbook-measure-first-supabase-migration` KB note is the template; each
table follows the same five-step shape.

### Next concrete step

Bruh Baker hands the spatula. Next session starts with PR-A (schema
migration) per the scoped plan in this section.

## 2026-05-28 — Session 14 (Bruh Sonnet), PR-A landed

### What shipped

**PR-A: Activity↔Project N-to-N data model.** The schema migration Bruh
Baker scoped at session-end. Single migration applied via the Supabase
`apply_migration` MCP tool — no `workflow_dispatch` step needed since
PR-A is pure DDL + a single backfill INSERT, not a per-row Excel-derived
re-key like Phase 1 PR-3.

Decisions Sam locked at session start (`AskUserQuestion` × 3 forks):

  - **Activity ID scheme:** clean `"1"-"5"` (matches the existing
    `activity_labels` dict). The prefix backfill is trivial
    (`substring(activity_id from 1 for 1)`).
  - **Activity ladder values:** curator-editable, initially zero. The
    5 Activity rows get the same GOAL/STRETCH × 5-year shape as
    projects so the editor + renderer treat them uniformly. Curator
    can later set top-level aggregate targets without a schema change.
  - **N-to-N FK strategy:** no DB-level FK. `workplan_goals.activity_id`
    is non-unique (each id has GOAL + STRETCH rows), so a clean FK
    would have required either collapsing the dual-row shape or a
    unique partial index on `WHERE row_type='GOAL'`. Both are bigger
    refactors than PR-A warrants. The validator (`validate_associations`)
    now does the FK check application-side, mirroring how `kb_curation`
    handles loose pointers.

Schema shape applied:

```
ALTER TABLE workplan_goals
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'project'
  CHECK (kind IN ('activity', 'project'));

-- 5 Activity rows × 2 row_types each (10 total, ladder zeroed)
INSERT INTO workplan_goals (activity_id, name, row_type, kind, ...) VALUES
  ('1', 'Activity 1: Build AI-Enhanced CPL Infrastructure', ...),
  ('2', 'Activity 2: Faculty Workgroups & Credit Recommendations', ...),
  ('3', 'Activity 3: Build CPL Data Infrastructure', ...),
  ('4', 'Activity 4: Sprints, Projects, Partnerships & Scale', ...),
  ('5', 'Activity 5: Strategic Initiatives & Special Projects', ...);

CREATE TABLE workplan_activity_associations (
  project_id  TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, activity_id)
);
-- + index on activity_id; + RLS mirroring workplan_goals

-- Backfill 1-to-1 from project_id leading digit
INSERT INTO workplan_activity_associations (project_id, activity_id)
SELECT DISTINCT activity_id, substring(activity_id from 1 for 1)
FROM workplan_goals WHERE kind = 'project';
```

### V1-V4 gates (lighter shape — schema add, not re-key)

  - **V1 (cardinality):** total wpg = 64 (54 projects + 10 activities);
    27 distinct projects + 5 distinct activities; 27 associations ✅
  - **V2 (project coverage):** every kind='project' activity_id has
    exactly 1 association ✅
  - **V3 (association integrity):** every association resolves to a
    real kind='activity' AND a real kind='project' row ✅
  - **V4 (validator):** post-migration `_validate_workplan_goals.py`
    reports 54 matches, 0 drift, 27 associations clean ✅

Backfill distribution: Activity 1 → 4 projects (1.1-1.4); Activity 2 →
4 (2.1-2.4); Activity 3 → 9 (3.1, 3.1.1, 3.1.2, 3.1.2a, 3.2-3.6);
Activity 4 → 9 (4.1, 4.1.1-4.1.4, 4.2-4.5); Activity 5 → 1 (5.1).
Totals 27.

### Code changes that rode along

The migration touched the four scripts that consume `workplan_goals`:

  - **`kb/_load_workplan_goals.py`** — new `load_workplan_goals_full()`
    returns `(rows, associations, fetched_at, source)`; legacy
    `load_workplan_goals()` keeps its tuple shape for backwards-compat.
    SELECT now pulls the `kind` column. Snapshot file carries both
    `rows` and `associations`.
  - **`kb/_validate_workplan_goals.py`** — `reshape_supabase()` scopes
    to `kind='project'` so the Excel-A+ comparison ignores Activity
    rows (they're curator-managed, not Excel-derived). New
    `validate_associations()` does the application-enforced FK
    check (orphan-activity, orphan-project, projects-without-assoc).
    `read_supabase_json()` now accepts both flat-list legacy input
    AND the snapshot-shaped `{rows: [...], associations: [...]}` dict.
  - **`kb/_seed_workplan_goals_apply.py`** — every PATCH/DELETE
    scoped to `kind=eq.project` so the apply loop can never touch
    an Activity row. INSERT payload includes `"kind": "project"`
    explicitly. V3 cardinality check counts kind='project' rows
    (was: all rows). V4 calls the extended validator signature.
  - **`excel_to_dashboard.py`** — `build_workplan_goals_from_supabase()`
    filters `kind='activity'` out of `by_aid` so the existing
    rendering is unchanged. PR-B will add the proper Activities
    section.

The `kind or 'project'` default appears in 4 places (loader, validator,
seed planner via reshape_supabase, generator). This lets pre-PR-A
snapshots fall through gracefully — important for the
snapshot-fallback resilience pattern.

### Lessons (post-Phase-1-extension)

**11. The first non-Excel-derived `workplan_goals` rows landed.** PR-A
introduces the first rows in `workplan_goals` that aren't in Excel A+.
The seed planner had to be taught to ignore them — `reshape_supabase`
now filters by `kind='project'`. This is the model for every future
expansion of the table: anything curator-managed lives behind a
`kind` discriminator so the Excel-A+ planner stays oblivious to it.

**12. `apply_migration` is the right shape when DDL fits one
transaction.** Phase 1 needed `workflow_dispatch` because the apply
script iterated 54 row operations via PostgREST. PR-A is one DDL
batch + a backfill INSERT, all in one transaction the migration
runner already gives us atomically. Don't wrap one-shot DDL in a
GitHub Actions workflow when the migration tool handles it directly.

**13. AskUserQuestion paid for architectural forks.** Three
recommended-option questions resolved the design space in one
exchange: ID scheme, ladder values, FK strategy. Each had
materially different blast radius. Surfacing them as forks (with
the recommended option labeled and the trade-offs spelled out)
made the decisions fast and reversible-feeling for Sam.

### Current state at end of PR-A

  - ✅ `workplan_goals` has a `kind` column (default 'project')
  - ✅ 5 Activity rows + 27 Project rows; 64 total (× 2 row_types per id)
  - ✅ `workplan_activity_associations` table exists with 27 backfilled
    1-to-1 associations + RLS mirroring `workplan_goals`
  - ✅ Snapshot carries both tables; loader's full signature returns both
  - ✅ Validator covers associations integrity
  - ✅ Apply script + generator scope to kind='project' consistently
  - ⏳ **PR-B (next):** generator + renderer update. Render Activities
    section as first-class on the tab; project rows show
    "Contributes to: Activity N" chips. Retire the hardcoded
    `activity_labels` dict (it stays in code as a fallback for now).
  - ⏳ **PR-C (after PR-B):** editor + add-flow modal. Activity/Project
    radio + ladder fields + N-to-N multi-select.
  - ⏳ **PR-D (optional):** split into its own tab if the page
    gets dense. Sam's prior preference: one page, two sections.

### Next concrete step

PR-B. The generator + renderer update. The hardcoded `activity_labels`
dict in `excel_to_dashboard.py` (lines 1361, 6270) becomes a
fallback; the live label/ladder source becomes the Activity rows in
Supabase. Project rows surface their `Contributes to: Activity N`
chips via the new associations table.

