---
title: MAP → Supabase dataset spec (for Malone) — student grain, record source, and the sending-entity registry
created: 2026-08-11
updated: 2026-08-11
tags: [spec, map, access, supabase, student-detail, record-source, public-upload]
artifacts:
  - docs/map_student_credit_reload.md
  - kb/supabase_credential_volume.sql
related:
  - "[[docs/map_student_credit_reload]]"
  - "[[docs/kb-notes/playbook-access-export-to-supabase]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
---

# MAP → Supabase dataset spec (for Malone)

**Runs from Access for now** (Sam, 2026-08-11) — MAP Custom Reports come later,
once the shapes are settled. So every export step below is Access SQL: **one
statement at a time, no inline comments, `[Bracketed Names]` where a name
contains a space.**

Building it in Access first is the right order. The shapes below will change at
least once, and changing an Access query costs minutes where changing a MAP
Custom Report costs a release.

The existing student-grain runbook is [`docs/map_student_credit_reload.md`](map_student_credit_reload.md) —
this spec extends it rather than replacing it. Everything already proven there
(the `tblStudentKey` surrogate, `source_row_id`, the no-`DISTINCT` rule) still
applies unchanged.

---

## What to run, in what order

`[Public Upload]` does not exist on `TblSOURCE` yet — Sam is adding it. Don't
wait for it. The export splits cleanly into two passes:

| Pass | Columns | Blocked on |
|---|---|---|
| **1a — run now** | the 16 existing + `source_code` + `college_course` | nothing |
| **1b — run when the field lands** | `+ public_upload`, `+ public_upload_at` | Sam's `TblSOURCE` change |
| **2a — answerable now** | is `Potential Student` the same flag, or enrolment status? | a look at the aggregate |
| **3 — anytime** | `map_sending_entities` | nothing (start the id space early) |

Pass 1a is worth running on its own: moving `source_code` down to student grain
is what retires `map_college_cr_unit` and makes record-source questions
answerable per student. That is a win available today.

---

## The answer on table count: **3**, and one of today's three retires

| # | Table | Grain | Who builds it | Status |
|---|---|---|---|---|
| 1 | `map_student_credit` | one row per student × exhibit × credit recommendation | Malone (Access → CSV) | **exists — extend it** |
| 2 | `map_colleges` | one row per college / entity | Malone (Access → CSV) | exists, stable |
| 3 | `map_sending_entities` | one row per non-college sending entity | Malone (**new**) | **new — needed for Sending Entity ID** |

**`map_college_cr_unit` (204,714 rows) becomes derivable and should retire.**
Measured 2026-08-11: it reconciles with the student grain **to the cent** —
applied `112,950.75` both ways, potential `1,285,289.35` both ways. It is a pure
aggregate. It survives today only because it carries **two dimensions the student
grain lacks**: `source_code` and `college_course`. Move those down (Step 1) and
nothing is lost by dropping it.

⭐ **Why that matters beyond tidiness:** while `source_code` lives only in an
aggregate, no per-student question about record source is answerable. Sierra
cannot say *"how many students got credit through the student portal"* — only
*"how many units."*

---

## The finding that should shape the whole build

`source_code` already exists in the aggregate, and it is the single most
discriminating field in this dataset:

| `source_code` | Rows | Potential units | Applied units | **Applied rate** | Colleges |
|---|---:|---:|---:|---:|---:|
| `ACE` | 200,840 | 1,078,640.00 | 20,357.00 | **1.9 %** | 108 |
| `MAP` | 3,255 | 133,181.35 | 92,593.75 | **69.5 %** | 56 |
| *(blank)* | 619 | 73,468.00 | 0.00 | **0.0 %** | 87 |

**MAP-sourced credit is applied at 70 %; ACE-sourced at under 2 %** — a 36×
difference. So the ~1 M-unit "Needs Action" backlog is overwhelmingly military
ACE credit, and the blank-source group (**73,468 units across 87 colleges, zero
applied, ever**) is its own worklist.

⚠️ **Do not quote `distinct_students` from the aggregate as a headcount** — it is
a per-row distinct count and double-counts across rows (it sums to 450,015
against 42,346 real students).

---

## Step 1 — Extend the student-grain export

Add four columns to the existing export. Two exist today in the aggregate; two
are the new source-tracking fields.

⚠️ **Column names below are our best guess from the aggregate — confirm the real
`TblSOURCE` names before running.** `[Public Upload]` and
`[Public Upload Timestamp]` are the ones Sam is adding, so their spelling is
whatever he creates. `SourceCode` and `[College Course]` we have only seen in the
aggregate; if they are named differently at grain, keep the `AS` aliases below
unchanged — the Supabase side keys off those, not off the MAP names.

