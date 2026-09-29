---
title: Playbook — loading a Microsoft Access export into Supabase
created: 2026-08-08
updated: 2026-08-08
tags: [playbook, access, supabase, ingestion, student-data, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-successful-import-is-not-a-correct-one]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one]]"
  - "[[docs/student_detail_load_lessons]]"
artifacts:
  - map_student_credit (Supabase)
  - kb/supabase_map_college_goal2.sql
---

# Playbook — loading a Microsoft Access export into Supabase

> **One-sentence summary** — design the table against real rows rather than a
> spec, land the file in a permissive staging table, reconcile the row count
> against the source before anything else, and only then transform into the
> strict table.

## When to use this

A curator holds data in Access (or any local tool) that needs to reach Supabase
so the dashboard, a tab, or Sierra can read it. First run: the MAP student-detail
load, 2026-08-08, Session 128.

**Division of labour that works:** Claude does the DDL and the verification;
the curator does the export and the import. Claude has the Supabase MCP, the
curator has the data and the dashboard.

---

## Step 0 — Ask for real rows BEFORE designing anything

Non-negotiable, and it is the step most likely to be skipped because it feels
like delay.

Ask for: **the Design View** (column names *and* types) and **~30 real rows**.

On the first run the schema handed over in the session brief was wrong in **four
places**, and **none of them would have thrown an error**:

| The spec said | The data said |
|---|---|
| 4-column primary key | collided on ~8% of rows |
| `course_type` has 3 values | 11 values across two vocabularies |
| "these IDs arrive null" | true for one variant; another had a sentinel; a third used a literal `"-"` |
| a ratio over four credit columns | all four are `0` on unapproved rows — the metric is undefined |

Every one produces a table that looks correct. **If the data is student grain,
ask for the Design View only** and design from the column list.

---

## Step 1 — Write the Access export query

### Access has no `COUNT(DISTINCT x)`

It fails with a syntax error. Use a two-step: distinct sub-query, then count.

```sql
-- qry2_students
SELECT k, Count(*) AS distinct_students
FROM (SELECT DISTINCT k, smid FROM qry1_base) AS d
GROUP BY k;
```

### Build a composite key so joins don't match on many columns

⚠️ **An equi-join on a NULL column silently returns nothing in Access.** Text
fields like `ExhibitID` and `College Course` are frequently empty, so a join
across eight key columns quietly drops rows. Normalize once, concatenate a key,
join on that alone:

```sql
-- qry1_base — no NULL reaches a join
SELECT
  Nz([CollegeID],0)                    AS college_id,
  Trim(Nz([ExhibitID],''))             AS exhibit_id,
  Trim(Nz([Course Type],''))           AS course_type,
  Nz([PotentialCredits],0)             AS pot,
  Nz([CollegeID],0) & "|" & Trim(Nz([ExhibitID],'')) & "|"
    & Trim(Nz([Course Type],''))       AS k
FROM TblSOURCE;
```

### Collapse every spelling of "no value"

Real exports carry **three**: `NULL`, empty string, and a literal `"-"`.
`Nz()` catches only the first.

```sql
IIf(Trim(Nz([ExhibitID],'')) In ('','-'), '<sentinel>', Trim([ExhibitID]))
```

### Route the unknown to a visible bucket

When deriving a value, give unrecognized input its **own distinct value**
(`'Unspecified'`, `'UNKNOWN'`) rather than folding it into a legitimate one. It
costs nothing and it turns "did we cover every case?" into a countable query
after load. On the first run both came back `0` — but only because they *could*
have come back non-zero.

### Make `SELECT DISTINCT` match the primary key exactly

If the export is `SELECT DISTINCT` over precisely the columns that form the PK,
**a duplicate-key failure becomes impossible by construction** and the pre-flight
check is unnecessary.

### Export settings

- **CSV with headers**, aliased to the **exact** target column names — Supabase
  maps by header text, so matching names means no hand-mapping
- **UTF-8** (Export Text Wizard → Advanced → Code Page). Access often defaults to
  Windows-1252, which mangles credential titles
- Filename leads with a date code: `20260808_map_student_credit.csv`. This
  reloads on a schedule; six exports from now the date is the only thing telling
  you which file produced which load
- **Drop free-text columns** (`Notes` and friends) at the query, not later. They
  have no analytical value and are the highest-risk field in any student export

---

## Step 2 — Create the target table

Design against the real types. Two Supabase specifics:

- **`CREATE TABLE AS` does not create RLS policies.** Supabase may enable RLS by
  default, which with zero policies means *deny all* — safe, but the table is
  unreadable until a policy exists. Check `pg_policies`, never assume.
