---
title: A materialized view cannot carry RLS — its suppression has no backstop
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, supabase, disclosure, privacy, rls]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/methodology-small-cell-suppression-must-survive-subtraction]]"
artifacts:
  - college_briefing.js
---

# A materialized view cannot carry RLS — its suppression has no backstop

> **One-sentence summary** — PostgreSQL matviews do not support row-level
> security, so a matview granted to `anon` is public no matter what policies its
> source tables carry, and any k-anonymity it applies is enforced **only** by the
> script that built it.

## Context

Every student-derived table behind the My College tab is gated at the database:
`map_college_credit_summary`, `map_college_cr_unit`, `map_college_goal2` and
`map_college_contacts` all carry an RLS policy of
`is_allowed_reviewer() OR team_pass_ok()`. Auditing that gate before answering a
question about opening the tab to colleges turned up one read that behaved
differently: `map_credential_student_rollup`, which is a **materialized view**.

```sql
select c.relkind, c.relrowsecurity,
       (select count(*) from pg_policies p where p.tablename = c.relname) as policies
from pg_class c ... where c.relname = 'map_credential_student_rollup';
-- relkind 'm', relrowsecurity false, policies 0

select has_table_privilege('anon', 'public.map_credential_student_rollup', 'SELECT');
-- true
```

`relkind = 'm'` with `relrowsecurity = false` is not a misconfiguration that can
be fixed by enabling RLS. **Postgres does not implement row-level security for
materialized views at all.** `ALTER MATERIALIZED VIEW … ENABLE ROW LEVEL
SECURITY` is not valid syntax, and `security_invoker` — which does make an
ordinary view respect the caller's policies — has no effect on one.

## The claim

**A matview's access story is its GRANT, and nothing else.** If `anon` holds
SELECT, the whole matview is public to anyone with the project URL and the
publishable key, regardless of how tightly its source tables are policed. The
matview is a *copy*, and the copy left the policy behind.

The consequence for privacy work is the part worth remembering:

> Where a matview applies small-cell suppression, that suppression is enforced
> **only by the build script**. Every sibling table has RLS as a second line; the
> matview structurally cannot. A rebuild that drops the suppression step
> publishes the grain silently, and nothing downstream will object.

So a suppressing matview needs its invariant asserted **as a test against the
built object**, not merely implemented in the builder — because for this one
object, the builder is the entire control.

## How we got here

Session 141 (SkyLink), while scoping whether the My College tab could serve a
college its own page without the team phrase. The audit's outcome was reassuring
on the facts and unsettling on the structure:

| Check | Result |
|---|---|
| Rows | 543 |
| Cells with a published `students` value | 123 |
| **Published cells below k = 10** | **0** |
| Minimum published `students` | exactly 10 |
| Suppressed cells | 420 |
| Suppressed cells leaking any other measure | **0** — `potential_units`, `applied_units`, `transcribed_units` and `rows_needs_action` are all null on every one |

That is complete suppression, including the complement half that a sibling
workstream had to learn the hard way (a suppressed cell recoverable by
subtracting published siblings from a published total). Nothing is currently
exposed. The finding is *structural*: this object is one careless rebuild away
from publishing per-college, per-credential student counts, and it is the only
read on the tab with no policy beneath it.

## When this applies (and when it doesn't)

Applies to every materialized view in a PostgREST-exposed schema, and with
particular force to any that exists **because** aggregation was too slow to do
live — which is exactly when the underlying grain is sensitive enough to have
been gated in the first place.

Does not apply to ordinary views: those have no storage, and with
`security_invoker = true` they execute under the caller's policies. That is the
usual remedy when a matview's convenience is not worth the lost backstop —
though it trades away the speed the matview existed for.

Three ways out, in descending order of safety: **revoke the `anon` grant** and
read it through a gated ordinary view or an RPC; keep the grant but **assert the
suppression invariant in CI** against the built object; or accept it as public
by design and say so explicitly next to the builder, as this project already
does deliberately for `chatbox_credentials`. The failure mode to avoid is none
of these — it is a matview that is public *by accident* and safe *by luck*.

## See also

- `[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]` — the k = 10 regime this sits under
- `[[docs/kb-notes/methodology-small-cell-suppression-must-survive-subtraction]]` — the complement half, learned separately
- `CLAUDE.md` Critical Rule 10 — Supabase live-curation safety

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
