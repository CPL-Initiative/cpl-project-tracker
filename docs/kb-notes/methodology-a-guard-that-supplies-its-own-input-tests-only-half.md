---
title: A guard that supplies its own input tests only the half after the input
created: 2026-09-12
updated: 2026-09-12
tags: [methodology, testing, curation, funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - tests/funding_model_page.test.js
  - tests/cpl_funding_section_order.test.js
  - cpl_funding.js
---

# A guard that supplies its own input tests only the half after the input

> **One-sentence summary** — A test that writes the value it then reads back can
> only prove the consumer works; it is structurally incapable of noticing that
> nothing in the system ever produces that value.

## Context

The public funding explainer reads section renames and exclusions from the tab's
own resolver, keyed by each section's `data-fsec` id. A test block covered this
thoroughly and passed for three days while **six of the page's seven sections
could not be curated at all** — a section the Chancellor's Office held back on
the tab stayed visible on the page colleges read. Full story:
[`cpl_funding_lessons`](../cpl_funding_lessons.md) (2026-09-12).

## The claim

Every assertion has an input and a consumer. When the test writes the input
itself, the assertion covers the consumer and **silently excludes the producer**
— and the producer is usually where the wiring is missing.

The failing shape looks like a complete test:

```js
T._setShared({ titles: { qualify: "Baseline requirements" } });
win.CPL_CURATE_SECTIONS();
check("a rename from the tab reaches this page", h2.textContent === "Baseline requirements");
```

This proves the resolver resolves and the painter paints. It cannot notice that
**no control anywhere emits the id `qualify`** — because the test typed it.

The repair is to make the input come from the system:

```js
// The tab DECLARES the page's sections; assert the declaration equals the markup.
check("the tab's declared public sections ARE this page's sections, in page order",
  T2.publicSectionOrder().join(",") === IDS.join(","));
```

Now a section added to the page without being declared fails, and a declared id
the page does not carry fails. Neither half is supplied by the test.

### The same failure in one selector

A second instance in the same run: a new box asserted `!el.hasAttribute("data-priocard")`
to prove it was not a priority card. True the whole time — and irrelevant, because
other code selects on the **class**, and the box carried `class="p"`. The guard
named the right subject and tested nothing that could move. See
[`methodology-a-styling-class-is-an-api`](methodology-a-styling-class-is-an-api.md).

## How we got here

Two ids happened to collide. The tab's sections are `about` · `college` ·
`window` · `pools` · `formula` · `eligibility` · `priorities` · `timing`; the
explainer's are `lede` · `institutions` · `allocation` · `qualify` · `earning` ·
`timing` · `choices`. Only `timing` is in both, by coincidence of naming — so
exactly one of the seven behaved as documented, and the one the test exercised
for hiding was `timing`. The rename half of the test used `qualify` and passed
because the test had written it.

Caught by asking a different question than the test asked: not *does a hide
reach the page*, but *what emits these ids?* — and grepping for the answer.
PR [#1563](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1563).

## When this applies (and when it doesn't)

**Applies** wherever a test crosses a boundary between a producer and a consumer
that live in different files: config-to-renderer, control-to-store,
builder-to-artifact, one page's declaration against another page's markup. The
tell is a test that begins by writing state.

**Does not apply** to a unit test of a pure function, where supplying the input
*is* the test. `reorderList(order, from, to)` should be handed its array.

The general repair is not "stop seeding fixtures" — it is to add **one**
assertion whose input the system produces, alongside the seeded ones. A seeded
test and a derived test cover different halves, and the derived one is cheap
once you can name what the system should produce.

## See also

- [`cpl_funding_lessons`](../cpl_funding_lessons.md) — the workstream section
- [`lanes/implementation-funding`](../reference/lanes/implementation-funding.md) — lane state
- [`methodology-a-feature-test-on-a-missing-method-fails-silent`](methodology-a-feature-test-on-a-missing-method-fails-silent.md) — the sibling: a feature test whose subject does not exist
- PR `#1563` — the fix and the derived guard

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
