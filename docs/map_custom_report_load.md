---
title: Loading the two new MAP Custom Report views
created: 2026-08-19
updated: 2026-08-19
tags: [procedure, supabase, map-api, custom-report, student-detail, catalog-year, reconciliation, privacy]
artifacts:
  - kb/_sync_map_custom_reports.py
  - kb/supabase_map_custom_report_staging.sql
  - kb/supabase_map_promote_custom_reports.sql
  - tests/map_custom_report_sync_test.py
  - .github/workflows/map-custom-report-load.yml
related:
  - "[[docs/map_custom_reports_lessons]]"
  - "[[docs/map_student_credit_reload]]"
  - "[[docs/map_dataset_sql_for_malone]]"
---

# Loading the two new MAP Custom Report views

**This runs itself.** `.github/workflows/map-custom-report-load.yml` fires daily
at **13:40 UTC** — after the last dashboard window (12:17) and after
`credential-catalog-sync` (13:20) — and goes fetch → staging → live without
anyone approving anything.

> Sam, 2026-08-19: *"This will run in the daily cron so just making sure I don't
> have to do a staging to live approval every day."*

So this page is not a checklist any more. It is **what the machine does, what
stops it, and what to do when it stops.**

|  | source view | staging | live |
|---|---|---|---|
| A | `View_CollegeExhibitCRByCatalogYear_APIDataset` | `stg_map_college_cr_unit` | `map_college_cr_unit` |
| B | `View_StudentDetailsCredits_APIDataset` | `stg_map_student_credit` | `map_student_credit` |

---

## What the nightly run does

1. `fetch_custom_report.py` pulls all ten datasets (~368 MB).
2. `tests/custom_report_payload_test.py` + `tests/map_custom_report_sync_test.py`
   run **before** the load, so a contract break is caught on the runner rather
   than discovered mid-insert.
3. `kb/_sync_map_custom_reports.py` clears staging with
   **`map_clear_custom_report_staging()`** and fills the two staging tables.
4. It calls **`map_promote_custom_reports()`**, which does everything below
   **in one transaction**, and either commits all of it or none of it.
5. The raw pull is deleted in an `always` step. Public repo, student rows.

### Why the human could be removed safely

Each thing the approval step was providing is now provided by the function:

| the human was catching | what catches it now |
|---|---|
| a half-finished insert blanking a live tab | **one transaction.** Live is fully old or fully new. Proven: a client timeout mid-promotion left live byte-identical and logged nothing. |
| **the RLS-restore trap** | **gone as a step.** The promotion replaces table *contents*, never the table, so policies and grants are never dropped. There is nothing to restore and nothing to get wrong. |
| a truncated or broken pull | **G1–G6**, each measured against the live table it is about to replace. |
| publishing a recoverable suppression | **G7/G8**, blocking. |
| published and unsuppressed drifting apart | both aggregates rebuild **inside the same transaction**. |

### Clearing staging is a TRUNCATE, and it is not a gate

⚠️ **The clear runs BEFORE the gated promotion, so no gate protects it.** On
2026-08-19 it was a PostgREST mass `DELETE` and it failed the first time it met a
**full** `stg_map_student_credit` — 591,820 dead tuples, `canceling statement due
to statement timeout`, surfacing to the runner as a bare `HTTP 500`. It would
have failed every night from then on: staging is full after every successful run,
and the manual runs that passed had met an empty one.

It is now `map_clear_custom_report_staging()` — `truncate table
stg_map_college_cr_unit, stg_map_student_credit`, **5.3 s** on the same 802,825
rows. The function takes **no argument**: the tables are named in its body, so
the pipeline's one destructive call has no table name to get wrong. Schema of
record: `kb/supabase_map_custom_report_staging.sql` § D.

If it ever fails, the message says so and says **nothing live has changed** —
which is true by construction, because it runs before the promotion.

---

## The gates

**Blocking** is for data that would be *wrong or unsafe*. **Warning** is for data
that is *incomplete but honest*. A blocking gate raises, which rolls the whole
transaction back — **live is untouched and the run fails loudly.**

| gate | refuses when | why it blocks |
|---|---|---|
| G1 | either staging table is empty | an empty table replacing a live one is the worst outcome available |
| G2/G3 | staging is >10% below live on rows | a partial insert leaves staging short-but-plausible, which a row count catches and eyes do not |
| G4 | distinct students >10% below live | rows and students move independently |
| **G5** | the surrogate is not dense 1..N, or has nulls | **the privacy tripwire.** A max in the millions means a MAP identifier reached the database instead of a counting surrogate |
| G6 | the college count fell by more than 2 | one appearing is normal; several vanishing is a keying change, not a refresh |
| **G7** | any college has exactly one suppressed `goal2` cell beside a visible sibling | **a disclosure.** Subtract the visible cells from the total and the hidden one falls out. Tests the *property* — asserting `suppressed = true` would pass on a broken implementation |
| **G8** | a suppressed cell still carries numbers | same reason |

