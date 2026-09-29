---
title: A concatenated haystack penalises your best-curated record
created: 2026-08-10
updated: 2026-08-10
tags: [methodology, sierra, retrieval, search, trigram, curation, ranking]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/reference-postgres-fts-pitfalls-for-credential-titles]]"
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/sierra_credential_naming_lessons]]"
artifacts:
  - kb/supabase_chatbox_credentials.sql
  - kb/_sync_credential_catalog.py
---

# A concatenated haystack penalises your best-curated record

## The finding

When you build a search field by concatenating every alias a record has, and
then rank with a **length-normalized** similarity function, **the records with
the most aliases score worst**. The better curated the record, the harder it is
to find. This is exactly backwards, and nothing about the code looks wrong.

Measured, 2026-08-10, ranking 1,987 CPL credentials by `pg_trgm.similarity()`
over a `search_text` column built as *title + all variants + issuer*:

| Ask | Returned | Should have returned |
|---|---|---|
| `peace officer` | Correctional Officer Core Course (2 variants) | **POST Basic Academy** (16 variants) |

`POST Basic Academy` folds sixteen freehand college titles — including
`Peace Officer Standards and Training - Basic Academy Certificate`, a near-exact
match for the query. It lost to a record whose alias list was short enough not to
dilute the score.

## Why it happens

Trigram similarity is `shared_trigrams / total_distinct_trigrams`. Concatenating
aliases inflates the denominator without bounding the numerator: a query can only
ever match *one* alias, but it is scored against *all of them at once*. Every
alias you add makes every other alias harder to match.

The perverse incentive is the real damage. Curation effort — the thing you most
want to reward — becomes a ranking penalty, so the records a team has invested in
most are the ones the search fails on.

## The fix

**Score the best single name; keep the concatenation only for candidate
generation.**

```sql
-- candidate generation: the concatenated field, with a cheap index
where c.search_text like '%' || needle || '%'

-- ranking: the best-matching INDIVIDUAL name
order by (select max(similarity(lower(v), needle))
            from unnest(c.raw_variants || c.unified_title) v) desc
```

`max()` over `unnest()` costs almost nothing at this scale and restores the
intended semantics: a record matches as well as its *best* alias matches, not as
well as its aliases match *on average*.

## Generalizes to

Any alias/synonym/variant list scored by a normalized metric — product names,
person names, place names, org names, tag sets. The same shape appears with
cosine similarity over a single concatenated embedding: one vector for a record
with twenty aliases is a blurrier vector, and the record retrieves worse than a
sparse one. Embed per alias and take the max.

Two smells that mean you have it:

- A record you *know* is well described ranks below a thin one.
- Adding data to a record makes it harder to find.

## How it was caught

Not by review — the query reads correctly, and the bug is in the interaction
between the schema shape and the scoring function. It was caught by probing the
route with real phrasings a person would type and noticing one answer was wrong.

A companion near-miss the same day is worth recording: the `emt` ordering also
looked wrong, and the cause turned out to be `string_agg(... order by tier)` in
the **test query**, not the function — the function had ordered it correctly all
along. Probe the thing, then verify the probe before fixing what it accuses.
See `methodology-the-plausible-cause-is-not-the-measured-one`.
