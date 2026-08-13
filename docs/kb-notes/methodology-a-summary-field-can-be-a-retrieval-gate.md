---
title: A derived summary field used as a filter is a membership test in disguise
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, retrieval, data-modelling, sierra, silent-failure, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-summary-field-is-not-the-record]]"
  - "[[docs/sierra_credit_recs_lessons]]"
artifacts:
  - kb/supabase_credential_recs_routes.sql
  - excel_to_dashboard.py (ccc_rec derivation, ~line 7000)
---

# A derived summary field used as a filter is a membership test in disguise

> **One-sentence summary** — `WHERE summary_field IS NOT NULL` silently filters on
> whatever the summary was *derived from*, so the rows most in need of surfacing
> are the ones it removes.

## Context

The companion note `methodology-a-summary-field-is-not-the-record` covers the
value problem: a single modal string stands in for a ten-line record, so the
answer is impoverished. This note is about the **sharper** failure found the next
day — the same field used in a `WHERE` clause.

`chatbox_credentials.ccc_rec` is built by `excel_to_dashboard.py` as
`ccc_recs.most_common(1)` over a credential's **articulation rows**. Sierra's
statewide route carried:

```sql
where c.statewide and c.ccc_rec is not null
```

That reads as a null-guard. It is not. Trace the derivation:

```
no college has adopted it
  → no articulation rows
    → no credit-rec strings to take a mode of
      → ccc_rec IS NULL
        → excluded from retrieval
```

So the clause silently means **"has any college already adopted this?"**

## What it cost

Measured live 2026-08-13:

| | |
|---|---|
| Statewide credentials with zero adopters | 38 |
| …with `ccc_rec` NULL | **38 of 38** |
| …that DID have published recommendations elsewhere | 36, carrying 75 rec lines |
| `search_statewide_recommendations('carpenters apprenticeship')` | **0 rows** |

An entire class of records — the ones deliberately created *ahead of demand*, and
therefore the hardest to find any other way — was unreachable. Not ranked low.
Absent.

A second, independent code path had the same blind spot for the same underlying
reason: the adoption route filtered on `potential_colleges`, derived from
`adoption_leverage`, derived from articulations. Two routes, neither aware of the
other, both keyed off "has this been adopted" without saying so.

## The rule

**Before filtering on a derived field, write down what it is derived FROM, and
read the clause aloud with that substituted in.** `WHERE ccc_rec IS NOT NULL`
becomes *"where at least one college has already adopted this"* — a sentence
nobody would have written on purpose in a route whose job is surfacing adoption
opportunities.

Then:

- **Filter on the thing you mean.** Here: `ccc_rec IS NOT NULL OR EXISTS (a
  published recommendation set)`. The gate now tests *"do we have something to
  say?"*, which is the actual requirement.
- **A filter's failure is invisible.** A wrong value looks wrong under review; a
  wrongly-excluded row produces a clean, confident, empty result. Zero rows reads
  as a fact about the world.
- **Test the gate with a row you know should pass and doesn't.** The whole finding
  came from one probe returning `[]` for a credential visibly holding 8 published
  recommendation lines.

## Smell test

A `WHERE` clause is suspect when the column it tests is:

- computed by aggregation (`most_common`, `max`, a mode, a first-non-null),
- populated by a **different** subsystem than the one doing the filtering, or
- nullable for a reason nobody wrote down.

All three were true here.
