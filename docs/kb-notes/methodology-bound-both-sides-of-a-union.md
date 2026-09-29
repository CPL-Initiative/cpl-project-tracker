---
title: A limit that bounds one side of a union lets the other side drown it
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, retrieval, sierra, alignment, context-budget]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/local_course_alignment_lessons]]"
artifacts:
  - credential_alignment_for_college (Supabase RPC)
---

# A limit that bounds one side of a union lets the other side drown it

> **One-sentence summary** — `per_rec` looked like it capped the result set; it
> capped only the candidates, and 3,807 unbounded peer rows buried the 9 rows
> the answer was actually about.

## Context

`credential_alignment_for_college(credential, college, per_rec)` returns two
kinds of row in one union: **candidates** (the college's own courses, a
proposal) and **peers** (colleges that already articulated, a fact). The
consumer renders every row it receives.

A parameter named `per_rec` reads unambiguously as "how many rows per
recommendation". It was applied to exactly one branch of the union.

## The claim

**When a function returns a union of two row kinds, a cap named for the
function's grain must be applied to every branch — and if it deliberately is
not, the name must say which branch it bounds.**

The failure is silent in the worst way: the call succeeds, the data is correct,
and the caller has no signal that one class of row has been diluted into
uselessness. Nothing errors. Nothing is missing. The answer is simply wrong in
emphasis, which for an LLM consumer means wrong in substance — the model
summarized the 3,807 peer rows it could see and reported "no close title match"
for five recommendations whose candidate rows were sitting in the same payload.

## Two rules that follow

**1. Bound every branch, or name the parameter for what it bounds.**
`per_rec` now bounds candidates *and* peers, with separate limits, because the
two serve different purposes: three candidates is a shortlist, three peers is
too few to show a pattern.

**2. A capped list must ship its own total.** The function returns
`peer_total` alongside the capped rows, and the renderer emits *"showing 9 of
261 … say 'among others' and never present this as the full list"*. A cap the
consumer cannot see is a cap that will eventually be reported as a census.

That second rule is the one this repository keeps relearning:

| Cap | Where | How it failed |
|---|---|---|
| `TITLES_TEXT_CAP = 900` | `chatbox/build_coci_offerings.py` | 801 rows sat exactly at the cap; search was blind past it |
| `SAMPLE_PER_TOP = 8` | same | 5,077 rows had more courses than were shown |
| `maxlength="500"` | `sierra_training.js` | silently ate three of Sam's instructions mid-sentence |
| newest-10 window | Sierra guidance | an 11th rule pushes the oldest out, unannounced |
| *(this note)* | alignment RPC | 3,807 peers buried 9 candidates |

Every one is the same shape: a defensible engineering limit, invisible at the
point of consumption.

## How we got here

Sam tested POST Basic Academy × Cerritos on live v42 and got "⬜ Check catalog"
for five recommendations. The RPC was returning all six C-ID matches correctly.
Counting rows by kind exposed it immediately:

```sql
select row_kind, count(*) from credential_alignment_for_college(
  'POST Basic Academy','Cerritos College', 3) group by 1;
-- peer 3807 | candidate 9
```

Reading the SQL confirmed it: `select * from peers union all select … from
picked where p.rn <= per_rec`. The `rn <= per_rec` predicate applies only to
`picked`.

After bounding both sides and resolving the grouping key: **94 rows, 10 groups,
6 of 6 C-ID matches rendered.**

## Consequences

- When reviewing any function returning heterogeneous rows, count by kind
  before trusting it. A ratio like 3807:9 is visible in one query and invisible
  in the rendered output.
- Prefer returning a total beside a truncated list over returning a longer
  list. The consumer can phrase around a known total; it cannot phrase around
  an unknown one.

## See also

- [[docs/kb-notes/methodology-a-grouping-key-must-come-from-the-authoritative-set]]
- [[docs/local_course_alignment_lessons]]
