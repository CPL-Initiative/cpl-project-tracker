---
title: A revoke must name every role the grant named — on this Supabase project a new function is callable by anon by name, not only through PUBLIC
created: 2026-09-30
updated: 2026-10-03
tags: [methodology, supabase, security, grants, rule-10]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - funding/supabase_cpl_funding_reports.sql
  - tests/supabase_function_grants_test.py
---

# A revoke must name every role the grant named

> **One-sentence summary** — A privilege comes off only from the role it was granted to, so before closing a function read who holds EXECUTE on it (`proacl`, `pg_default_acl`) and revoke from each of them by name; on this project that is `public, anon, authenticated`, because the schema's default privileges grant anon and authenticated directly as well as through PUBLIC.

## Context

`cpl_funding_my_reports()` (the Reporting box's college half, S308) was meant
for signed-in college staff only. Its SQL followed the repo's rule of the day,
`revoke execute ... from public`, then granted `authenticated`. The live read
afterward said `has_function_privilege('anon', …) = true`.

## The claim

**Privileges are additive and per grantee.** Revoking from PUBLIC removes the
PUBLIC entry and nothing else. Postgres grants EXECUTE to PUBLIC when a function
is created; this project's `pg_default_acl` on schema `public` also grants it to
`anon`, `authenticated` and `service_role` by name, for objects created by
`postgres` and by `supabase_admin`. So a new function carries four entries, and
closing it to the published anon key takes `revoke ... from public, anon` (and
`authenticated` when that role should not call it either).

**Read the ACL, not the SQL.** The statement that "closes" a function is a
claim; `proacl` and `has_function_privilege()` are the measurement. Check both
after every apply, and check `service_role` holds an explicit grant before any
revoke, or the cron that runs as it loses the function.

**The earlier rule was half right.** The repo's lint (2026-08-19) caught the
opposite mistake, a revoke that named anon and authenticated but not PUBLIC,
and concluded that naming the roles was "documentation, not protection". Here,
with default privileges in play, the roles need naming too. Both halves are
needed; either alone leaves the door open.

## How we got here

Measured 2026-09-30: `proacl` after `revoke from public` read
`{postgres=X, anon=X, authenticated=X, service_role=X}`; `pg_default_acl` showed
the named grants for both owners. The migration
`cpl_funding_my_reports_revoke_anon` closed it; the file now reads
`revoke ... from public, anon`. An exposure sweep found no destructive function
open: every rebuild, replace and clear function reads `{postgres, service_role}`,
because their files revoke from `public, anon, authenticated`. The security
definer functions that write and stay anon-callable are the intended public
feedback path and two audits.

## When this applies (and when it doesn't)

It applies to any function created in `public` on this project, and to any
Supabase project whose default privileges grant the API roles (the platform's
default). It does not apply to a function meant for anon, such as a public
aggregate, where the grant is the point; there the check is that the body
returns nothing private. Tables have their own default ACL and their own lint
(`tests/supabase_table_grants_test.py`).

## Tables too: a new table starts with every privilege (S320, 2026-10-03)

The same default ACL covers tables. `program_source_registry`, created
2026-10-03 with an explicit `grant select ... to anon, authenticated`, read back
`has_table_privilege('anon', ..., 'insert')` true and TRUNCATE true: the
schema's defaults had granted the API roles everything before the file's own
grant ran. RLS stops a row INSERT, UPDATE or DELETE that no policy allows; it
does not stop TRUNCATE, which is a table privilege. So a table meant to be
read-only to the API roles revokes the rest by name
(`revoke insert, update, delete, truncate, references, trigger ... from anon,
authenticated`), and a table with no API reader revokes all. Read it back with
`has_table_privilege` per role and command, as for a function.

## See also

- `CLAUDE.md` Rule 10 b2 — the operative rule
- `tests/supabase_function_grants_test.py` — the PUBLIC half, linted
- `[[cpl_funding_lessons]]` — the S308 section
- PR #1790 — the function and its grants

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
