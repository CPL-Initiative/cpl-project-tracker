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
- Existing rows in Supabase: **20**
- **INSERT**: 34 new (activity_id, row_type) rows
- **UPDATE**: 20 existing rows (Excel value(s) differ)
- **NO-OP**: 0 existing rows already match A+
- **DELETE**: 0 Supabase rows whose activity_id is no longer in A+

## INSERT — new rows

| activity_id | name | row_type | 25-26 | 26-27 | 27-28 | 28-29 | 29-30 | total |
|---|---|---|---:|---:|---:|---:|---:|---:|
| `3.1.2` | CPL Offers & Awards Tracking — Veterans & Service Members | GOAL | 30,000 | 40,000 | 50,000 | 60,000 | 70,000 | 250,000 |
| `3.1.2` | CPL Offers & Awards Tracking — Veterans & Service Members | STRETCH | 40,000 | 55,000 | 70,000 | 85,000 | 100,000 | 350,000 |
| `3.1.2a` | CPL Offers & Awards Tracking — Apprentice Cohort | GOAL | 500 | 2,500 | 7,500 | 10,000 | 20,000 | 40,500 |
| `3.1.2a` | CPL Offers & Awards Tracking — Apprentice Cohort | STRETCH | 1,000 | 5,000 | 15,000 | 30,000 | 40,000 | 91,000 |
| `3.2` | CPL Units Transcription | GOAL | 90,000 | 195,000 | 315,000 | 450,000 | 750,000 | 1,800,000 |
| `3.2` | CPL Units Transcription | STRETCH | 180,000 | 390,000 | 630,000 | 930,000 | 1,500,000 | 3,630,000 |
| `3.3` | Institutional Participation | GOAL | 50 | 60 | 80 | 90 | 100 | 380 |
| `3.3` | Institutional Participation | STRETCH | 100 | 116 | 118 | 130 | 140 | 604 |
| `3.4` | Student Impact Rate Survey | GOAL | 0.70 | 0.75 | 0.80 | 0.85 | 0.95 | 4.05 |
| `3.4` | Student Impact Rate Survey | STRETCH | 0.80 | 0.85 | 0.90 | 0.95 | 0.95 | 4.45 |
| `3.5` | Student Stories | GOAL | 30 | 60 | 120 | 160 | 200 | 570 |
| `3.5` | Student Stories | STRETCH | 100 | 150 | 200 | 230 | 250 | 930 |
| `3.6` | College Tracking & Recognition | GOAL | 2 | 5 | 8 | 10 | 12 | 37 |
| `3.6` | College Tracking & Recognition | STRETCH | 4 | 10 | 16 | 20 | 24 | 74 |
| `4.1` | Sprints and Projects | GOAL | 1 | 4 | 7 | 11 | 15 | 38 |
| `4.1` | Sprints and Projects | STRETCH | 4 | 10 | 16 | 23 | 30 | 83 |
| `4.1.1` | Veteran Sprint | GOAL | 1 | 2 | 3 | 4 | 5 | 15 |
| `4.1.1` | Veteran Sprint | STRETCH | 2 | 4 | 6 | 8 | 10 | 30 |
| `4.1.2` | Apprenticeship Sprint | GOAL | 1 | 2 | 3 | 4 | 5 | 15 |
| `4.1.2` | Apprenticeship Sprint | STRETCH | 2 | 4 | 6 | 8 | 10 | 30 |
| `4.1.3` | Statewide Adoption Sprint | GOAL | 1 | 2 | 3 | 4 | 5 | 15 |
| `4.1.3` | Statewide Adoption Sprint | STRETCH | 2 | 4 | 6 | 8 | 0 | 20 |
| `4.1.4` | 29 Palms Marine Corps Base Demo | GOAL | 1 | 2 | 3 | 4 | 5 | 15 |
| `4.1.4` | 29 Palms Marine Corps Base Demo | STRETCH | 2 | 4 | 6 | 8 | 0 | 20 |
| `4.2` | Strategic Partnerships | GOAL | 3 | 7 | 11 | 15 | 40 | 76 |
| `4.2` | Strategic Partnerships | STRETCH | 6 | 12 | 22 | 30 | 8 | 78 |
| `4.3` | Technical Assistance & Training | GOAL | 10 | 23 | 35 | 48 | 60 | 176 |
| `4.3` | Technical Assistance & Training | STRETCH | 20 | 26 | 70 | 96 | 120 | 332 |
| `4.4` | Law & Regulation Review | GOAL | 2 | 5 | 7 | 9 | 10 | 33 |
| `4.4` | Law & Regulation Review | STRETCH | 4 | 10 | 14 | 18 | 20 | 66 |
| `4.5` | Sustainable Funding | GOAL | 1 | 3 | 4 | 5 | 6 | 19 |
| `4.5` | Sustainable Funding | STRETCH | 2 | 6 | 8 | 10 | 12 | 38 |
| `5.1` | AI-Ready California Demonstration | GOAL | 0 | 0 | 0 | 0 | 4 | 4 |
| `5.1` | AI-Ready California Demonstration | STRETCH | 0 | 0 | 0 | 0 | 0 | 0 |

