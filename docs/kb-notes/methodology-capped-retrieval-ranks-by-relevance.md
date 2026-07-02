---
title: A capped retrieval must rank by relevance — popularity is only a tiebreaker
created: 2026-07-02
updated: 2026-07-02
tags: [methodology, retrieval, rag, sierra, postgres, fts]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/sierra_training_tab_scope]]"
artifacts:
  - chatbox/supabase_search_exhibits_by_topic.sql
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_training.test.js
---

# A capped retrieval must rank by relevance — popularity is only a tiebreaker

> **One-sentence summary** — whenever a candidate search combines a broad
> match condition with a `LIMIT n`, the ORDER BY must be query relevance
> (`ts_rank`-family), never a popularity/size column, or the long tail of the
> catalog becomes systematically unfindable.

## Context

The CPR miss (2026-07-01): Sierra held 16 CPR/First-Aid exhibits in
`chatbox_exhibits` but surfaced only one, then hedged. Root cause was the
`search_exhibits_by_topic` RPC: `WHERE tsvector @@ query ORDER BY rec_count
DESC LIMIT 200`. Full story: `docs/cpl_assistant_lessons.md` (Session 93).

## The claim

Three rules, one design:

1. **Rank by relevance.** With OR-expanded query keywords, a broad query
   matches far more rows than the cap (Sam's pointed CPR question matched 729
   of 2,397). Under a popularity sort, whether a row can EVER be returned is
   decided by its popularity, not by how well it matches — and long tails are
   fat: **76% of the exhibit catalog carried `rec_count = 1`**, so
   three-quarters of the catalog was invisible whenever matches exceeded the
   cap. Popularity/size belongs in the tiebreaker position only:
   `ORDER BY ts_rank_cd(weighted_vector, query) DESC, rec_count DESC`.

2. **Never put enum/category columns in the searched text.** The old
   tsvector concatenated `exhibit_title + cpl_type + collaborative_type`.
   A generic query word then matches an entire CATEGORY: "certs" →
   `'cert':*` → every "Industry Certification" row; "exam" → every
   "Credit By Exam" row. Search names and free text; return categories as
   columns. Weight the fields (`setweight(title,'A') || setweight(discipline,'B')`)
   so a title hit outranks a metadata hit.

3. **Stop the meta-words before they reach the query.** Conversation words
   ("check", "again", "already", "exist", "map") both match lexically
   ("Truck-**Check**") and — worse — defeat refinement detection: "Do any of
   these already exist in MAP?" read as a NEW topic ("already exist map")
   instead of folding the conversation's real subject into retrieval.

## How we got here

Replayed the logged `chat_interactions` turns against the live RPC: the CPR
rows ranked at positions 285–677 under the popularity sort (cutoff = 200);
after the relevance re-rank they returned at positions 2–8, with the
regression probes (real estate / NCCER / firefighter) unchanged. The
`search_college_offerings` RPC (Session 89) was built rank-first and never had
this bug — this note exists because the older RPC was never retrofitted and
nothing forced the comparison.

## Where it applies

Any bounded candidate search in this project or its successors: exhibit/topic
search, offerings search, future Student-Portal lookups, and any PostgREST RPC
a chat surface calls. Checklist when adding one: (a) `ts_rank`-family in the
ORDER BY, (b) categories out of the searched vector, (c) a regression probe in
the smoke/test suite using a real failing query, (d) measure the match-set
size for a realistic noisy query before choosing the LIMIT.
