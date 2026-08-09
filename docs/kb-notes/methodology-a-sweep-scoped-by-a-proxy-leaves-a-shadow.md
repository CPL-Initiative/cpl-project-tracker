---
title: A sweep scoped by a proxy leaves a shadow
created: 2026-08-09
updated: 2026-08-09
tags: [methodology, coverage, audit, sampling, data-quality, contacts]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-written-backlog-decays-silently]]"
  - "[[docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted]]"
  - "[[docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one]]"
artifacts:
  - map_team_queue.js (contacts-never-looked)
---

# A sweep scoped by a proxy leaves a shadow

## The claim

When you scope a piece of remediation work by an attribute that *correlates*
with the need rather than **being** the need, everything outside that scope
becomes invisible — not "known to be fine", but **never examined**, and
indistinguishable afterwards from "examined and fine".

The shadow is worse than an ordinary gap, because the completed sweep produces a
confident artefact ("all 71 looked up, 56 resolved") that reads as coverage.
Nobody re-asks the scoping question, because the work is *done*.

## How it presented (2026-08-09)

The need: **every college must have somewhere a student's prior-learning request
can land.** The platform routes on one field, `primary_contact_email`. Blank
means the request has no destination.

A thorough sweep had gone out and looked up **71 colleges**, finding a usable
contact for 56 and documenting why the other 15 had none. Good work, carefully
recorded, with provenance on every row.

The sweep was scoped to *"colleges without a CPL Assistant."*

That is a **proxy**. It is a reasonable proxy — a college with a CPL Assistant
is likelier to have its contact fields filled in. But it is not the need, and
the two come apart:

```
colleges with no primary_contact_email      25
  ├─ in the sweep, contact found            14   → a proposal is waiting
  ├─ in the sweep, nothing usable found      4   → needs a human
  └─ NEVER IN THE SWEEP AT ALL               7   ← the shadow
```

Seven colleges had **no routable contact and had never been looked up**, because
each *did* have a CPL Assistant. Having a CPL Assistant does not mean the
platform can route a student — they are different fields, filled in by different
people, at different times.

Five were ordinary, large colleges. And they were the **cheapest** items on the
whole backlog: one lookup each. They had simply never been on anyone's list.

## Why it recurs

- **The proxy is usually chosen for tractability**, not correctness — it is the
  attribute you happen to have a list of. That origin is forgotten by the time
  the results are written up.
- **The output is expressed in the proxy's units.** "71 looked up, 56 resolved"
  invites the question *how many of the 71?* and never *how many of the need?*
  The denominator quietly becomes the scope instead of the population.
- **The shadow has no representative.** Rows examined and found empty generate
  an artefact — a note, a "nothing found" flag. Rows never examined generate
  nothing at all, so no downstream count can even see them.

## The rule

**State the population, then the scope, then the difference — and give the
difference a name.**

1. **Write the need as a predicate over the full population** *before* choosing
   who to work on: "colleges where `primary_contact_email` is blank", not
   "colleges without a CPL Assistant".
2. **Compute the shadow explicitly**: `population needing work − scope worked`.
   If that is not zero, it is a work item, not a rounding error.
3. **Give "never examined" its own state**, distinct from "examined, nothing
   found". They need different actions from different people, and collapsing
   them into one "unresolved" count hides the cheapest work behind the hardest.
   In the case above, merging them would have buried 7 one-minute lookups inside
   11 items described as *needing a human*.
4. **Report coverage against the need's denominator.** "56 of 71 looked up" and
   "14 of 25 routable" are both true and only one of them is about the problem.
5. **Prefer scoping by the predicate itself** when you can. If you must use a
   proxy (cost, access, an existing list), say so where the results are
   published, so the next reader knows a shadow exists.

## The tell

Ask of any completed remediation: **"what was the denominator, and was it the
population or the batch?"** If the write-up counts what was *worked* rather than
what *needed working*, the shadow is there — you just haven't measured it yet.

A second tell: if two attributes are used interchangeably in the prose ("no CPL
Assistant" and "no contact"), check whether they actually co-occur. Here they
diverged on 7 of 25 rows — 28%.

---

*Authoring check: durable (a property of scoped remediation, not of one sweep),
reusable (audits, migrations, outreach, data cleanup, sampling), distilled (one
claim), self-contained.*
