---
title: A gateway error is not an answer
created: 2026-10-02
updated: 2026-10-02
tags: [methodology, supabase, pipeline, reliability]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[map_custom_reports_lessons]]"
  - "[[map_custom_report_load]]"
artifacts:
  - kb/_sync_map_custom_reports.py
  - tests/map_custom_report_sync_test.py
---

# A gateway error is not an answer

> **An HTTP 5xx or a timeout from PostgREST says the call failed to answer, and nothing about what Postgres did; read the result back before you retry or report, and pair any retry with a check that refuses too many rows.**

## Context

The nightly MAP Custom Report load went red twice in September for this one
reason. On 2026-09-18 a 504 on the promotion printed "rolled back" over a
promotion that had committed. On 2026-09-30 a 520 on one 5,000-row staging
batch ended the night's load. The story is in
[map_custom_reports_lessons](../map_custom_reports_lessons.md), 2026-10-02.

## The claim

**The gateway and the database finish separately.** A 504 or 520 comes from
the proxy in front of PostgREST. The statement behind it may still be running,
may have committed, or may never have started. A timeout on the client is the
same. So the error tells you only that the answer was lost.

**Read back, by a fact the work itself writes.** Count the table you inserted
into, or look for the log row a function writes inside its own transaction.
For a log row, compare ids taken before and after the call rather than
timestamps, which ties the check to the database and not to the runner's clock.

**A retry needs a guard against too many rows.** Gates written for truncated
loads refuse a short table. A retry adds a new failure, a table that is too
long, and a short-table gate passes it. Where the table carries no key, a
batch that committed before its error and is then sent again lands twice. So
the retry ships with a check, just before anything publishes, that the table
holds exactly the rows sent.

**Never re-send a call that does work you cannot undo.** For a promotion or
any one-shot transaction, poll for its log row for a bounded time and report
what you find. If no row appears, report "not confirmed" and go red, rather
than claiming a rollback you did not see.

## How we got here

Handoff 277 (item 9) named the 504 misreport on 2026-09-18 and the loader was
never changed. S317 read the 2026-09-30 log, found the second instance, and
built the read-back (#1824). The tempting one-line retry was rejected after
reading the promotion's gates: G2 and G3 compare staging to live only from
below, and the staging tables have no primary key. A `staging-only` dispatch
proved the new count against real PostgREST (run 37024910352).

## When this applies (and when it doesn't)

It applies to any bulk loader or RPC caller that talks to Supabase through its
gateway: staging inserts, promotions, cron-driven writers. It does not apply
to a 4xx, which is a real refusal (a raised gate, a constraint, bad input) and
must stop the run at once. A table with a natural key can skip the count and
let the duplicate fail on its constraint, if failing the run is the response
you want.

## See also

- [`docs/map_custom_report_load.md`](../map_custom_report_load.md), "A gateway error is not an answer"
- [methodology-a-negative-result-needs-a-positive-control](methodology-a-negative-result-needs-a-positive-control.md)
- [playbook-edge-function-502-retired-model](playbook-edge-function-502-retired-model.md)
