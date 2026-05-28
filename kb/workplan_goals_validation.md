---
title: Workplan Goals — Excel vs Supabase Validation
date: 2026-05-28
tags: [workplan-goals, supabase, excel-migration, validation, phase-1]
related:
  - kb/_validate_workplan_goals.py
  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)
  - public.workplan_goals (Supabase)
---

# Workplan Goals — Excel vs Supabase Validation

**Status:** ✅ in sync

## Summary

- Excel A+-derived sub-activities (non-zero ladder, excl. D.*): **27**
- Supabase rows: **27** distinct activity_ids
- Matches (GOAL+STRETCH × 5 years agree): **54**
- Mismatches (overlapping rows that disagree): **0**
- Missing in Supabase (A+ sub-activities without a Supabase row): **0**
- Orphans in Supabase (rows whose activity_id isn't in the A+ set): **0**
- Activity↔Project associations: **27** (orphan-activity: 0, orphan-project: 0, projects-without-assoc: 0)

## In-sync rows (no action needed)

- `1.1` GOAL — MAP Platform Development
- `1.1` STRETCH — MAP Platform Development
- `1.2` GOAL — System Integration & Interoperability
- `1.2` STRETCH — System Integration & Interoperability
- `1.3` GOAL — CPL Student Portal
- `1.3` STRETCH — CPL Student Portal
- `1.4` GOAL — California Credential Registry
- `1.4` STRETCH — California Credential Registry
- `2.1` GOAL — Statewide Credit Recommendations
- `2.1` STRETCH — Statewide Credit Recommendations
- `2.2` GOAL — Faculty Discipline Workgroups
- `2.2` STRETCH — Faculty Discipline Workgroups
- `2.3` GOAL — Common Course Crosswalks
- `2.3` STRETCH — Common Course Crosswalks
- `2.4` GOAL — Validated Skills
- `2.4` STRETCH — Validated Skills
- `3.1` GOAL — CPL Offers & Awards Tracking — All Populations
- `3.1` STRETCH — CPL Offers & Awards Tracking — All Populations
- `3.1.1` GOAL — CPL Offers & Awards Tracking — Working Adults
- `3.1.1` STRETCH — CPL Offers & Awards Tracking — Working Adults
- `3.1.2` GOAL — CPL Offers & Awards Tracking — Veterans & Service Members
- `3.1.2` STRETCH — CPL Offers & Awards Tracking — Veterans & Service Members
- `3.1.2a` GOAL — CPL Offers & Awards Tracking — Apprentice Cohort
- `3.1.2a` STRETCH — CPL Offers & Awards Tracking — Apprentice Cohort
- `3.2` GOAL — CPL Units Transcription
- `3.2` STRETCH — CPL Units Transcription
- `3.3` GOAL — Institutional Participation
- `3.3` STRETCH — Institutional Participation
- `3.4` GOAL — Student Impact Rate Survey
- `3.4` STRETCH — Student Impact Rate Survey
- `3.5` GOAL — Student Stories
- `3.5` STRETCH — Student Stories
- `3.6` GOAL — College Tracking & Recognition
- `3.6` STRETCH — College Tracking & Recognition
- `4.1` GOAL — Sprints and Projects
- `4.1` STRETCH — Sprints and Projects
- `4.1.1` GOAL — Veteran Sprint
- `4.1.1` STRETCH — Veteran Sprint
- `4.1.2` GOAL — Apprenticeship Sprint
- `4.1.2` STRETCH — Apprenticeship Sprint
- `4.1.3` GOAL — Statewide Adoption Sprint
- `4.1.3` STRETCH — Statewide Adoption Sprint
- `4.1.4` GOAL — 29 Palms Marine Corps Base Demo
- `4.1.4` STRETCH — 29 Palms Marine Corps Base Demo
- `4.2` GOAL — Strategic Partnerships
- `4.2` STRETCH — Strategic Partnerships
- `4.3` GOAL — Technical Assistance & Training
- `4.3` STRETCH — Technical Assistance & Training
- `4.4` GOAL — Law & Regulation Review
- `4.4` STRETCH — Law & Regulation Review
- `4.5` GOAL — Sustainable Funding
- `4.5` STRETCH — Sustainable Funding
- `5.1` GOAL — AI-Ready California Demonstration
- `5.1` STRETCH — AI-Ready California Demonstration

## How to read this

- **Missing** rows will be INSERTed by `kb/_seed_workplan_goals.py`.
- **Mismatches** will be UPDATEd by the seed step (Excel A+ wins by construction).
- **Orphans** will be DELETEd by the seed step (Excel A+ is the source of truth).

Re-run: `python3 kb/_validate_workplan_goals.py`
