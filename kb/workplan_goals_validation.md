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

**Status:** ⚠ drift detected

## Summary

- Excel core sub-activities: **18** of 19 expected
- Supabase rows: **10** distinct activity_ids
- Matches (GOAL+STRETCH × 5 years agree): **0**
- Mismatches (overlapping rows that disagree): **18**
- Missing in Supabase (Excel CORE_IDS without a Supabase row): **9**
- Orphans in Supabase (rows whose activity_id isn't in Excel CORE_IDS): **1**

## Missing in Supabase

Excel core sub-activities that have no row in `workplan_goals`. These have to be seeded before Supabase can become source of truth.

| activity_id | name | reason |
|---|---|---|
| `3.2` | CPL Units Transcription | no_supabase_row |
| `3.3` | Institutional Participation | no_supabase_row |
| `3.4` | Student Impact Rate Survey | no_supabase_row |
| `3.5` | Student Stories | no_supabase_row |
| `3.6` | College Tracking & Recognition | no_supabase_row |
| `4.2` | Strategic Partnerships | no_supabase_row |
| `4.3` | Technical Assistance & Training | no_supabase_row |
| `4.4` | Law & Regulation Review | no_supabase_row |
| `4.5` | Sustainable Funding | no_supabase_row |

## Orphans in Supabase

Supabase `workplan_goals` rows whose `activity_id` is NOT in Excel's `CORE_IDS` list. Either the renderer needs to learn about these (e.g. add to CORE_IDS), or the rows should be removed from Supabase.

| activity_id | name |
|---|---|
| `3.1.1` | Military/Veteran Students Served |

## Value Mismatches

Overlapping (activity_id, row_type) pairs where the year-by-year values disagree between Excel and Supabase. Each table shows the drift; you decide which side wins per row.

### `1.1` — MAP Platform Development — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 4 | 1 | -3 ⚠ |
| 2026-27 | 9 | 1 | -8 ⚠ |
| 2027-28 | 18 | 1 | -17 ⚠ |
| 2028-29 | 22 | 1 | -21 ⚠ |
| 2029-30 | 25 | 1 | -24 ⚠ |

### `1.1` — MAP Platform Development — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 8 | 1 | -7 ⚠ |
| 2026-27 | 18 | 1 | -17 ⚠ |
| 2027-28 | 28 | 1 | -27 ⚠ |
| 2028-29 | 36 | 1 | -35 ⚠ |
| 2029-30 | 50 | 1 | -49 ⚠ |

### `1.2` — System Integration & Interoperability — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 1 | 2 | 1 ⚠ |
| 2026-27 | 2 | 3 | 1 ⚠ |
| 2027-28 | 3 | 3 | 0 |
| 2028-29 | 4 | 2 | -2 ⚠ |
| 2029-30 | 5 | 2 | -3 ⚠ |

### `1.2` — System Integration & Interoperability — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 2 | 3 | 1 ⚠ |
| 2026-27 | 4 | 4 | 0 |
| 2027-28 | 6 | 4 | -2 ⚠ |
| 2028-29 | 8 | 3 | -5 ⚠ |
| 2029-30 | 10 | 3 | -7 ⚠ |

### `1.3` — CPL Student Portal — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 100 | 1 | -99 ⚠ |
| 2026-27 | 1,000 | 1 | -999 ⚠ |
| 2027-28 | 5,000 | 1 | -4,999 ⚠ |
| 2028-29 | 11,000 | 1 | -10,999 ⚠ |
| 2029-30 | 20,000 | 1 | -19,999 ⚠ |

### `1.3` — CPL Student Portal — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 200 | 1 | -199 ⚠ |
| 2026-27 | 2,000 | 1 | -1,999 ⚠ |
| 2027-28 | 10,000 | 1 | -9,999 ⚠ |
| 2028-29 | 22,000 | 1 | -21,999 ⚠ |
| 2029-30 | 40,000 | 1 | -39,999 ⚠ |

### `1.4` — California Credential Registry — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 0 | 250 | 250 ⚠ |
| 2026-27 | 50 | 350 | 300 ⚠ |
| 2027-28 | 110 | 200 | 90 ⚠ |
| 2028-29 | 175 | 100 | -75 ⚠ |
| 2029-30 | 250 | 100 | -150 ⚠ |

### `1.4` — California Credential Registry — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 0 | 400 | 400 ⚠ |
| 2026-27 | 200 | 500 | 300 ⚠ |
| 2027-28 | 440 | 300 | -140 ⚠ |
| 2028-29 | 900 | 200 | -700 ⚠ |
| 2029-30 | 1,000 | 100 | -900 ⚠ |

### `2.1` — Statewide Credit Recommendations — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 200 | 100 | -100 ⚠ |
| 2026-27 | 400 | 200 | -200 ⚠ |
| 2027-28 | 600 | 250 | -350 ⚠ |
| 2028-29 | 800 | 225 | -575 ⚠ |
| 2029-30 | 1,000 | 225 | -775 ⚠ |

### `2.1` — Statewide Credit Recommendations — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 400 | 150 | -250 ⚠ |
| 2026-27 | 1,000 | 300 | -700 ⚠ |
| 2027-28 | 1,600 | 400 | -1,200 ⚠ |
| 2028-29 | 2,200 | 350 | -1,850 ⚠ |
| 2029-30 | 2,800 | 300 | -2,500 ⚠ |

### `2.2` — Faculty Discipline Workgroups — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 6 | 10 | 4 ⚠ |
| 2026-27 | 15 | 20 | 5 ⚠ |
| 2027-28 | 19 | 30 | 11 ⚠ |
| 2028-29 | 22 | 25 | 3 ⚠ |
| 2029-30 | 25 | 15 | -10 ⚠ |

### `2.2` — Faculty Discipline Workgroups — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 10 | 15 | 5 ⚠ |
| 2026-27 | 22 | 30 | 8 ⚠ |
| 2027-28 | 30 | 45 | 15 ⚠ |
| 2028-29 | 36 | 40 | 4 ⚠ |
| 2029-30 | 40 | 20 | -20 ⚠ |

### `2.3` — Common Course Crosswalks — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 20 | 1 | -19 ⚠ |
| 2026-27 | 50 | 1 | -49 ⚠ |
| 2027-28 | 90 | 1 | -89 ⚠ |
| 2028-29 | 140 | 1 | -139 ⚠ |
| 2029-30 | 200 | 1 | -199 ⚠ |

### `2.3` — Common Course Crosswalks — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 40 | 1 | -39 ⚠ |
| 2026-27 | 100 | 1 | -99 ⚠ |
| 2027-28 | 180 | 1 | -179 ⚠ |
| 2028-29 | 280 | 1 | -279 ⚠ |
| 2029-30 | 400 | 1 | -399 ⚠ |

### `2.4` — Validated Skills — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 25 | 1 | -24 ⚠ |
| 2026-27 | 65 | 1 | -64 ⚠ |
| 2027-28 | 115 | 1 | -114 ⚠ |
| 2028-29 | 175 | 1 | -174 ⚠ |
| 2029-30 | 250 | 0 | -250 ⚠ |

### `2.4` — Validated Skills — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 50 | 1 | -49 ⚠ |
| 2026-27 | 130 | 1 | -129 ⚠ |
| 2027-28 | 230 | 1 | -229 ⚠ |
| 2028-29 | 350 | 1 | -349 ⚠ |
| 2029-30 | 500 | 0 | -500 ⚠ |

### `3.1` — CPL Offers & Awards Tracking — All Populations — GOAL

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 40,000 | 40,000 | 0 |
| 2026-27 | 90,000 | 90,000 | 0 |
| 2027-28 | 140,000 | 140,000 | 0 |
| 2028-29 | 196,000 | 195,000 | -1,000 ⚠ |
| 2029-30 | 250,000 | 250,000 | 0 |

### `3.1` — CPL Offers & Awards Tracking — All Populations — STRETCH

| year | Excel | Supabase | Δ |
|---|---:|---:|---:|
| 2025-26 | 80,000 | 80,000 | 0 |
| 2026-27 | 160,000 | 160,000 | 0 |
| 2027-28 | 260,000 | 260,000 | 0 |
| 2028-29 | 380,000 | 380,000 | 0 |
| 2029-30 | 380,000 | 500,000 | 120,000 ⚠ |

## How to read this

- **Missing** rows have to be seeded into Supabase before cutover.
- **Mismatches** need a per-row decision: which side is canonical? Pick, update the loser to match, re-run this validator until clean.
- **Orphans** suggest the renderer is missing sub-activities, OR Supabase has stale rows. Decide per orphan.

Re-run: `python3 kb/_validate_workplan_goals.py`
