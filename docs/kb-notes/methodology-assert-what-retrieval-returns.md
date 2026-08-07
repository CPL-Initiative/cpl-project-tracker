---
title: Assert what retrieval RETURNS, not that the answer reads better
created: 2026-08-06
updated: 2026-08-06
tags: [methodology, sierra, cpl-assistant, retrieval, testing, rag]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
  - "[[docs/kb-notes/reference-postgres-fts-pitfalls-for-credential-titles]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - tests/sierra_topic_keywords.test.js
  - chatbox/supabase_search_exhibits_by_topic_v2.sql
---

# Assert what retrieval RETURNS, not that the answer reads better

> **One-sentence summary** — a RAG fix verified by reading the model's answer
> and judging it improved is not verified at all; the same question broke twice
> in five weeks because nothing ever asserted the retrieved SET.

## Context

Sierra (the CPL assistant) answers over an exhibit corpus via Postgres
full-text search. The question *"which colleges give CPL for a CPR cert?"* has
now failed twice — 2026-07-01 and 2026-08-06 — with different root causes each
time, and the second was **introduced by the first fix**.

## The claim

**A retrieval layer needs an assertion on its output set, not on the prose
downstream of it.** Three properties make answer-reading an unreliable check:

1. **The model papers over bad retrieval.** Handed 200 irrelevant rows, a good
   model writes a fluent, hedged, plausible answer naming the two rows that did
   match. It reads like a correct answer to a slightly different question. On
   2026-08-06 Sierra confidently reported 2 CPR colleges when the corpus held 5
   — no error, no hedge that would trip a reviewer.

2. **Generation is non-deterministic, so prose assertions are flaky in both
   directions.** They fail when retrieval is fine and pass when it is not.
   Sierra's smoke mode 7 greps the answer for a nearby-college name; it can go
   red on a rephrasing and green on a genuinely broken corpus.

3. **The failure is in the SET, so that is where the assertion belongs.** "Does
   the keyword expansion for this question contain `cpr`, `aed`, `bls`, and NOT
   `cert`?" is deterministic, fast, and needs no model call.

**Corollary — assert the property, not the flag.** Testing that a suppressed
cell is `null`, or that a synonym is present in a table, checks bookkeeping.
Test what an adversary can *do*: can the hidden value be recovered? does the
query return the colleges that exist?

## How we got here

**2026-07-01 (Session 93).** `cpl_type`/`collaborative_type` were inside the
searched vector and ranking was `ORDER BY rec_count DESC`. All 16 CPR exhibits
carried `rec_count = 1`, so they ranked 285–677 and were cut by the limit. Fixed
by weighting title/discipline and ranking on `ts_rank_cd`. Verified by replaying
the query and reading the improved answer. **A synonym family was added at the
same time** so any one CPR-ish term would find the whole group — including `aed`.

**2026-08-06.** `to_tsquery('english','aed:*')` parses to `'a':*`, because
Snowball reads the trailing "-ed" as a past-tense suffix and strips it. A prefix
match on the letter "a" matched most of the corpus; OR'd with every other term
it swallowed the query. **The remedy became the next outage, and it sat
undetected for five weeks** — through a Chancellor's Office colleague asking the
question and getting a wrong answer.

The test written that day (`tests/sierra_topic_keywords.test.js`) **caught a
third, unrelated defect within a minute of existing**: the synonym table is keyed
on singulars, so `"firefighters"` expanded to 1 term where `"firefighter"`
expanded to 11. The plural is the commoner phrasing. That bug was live for as
long as the table had existed and no amount of answer-reading had surfaced it.

## Consequences

- Retrieval changes get a committed test that pins the **retrieved set or the
  query terms**, not the answer text.
- Keep prose-level smoke assertions — they catch end-to-end breakage — but treat
  a red one as *investigate*, never as the primary contract, and expect flake.
- When a fix adds a synonym, alias, or expansion, ask what that new term does to
  the query language itself. Vocabulary additions are code.

## See also

- [`reference-postgres-fts-pitfalls-for-credential-titles`](reference-postgres-fts-pitfalls-for-credential-titles.md) — the specific tokenizer traps behind both failures.
- [`methodology-commit-the-test-harness`](methodology-commit-the-test-harness.md) — the standing "a test worth running once is worth committing" practice.
