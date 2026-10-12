---
title: Same context size, different answer, means the model varied
created: 2026-10-12
updated: 2026-10-12
tags: [methodology, sierra, smoke, retrieval]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - chatbox/smoke_test.sh
---

# Same context size, different answer, means the model varied

> **One-sentence summary**: before blaming retrieval for a bad Sierra answer, compare the turn's recorded context size and uncached input with a good turn on the same question; when both match, the context was the same and the model varied.

## Why it matters

A smoke failure on answer content has two causes that look identical in the answer: retrieval handed the model
something different (a timeout, a cut route, a probe that missed), or the model read the same context differently.
They need opposite fixes. Retrieval wants code; model variance wants a clearer instruction or an accepted rate.

## How

`chat_interactions.timings` records, per turn, `context_chars`, `prompt_chars`, `input_uncached` and every read with
its `ok` flag. Query the failing turn and the passing turns on the same question:

```sql
select created_at, timings->>'context_chars', timings->>'input_uncached'
from chat_interactions where question ilike '<the question>%' order by created_at;
```

Equal numbers across a pass and a fail mean the same context. Then count how often the answer is right over the day
(`response ilike '%<the fact>%'`) for the rate.

## Worked case (S371, 2026-10-12)

Smoke 7c failed its precedent check: Sierra said no CNA-to-LVN precedent existed. The failing and passing turns both
carried 70,554 context characters and 26,369 uncached input tokens, and 13 of 15 turns that day cited Chaffey's
NURVN 414. The probes and the held-title cap were traced and reached the precedent. The miss was the model.

## Caveat

A failed read can also produce a confident absence: `fetchCredentialRecs` returns an empty map on an RPC error, which
the precedent block renders as "none". The reads list in `timings` stops at 40 entries, so a late read may not appear;
the function logs (`route time limit: ... cut`) and the Postgres timeout log cover what the list misses.
