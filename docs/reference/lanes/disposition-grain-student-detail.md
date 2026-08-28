---
title: "Disposition grain / student detail — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Disposition grain / student detail

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** What a college has ACTED on, not just what credit exists.

## Status

✅ **TABLES LIVE + SIERRA WIRED.** `map_student_credit` **537,908 rows** (student grain, reviewer-only RLS, **no write policies**) · `map_college_cr_unit` 204,714 · published aggregates `map_college_goal2` + `map_college_credit_summary` (suppression at write time) · lookup `map_colleges` (128). 🎓 **Course Credit tab LIVE.** ⭐ **THE HEADLINE: 1,051,870 units at Needs Action across 106 colleges, 63,991 ALREADY ARTICULATED** — everything built, nobody acted. Lead with the second figure; the million is a ceiling (~30% of reviewed credit is correctly Not Applicable). ⭐ **BUCKET MILITARY vs NON-MILITARY BEFORE TOTALLING (Sam, 2026-08-13).** A JST lands a few to **scores** of ACE-reviewed CRs per service member; a non-military exhibit lands **1–2**. Same lifecycle, so an undifferentiated total is **98.8% military** — military **432,693 CRs / 1,040,447 units** (17.4/student) vs non-military **3,305 / 10,698** (3.8/student, 868 students, 28 colleges). "A million units awaiting action" describes a college's veteran population, not its workload, and **hides the tractable non-military backlog**. ⚠️ **Bucketing is NOT discounting** and **raw inert volume never means "behind"**. ⚠️ **No military flag exists** — `military_credits` is an applied AMOUNT, zero on 84% of rows. [`methodology-bucket-military-and-non-military-credit-recommendations`](docs/kb-notes/methodology-bucket-military-and-non-military-credit-recommendations.md). **Number policy (Sam):** show published AND unsuppressed with a chip — published 1,051,870/63,991, unsuppressed 1,052,531/64,074, **both scoped `entity_kind='college'` (106 entities)**; **never change one half alone**. ⚠️ **Show both ONLY while ≥3 cells are suppressed** — at one, the difference IS that college's figure (`adr-student-detail-aggregate-disclosure-control`). ⚠️ **The person key is `tblStudentKey`, NOT `TblSOURCE.Student`** (a grouping counter; Sam, twice); the MAP id must never reach Supabase. ⚠️ **`applied_credits > 0` IS NOT "credit was awarded"** — it is **identical to `articulated_credits` on ALL 462,355 Needs Action rows**, so it measures whether credit EXISTS. Scoped to rows actually marked Applied the two measures agree to **0.1%** (30,055 students by units vs 30,091 by status). **Sam's ruling stands — publish BOTH and name the gap** — but the old **55%** figure is RETIRED (Sam, 2026-08-19): it came from an UNSCOPED comparison. Worklist view `map_applied_zero_units`. Students served **42,346** · transcribed **13,412**. ⚠️ **Never rank on TRANSCRIBED** — colleges batch-upload already-transcribed credit, so it exists at only 24 of 111 colleges (`reference-batch-uploaded-transcribed-credit`). ⭐ **Apprenticeship CPL IS measurable** — `apprenticeship_credits`, 309 students / 12 colleges / 6,617.80 units. ⚠️ **Only 4.2% of student rows are nameable** (22,606 of 537,908) — per-credential counts are a FLOOR and the denominator ships as a COLUMN. ⚠️ **537k is fine to STORE, too slow to aggregate LIVE** (~6s vs Sierra's 1.7–5.0s budget) — read pre-computed rollups, never the grain. Runbook [`docs/map_student_credit_reload.md`](docs/map_student_credit_reload.md); story `docs/student_detail_load_lessons.md`.