```sql
SELECT k.StudentKey            AS student_key,
       s.CollegeID             AS college_id,
       s.ExhibitID             AS exhibit_id,
       s.ID                    AS source_row_id,
       s.[Credit Recommendation] AS credit_rec,
       s.[Course Type]         AS course_type,
       s.[Catalog Year]        AS catalog_year,
       s.PotentialCredits      AS potential_credits,
       s.CreditsInReview       AS credits_in_review,
       s.AppliedCredits        AS applied_credits,
       s.TranscribedCredits    AS transcribed_credits,
       s.ArticulatedCredits    AS articulated_credits,
       s.MilitaryCredits       AS military_credits,
       s.NonMilitaryCredits    AS non_military_credits,
       s.ApprenticeshipCredits AS apprenticeship_credits,
       s.CPLStatusPlan         AS cpl_status_plan,
       s.SourceCode            AS source_code,
       s.[College Course]      AS college_course,
       s.[Public Upload]       AS public_upload,
       s.[Public Upload Timestamp] AS public_upload_at
FROM TblSOURCE AS s
INNER JOIN tblStudentKey AS k ON s.StudentMAPID = k.StudentMAPID;
```

**Unchanged rules from the runbook, all still load-bearing:**

- ⛔ **Never `SELECT DISTINCT`.** Two rows can be byte-identical on every column
  except `credit_rec`; `DISTINCT` silently discards one and the potential-credit
  total comes out low, reconciling against nothing.
- ⛔ **`StudentMAPID` never leaves Access.** Export `StudentKey` only.
- Expect **537,908** rows. An `INNER JOIN` that returns fewer means the key table
  is stale.
- The Studio CSV importer duplicates (measured three times: 0.9 % / 1.5 % /
  1.05 %). Gate on `count(distinct source_row_id)` and zero payload conflicts —
  **never on `count(*)`**.

---

## Step 2 — Public Upload

**Sam is adding Public Upload to `TblSOURCE`** (2026-08-11), so it arrives at
student grain rather than only on the Student Aggregate values dataset. That is
the difference between answering *"how many **units** came through the student
portal"* and *"how many **students**"* — the second is the one a college can act
on, and it is only possible at grain.

It stays on the aggregate too; no reason to remove it there.

### ⚠️ The field is called `Potential Student` on the aggregate extract

Sam, 2026-08-11: on the **Student Aggregates extract** the Yes/No field is named
**`Potential Student`**, *not* `Public Upload`. Use that name when reading the
aggregate; grepping for "Public Upload" there finds nothing.

**Before treating them as the same field, confirm they mean the same thing.**
The two names describe different concepts on their face:

- *Public Upload* — **how the record arrived** (a public-facing channel)
- *Potential Student* — **who the person is** (someone not yet enrolled)

They correlate strongly — a portal upload from a prospective student is both —
but they can come apart in both directions: an *enrolled* student uploading
through the college landing page is a public upload and not a potential student;
a batch-uploaded prospect is the reverse.

If `Potential Student` is genuinely the same flag under an older name, say so and
we will treat `public_upload` as its rename. If it means enrolment status, then
it is a **separate column** and we need both — because "did this arrive through a
public channel" and "was this person already our student" answer different
questions, and neither substitutes for the other.

This is worth thirty seconds now: conflating them would put the wrong label on
every row, and the error would be invisible in the totals.

### The query that settles it

Sam is importing a fresh Aggregate report from MAP Custom Reports into Access
(2026-08-11), so this can be run immediately. Substitute the real table name for
`<AggregateTable>`; run each statement on its own.

**A — what values actually exist:**

```sql
SELECT [Potential Student] AS potential_student, Count(*) AS rows_n
FROM <AggregateTable>
GROUP BY [Potential Student];
```

**B — the discriminating cross-tab (this is the one that answers it):**

```sql
SELECT [Potential Student] AS potential_student, SourceCode AS source_code, Count(*) AS rows_n, Sum(PotentialCredits) AS potential_units, Sum(AppliedCredits) AS applied_units
FROM <AggregateTable>
GROUP BY [Potential Student], SourceCode;
```

**How to read B:**

- If `Potential Student = Yes` sits almost entirely on `source_code = MAP` and
  almost never on `ACE`, it is behaving like an **arrival-channel** flag →
  it is `public_upload` under an older name, and we treat it as a rename.
- If `Yes` spreads across **both** `MAP` and `ACE`, it is describing **the
  person, not the channel** → it is enrolment status, it is a **separate
  column**, and we keep both.

Either answer is fine and cheap to act on. What is expensive is assuming.

**C — a free reconciliation while you are in there.** The fresh extract should
match what is already live in Supabase; if it doesn't, the extract changed and we
want to know before anything is rebuilt on it:

```sql
SELECT SourceCode AS source_code, Count(*) AS rows_n, Sum(PotentialCredits) AS potential_units, Sum(AppliedCredits) AS applied_units
FROM <AggregateTable>
GROUP BY SourceCode;
```

