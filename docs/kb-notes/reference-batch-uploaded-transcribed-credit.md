---
title: Batch-uploaded transcribed credit — why transcribed counts are not comparable across colleges
created: 2026-08-10
updated: 2026-08-10
tags: [reference, map-platform, transcribed-credit, data-quality, metrics, colleges]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-grain-invariant-measure-can-still-be-the-wrong-one]]"
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/map_student_credit_reload]]"
artifacts:
  - docs/map_student_credit_reload.md
---

# Batch-uploaded transcribed credit

**Source: Sam, 2026-08-10** — curator knowledge, not derived:

> *"Some colleges batch upload student lists where they have already transcribed
> credit. Credit by exam, AP, IB, and CLEP are frequent examples, and we
> encourage colleges to do this so we can account for all CPL they have awarded.
> SDCCD was the first to do this for thousands of students."*

## Why it matters

The practice is **encouraged** — it is how MAP accounts for CPL a college
awarded outside the MAP review flow. But it means a college's transcribed figure
reflects **whether it uploads**, not only what it does for students.

⚠️ **Transcribed credit exists at only 24 of 111 colleges** (measured
2026-08-10 on the 537,908-row `map_student_credit`). A college that batch-uploads
is transformed overnight without changing a single student outcome; a college
that does the same work but does not upload reads as near-zero.

**Never rank colleges on transcribed credit, and never read a low transcribed
figure as low activity.** This independently supports the standing call that
**applied, not transcribed, is the current phase's target.**

## The signature in the data

Batch upload is identifiable by *shape* — many students, few distinct exhibits,
roughly one row per student:

| College | Rows | Students | Exhibits | Rows/student |
|---|---:|---:|---:|---:|
| San Diego City | 2,982 | 2,836 | 28 | **1.05** |
| San Diego Mesa | 3,487 | 3,094 | 37 | **1.13** |
| San Diego Miramar | 1,776 | 1,502 | 44 | 1.18 |
| Merced | 4,819 | 3,048 | 63 | 1.58 |
| West LA | 2,580 | 563 | 28 | *4.58* |
| Norco | 830 | 270 | 140 | *3.07* |
| Modesto | 424 | 193 | 207 | *2.20* |

- **Batch upload** ≈ 1.0–1.6 rows/student, tens of exhibits, thousands of students.
  SDCCD's three colleges are textbook. Merced now does it at the same scale.
- **Individual review** ≈ 3–5 rows/student across *hundreds* of exhibits
  (Modesto 207, Norco 140) — each student's record built case by case.

The discriminator is the **pair**: rows-per-student *and* exhibit count. Either
alone misreads a small college with a narrow program mix.

## Consequences for anything published

1. **Do not compare transcribed across colleges** without stating who uploads.
2. **A transcribed-based rate has a denominator problem** — the population of
   colleges recording transcription is not the population of colleges doing it.
3. **Volume metrics inherit the distortion.** SDCCD's colleges carry the largest
   student counts in the student grain largely because of this, so any
   volume-ranked list is partly a list of who uploaded.
4. **`transcribed > applied` never occurs** (0 rows of 537,908) — credit cannot
   be transcribed without first being applied. Any statistic of the form "zero
   transcribed among rows with zero applied" is a **tautology**, not a finding.
   This was reported once as evidence before being caught; verify a striking
   number *can* vary before drawing anything from it.

## Related identity note

MAP has **no "Apprenticeship" CPL type** (six values only), so an apprenticeship
filter on type returns 0 and reads as *"we do none."* Apprenticeship CPL is
measurable instead through `apprenticeship_credits` at student grain —
**309 students across 12 colleges, 6,617.80 units** (2026-08-10). That is a
different measure from apprentice headcounts sourced from the CCCCO dashboard
and the two must not be conflated.
