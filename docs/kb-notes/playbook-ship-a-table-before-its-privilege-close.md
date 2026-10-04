---
title: Ship a new table before its privilege close, when the database tool holds the close
created: 2026-10-04
updated: 2026-10-04
tags: [playbook, supabase, rule-10]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/kb-notes/playbook-measure-first-supabase-migration]]"
artifacts:
  - kb/supabase_program_source_addenda.sql
  - kb/receipts/program_source_addenda_close_2026-10-04_s326.sql
  - chatbox/supabase_program_requirement_records.sql
  - kb/receipts/program_requirement_records_close_2026-10-04_s326.sql
---

# Ship a new table before its privilege close, when the database tool holds the close

> **A new Supabase table can go live from a remote session in two parts: a
> create-only part whose write path is closed by row-level security and a
> security invoker function, then a privilege close a person pastes.**

## Context

The Supabase connector holds any statement that names a destructive SQL keyword
(a privilege removal among them) for a confirmation a remote session cannot
answer; the call times out at 60 seconds and writes nothing. Every new table here
needs such a close: the project's default privileges hand `anon` and
`authenticated` every table privilege, and PUBLIC holds EXECUTE on a new function
(CLAUDE.md Rule 10 b2). S326 met this with the catalog addenda table and again
with the program requirement records.

## The claim

Split the migration where the keyword starts.

1. **Part A, create-only (the session applies it).** The tables, indexes and
   trigger; `enable row level security` with a SELECT policy and no write policy;
   explicit grants to `service_role`; and any write function as **security
   invoker**. RLS then refuses every insert, update and delete from the public
   roles through PostgREST, and an invoker function called by `anon` runs with
   `anon`'s rights, so it writes nothing either. `service_role` holds BYPASSRLS and
   its explicit grants, so the real writer works at once.
2. **Part B, the close (a person pastes it in the SQL editor).** Remove the
   default extras from `anon` and `authenticated` (TRUNCATE ignores RLS) and close
   each function to PUBLIC, `anon` and `authenticated`. End the receipt with a
   read-back of `has_table_privilege` and `has_function_privilege` rows.
3. **Put Part B on the standing decision sheet** with the receipts it waits beside,
   so the gap has an owner and an end.

Never make the Part A write function security definer: until Part B lands, PUBLIC
can call it, and it runs as the owner.

## How we got here

The full addenda file timed out and wrote nothing (2026-10-04, read back: no
table, no function, no migration). The create-only part applied in about a
second. The privileges were read back after Part A (RLS on, one SELECT policy,
`anon` holding the default table privileges, the function `prosecdef` false), and
the function's logic was checked in a block that raised at its end, so nothing
persisted. Earlier sessions met the same confirmation on `cpl_memory` rows that
merely mentioned a keyword in quoted text (`cpl_memory`
connector-confirm-matches-words-in-quoted-text-2026-10-03).

## When this applies (and when it doesn't)

It applies to a new table whose writers are `service_role` or a function. It does
not cover a table people write through the API under their own role: that needs
real write policies, which are a Governance question (Rule 10 a3) before it is a
migration. It does not cover a change to an existing shared table's grants; that
is a reviewed plan and a person's run from the start.

## See also

- [`docs/program_requirements_harvest_lessons.md`](../program_requirements_harvest_lessons.md), items 39-40
- [`playbook-measure-first-supabase-migration`](playbook-measure-first-supabase-migration.md)
- `cpl_memory` invoker-write-function-lets-a-table-go-live-before-its-close-2026-10-04
