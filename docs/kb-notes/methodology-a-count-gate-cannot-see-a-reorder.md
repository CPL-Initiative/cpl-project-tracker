---
title: A count gate cannot see a reorder
created: 2026-08-20
updated: 2026-08-20
tags: [methodology, joins, data-integrity, testing, cobi]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-reorder-by-permutation-not-by-rewriting-the-config]]"
artifacts:
  - college_briefing.js
  - tests/cpl_funding_reorder.test.js
---

# A count gate cannot see a reorder

> **One-sentence summary** — a guard that checks two lists are the same LENGTH
> proves nothing about a join between them once either list can be reordered:
> three still equals three, and the join is now wrong in silence.

## Context

The My College tab nests each funding priority's recommended strategies inside
that priority's allocation. The money comes from one module and the advice from
another, both reading the same config, and they were joined **by position**. The
join carried an explicit guard and a comment explaining why position was safe.

## The claim

### A guard has to fail on the thing that actually changed

The guard tested `prios.length === program.priorities.length`, and its comment
was right at the time: both sides walked one ordered set, so position held **by
construction** and the only way to break the join was a count mismatch.

Then the curator gained the ability to reorder one side. Nothing about the guard
changed, nothing failed, and the pairing became "priority 1's money with
priority 3's steps" — a claim a reader would act on. **Both lists still had
three entries.**

A construction argument is only as good as the construction. When you add the
feature that breaks it, the guard built on it does not start failing — it starts
lying.

### Join on identity, keep the count check as the outer gate

Give each side something that names the record rather than its slot — here the
item's index in the *stored* config, published by one module and already carried
by the other — and resolve through it. Keep the length check as the cheap outer
gate, and add the stronger one: **every identity must resolve**, or fall back to
whatever the safe degraded rendering is.

Keep the position path as an explicit fallback for a producer that predates the
identity field, so the join degrades rather than breaking.

### The identity has to survive every hop

The first cut of the identity join resolved to nothing on every row, because a
downstream function re-mapped each record into a fresh object and **did not
carry the key**. The value existed at the source and at the consumer; it was
dropped in between.

Any field a join depends on must be traced through every re-map between producer
and consumer. A field that is present at both ends is not evidence that it
survived the middle.

## How we got here

Sam's mid-session note — *"any changes here need to be wired into the My College
tab"* — is what sent anyone to look at all. The reorder had shipped and tested
green in its own tab; the downstream join was in a different file with its own
passing suite.

The dropped key was caught by that file's **existing** assertions (the ones that
check the strategies actually nest, and are labeled by count), which is exactly
what they were written for. Without them the strategies would have quietly left
the funding box and the page would still have rendered.

## When this applies (and when it doesn't)

Applies to any cross-module join whose safety rests on "both sides walk the same
ordered thing": UI sections paired with data, columns paired with headers,
per-item costs paired with per-item descriptions, two exports of one source.

The tell is a comment that says the join holds *by construction*. That comment is
a dependency on a property nothing enforces — treat it as a TODO to publish an
identity, not as reassurance.

Does not apply where position genuinely is the identity and cannot change (fixed
tuple layouts, positional CSV columns under a pinned schema).

## See also

- `[[docs/kb-notes/methodology-reorder-by-permutation-not-by-rewriting-the-config]]`
  — the feature that invalidated the construction argument
- `[[docs/cpl_funding_lessons]]` — the workstream that produced this
- PR `#1268` — the implementation

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
