---
title: Workplan Goals — Supabase Seed Plan (Dry-Run)
date: 2026-05-28
tags: [workplan-goals, supabase, excel-migration, seed-plan, phase-1]
related:
  - kb/_seed_workplan_goals.py (this generator)
  - kb/_validate_workplan_goals.py (the diff)
  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)
  - public.workplan_goals (Supabase target)
---

# Workplan Goals — Supabase Seed Plan

**Dry-run.** Generated 2026-05-28. No writes executed.

Excel A+ derivation is the source-of-truth for this seed: every Project List row with at least one non-zero KPI cell, excluding `D.*` dashboard-metric rows. The plan below shows what `kb/_seed_workplan_goals.py --apply` (lands in a later PR) would do.

## Summary

- A+-derived activities in Excel: **27**
- Existing rows in Supabase: **54**
- **INSERT**: 0 new (activity_id, row_type) rows
- **UPDATE**: 0 existing rows (Excel value(s) differ)
- **NO-OP**: 54 existing rows already match A+
- **DELETE**: 0 Supabase rows whose activity_id is no longer in A+

## NO-OP — already in sync

These rows already match A+; the seed will leave them untouched.

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

## How this applies

When `kb/_seed_workplan_goals.py --apply` lands (next PR):

1. Per-row INSERT for each row in the INSERT bucket.
2. Per-row UPDATE for each row in the UPDATE bucket — value cells + name.
3. Per-row DELETE for each row in the DELETE bucket.
4. NO-OP rows are skipped.
5. Re-run `kb/_validate_workplan_goals.py` post-apply — exit code 0 confirms parity.

Re-generate this plan: `python3 kb/_seed_workplan_goals.py`
