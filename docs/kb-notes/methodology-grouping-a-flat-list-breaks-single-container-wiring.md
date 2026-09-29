---
title: Grouping a flat list into containers silently breaks every querySelector that assumed one
created: 2026-09-01
updated: 2026-09-01
tags: [methodology, engineering, front-end, testing, implementation-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[reference-ui-design-system]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_statutory_bands.test.js
---

# Grouping a flat list into containers breaks single-container wiring

> **One-sentence summary** — When a flat list of cards is regrouped into several
> containers, every `document.querySelector(".container")` that used to find *the*
> container now finds only the *first* one, so controls in every later group go
> silently dead — and no assertion about markup will catch it, because the markup
> is perfect.

## Context

The CPL Implementation Funding tab rendered its priority cards in one
`.cplfund-prio` grid. A consolidation regrouped them under three statutory
bands, giving each band its own grid. Everything rendered correctly. The drag
handles and position pickers on every card outside the first band stopped
working, and nothing said so.

## The claim

**`querySelector` is singular, and a refactor that multiplies containers turns
it into a silent partial.** The event wiring read:

```js
var prioGrid = document.querySelector("#cplFundingMount .cplfund-prio");
if (prioGrid) {
  prioGrid.querySelectorAll("[data-priopos]").forEach(/* bind change */);
}
```

Correct while one grid existed. After grouping, it bound the first band's cards
and skipped the rest. The failure mode is the worst kind of UI bug: **a control
that looks live, accepts the interaction, and does nothing.** It is strictly
worse than a control that is visibly absent, because the user believes the action
took.

**Three things generalize:**

1. **The audit is mechanical.** After any change that multiplies a container,
   grep the codebase for `querySelector(` against that container's selector.
   Each hit is a candidate silent partial. `querySelectorAll` + a loop is the fix;
   scoping handlers per group is usually wrong when the interaction is
   cross-group (here, reordering can move a card into another band).

2. **Markup assertions cannot catch it.** Every test that checked "the cards
   render", "the bands render", "the count is right" passed. The only test that
   fails is one that **exercises a control in a non-first group** and asserts the
   *state actually changed*.

3. **Grouping also breaks positional lookups in tests.** Four suites located
   cards by DOM ordinal (`querySelectorAll(".p")[2]`). Grouping reorders the
   document, so those broke too — and the fix is not to renumber but to locate by
   the identity attribute the renderer already stamps (`data-priocard`), which is
   what those assertions were always reaching for.

## How we got here

Found on 2026-09-01 when `cpl_funding_reorder.test.js` crashed on a null
dereference: the "Reset order" button never appeared because the reorder never
happened, because the picker it dispatched on had no listener. The picker was on
the third card, which the banding had moved into the second group.

Pinned by a check that exercises the **last** card and asserts the order changed,
then **mutation-verified**: reintroducing `querySelector` in place of the fix
turns exactly that one assertion red and nothing else. A guard that cannot be
shown to fail is decoration.

## When this applies (and when it doesn't)

**Applies** to any DOM refactor that splits one container into several —
grouping, tabbing, paginating, virtualizing, wrapping in collapsible sections —
and to the symmetrical case of merging several into one (where a handler bound
per-container may now double-bind). Also applies to CSS: a descendant selector
scoped to the old single container silently stops matching.

**Does not** apply where the handler is delegated from a stable ancestor
(`mount.addEventListener("change", e => e.target.closest("[data-priopos]") && …)`),
which is immune by construction. If a codebase already delegates, this whole
class of bug is absent — which is an argument for delegation in any UI whose
grouping is likely to change.

## See also

- `[[cpl_funding_lessons]]` — the session that hit it (2026-09-01, S218)
- PR `#1429` — the fix and the mutation-verified guard
- `cpl_memory` row `a-test-coupled-to-position-or-wording-breaks-on-correct-work` —
  the sibling finding about ordinal coupling in tests

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
