---
title: A one-rule class must be checked against its own text
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, worklist, cleanup, prioritisation, data-quality, ace, disposition]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/map_cleanup_worklist]]"
  - "[[docs/kb-notes/methodology-search-the-awarding-body-not-just-the-name]]"
artifacts:
  - kb/supabase_map_cleanup_worklist.sql
  - docs/map_cleanup_worklist.md
---

# A one-rule class must be checked against its own text

> **One-sentence summary** — grouping rows by a *predicate* and then writing one
> instruction for the group asserts that every row means the same thing; read a
> sample of what the rows actually **say** before that instruction reaches
> anyone.

## Context

The CPL clean-up worklist's top item was **17,594 rows across ~100 colleges,
`effort_shape: one rule`**, carrying a single action: *"Rule these Not
Applicable. ACE has already said no credit is recommended."* Its next step was
*"work P1 as one instruction to ~100 colleges."* Reading the underlying
`credit_rec` text before drafting that instruction showed the sentence was false
for **5,311 rows at 101 colleges**.

## The claim

The class was assembled from a predicate — *zero-unit recommendation* — and then
described by the most common reason a recommendation carries zero units. Those
are not the same set. What the other rows say:

```
0 hours in Credit may be granted on the basis of an individualized
           assessment of the student                            3,970 rows / 95 colleges
0 hours in Additional swimming on the Basis of Institutional
           Evaluation                                           1,075 rows / 86 colleges
0 hours in Credit in surveying on the basis of institutional
           evaluation                                             171 rows / 57 colleges
```

**ACE is deferring to the college, not refusing.** Zero units is the *mechanism*
of a deferral, not evidence of a denial. Telling ~100 colleges to close those as
Not Applicable, on the stated ground that ACE refused, manufactures a **false
zero at scale** — and unlike a search returning nothing, nobody ever files
feedback about a door they were told was closed.

Two matcher misses surfaced the same way, and both are the kind only text
inspection finds: the corpus contains **`Credit Is Not Recommeded`** (26 rows,
missed by an `ilike '%recommended%'`) and **`individual assessment`** without the
*-ized* (20 rows, dropped into the residue bucket).

## What to do with it

- **Before writing one instruction for a class, group by the raw text and read
  the top values.** Two queries. It is the same discipline as *lead with the
  list, never a count*: a count of a class describes a predicate, the list
  describes the rows.
- **Separate the classes and give each its own action string.** A single literal
  applied across subclasses is the shape of this bug — it looks deliberate in a
  diff and is only wrong in the data.
- **Where the right disposition is a judgment, say so in the row** instead of
  prescribing. The deferral rows became their own priority whose action states
  the facts and names the open question. Its rank reflects **readiness, not
  value** — it is the only class in that worklist that could still turn into
  credit for a student.
- Conservation is a cheap check that a reclassification lost nothing:
  12,283 + 5,311 = 17,594.
