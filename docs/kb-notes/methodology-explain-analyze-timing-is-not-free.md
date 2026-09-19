---
title: EXPLAIN ANALYZE's own clock is a cost, and on a wide scan it dominates
created: 2026-09-19
updated: 2026-09-19
tags: [methodology, performance, postgres, measurement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-an-index-is-a-write-path-cost-until-measured]]"
artifacts:
  - chatbox/supabase_program_typical_courses.sql
  - chatbox/verify_program_typical_courses.sql
---

# EXPLAIN ANALYZE's own clock is a cost, and on a wide scan it dominates

> **One-sentence summary** — `EXPLAIN (ANALYZE, TIMING ON)` reported 4,809 ms for
> a statement that executes in 115 ms, because it reads the clock twice per row
> and the plan scanned 141,696 of them.

## Context

Diagnosing why a smoke test's anonymous probe of `program_typical_courses` was
timing out at PostgREST's 3-second ceiling, the obvious instrument said the
query was the problem:

```
Seq Scan on chatbox_college_courses  (actual time=16.552..4794.473 rows=727)
  Rows Removed by Filter: 141366
  Buffers: shared hit=5594
Execution Time: 4809.320 ms
```

A 4.8-second sequential scan with a 3-second budget is an open-and-shut case,
and the remedy looks obvious: index `top_code`, because the scan discards 141,366
rows to keep 727.

The same statement, same session, same warm cache, with timing switched off:

```
Execution Time: 115.503 ms
Planning Time: 24.516 ms
```

## The mechanism

With `TIMING ON` (the default under `ANALYZE`), Postgres calls the system clock
**twice for every row at every node** so it can report per-node actual times. On
a narrow plan over a few hundred rows that overhead disappears into the noise. On
a node that touches 141,696 rows it is roughly 283,000 clock reads, and on a
virtualized host where `gettimeofday` is not a cheap vDSO call, that is seconds.

The instrumentation lands on the node doing the scanning, which is exactly the
node a reader is inspecting — so the artifact appears precisely where it is most
likely to be believed.

## What to do instead

- **For a total, use `EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)`.** Row counts,
  buffer hits, filter selectivity and the shape of the plan all survive; only the
  per-node times are withheld, and those are the untrustworthy part.
- **For a real number, time the call from outside** — `clock_timestamp()` either
  side of the statement, or the client's own measurement. That is what a caller
  actually experiences.
- **Check `pg_test_timing`** when the gap matters; it reports the per-call cost
  of the clock on that host.
- **Treat a large gap between the two as its own signal.** If `TIMING OFF` is
  dramatically faster, the plan touches many rows, which is worth knowing even
  when the absolute cost is fine.

## Why it matters beyond one query

The wrong reading pointed at an index on a 141,696-row table whose loader
replaces every row. This repo has already learned that
[an index is a write-path cost until measured](methodology-an-index-is-a-write-path-cost-until-measured.md)
— three GIN indexes broke the nightly loader within the hour and bought 4 ms.
Acting on the inflated number would have repeated that, to fix a query that was
never slow.

The general form: **a measurement tool that participates in what it measures
reports its own presence.** The defense is a second measurement by a different
mechanism, and disbelief when two instruments disagree by 40×.
