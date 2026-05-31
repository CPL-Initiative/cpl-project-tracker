---
title: Excel → Supabase Migration — Workstream Lessons
date: 2026-05-28
tags: [excel-to-supabase, workplan-goals, projects, phase-1, phase-2, migration, source-of-truth, lessons]
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

## 2026-05-28 — Session 14 (Bruh Sonnet), PR-B landed

### What shipped

**PR-B: First-class Activities section + Project chips.** Renderer +
generator update on the Workplan Goals tab. The hardcoded
`activity_labels` dict in `build_workplan_goals_from_supabase()` is
retired as the LIVE source — Activity labels + ladders now flow
from the Supabase `kind='activity'` rows PR-A pre-seeded. The dict
survives as a defensive fallback when Supabase is missing a row.

Decisions Sam locked at the top of PR-B (`AskUserQuestion` × 3):

  - **Layout:** "Conservative + chips" — add a dedicated **Activities**
    table above the existing per-Activity project tables, KEEP the
    project grouping, surface "Contributes to: Activity N" chips on
    each project row. Lowest visual disruption; no regressions on the
    "at-a-glance grouping by Activity" reading experience.
  - **Zero ladders:** always show, even when zero. Activity ladders
    render with 0s in every cell; curators can click any cell and
    fill it via the existing editor. Uniform UX with project rows.
    No state-machine to add later.
  - **Chips:** always render. Even though today's data is 1-to-1
    (every project → exactly one Activity, set by the PR-A prefix
    backfill), the chip line renders so the UI is future-proof for
    N-to-N. Visual repetition (the chip says "Activity 3" inside the
    "Activity 3" group header table) is the cost; consistency is the
    payoff.

### Generator shape

`build_workplan_goals_from_supabase(supabase_rows, associations,
projects, live_data=None)` now returns
`(activities, workplan_goals, annual_goals)`:

  - `activities` — 5 entries (id=`"1"`…`"5"`) with `kind="activity"`
    and the same GOAL/STRETCH ladder shape as project entries.
  - `workplan_goals` — the 27 project entries, each carrying
    `activity_ids: ["3"]` (sourced from associations; falls back to
    the project_id leading digit when an association row is missing).
  - `annual_goals` — the comprehensive table data, unchanged in
    structure but now also carrying `activity_ids` so the same
    chips can surface there.

Internal helper `_render_ladder_rows(entry, bg, kind, name_col_content)`
factors out the GOAL/STRETCH two-row pattern used in both the
Activities table and each Projects table. `name_col_content` is
HTML so a Project row can embed its chip line below the name.

### Editor (`workplan_goals.js`)

Optional `data-kind` discriminator on editable cells. When present,
the editor's PATCH query string includes `&kind=eq.{kind}` so an
Activity-cell edit can never cross into a Project row. The
optimistic-paint querySelectorAll also scopes by `data-kind`.

Backwards-compatible: pre-PR-B cells without `data-kind` work as
before (the unscoped PATCH is still safe today because Activity ids
`"1"`–`"5"` and project ids `"1.1"`, `"1.2"`, … are disjoint).

### Receipts

Smoke test from the snapshot (no Supabase service key needed):

  - `activities=5` · `workplan_goals=27` (projects) · `annual_goals=27`
  - `27` chips rendered (one per project, since 1-to-1 today)
  - `60` `data-kind="activity"` attrs (5 activities × 12 editable
    cells per ladder) · `324` `data-kind="project"` attrs (27 × 12)
  - HTML tag balance: 6 tables · 70 tr · 480 td · all open/close
    counts equal

### Lessons

**14. The `<td rowspan="2">` name cell is a flexible slot.** PR-B
needed to add a chip line below the project name without breaking
the GOAL/STRETCH row layout. Treating the name column as an HTML
slot (a `name_col_content` parameter into the helper) instead of a
plain string let the chip row sit naturally inside the rowspan'd
cell. The chip CSS uses `display:inline-block` so the rendering is
identical regardless of whether the project has 1 or N chips.

**15. Data-attribute discriminators ride invisibly through the
backwards-compat door.** Adding `data-kind` to editable cells in
PR-B doesn't require a breaking change in the editor — the new
attribute is consulted optionally, and pre-PR-B cells fall through
to the existing unscoped PATCH. This is the same shape Bruh Dec
used for `_original_*` overlay siblings in PR-5a; the pattern
generalizes to any "carry the new info alongside but keep working
without it" scenario.

**16. Defensive fallbacks for non-existent rows pay dividends.** The
`activity_ids: [aid.split(".")[0]]` fallback in the build function
isn't theoretical — it covers the case where a curator manually
deletes an association row (or a future re-mint changes the
project_id prefix). The rendering still produces a sensible chip
without an exception. Same shape as the snapshot-fallback chain
PR-4 established: the live path is preferred; the fallback gives a
quieter degraded behavior.

### Current state at end of PR-B

  - ✅ Activities section renders at the top of the tab (5 rows,
    editable, currently zeroed)
  - ✅ Per-Activity project tables keep the at-a-glance grouping
  - ✅ Group header labels source from Supabase (hardcoded dict is
    fallback)
  - ✅ Every project row carries a "Contributes to: Activity N" chip
  - ✅ Editor scopes PATCHes by `data-kind` when present
  - ⏳ **PR-C (next):** editor + add-flow modal. New rows for both
    Activities and Projects; for Projects, multi-select of associated
    Activities. Reuses `workplan_goals.js`'s magic-link auth.
  - ⏳ **PR-D (optional):** split into own tab if Sam wants
    a less dense top page.

