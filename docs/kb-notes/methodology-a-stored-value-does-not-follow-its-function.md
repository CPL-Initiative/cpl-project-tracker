---
title: A stored value does not follow its function — precompute to remove per-row variance, and recompute whenever the function changes
created: 2026-09-30
updated: 2026-09-30
tags: [methodology, postgres, performance, sierra, generated-columns]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_assistant_lessons]]"
  - "[[methodology-an-index-is-a-write-path-cost-until-measured]]"
artifacts:
  - chatbox/supabase_program_typical_courses.sql
  - chatbox/verify_program_typical_courses.sql
  - kb/receipts/program_typical_courses_title_norm_2026-09-30.sql
---

# A stored value does not follow its function

> **One-sentence summary** — Storing a derived value (a generated column) takes a per-row function call out of the read path, which removes its variance under load, but Postgres lets the function be replaced while the stored values keep the old definition, so the file that defines the function must recompute the column right after it, and a verify step must count stale rows.

## Context

Sierra's `program_typical_courses()` normalized every matching course title on
every call. The anon key allows 3 s. The smoke's probe failed some days and
passed others, and nothing in the code had changed between them.

## The claim

**A per-row SQL-function call is a source of variance, not only of cost.** On
the same 723 rows the normalizing step measured 72, 503 and 4,178 ms on three
calls; through PostgREST 153 calls averaged 2,552 ms. The direct query, run
alone, took 83 ms. A call that is cheap when the database is quiet can cross a
fixed timeout when it is busy, so a probe against a timeout fails
intermittently. Storing the value once, at write time, leaves the read a scan:
88 ms, with identical output.

**The stored value keeps the definition it was computed with.** A generated
column requires an immutable function, and Postgres trusts that promise: a
`create or replace` of the function is accepted while the column depends on
it, and the rows keep their old values. Nothing errors. So:

1. the schema-of-record file recomputes right after it defines the function
   (`update t set col = default where col is distinct from f(src)`; a no-op when
   nothing changed);
2. the verify file counts rows where the stored value differs from the function;
3. every writer is checked once: a generated column accepts no value in an
   INSERT, so a loader or a rollback that copies whole rows must leave it out.

**Precompute where the read is hot and the write is batched.** The loader here
writes 500 rows a call; the added work per batch is small and bounded. The
opposite shape, one large statement under a fixed timeout, is where storing
moves the risk onto the write instead (see the index note).

## How we got here

S309 (joined with S308), 2026-09-30, PR #1789: the timings above, the md5 checks
over 47, 2 and 66 programs, and the receipt with the prior definition and the
rollback. The smoke's 7c probe then read 50 colleges without a timeout.

## When this applies (and when it doesn't)

It applies to any value derived by a function from columns of the same row and
read far more often than written. It does not help when the function depends
on other rows or on time (a generated column cannot express that), and it adds
risk where the table is written in one statement under a timeout.

## See also

- `[[cpl_assistant_lessons]]` — the 2026-09-30 section
- `[[methodology-an-index-is-a-write-path-cost-until-measured]]` — the write-side cost
- PR #1789

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
