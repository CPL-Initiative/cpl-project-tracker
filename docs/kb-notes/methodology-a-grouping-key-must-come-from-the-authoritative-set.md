---
title: A grouping key must come from the authoritative set, not from the rows being grouped
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, retrieval, identity, curation, sierra, alignment]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/local_course_alignment_lessons]]"
  - "[[docs/kb-notes/methodology-two-signals-for-a-judgment-proposal]]"
artifacts:
  - credential_alignment_for_college (Supabase RPC)
  - chatbox/supabase/functions/cpl-chat/index.ts (buildAlignmentContext)
---

# A grouping key must come from the authoritative set, not from the rows being grouped

> **One-sentence summary** — When a consumer groups rows by a free-text field
> that each row supplies for itself, every spelling variant becomes its own
> group, and the extra groups are indistinguishable from real ones that happen
> to be empty.

## Context

Sierra's alignment route answers "which of my courses should I articulate
against this credit recommendation, and how did other colleges do it?" It
returns two row kinds — the college's own candidate courses, and peer
articulations — and the consumer groups both by `credit_rec` to produce one
block per recommendation.

For POST Basic Academy at Cerritos College, that produced **43 recommendation
groups where POST's statewide set is TEN**, and Sierra reported "no close title
match found — check catalog" for five recommendations whose courses Cerritos
already teaches. Full story: `docs/local_course_alignment_lessons.md`.

## The claim

**If a set of rows is grouped by a text field, that field must be resolved
against the authority before grouping — or the grouping must be keyed on
something the authority owns.**

The RPC did gate the *recommendation* set correctly: where a statewide
authoritative set exists, it uses those ten lines and ignores peer wordings.
But the *peer* rows were selected on the peers' own `credit_rec` text, with no
equivalent gate. So peers arrived under 43 spellings — `3 hours in Criminal
Law`, `3 hours in Concepts of Criminal Law`, `3.0 hours in Concepts of Criminal
Law` — and the consumer, grouping by that string, manufactured **~34 phantom
recommendation groups**, each carrying zero candidates.

The damage is not cosmetic, and this is the part worth internalising:

- **A phantom group is indistinguishable from a real empty one.** Each rendered
  the honest sentence *"No course has a similar title"* — against a
  recommendation that does not exist. The consumer had no way to tell the
  difference, and neither did the model reading it.
- **It inverts the meaning of the answer.** A reader counting "6 of 10 have no
  match" concludes the college is unprepared, when in fact 6 of 6 real
  recommendations matched.
- **It dilutes the real group.** The candidate for *Criminal Law* sat in one
  block while two near-identical blocks beside it said "nothing matched".

## Two independent smells that should trigger this check

1. **One side of a union is gated and the other is not.** If you find yourself
   writing "when a statewide set exists, use it" for one CTE, ask immediately
   what the *other* CTEs key on.
2. **A `count(distinct <group key>)` that exceeds the authority's own count.**
   Here: 43 vs 10. This is a one-line assertion and it would have caught the bug
   the day the RPC was written.

## How we got here

Sam tested POST × Cerritos on the live v42 and reported that Sierra listed one
credit recommendation where the statewide set is ten. Reading the RPC showed
`recs_raw` correctly excluding peer wordings via `not has_statewide`, and the
`peers` CTE with no such condition.

Measured before and after gating peers to the resolved set:

| | before | after |
|---|---|---|
| recommendation groups | 43 | **10** |
| peer rows | 3,807 | 1,092 (then capped to 85) |
| C-ID matches rendered | 1 of 6 | **6 of 6** |

**The cost of gating was one peer college of 31.** That asymmetry is typical:
the variant spellings are mostly restatements of rows you already hold under
the canonical wording, so resolving them loses far less than leaving them
unresolved costs.

## Consequences

- Where an authority exists (a statewide set, a canonical vocabulary), resolve
  every side of the query against it — not just the side that looks like the
  "main" one.
- Where no authority exists yet, the grouping is a **curation** problem, not a
  string-cleaning one. Mechanical normalisation of the 2,344 distinct
  `credit_rec` strings in this corpus collapses only ~7%.
- Sam's ruling on the successor design (2026-08-13): a Common CR Reference must
  match on **many** factors — title, course name and number, course
  description, subject — with C-ID as one corroborator among them, not the key.
  Only 402 of 2,344 rec strings carry a C-ID at all.

## See also

- [[docs/kb-notes/methodology-two-signals-for-a-judgment-proposal]]
- [[docs/kb-notes/methodology-use-the-identity-key-before-you-score-strings]]
- [[docs/local_course_alignment_lessons]]
