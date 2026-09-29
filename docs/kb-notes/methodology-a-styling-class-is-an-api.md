---
title: A styling class is an API, so borrowing one joins every selector that reads it
created: 2026-09-12
updated: 2026-09-12
tags: [methodology, testing, frontend, funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_render.test.js
  - tests/cpl_funding_rollup.test.js
---

# A styling class is an API, so borrowing one joins every selector that reads it

> **One-sentence summary** — Adding an existing class to a new element to
> inherit its look also enrolls that element in every query, count, index and
> handler binding keyed on the class, so a purely visual edit can change
> behavior in files it never mentions.

## Context

A new display box on the Implementation Funding tab was rendered as
`<div class="p cplfund-rprio">` to pick up the priority card's appearance. The
comment directly above that line explained at length that the box must never be
a priority card, because priority cards drive the funding arithmetic. The
comment was right about the design and blind to the attribute implementing it.
CI went red on **seven test files** from that one class. Story:
[`cpl_funding_lessons`](../cpl_funding_lessons.md) (2026-09-12).

## The claim

In a codebase without scoped styles, a class name is a **public interface with
unknown subscribers**. Adding it declares "this element is one of those", and
every consumer that agrees is entitled to treat it as one:

- **Counts.** `doc.querySelectorAll(".cplfund-prio .p").length === 3` became 4.
- **Positional indexing.** Three checks read "the card at slot *n*"; a fourth
  card shifted every index.
- **Shape contracts.** "Every `.p` pairs an ordinal with an editable title
  input" — the new box has no title input, by design.
- **Event binding.** Reorder handlers bind over the same grid, so the box would
  have collected affordances belonging to a different object.

None of these live in the file being edited, and none of them are wrong. The
cost is not a bug in the consumers; it is that the new element answered a
question it should not have answered.

**The test to apply before borrowing a class:** grep it. If anything outside the
styling layer selects on it, the class is an interface, and the new element
either genuinely is one of those things or needs its own class plus its own
rules. Duplicating five CSS declarations is the cheap side of this trade.

## How we got here

`reportedPrioHtml()` renders a box for a statutory outcome the model funds but
cannot measure. It is explicitly **not** an entry in `priorities(slot)` — an
entry there with share 0 would earn nothing and still enter every share-sum,
ledger line, drill-in column, export and memo. That reasoning was written down
and then undercut one line later by a convenience class.

The guard meant to protect the invariant tested
`!box.hasAttribute("data-priocard")` — true the whole time, and not what other
code selects on. It now pins the `.cplfund-prio .p` count against the
`data-priocard` count, which is the assertion that would have caught this before
the push. See
[`methodology-a-guard-that-supplies-its-own-input-tests-only-half`](methodology-a-guard-that-supplies-its-own-input-tests-only-half.md).

Fixed in PR [#1563](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1563).

## When this applies (and when it doesn't)

**Applies** to any global-CSS codebase, and most sharply where tests assert over
the DOM: a monolithic consumer JS file with jsdom suites is the exact
environment where a class rename or reuse changes test outcomes silently. It
applies equally to `data-*` attributes used as selectors.

**Does not apply** under CSS Modules, styled-components, or any scheme that
generates class names — there, a class genuinely is private. It also does not
apply to classes that are *only* ever styled, which is why the grep is the test
rather than a blanket prohibition.

The corollary worth holding: **when a comment says an element must not be
treated as X, the next line is where that gets decided.** A design constraint
stated in prose and contradicted by an attribute is not a documented design; it
is a comment.

## See also

- [`cpl_funding_lessons`](../cpl_funding_lessons.md) — the workstream section
- [`methodology-a-guard-that-supplies-its-own-input-tests-only-half`](methodology-a-guard-that-supplies-its-own-input-tests-only-half.md) — why the guard missed it
- PR `#1563` — the box, the breakage, and the fix

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
