---
title: Test a database function locally with PGlite before it goes live
created: 2026-10-13
updated: 2026-10-13
tags: [playbook, supabase, testing, sql]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[workplan_annual_goals_lessons]]"
artifacts:
  - scripts/verify_workplan_move.js
  - kb/supabase_workplan_move.sql
---

# Test a database function locally with PGlite before it goes live

> **A plpgsql function can be run, refused and rolled back against a real Postgres 16 inside Node, so a session proves it before `apply_migration` puts it on the shared database.**

## Context

The repo's static SQL tests read a function's text: they can pin that a guard is present, never that it works. The
live database is shared and a session cannot write to it except through a migration, so until S375 a new function's
first real run was in production. The Move control (`workplan_move_sub_activity`, PR C of the
[Annual Goals lane](../reference/lanes/workplan-annual-goals.md)) renumbers a sub-activity in seven tables at once, and
its whole value is that it either finishes or changes nothing, which only a real transaction can show.

## The claim

**PGlite runs a committed `.sql` file as written.** It is Postgres 16 compiled to WebAssembly and runs in-process:
plpgsql, roles, `grant`/`revoke`, row-level security, `has_function_privilege`, `jsonb_populate_record`, exceptions
that roll back the whole statement. Nothing listens on a port and nothing leaves the process.

1. Install it for the run only: `npm i --no-save @electric-sql/pglite@0.2.17` (it is not a repo dependency, so CI
   never installs it and the script lives under `scripts/`, outside `npm test`).
2. Create the live table shapes, read from `information_schema` at write time, reduced to the columns the function
   touches. Keep the real constraints that matter: primary keys, the foreign keys, `not null`.
3. Stub what Supabase provides: the roles `anon`, `authenticated`, `service_role`; a schema `auth` with `jwt()`
   reading a setting (`set_config('test.jwt', '{"email": ...}', false)`), and the gate functions
   (`is_allowed_reviewer()`) over a one-row allow list.
4. Run the SQL file exactly as committed, then exercise it: the intended change, every refusal, the rollback path,
   the undo, and the grants (`has_function_privilege('anon', ...)`).
5. Compare whole-table snapshots before and after a refused call: a refusal that changed one row is a bug the error
   message will not show.

## How we got here

Postgres 16 is installed in the sandbox, but it refuses to run as root, and an unprivileged user cannot reach the
session's scratchpad, so `initdb` had nowhere to live. PGlite needed no server. The first run of
`scripts/verify_workplan_move.js` passed 22 of 22, including the case the design rests on: a table the function does
not know that still holds the old id stops the move, and a snapshot taken before and after shows nothing changed.

## What this does not cover

It proves the logic against the shapes you wrote down. A live table with a column or trigger you left out of the
replica is invisible to it, which is why the shapes are read from `information_schema` the same day, and why a
function that must cover every table also guards at run time (the Move function scans every `project_id`, `item_id`
and `activity_id` column after its re-key).