**Warnings** (recorded, never blocking): a `course_type` MAP has newly invented,
landing in `goal2 dest = 'UNKNOWN'`; and any shrink in `cr_unit`, whose expected
cause is the catalog-year roll-forward.

⚠️ **`UNKNOWN` deliberately does not block.** It exists so a new value stays
countable rather than folded into a legitimate bucket. Freezing every figure in
the system over one mis-bucketed cell is the worse failure — but the warning is
a to-do: extend the vocabulary in `rebuild_map_college_goal2()`.

---

## When a run fails

**Live is already safe.** A raised gate rolled everything back before anything
was written, so the only question is what to fix.

1. Read the step log. A `G`-numbered message says which gate and with what
   numbers.
2. **Fix the pull, never the gate.** Loosening a threshold to get a red run green
   is how a bad load reaches a published figure.
3. To inspect without landing anything, dispatch with mode **`staging-only`** and
   query `stg_map_college_cr_unit` / `stg_map_student_credit` directly, or
   **`dry-run`** to parse and report without writing at all.
4. Re-dispatch with `apply` once the cause is understood.

### Reconciling a suspicious pull by hand

```sql
-- Totals
select 'A cr_unit' as dataset,
       (select count(*) from stg_map_college_cr_unit) as staging,
       (select count(*) from map_college_cr_unit)     as live
union all
select 'B student',
       (select count(*) from stg_map_student_credit),
       (select count(*) from map_student_credit);

-- Per college, worst disagreement first. THE COLLEGES MOVING THE WRONG WAY ARE
-- THE POINT: a one-directional total can hide a subset contradicting it.
with a as (select college_id, count(*) n from stg_map_college_cr_unit group by 1),
     b as (select college_id, count(*) n from map_college_cr_unit group by 1)
select coalesce(a.college_id, b.college_id) as college_id,
       b.n as live, a.n as staging, coalesce(a.n,0) - coalesce(b.n,0) as delta
from a full join b on a.college_id = b.college_id
order by delta asc limit 40;

-- Representation, not just counts. Row counts matching is not rows matching:
-- the live tables store '' where a careless loader emits NULL.
select 'live' side,
  count(*) filter (where catalog_year = '')   cy_empty,
  count(*) filter (where catalog_year is null) cy_null,
  count(*) filter (where college_course = '') cc_empty
from map_college_cr_unit
union all
select 'staging',
  count(*) filter (where catalog_year = ''), count(*) filter (where catalog_year is null),
  count(*) filter (where college_course = '')
from stg_map_college_cr_unit;
```

**What a good result looks like.** Totals up (MAP is ahead of us), and the only
colleges falling are explained. On 2026-08-19: +3.07% overall with exactly two
colleges down, both RCCD, caused by a **catalog-year roll-forward** — every
older year shrinks and every newer year grows, so rows move rather than vanish.

⚠️ **That makes the catalog-year axis MUTABLE.** Last year's figure changes when
you re-pull, so a year-over-year comparison drawn from two different pulls
compares two different partitions of the same rows. Say so wherever catalog year
is used as a time dimension.

---

## What the loader keeps, and what it drops

`fetch_custom_report.py` decides what we **ask for**; the loader decides what we
**keep**, and it keeps less. Minimisation happens twice
([`methodology-minimisation-happens-twice`](kb-notes/methodology-minimisation-happens-twice.md)).

**Stored from the student view (18 columns):** the 16 `map_student_credit`
already held, plus `status` and `cpl_plan_status`.

**Fetched and deliberately dropped:** `Location`, `CPL Mode`, `CPL Program`,
`Program`, `ProgramGoal`, `Transfer Destination`, `College Course`,
`Source Code`, `CourseCredits`, `AreaCredits`, `ElectiveCredits`,
`DefaultAreaCredits` — student attributes and credit splits with no consumer.
They are named in `HELD_COLUMNS` rather than merely omitted, so the decision is
visible to whoever next widens the load, and the test fails if one is quietly
moved into the stored contract.

**Never stored:** `StudentMAPID`. It is salt-hashed and the salt does not rotate
(Pedro Campos, ITPI, via Sam 2026-08-19), but the spec we sent MAP is explicit —
*"we only ever count distinct students, we never look one up"* — so it derives
the surrogate and is discarded. **Sam confirmed 2026-08-19 that `student_key` is
not stored elsewhere and never joined**, which is what makes a fresh surrogate
per pull sufficient.

