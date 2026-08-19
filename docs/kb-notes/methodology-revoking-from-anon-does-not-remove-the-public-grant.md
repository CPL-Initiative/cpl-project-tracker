---
title: Revoking from anon does not remove the PUBLIC grant
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, security, supabase, rls, grants, postgres, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-an-rls-filtered-read-is-not-an-error]]"
  - "[[docs/map_custom_reports_lessons]]"
artifacts:
  - tests/supabase_function_grants_test.py
  - kb/supabase_map_promote_custom_reports.sql
  - kb/supabase_map_custom_report_staging.sql
---

# Revoking from anon does not remove the PUBLIC grant

> **One-sentence summary** — `revoke ... on function f() from anon,
> authenticated;` reads like it closes a function to the API roles and closes
> nothing, because Postgres granted EXECUTE to **PUBLIC** at creation and
> privileges are additive.

## Context

Six `security definer` functions in this project carried that line in their
`.sql` — the promotion that truncates `map_college_cr_unit` and
`map_student_credit`, the three aggregate rebuilds, the clean-up worklist
rebuild, and the staging clear. Every one was callable with the **published**
anon key. Found 2026-08-19 while adding a seventh and checking the ACL rather
than trusting the line.

## The claim

Postgres grants `EXECUTE` on a new function to `PUBLIC`. `anon` and
`authenticated` are members of `PUBLIC`, and privileges accumulate across role
memberships. **Revoking from a member role does not revoke the grant the member
inherits.** The `revoke` succeeds, reports nothing, and changes nothing.

The tell is in `pg_proc.proacl`, where the entry with an **empty grantee** is
PUBLIC:

```
{=X/postgres,postgres=X/postgres,service_role=X/postgres}
 ^^ this is PUBLIC holding EXECUTE
```

`select has_function_privilege('anon', 'public.f()', 'execute')` answers the
question directly, and answered `true` for all six.

The correct form names `public`:

```sql
revoke all on function public.f() from public, anon, authenticated;
```

⚠️ **Check for an explicit `service_role=X` before revoking PUBLIC.** If the
caller's privilege came only from PUBLIC, revoking it breaks the job that needs
it. All six here had an explicit grant, so the cron was unaffected — that was
verified before the revoke, not after.

## What to do with it

- **Verify a grant by asking the database, not by reading the migration.** A
  `revoke` that ran without error is not evidence; `has_function_privilege` is.
  Same shape as the Obsidian exclusions that were documented and never applied,
  and as `statewide-is-138-not-84`, where a correct ruling sat unenforced
  because no consumer changed.
- The correct idiom was **already in this repo twice** (`cpl_funding_optin_review`,
  `gr_pass_check`) alongside six wrong ones. Two spellings of the same intent,
  one of which silently does nothing, is a lint, not a style preference —
  `tests/supabase_function_grants_test.py` now fails the build on the wrong one.
- This is not the same question as RLS. RLS gates the *rows a query sees*;
  a `security definer` function bypasses it by design. **The only thing standing
  between a destructive definer function and the internet is its EXECUTE grant.**
