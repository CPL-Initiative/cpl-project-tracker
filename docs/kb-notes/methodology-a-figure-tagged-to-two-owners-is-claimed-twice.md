---
title: A figure tagged to two owners is claimed twice
created: 2026-09-14
updated: 2026-09-14
tags: [methodology, funding, reporting, data-integrity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[implementation-funding]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_outcome_cards.test.js
---

# A figure tagged to two owners is claimed twice

> **One-sentence summary** — tagging one amount to two categories reads as flexible
> labelling and behaves as double counting, and nothing catches it until something adds
> the categories up.

## Context

The CPL Implementation Funding model withholds a statewide project allocation —
$8,959,692 — before any college award is computed. Ed. Code §78093.2(d)(1) names four
goals the appropriation must be allocated against, and the model tags each funding line
to the goals it serves. The project allocation was tagged to **both** (C) career
attainment and (D) pilot projects.

Both tags were defensible on their own terms. (D) is the statute's own words — it names
the chancellor's office pilot projects this allocation funds. (C) was a curator's ruling
(2026-08-28): career attainment is carried by the project funding withheld from the
direct college award and reported qualitatively, because no reliable campus measure of it
exists. Neither tag was a mistake.

The defect was in what the code did with two tags:

```js
poolGoals(field).forEach(function (k) {
  map[k].pools.push({ amount: Number(poolField(field)) || 0 });   // the FULL amount
});
```

Each tagged goal received the **full** amount. The §78093.2(d)(2) account therefore
reported $8,959,692 under (C) and $8,959,692 under (D) — $17.9M of reporting against an
$8.96M allocation.

## Why nothing caught it

The account rendered one row per goal, and each row was correct in isolation: (C) is
funded by the project allocation, and so is (D). **No surface ever summed the goals.**
A reader checking any single row would confirm it; only a reader adding four rows
together would see the total exceed the appropriation, and the page never invited that.

This is the general shape:

- A **tag** is naturally many-to-many — a thing can serve two purposes.
- An **amount** is not. It is spent once.
- Code that iterates tags and attaches the amount to each has silently converted a
  many-to-many relationship into duplicated money.
- The error is invisible **exactly while nothing aggregates**, which is why it can sit
  for months in a system whose per-row rendering is correct.

## The rule

**When an amount is tagged to more than one owner, store the split, not the tag alone.**
The tag says which owners are eligible; a split says how much each one reports. Where
only one owner is tagged, the split is the whole amount and nothing changes.

In this model:

```js
function poolGoalAmount(field, key) {
  var keys = poolGoalKeys(field);            // in STATUTE order, so "last" is stable
  var total = Number(poolField(field)) || 0;
  if (keys.length <= 1) return total;        // one owner: no split to make
  var m = poolSplitMap(field);
  if (m) return Math.max(0, Math.min(total, Number(m[key]) || 0));
  return key === keys[keys.length - 1] ? total : 0;   // default: one owner holds it all
}
```

Three properties are worth copying:

1. **The default assigns the whole amount to one owner**, never an even division. An even
   split invents a designation nobody made; a whole-amount default is a claim someone can
   see and correct.
2. **Two owners rebalance; more than two state the shortfall.** With exactly two, writing
   one figure gives the other the remainder, so the pair always sums to the total and
   neither can be typed into a state that over- or under-claims it. With three or more,
   the others are left alone and the undesignated remainder is *stated on screen* —
   silently absorbing it would recreate the original defect in a new place.
3. **The split changes a caption, never an allocation.** These are pool line items taken
   off the top before any award is computed, so which goal reports one moves no money.
   Keeping that true is what makes the control safe to hand a curator.

## The test that would have caught it

Not a test of either row. A test that **adds the rows up**:

```js
check("the two designations sum to the allocation rather than doubling it",
  money(fundOf("C")) + money(fundOf("D")) === 8959692);
```

Any reporting surface that attributes one amount across categories deserves one of these.
It is the only check that distinguishes "both of these are funded by X" from "X is being
counted twice".

## Where else to look

Wherever this repo tags an amount to a many-valued field and renders per tag:
`poolGoals()` and `customPool()`'s `goals` array in the funding model, and any future
per-goal, per-priority or per-college attribution built the same way. The question to ask
of each is not "is this row right?" but **"what happens if I add every row together?"**
