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
