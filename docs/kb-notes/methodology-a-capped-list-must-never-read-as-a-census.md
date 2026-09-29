---
title: A capped list must never read as a census
created: 2026-08-21
updated: 2026-08-21
tags: [methodology, retrieval, sierra, disclosure, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_candidate_census.test.js
---

# A capped list must never read as a census

> **One-sentence summary** — When a bounded result set reaches a consumer with no
> statement of what it is, the consumer describes it as complete; and **raising
> the bound makes the error harder to detect, not smaller.**

## Context

Asked *"What should Los Angeles Community College District do to help its
colleges award more CPL?"*, Sierra opened with **"Three LACCD colleges appear in
the MAP platform data"**, tabulated three, and closed the same answer with
*"across all nine LACCD colleges"* — a number the retrieval never gave her.

All nine were present in `map_colleges` **and** in `chatbox_college_profiles`.
Nothing was missing. The three came from a `.slice(0, 3)` on a disambiguation
tie-list, whose contract is *"candidates you might have meant"*.

## The claim

### 1. A bounded list without a label becomes a census

Three profile blocks and a roster of three are **indistinguishable** once they
reach a model — or a reader. The disambiguation branch's meaning ("some
candidates") existed only in the function that produced it; by the time the
context was assembled, that meaning was gone.

### 2. Raising the cap is the wrong fix, and actively worse

Widening 3 → 12 returns all nine and yields *"Nine colleges appear in the MAP
platform data"*. Still a name match presented as the database's contents, still
false — and **harder to catch**, because nine is the right number for LACCD and
would be wrong for every district whose colleges are not all named after it. A
plausible wrong answer survives review that an implausible one fails.

### 3. The fix is disclosure, and it must travel with the data

The list must state, in the payload itself: what it is (a name match), how it
was matched, **shown-of-total**, what it is *not* (a district's membership), and
what the system cannot do (enumerate a district — there is no district dimension
anywhere in the schema). Forbidding the specific false sentence, with the count
interpolated, is cheap and effective.

### 4. Bound the set and the disclosure in one place

The defect existed because two bounds on the same concept drifted: a per-word
query raised 3 → 12 and a tie-list left at 3. One named constant now serves
both, so they cannot disagree again.

## Implementation note

⚠️ **Stamp each ROW, not the array.** Downstream code did `profile.map(attach)`
and `profiles.map(...)`; a property hung on the array is dropped by the first of
those. A per-row field survives, because `attach` spreads the row.

## How we got here

Reported by Sam, 2026-08-21, with a screenshot. Reproduced in
`tests/sierra_candidate_census.test.js`, which lifts the real functions via
`tests/lib/lift_ts.js` and runs the actual sentence through the actual matcher:
pre-fix it returns exactly the three colleges from the screenshot.

## Limits

Disclosure changes what a model *is told*, not what it *must* say. It is
necessary, not sufficient — pair it with retrieval that can answer the question
asked. Here the real unlock is a district dimension, which did not exist: zero
columns named district in the entire public schema.
