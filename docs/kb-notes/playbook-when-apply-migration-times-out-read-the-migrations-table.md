---
title: When apply_migration times out, read the migrations table before retrying
created: 2026-10-13
updated: 2026-10-13
tags: [playbook, supabase, migrations, connector]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[workplan_annual_goals_lessons]]"
  - "[[methodology-a-receipt-too-large-for-the-connector-applies-from-the-runner]]"
  - "[[playbook-test-a-database-function-locally-with-pglite]]"
artifacts:
  - kb/supabase_workplan_move.sql
---

# When apply_migration times out, read the migrations table before retrying

> **A timeout says nothing about the SQL. Three reads tell you whether anything landed and whether the tool works at all; when the tool is down, stop retrying and hand the committed file to Sam as a paste.**

## Context

A session reaches Supabase only through the MCP connector. On the night of 2026-10-12 into 10-13, `apply_migration` timed out twelve times across three sessions (S374, S375, S377) on one small structure change, the Move function in `kb/supabase_workplan_move.sql`. Each session retried, and each retry cost a minute and taught nothing. Story: [[workplan_annual_goals_lessons]], S375 and S377.

## The claim

### Read three things after a timeout

1. **Did it land?** Check the object the migration creates (`to_regclass('public.<table>')`, `pg_proc` for a function). A timeout can arrive after the server finished, and a second apply of a non-idempotent migration fails or doubles.
2. **Is the database busy?** `pg_stat_activity` for non-idle sessions and lock waits. An open transaction holding a lock on the table the migration alters makes a migration wait, which is a database cause.
3. **Is the tool landing anything?** `select version, name from supabase_migrations.schema_migrations order by version desc limit 5`. If the last success is hours old while sessions have been trying, the connector path is down for every migration, of any size.

### Then decide

- Nothing landed, no lock, and no migration since a known success: **the tool is down.** Stop retrying. A smaller piece of the same SQL fails the same way (S377 proved it with a lone `create table`). The structure change goes to Sam as a paste of the committed file, carried on the Open Asks sheet, and the receipt stays the file.
- A lock: find who holds it before anything else; never kill another session's query.
- It landed: read it back (grants with `has_function_privilege`, row counts) and record it, do not reapply.

### Size is a different failure

A receipt in the megabytes fails on size, every time, and has its own route: [[methodology-a-receipt-too-large-for-the-connector-applies-from-the-runner]]. The migrations table separates the two: when a large insert landed at 21:51Z and a 9 KB function will not, size is not the cause.

## How we got here

S374 tried six times, S375 four (including a plain `create table` with grants), S377 twice: the full file at 01:45Z and the table alone at 01:47Z. Every time: no row, no table, no function, no lock, nothing running. `schema_migrations` showed its last row at 23:19Z on 2026-10-12 (`add_projects_count_note`, 445 characters), with an 18,000-character migration at 21:51Z before it. Reading that table first would have saved ten of the twelve tries.

## When this applies (and when it doesn't)

Any session write through `apply_migration`. It does not cover `execute_sql` reads, which kept working throughout, or data writes, which go to Sam as pastes under the repo's guard regardless.

## See also

- [[playbook-test-a-database-function-locally-with-pglite]]: prove the function before it reaches the shared database, so a paste is the only step left.
- [[methodology-live-db-functions-need-committed-schema]]