## UPDATE — value (and sometimes name) drift

Per-row: Excel A+ values overwrite Supabase. Name updates also applied when the row name has drifted.

### `1.1` — MAP Platform Development — GOAL

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 4 | 3 ⚠ |
| 2026-27 | 1 | 9 | 8 ⚠ |
| 2027-28 | 1 | 18 | 17 ⚠ |
| 2028-29 | 1 | 22 | 21 ⚠ |
| 2029-30 | 1 | 25 | 24 ⚠ |

### `1.1` — MAP Platform Development — STRETCH

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 8 | 7 ⚠ |
| 2026-27 | 1 | 18 | 17 ⚠ |
| 2027-28 | 1 | 28 | 27 ⚠ |
| 2028-29 | 1 | 36 | 35 ⚠ |
| 2029-30 | 1 | 50 | 49 ⚠ |

### `1.2` — System Integration & Interoperability — GOAL

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 2 | 1 | -1 ⚠ |
| 2026-27 | 3 | 2 | -1 ⚠ |
| 2027-28 | 3 | 3 | 0 |
| 2028-29 | 2 | 4 | 2 ⚠ |
| 2029-30 | 2 | 5 | 3 ⚠ |

### `1.2` — System Integration & Interoperability — STRETCH

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 3 | 2 | -1 ⚠ |
| 2026-27 | 4 | 4 | 0 |
| 2027-28 | 4 | 6 | 2 ⚠ |
| 2028-29 | 3 | 8 | 5 ⚠ |
| 2029-30 | 3 | 10 | 7 ⚠ |

### `1.3` — CPL Student Portal — GOAL

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 100 | 99 ⚠ |
| 2026-27 | 1 | 1,000 | 999 ⚠ |
| 2027-28 | 1 | 5,000 | 4,999 ⚠ |
| 2028-29 | 1 | 11,000 | 10,999 ⚠ |
| 2029-30 | 1 | 20,000 | 19,999 ⚠ |

### `1.3` — CPL Student Portal — STRETCH

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 200 | 199 ⚠ |
| 2026-27 | 1 | 2,000 | 1,999 ⚠ |
| 2027-28 | 1 | 10,000 | 9,999 ⚠ |
| 2028-29 | 1 | 22,000 | 21,999 ⚠ |
| 2029-30 | 1 | 40,000 | 39,999 ⚠ |

### `1.4` — California Credential Registry — GOAL

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 250 | 0 | -250 ⚠ |
| 2026-27 | 350 | 50 | -300 ⚠ |
| 2027-28 | 200 | 110 | -90 ⚠ |
| 2028-29 | 100 | 175 | 75 ⚠ |
| 2029-30 | 100 | 250 | 150 ⚠ |

### `1.4` — California Credential Registry — STRETCH

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 400 | 0 | -400 ⚠ |
| 2026-27 | 500 | 200 | -300 ⚠ |
| 2027-28 | 300 | 440 | 140 ⚠ |
| 2028-29 | 200 | 900 | 700 ⚠ |
| 2029-30 | 100 | 1,000 | 900 ⚠ |

### `2.1` — Statewide Credit Recommendations — GOAL *(name change: "Faculty/Industry Workgroups & Credit Recommendations" → "Statewide Credit Recommendations")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 100 | 200 | 100 ⚠ |
| 2026-27 | 200 | 400 | 200 ⚠ |
| 2027-28 | 250 | 600 | 350 ⚠ |
| 2028-29 | 225 | 800 | 575 ⚠ |
| 2029-30 | 225 | 1,000 | 775 ⚠ |

### `2.1` — Statewide Credit Recommendations — STRETCH *(name change: "Faculty/Industry Workgroups & Credit Recommendations" → "Statewide Credit Recommendations")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 150 | 400 | 250 ⚠ |
| 2026-27 | 300 | 1,000 | 700 ⚠ |
| 2027-28 | 400 | 1,600 | 1,200 ⚠ |
| 2028-29 | 350 | 2,200 | 1,850 ⚠ |
| 2029-30 | 300 | 2,800 | 2,500 ⚠ |

### `2.2` — Faculty Discipline Workgroups — GOAL *(name change: "CPL-Embedded Pathway Templates" → "Faculty Discipline Workgroups")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 10 | 6 | -4 ⚠ |
| 2026-27 | 20 | 15 | -5 ⚠ |
| 2027-28 | 30 | 19 | -11 ⚠ |
| 2028-29 | 25 | 22 | -3 ⚠ |
| 2029-30 | 15 | 25 | 10 ⚠ |

