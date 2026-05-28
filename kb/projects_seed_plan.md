---
title: Projects — Supabase Seed Plan (Dry-Run)
date: 2026-05-28
tags: [projects, supabase, excel-migration, seed-plan, phase-2]
related:
  - kb/_seed_projects.py (this generator)
  - kb/_validate_projects.py (the diff)
  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)
  - public.projects (Supabase target)
  - docs/kb-notes/phase-2-projects-migration-scope.md
---

# Projects — Supabase Seed Plan

**Dry-run.** Generated 2026-05-28. No writes executed.

The projects-table unit is every real project in the Project List (every row minus `D.*`), including the qualitative zero-KPI cards (Sam: keep them, 2026-05-28). The plan below is what `kb/_seed_projects_apply.py` (PR-3) would do.

## Summary

- Excel real projects: **34** (non-zero-KPI A+ cross-ref: 27; zero-KPI kept: 7)
- Existing rows in Supabase `projects`: **0**
- **INSERT**: 34 new project rows
- **UPDATE**: 0 existing rows (≥1 column differs)
- **NO-OP**: 0 existing rows already match
- **DELETE**: 0 Supabase rows whose id is no longer an Excel project
- Unparseable dates seeded as NULL: 3

## INSERT — new project rows

| id | name | status | lead | start | end | budget | % |
|---|---|---|---|---|---|---|---:|
| `1.1` | MAP Platform Development | On Track | Terence Nelson | 2024-07-01 | 2026-06-30 | $2,400,000 | 70.0 |
| `1.2` | System Integration & Interoperability | In Progress | Terence Nelson | 2025-01-01 | 2027-06-30 | $200,000 | 45.0 |
| `1.3` | CPL Student Portal | In Progress | Terence Nelson | 2025-06-01 | 2026-12-31 | Included in 1.1 | 60.0 |
| `1.4` | California Credential Registry | Foundational Year | Terence Nelson | 2025-09-01 | 2027-06-30 | Included in 1.2 | 15.0 |
| `2.1` | Statewide Credit Recommendations | On Track | ASCCC / Calvin Klein Gloria | 2024-07-01 | 2030-06-30 | $1,563,900 | 58.0 |
| `2.2` | Faculty Discipline Workgroups | On Track | ASCCC / Calvin Klein Gloria | 2024-07-01 | 2030-06-30 | Included in 2.1 | 44.0 |
| `2.3` | Common Course Crosswalks | In Progress | Terence Nelson | 2025-01-01 | 2026-06-30 | $200,000 | 30.0 |
| `2.4` | Validated Skills | In Progress | ASCCC / Calvin Klein Gloria | 2025-09-01 | 2030-06-30 | Included in 2.1 | 10.0 |
| `3.1` | CPL Offers & Awards Tracking — All Populations | Stretch Met | Samuel Lee / Crystal Nasio | 2024-07-01 | 2030-06-30 | Included in operations | 85.0 |
| `3.1.1` | CPL Offers & Awards Tracking — Working Adults | Stretch Met | Samuel Lee / Crystal Nasio | 2024-07-01 | 2030-06-30 | Included in operations | 85.0 |
| `3.1.2` | CPL Offers & Awards Tracking — Veterans & Service Members | Stretch Met | Samuel Lee / Crystal Nasio | 2024-07-01 | 2030-06-30 | Included in operations | 85.0 |
| `3.1.2a` | CPL Offers & Awards Tracking — Apprentice Cohort | Stretch Met | Samuel Lee / Crystal Nasio | 2024-07-01 | 2030-06-30 | Included in operations | 85.0 |
| `3.2` | CPL Units Transcription | Stretch Met | Samuel Lee / Crystal Nasio | 2024-07-01 | 2030-06-30 | Included in operations | 80.0 |
| `3.3` | Institutional Participation | Stretch Met | Crystal Nasio | 2024-07-01 | 2030-06-30 | $5,900,000 | 73.0 |
| `3.4` | Student Impact Rate Survey | Not Started | Terence Nelson | 2026-04-01 | 2026-12-31 | Included in 1.1 | 5.0 |
| `3.5` | Student Stories | On Track | Crystal Nasio | 2024-07-01 | 2026-06-30 | Included in 1.1 | 64.0 |
| `3.6` | College Tracking & Recognition | On Track | Crystal Nasio | 2024-07-01 | ∅ | Included in 1.1 | 70.0 |
| `4.1` | Sprints and Projects | On Track | Calvin Klein Gloria | 2024-09-01 | 2026-06-30 | Included in 1.1 | 65.0 |
| `4.1.1` | Veteran Sprint | On Track | Calvin Klein Gloria | 2024-09-01 | 2026-06-30 | Included in 1.1 | 65.0 |
| `4.1.2` | Apprenticeship Sprint | In Progress | Terence Nelson | 2025-01-01 | 2026-06-30 | $1,345,236 | 35.0 |
| `4.1.3` | Statewide Adoption Sprint | On Track | Crystal Nasio | 2025-01-01 | 2027-06-30 | Included in 3.3 | 55.0 |
| `4.1.4` | 29 Palms Marine Corps Base Demo | In Progress | Calvin Klein Gloria | 2025-09-01 | 2027-03-31 | Included in 1.1 | 20.0 |
| `4.2` | Strategic Partnerships | Stretch Met | Samuel Lee | 2024-07-01 | ∅ | Included in operations | 80.0 |
| `4.3` | Technical Assistance & Training | Stretch Met | Crystal Nasio | 2024-07-01 | 2026-06-30 | $233,589 | 85.0 |
| `4.4` | Law & Regulation Review | On Track | Samuel Lee / James Todd | 2024-07-01 | ∅ | Included in operations | 60.0 |
| `4.5` | Sustainable Funding | In Progress | Samuel Lee / James Todd | 2024-07-01 | 2030-06-30 | $89,000,000 (5-yr plan) | 40.0 |
| `5.1` | AI-Ready California Demonstration | Not Started | Samuel Lee | 2025-09-01 | 2027-09-30 | $7,000,000 | 5.0 |
| `5.2` | AI Certification-to-Course Matching | On Track | Terence Nelson | 2024-07-01 | 2026-06-30 | Included in 2.3 | 55.0 |
| `5.3` | AI Apprenticeship CPL Tools | In Progress | Terence Nelson | 2025-01-01 | 2026-12-31 | $1,400,000 | 30.0 |
| `5.4` | RP Group CPL Field Survey | Goal Met | RP Group | 2024-07-01 | 2025-06-30 | $57,275 | 100.0 |
| `5.5` | VRC CPL Module Revision | In Progress | Beth Kay / Crystal Nasio | 2026-01-06 | 2026-06-30 | Included in 4.3 | 45.0 |
| `5.6` | WestEd CPL Scope of Work | In Progress | WestEd (Erin, Kathy, Rajinder) | 2025-08-01 | 2026-06-30 | Included in 1.2 | 40.0 |
| `5.7` | MIS Data Reconciliation | In Progress | CO MIS / MAP Team | 2025-07-01 | 2027-06-30 | Included in operations | 25.0 |
| `5.8` | CPL Legislative Advocacy (2026 Session) | In Progress | Samuel Lee / James Todd | 2026-01-01 | 2026-09-30 | Included in operations | 50.0 |

> Each INSERT carries all 21 mapped columns (see `kb/_validate_projects.py` FIELD_MAP); the table shows a glance subset. `kpi_target_2026/2030` seed NULL (the ladder lives in `workplan_goals`, joined back at generator time in PR-4); `created_at/updated_at` default `now()`.

## How this applies

When `kb/_seed_projects_apply.py` lands (PR-3, manual `workflow_dispatch`, with your §8 RLS sign-off):

1. POST (INSERT) each row in the INSERT bucket.
2. PATCH (UPDATE) each row in the UPDATE bucket — Excel wins per column.
3. DELETE each row in the DELETE bucket.
4. NO-OP rows skipped.
5. V1-V4 gates, then re-run `kb/_validate_projects.py` — exit 0 confirms parity.

Re-generate this plan: `python3 kb/_seed_projects.py --supabase-json <snapshot>`