- **Verify a named RLS template against the live database before copying it.**
  `kb_curation` is often cited as "the reviewer gate"; its `SELECT` is
  `{public} / USING (true)` — **world-readable**. Only its writes are gated. The
  tables that actually gate reads are `team_access` and `sierra_feedback`.

For a table loaded only by CSV/service role, the tightest posture is a `SELECT`
policy and **no write policies at all** — dashboard imports bypass RLS anyway, so
a leaked anon key can neither read nor write.

---

## Step 3 — Land in a permissive staging table

**Do not import into the strict table.** Create a twin with every column `text`,
every column nullable, and no primary key:

```sql
create table public.<name>_staging (col_a text, col_b text, ...);
alter table public.<name>_staging enable row level security;
create policy ... for select to public using (is_allowed_reviewer());
```

⚠️ **Staging inherits the sensitivity of its contents.** A staging table holding
student rows is not less sensitive for being temporary — give it the same gate.

This turns three hard failures into measurements: numeric columns exported as
`3.00` into an `int`; empty fields arriving as `NULL` into a `NOT NULL` column;
and a malformed quote somewhere in the file.

**Import:** Table Editor → *the staging table* → Insert → Import data from CSV.
Check the dialog header names the staging table before dropping the file — the
target is whatever is selected in the sidebar, and it is easy to re-open the
dialog pointed at the wrong one.

---

## Step 4 — RECONCILE BEFORE TRANSFORMING

**The step that must never be skipped.** On the first run the importer landed
**222,646 rows from a 220,588-row file** — 2,058 groups duplicated exactly twice
— and **reported success**. Supabase Studio commits in batches and re-sends a
batch that commits without returning an acknowledgment.

```sql
select count(*) from public.<name>_staging;   -- must equal the source count
```

If it differs, characterise the difference before deciding it is safe:

```sql
select count(*) as dup_groups, sum(n-1) as extra_rows, max(n) as worst
from (select col_a, col_b, ..., count(*) as n
      from public.<name>_staging group by 1,2,... having count(*) > 1) t;
```

Dedupe **only** when the source guarantees uniqueness — a `SELECT DISTINCT`
export over exactly the key columns makes every duplicate provably an artifact.

---

## Step 5 — Transform with explicit casts

```sql
insert into public.<name> (...)
select distinct
  round(student_key::numeric)::int,          -- '3.00' fails ::int directly
  round(college_id::numeric)::int,
  trim(exhibit_id),
  coalesce(trim(course_type), ''),           -- CSV cannot distinguish '' from absent
  coalesce(trim(catalog_year), '')
from public.<name>_staging;
```

Then assert the count **equals the source count exactly**:

```sql
select count(*) from public.<name>;   -- must equal the Access figure
```

⭐ An exact match proves three things at once: no rows lost, the dedup removed
only artifacts, and `trim()` did not merge two rows differing by whitespace —
that last would show as a count *below* source and is otherwise invisible.

---

## Step 6 — Drop staging, record the load

```sql
drop table public.<name>_staging;

insert into public.map_data_loads
  (table_name, source_rows, loaded_rows, reconciled, note)
values ('<name>', <source>, <loaded>, true, '...');
```

`reconciled` records whether the count was **checked**, not whether the loader
claimed success. Any surface reading the table should show `loaded_at` and say so
loudly when `reconciled` is false.

---

## Step 7 — Rebuild anything derived

A derived/published table is stale the moment the base reloads. Keep its build as
a **committed SQL file** re-runnable in full (`kb/supabase_map_college_goal2.sql`
is the worked example), with its assertion query at the bottom — not as steps in
a chat transcript, which is how a nightly rebuild quietly stops happening.

---

## Checklist

- [ ] Real rows seen before the schema was written
- [ ] `SELECT DISTINCT` matches the primary key exactly
- [ ] Three no-value spellings collapsed; unknowns routed to a visible bucket
- [ ] Free-text columns dropped at the query
- [ ] UTF-8, date-coded filename
- [ ] RLS verified in `pg_policies`, not assumed
- [ ] Imported into **staging**, not the strict table
- [ ] **Row count reconciled against the source**
- [ ] Any difference characterised before deduping
- [ ] Post-transform count equals the source count exactly
- [ ] Staging dropped; load recorded
- [ ] Derived tables rebuilt from committed SQL

---

## What this playbook does NOT cover

The manual dashboard import is a **curator-scale** procedure. Once the source
system publishes an API view, this retires in favor of a scheduled fetch on the
runner writing via the service key — which also removes the duplicate-batch
hazard entirely, since a scripted truncate-and-reload is idempotent.
