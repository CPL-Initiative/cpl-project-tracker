---
title: Loading the two new MAP Custom Report views
created: 2026-08-19
updated: 2026-08-19
tags: [procedure, supabase, map-api, custom-report, student-detail, catalog-year, reconciliation, privacy]
artifacts:
  - kb/_sync_map_custom_reports.py
  - kb/supabase_map_custom_report_staging.sql
  - tests/map_custom_report_sync_test.py
  - .github/workflows/map-custom-report-load.yml
related:
  - "[[docs/map_custom_reports_lessons]]"
  - "[[docs/map_student_credit_reload]]"
  - "[[docs/map_dataset_sql_for_malone]]"
---

# Loading the two new MAP Custom Report views

Companion to [`docs/map_student_credit_reload.md`](map_student_credit_reload.md),
which loaded `map_student_credit` from an Access export. This is the same job
done from the **API we already pull**, so it can be repeated without Sam
exporting anything.

|  | source view | staging | live |
|---|---|---|---|
| A | `View_CollegeExhibitCRByCatalogYear_APIDataset` | `stg_map_college_cr_unit` | `map_college_cr_unit` |
| B | `View_StudentDetailsCredits_APIDataset` | `stg_map_student_credit` | `map_student_credit` |

## Do this — the whole job

| # | Do | Where |
|---|---|---|
| **1** | Dispatch **MAP Custom Report load (staging)** with mode `dry-run`. Read the step log. | Actions |
| **2** | ⛔ **Gate.** `rows parsed` must equal `dataCount` on both views. If not, the pull is short — stop. | the log |
| **3** | Dispatch it again with mode `apply`. Staging now holds the pull. Nothing live has changed. | Actions |
| **4** | Run **SQL 1 — reconcile**. | Supabase SQL editor / MCP |
| **5** | ⛔ **Gate.** Read the per-college deltas. They should run ONE WAY (staging ≥ live). A college that went *down* is not staleness resolving and needs explaining before you swap. | the output |
| **6** | Run **SQL 2 — swap A** (`map_college_cr_unit`). | SQL editor |
| **7** | Run **SQL 3 — swap B** (`map_student_credit`). | SQL editor |
| **8** | Run **SQL 4 — restore RLS**. ⚠️ Until this runs the 🎓 Course Credit tab and the College Action page are blank. | SQL editor |
| **9** | Rebuild the published aggregates (`kb/supabase_map_college_goal2.sql`, `kb/supabase_map_college_credit_summary.sql`) and confirm the tabs load. | SQL editor, then the dashboard |

Nothing live is touched before step 6. If anything looks wrong at step 4 or 5,
truncate staging and start over — there is nothing to roll back.

---

## ⚠️ The two tables do NOT have the same policy

This is the trap in the swap, because the natural instinct is to write one
`create policy` and reuse it:

```
map_college_cr_unit   SELECT  to anon, authenticated   using (is_allowed_reviewer() OR team_pass_ok())
map_student_credit    SELECT  to public                using (is_allowed_reviewer())
```

`map_student_credit` is **reviewer-only** and deliberately does not accept the
team phrase — it is student grain. Restoring the articulation table's policy
onto it would hand 537,908 student-grain rows to every holder of a shared
phrase, silently, and the tab would look completely normal afterwards. SQL 4
below restores each one separately for that reason. Neither table has any write
policy and neither should gain one.

---

## SQL 1 — reconcile

Run this before any swap. It is the whole point of the staging step.

```sql
-- Totals
select 'A cr_unit'  as dataset,
       (select count(*) from stg_map_college_cr_unit) as staging,
       (select count(*) from map_college_cr_unit)     as live
union all
select 'B student',
       (select count(*) from stg_map_student_credit),
       (select count(*) from map_student_credit);

-- Distinct students: the figure every published headcount rests on.
select (select count(distinct student_key) from stg_map_student_credit) as staging_students,
       (select count(distinct student_key) from map_student_credit)     as live_students;

-- Per-college, both datasets, worst disagreement first.
with a as (
  select college_id, count(*) n from stg_map_college_cr_unit group by 1),
 b as (
  select college_id, count(*) n from map_college_cr_unit group by 1)
select coalesce(a.college_id, b.college_id) as college_id,
       b.n as live, a.n as staging, coalesce(a.n,0) - coalesce(b.n,0) as delta
from a full join b on a.college_id = b.college_id
order by abs(coalesce(a.n,0) - coalesce(b.n,0)) desc
limit 40;

-- Moreno Valley (college_id 3) is the best single test: 7,963 live rows across
-- EIGHT catalog years where most colleges have five, so it exercises the
-- dimension that carries the grain.
select 'live' as side, catalog_year, count(*) from map_college_cr_unit
where college_id = 3 group by 1,2
union all
select 'staging', catalog_year, count(*) from stg_map_college_cr_unit
where college_id = 3 group by 1,2
order by catalog_year, side;
```

**What a good result looks like.** MAP's counts are higher than ours (+3.07% on
A, +10.02% on B). `cpl_memory: two-student-counts-disagree-indicator-suspected`
records Sam's own explanation — the MAP team pulled records off MAP to correct
Exhibit references and reloaded them — so **our staleness resolving is the
predicted outcome**. Confirm it per-college; do not file it as a defect.

**What is not.** A college whose count went *down*, or a college present live and
absent from staging. Neither is explained by staleness resolving. Find out why
before swapping.

---

## SQL 2 — swap A (`map_college_cr_unit`)

