---
title: Measure-first Supabase migration playbook
created: 2026-05-28
updated: 2026-05-28 (Phase 2 — RLS-tighten step + derivation-unit caution added, Session 15 Bruh Parallax)
tags: [playbook, supabase, migration, source-of-truth, apply-gates]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/excel_to_supabase_lessons]]"
  - "[[docs/coursecontrolnumber_remint]]"
  - "[[docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer]]"
artifacts:
  - kb/_validate_workplan_goals.py
  - kb/_seed_workplan_goals.py
  - kb/_seed_workplan_goals_apply.py
  - .github/workflows/workplan-goals-seed-apply.yml
---

# Measure-first Supabase migration playbook

> **One-sentence summary** — Migrating an upstream-data source (Excel, file, scrape) into a Supabase table as new source-of-truth follows the same five-step shape as a re-mint: snapshot → validate → dry-run plan → workflow_dispatch apply with V1-V4 gates → cutover.

## Context

This project keeps hitting the "the data lives in Excel today, we want it in
Supabase tomorrow" problem — Workplan Goals (Phase 1), Project metadata
(Phase 2), Budget (Phase 3), Vision 2030 (Phase 4). Each migration has the
same shape: an existing data source needs to become a Supabase table, with a
dashboard tab that both reads from and writes to the new table, while the old
source quietly retires.

The first instance (Phase 1, Workplan Goals) shipped in 3 PRs across one
session (Session 13, Bruh Baker, 2026-05-28). The pattern that worked is
worth distilling so Phases 2-4 don't redesign the wheel.

## The claim

A source-of-truth migration to Supabase ships safely in this five-step shape:

### 1. Snapshot both sides BEFORE any code

Commit the canonical "before" state of every source under `archive/`:
- The source file (`archive/<file>_YYYY-MM-DD_pre-migration.<ext>`)
- A REST dump of the Supabase table (`archive/<table>_YYYY-MM-DD_pre-seed.json`)

These are the rollback inputs if anything goes wrong post-apply. They cost
nothing (small files committed once) and pay off the day you need them.

### 2. Validator PR — diff every source you can identify

A read-only script that surfaces drift between every source. Usually two —
file vs Supabase — but be alert for **three-way drift**. In Phase 1, the
renderer's hardcoded list of activities was a hidden third source out of sync
with both. You don't find the third source unless you look for it.

The validator outputs a markdown report committed to the repo
(`kb/<topic>_validation.md`). Exit code 0 if clean; exit 1 if any drift.
Supports `--supabase-json PATH` to run offline against a dumped JSON file.

### 3. Dry-run seed PR — auto-derive + plan the writes

Replace any hardcoded lists with auto-derivation from the data
(`derive_<topic>_from_<source>()`). The renderer learns from data — future
additions appear automatically.

**Caution — the derivation UNIT is table-specific.** Don't blindly reuse the
prior phase's derivation filter. Phase 1 (workplan_goals) used an "A+" rule
(every row with a non-zero KPI ladder) because that table is *about* KPI
ladders. Phase 2 (projects) inherited that assumption from the scope doc (→ 27),
but the projects table feeds *every dashboard card*, so its unit is **all real
rows** (→ 34) — the A+ filter would have silently dropped 7 qualitative
projects. The unit follows **what the table feeds**, not the previous
migration. Measure it against the real source (a ~30-line script) before
locking the seed.

A `kb/_seed_<topic>.py` script computes the per-row INSERT / UPDATE / DELETE
plan against the current Supabase state and emits a markdown plan
(`kb/<topic>_seed_plan.md`). **No writes** in this PR. Sam (or the human
reviewer) eyeballs the plan before any apply ships.

### 4. Apply PR — `workflow_dispatch` + in-script V1-V4 gates

A separate `kb/_seed_<topic>_apply.py` script imports the planning logic from
step 3 and adds the actual writes. The apply is triggered by a manual
`workflow_dispatch` button — never on PR merge, never on cron — so a human
button-press is always the gate.

