---
title: Projects — Excel vs Supabase Validation
date: 2026-05-28
tags: [projects, supabase, excel-migration, validation, phase-2]
related:
  - kb/_validate_projects.py
  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)
  - public.projects (Supabase)
  - docs/kb-notes/phase-2-projects-migration-scope.md
---

# Projects — Excel vs Supabase Validation

**Status:** ⚠ drift detected

## Summary

- Excel real projects (all rows, excl. `D.*`): **34**
  - of which carry a non-zero KPI ladder (the workplan_goals A+ unit, for cross-reference): **27**
  - of which track qualitatively (0 KPI ladder) — **KEPT** per Sam 2026-05-28: **7**
- Supabase `projects` rows: **0**
- Matches (all mapped columns agree): **0**
- Mismatches (shared id, ≥1 column disagrees): **0**
- Missing in Supabase (Excel project with no Supabase row): **34**
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

## Missing in Supabase

Excel projects with no `public.projects` row. These will be INSERTed by the seed step (PR-2 plan / PR-3 apply).

| id | name |
|---|---|
| `1.1` | MAP Platform Development |
| `1.2` | System Integration & Interoperability |
| `1.3` | CPL Student Portal |
| `1.4` | California Credential Registry |
| `2.1` | Statewide Credit Recommendations |
| `2.2` | Faculty Discipline Workgroups |
| `2.3` | Common Course Crosswalks |
| `2.4` | Validated Skills |
| `3.1` | CPL Offers & Awards Tracking — All Populations |
| `3.1.1` | CPL Offers & Awards Tracking — Working Adults |
| `3.1.2` | CPL Offers & Awards Tracking — Veterans & Service Members |
| `3.1.2a` | CPL Offers & Awards Tracking — Apprentice Cohort |
| `3.2` | CPL Units Transcription |
| `3.3` | Institutional Participation |
| `3.4` | Student Impact Rate Survey |
| `3.5` | Student Stories |
| `3.6` | College Tracking & Recognition |
| `4.1` | Sprints and Projects |
| `4.1.1` | Veteran Sprint |
| `4.1.2` | Apprenticeship Sprint |
| `4.1.3` | Statewide Adoption Sprint |
| `4.1.4` | 29 Palms Marine Corps Base Demo |
| `4.2` | Strategic Partnerships |
| `4.3` | Technical Assistance & Training |
| `4.4` | Law & Regulation Review |
| `4.5` | Sustainable Funding |
| `5.1` | AI-Ready California Demonstration |
| `5.2` | AI Certification-to-Course Matching |
| `5.3` | AI Apprenticeship CPL Tools |
| `5.4` | RP Group CPL Field Survey |
| `5.5` | VRC CPL Module Revision |
| `5.6` | WestEd CPL Scope of Work |
| `5.7` | MIS Data Reconciliation |
| `5.8` | CPL Legislative Advocacy (2026 Session) |

## How to read this

- **Missing** rows will be INSERTed by the seed step.
- **Mismatches** will be UPDATEd by the seed step (Excel wins).
- **Orphans** will be DELETEd by the seed step.
- Pre-seed, this report is EXPECTED to show every Excel project as **missing** (the `projects` table is empty) and exit 1. Post-seed (PR-3 V4 gate) it must be all-matches / exit 0.

Re-run: `python3 kb/_validate_projects.py` (or `--supabase-json <snapshot>` offline).
