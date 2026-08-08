---
title: A successful import is not a correct one
created: 2026-08-08
updated: 2026-08-08
tags: [methodology, data-quality, ingestion, supabase, verification, student-data]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one]]"
  - "[[docs/kb-notes/methodology-a-failed-read-is-not-an-empty-result]]"
  - "[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
artifacts:
  - map_student_credit (Supabase)
---

# A successful import is not a correct one

> **One-sentence summary** — a loader that reports success has told you it
> finished, not that it moved your data; only reconciling the row count against
> the source catches a tool that silently duplicated part of the file.

## Context

Session 128 loaded a 220,588-row MAP student-detail export from Microsoft Access
into Supabase via the dashboard's CSV importer. The importer reported success.
The staging table held **222,646** rows — **2,058 more than the source file.**

Every row was duplicated **exactly twice**, 2,058 groups, and the arithmetic
closed exactly: `220,588 + 2,058 = 222,646`. The Access query was
`SELECT DISTINCT` over precisely the five exported columns, so the file could not
contain a genuine duplicate; Sam then re-imported the CSV back into Access and
got 220,588 again, isolating the fault to the loader. Supabase Studio commits in
batches, and a batch that commits without returning an acknowledgement gets
re-sent.

## The claim

### 1. Both endpoints can be right while the transfer is wrong

The source was correct. The file was correct. Checking either one proved
nothing, because neither was where the corruption happened. **Reconciliation is a
property of the boundary, not of the things it connects** — the only check that
could have caught this compares a count on one side to a count on the other.

### 2. Over-counting is more dangerous than under-counting

A load that drops rows tends to announce itself: a downstream join comes up
empty, a college disappears from a report, someone notices their data missing.
A load that *adds* rows produces numbers that are merely **slightly wrong** —
here 0.93% — which is well inside the range where a figure still looks plausible
and nobody investigates.

Worse, duplicates do not distribute evenly. 2,058 consecutive rows are one
batch, so the inflation lands entirely on whichever colleges happened to sit in
that window. A per-college percentage would have been wrong for a handful of
colleges and right for everyone else — the hardest possible shape to notice.

### 3. Land in a permissive staging table, reconcile, then transform

The pattern that caught it:

```
CSV --> staging (all text, all nullable, no PK) --> reconcile --> real table
```

Loading straight into the strict table would have thrown a duplicate-key error
partway through, leaving a partial load and no clean way to tell which rows were
genuinely yours. Staging turns a hard failure into a measurement.

The transform then does the deduplication as a **side effect of being explicit**:

```sql
insert into map_student_credit (...)
select distinct
  round(student_key::numeric)::int,   -- source exported '3.00' for an int column
  ...
  coalesce(trim(course_type), '')     -- CSV cannot distinguish '' from absent
from map_student_credit_staging;
```

Both casts above were also necessary, and neither was visible until the data
was somewhere it could be looked at.

### 4. The count check must be a REQUIRED step, not a flourish

This load repeats monthly and the file only grows, so the same retry will happen
again with a different row count. A procedure that says "import, then verify if
you get a chance" will verify the first time and never again. The reconciliation
belongs in the procedure as a gate: **do not drop staging until
`count(real) == count(source)` exactly.**

⭐ An exact match is also a stronger signal than it looks. Landing on 220,588
proved simultaneously that no rows were lost, that the dedup removed exactly the
artifacts and nothing real, and that `trim()` had not silently merged two rows
differing only by whitespace — that last one would have shown up as a count
*below* the source, and would otherwise have been invisible.

## Where it applies

Any load where a tool moves rows and reports its own success: dashboard CSV
importers, bulk API writers, ETL steps, `COPY` wrapped in a script, a connector
sync. Checklist:

- (a) capture the source count *before* the transfer, from the source system
- (b) land in a permissive staging table — text, nullable, no constraints
- (c) compare counts across the boundary, and treat any difference as a defect
      to explain rather than a rounding artifact
- (d) if counts differ, characterise the difference (duplicated groups?
      multiplicity? contiguous?) before deciding it is safe to dedupe
- (e) only dedupe when the source guarantees uniqueness — here `SELECT DISTINCT`
      over exactly the key columns made every duplicate provably an artifact
- (f) drop staging only after the counts reconcile

## What this note does NOT claim

It is not an argument against the dashboard importer, which is the right tool
for a curator loading their own export and worked fine on the second hop. The
claim is narrower: **its success message is not evidence about your row count**,
and no loader's is.

---

*Authoring check: durable (the loader will do this again), reusable (any
source→destination transfer), distilled (one failure mode), self-contained.*