```sql
begin;
alter table public.map_college_cr_unit rename to map_college_cr_unit_prev;
create table public.map_college_cr_unit as
  select * from public.stg_map_college_cr_unit;
commit;
```

## SQL 3 — swap B (`map_student_credit`)

The live table gains two columns here: `status` (the articulation approval
stage) and `cpl_plan_status` (the lifecycle checks). Adding columns is safe —
every consumer selects named columns.

```sql
begin;
drop table if exists public.map_student_credit_prev;   -- keep only one generation
alter table public.map_student_credit rename to map_student_credit_prev;
create table public.map_student_credit as
  select * from public.stg_map_student_credit;
commit;
```

⛔ **Before you commit, check the privacy tripwire from the earlier runbook:**

```sql
select min(student_key), max(student_key), count(distinct student_key)
from public.stg_map_student_credit;
```

`student_key` must be a dense surrogate starting at 1 — it is assigned inside
the pull, and the hashed `StudentMAPID` it was derived from is never stored. A
max in the millions, or a non-integer, means a MAP identifier reached the
database and the load must be abandoned.

## SQL 4 — restore RLS

```sql
alter table public.map_college_cr_unit enable row level security;
create policy map_college_cr_unit_select on public.map_college_cr_unit
  for select to anon, authenticated
  using (is_allowed_reviewer() OR team_pass_ok());

alter table public.map_student_credit enable row level security;
create policy map_student_credit_select on public.map_student_credit
  for select
  using (is_allowed_reviewer());          -- reviewer ONLY. Not the team phrase.

alter table public.map_student_credit_prev enable row level security;
alter table public.map_college_cr_unit_prev enable row level security;
```

Then confirm, before you tell anyone it worked:

```sql
select tablename, policyname, roles::text, qual from pg_policies
where schemaname='public'
  and tablename in ('map_student_credit','map_college_cr_unit');
```

---

## What the loader keeps, and what it drops

`fetch_custom_report.py` decides what we **ask for**; the loader decides what we
**keep**, and it keeps less. Minimisation happens twice.

**Stored from the student view (18 columns):** the 16 `map_student_credit`
already held, plus `status` and `cpl_plan_status`.

**Fetched and deliberately dropped:** `Location`, `CPL Mode`, `CPL Program`,
`Program`, `ProgramGoal`, `Transfer Destination`, `College Course`,
`Source Code`, `CourseCredits`, `AreaCredits`, `ElectiveCredits`,
`DefaultAreaCredits` — every one a student attribute or a credit split with no
consumer downstream. They are listed in `HELD_COLUMNS` rather than merely
omitted, so the decision is visible to whoever next widens the load, and the
test fails if one is quietly moved into the stored contract.

**Never stored:** `StudentMAPID`. It is salt-hashed and the salt does not rotate
(Pedro Campos, ITPI, via Sam 2026-08-19), but the spec we sent MAP is explicit
about the need it serves — *"we only ever count distinct students, we never look
one up"* — so it derives the surrogate and is discarded.

### The three status-shaped fields (Sam, 2026-08-19)

| field | what it is | stored as |
|---|---|---|
| `Status` | the **articulation approval stage** the row sits at, e.g. `Initiator` — a MAP approval-cascade role | `status` |
| `CPLStatusPlan` | the **action taken** on the CR: `Needs Action`, `Not Applicable` — the disposition | `cpl_status_plan` |
| `CPLPlanStatus` | **not a status.** The **lifecycle checks**, and there can be several: `CPL Docs \|Transcribed` | `cpl_plan_status`, verbatim |

`Status` and `CPLPlanStatus` are dimensions **no table we hold carries** — they
are the substantive reason to load this view. Freshness is the lesser one.

`cpl_plan_status` is stored with its pipes intact. Splitting it in the loader
would fix its grain before anyone has measured it, and a multi-valued checklist
is not something you filter on until it has been given fields
([`methodology-a-filter-needs-a-field`](kb-notes/methodology-a-filter-needs-a-field.md)).
The dry-run prints the distinct combinations and the individual checks so the
shape is known before anyone designs against it.

⚠️ **`Transcribed` is both a lifecycle check and a numeric column.** The dry-run
measures how often they agree, and they must not be merged until Sam has ruled.
The precedent is `cpl_memory: applied-measure-fork-55-percent`, where
`applied_credits > 0` and `cpl_status_plan = 'Applied to CPL Plan'` disagreed by
55% and his ruling was *publish both and name the gap*.

---

## The salt-rotation detector

`map_student_key_sketch` holds the 2,000 lexicographically-smallest student
hashes of a pull, for the last two pulls, and the loader reports their overlap.

It is a **min-hash sketch, not a student map**, and that is the whole design: a
hash per student would be a persistent pseudonymous record of every student in
MAP, which is more than the stated need. A bounded uniform sample is enough to
distinguish a stable salt (overlap near 1) from a rotated one (near 0). The test
fails if `SKETCH_N` is raised past 5,000, because at that point it stops being a
sample.

Pedro confirmed the salt does not rotate, so this is a **regression check, not an
open question**. It exists because the failure is silent by construction: a
rotated salt raises no error anywhere — distinct-student counts simply stop being
comparable across pulls, and every trend line quietly becomes wrong.
`cpl_memory: statewide-is-138-not-84` is the standing precedent for a correct
ruling sitting unenforced because no consumer ever changed.

The first `apply` run has no previous pull and reports `first-pull`. That is
expected exactly once; a `first-pull` verdict on a later run means the sketch
table was cleared.
