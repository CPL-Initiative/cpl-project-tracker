---
title: Re-loading map_student_credit with its credit columns
created: 2026-08-10
updated: 2026-08-10
tags: [procedure, supabase, student-detail, map, privacy, reload]
artifacts:
  - funding/_student_detail_local.py
related:
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/sierra_credential_naming_lessons]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
---

# Re-loading `map_student_credit` with its credit columns

## Do this — the whole job in 9 steps

Each step is one action. Copy-paste the SQL block named in it. **Steps 3 and 6
are gates: if the number is wrong, stop and redo the import.** Everything below
the horizontal rule is *why*; you don't need it to run this.

| # | Do | Where |
|---|---|---|
| **1** | Export the columns below **from `TblSOURCE`** to CSV. **Write down the row count** (expect ~537,908). | Access, your machine |
| **2** | Run **SQL 1 — staging table**. | Supabase → SQL Editor |
| **3** | Import your CSV into `stg_student_credit`. Then run **SQL 2 — count check**. ⛔ The number must equal step 1's count. If it doesn't: `truncate public.stg_student_credit;` and re-import. | Supabase → Table Editor, then SQL Editor |
| **4** | Run **SQL 3 — build the new table**. | SQL Editor |
| **5** | Run **SQL 4 — verify**. | SQL Editor |
| **6** | ⛔ Check: `keys_outside_surrogate_range` is **0** (privacy tripwire), `new_students` = **42,346** (confirmed 2026-08-10), and both `students_applied_gt0` and `students_transcribed_gt0` are **≤ `new_students`**. If either is bigger, the load duplicated — go back to step 3. | read the output |
| **7** | Run **SQL 5 — swap**. The live table is replaced here. | SQL Editor |
| **8** | Run **SQL 6 — restore RLS**. ⚠️ Until this runs the 🎓 Course Credit tab is blank. | SQL Editor |
| **9** | Open the 🎓 Course Credit tab and confirm it loads. Then run **SQL 7 — cleanup**. | dashboard, then SQL Editor |

If anything looks wrong at step 5 or 6, **nothing has changed yet** — the live
table isn't touched until step 7. Just drop `map_student_credit_v2` and start over.

---


**Who runs this:** Sam, on his machine + Supabase Studio. A session cannot — the
51 MB export can't reach one, and the sandbox can't reach `*.supabase.co`.

**Time:** ~20 minutes, most of it waiting on the import.

---

## Why

`map_student_credit` has **five columns**:

```
student_key · college_id · exhibit_id · course_type · catalog_year
```

**The four credit columns are not in it — and were never in the export it was
built from.**

⚠️ **Correction (2026-08-10, same day):** an earlier version of this doc said the
columns were *"dropped at load."* That was an inference and it was WRONG. Sam's
`20260808_Tbl_MAP_STUDENT_CREDIT` export is five columns by construction, so
nothing was lost in loading. The credits live in `TblSOURCE`, the raw MAP
extract, which the 5-column table is a projection of. Correcting it here because
this project has twice been misled by a confident wrong sentence about exactly
this dataset.

So these questions have no answer today:

