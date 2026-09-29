---
title: Transitive closure is right for decisions and wrong for similarity
created: 2026-08-24
updated: 2026-08-24
tags: [methodology, curation, data-modeling, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[common_cr_reference_lessons]]"
  - "[[ccr_atlas_lessons]]"
artifacts:
  - excel_to_dashboard.py
  - tests/merge_chain_flatten_test.py
---

# Transitive closure is right for decisions and wrong for similarity

> **One-sentence summary** — This repo carries a standing rule that grouping is
> by key and **never** transitive, and it also carries a bug that existed
> because merges were **not** resolved transitively; the two are not in
> conflict, and the thing that separates them is whether a human decided the
> edge.

## Context

The Common CR Reference established: *"Grouping is by KEY, NEVER transitive — 164
strings bridge ≥2 course identities, so components would chain `AJ 110` ↔
*Community Relations* ↔ `AJ 160`."* That rule is correct and hard-won.

Session 187 then found the opposite defect in the unified-courses generator: the
curation overlay stores merges as **one hop per row**, and the display read those
hops as if they were groups. A curator merged X into Y, someone later merged Y
into a comprehensive, and Y rendered as its own row **while also being folded
away** — 340 identities across ~40 disciplines. Fixing it required resolving
merges transitively, which reads like a direct violation of the CCR rule.

## The distinction

**The question is not "is this relation transitive?" It is "who asserted the
edge, and what did they assert?"**

| | Similarity edge | Decision edge |
|---|---|---|
| Created by | a matcher, on evidence | a person, on judgment |
| Asserts | *these two resemble each other* | *these two are the same thing* |
| Under closure | resemblance chains through a hub and drags in unrelated members | sameness composes, because sameness is what was claimed |
| Correct handling | group by key; never close | resolve to the root |

`AJ 110` resembling *Community Relations* is a **measurement**. Resemblance is
not transitive in the world, so closing over it manufactures a claim nobody made.

`X merge_into Y` is a **decision**: a curator said X and Y are one course. If a
second curator then says Y and Z are one course, X and Z are one course *by the
plain meaning of what both people asserted*. Refusing to close there does not
preserve their intent — it silently discards half of it, which is what leaving X's
members attributed to a row that no longer exists actually did.

## How to tell them apart in code

Look at the field's provenance, not its shape. Both are `(a, b)` pairs.

- A `suggestion`, `candidate`, `score`, `similarity` or `evidence` lane is a
  measurement. **Never close.** Present components only as a worklist for a human
  to confirm pairwise.
- A `merge_into`, `confirmed`, `alias`, `remint_from` or `supersedes` lane is a
  decision. **Close it**, and store the closure at the consumer, not in the table
   — the table should keep recording what each person actually did, one hop each.

The corollary matters as much: **do not flatten the stored rows.** The one-hop
record is the audit trail and the rollback path. Flatten at read time.

## The cycle case

Closure needs a terminator. The first cut of `flatten_merge_chains()` walked
until it revisited a node and then wrote `merge_into[src] = src` — a self-merge,
so the row became a member of itself. That is **worse** than the stale edge it
replaced, because a stale edge is visible in the data and a self-membership is
not. Keep the recorded hop on a cycle; do not invent an edge to escape one.

Measured on the live overlay before writing anything: 22,538 merges direct, 490
two hops, 18 three hops, **0 cycles**. The guard is for the day one appears.

## Why this matters beyond the bug

Packaging a discipline down to a handful of comprehensives is how the CCR reaches
its target. Packaging **composes with every merge decision already in the table**,
so any lane that stores decisions one hop at a time will accumulate chains at
exactly the rate curation succeeds. The defect was 340 rows before ESL was
packaged; a second packaged discipline would have added more, silently, and the
symptom — a discipline showing more rows than it has identities — reads like a
count bug rather than a modeling one.
