---
title: A prefix match on a stem is not a match on the word
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, retrieval, full-text-search, sierra, vocabulary]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase_search_college_programs.sql
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_program_search.test.js
---

# A prefix match on a stem is not a match on the word

> **One-sentence summary** — `to_tsquery('english', 'word:*')` stems first and
> then prefix-matches, so a term can quietly become a prefix of something much
> broader than the word you typed; when a concept needs two words, express it as
> a phrase rather than reaching for the nearest single token.

## Context

Sierra's retrieval has now been broken twice by the same operator on different
terms. This note names the shared mechanism so the next occurrence is recognized
instead of re-diagnosed. Full narratives: `docs/cpl_assistant_lessons.md`
(2026-08-06 and 2026-09-17).

## The claim

### The stem, not the word, is what gets the wildcard

`to_tsquery('english', X || ':*')` applies the Snowball stemmer to `X` and
attaches the prefix wildcard to the **result**. Two distinct failures follow, and
they look nothing alike:

- **The stem collapses and matches almost everything.** `aed` → the stemmer
  reads the trailing `-ed` as a past-tense suffix and strips it → `'a':*`, a
  prefix match on the letter *a*. OR'd against the other terms it matched most
  of the corpus and pushed the genuine CPR rows past the row cap. A question
  with five real answers returned two.
- **The stem is a legitimate prefix of unrelated words.** `practical` → `'practic':*`,
  which matches *practice*, *practices*, *practicum*, *practicing*. Searching for
  Licensed Vocational Nursing programs returned **Architectural Practice**,
  **Teaching Practices** and **Practicum in Machine Shorthand** — 30 of the 36
  title rows the term added were not nursing at all.

The first failure is loud once you look at the parsed query. The second is
invisible in the query and only visible in the results, which is why it needs a
test that asserts *cleanliness*, not just that rows came back.

### A two-word concept needs a phrase, not its nearest single token

When the thing being searched for is a noun phrase — *vocational nursing*,
*first aid*, *early childhood education* — no single token stands in for it:

| what we asked with | colleges returned | against a 56-college ideal |
|---|---:|---|
| `lvn` alone | 28 | misses everything spelled out |
| `+ vocational` | 82 | vocational education, vocational ESL |
| `+ practical` | 63 | and 30 junk rows, per above |
| `+ the two phrases` | **56** | **0 non-nursing rows** |

`phraseto_tsquery('english', 'vocational nursing')` yields `'vocat' <-> 'nurs'`.
The adjacency operator is what excludes *Architectural Practice*: the stems may
both be present in a document and still fail the phrase because they are not
adjacent.

### Two guards, because each alone passes on a broken build

- **Reach without cleanliness** misses the junk — a loose term looks like better
  coverage.
- **Cleanliness without reach** misses a phrase that matches nothing. Zero rows
  is spotlessly clean.

Assert both, behind a negative control that proves the call itself works: "did
names come back" is answered by a broken call as convincingly as by a real miss.

## How we got here

`aed` broke the CPR question on 2026-08-06 and is recorded at length in
`chatbox/supabase_search_exhibits_by_topic_v2.sql`'s header; the remedy was to
route short tokens to an unstemmed `simple` vector.

`practical` broke the LVN question on 2026-09-17 — found by *measuring a
one-line fix before shipping it*, having already proposed it. The measurement is
the whole story: the candidate looked like a straightforward win (28 → 63
colleges) and the added rows were mostly wrong. PR #1603 shipped phrase support
in `search_college_programs` plus `lvn: ["practical nursing", "vocational nursing"]`.

## When this applies (and when it doesn't)

Applies to any Postgres full-text search that appends `:*`, and to any synonym
or vocabulary table feeding one. The acronym case generalizes past Postgres —
any stemmer will mangle short tokens.

It does **not** apply to the `simple` config, which does not stem (that is
exactly why short tokens are routed there). It does not apply to trigram
similarity, which has its own failure mode: `word_similarity` cannot bridge a
vocabulary gap, so *cardiopulminary* scores 0.069 against a title reading *CPR*.
Corpus-side typos are trigram's job; query-side vocabulary is the synonym
table's.

A phrase is also not free: it requires the corpus to spell the concept the same
way. `'practic' <-> 'nurs'` does not match *Practical/Vocational Nurse* because
a word sits between the two stems — which is why the family carries both
phrasings rather than one.

## See also

- `[[docs/cpl_assistant_lessons]]` — the workstream, both incidents
- PR `#1603` — phrase support, the `lvn` family, the `become` stop word
- `chatbox/supabase_search_exhibits_by_topic_v2.sql` — the `aed` header
- `[[docs/kb-notes/methodology-a-code-cannot-say-who-a-program-is-for]]`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