| Measure (Sam's definitions, 2026-08-10) | Computable now? |
|---|---|
| Students served = distinct student records | ✅ **42,346** |
| Students with **Applied Credits > 0** | ❌ column absent |
| Students with **Transcribed Credits > 0** | ❌ column absent |

`map_college_cr_unit` holds the amounts but is **aggregate with no
`student_key`**, so the join does not exist. Nothing can bridge it — this is a
re-load, not a query problem, and **not a dependency on Malone.** Your existing
29-column export already carries all four.

Do **not** substitute `course_type <> ''` (39,712 students). That means
*"something was awarded"* — a different question that will get quoted as if it
answered this one.

---

## Before you start — export from `TblSOURCE`

**Source: the query that already produces `student_key`, extended with the credit
columns** — its base is `TblSOURCE`, the original full extract from MAP at
**537,908 rows** (confirmed by Sam, 2026-08-10). Not `Tbl_MAP_STUDENT_CREDIT`, which is the
5-column projection already loaded, and not `Qry3_export` /
`TblCOLL_STU_EXH_CR_UNIT`, which are aggregates with no student key and are
**already in Supabase, exactly** — 204,714 rows reconciling to the cent
(potential 1,285,289.35 · applied 112,950.75 · transcribed 61,161.45). Re-loading
either of those accomplishes nothing.

Export these columns:

| `TblSOURCE` column | Becomes | Why |
|---|---|---|
| **the existing person key** (via `tblStudentKey` on `StudentMAPID`) | `student_key` (integer) | ⚠️ **NOT `TblSOURCE.Student`** — see below |
| `CollegeID` | `college_id` (integer) | |
| `ExhibitID` | `exhibit_id` (text) | |
| `ID` | `source_row_id` (integer) | ⛔ **required** — makes `DISTINCT` safe, see below |
| `Credit Recommendation` | `credit_rec` (text) | ⛔ **required** — disambiguates, and is the naming bridge |
| `Course Type` | `course_type` (text) | award destination |
| `Catalog Year` | `catalog_year` (text) | |
| `PotentialCredits` | `potential_credits` (numeric) | **the point of this re-load** |
| `CreditsInReview` | `credits_in_review` (numeric) | |
| `AppliedCredits` | `applied_credits` (numeric) | |
| `TranscribedCredits` | `transcribed_credits` (numeric) | |
| `CPLStatusPlan` | `cpl_status_plan` (text) | ⭐ disposition **per student** — new |
| `ApprenticeshipCredits` | `apprenticeship_credits` (numeric) | see note |
| `MilitaryCredits` | `military_credits` (numeric) | |
| `NonMilitaryCredits` | `non_military_credits` (numeric) | |
| `ArticulatedCredits` | `articulated_credits` (numeric) | |

### The export query — paste this into Access

One statement, no comments. `[Course Type]` and `[Catalog Year]` need the brackets
(spaces in the names).

```sql
SELECT k.StudentKey          AS student_key,
       s.CollegeID              AS college_id,
       s.ExhibitID              AS exhibit_id,
       s.ID                     AS source_row_id,
       s.[Credit Recommendation] AS credit_rec,
       s.[Course Type]          AS course_type,
       s.[Catalog Year]         AS catalog_year,
       s.PotentialCredits       AS potential_credits,
       s.CreditsInReview        AS credits_in_review,
       s.AppliedCredits         AS applied_credits,
       s.TranscribedCredits     AS transcribed_credits,
       s.ArticulatedCredits     AS articulated_credits,
       s.MilitaryCredits        AS military_credits,
       s.NonMilitaryCredits     AS non_military_credits,
       s.ApprenticeshipCredits  AS apprenticeship_credits,
       s.CPLStatusPlan          AS cpl_status_plan
FROM TblSOURCE AS s
INNER JOIN tblStudentKey AS k ON s.StudentMAPID = k.StudentMAPID;
```

✅ **`tblStudentKey` columns confirmed by Sam 2026-08-10: `StudentMAPID` and
`StudentKey`** (note the casing — `StudentKey`, not `student_key`). It is a dense
sequential surrogate ordered by MAP id: 39026→1, 39028→2, 39029→3, … running to
42,346, which is exactly the distinct `StudentMAPID` count.

⭐ **So the surrogate is stable, and the re-load preserves key continuity** as long
as `tblStudentKey` has not been regenerated since the 2026-08-08 export — the same
person keeps the same `student_key`. That is not required for the swap (SQL 5 is a
full replace either way), but it means `new_students = 42,346` at step 6 confirms
the join worked rather than merely counting rows.

⛔ **`source_row_id` AND `credit_rec` ARE NOT OPTIONAL — a 14-column export gets
silently corrupted by `SELECT DISTINCT`.** Caught 2026-08-10 on Sam's first
sample. Two rows for student 1:

```
257151  AR-2201-0479  1 hour in Cardiopulmonary Resuscitation   potential 1.00
257152  AR-2201-0479  1 hour in Orienteering                    potential 1.00
```

Same student, same exhibit, same units, **different credit recommendations** —
and byte-identical on every one of the original 14 columns. `SELECT DISTINCT` in
SQL 3 would have discarded one. Across 537,908 rows the potential-credit total
comes out LOW, reconciles against nothing, and carries no signal that it is wrong.

`source_row_id` (TblSOURCE's own `ID`, dense and unique — 257150, 257151, …) makes
every row provably distinct, so `DISTINCT` protects against importer duplication
without destroying real data. That is the only reason `DISTINCT` is safe to keep.

⭐ **`credit_rec` is a second win, not just a disambiguator.** It is the bridge for
naming the **94% of student rows that currently cannot be named** — 11,427
recommendation texts against a `MAPICI-*` catalogue that covers only 6.1%. It was
filed as separate work; this export gets it for free.

**Why straight off `TblSOURCE` and not the query that built the 5-column table:**
that one is `DISTINCT`-collapsed (537,908 → 220,588). Adding credit columns to a
`DISTINCT` breaks the collapse, because rows identical in five columns differ in
their credit values. The grain has to be the raw one.

**`StudentMAPID` is deliberately not in the SELECT.** It never leaves Access.

✅ **BUILT-IN CHECK PASSED 2026-08-10: returned exactly 537,908 rows.** No
`StudentMAPID` lacks a key row, and `tblStudentKey` has no duplicates — the join
is clean. Re-check this if the export is ever regenerated.

⛔ **It must return exactly 537,908 rows.** It is an INNER JOIN
on the same table that count came from, so:

- **fewer** → some `StudentMAPID`s have no row in `tblStudentKey`
- **more** → `tblStudentKey` has duplicate `StudentMAPID`s

Either is a keying problem. Stop and resolve it here — it is far cheaper to find
before the export than after the load.

**To export:** right-click the query → Export → Text File → tick *"Include Field
Names on First Row"*, comma-delimited, `.csv`. Note the row count Access reports;
that is the figure step 3's gate compares against.

⭐ **`CPLStatusPlan` at student grain is new capability**, not just a column. Today
disposition exists only as a college × exhibit aggregate; per-student it becomes
possible to say *"this student holds credit sitting at Needs Action"*, which is
the actual unit of the backlog.

⭐ **`ApprenticeshipCredits` matters more than it looks.** MAP has **no
"Apprenticeship" CPL *type*** — `cpl_types` is six values only, so any filter on
type returns 0 and reads as *"we do no apprenticeship CPL."* Apprenticeship credit
is tracked as a **credit bucket**, not a category. This column is the only way to
measure it.

### ✅ The key question is SETTLED — do not run verification queries

**`StudentMAPID` is the student identifier.** Sam, 2026-08-10, unprompted and
twice. He built the Access file; that is the authoritative answer and it needed no
confirming.

`TblSOURCE.Student` is a **constant** — a counter he added so he could take
`MAX(Student) = 1` once per matching MAP Student ID. Measured: `COUNT(*)` over
`SELECT Student ... GROUP BY Student` returns **1**, i.e. one distinct value in
537,908 rows. It is meaningless as a key under any reading.

⚠️ **A session asked him to run three queries to verify this after he had already
stated it.** That is the failure the same day's Rule 8 change forbids — a
human-sourced fact may not be second-guessed by a session's inference. If a
curator states how their own data is built, that IS the finding. Record it and
move on.

<details>
<summary>The queries, kept only in case the key layer is ever rebuilt</summary>

⚠️ Access SQL view runs **ONE statement at a time and rejects inline comments**
("Invalid SQL query. Comments are only allowed at the beginning of the query").
⚠️ Jet SQL has **no `COUNT(DISTINCT)`** — hence the subquery form. `AS T` because
Jet/ACE is inconsistent about requiring an alias on a derived table.

```sql
SELECT COUNT(*) AS distinct_mapid
FROM (SELECT StudentMAPID FROM TblSOURCE GROUP BY StudentMAPID) AS T;
```

✅ **CONFIRMED 2026-08-10: returns 42,346 — an EXACT match with the live
`map_student_credit.student_key` distinct count.** The surrogate is 1:1 with
`StudentMAPID`, so the published **42,346 counts PEOPLE, not MAP records**, and
every figure built on it holds.

(`funding/_student_detail_local.py` measured 42,345 from `InternalMAPStudentID`
on the 2026-08-06 `.xlsx`. One student's difference between export vintages —
ordinary, not a defect. The Access file is the newer of the two.)

</details>

### ⚠️ The person key is NOT `TblSOURCE.Student`

**Sam, 2026-08-10: `Student` is a GROUPING COUNTER.** It is not a person. His
sample shows `Student = 1` carrying two different `StudentMAPID`s at the same
college, which is what gave it away.

The real person key is the sequential id built from `StudentMAPID` via
`tblStudentKey` — that is what `QrySTUID_KEY` / `Qry_MAP_STUDENT_CREDIT` already
produce, and it is what the live table's `student_key` (1…42,346, globally unique,
one college each) actually is. It also matches the 42,345 distinct students the
local script measured independently from `InternalMAPStudentID`.

**So the export is not a raw `TblSOURCE` dump.** Extend the query that ALREADY
emits `student_key` — add the credit columns and `CPLStatusPlan` to it — rather
than starting from `TblSOURCE`. That keeps key continuity with what is loaded and
avoids re-deriving a mapping that already exists.

Exporting `Student` instead would produce a key that *looks* like a person, counts
like a person, and is not one — a failure that surfaces only as a wrong headline
number nobody can trace.

### 🔒 The MAP internal student ID must never reach Supabase

**Standing constraint, settled in an earlier session and reaffirmed by Sam
2026-08-10.** `StudentMAPID` is MAP's internal identifier for a real person. The
entire reason `tblStudentKey` exists is to swap it for a meaningless sequential
surrogate *inside Access*, so the MAP id never leaves that file.

⚠️ **DO NOT export `StudentMAPID`, `Location`, `Notes`, or any name/SSN column.**

This is checkable, so **check it rather than trusting it** — SQL 4 includes the
guard below. The surrogate runs 1…~42,346; MAP ids are five-digit values in a
different range entirely (Sam's sample: 60581, 60874). If a MAP id were exported
into `student_key` by mistake, the values would be obviously out of range, and the
verify step fails before the swap:

```sql
-- Fails loudly if the wrong column was exported as the key.
select count(*) as keys_outside_surrogate_range
from public.map_student_credit_v2
where student_key > 50000;        -- expect 0
```

A privacy rule that depends on someone remembering it will eventually be
forgotten. This one now has a tripwire.

⚠️ **Expect ~537,908 rows, not 220,588.** A student holds many credit
recommendations, and the 5-column table was DISTINCT-collapsed. The step-3 gate
compares against **your new export's count**, not the old one.

⚠️ **Key values will not match the current table** and do not need to — this is a
full replace, which is what the swap in SQL 5 does.

⚠️ **Never commit the export to any repo.** This one is public.

## The one trap that has already bitten

**Supabase Studio's CSV importer silently duplicated 2,058 rows and reported
success** on the last load — 222,646 staged from a 220,588-row file, each
duplicate exactly 2×. It did not error. It did not warn.

That is why every step below goes through a **permissive staging table** and a
**count check** before anything touches the real one. Do not import straight into
`map_student_credit`, however tempting.

---

## SQL 1 — staging table

Everything is `text`, nothing is constrained. A staging table that rejects rows
hides exactly the problem you are staging to find.

```sql
drop table if exists public.stg_student_credit;
create table public.stg_student_credit (
  student_key         text,
  college_id          text,
  exhibit_id          text,
  source_row_id       text,
  credit_rec          text,
  course_type         text,
  catalog_year        text,
  potential_credits   text,
  credits_in_review   text,
  applied_credits     text,
  transcribed_credits text
);
alter table public.stg_student_credit enable row level security;
-- No policies at all: service role only. Staging must never be readable.
```

## SQL 2 — count check (after importing the CSV)

Supabase Studio → Table Editor → `stg_student_credit` → Import data from CSV.

### The gate. Do not skip.

```sql
select count(*) as staged from public.stg_student_credit;
```

**`staged` must equal the row count your export tool reported.**

- **Equal** → continue.
- **Higher** → the importer duplicated. `truncate public.stg_student_credit;`
  and re-import. Do not "fix it later with DISTINCT" — a real duplicate row in
  the source and an importer artefact are indistinguishable afterwards.
- **Lower** → the import was truncated or a row broke the parse. Re-import.

## SQL 3 — build the new table beside the live one

Building `_v2` rather than altering in place means the 🎓 Course Credit tab and
Sierra keep serving the whole time, and a bad load is thrown away rather than
rolled back.

```sql
drop table if exists public.map_student_credit_v2;
create table public.map_student_credit_v2 (
  student_key         integer not null,
  college_id          integer not null,
  exhibit_id          text    not null,
  source_row_id       integer,
  credit_rec          text,
  course_type         text    not null default '',
  catalog_year        text,
  potential_credits   numeric,
  credits_in_review   numeric,
  applied_credits     numeric,
  transcribed_credits numeric
);

insert into public.map_student_credit_v2
select distinct
  nullif(btrim(student_key), '')::integer,
  nullif(btrim(college_id), '')::integer,
  btrim(coalesce(exhibit_id, '')),
  nullif(btrim(coalesce(source_row_id, '')), '')::integer,
  nullif(btrim(coalesce(credit_rec, '')), ''),
  btrim(coalesce(course_type, '')),
  nullif(btrim(coalesce(catalog_year, '')), ''),
  nullif(btrim(coalesce(potential_credits,   '')), '')::numeric,
  nullif(btrim(coalesce(credits_in_review,   '')), '')::numeric,
  nullif(btrim(coalesce(applied_credits,     '')), '')::numeric,
  nullif(btrim(coalesce(transcribed_credits, '')), '')::numeric
from public.stg_student_credit
where nullif(btrim(student_key), '') is not null;
```

`SELECT DISTINCT` is the second line of defence, not the first — step 3 is the
first. Both, always.

### ⚠️ Before you build a measure on `applied_credits` — it disagrees with the disposition

Observed in Sam's sample, 2026-08-10:

```
257168  Default Credit  Fitness & Wellness  Credit for Basic Military Service-Course
        potential 1  in_review 0  applied 0  transcribed 0  articulated 1  military 1
        cpl_status_plan = "Applied to CPL Plan"
```

The disposition says **Applied to CPL Plan** while `applied_credits` is **0** — the
credit is sitting in `articulated_credits` / `military_credits`.

So the two candidate readings of *"students with applied credit"* do not agree:

| Reading | Catches this student? |
|---|---|
| `applied_credits > 0` | ❌ no |
| `cpl_status_plan = 'Applied to CPL Plan'` | ✅ yes |

Basic-military-service credit is a large share of the population, so choosing the
first would publish a number well below the truth. ⚠️ **This does not block the
load** — load the columns as they are, then compute BOTH readings against the
loaded table and take the difference to Sam. A measure disagreement is much easier
to settle with the data in hand than by inspecting samples.

Also note **NULL is not 0 here**: `Not Applicable` rows leave `applied_credits`
blank while `Needs Action` rows carry `0`. The `nullif()` in SQL 3 preserves that
distinction deliberately — blank means never evaluated, `0` means evaluated and
zero.

## SQL 4 — verify before you swap

```sql
select
  (select count(*) from public.map_student_credit_v2)                     as new_rows,
  (select count(*) from public.map_student_credit)                        as old_rows,      -- 220,588
  (select count(distinct student_key) from public.map_student_credit_v2)  as new_students,  -- expect 42,346
  (select round(sum(applied_credits), 2)     from public.map_student_credit_v2) as applied,
  (select round(sum(transcribed_credits), 2) from public.map_student_credit_v2) as transcribed,
  (select count(*) from public.map_student_credit_v2 where applied_credits    > 0) as rows_applied_gt0,
  (select count(distinct student_key) from public.map_student_credit_v2 where applied_credits    > 0) as students_applied_gt0,
  (select count(distinct student_key) from public.map_student_credit_v2 where transcribed_credits > 0) as students_transcribed_gt0,
  -- 🔒 privacy tripwire: MAP ids are ~60000+; the surrogate is 1..~42,346.
  (select count(*) from public.map_student_credit_v2 where student_key > 50000)   as keys_outside_surrogate_range;
```

**Gates:**

1. `new_students` should be **42,346**. A different number means the population
   changed — fine, but know it before you publish anything.
2. `new_rows` should equal `staged` from step 3 (or be slightly lower if the
   source genuinely contains exact duplicate rows).
3. 🔒 `keys_outside_surrogate_range` must be **0**. Anything else means a MAP
   internal student id was exported as the key — **stop, do not swap, re-export**.
4. `students_applied_gt0` and `students_transcribed_gt0` are **the two numbers
   this whole exercise exists to produce.** They must be **≤ 42,346**. If either
   exceeds it, the load duplicated — stop and re-import.

⚠️ **On the credit sums: expect them NOT to match `map_college_cr_unit` exactly.**
That table currently reports applied **112,950.75** and transcribed **61,161.45**
across all entities. It is a *different grain* (college × exhibit × credit-rec),
so treat a close figure as reassuring and an identical one as luck. **The
authoritative check is the row and student counts, not the sums.** If the sums
are wildly off — an order of magnitude — something mapped to the wrong column;
check that `applied_credits` didn't pick up `potential_credits`.

## SQL 5 — swap, in one transaction

```sql
begin;
  alter table public.map_student_credit      rename to map_student_credit_old;
  alter table public.map_student_credit_v2   rename to map_student_credit;
commit;
```

## SQL 6 — restore RLS. **The step that must not be forgotten.**

The new table has **no policies**, so it is unreadable — which fails safe, but
the 🎓 tab will go blank until this runs. Re-apply the same gate the old table
used: **reviewer-only read, no write policies at all.**

```sql
alter table public.map_student_credit enable row level security;

create policy map_student_credit_read
  on public.map_student_credit for select
  to authenticated
  using (public.is_allowed_reviewer());
```

⚠️ Confirm the policy name and predicate against `map_student_credit_old` before
running this — copy what was there rather than trusting this snippet:

```sql
select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy where polrelid = 'public.map_student_credit_old'::regclass;
```

⚠️ **Do not use the `kb_curation` shape.** `kb_curation_read` is
`SELECT / {public} / USING (true)` — world-readable. Following it here would
publish student grain to anon.

## SQL 7 — clean up, once the 🎓 tab looks right

```sql
drop table public.map_student_credit_old;
drop table public.stg_student_credit;      -- never leave staging around
```

---

## What this unlocks

- **Route CRED·VOLUME** — *"how many students have applied credit for POST?"*,
  which Sierra currently declines. Still gated by the k=10 floor and by the
  naming coverage below.
- The two measures you defined, computable for the first time.

## What it does **not** fix

**Only 6.1% of student rows can be given a credential name** (13,488 of
220,588). Student grain is keyed by ACE military ids (`AR-`/`MC-`/`NV-`/`NER-`/
`MOS-`) plus 32,360 `Default *` sentinels; Sierra's catalogue is `MAPICI-*`;
overlap is **624 of 6,280 ids**.

So after this re-load, *"how many students have applied credit for POST"* is
answerable **as a floor over the nameable subset**, not as a total — and any
answer must say so. The bridge for the rest is `map_college_cr_unit.credit_rec`
(11,427 recommendation texts, sharing 6,277 of 6,278 ids with the student
table), which is a separate piece of work.
