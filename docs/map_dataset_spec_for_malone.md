---
title: MAP → Supabase datasets — Access query sequence and the reports to build (for Malone)
created: 2026-08-11
updated: 2026-08-11
tags: [spec, map, access, supabase, student-detail, record-source, custom-reports]
artifacts:
  - docs/map_student_credit_reload.md
related:
  - "[[docs/map_student_credit_reload]]"
  - "[[docs/kb-notes/playbook-access-export-to-supabase]]"
---

# MAP → Supabase — what to run, then what to build

Access SQL: **one statement at a time, no inline comments**, `[Brackets]` around
any name containing a space.

---

## What you are producing

Three MAP Custom Reports for our daily cron to fetch. Everything below builds up
to these.

| # | Report | Grain | Status |
|---|---|---|---|
| **R1** | **CPL Student Credit Detail** | one row per student × exhibit × credit recommendation | extend what exists |
| **R2** | **CPL College Lookup** | one row per college / entity | exists, confirm shape |
| **R3** | **CPL Sending Entities** | one row per sending entity | new, small |

`TblCOLL_STU_EXH_CR_UNIT` **retires** once R1 carries `SourceCode` and
`[College Course]` — it reconciles to the cent with the student grain, so it adds
nothing else.

---

## Part 1 — Run these in Access, in order

### Q1 · Do the fields exist, and what is in them?

Run once per field you are unsure of. A *"no such field"* error is the answer,
not a failure.

```sql
SELECT [Potential Student] AS potential_student, [Test Student] AS test_student, Count(*) AS rows_n
FROM TblCOLL_STU_EXH_CR_UNIT
GROUP BY [Potential Student], [Test Student];
```

```sql
SELECT SourceCode AS source_code, Count(*) AS rows_n
FROM TblSOURCE
GROUP BY SourceCode;
```

**Check:** if `SourceCode` errors on `TblSOURCE`, it exists only on the
aggregate — tell us, it changes R1.

---

### Q2 · Measure the exclusion gap ⚠️ highest priority

The dashboard already excludes `Potential Student = Yes` and `Test Student = Yes`
from student counts. The student-detail load does **not** — neither flag is in
today's export. So two live surfaces may be counting different people.

```sql
SELECT [Potential Student] AS potential_student, [Test Student] AS test_student, Count(*) AS rows_n, Sum(EligibleCredits) AS eligible_units, Sum(AppliedCredits) AS applied_units
FROM TblCOLL_STU_EXH_CR_UNIT
GROUP BY [Potential Student], [Test Student];
```

**Check:** send us the four-row result. If the `Yes` rows are negligible we say
so; if they are material, several published figures need restating.

⛔ **Do not filter these rows out of any export.** Send the flags; we apply the
rule, so both surfaces can be reconciled instead of diverging again.

---

### Q3 · Reconcile the fresh extract against what is already live

```sql
SELECT SourceCode AS source_code, Count(*) AS rows_n, Sum(PotentialCredits) AS potential_units, Sum(AppliedCredits) AS applied_units
FROM TblCOLL_STU_EXH_CR_UNIT
GROUP BY SourceCode;
```

**Check — must match Supabase as of 2026-08-11:**

| `source_code` | rows | potential | applied |
|---|---:|---:|---:|
| `ACE` | 200,840 | 1,078,640.00 | 20,357.00 |
| `MAP` | 3,255 | 133,181.35 | 92,593.75 |
| *(blank)* | 619 | 73,468.00 | 0.00 |
| **total** | **204,714** | **1,285,289.35** | **112,950.75** |

A mismatch means the extract changed — stop and tell us before rebuilding on it.

---

### Q4 · Build R1 — the student credit detail export (run now)

This is the current 16-column export **plus four columns**. Confirm the real
`TblSOURCE` names first; keep the `AS` aliases exactly as written — Supabase
keys off those, not off the MAP names.

```sql
SELECT k.StudentKey AS student_key, s.CollegeID AS college_id, s.ExhibitID AS exhibit_id, s.ID AS source_row_id, s.[Credit Recommendation] AS credit_rec, s.[Course Type] AS course_type, s.[Catalog Year] AS catalog_year, s.PotentialCredits AS potential_credits, s.CreditsInReview AS credits_in_review, s.AppliedCredits AS applied_credits, s.TranscribedCredits AS transcribed_credits, s.ArticulatedCredits AS articulated_credits, s.MilitaryCredits AS military_credits, s.NonMilitaryCredits AS non_military_credits, s.ApprenticeshipCredits AS apprenticeship_credits, s.CPLStatusPlan AS cpl_status_plan, s.SourceCode AS source_code, s.[College Course] AS college_course, s.[Potential Student] AS potential_student, s.[Test Student] AS test_student
FROM TblSOURCE AS s INNER JOIN tblStudentKey AS k ON s.StudentMAPID = k.StudentMAPID;
```