### Open follow-up (low-priority)

  - `build_activity_kpis()` (line 1343 of `excel_to_dashboard.py`) has
    its OWN hardcoded `activity_labels` dict — missing Activity 5,
    feeds the KPI cards in the Workplan Activity Metrics section.
    Outside PR-B's scope (different section), but the same Supabase-
    sourced label pattern should apply when that section gets touched.

### Next concrete step

PR-C. The editor add-flow modal. Activity/Project radio + ladder
fields + (for Project) multi-select of associated Activities.
Bundled in the same `workplan_goals.js` editor; reuses the
existing magic-link auth + the new `data-kind` scoping.

## 2026-05-28 — Session 14 (Bruh Sonnet), PR-C landed

### What shipped

**PR-C: Editor add-flow modal.** A "+ Add new row" button appears in
the auth widget bar (signed-in curators only). Clicking it opens a
modal that lets a curator add either an Activity or a Project row
end-to-end without touching the database directly.

Decisions Sam locked at the top of PR-C (`AskUserQuestion` × 3):

  - **Button placement: one button top of tab.** Cleanest, no
    per-section button clutter. Activity/Project radio inside the
    modal selects which kind. Recommended option.
  - **ID validation: strict prefix + collision check.** Activity ID
    must be a single digit; Project ID must be `N.x` where N is an
    existing Activity ID. Both checks run client-side against the
    current page state (`data-aid` query). On collision, the modal
    surfaces a clear error inline. Recommended option.
  - **Add-only this PR.** No name editing, no association editing on
    existing rows. Sam's call: smallest blast radius; revisit if
    curators ask. Recommended option.

### Architecture

`workplan_goals.js` gains five new functions inside the existing IIFE:

  - `collectExistingIds()` — DOM survey: returns `{ activities: [...],
    projects: [...] }` from `[data-aid][data-kind="..."]` selectors.
    Used for both validation and populating the multi-select.
  - `openAddModal(state)` / `closeAddModal()` — overlay + card. Esc /
    overlay-click-outside / Cancel all close. The Esc listener
    auto-removes itself after the first close to avoid stacking.
  - `validateAdd(ctx)` — pure validator. Returns
    `{ ok, errors, payload }` where `payload` carries the
    `wpgRows: [GOAL, STRETCH]` + `assocRows: [...]` shapes ready
    for POST. Computes ladder totals client-side.
  - `submitAdd(ctx)` — runs the validator; on success, POSTs the
    `workplan_goals` batch then (if Project) the
    `workplan_activity_associations` batch. Reloads on success.

The button is hidden when not signed in (it's only added inside the
`if (state.sess)` branch of `buildAuthWidget`).

### POST shape

Supabase PostgREST accepts batch insert as an array body. Two calls
total per Project add (one for `workplan_goals`, one for
`workplan_activity_associations`); one for an Activity add (no
associations needed since Activities don't link to other Activities).

`Prefer: return=representation` is set so the response carries the
inserted rows back — useful for diagnostics if the page reload ever
gets replaced with an in-place row injection (future optimization,
not in PR-C).

### Lessons

**17. Validation is the work of the modal — not the database.** The
modal's `validateAdd` catches collisions, malformed IDs, missing
associations, and surfaces them inline before any POST. Server-side
the constraints are looser (the wpg table accepts any `kind='project'`
activity_id with no prefix rule; the associations table doesn't FK
back to a real Activity). The pattern: client validates against
display-state for fast feedback; server enforces the truly
non-negotiable invariants (PK, RLS, CHECK constraints). Mirrors how
the unified_courses.js Suggested-merges worklist validates against
the in-memory dataset before write.

**18. Page reload is the simplest "render new row" path.** The
alternative — fetching the new row + injecting it into the existing
tables — would have required reproducing the Python renderer's HTML
shape in JavaScript. Worth it eventually for a smoother UX, but for
PR-C's add-flow (an action a curator takes maybe 1-3 times per
session), `window.location.reload()` with an 800ms success message
is fine. Scroll position drops; that's the cost.

**19. DOM-survey selectors are a useful "no separate fetch" pattern.**
`collectExistingIds()` reads the current page state to know what
Activities exist. No Supabase round-trip needed; the page is already
the source of truth for what's been rendered. Same shape as PR-B's
chip rendering reading `activity_ids` from the in-memory
`workplan_goals` list.

### Current state at end of PR-C

  - ✅ Add-flow live for Activities + Projects
  - ✅ Strict ID validation (prefix + collision)
  - ✅ Project add includes multi-select of associations
  - ✅ Modal closes via Esc, overlay-click, Cancel
  - ✅ Server-side RLS still enforces allowed-reviewer write
  - ⏳ **PR-D (optional)** — split into own top-level tab if the page
    feels too dense after PR-A/B/C all land. Sam's prior preference:
    keep as one page with two sections. Park unless curator demand
    signals otherwise.

### Phase 1 + Activity↔Project model now functionally complete

The Workplan Goals tab is now fully Supabase-native end-to-end:

  - **Read path** (PR-4): generator reads from Supabase + snapshot fallback
  - **Schema** (PR-A): kind discriminator + N-to-N associations
  - **Render** (PR-B): first-class Activities section + Contributes-to chips
  - **Edit existing** (PR-5): per-cell inline editor
  - **Add new** (PR-C): modal-driven add-flow

