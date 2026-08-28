---
title: An unadopted item is a shelf, not an absence — and it needs its own band
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, ranking, product, adoption, exhibits, ui, disclosure]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/kb-notes/methodology-a-summary-field-can-be-a-retrieval-gate]]"
artifacts:
  - kb/supabase_credential_recs_routes.sql (college_adoption_opportunities)
---

# An unadopted item is a shelf, not an absence — and it needs its own band

> **One-sentence summary** — when a catalog is deliberately stocked ahead of
> demand, zero uptake is a product state, not a quality signal, and folding it into
> a popularity-ranked list makes the system assert things that are false.

## Context

Sam, 2026-08-13:

> "Sometimes there are exhibits created (statewide and local) that have not yet
> been adopted… we create them before the student arrives to make them available
> to the colleges for adoption. I wouldn't want them excluded because of that. In
> fact, we want them to be prominent choices for adoption."

MAP publishes statewide CPL exhibits **before** any college adopts them, on
purpose, so the credit is defined and waiting when a student turns up. Zero
adopters therefore means *"nobody has picked this up yet"* — an opportunity — and
never *"this was considered and rejected"*.

The adoption-recommendation route ranked by peer-adoption count descending, so
these sorted last. Worse, they were **excluded outright**: the route filtered on a
field derived from articulations, which unadopted items do not have (see
`methodology-a-summary-field-can-be-a-retrieval-gate`).

## Why re-sorting is the wrong fix

The obvious repair — flip the sort, or add a bonus for zero adopters — is wrong,
because the two groups carry **different claims**:

| Band | The claim | Evidence behind it |
|---|---|---|
| `peer_leverage` | "peers already teach and articulate this; you have not" | a real adopter count |
| `ready_to_adopt` | "nobody has taken this up; it is adoptable as-is" | none, and none is needed |

Merging them into one ranked list lets the system say *"N peers already articulate
it"* about an item with **zero** adopters — a **fabricated route**, which in this
domain means sending a student to a counter where nobody expects them. The
underlying data model already keeps these disjoint by construction (adopters and
potential-adopters never overlap); the presentation layer must not re-merge what
the model carefully separated.

## The pattern

1. **Separate bands, separately labeled.** Each band's copy states what it is and
   what it is not. The shelf band says explicitly that zero uptake is not a quality
   signal and that the asking party would be *first*, which is a feature.
2. **Slot reservation, not sort priority.** Ordering the shelf first
   unconditionally puts the same items at the head of *every* answer and crowds out
   the targeted band. Reserve a share of the budget (here: a third, minimum 3) that
   the other band cannot consume, and vice versa. Neither can be starved; neither
   drowns the other.
3. **Let the band self-empty.** Defined as *zero adopters*, the shelf shrinks as
   adoption happens — the first adopter moves an item into the leverage band. The
   band emptying is a **success signal**, not a bug.
4. **Scope the band to items where the claim is true for everyone.** Statewide
   standards are adoptable by any college by definition, so "available to you" is
   true. Unadopted *local* items have no such property and were left out of the
   per-college pitch (still findable by name).

## The reframe worth stealing

Once the shelf was visible, its contents collapsed: **36 credentials, 75
recommendation lines, but only 32 distinct courses** — 18 courses serve two or more
credentials, and one (*Introduction to Construction Safety*) unlocks **12**.

An inventory nobody could see looked like 38 independent decisions. Displayed
together, it is a small course cluster with large fan-out — a completely different
and far more persuasive pitch. **Surfacing a hidden set is worth doing for its own
sake; the structure inside it is often the real finding.**
