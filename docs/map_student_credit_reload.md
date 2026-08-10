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
| **1** | Export the 9 columns to CSV. **Write down the row count** your tool reports. | Access, your machine |
| **2** | Run **SQL 1 — staging table**. | Supabase → SQL Editor |
| **3** | Import your CSV into `stg_student_credit`. Then run **SQL 2 — count check**. ⛔ The number must equal step 1's count. If it doesn't: `truncate public.stg_student_credit;` and re-import. | Supabase → Table Editor, then SQL Editor |
| **4** | Run **SQL 3 — build the new table**. | SQL Editor |
| **5** | Run **SQL 4 — verify**. | SQL Editor |
| **6** | ⛔ Check: `new_students` ≈ **42,346**, and both `students_applied_gt0` and `students_transcribed_gt0` are **≤ 42,346**. If either is bigger, the load duplicated — go back to step 3. | read the output |
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

**The four credit columns were dropped when it was loaded.** So these questions
have no answer today:

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

## Before you start

Your export needs these nine columns. The first five must match the current
table exactly or the reconciliation below is meaningless.

| Column | Becomes |
|---|---|
| StudentKey / student id | `student_key` (integer) |
| CollegeID | `college_id` (integer) |
| ExhibitID | `exhibit_id` (text) |
| CourseType | `course_type` (text) |
| CatalogYear | `catalog_year` (text) |
| **PotentialCredits** | `potential_credits` (numeric) |
| **CreditsInReview** | `credits_in_review` (numeric) |
| **AppliedCredits** | `applied_credits` (numeric) |
| **TranscribedCredits** | `transcribed_credits` (numeric) |

⚠️ **Export as CSV with a header row, and write down the row count your export
tool reports.** You will need that number twice. It should be **220,588** if the
population hasn't changed since the last load; a different number is fine, but
then it — not 220,588 — is the figure everything below must match.

⚠️ **Never commit the export to any repo.** This one is public.

---

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
  (select count(distinct student_key) from public.map_student_credit_v2 where transcribed_credits > 0) as students_transcribed_gt0;
```

**Gates:**

1. `new_students` should be **42,346**. A different number means the population
   changed — fine, but know it before you publish anything.
2. `new_rows` should equal `staged` from step 3 (or be slightly lower if the
   source genuinely contains exact duplicate rows).
3. `students_applied_gt0` and `students_transcribed_gt0` are **the two numbers
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
