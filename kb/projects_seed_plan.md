---
title: Projects — Supabase Seed Plan (Dry-Run)
date: 2026-05-29
tags: [projects, supabase, excel-migration, seed-plan, phase-2]
related:
  - kb/_seed_projects.py (this generator)
  - kb/_validate_projects.py (the diff)
  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)
  - public.projects (Supabase target)
  - docs/kb-notes/phase-2-projects-migration-scope.md
---

# Projects — Supabase Seed Plan

**Dry-run.** Generated 2026-05-29. No writes executed.

The projects-table unit is every real project in the Project List (every row minus `D.*`), including the qualitative zero-KPI cards (Sam: keep them, 2026-05-28). The plan below is what `kb/_seed_projects_apply.py` (PR-3) would do.

## Summary

- Excel real projects: **34** (non-zero-KPI A+ cross-ref: 27; zero-KPI kept: 7)
- Existing rows in Supabase `projects`: **34**
- **INSERT**: 0 new project rows
- **UPDATE**: 0 existing rows (≥1 column differs)
- **NO-OP**: 34 existing rows already match
- **DELETE**: 0 Supabase rows whose id is no longer an Excel project
- Unparseable dates seeded as NULL: 3

## NO-OP — already in sync

- `1.1` — MAP Platform Development
- `1.2` — System Integration & Interoperability
- `1.3` — CPL Student Portal
- `1.4` — California Credential Registry
- `2.1` — Statewide Credit Recommendations
- `2.2` — Faculty Discipline Workgroups
- `2.3` — Common Course Crosswalks
- `2.4` — Validated Skills
- `3.1` — CPL Offers & Awards Tracking — All Populations
- `3.1.1` — CPL Offers & Awards Tracking — Working Adults
- `3.1.2` — CPL Offers & Awards Tracking — Veterans & Service Members
- `3.1.2a` — CPL Offers & Awards Tracking — Apprentice Cohort
- `3.2` — CPL Units Transcription
- `3.3` — Institutional Participation
- `3.4` — Student Impact Rate Survey
- `3.5` — Student Stories
- `3.6` — College Tracking & Recognition
- `4.1` — Sprints and Projects
- `4.1.1` — Veteran Sprint
- `4.1.2` — Apprenticeship Sprint
- `4.1.3` — Statewide Adoption Sprint
- `4.1.4` — 29 Palms Marine Corps Base Demo
- `4.2` — Strategic Partnerships
- `4.3` — Technical Assistance & Training
- `4.4` — Law & Regulation Review
- `4.5` — Sustainable Funding
- `5.1` — AI-Ready California Demonstration
- `5.2` — AI Certification-to-Course Matching
- `5.3` — AI Apprenticeship CPL Tools
- `5.4` — RP Group CPL Field Survey
- `5.5` — VRC CPL Module Revision
- `5.6` — WestEd CPL Scope of Work
- `5.7` — MIS Data Reconciliation
- `5.8` — CPL Legislative Advocacy (2026 Session)

## How this applies

When `kb/_seed_projects_apply.py` lands (PR-3, manual `workflow_dispatch`, with your §8 RLS sign-off):

1. POST (INSERT) each row in the INSERT bucket.
2. PATCH (UPDATE) each row in the UPDATE bucket — Excel wins per column.
3. DELETE each row in the DELETE bucket.
4. NO-OP rows skipped.
5. V1-V4 gates, then re-run `kb/_validate_projects.py` — exit 0 confirms parity.

Re-generate this plan: `python3 kb/_seed_projects.py --supabase-json <snapshot>`
