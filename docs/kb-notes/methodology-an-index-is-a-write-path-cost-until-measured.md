---
title: An index is a write-path cost until a measurement says otherwise
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, supabase, postgres, performance, pipeline-safety]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase_search_college_programs.sql
  - chatbox/sync_coci_offerings.py
---

# An index is a write-path cost until a measurement says otherwise

> **One-sentence summary** — three GIN indexes added to speed a read broke the
> nightly loader inside the hour and, measured, bought **4 ms**; an index
> justified by reasoning rather than a timing is a write-path cost with no
> established read-path benefit.

## Context

`search_college_programs` counts document frequency once per term per surface,
which reads like something an index should accelerate. Three GIN indexes went in
with the function on 2026-09-17. Story:
`docs/cpl_assistant_lessons.md` (2026-09-17).

## The claim

### The write path here is one statement under a fixed timeout

`coci_programs_replace` deletes and reinserts all **22,335 rows in a single
statement**. Index maintenance on that statement is not amortized across many
small writes — it lands inside one transaction that PostgREST will cancel at the
statement timeout. The table already carried one GIN FTS index and coped; three
more tripled the maintenance and the next sync failed with:

```
coci_offerings_replace: 16097 rows total   ✓
coci_programs_replace → HTTP 500 {"code":"57014",
  "message":"canceling statement due to statement timeout"}
```

Nothing was lost — the delete+insert rolls back atomically — and **every**
subsequent sync would have failed identically, including the one carrying the
new CIP column. A truncate-and-replace loader is therefore a place where adding
an index is a change to the *write* path first and the read path second.

### Then the measurement, which is the actual point

Five calls of a six-term query (twelve DF counts) at `result_limit 300`:

| state | ms per call |
|---|---:|
| with the three GIN indexes | 561.9 |
| without them | **565.8** |

**4 ms, inside the noise.** 22,335 rows is a sequential scan of a few
milliseconds, and a `count(*)` over a predicate matching a large share of a
table is not a shape GIN helps: the index finds candidate rows, and the query
wanted nearly all of them.

### The evidence was already in the design

The same function's **code surface** has never had an index and performs
identically to its title surface. That comparison sat inside the file being
edited. A read-path optimization that cannot point at a before-and-after timing
has not been shown to be an optimization at all.

## How we got here

The indexes shipped in migration `coci_programs_cip_and_program_search` and were
reversed the same day by `drop_coci_programs_search_indexes_loader_timeout`
(PR #1602), after `coci-offerings-sync` run 11 failed on `main`. The timing above
was taken on the live table, before and after the drop.

## When this applies (and when it doesn't)

Applies wherever a table is rewritten wholesale by a loader — this repo's
`*_replace` RPCs, and any truncate-and-replace pipeline behind a statement
timeout. It applies most sharply to GIN, whose build and maintenance costs are
far above B-tree's.

It does **not** say indexes are suspect in general. A selective predicate over a
large table, a foreign-key join, an `order by … limit` on a hot path — those
earn their keep, and the measurement will show it. The rule is the measurement,
not a preference against indexes.

It also does not apply to a corpus large enough that a seq scan is genuinely
expensive. 22,335 rows is small; at 22 million the arithmetic inverts. **Take
the timing at the size you actually have.**

## See also

- `[[docs/cpl_assistant_lessons]]` — the workstream
- PR `#1602` — the revert and its measurement
- `chatbox/supabase_search_college_programs.sql` — the header records why the
  file creates no indexes

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
