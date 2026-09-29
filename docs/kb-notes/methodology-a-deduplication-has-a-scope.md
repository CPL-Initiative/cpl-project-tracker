---
title: A deduplication has a scope, and the scope is one measure — not the record
created: 2026-08-23
updated: 2026-08-23
tags: [methodology, data-quality, deduplication, funding, allocation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - cpl_funding_data.js
  - cpl_funding.js
  - tests/cpl_funding_render.test.js
---

# A deduplication has a scope

> **One-sentence summary** — When you find the same thing counted twice, delete
> the duplicated MEASURE from the lane that double-counts it, not the record
> that carries it; the same row is often a duplicate in one calculation and the
> only copy in another.

## What happened

The noncredit funding lane changed from a flat split among four campuses to an
allocation proportional to noncredit FTES. At that moment a long-harmless
overlap became a defect: **Mt. SAC Noncredit's 10,829.3 noncredit FTES is also
carried on the Mt. San Antonio credit row.** Under a flat 4-way split nobody was
paid for it twice. Under a proportional split, the same teaching would earn in
two places.

The instruction — *"we can pull out the Mt SAC NC dup"* — was correct, and the
obvious implementation was to remove the row from the roster. A test on an
unrelated surface went red:

```
FAIL  Q2: 118 recipients + 1 declined row
```

**ESS 25-82 paid Mt. SAC Noncredit its own $50,000 seed grant.** The roster is
also the recipient list for a record of distributed awards. Removing the row
erased a real grant to a real institution.

## The distinction

Two different things were both called "the duplicate":

| | is it duplicated? |
|---|---|
| the **10,829.3 FTES** in the noncredit size basis | **yes** — the same teaching, counted on two rows |
| the **institution** Mt. SAC Noncredit | **no** — a distinct grantee with its own award |

So the fix belongs in the *measure*, not the *record*. The row keeps its place
and gains a field naming the row that already carries its size:

```js
{ "name": "Mt. San Antonio College — Noncredit", "short": "Mt. SAC NC",
  "noncredit_ftes": 10829.3,
  "nc_ftes_on_credit_row": "Mt San Antonio" }
```

The lane zeroes its size; every other consumer sees an unchanged institution.

## And say so on screen

A zeroed row and a missing row look identical to a reader, so the table renders
the reason — *"counted on the Mt San Antonio row"* — rather than a bare dash. An
exclusion that cannot be seen will be re-litigated by the next person who
notices the institution is not getting paid.

## How to apply it

Before removing a record because it duplicates another:

1. **Name the measure.** Which single number is counted twice? Not "this row is
   a duplicate" — *"this FTES figure appears in two size bases."*
2. **List the record's other consumers.** Grep the identifier. A roster is
   rarely read by one calculation; here it fed an allocation *and* a grant
   register.
3. **Zero the measure in the lane that double-counts it**, leave the record.
4. **Render the exclusion with its reason**, so the zero is legibly deliberate.
5. **Let the tests tell you the scope.** The failing assertion here was in an
   entirely different feature, and it was right.

## Why the tests caught it and review would not

The change looked local — one entry, one roster, one obviously-duplicated
figure. Nothing in the diff mentioned grants. The only thing connecting the
roster to a $50,000 award was a test that had written the connection down years
earlier: *"Recipients = every college… PLUS the noncredit feeder campuses (ESS
25-82 funded noncredit institutions too)."*

⭐ That is the argument for asserting a **count with its reason attached**. `118
recipients` alone would have looked like a number to update.