⚠️ **Do not build anything that follows one student across pulls off
`student_key`.** It is deliberately not stable. Longitudinal tracking would be a
new decision about storing a persistent pseudonymous key, not an extension of
this one.

### Blank handling is PER TABLE, because the live tables disagree

| | blanks | rule |
|---|---|---|
| `map_college_cr_unit` | every numeric is **NOT NULL**, live holds `0` | zero-fill (`CR_UNIT_ZERO_FILL`) |
| `map_student_credit` | `applied_credits` / `transcribed_credits` are **nullable** and live **holds nulls** (31,467 / 19,533) | leave null |
| text columns, both | live stores `''` | **pass `''` through** — never map it to NULL |

Zero is the source's own meaning, not an invention: `sum_applied_credits` is
blank on **exactly** the `Not Applicable` rows and no other disposition, which is
caveat 4 of `map_dataset_sql_for_malone` — *"all four credit fields are 0 on
unapproved rows. That is correct behaviour, not missing data."*

Staging carries the live NOT NULL constraints, so a future mismatch fails at
**load**, with a clear message, instead of at promotion.

### The three status-shaped fields (Sam, 2026-08-19)

| field | what it is | stored as |
|---|---|---|
| `Status` | the **articulation approval stage** the row sits at, e.g. `Initiator` — a MAP approval-cascade role | `status` |
| `CPLStatusPlan` | the **action taken** on the CR: `Needs Action`, `Not Applicable` — the disposition | `cpl_status_plan` |
| `CPLPlanStatus` | **not a status.** The **lifecycle checks**, and there can be several: `CPL Docs \|Transcribed` | `cpl_plan_status`, verbatim |

`Status` and `CPLPlanStatus` are dimensions **no table we held carries** — the
substantive reason to load this view. Freshness is the lesser one.

⚠️ **`Status` is 91.2% blank** (empty string, not null) and its top value is
`Implementation` (45,302), not `Initiator` (2,918). Four values exist. **It
cannot facet the backlog** — a chart on approval stage would describe 8.8% of
rows while looking like it described all of them.

⚠️ **`CPLPlanStatus` holds six checks over 41 combinations** — CPL Docs 477,287 ·
Transcribed 82,235 · Ed Plan 45,529 · Analysis 36,489 · Counselor 23,106 ·
**Student** 20,457 — and its delimiting is inconsistent: most values are
pipe-*terminated* but 29,902 rows are a bare `Transcribed` with no pipe.
**Split and strip; never assume a trailing delimiter.** It is stored verbatim
because splitting in the loader would fix its grain before anyone has measured
it ([`a-filter-needs-a-field`](kb-notes/methodology-a-filter-needs-a-field.md)).

⚠️ **`Transcribed` is both a lifecycle check and a numeric column, and they
disagree by 3.2×** — check 82,235, units>0 25,621, both 25,621, so the units are
a strict *subset* and 56,614 rows are marked transcribed with zero units. The
precedent is `applied-measure-fork-55-percent`, where Sam's ruling was **publish
both and name the gap**. **Open: which one the tabs should mean.**

---

## The salt-rotation detector

`map_student_key_sketch` holds the 2,000 lexicographically-smallest student
hashes of a pull, for the last two pulls, and the loader reports their overlap.

It is a **min-hash sketch, not a student map**. A hash per student would be a
persistent pseudonymous record of every student in MAP, which is more than the
stated need; a bounded uniform sample distinguishes a stable salt (overlap near
1) from a rotated one (near 0). The test fails if `SKETCH_N` rises past 5,000,
at which point it stops being a sample.

Pedro confirmed the salt does not rotate, so this is a **regression check**. It
exists because the failure is silent by construction: a rotated salt raises no
error — distinct-student counts simply stop being comparable across pulls, and
every trend line quietly becomes wrong. `cpl_memory: statewide-is-138-not-84` is
the standing precedent for a correct ruling sitting unenforced because no
consumer ever changed.

---

## Changing the promotion

`kb/supabase_map_promote_custom_reports.sql` is the schema of record for
`map_promote_custom_reports()` and the two `rebuild_*` functions. Edit it, then
re-apply it as a migration — the file and the database are not linked
automatically.

The two aggregate builders (`kb/supabase_map_college_goal2.sql`,
`kb/supabase_map_college_credit_summary.sql`) still hold the reasoning behind
the suppression design and remain the place to read it; their bodies live in the
functions so the promotion can call them inside its transaction.

⚠️ **Never move a gate out of the function and into the caller.** A gate the
caller enforces is a gate the next caller skips.
