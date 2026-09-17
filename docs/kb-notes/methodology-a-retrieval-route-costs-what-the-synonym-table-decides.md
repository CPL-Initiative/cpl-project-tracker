---
title: A retrieval route costs what the synonym table decides, and the batch waits for the slowest route
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, sierra, retrieval, performance, smoke-test, supabase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-an-index-is-a-write-path-cost-until-measured]]"
  - "[[methodology-a-monitor-that-is-not-a-browser-cannot-see-a-browser-failure]]"
artifacts:
  - chatbox/supabase_search_college_programs.sql
  - chatbox/verify_search_college_programs.sql
  - chatbox/smoke_test.sh
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# A retrieval route costs what the synonym table decides, and the batch waits for the slowest route

> **One-sentence summary** — A route whose cost scales with the term count is priced by the synonym expansion rather than by the student's question, every route in one `Promise.all` delays the answer by the slowest of them, and a route that fails safe on timeout drops its section without any pass/fail grid noticing; so measure at the term counts real questions produce, and assert latency beside reach.

## Context

Sierra's program-catalog route (`search_college_programs`, #1601, #1603)
passed its verification, its jsdom tests, smoke mode 7p and the first run of
the preview A/B. The preview's own function logs showed it timing out on three
of thirty-eight questions, and `pg_stat_statements` showed a mean of 4.3 s per
call. Story: `docs/cpl_assistant_lessons.md` (2026-09-17, S273).

## The claim

**1. The term count belongs to the synonym table.** `extractTopicKeywords` and
`expandWithSynonyms` turn "How do I become an LVN?" into 3 terms, an EMT
question into 6, a firefighter question into 12 and a Boys & Girls Club
question into 30. A route that does work per term is priced by that table.
Measure it at 3, 6, 12 and 30 terms, not at the one term the design was
drafted with.

**2. Per-term scans are a slope, and the slope is what kills you.** Two
`count(*)` statements per term, each recomputing two tsvectors over 22,335
rows, cost ~320 ms a count: 4.3 s for 6 terms, 19.8 s for 30. Computing the
four vectors once per call and counting every term in one pass over them cost
1.1 s and 2.5 s for the same inputs. The floor stayed; the slope went from ~650
ms per term to ~60.

**3. The batch waits for the slowest route.** The edge function awaits every
retrieval in one `Promise.all`. A 4 s route delays a 1 s answer by 3 s on every
question that carries keywords, whether or not the route's section ends up
mattering.

**4. A fail-safe route fails silently.** On a statement timeout the route logs
and returns null; the answer renders without the section and reads fluent and
complete. A pass/fail grid over prose, a health probe, and a human reading the
answer all see nothing wrong. Only the function logs and `pg_stat_statements`
carry the failure.

**5. So assert latency beside reach and cleanliness.** Smoke 7p asserts the LVN
question reaches 40+ colleges, returns zero non-nursing rows, AND answers in
under 4 s on the anon key (whose statement timeout is 3 s). Verification Part D
pins a 30-term call under 6 s. Either reach or cleanliness alone passed on the
broken build; so did both together.

**6. Prove a rewrite in `pg_temp`.** A function created as `pg_temp.<name>` is
session-local, vanishes with the connection, and touches no shared schema. Run
it beside the live function on the real term sets, `EXCEPT` the result sets
both ways, and compare order by row number. Nine sets, zero differences, is the
evidence that the rewrite changed the cost and nothing else.

## How we got here

The first `cpl-chat-preview-ab.yml` run (35275472821, 2026-09-17) reported no
regressions. `select … from logs where source = 'function_logs'` for the
preview window showed `search_college_programs unavailable: canceling
statement due to statement timeout` three times. The effective timeout through
PostgREST is 8 s (the `authenticator` role's); the anon key's is 3 s. The
rewrite and its measurements are in the header of
`chatbox/supabase_search_college_programs.sql`.

## When this applies (and when it doesn't)

It applies to any route whose per-call work is proportional to the expanded
term list — the exhibit and offerings routes have the same loop shape and
should be measured the same way. It does not say "add an index": on this table
three GIN indexes broke the nightly loader for a measured 4 ms
(`methodology-an-index-is-a-write-path-cost-until-measured`). Stored generated
tsvector columns would cut the ~700 ms floor and are a loader-side cost to
measure before shipping, not a reflex.

## See also

- `docs/cpl_assistant_lessons.md` — 2026-09-17 (S273)
- `chatbox/verify_search_college_programs.sql` — Part D
- `tests/sierra_program_search.test.js` — blocks 7–10
