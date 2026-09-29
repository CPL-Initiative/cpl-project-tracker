---
title: MAP student-credit datasets — SQL for the MAP platform team
date: 2026-08-09
tags: [spec, map-platform, sql, integration, daily-feed, disposition, cpl-status-plan]
artifacts:
  - map_student_credit (Supabase)
  - map_college_cr_unit (Supabase)
related:
  - "[[docs/map_custom_report_request_for_malone]]"
  - "[[docs/map_nightly_feed_spec]]"
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
---

# MAP student-credit datasets — SQL for the MAP platform team

**For:** Malone / the MAP platform team
**From:** the CPL Initiative (Sam Lee)
**Companion:** `map_custom_report_request_for_malone.md` (the API-view ask) ·
`map_nightly_feed_spec.md` (full grain-level spec)

---

## What this is, and why it may be easier than the view

We have been asking for one Custom Report **view** to be published. This
document is the alternative: **the SQL that produces the same result**, so you
can run it directly against the MAP database and hand back two files (or point
a job at them) without waiting on a view definition.

Either path works. **Pick whichever is less work on your side** — we only need
the data, not a particular delivery mechanism.

> **Why we can't just send you the existing queries.** These currently run as a
> chain of saved queries in an Access file on Sam's machine. That chain exists
> mostly to work around one Access limitation — **Jet SQL has no
> `COUNT(DISTINCT x)`** — which is why counting distinct students takes a
> `SELECT DISTINCT` query feeding a second `COUNT(*)` query feeding a join.
> Server-side, that whole chain collapses into single statements, below. Running
> this on the server also means the extract never has to travel through a laptop.

---

## What we need: two datasets

They are not redundant. **Credits SUM; students DEDUPE.** You cannot recover a
distinct-student count from the aggregate, because the same student appears
under many exhibits — so Dataset B exists purely to make student counts
correct.

| | Grain | Rows we last reconciled | Carries a person? |
|---|---|---|---|
| **A — credit funnel** | college × exhibit × recommendation × disposition × catalog year × course type | **204,714** | No — aggregate only |
| **B — student links** | student × college × exhibit × course type × catalog year | **220,588** | Yes — needs an opaque key |

Those two counts are what we reconciled against Sam's export. **If your run
returns materially different totals, something differs in scope and we should
compare before loading anything** — that check has already caught one silent
duplication on our side.

---

## Dataset A — the credit funnel (no student identifier)

This is the one that produces the headline numbers. Substitute your real table
name for `dbo.COLL_STU_EXH_CR_UNIT`.

```sql
SELECT
    u.CollegeID                          AS college_id,
    u.SourceCode                         AS source_code,
    u.ExhibitID                          AS exhibit_id,
    u.CreditRecommendation               AS credit_rec,
    u.CollegeCourse                      AS college_course,
    u.CPLStatusPlan                      AS cpl_status_plan,
    u.CatalogYear                        AS catalog_year,
    u.CourseType                         AS course_type,
    COUNT(DISTINCT u.StudentID)          AS distinct_students,
    SUM(COALESCE(u.PotentialCredits,   0)) AS sum_potential_credits,
    SUM(COALESCE(u.CreditsInReview,    0)) AS sum_articulated_credits,
    SUM(COALESCE(u.AppliedCredits,     0)) AS sum_applied_credits,
    SUM(COALESCE(u.TranscribedCredits, 0)) AS sum_transcribed_credits
FROM dbo.COLL_STU_EXH_CR_UNIT AS u
GROUP BY
    u.CollegeID, u.SourceCode, u.ExhibitID, u.CreditRecommendation,
    u.CollegeCourse, u.CPLStatusPlan, u.CatalogYear, u.CourseType;
```

⚠️ **`CourseType` must be in the GROUP BY.** We originally treated
`(college, exhibit, recommendation, catalog year)` as the key and it **collided
on about 8% of rows** — two different course types folding into one. It is part
of the grain, not an attribute.

⚠️ **Do not collapse `CatalogYear`**, and do not substitute `Status` for
`CPLStatusPlan` — see the caveats section.

---

## Dataset B — student links (opaque key, no PII)