**Checks before you send it:**

- Row count is **537,908**. Fewer means `tblStudentKey` is stale.
- ⛔ **Never `SELECT DISTINCT`** — two rows can differ only in `credit_rec`, and
  `DISTINCT` silently drops one.
- ⛔ **`StudentMAPID` is not in the SELECT** and never leaves Access.
- Export as CSV, *"First Row Contains Field Names"*, comma-delimited.

---

### Q5 · Build R1 again when Public Upload lands (later)

Same as Q4 with two more columns, once the field is added to `TblSOURCE`:

```sql
       s.[Public Upload] AS public_upload, s.[Public Upload Timestamp] AS public_upload_at
```

Keep `public_upload` as its **Yes/No** value even after the five codes exist —
see the appendix for why.

---

### Q6 · Build R3 — sending entities (anytime)

```sql
SELECT e.SendingEntityID AS sending_entity_id, e.EntityName AS entity_name, e.EntityType AS entity_type, e.CollegeID AS college_id
FROM TblSendingEntity AS e;
```

- `college_id` populated **only** where the entity really is a MAP college; leave
  null for Futuro Health, LAUNCH and similar. Do not invent an id.
- Suggested `entity_type`: `college` · `noncredit_campus` · `noncredit_program` ·
  `agency` · `other`.

---

## Part 2 — The MAP Custom Reports to build

Once the Access shapes are settled, these are the reports the daily cron fetches.
Column names = the `AS` aliases above.

### R1 · CPL Student Credit Detail

Grain: student × exhibit × credit recommendation. ~537,908 rows.

`student_key` · `college_id` · `exhibit_id` · `source_row_id` · `credit_rec` ·
`course_type` · `catalog_year` · `potential_credits` · `credits_in_review` ·
`applied_credits` · `transcribed_credits` · `articulated_credits` ·
`military_credits` · `non_military_credits` · `apprenticeship_credits` ·
`cpl_status_plan` · `source_code` · `college_course` · `potential_student` ·
`test_student` · *(later)* `public_upload` · `public_upload_at` ·
`sending_entity_id`

⛔ **No `StudentMAPID`.** ⛔ **No pre-filtering.** ⛔ **No pre-suppression** —
small-cell privacy is applied on our side at publish time; a pre-suppressed
source makes published totals unreconcilable.

### R2 · CPL College Lookup

`college_id` · `college_name` · `entity_kind` · `is_test`

Include every entity that appears in R1. Two ids (**122** and **131**) are in the
credit data but missing from our current lookup — resolve from MAP's own list.

### R3 · CPL Sending Entities

`sending_entity_id` · `entity_name` · `entity_type` · `college_id`

---

## Appendix — the three things worth knowing why

**1. Keep Yes/No *and* add the code.** Today's Public Upload Yes/No is a lawful
roll-up of the five future values (CLP + SP = Yes; BU + ME + QA = No). Keeping
both lets the codes be *validated* on arrival — a row that was `Yes` must resolve
to `CLP` or `SP`. Overwrite it and that check is gone permanently. Store the
short codes; keep long labels in a lookup.

**2. `Potential Student` is not Public Upload.** It sits beside `Test Student`
and we already exclude both from dashboard counts, so it describes *who the
record is about* (a prospective, not-yet-enrolled person), not *how it arrived*.
Three separate columns: `potential_student`, `test_student`, `public_upload`.

**3. Why `source_code` matters more than it looks.** Applied rates by source:
**MAP 69.5 %, ACE 1.9 %, blank 0 %.** A 36× difference — so the ~1 M-unit Needs
Action backlog is overwhelmingly military ACE credit, and while `source_code`
lives only in an aggregate, no *per-student* source question is answerable.

**Two housekeeping notes on the Access file.** A table named `Data` is Access's
default import name — the next import creates `Data1` rather than overwriting, so
queries silently keep reading the old one; rename it dated (`Tbl_AGG_20260811`).
And `TblSTU_EXH_BUNDLE` appears in no runbook we hold — one sentence on what it
is would help.
