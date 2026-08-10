---
title: A grain-invariant measure can still be the wrong one
created: 2026-08-10
updated: 2026-08-10
tags: [methodology, metrics, data-quality, aggregates, disclosure, student-detail]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-emit-the-threshold-with-the-label-it-prints]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/student_detail_load_lessons]]"
artifacts:
  - kb/supabase_map_college_goal2.sql
  - college_goal2.js
---

# A grain-invariant measure can still be the wrong one

**Stability is a property, not a virtue.** When a published number moves because
the underlying data changed *shape*, the instinct is to re-base it on something
that cannot move. That instinct is right about the diagnosis and frequently
wrong about the cure: the most stable measure available is often stable because
it has stopped discriminating.

## The worked instance (2026-08-10)

`map_student_credit` was re-loaded from the raw MAP extract, going from 220,588
rows to 537,908 — the same universe at finer grain (collapsing the new table to
the old five columns reproduces 220,588 exactly).

Sprint goal 2 asks whether a college awards prior-learning credit to a **real
course** or dumps it into a **GE area / generic elective**. Its published share
was computed on `count(*)`. Finer grain therefore moved it: **43 of 96 colleges
shifted, average 2.6 points, max 43.3.**

The alternative was obvious and I recommended it. The same share on
`count(distinct student_key)` is **provably grain-invariant — 96 of 96 colleges
unchanged, zero movement.** The set identity that guaranteed this was already
measured: `(college_id, student_key, course_type)` was identical across the two
loads, 81,007 triples, 0 differences either direction.

**Then the domain expert asked to see the affected colleges before deciding, and
the data killed the recommendation:**

| | Student-based | Row-based |
|---|---:|---:|
| Colleges reading **exactly 100.0%** | **34 of 96** | 19 |
| Reading ≥ 95% | 35 | — |

A third of the sector saturates, because nearly every student has *at least one*
course-credit award. The measure is perfectly stable and answers nothing. A
college reading "100%" learns nothing about whether it is dumping credit into GE
areas — which is the only question the metric exists to ask.

## Why the two differ

They answer different questions, and only one of them is the question asked:

| Basis | Answers |
|---|---|
| Rows | *What fraction of awards go to courses?* |
| Distinct students | *What fraction of students got at least one course award?* |

An "at least one" measure saturates whenever the underlying event is common. The
denominator collapses toward the numerator and the metric flattens.

## The check to run before preferring stability

1. **Name the question the metric answers.** Then check the candidate still
   answers *that* one, not a neighbouring one that happens to be steadier.
2. **Measure the distribution, not just the variance.** Count how many entities
   pin to a boundary value (0% or 100%). A third at the ceiling is a dead metric
   regardless of how well it holds still.
3. **Ask whether the movement was error or correction.** Here it was correction:
   the old export collapsed rows sharing (student, college, exhibit,
   course_type, catalog_year), so an exhibit recommending credit for *several
   specific courses* became one row while a *single area* award did not —
   systematically under-counting course awards. **38 of the 43 moved up**,
   exactly as that bias predicts. A number that moves toward the truth is not
   drift.
4. **Check what is actually visible.** The alarming 43.3-point mover was a
   4-student college whose cell is **suppressed below k=10 and never displayed**.
   10 of 96 colleges are suppressed anyway. Headline volatility measured on
   invisible cells is not volatility anyone experiences.

## The general shape

> A measure that cannot move is not thereby a good measure. Invariance under a
> change you happen to be worried about says nothing about sensitivity to the
> thing you are trying to detect.

The same trap appears wherever a ratio is re-based for stability: per-capita
instead of per-event, distinct instead of total, "any" instead of "how much".
Each is more stable, and each answers a different question than the one asked.

## Postscript — the process point

The recommendation was retracted because the person with the domain knowledge
declined to take it on trust and asked for the underlying rows. Presenting the
supporting evidence *with* a recommendation is what made the retraction possible
before it shipped, rather than after a college noticed its number had changed.