PR-D (separate tab) is the only deferred item. Phase 2-4 (Dashboard
project cards, Budget, Vision 2030, Personnel) follow the
`playbook-measure-first-supabase-migration` template documented in
`docs/kb-notes/` and remain the next architectural big rock.

### Next concrete step

If continuing this workstream: Phase 2 entry point — projects table.
Same 5-step playbook applies. Otherwise the Activity↔Project model
is a clean stopping point.

## 2026-05-28 — Session 14 (Bruh Sonnet), checkpoint after the "3 D items"

### What's been learned since PR-C

After PR-A/B/C closed the Activity↔Project triplet, Sam pushed into three
follow-on items in one continuous session: (1) the Activity-KPI cards
label cleanup, (2) a bug-hunt of the Activity↔Project work, (3) Phase 2
scoping. All three shipped before the checkpoint.

**20. The "open follow-up" line in a PR row IS the next session's
TODO.** PR-B's CLAUDE.md row carried an "Open follow-up" note about
`build_activity_kpis()`'s second hardcoded `activity_labels` dict. When
Sam said "let's push the 3 D items", that line was waiting. Lesson: the
follow-up note on the PR row should be detailed enough that the next
session (or even Future Me) doesn't have to re-derive the scope —
including the specific file:line where the bug lives and what the fix
looks like. PR-B's row did this correctly; PR #173 ate the follow-up in
~5 minutes because the scope was pre-written.

**21. Cleanup PRs surface NEW pre-existing bugs.** Fixing the
`activity_labels` dict revealed that `core_ids` in the same function is
ALSO stale — doesn't include `5.1`, uses `4.1a-d` instead of
`4.1.1-4.1.4`. Same family as the renderer bug Bruh Baker surfaced in
Phase 1 PR-1's drift report. Documented as "still open (separate
pre-existing bug)" on the PR-173 row rather than scope-creeping the
cleanup. Lesson: when a small cleanup uncovers a structurally similar
but larger bug, name it on the same PR row so it doesn't get lost — but
don't ship the larger fix in the small PR.

**22. Background bug-hunt agents earn their cost when the changes are
small.** Spawned a general-purpose code-review agent to bug-hunt
PR-A/B/C/cleanup while I started the Phase 2 scoping doc in parallel.
3.5 minutes of agent time produced 9 findings; 3 were real, 6 were
dismissed with reasoning. The XSS-via-`title=""` finding was the
highest-impact one and would have been easy to miss in a manual re-read
because it was a PR-B-introduced regression at a renderer site that had
been safe before curators became writers. Lesson: when a multi-PR
workstream lands in one session, a focused bug-hunt agent immediately
after is a high-yield discipline. Cheap (~$0.50 of tokens) vs the cost
of an XSS in a public dashboard.

**23. HTML escape audits need to cover EVERY rendered site, not just
the one the agent flagged.** The agent identified the `title=""`
attribute as the highest-impact XSS vector. Reading the same renderer
carefully, there were FIVE MORE sites where the same Supabase-sourced
name landed in the visible cell body or group header. Same risk class,
lower realistic exploitability (attribute injection slightly easier
than tag injection, but both bad). Fixing only the agent's flagged site
would have been an incomplete fix. Lesson: when an XSS audit finds one
hole in a renderer, do a sweep over the whole renderer — same data
source, same risk class, same fix. Codified as the
`methodology-xss-audit-on-curator-editable-fields` KB note.

**24. Naming-collision gotcha: `import html` shadowed by local `html`
output variable.** The first iteration of the XSS fix used
`html.escape(...)` directly. The function builds its rendered output in
a local variable named `html`, which shadowed the import.
`'str' object has no attribute 'escape'` at runtime. Fixed by
`from html import escape as html_escape`. Lesson: when adding a stdlib
import to a long-existing file, grep for local variable names that
match the module name first. Aliasing via `as html_escape` is the safe
fallback.

### Current state

