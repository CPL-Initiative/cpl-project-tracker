---
title: Every live database function needs a committed schema-of-record file
created: 2026-07-02
updated: 2026-07-02
tags: [methodology, supabase, postgres, schema, governance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-capped-retrieval-ranks-by-relevance]]"
  - "[[docs/kb-notes/playbook-deploy-shared-supabase-edge-function]]"
artifacts:
  - chatbox/supabase_search_exhibits_by_topic.sql
  - chatbox/supabase_sierra_feedback.sql
---

# Every live database function needs a committed schema-of-record file

> **One-sentence summary** — a Postgres function (or policy) that exists only
> in the live database is invisible to every review, session, and audit; the
> fix is a committed `supabase_<name>.sql` schema-of-record file, updated in
> the same commit as the live migration.

## Context

The `search_exhibits_by_topic` RPC — the retrieval behind every Sierra topic
answer — carried an `ORDER BY rec_count DESC` defect for ~20 sessions. It was
never caught because the function body lived only in Postgres: no diff ever
showed it, no session read it, and the edge-function code that called it
looked entirely reasonable. It was only inspected (via
`pg_get_functiondef`) after a user-visible failure. Full story:
`docs/cpl_assistant_lessons.md` (Session 93).

## The claim

**Live-only SQL is unreviewable SQL.** For every function, trigger, or policy
applied to the shared Supabase project:

1. Commit a **schema-of-record file** (this repo's convention:
   `<area>/supabase_<topic>.sql`) containing the exact `CREATE OR REPLACE`
   text, a header naming the live migration that applied it, and — when the
   revision fixes a defect — WHY the previous shape was wrong.
2. Update that file **in the same commit** as the `apply_migration` call, so
   the repo and the database never drift silently.
3. When editing an inherited surface, **fetch the live definition first**
   (`pg_get_functiondef` / `get_edge_function`) rather than trusting the repo
   copy — and if the repo copy was missing, that IS the finding: create it.

This repo already applied the same rule to Edge Functions (capture-first,
source-of-record at `chatbox/supabase/functions/…`) and to table schemas
(`supabase_*.sql` files); this note extends it explicitly to RPCs/functions,
which were the gap.

## How we got here

The Session-93 CPR diagnosis had to pull the function body from
`pg_proc` because `grep search_exhibits_by_topic` found only the caller.
The fix migration (`search_exhibits_by_topic_relevance_rank`) landed together
with the new `chatbox/supabase_search_exhibits_by_topic.sql`, closing the gap
for that function; `sierra_feedback_set_status` (same session) was born with
its schema-of-record entry.

## Where it applies

Every Supabase surface this project touches — and any successor system (the
MAP platform promotion path) that keeps logic in database functions. If a
future session finds itself reading `pg_get_functiondef` output for something
with no repo file, the corrective action is part of the fix, not optional.
