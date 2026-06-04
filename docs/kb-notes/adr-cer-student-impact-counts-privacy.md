---
title: ADR — Student-impact counts in the public CER (aggregate + small-cell suppression)
created: 2026-06-04
updated: 2026-06-04
tags: [adr, cer, privacy, student-data, sec-10]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/reference-ap-credit-ge-area-canonicalization]]"
artifacts:
  - excel_to_dashboard.py (export_credential_reference → students_served / served_suppressed)
  - credential_reference.js (Students column + impact sort)
  - kb/_verify_students_served.py
  - tests/cer_students.test.js
---

# ADR — Surfacing student-impact counts on the public CER

## Context
The Common Exhibit Reference (CER) is a **public** artifact (`credential_reference_data.js`
ships to GitHub Pages). Curators want a **student-impact figure per credential** to
prioritize which credentials to canonicalize first (Sam, 2026-06-04). The CPL
program is also under the standing rule (SEC-10 + the Session-25 strategic queue):
**student counts on public surfaces are aggregate-only, never PII, and a privacy
ADR is required before shipping them.**

## Decision
Bake a per-credential **"students served"** count and surface it as a sortable
**Students** column on the CER, under these guarantees:

1. **Aggregate only.** The figure is a SUM of `View_ArticulatedCollegeCourses.Students`
   (a per-college×exhibit×course count) rolled up to the credential via
   `exhibit_id → unified_title`. No student identifiers — not even the pseudonymous
   "MAP Internal Student ID" — are read, baked, or shipped. (That ID is used only by
   the unrelated per-college military-student count, and stays server-side.)
2. **Small-cell suppression below 5** (Sam's threshold, 2026-06-04). A credential
   whose total is **1-4** is rendered **`<5`** and its exact number is **never baked**
   into the payload (`students_served: null` + `served_suppressed: true`). 0 / no data
   → neither field (renders `—`). Counts **≥5** show exactly. This prevents singling
   out a credential earned by a handful of students at one college.
3. **Test colleges excluded** (`_TEST_COLLEGES`), matching the rest of the pipeline.
4. **Volume signal, not a distinct headcount.** This view carries counts, not IDs, so
   the sum may slightly over-count a student across courses/colleges — fine for a
   triage *ranking*, and labeled as such in the column tooltip.

## Scope / not-yet
- This is **path 1** (the *served / transcribed* side — what we already pull daily).
  The **eligible** side (students eligible but not yet transcribed) is **not** at
  exhibit grain in our current MAP views (only college × CPL-type), so it is **out of
  scope** until an exhibit-keyed eligibility export exists. If/when it does, the same
  suppression rule applies.
- The count **populates on the daily cron** (the CustomReport file is fetched then,
  not committed — PII policy). A clean checkout / local regen bakes `null` for all
  rows (renders `—`), which is correct.

## Consequences
- Curators can sort the CER by **Students** to surface the highest-impact credentials.
- Verified end-to-end against a synthetic CustomReport (`kb/_verify_students_served.py`):
  summing, test-college exclusion, and the <5 mask (exact small number absent from the
  payload) all hold. Consumer render + sort guarded by `tests/cer_students.test.js`.
- If the threshold ever needs to change, it's one constant (`SERVED_SUPPRESS_BELOW`
  in the producer) — but lowering it below 5 needs a new ADR.
