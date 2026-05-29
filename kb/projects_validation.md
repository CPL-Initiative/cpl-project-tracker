---
title: Projects — Excel vs Supabase Validation
date: 2026-05-29
tags: [projects, supabase, excel-migration, validation, phase-2]
related:
  - kb/_validate_projects.py
  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)
  - public.projects (Supabase)
  - docs/kb-notes/phase-2-projects-migration-scope.md
---

# Projects — Excel vs Supabase Validation

**Status:** ✅ in sync

## Summary

- Excel real projects (all rows, excl. `D.*`): **34**
  - of which carry a non-zero KPI ladder (the workplan_goals A+ unit, for cross-reference): **27**
  - of which track qualitatively (0 KPI ladder) — **KEPT** per Sam 2026-05-28: **7**
- Supabase `projects` rows: **34**
- Matches (all mapped columns agree): **34**
- Mismatches (shared id, ≥1 column disagrees): **0**
- Missing in Supabase (Excel project with no Supabase row): **0**
- Orphans in Supabase (row whose id isn't an Excel project): **0**
- Unparseable dates (lenient parse -> NULL + warning): **3**

## Zero-KPI projects kept (in the table, not in A+)

These are real project cards with no quantitative KPI ladder. They belong in `projects` (every grid card) but are NOT in the `workplan_goals` A+ set. Keeping them is intentional.

| id | name |
|---|---|
| `5.2` | AI Certification-to-Course Matching |
| `5.3` | AI Apprenticeship CPL Tools |
| `5.4` | RP Group CPL Field Survey |
| `5.5` | VRC CPL Module Revision |
| `5.6` | WestEd CPL Scope of Work |
| `5.7` | MIS Data Reconciliation |
| `5.8` | CPL Legislative Advocacy (2026 Session) |

## Date parse warnings

Lenient parser (fork #1) could not read these date cells; they will seed as NULL. Confirm the source cell or fix the format.

| id | field | raw value |
|---|---|---|
| `3.6` | end_date | Ongoing |
| `4.2` | end_date | Ongoing |
| `4.4` | end_date | Ongoing |

## How to read this

- **Missing** rows will be INSERTed by the seed step.
- **Mismatches** will be UPDATEd by the seed step (Excel wins).
- **Orphans** will be DELETEd by the seed step.
- Pre-seed, this report is EXPECTED to show every Excel project as **missing** (the `projects` table is empty) and exit 1. Post-seed (PR-3 V4 gate) it must be all-matches / exit 0.

Re-run: `python3 kb/_validate_projects.py` (or `--supabase-json <snapshot>` offline).
