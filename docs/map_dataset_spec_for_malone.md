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

**`Potential Student` is the record-source field.** Sam, 2026-08-11: *a `Yes`
indicates the record was sourced from a College Landing Page or the Student
Portal.* (There is no field called "Public Upload" — that name was a slip.) This
is the field that later splits into CLP / SP / BU / ME / QA. **Leave it exactly
as it is for now.**

Two places in our daily pipeline currently **drop every `Potential Student = Yes`
row**:

| Function | What it feeds |
|---|---|
| `_compute_college_last_activity` | each college's last-activity date |
| `_compute_college_military_students` | **per-college military / JST student counts** |

The second is the one to look at. Under Sam's definition it means the JST student
count **excludes every veteran who came in through a college landing page or the
Student Portal** — the public front doors. And the exclusion grows with the
portal: the better Credit for Being You performs, the more real activity drops
out of that count, silently.

That may have been right when the flag was read as "prospective, not yet
enrolled." It is worth a deliberate decision now rather than an inherited one.

So measure it:

```sql
SELECT [Potential Student] AS potential_student, [Test Student] AS test_student, Count(*) AS rows_n, Sum(EligibleCredits) AS eligible_units, Sum(AppliedCredits) AS applied_units
FROM TblCOLL_STU_EXH_CR_UNIT
GROUP BY [Potential Student], [Test Student];
```

**Check:** send us the four-row result. It tells us how much CPL activity is
reaching MAP through the landing pages and the Student Portal — which is worth
knowing on its own, and decides whether the two filters above should stay.

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

### Q5 · Rebuild R1 when the source values are configured (later)

`Potential Student` is already in Q4, so **nothing to do now**. When MAP is
configured to record CLP / SP / BU / ME / QA, add the new column *alongside* it —
do not convert the existing one:

```sql
       s.[Record Source] AS record_source, s.[Source Timestamp] AS record_source_at
```

Sam's own note: settling the values, configuring MAP, and exposing them on Custom
Reports will take time. Q4 is not waiting on any of it.

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
`test_student` · *(later)* `record_source` · `record_source_at` ·
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

**1. Keep Yes/No *and* add the code — never convert.** `Potential Student = Yes`
is a lawful roll-up of the five future values (CLP + SP = Yes; BU + ME + QA =
No). Keeping the Yes/No lets the codes be *validated* on arrival — a row that was
`Yes` must resolve to `CLP` or `SP`, and any row that doesn't is a migration
defect caught immediately rather than silently. Convert the column in place and
that check is gone permanently. Store short codes; keep long labels in a lookup.

**2. `Potential Student` and `Test Student` are different things.**
`Potential Student` is **record source** (Yes = College Landing Page or Student
Portal). `Test Student` is a **QA record** and should always be excluded. They
sit next to each other and are filtered together in two of our functions today,
which is what made them easy to conflate — including by me, until Sam corrected
it. Two columns, two meanings, two different rules.

**3. Why `source_code` matters more than it looks.** Applied rates by source:
**MAP 69.5 %, ACE 1.9 %, blank 0 %.** A 36× difference — so the ~1 M-unit Needs
Action backlog is overwhelmingly military ACE credit, and while `source_code`
lives only in an aggregate, no *per-student* source question is answerable.

**Two housekeeping notes on the Access file.** A table named `Data` is Access's
default import name — the next import creates `Data1` rather than overwriting, so
queries silently keep reading the old one; rename it dated (`Tbl_AGG_20260811`).
And `TblSTU_EXH_BUNDLE` appears in no runbook we hold — one sentence on what it
is would help.
