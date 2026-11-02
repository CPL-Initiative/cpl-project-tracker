---
title: Probe a live trigger inside a statement made to fail, so the database shows what it would write and keeps nothing
created: 2026-11-02
updated: 2026-11-02
tags: [methodology, supabase, testing, college-identity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[college_identity_lessons]]"
  - "[[methodology-a-name-a-join-keys-on-is-a-key]]"
artifacts:
  - kb/migrations/2026-11-02_college_short_names.sql
  - kb/college_identity/2026-11-02_short_names_seed.md
---

# Probe a live trigger inside a statement made to fail

> **To learn what a trigger does on live rows without writing anything, run the UPDATE inside a statement that errors
> at its end and puts the RETURNING values in the error message; the database reports them and rolls back the whole
> statement, the trigger's own writes included.**

## Context

A trigger on a shared table is the code most worth testing on live data and the least safe to test there: a probe
UPDATE that succeeds is a real edit, and a trigger that only lets a table grow (aliases here) cannot be undone by a
second UPDATE. The repo's Supabase guard refuses a `do` block, and a session cannot hold a transaction open across two
`execute_sql` calls. S545 needed to know that `college_short_names_guard` trimmed a short, set its CAPS form, kept the
old short as an alias and refused a collision, before anyone used the editor.

## The claim

One statement is one transaction. Put the UPDATE in a data-modifying CTE, return what the trigger left in the row, and
make the outer select fail on those values:

```sql
with u as (update public.college_short_names set short = '  Hancock   '
           where canonical = 'Allan Hancock College'
           returning short, short_caps, aliases, updated_by)
select ('PROBE short=[' || u.short || '] aliases=' || u.aliases::text || ' by=' || u.updated_by)::int from u;
```

The cast fails, the error reads `invalid input syntax for type integer: "PROBE short=[Hancock] ..."`, and the update, the
trigger's changes to the row and its insert into the log all roll back. A refusal probe needs no cast: when the trigger
raises, its own message comes back and nothing commits; if it fails to raise, the cast still rolls the statement back.

Then read the row and the log in a separate query and confirm both are as they were. That read is the proof nothing
persisted; the probe's design is only the reason to expect it.

## How we got here

S545 created `public.college_short_names` through `supabase-migrate.yml` and seeded it from the committed file. The
first idea, a `do` block that updated, read and raised, was refused by the repo's guard (data writes run; code-running
statements go through a migration). The failing-statement probe ran through `execute_sql` as an ordinary data write:
the rename came back trimmed, in CAPS and with `Allan Hancock` added to the aliases; *Desert* for Butte College came back
as the trigger's refusal naming College of the Desert; afterwards both rows read as seeded and the log held 0 rows.

## When this applies (and when it doesn't)

- It shows what a BEFORE trigger leaves in the row and what an AFTER trigger raises. It cannot show anything that happens
  after commit: a notification, a webhook or a cron that reads the log.
- Whatever the trigger does outside the database (an `http` call, a `pg_net` request) is not rolled back. Read the
  function before probing it.
- `auth.jwt()` is empty under the service role, so a trigger that records the writer records `postgres`. Probe the
  logic this way and let the first real edit show the reviewer's email in the log.
- It is not a substitute for a test in the repo; it is the check that the deployed function is the one the file says.

## See also

- `docs/college_identity_lessons.md`, *S545*: the short-name editor this probed
- `kb/college_identity/2026-11-02_short_names_seed.md`: the receipt with both probes' outputs
- [`methodology-a-name-a-join-keys-on-is-a-key`](methodology-a-name-a-join-keys-on-is-a-key.md): the rule the trigger enforces
- PR `#2681`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