```sql
SELECT DISTINCT
    CONVERT(varchar(64), HASHBYTES('SHA2_256',
        CONCAT(@Salt, '|', CONVERT(varchar(50), u.StudentID))), 2) AS student_key,
    u.CollegeID    AS college_id,
    u.ExhibitID    AS exhibit_id,
    u.CourseType   AS course_type,
    u.CatalogYear  AS catalog_year
FROM dbo.COLL_STU_EXH_CR_UNIT AS u
WHERE u.StudentID IS NOT NULL;
```

**Please do not send raw student IDs.** We only ever count distinct students —
we never look one up — so a one-way hash is sufficient for our purposes and
removes the question of what we are holding.

⚠️ **The salt is what makes this safe, and it must not travel with the data.**
A bare `SHA2_256` of a student ID is *not* anonymous: the ID space is small
enough to enumerate, so anyone with the hashes can recover every ID by hashing
all candidates. Set `@Salt` to a random secret, keep it on your side, send it
separately from the extract (or never at all), and **use the same salt each run**
so counts stay comparable over time.

If a stable non-identifying key already exists in MAP, that is better still —
we would rather use yours than derive one.

---

## Column contract

Names and types we load into. Anything nullable we handle; anything renamed we
will not notice until it breaks, so please flag renames.

| Column | Type | Notes |
|---|---|---|
| `CollegeID` | int | Joins to your college list. |
| `SourceCode` | string | e.g. `ACE`, `MAP`. |
| `ExhibitID` | string | Nullable — blankness is *meaningful*, see caveats. |
| `CreditRecommendation` | string | CR title. |
| `CollegeCourse` | string | Often `-` or empty; college-entered. |
| `CPLStatusPlan` | string | **The disposition.** Not `Status`. |
| `CatalogYear` | string | Required; do not collapse. |
| `CourseType` | string | Part of the key. |
| `PotentialCredits` | number | |
| `CreditsInReview` | number | We store as `articulated`. |
| `AppliedCredits` | number | |
| `TranscribedCredits` | number | |

---

## Caveats we learned the hard way

These cost us real time. Every one of them was a field that **colleges fill in
themselves** behaving differently from a field **MAP generates**.

1. **`Status` ≠ `CPLStatusPlan`.** They share exactly one value (`Needs
   Action`), which makes a wrong pick look plausible. `Status` is the workflow
   stage; `CPLStatusPlan` is what the college actually decided. We need the
   latter — it is the entire point of the request.
2. **`ExhibitID` blankness is inconsistent, and that is data.** The `-Course`
   variant arrives with `"Default Credit"`; the `-Area` variant arrives empty;
   at least one college sends a literal `"-"`. Please don't normalize these
   away — the difference tells us which path the credit took.
3. **`CourseType` is 11 values in two vocabularies**, not 3. Send it verbatim.
   It is the most valuable field in the extract: because MAP generates it, it is
   the one field we can trust to mean the same thing at every college, and it is
   what lets us measure real course credit against elective/GE-area credit.
4. **All four credit fields are 0 on unapproved rows.** That is correct
   behavior, not missing data — but it means any ratio must guard its
   denominator, since the unapproved population is exactly the backlog we care
   about.
5. **`TotalStudentsForCR` is not usable as a student count.** It varies *within*
   the same `(ExhibitID, CreditRecommendation)` group in 19,461 of 108,911
   groups, so summing it overstates. That is why we need Dataset B.

---

## How we'll verify before publishing anything

So you can see this won't quietly go wrong on our end:

1. Row counts reconciled against the source before load (the 204,714 / 220,588
   check above) — we caught a **2,058-row silent duplication** this way once.
2. Load to a permissive staging table, count, then `INSERT … SELECT DISTINCT`.
3. Aggregates published with **k = 10 suppression** per college, with the
   suppressed count disclosed so a total is never quietly short.
4. Student-grain rows are reviewer-only in our database, have **no write
   policies at all**, and are never readable by the public assistant.

---

## If the view is easier after all

