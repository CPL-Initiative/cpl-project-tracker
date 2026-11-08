---
title: "Disposition grain / student detail — lane state"
created: 2026-08-28
updated: 2026-09-30
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

**RULED (Sam, 2026-11-08, in session S604, confirming COBIx's relay on #2919): *"yes the ruling is mine."*** COBI pulls
student-level MAP data only to analyze and summarize it and never acts on an individual record, so it keeps none:
summarize, then delete. The plan (#2919, comment 6723544749), smallest first, each applied only on Sam's word:
(1) **done** #2920: anon and authenticated lost TRUNCATE and every write on the three base tables (run 42497305017);
(2) **done** #2922: `map_student_credit_prev` (220,588) and `stg_student_credit` (543,579) dropped, no reader, backup
2026-11-08 09:29Z confirmed by Sam (run 42498803570); (3) **done** #2932 (Sam's *merge*, Open Asks Sheet 171 card 3, 20:14Z
2026-11-08): `map_student_key_sketch` down to one pull; it held 148,000 hashes over 74 pulls because the loader's one read hit
PostgREST's 1,000-row cap, and the next load deletes the 73 older pulls; (4) summarize-then-delete inside the load, two PRs (summaries and a backfill first, then the delete),
reproducing today's dashboard, Course Credit tab and Sierra numbers before anything retires; (5) guards (no browser or
`index.ts` names a student table; a workflow read fails if one holds rows outside the load). **What breaks without a
replacement:** `exhibit_title_students` (the Exhibits Review ranking, distinct students across a title's exhibits at
query time; replace with per-title counts built in the load from that day's title map) and the salt check. **Found:**
the three credential-volume materialized views (`map_exhibit_credential`, `map_credential_student_rollup`,
`map_credential_volume`) are refreshed by hand only; they held 18,682 rows of the 32,661 that map today, so PR 4 must
refresh them before it deletes. Backups (Pro, daily physical) also hold the grain; their retention is part of the ruling.
**NEEDS SAM (Open Asks Sheet 171 card 1, 2026-11-08):** the legal and datashare review's home and whether it covers what
COBI held. Sam asked a follow-up instead (20:13Z): *"I believe there are no student IDs, names, emails, etc. just hashed ID with
records of anonymous students' CPL, right?"* Answered in the card's thread, read from the schema and the loader: no names, emails
or MAP ids reach COBI; MAP sends the StudentMAPID hashed, the loader swaps it for a per-pull number 1..N, and the key sketch keeps
2,000 of MAP's hashes a pull; the rows are pseudonymous, one student's credit per college and recommendation, so a small cell can
single someone out. **RULED (Sam, Sheet 171 card 2, *accept*, 20:13Z 2026-11-08):** the Exhibits ranking may lag a curator's
regrouping by one day once per-title counts are built in the load.

✅ **TABLES LIVE + SIERRA WIRED.** `map_student_credit` **537,908 rows** (student grain, reviewer-only RLS, **no write policies**) · `map_college_cr_unit` 204,714 · published aggregates `map_college_goal2` + `map_college_credit_summary` (suppression at write time) · lookup `map_colleges` (128). 🎓 **Course Credit tab LIVE.** ⭐ **THE HEADLINE: 1,051,870 units at Needs Action across 106 colleges, 63,991 ALREADY ARTICULATED** — everything built, nobody acted. Lead with the second figure; the million is a ceiling (~30% of reviewed credit is correctly Not Applicable). ⭐ **BUCKET MILITARY vs NON-MILITARY BEFORE TOTALLING (Sam, 2026-08-13).** A JST lands a few to **scores** of ACE-reviewed CRs per service member; a non-military exhibit lands **1–2**. Same lifecycle, so an undifferentiated total is **98.8% military** — military **432,693 CRs / 1,040,447 units** (17.4/student) vs non-military **3,305 / 10,698** (3.8/student, 868 students, 28 colleges). "A million units awaiting action" describes a college's veteran population, not its workload, and **hides the tractable non-military backlog**. ⚠️ **Bucketing is NOT discounting** and **raw inert volume never means "behind"**. ⚠️ **No military flag exists** — `military_credits` is an applied AMOUNT, zero on 84% of rows. [`methodology-bucket-military-and-non-military-credit-recommendations`](docs/kb-notes/methodology-bucket-military-and-non-military-credit-recommendations.md). **Number policy (Sam):** show published AND unsuppressed with a chip — published 1,051,870/63,991, unsuppressed 1,052,531/64,074, **both scoped `entity_kind='college'` (106 entities)**; **never change one half alone**. ⚠️ **Show both ONLY while ≥3 cells are suppressed** — at one, the difference IS that college's figure (`adr-student-detail-aggregate-disclosure-control`). ⚠️ **The person key is `tblStudentKey`, NOT `TblSOURCE.Student`** (a grouping counter; Sam, twice); the MAP id must never reach Supabase. ⚠️ **`applied_credits > 0` IS NOT "credit was awarded"** — it is **identical to `articulated_credits` on ALL 462,355 Needs Action rows**, so it measures whether credit EXISTS. Scoped to rows actually marked Applied the two measures agree to **0.1%** (30,055 students by units vs 30,091 by status). **Sam's ruling stands — publish BOTH and name the gap** — but the old **55%** figure is RETIRED (Sam, 2026-08-19): it came from an UNSCOPED comparison. Worklist view `map_applied_zero_units`. Students served **42,346** · transcribed **13,412**. ⚠️ **Never rank on TRANSCRIBED** — colleges batch-upload already-transcribed credit, so it exists at only 24 of 111 colleges (`reference-batch-uploaded-transcribed-credit`). ⭐ **Apprenticeship CPL IS measurable** — `apprenticeship_credits`, 309 students / 12 colleges / 6,617.80 units. ⚠️ **Only 4.2% of student rows are nameable** (22,606 of 537,908) — per-credential counts are a FLOOR and the denominator ships as a COLUMN. ⚠️ **537k is fine to STORE, too slow to aggregate LIVE** (~6s vs Sierra's 1.7–5.0s budget) — read pre-computed rollups, never the grain. Runbook [`docs/map_student_credit_reload.md`](docs/map_student_credit_reload.md); story `docs/student_detail_load_lessons.md`.

**2026-09-30 (Sierra credit-source sheet):** the credit summary now suppresses **each figure on its own students** (it had tested only the college's headcount) and carries `applied_in_plan` (student view, *Applied to CPL Plan* only; lead with it) beside MAP's `applied_credits`, which contains the Needs Action articulated credit. Real statewide totals: `map_college_credit_statewide`. Military / non-military: `map_college_credit_bucket` (MAP's `military_credits` + `non_military_credits` partition applied credit on 73,933 of 73,939 in-plan rows, so the bucketing note's warning is about classifying ROWS, not splitting applied credit). Exhibit and recommendation source: `map_college_exhibit_credit`. All three rebuild inside the promotion and raise on their own suppression property. Detail: [sierra lane](sierra-retrieval-corpus.md).

**Parked:** the tables, the Course Credit tab and Sierra's wiring are live and no session work is queued. The lane reopens when a Sierra or funding ask needs an aggregate these tables do not publish. (S602, 2026-11-07, COBIx #2891.)
