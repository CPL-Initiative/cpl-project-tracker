---
title: When an authoritative identity key exists, use it before you score strings
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, matching, c-id, retrieval, ranking, identity, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-two-signals-for-a-judgment-proposal]]"
  - "[[docs/kb-notes/methodology-a-false-positive-costs-more-than-a-miss]]"
  - "[[docs/local_course_alignment_lessons]]"
artifacts:
  - kb/supabase_alignment_routes.sql
---

# When an authoritative identity key exists, use it before you score strings

> **One-sentence summary** — a similarity score is what you reach for when nothing
> establishes identity; if the domain already has an identity standard sitting in a
> column, matching on it is not a better score, it is a different and stronger
> *kind* of claim, and it belongs on its own rung above the scorer.

## Context

The alignment route ranks a college's own courses against a credit
recommendation. It was built as a similarity problem — trigram plus token
overlap on course titles — and tuned carefully, with a stopword list and a
content-token gate.

It was still wrong, because California community colleges already have a
statewide course-identity standard: **C-ID**. A recommendation names C-ID
`AJ 120`; if the college teaches a course carrying `AJ 120`, the equivalence is
**already established by the system**. Nobody needs to infer it from a title.

`chatbox_college_courses` carried a `cid` column the whole time. The scorer never
read it — `grep -c "c.cid"` on the function returned **0**.

The visible symptom: asked to match POST recommendations to Cerritos courses,
Sierra answered *"I don't have Cerritos's full Administration of Justice catalog
… look for an AJ 101 or equivalent."* `AJ 101` was in the table, carrying C-ID
`AJ 110`, the exact C-ID of that recommendation. She sent faculty hunting for
something the data already knew. Six of POST's eight distinct C-IDs matched a
Cerritos course exactly.

## Why this is not just "add another feature to the score"

The tempting fix is a C-ID bonus in the scoring formula. That is wrong, for the
same reason `methodology-two-signals-for-a-judgment-proposal` keeps peer
precedent out of the similarity ranking: **these are different kinds of claim.**

| Rung | Claim | Basis |
|---|---|---|
| 1. identity key | "the equivalence is established" | an external standard |
| 2. exact name | "the names are the same" | lexical, strong |
| 3. best available | "this is the closest thing you have" | judgment |

Blending them into one number lets a rung-3 guess outrank a rung-1 fact when the
guess happens to score well, and — worse — presents them to the reader as
commensurable. They are not. A C-ID match needs no lexical support at all; that
is the entire point of an identity standard.

So: **a fallback ladder, and only the best available rung renders.**

## The side benefit that was not the goal

Returning only the best rung turned out to be the most effective noise filter in
the system. Before, "Concepts of Criminal Law" returned the correct `AJ 102`
(1.000) *and* `ADN 210 Foundational Concepts of Nursing`; "Community and the
Justice System" returned `MUS 202E Community Symphonic Band`. With a rung-1 or
rung-2 hit present, rung 3 never renders, so those disappear without any
threshold tuning at all.

Tuning a scorer is how you chase false positives forever. Establishing identity
first is how you stop needing to.

## Guards this still needs

- **An identity match whose names diverge is FLAGGED, not suppressed.** POST
  carries C-ID `AJ 110` on two different recommendation lines — an anomaly the
  curator explicitly ruled must never be auto-resolved — so rung 1 pairs an
  Administration-of-Justice course with the *Physical Training* recommendation.
  Suppressing it resolves the anomaly on the curator's behalf; dropping the rung
  discards the strongest signal. Ship it with a divergence flag and let the
  expert judge. **The divergence is the finding.**
- **Coverage is partial, and that is fine.** Only 16,067 of 141,696 courses carry
  a C-ID (112 colleges). The ladder degrades to title, then to judgment — it does
  not require the key to exist.
- **Say which rung a row came from.** A reader who cannot tell an established
  equivalence from a lexical guess will treat both as the same claim, which
  wastes the distinction the ladder exists to create.

## Smell test

Before building a matcher, ask: *does this domain already have an identifier that
means "these are the same thing"?* C-ID, ISBN, NPI, SOC, CIP, a UUID someone
already assigned. If one exists and is populated at all, it belongs above your
scorer — not inside it.