The four in-script gates (lifted from Bruh Dec's credential-rename apply):

| Gate | What | Failure semantics |
|---|---|---|
| **V1** (apply_safe) | Fresh re-derivation produces a coherent plan (N > 0 actions, or N == 0 is a clean no-op) | Abort with cause |
| **V2** (source-exists) | Every UPDATE/DELETE target row exists in Supabase at apply time. Use `Prefer: return=representation` on PATCH; empty-array response means the WHERE matched zero rows | Per-row failure logged + counted; aggregate fails the apply |
| **V3** (cardinality) | Post-apply row count matches the planned expectation (`2 × |derived|` for the GOAL+STRETCH pattern; `len(derived)` for one-row-per-entity) | Abort with the count delta |
| **V4** (validator) | The validator from step 2 re-runs clean (exit 0) post-apply | Abort with the drift summary |

Apply log + plan snapshot land under `kb/<topic>_seed_out/<date>/` for
forensics. Concurrency group `daily-dashboard` on the workflow serializes
against the daily cron so the generator never reads a partially-applied
Supabase state.

### 4b. Tighten RLS before exposing the seeded table

A migrated source-of-truth table the public dashboard reads must never sit
seeded + write-open. Mirror the gated RLS shape of an already-migrated table
(in this project: `public.workplan_goals` — public `SELECT` + `is_allowed_reviewer()`-gated
`INSERT`/`UPDATE`/`DELETE`). Empty tables in this DB ship with a loose
`"Allow auth write" ALL using(true)` policy that lets **anyone with the public
anon key write** — drop it, add the three gated policies, keep public read.

Two facts that set the order:
- The seed's **`service_role` key bypasses RLS**, so the seed works before OR
  after the tighten — but apply the tighten **first** so the table is never
  seeded + write-open.
- RLS is **one-shot DDL** → apply via the Supabase MCP `apply_migration` (the
  schema-migration path), NOT the per-row `workflow_dispatch`. The gated
  policies only bind browser/anon writes (the future inline editor) — exactly
  what the editor PR needs.

Commit the migration SQL (`kb/supabase_<table>_rls_tighten.sql`) for the audit
trail even though it's applied via MCP, mirroring how the apply script is
committed even though it runs in CI.

### 5. Generator switch + snapshot fallback PR

`excel_to_dashboard.py` reads from Supabase (replacing the file read). A
daily-cached snapshot at `kb/<topic>_snapshot.json` provides graceful
degradation if Supabase is briefly unreachable — generator falls back, logs
a warning, renders with a subtle "as of YYYY-MM-DD" stamp in the rendered tab.
Both Supabase down AND snapshot missing → fail loudly (no silent rendering
of nothing).

The editor + the old-source retire are separate downstream PRs.

## How we got here

Phase 1 (Workplan Goals, 2026-05-28) shipped this pattern across PRs #162,
#163, #164. The choice points were:

- **Source-of-truth vs overlay (Pushback in scoping):** initially I leaned
  overlay (safer, reversible); Sam pushed for source-of-truth (cleaner long-
  term, no dual write paths). Source-of-truth won because the alternative
  required Excel + Supabase to coexist forever — too costly.
- **Auto-derive vs hand-coded list:** the validator surfaced a stale
  hardcoded `core_ids` list in the renderer that had drifted from Excel.
  Sam picked auto-derive ("A+") to retire the maintenance burden.
- **Apply gate shape:** lifted directly from Bruh Dec's credential-rename
  apply (`docs/exhibit_canonicalization_lessons.md`, Session 12). The V1-V4
  pattern generalized cleanly; only the data shape and the cardinality
  formula change between migrations.

End-to-end synthetic test pattern (monkey-patched HTTP layer + 30-line
round-trip verification) caught nothing in Phase 1 but gave confidence
before workflow_dispatch. The same template will catch real bugs in Phases
2-4 where the schema is more elaborate.

**Phase 2 (projects, Session 15, Bruh Parallax) confirmed the shape
generalizes:** PRs #179 (validator) / #181 (dry-run) / #182 (apply + RLS)
shipped in one session; the same V1-V4 gates applied with V3 = `len(derived)`
(one row per project — no GOAL/STRETCH multiplier). Two Phase-2 additions fed
back into this playbook: the **RLS-tighten step (4b)** and the
**derivation-unit caution (step 3)**.

## When this applies (and when it doesn't)

**Applies:**
- One-shot, atomic data migration from a single upstream source (file,
  scrape, manual edit surface) into a Supabase table that will become
  source-of-truth.
- Cases where you can compute the expected post-apply row count from the
  derived set (the V3 gate needs a closed-form expectation).
- Cases where Excel (or whatever the old source is) can be quietly retired
  without bidirectional sync.

**Doesn't apply:**
- Overlay-style migrations where the file stays canonical and Supabase
  carries diffs (use the `kb_curation` overlay pattern instead).
- Migrations where two systems must stay in sync indefinitely (those need a
  bidirectional sync, not a one-shot apply).
- Migrations where the destination table already has live writers who must
  not be disturbed (workplan_goals had 0 writers; if there's an active
  editor mid-migration, the V3 cardinality check breaks).

## See also

- `[[docs/excel_to_supabase_lessons]]` — Phase 1 workstream notebook
- `[[docs/coursecontrolnumber_remint]]` — the original re-mint playbook
  this pattern adapts
- `[[docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer]]` — Bruh Dec's
  ADR; doesn't directly apply (workplan goals isn't synthetic identity), but
  the snapshot-before-write sibling principle does
- PR `#162` (validator + snapshot), PR `#163` (A+ + dry-run), PR `#164` (apply)

---

*Authoring check: durable (re-mints + Supabase migrations are the project's
backbone for the next year), reusable (Phases 2-4 + future workstreams),
distilled (one shape), self-contained (frontmatter + opener tell a stranger
the playbook).*