**Phase 1 + Activity↔Project triplet + cleanup + bug fixes all shipped
(PRs #162-#174).** Phase 2 scoped (PR #175). The Workplan Goals tab is
end-to-end Supabase-native with first-class Activities, N-to-N
associations, chips, the add-flow modal, and XSS-safe rendering.

The only outstanding loose end for the Workplan Goals work is the
**Activity 5 KPI cards still don't appear** on the dashboard — because
the `core_ids` list inside `build_activity_kpis()` is hardcoded and
doesn't include `5.1`. Same family as the Phase 1 drift Bruh Baker
caught. Out of scope for today's session; fix is to auto-derive
`core_ids` from the projects list (the A+ derivation pattern).

### Strategic roadmap

**Phase 2 is fully scoped + ready to go.** The 6 forks at the bottom of
`docs/kb-notes/phase-2-projects-migration-scope.md` need Sam to lock
before PR-1 ships. The forks are:

1. `start_date`/`end_date` parser strictness
2. `budget` as text vs numeric
3. `status` enum vs free-form
4. `override`/`excel_row` drop confirmation
5. JS contract — `kpi_target_2026`/`kpi_target_2030`
6. RLS shape (mirror `kb_curation` / `workplan_goals`)

After the forks lock, the 5-step PR plan mirrors Phase 1 exactly:
validator → dry-run → apply → generator switch + snapshot → editor →
retire dead code. Cost estimate: 6-7 PRs, one focused session.

Phase 3-5 (Budget / Vision 2030 / Personnel) follow the same template
sequentially.

### Parked

  - **`build_activity_kpis()` `core_ids` auto-derivation** — surfaces
    Activity 5 KPI cards + fixes the `4.1a-d` vs `4.1.1-4.1.4`
    mismatch. Auto-derive from projects list using the A+ pattern.
  - **Excel KPI ladder column retirement** — needs all three JS
    consumers (`generate_reports.js`, `report_generator.js`,
    `college_report_generator.js`) to migrate first.
  - **PR-D** — separate Workplan Goals tab. Parked unless curator
    usage signals demand.

### Next concrete step

Sam reviews the six forks in
`docs/kb-notes/phase-2-projects-migration-scope.md` and locks the
decisions. Then PR-1 (validator + snapshots) ships on a fresh branch
mirroring `kb/_validate_workplan_goals.py`. Expected initial diff:
27 missing + 0 mismatches + 0 orphans (Supabase `projects` table is
empty today).

---

## 2026-05-28 — Session 15 (Bruh Parallax)

Picked up the Bruh Sonnet handoff: fix the vault sync, lock the six Phase 2
forks, ship Phase 2. Ran the work as **parallel lanes** — background sub-agents
for the build-surface survey + the vault fix + the core_ids draft, while the
main thread drove Phase 2 PR-1→3. Sam locked all six forks ("accept all") in
one `AskUserQuestion` round and green-lit the live apply.

### What shipped

- **PR #178 — vault-sync repoint.** `$vaultRoot` → `Documents\GitHub\COG-second-brain`
  (Bruh Sonnet root-caused it; this session fixed it). Playbook gained the
  Windows cutover steps. `setup-task-scheduler.ps1` untouched (resolves the
  sync script via `$PSScriptRoot`).
- **PR #180 — core_ids auto-derive** (handoff carryover #3). `build_activity_kpis()`
  now derives `core_ids` via the A+ rule + module-level `SPRINT_IDS=['4.1.1'..'4.1.4']`;
  fixed the stale `4.1a→4.1.1` in `pid_to_kpi_key`. Activity 5 renders (5.1),
  the 4.1 sprint composite counts 4, Activity 3 goes 6→9 cards.
- **Phase 2 PR-1/2/3** (#179/#181/#182) — validator + seed plan + apply
  artifacts, mirroring Phase 1. RLS tighten applied live via MCP.

### Lessons

1. **Measure-first earns its keep — again.** The Phase 2 scope doc asserted the
   projects-table unit = the workplan_goals A+ rule (non-zero KPI) → 27. A
   ~30-line measurement against the real Excel showed the projects table needs
   **all 34 real projects** — the A+ filter would have silently dropped 7
   qualitative Activity-5 projects (`5.2`-`5.8`) that ARE grid cards. **The
   derivation UNIT is table-specific: it follows what the table FEEDS, not the
   prior phase's filter.** Surfaced to Sam → "keep the zero-KPI cards." (Folded
   into the measure-first playbook as a step-3 caution.)
2. **RLS: tighten before exposing; the service key bypasses it.** `public.projects`
   carried the same loose `Allow auth write` (ALL `using(true)`) that workplan_goals
   had pre-Phase-1 — anyone with the public anon key could write. Mirror the
   gated shape (`is_allowed_reviewer()` I/U/D, public SELECT) **before** the
   table is seeded + exposed. The seed's `service_role` key bypasses RLS, so the
   seed works either way — but the table must never sit seeded + write-open.
   Applied via MCP `apply_migration` (one-shot-DDL path); the per-row seed uses
   the workflow. (Folded into the playbook as step 4b.)
3. **Seeding ≠ cutover.** Seeding the Supabase table is low-risk because the
   generator still reads Excel until PR-4. The write threshold (live DB write +
   schema migration) is real; the *user-facing* threshold is PR-4. Separate them
   in the human's mental model when asking for the go.
4. **A worktree sub-agent can land on a stale base.** The core_ids background
   agent drafted against the 2026-05-25 code state (its worktree base), where
   `build_workplan_goals_from_projects` still existed (PR #167 had deleted it on
   main). Its root-cause + fix approach were sound, but I re-implemented against
   fresh main rather than merging its branch. **Treat a sub-agent's diff as a
   proposal; re-apply against current main.**
5. **`merge ≠ apply`.** PR-3 lands the apply script + workflow + RLS SQL but
   applies nothing on merge — the seed is a manual `workflow_dispatch`, the RLS
   a deliberate MCP call. Keep the §8 human gate at the irreversible step, not
   the PR button. (Auto-merged the mechanical vault fix on green; held the
   visible-output core_ids change for Sam's nod — calibrate the merge bar to
   blast radius.)

### Current state

- **Vault:** repointed in-repo (PR #178). **Sam still owes the Windows-side
  cutover** — clone into `Documents\GitHub\COG-second-brain`, re-run
  `setup-task-scheduler.ps1`, archive orphan clones (steps in the playbook).
- **core_ids:** fixed; lands on the dashboard at the next daily cron regen.
- **Phase 2:** PR-1/2/3 merged; RLS tightened + verified live on `public.projects`
  (4 policies, loose one gone). **The 34-row seed is PENDING Sam's
  `workflow_dispatch`** of "Projects Phase 2 — Seed Apply".
- `public.projects`: empty, RLS-gated, ready to seed. Nothing reads it yet
  (generator reads Excel until PR-4).

### Strategic roadmap

- **Immediate:** Sam dispatches the seed workflow → 34 rows land under V1-V4 +
  receipts under `kb/projects_seed_out/<date>/`. Verify (count=34, validator green).
- **PR-4 (next threshold):** generator reads Supabase + snapshot fallback — the
  actual dashboard cutover. Joins `workplan_goals kind='project'` for the
  KPI-ladder contract so the 3 JS report consumers see no change. "Data as of"
  stamp + `kb/_load_projects.py` (mirror `kb/_load_workplan_goals.py`).
- **PR-5/6:** inline editor (mirror `workplan_goals.js`) + retire `read_projects()`.
- **Phases 3-5:** Budget / Vision 2030 / Personnel — same five-step shape + the
  RLS-tighten step. Personnel already has 26 rows (its PR-3 has UPDATEs, not
  just INSERTs).

### Next concrete step

Sam dispatches "Projects Phase 2 — Seed Apply" (Actions → Run workflow → `main`).
On green: verify the 34 rows + validator, then scope PR-4 (the cutover).

## 2026-05-29 — Session 16 (Bruh Word) — Phase 2 cutover + editor (COMPLETE)

Picked up the Bruh Parallax handoff. The seed was the gating step; Sam
dispatched it at session open → **34 rows landed, V1-V4 green on first attempt**
(receipts `kb/projects_seed_out/2026-05-29/`, commit `472f798`). Then drove
PR-4 (cutover) + PR-5 (editor) to merge. Phase 2 is now functionally complete.

### What shipped
- **PR #184 — PR-4 cutover.** `kb/_load_projects.py` (Supabase fetch + snapshot
  fallback, mirrors `_load_workplan_goals.py`) + `build_projects_from_supabase()`
  + `load_projects()` with three-tier resilience **Supabase → snapshot → Excel**.
  Subtle "Project data as of YYYY-MM-DD" stamp. Backed by
  `kb/_test_projects_parity.py` proving byte-identical output to `read_projects()`.
- **PR #185 — gitignore agent worktrees.** `.claude/worktrees/` (stop-hook
  surfaced the running PR-5 agent's worktree as untracked).
- **PR #186 — PR-5 editor.** `projects_editor.js`, 17 fields, mirrors
  `workplan_goals.js`. Built by a worktree sub-agent, reviewed + hardened.

### Lessons

**1. A byte-identical parity test is the right proof for a data-source cutover.**
PR-4 swapped the projects source from Excel to Supabase. Rather than reason about
correctness, `kb/_test_projects_parity.py` *proved* it: load via the new path,
diff field-by-field against `read_projects()` for the 34 real projects, and the
only diffs must be the explained/intentional ones. It caught **three real things
the scope doc missed** that pure reasoning would likely have shipped wrong (see
lesson 2). The test is also the regression guard for every future regen.
Distilled into `docs/kb-notes/methodology-parity-test-cutover-proof.md`.

**2. The scope doc is a hypothesis; the parity test is the falsifier.** The Phase 2
scope doc (written Session 14) assumed projects = a clean 34-row swap with
`override`/`excel_row` dropped and the ladder sourced from workplan_goals. Reality,
surfaced by measuring + the parity test:
- `read_projects()` returns **49 rows** (34 grid cards + 15 `D.*` KPI-helper rows).
  `D.1/2/3` feed the cohort KPI composites via the `dpop` map. → `D.*` must stay
  Excel-sourced (not migrated, not grid cards).
- `excel_row` (scope doc: "drop") still drives the "Open in Excel" deep-links. →
  kept Excel-sourced; retires with the buttons later.
- The ladder **can't** come losslessly from workplan_goals: wpg stores `0.0` for
  BOTH a blank Excel cell AND a literal `0`, but `read_projects()` renders blank
  as `""` and `0` as `"0"` — project 1.4 has a real `0` target, 5.1 has blanks, so
  wpg-sourcing mis-renders in opposite directions. → ladder stays Excel-sourced
  (and the Excel ladder cols aren't retired in Phase 2 anyway, so no loss).
- `override` (scope doc: "drop") verified all-None across 49 rows → truly a no-op.
**The takeaway: a scope doc written before the code is read is a starting
hypothesis. Measure against the real data + prove parity before trusting it.**

**3. "Retire the legacy reader" (PR-6) was the wrong frame.** Phase 1's PR-6
deleted a dead function. Phase 2's "PR-6 retire `read_projects()`" turned out
**moot** — `read_projects()` is load-bearing for D.*, the ladder, `excel_row`,
and the Excel fallback. A migration doesn't necessarily *kill* the old reader; it
can *demote* it to a fallback + extras provider. Don't assume the legacy path
dies just because the new one lands.

**4. Delegate the big build to a sub-agent, but the review is non-negotiable —
and a hostile-input smoke test IS the review.** PR-5 (a ~485-line editor + 7 new
card rows + Rule-4 dual-file wiring) was built by a worktree sub-agent off fresh
main. It was functionally solid (faithful `workplan_goals.js` mirror), but the
review's hostile-input smoke test (`<script>`, `"`, `<img onerror>` into a project
name) caught a **`data-folder` attribute XSS sink the agent left unescaped** —
because project `name` is now curator-editable (PR-5), every unescaped render of
it is newly live. This is exactly the `methodology-xss-audit-on-curator-editable-
fields` note's prediction ("Phase 2-5 will each introduce a new editor… each
needs this audit"). The smoke test, not the eyeball, is what found it. Treat a
sub-agent's diff as a proposal; the test-driven review is where you earn the merge.

**5. Calibrate the merge gate to blast radius (again).** PR-4 (changes the live
data source) → explicit `AskUserQuestion` before merge. PR-5 (live-write editor +
changes public-card appearance) → `AskUserQuestion` on the one substantive fork
(public-card visibility), then merge once that's answered + review done + CI green.
PR-185 (mechanical `.gitignore`) → auto-merged on green. The gate sits at the
irreversible/visible step, not uniformly on every PR.

### Current state
- **Phase 2 COMPLETE** at the dashboard-tab level: projects read from Supabase
  (snapshot + Excel fallbacks), 17-field inline editor, RLS-gated to
  allowed_reviewers. PR-4/PR-5 merged; the editor CSS + Supabase-sourced cards go
  live on the next daily regen (or a manual `workflow_dispatch`).
- `read_projects()` stays as the Excel fallback + D.*/ladder/excel_row provider.
- Excel still feeds: the KPI ladder (per project cards/reports), `D.*` helpers,
  config overrides, budget, update_log — i.e. Phases 3-5 territory.

### Strategic roadmap
- **Phase 3-5** (Budget / Vision 2030 / Personnel) — same five-step shape
  (snapshot → validate → dry-run → workflow_dispatch apply → cutover) + the
  RLS-tighten step + a parity test. Personnel already has 26 Supabase rows, so its
  PR-3 has UPDATEs (the only phase where V2 source-exists fires on existing rows).
- The Excel KPI ladder columns + `D.*` helpers + the "Open in Excel" buttons
  retire together when the 3 JS report consumers migrate (a Phase 3+ bundle).

### Next concrete step
Phase 3 entry point — pick a tab (Budget is the natural next; it's its own section
already). Write `kb/_validate_budget.py` mirroring `_validate_projects.py`, measure
the real Excel→Supabase diff, and lock any forks before the seed. Or, if verifying
first: dispatch a daily run to see the Supabase-sourced project cards + editor live.

## 2026-05-29 — Session 17 (Q / Qualitastic) — Budget cutover + association editor + orphan close-out + XSS

Picked up the Bruh Word handoff. Verified Phase 2 live (and caught a **live Budget
$0 bug** in the process), then pivoted the bulk of the session to *finishing* the
Activity↔Project association editor (Session 14 built the data model; this session
made it editable + reachable) and a security follow-up.

### What shipped
- **PR #189 — Phase 3 Budget read-path cutover.** Budget tab now reads
  `budget_expenditures` from Supabase (`kb/_load_budget.py` + snapshot fallback +
  "Data as of" stamp). Fixed a live **$0 → ~$89M** rendering bug. Compressed vs
  Phase 2 — the table already had rows, so a direct cutover, not the seed dance.
  Budget inline editor still queued.
- **PR #190 — Activity↔Project association editor.** The "Contributes to" chip line
  became click-to-edit (popover, Supabase CRUD on `workplan_activity_associations`)
  + the **`is_primary`** column (MCP `apply_migration`) + a CSS-accumulation fix.
- **Orphan close-out (Supabase data ops).** Linked the 7 zero-ladder Activity-5
  projects (5.2–5.8) + default-primary-backfilled the 27 existing associations →
  35 associations, 34/34 single-primary, 0 orphans. Audit trail in
  `docs/activity_association_orphan_plan.md`.
- **PR #191 — assoc editor on all 34 Dashboard cards.** Shared `assoc_editor.js`
  module; `workplan_goals.js` refactored to delegate (−441 lines).
- **PR #192 — akpi / CPL_DATA XSS hardening.** Closed the pre-existing sink the
  #191 review surfaced.

### Lessons

**1. An editor whose reach is tied to "what renders" silently orphans the rows
that don't render.** The #190 editor attaches to the Workplan-Goals chip line,
which only renders the 27 A+ (non-zero-KPI) projects. The 7 zero-ladder
Activity-5 projects (5.2–5.8) therefore (a) never got association rows from the
PR-A backfill AND (b) couldn't be linked through the UI even after. The orphan
wasn't a data bug — it was a *reachability* gap. The two-part fix: close the data
orphans (link via Supabase, leads product-owner-confirmed), AND close the reach
gap by putting the editor on a surface that renders **every** row (the Dashboard
Projects Grid — all 34 cards). Lesson: when you add an editor, ask "what subset of
the entity does this surface render?" — anything outside it is un-editable and can
quietly drift out of integrity.

**2. Share one widget across two surfaces with a single delegated listener — never
two bindings.** #191 needed the #190 popover on both the workplan chips and the
project cards. The trap: bind a second handler and clicking a workplan chip opens
*two* popovers. The fix: extract the popover into `assoc_editor.js` with ONE
`document`-level delegated `click` listener (`_hasListener`-guarded so it installs
once), have both surfaces emit the same `data-assoc-edit` anchor markup, and
refactor the original consumer to delegate (removed 441 lines of duplicate popover
from `workplan_goals.js`). The hard-review must then test **both** surfaces — the
refactor is where you can regress the thing that already worked.

**3. The hostile-input test during a *feature* review surfaces *adjacent*
pre-existing sinks — flag them out-of-scope, fix in a focused follow-up.** The #191
injection test (the established review mechanism) found raw `<script>` / `<img
onerror>` leaks — but in the **Activity-KPI cards + the inline `CPL_DATA` JSON**,
not #191's code. Right move: classify them as pre-existing/out-of-scope, note them
in the #191 PR body, keep that diff clean, and fix in a dedicated PR (#192). The
test pays off beyond the thing under review; don't let an adjacent finding bloat
the feature PR, but don't drop it either.

**4. Inline JSON-in-`<script>` is its own XSS class — `html.escape` is the wrong
tool there.** The akpi cards were an HTML-context sink (html.escape fixes those).
But `window.CPL_DATA = {…}` inline is a *JS-string/JSON* context: a name containing
`</script>` breaks out of the script element regardless of HTML escaping. The right
escape is to neutralize `<`/`>`/`&` → `<`/`>`/`&` in the serialized
JSON (`_js_safe_json()`); `JSON.parse` decodes them back so client data is
byte-identical. Extended the `methodology-xss-audit-on-curator-editable-fields`
note with this injection class (its taxonomy listed class (d) but hadn't given it
a concrete escape).

**5. Generator-only is the right diff for a render-layer fix.** #192 committed
ONLY `excel_to_dashboard.py` — not the regenerated HTML/JS. The escaped output
flows to the live site on the next regen (Rule 1: change the generator, not the
artifact). Cleanest reviewable diff, zero churn-revert dance.

**6. Calibrate the merge gate to blast radius (again).** The `is_primary`
migration (§8 source-of-truth schema) — applied via MCP, but only after Sam
pre-authorized it in the same AskUserQuestion as the #190 merge. #190/#191
(public-appearance + new editor) — reviewed + AskUserQuestion on the substantive
forks (orphan leads), then merged. #192 (behavior-preserving security fix) —
merged on green. The gate sits at the irreversible/visible step.

### Current state
- Budget reads from Supabase ($89M live-fixed); association editor complete +
  reachable on all 34 cards; orphans closed (0); `is_primary` live; the akpi/JSON
  XSS sink closed. All merged to `main`; the #191 card editor + ★ primaries + #192
  escaping go live on the **next daily regen**.
- `assoc_editor.js` is now the single association-editor implementation (both
  surfaces delegate to it). Reusable for any future per-card association UI.

### Strategic roadmap
- **Phase 3 Budget** — finish it: a validate/seed pass if the table needs
  reconciliation, then the inline editor (mirror `workplan_goals.js` /
  `projects_editor.js`; XSS-audit any newly-editable field). The read-path cutover
  (#189) is done.
- **Phases 4-5** (Vision 2030 / Personnel) — same five-step shape; Personnel's 26
  existing rows make its PR-3 the UPDATEs-heavy one.
- Carryover unchanged: the Excel ladder cols + `D.*` helpers + "Open in Excel"
  buttons retire with the 3 JS-report-consumer migration (Phase 3+ bundle);
  Obsidian community-plugins recommendation; 1e-5d id_system data-value rename.

### Next concrete step
Confirm the next daily regen renders the #191 card editor + ★ primaries + #192
escaping + the $89M budget live (eyeball the deployed site). Then take the Budget
inline editor (Phase 3 PR-5-equivalent) or Phase 4 Vision 2030.


## 2026-05-31 — Session 23 (Bruh 23): Excel retirement scoped + PR-1 keystone

### (a) What shipped
- **Excel-retirement scope (PR #210, merged)** — `docs/kb-notes/excel-retirement-final-scope.md`.
  Measure-first corrected stale roadmap state: **Personnel is already Supabase**
  (folded into the budget cutover #189), **Vision 2030 is static cards +
  computed/config progress** (not an Excel data table) — neither needs a
  migration. Only **2** report JS consume the ladder (not 3). The whole job
  reduces to: migrate the KPI ladder + 15 `D.*` rows, then sunset `read_projects()`.
- **Excel PR-1 — KPI-ladder keystone (PR #211, merged).** Repointed the ladder
  (`kpi_goal_2526 … kpi_stretch_2930`) in `CPL_Data.js` from Excel
  (`read_projects`) to Supabase `workplan_goals`. New `_build_wg_ladder()` +
  `load_projects()` enrichment (Excel ladder kept as per-project fallback;
  `read_projects()` still the total-outage fallback).

### (b) What was learned
- **The "Excel-sourced for fidelity" blocker was a representational gap, and it
  was tiny.** The ladder data already lived in `workplan_goals`; Excel only
  stayed the source because `workplan_goals` seeded blanks as `0` (couldn't tell
  "no goal" from a literal `0`). Measure-first (Excel vs Supabase, cell-by-cell)
  found the gap was **exactly 11 cells** (5.1 GOAL yrs 1-4 + STRETCH all 5;
  4.1.3/4.1.4 final STRETCH) and **2 real 0s** (1.4) — and **0 mismatches**
  (no curator edits to preserve). Lesson: when a source-swap is "blocked by
  fidelity," MEASURE the gap before assuming it's big; here a 1-line-per-cell
  `UPDATE … = NULL` closed it.
- **Fix the gap at the NEW source, then prove with a parity gate.** NULLed the
  11 cells live (nullable numeric columns already existed — a data fix, not a
  schema migration; pre-fix snapshot archived for reversibility). The repoint
  then regenerated `CPL_Data.js` **byte-identical** to the Excel-sourced ladder
  across all 49 projects (0 diffs) — the go/no-go. 1.4 keeps `'0'/'0'`, 5.1
  keeps `''/''`. Reinforces `methodology-parity-test-cutover-proof.md`.
- **The repoint was output-invisible.** Rendered HTML diff = 17 timestamp lines;
  the report-consumer field contract is unchanged (no JS edit). A clean
  source-swap: same bytes out, Excel no longer the source.
- **Live Supabase reads via MCP are the measure-first tool when no key is local.**
  `execute_sql` (read-only) let me inspect `workplan_goals` storage + apply the
  targeted fix without a service key in the container; the local generator falls
  back to the committed snapshot (which I synced to match the live fix).

### (c) Current state
KPI ladder no longer Excel-sourced (PR-1 done). `read_projects()` still supplies
the 15 `D.*` cohort-helper rows + `excel_row` + the total-outage fallback —
those retire next. Personnel + Vision 2030 confirmed NO-migration. Budget
read-path done; Budget + KPI-ladder inline editors still to build (Sam chose a
dashboard inline editor for the ladder).

### (d) Next concrete step
**Excel PR-2:** migrate the 15 `D.*` cohort-helper rows off Excel (Sam's fork:
`kind='kpi_helper'` in `workplan_goals` recommended — reuses table/RLS/loader/
snapshot, no new migration), repoint `build_activity_kpis()` +
`derive_core_activity_ids()`. Then the **KPI-ladder inline editor** on the
Workplan Goals tab, then **PR-4** sunset `read_projects()` + drop the `.xlsx`.

## 2026-05-31 — Session 24 (Bruh 24): Excel PR-2 — D.* rows RETIRED, not migrated (PR #213)

### (a) What shipped
- **Excel PR-2 (PR #213, draft→merged):** retired the 15 `D.*` sub-population
  helper rows (Students/Eligible-Units/Transcribed/Savings/20yr-Impact ×
  Military/Workforce/Apprentice) instead of migrating them. Generator-only:
  `load_projects()` drops the `helper_rows` append (+ filters `D.*` from the
  Excel-outage fallback); `read_update_log()` skips `D.*` pids; deleted the dead
  `populate_current_metrics()` + its 4 now-orphaned helpers (`_override_int`,
  `_pmetric_int`, `_ppct`, `_pcount`); `kb/_test_projects_parity.py`'s D.*
  assertion became a **no-leak guard**.

### (b) What was learned — **measure the CONSUMER graph before migrating, not just the data**
- **The documented plan rested on a false premise.** The scope doc + Session-23
  handoff said "the 15 `D.*` rows feed `build_activity_kpis()` cohort composites
  (3.1.x, 4.1 sprint)" and Sam pre-locked `kind='kpi_helper'` in `workplan_goals`.
  Tracing the actual consumer graph showed `build_activity_kpis()` only
  *excludes* `D.*`; the sole **value**-reader was `populate_current_metrics()` —
  and that function **has been dead code since 2026-05-28** (Phase 1 PR-4 moved
  the annual-goals "Current" column to `build_workplan_goals_from_supabase()`;
  the call site was dropped, the `def` left behind). Every other ref excludes
  `D.*`; all 3 JS report generators `continue` on them. **Nothing reads their
  values.** So the right move wasn't "migrate" — it was "delete."
- **Lesson:** before migrating a data class, grep for who *reads its values*
  (not who passes it through or excludes it). A `grep` for the literal ids +
  "is this function ever called?" beat the summarized plan. Had I followed the
  pre-locked fork mechanically, I'd have built a CHECK-constraint migration + a
  text column to faithfully store `$172M`/`99k` strings into Supabase — for data
  with zero consumers. Captured as a KB note:
  `docs/kb-notes/methodology-verify-consumer-before-migrating.md`.
- **The fork's "no new migration" premise was also false** independent of the
  vestigial finding: `workplan_goals.kind` has a CHECK `{activity,project}` (so
  `kpi_helper` needs an ALTER) and only numeric year columns (so the formatted
  metric strings need a text column). Surfacing that + the vestigial finding via
  one `AskUserQuestion` (delete / migrate / JSON) → Sam chose delete. Right call
  to ask: schema change needed his nod anyway (§8), and the keep-vs-drop was a
  genuine product fork the code couldn't settle.

### (c) Current state
`read_projects()` now supplies only the KPI ladder (already repointed to
`workplan_goals` in PR-1 — so it's a *fallback* there) + `excel_row` + the
total-outage fallback. The `D.*` responsibility is gone. **CPL_Data.js** sheds
its 15 `D.*` project + 15 `D.*` update_log entries on the next daily regen
(proven locally: regen == committed minus exactly the `D.*` ids, 34 real
projects byte-identical, on both the snapshot AND Excel-fallback paths).
Personnel + Vision 2030 confirmed NO-migration (Session 23). Budget read-path
done; Budget + KPI-ladder inline editors still to build.

### (d) Next concrete step
**KPI-ladder inline editor** on the Workplan Goals tab (Sam chose a dashboard
editor over Supabase-direct) — the ladder cells already render there; mirror
`workplan_goals.js`'s per-cell edit. Then optionally the **Budget inline
editor** (mirrors `projects_editor.js`), then **PR-4**: sunset `read_projects()`
+ drop the `.xlsx` (keep a Supabase→xlsx backup export) once a daily cron
confirms parity with `D.*` gone.