### `2.2` — Faculty Discipline Workgroups — STRETCH *(name change: "CPL-Embedded Pathway Templates" → "Faculty Discipline Workgroups")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 15 | 10 | -5 ⚠ |
| 2026-27 | 30 | 22 | -8 ⚠ |
| 2027-28 | 45 | 30 | -15 ⚠ |
| 2028-29 | 40 | 36 | -4 ⚠ |
| 2029-30 | 20 | 40 | 20 ⚠ |

### `2.3` — Common Course Crosswalks — GOAL *(name change: "MAP Credit Recommendation Repository" → "Common Course Crosswalks")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 20 | 19 ⚠ |
| 2026-27 | 1 | 50 | 49 ⚠ |
| 2027-28 | 1 | 90 | 89 ⚠ |
| 2028-29 | 1 | 140 | 139 ⚠ |
| 2029-30 | 1 | 200 | 199 ⚠ |

### `2.3` — Common Course Crosswalks — STRETCH *(name change: "MAP Credit Recommendation Repository" → "Common Course Crosswalks")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 40 | 39 ⚠ |
| 2026-27 | 1 | 100 | 99 ⚠ |
| 2027-28 | 1 | 180 | 179 ⚠ |
| 2028-29 | 1 | 280 | 279 ⚠ |
| 2029-30 | 1 | 400 | 399 ⚠ |

### `2.4` — Validated Skills — GOAL *(name change: "AI-Ready California Demonstration" → "Validated Skills")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 25 | 24 ⚠ |
| 2026-27 | 1 | 65 | 64 ⚠ |
| 2027-28 | 1 | 115 | 114 ⚠ |
| 2028-29 | 1 | 175 | 174 ⚠ |
| 2029-30 | 0 | 250 | 250 ⚠ |

### `2.4` — Validated Skills — STRETCH *(name change: "AI-Ready California Demonstration" → "Validated Skills")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 50 | 49 ⚠ |
| 2026-27 | 1 | 130 | 129 ⚠ |
| 2027-28 | 1 | 230 | 229 ⚠ |
| 2028-29 | 1 | 350 | 349 ⚠ |
| 2029-30 | 0 | 500 | 500 ⚠ |

### `3.1` — CPL Offers & Awards Tracking — All Populations — GOAL *(name change: "CPL Outreach & Student Enrollment (All Populations)" → "CPL Offers & Awards Tracking — All Populations")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 40,000 | 40,000 | 0 |
| 2026-27 | 90,000 | 90,000 | 0 |
| 2027-28 | 140,000 | 140,000 | 0 |
| 2028-29 | 195,000 | 196,000 | 1,000 ⚠ |
| 2029-30 | 250,000 | 250,000 | 0 |

### `3.1` — CPL Offers & Awards Tracking — All Populations — STRETCH *(name change: "CPL Outreach & Student Enrollment (All Populations)" → "CPL Offers & Awards Tracking — All Populations")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 80,000 | 80,000 | 0 |
| 2026-27 | 160,000 | 160,000 | 0 |
| 2027-28 | 260,000 | 260,000 | 0 |
| 2028-29 | 380,000 | 380,000 | 0 |
| 2029-30 | 500,000 | 380,000 | -120,000 ⚠ |

### `3.1.1` — CPL Offers & Awards Tracking — Working Adults — GOAL *(name change: "Military/Veteran Students Served" → "CPL Offers & Awards Tracking — Working Adults")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 30,000 | 9,500 | -20,500 ⚠ |
| 2026-27 | 40,000 | 47,500 | 7,500 ⚠ |
| 2027-28 | 50,000 | 82,500 | 32,500 ⚠ |
| 2028-29 | 60,000 | 122,500 | 62,500 ⚠ |
| 2029-30 | 70,000 | 160,000 | 90,000 ⚠ |

### `3.1.1` — CPL Offers & Awards Tracking — Working Adults — STRETCH *(name change: "Military/Veteran Students Served" → "CPL Offers & Awards Tracking — Working Adults")*

| year | Supabase (now) | Excel A+ (after) | Δ |
|---|---:|---:|---:|
| 2025-26 | 40,000 | 39,000 | -1,000 ⚠ |
| 2026-27 | 55,000 | 101,000 | 46,000 ⚠ |
| 2027-28 | 70,000 | 183,000 | 113,000 ⚠ |
| 2028-29 | 85,000 | 283,000 | 198,000 ⚠ |
| 2029-30 | 100,000 | 360,000 | 260,000 ⚠ |

## How this applies

When `kb/_seed_workplan_goals.py --apply` lands (next PR):

1. Per-row INSERT for each row in the INSERT bucket.
2. Per-row UPDATE for each row in the UPDATE bucket — value cells + name.
3. Per-row DELETE for each row in the DELETE bucket.
4. NO-OP rows are skipped.
5. Re-run `kb/_validate_workplan_goals.py` post-apply — exit code 0 confirms parity.

Re-generate this plan: `python3 kb/_seed_workplan_goals.py`
