---
title: A gate cannot protect the step that fills it
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, automation, cron, gates, supabase, loader, safety]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/map_custom_report_load]]"
  - "[[docs/map_custom_reports_lessons]]"
  - "[[docs/kb-notes/methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action]]"
artifacts:
  - kb/supabase_map_custom_report_staging.sql
  - kb/_sync_map_custom_reports.py
  - tests/map_custom_report_sync_test.py
---

# A gate cannot protect the step that fills it

> **One-sentence summary** — when a pipeline's safety lives in a gate between
> staging and live, every step *upstream* of staging is undefended, and that is
> where the next failure will be.

## Context

The MAP Custom Report load was built with nine gates (G1–G9) between staging and
live, all fail-closed, all reviewed. The first thing that actually broke was the
`DELETE` that empties staging — a step no gate is downstream of. See
`docs/map_custom_reports_lessons.md` § 2026-08-19 (Session 172).

## The claim

**Gates measure staging against live. They therefore cannot fire on a run that
dies on its way to filling staging.** A pipeline reviewed gate-by-gate is a
pipeline reviewed from the midpoint forward; the unreviewed half is the half
that loads.

Three properties made this specific failure invisible until automation started:

1. **The successful runs were not evidence.** Runs 1–3 cleared a small or empty
   staging table. Run 4 was the first to meet a *full* one — and staging is full
   after every successful run, so the cron would have met that state every night
   from then on. **A manual run tests a state the schedule never sees again.**
2. **The fix already existed, a few lines away, written the same day.** The live
   swap in the same workstream had already replaced `DELETE` with `TRUNCATE`, and
   documented why in its own comments. The staging half kept the `DELETE`. *A
   lesson recorded inside one function is not a lesson applied to the pipeline* —
   the same shape as `statewide-is-138-not-84`, where a correct ruling sat
   unenforced because no consumer changed.
3. **The error was undecorated.** `insert()` and `promote()` wrap their HTTP
   failures with what was being attempted; the clear did not, so a statement
   timeout surfaced as a bare `HTTP Error 500` with a urllib traceback. The
   Postgres log named the cause in one line. **A 500 from PostgREST is a symptom;
   read the database log for the same second before theorising.**

## What to do with it

- When reviewing an automated pipeline, **list the steps a gate is not
  downstream of** and defend those separately. Ask specifically: what state does
  step 1 meet on the *second* run that it did not meet on the first?
- **Prefer an operation whose cost does not scale with the data** for bulk
  clearing: `TRUNCATE` in a function, not a mass `DELETE` through PostgREST.
  Measured here: 591,820 rows, timeout → **5.3 s**.
- **Decorate every failure with the step it belongs to and with whether anything
  live changed.** "Nothing live has changed" is worth stating when it is true by
  construction.
- Where a destructive call takes a table name, ask whether it needs to. Moving
  the names into the SQL body removed the argument — and with it the class of
  bug the `assert` was guarding against. See
  `cpl_memory: the-safest-version-of-a-dangerous-step-is-one-that-does-not-exist`.