Expected, from Supabase `map_college_cr_unit` on 2026-08-11:

| `source_code` | rows | potential | applied |
|---|---:|---:|---:|
| `ACE` | 200,840 | 1,078,640.00 | 20,357.00 |
| `MAP` | 3,255 | 133,181.35 | 92,593.75 |
| *(blank)* | 619 | 73,468.00 | 0.00 |
| **total** | **204,714** | **1,285,289.35** | **112,950.75** |

### Keep Yes/No **and** add the code — do not replace

Today's Yes/No is a lawful **roll-up** of your five future values:

| Future value | Code | Today's Yes/No |
|---|---|---|
| College Landing Page | `CLP` | **Yes** |
| Student Portal | `SP` | **Yes** |
| Batch Upload | `BU` | No |
| MAP Entry | `ME` | No |
| MAP Dashboard Quick Adopt | `QA` | No |

So ship **two columns**, not one:

- `public_upload` — today's `Yes`/`No`, kept verbatim, forever
- `record_source` — the five-code value, **null until MAP emits it**

⭐ **Why both:** when the five codes arrive, every row still carries the Yes/No it
was loaded with, so the new values can be **validated against the old** — a row
that was `Yes` must resolve to `CLP` or `SP`, and any row that doesn't is a
migration defect caught immediately instead of silently. Overwrite Yes/No with
the code and that check is gone forever. This project has been burned by exactly
this shape before: a load-time transformation becomes, one document later, a
stated fact about MAP.

Use the **short codes** (`CLP`/`SP`/`BU`/`ME`/`QA`) as the stored value and keep
the long labels in a lookup — codes survive a wording change, labels don't.

---

## Step 3 — `map_sending_entities` (the new third table)

`Sending Entity ID` points at organisations that are **not all colleges** —
Futuro Health and LAUNCH have no MAP college presence at all, while NC campuses
and programs partly overlap `map_colleges`. So it needs its own registry that
*can* reference a college rather than being a column on one.

```sql
SELECT e.SendingEntityID AS sending_entity_id,
       e.EntityName      AS entity_name,
       e.EntityType      AS entity_type,
       e.CollegeID       AS college_id
FROM TblSendingEntity AS e;
```

- `entity_type` — suggest `college` / `noncredit_campus` / `noncredit_program` /
  `agency` / `other`
- `college_id` — populated **only** where the entity really is a MAP college;
  null for Futuro, LAUNCH and similar. Do not invent an id to fill it.
- Reserve the id space now even if only a handful are live — retrofitting ids is
  what makes a later merge painful.

Then `map_student_credit.sending_entity_id` is a plain nullable FK.

---

## Step 4 — Supabase side (we run this, not you)

For reference so the shapes match. Additive columns only; no existing column
changes type.

```sql
alter table public.map_student_credit
  add column if not exists source_code        text,
  add column if not exists college_course     text,
  add column if not exists public_upload      text,   -- 'Yes' / 'No', kept verbatim
  add column if not exists record_source      text,   -- CLP | SP | BU | ME | QA
  add column if not exists public_upload_at   timestamptz,
  add column if not exists sending_entity_id  integer;

create table if not exists public.map_sending_entities (
  sending_entity_id integer primary key,
  entity_name       text not null,
  entity_type       text,
  college_id        integer
);
```

**Validation gates, run after every load** (all must pass):

1. `count(distinct source_row_id) = 537,908` — not `count(*)`
2. `sum(potential_credits)` reconciles to the aggregate **to the cent**
3. `max(student_key) <= 42,346` and distinct count equal — the MAP-id tripwire
4. Once codes arrive: **zero rows** where
   `public_upload = 'Yes' and record_source not in ('CLP','SP')`
5. Zero `sending_entity_id` values absent from `map_sending_entities`

⚠️ **Disclosure control is ours, not yours** — export the real numbers. k=10
suppression and complementary suppression are applied at publish time in
Supabase, never at display time. Do not pre-suppress anything you send us; a
pre-suppressed source makes the published totals unreconcilable.

---

## Step 5 — retire `map_college_cr_unit`

Once Step 1 lands with `source_code` + `college_course` at grain, `cr_unit` is
fully derivable. Keep it one cycle, prove the derivation reconciles to the cent,
then drop it. Don't drop it on the same day it becomes redundant.

---

## Later — what Sam will ask MAP to gather

Additional public-upload detail is coming so specific questions can be answered.
**That list is not yet written down here** — when it lands, it goes in this
section, and the `record_source` + `sending_entity_id` design above is meant to
absorb it without a re-do.

Design brief for whatever arrives: a new source value should be a **new code in
an existing column**, never a new boolean column. Five booleans cannot express
"which one," and every future one costs another migration.