Everything above is recoverable from a single Custom Report view exposing
`CPLStatusPlan` at the student × credit-recommendation grain — that was the
original ask in `map_custom_report_request_for_malone.md`, and **one view name
is all we need to unblock it.** We're happy either way; this document exists so
the request isn't blocked on our end waiting for one.

---

## Appendix — the Access version, if you run it in the file Sam sends

If it is easier to run this inside Sam's Access file rather than server-side,
here is the same result as a three-query chain, **in the order they must run**.
The chain exists only because **Jet SQL has no `COUNT(DISTINCT x)`** — so
counting distinct students takes two steps and a join.

**Qry1 — distinct student links** (this is Dataset B, minus the hashing, which
Access cannot do natively — see the note below):

```sql
SELECT DISTINCT u.StudentID, u.CollegeID, u.ExhibitID, u.CourseType, u.CatalogYear
FROM COLL_STU_EXH_CR_UNIT AS u
WHERE u.StudentID IS NOT NULL;
```

**Qry2 — the credit funnel, sums only** (no student count yet):

```sql
SELECT u.CollegeID, u.SourceCode, u.ExhibitID, u.CreditRecommendation,
       u.CollegeCourse, u.CPLStatusPlan, u.CatalogYear, u.CourseType,
       Sum(Nz(u.PotentialCredits,0))   AS sum_potential_credits,
       Sum(Nz(u.CreditsInReview,0))    AS sum_articulated_credits,
       Sum(Nz(u.AppliedCredits,0))     AS sum_applied_credits,
       Sum(Nz(u.TranscribedCredits,0)) AS sum_transcribed_credits
FROM COLL_STU_EXH_CR_UNIT AS u
GROUP BY u.CollegeID, u.SourceCode, u.ExhibitID, u.CreditRecommendation,
         u.CollegeCourse, u.CPLStatusPlan, u.CatalogYear, u.CourseType;
```

**Qry2b — distinct students per funnel row** (the `COUNT(DISTINCT)` stand-in —
a `SELECT DISTINCT` inner query counted by an outer one):

```sql
SELECT d.CollegeID, d.SourceCode, d.ExhibitID, d.CreditRecommendation,
       d.CollegeCourse, d.CPLStatusPlan, d.CatalogYear, d.CourseType,
       Count(*) AS distinct_students
FROM (
    SELECT DISTINCT u.CollegeID, u.SourceCode, u.ExhibitID, u.CreditRecommendation,
           u.CollegeCourse, u.CPLStatusPlan, u.CatalogYear, u.CourseType, u.StudentID
    FROM COLL_STU_EXH_CR_UNIT AS u
) AS d
GROUP BY d.CollegeID, d.SourceCode, d.ExhibitID, d.CreditRecommendation,
         d.CollegeCourse, d.CPLStatusPlan, d.CatalogYear, d.CourseType;
```

**Qry3 — join the two into Dataset A:**

```sql
SELECT q2.*, Nz(q2b.distinct_students,0) AS distinct_students
FROM Qry2 AS q2
LEFT JOIN Qry2b AS q2b
  ON  q2.CollegeID            = q2b.CollegeID
  AND q2.SourceCode           = q2b.SourceCode
  AND q2.CreditRecommendation = q2b.CreditRecommendation
  AND q2.CPLStatusPlan        = q2b.CPLStatusPlan
  AND q2.CatalogYear          = q2b.CatalogYear
  AND q2.CourseType           = q2b.CourseType;
```

⚠️ **Two things to watch in the Access version.**

**Nullable columns break equi-joins.** `ExhibitID` and `CollegeCourse` are
nullable and are deliberately left out of the join above for that reason — in
SQL, `NULL = NULL` is not true, so including them silently drops exactly the
rows where the blankness is meaningful (caveat 2). If you need them in the key,
join on `Nz(col,'~')` on both sides rather than the bare column.

**Access cannot hash.** Qry1 emits raw `StudentID`, so its output is
identifying and **should not be sent to us as-is**. Either run the server-side
Dataset B query instead, or replace the IDs with a salted one-way hash before
the file leaves your environment. If neither is convenient, send Dataset A only
and we will treat student counts as unavailable — an honest gap is fine; a
student identifier in the wrong place is not.
