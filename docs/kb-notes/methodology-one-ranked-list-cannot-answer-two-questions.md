---
title: Methodology — one ranked list cannot answer two questions
created: 2026-08-27
updated: 2026-08-27
tags: [methodology, ranking, matching, ui, curation, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[college_cr_evidence_lessons]]"
artifacts:
  - kb/_match_courses_to_ace_recs.py
---

# Methodology — one ranked list cannot answer two questions

> **One-sentence summary** — when a score blends "how well does this match?" with "how much
> evidence backs it?", the widely-evidenced answers win everywhere, and the rows that most
> need help are exactly the rows whose best option falls off the list.

## The measurement

Matching LATTC's 139 courses to ACE credit recommendations, confidence was
`0.55 × word fit + 0.25 × peer precedent + 0.20 × how widely held`. The top six by
confidence were shown.

Because the widely-held recommendations in this corpus are the **3-hour** ones, a 1- or
2-unit course's best-fitting option sank below the cut:

- On one 2-unit carpentry course, **22 exact-hour matches** existed and **none** were shown.
- Across the list, the *only* unit-matched option was hidden on **12 courses — 5 of them at
  ≤2 units**, i.e. precisely the small courses that are hardest to articulate.

Adding unit-fit as a fourth weighted term did **not** fix it: breadth still outweighed the
penalty, and the 1-unit welding lab kept `3 hours in welding` at the top. **Reweighting
cannot rescue a list that is answering the wrong question.**

## The rule

**When a ranked list serves two questions, emit two groups, not one blend.**

The fix was not a better formula. It was a second, explicitly-labeled section on every card:
the top five by confidence, **plus** up to five whose hours *equal* the course's units,
marked `fits your units`. Courses showing an exact-hour option went **107 → 119 of 127**;
at ≤2 units, **19 → 24 of 28**.

This is the same shape as the repo's existing ladder doctrine — *only the best available rung
renders; a fallback, never a blend* — applied to selection rather than to precedence.

## The tell

**A truncated list is a silent filter, and truncation interacts with your weighting.** The
candidates existed the whole time: the median course had **40** candidates and the maximum
**587**, while six were shown. Nothing in the artifact said "there are 34 more" — so a
reviewer could not distinguish *no good option exists* from *the good option ranked 20th*.

Ask of any top-N list:

1. What is the **N+1**th row, and why is it not visible?
2. Does the score contain a term that is **constant within the corpus** but **correlated with
   a property the reader is filtering on**? (Here: breadth correlates with 3-hour recs;
   readers filter on units.)
3. If a reader has a hard requirement the score only *softly* penalizes, will the list ever
   satisfy it? If not, the requirement needs its own group — or its own cut.

## Coda: a cut can beat a curve

The eventual ruling from the curator was blunter than any weighting: **more than one unit
apart, do not list it at all; exactly one apart, keep it at a lower score.** A hard cut set
by the person who has to defend the result beat a continuous score tuned by the person who
built it — and it also fixed the *large* courses, moving a 6-unit welding class from
`3 hours in welding` to `6 hours in welding`, which no reweighting had achieved.
