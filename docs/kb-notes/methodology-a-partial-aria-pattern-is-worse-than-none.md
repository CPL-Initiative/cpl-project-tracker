---
title: A partial ARIA pattern is worse than none — take the native control instead
created: 2026-08-16
updated: 2026-08-16
tags: [methodology, accessibility, ui, wcag, aria]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[eacr_scope_lessons]]"
  - "[[reference-ui-design-system]]"
artifacts:
  - statewide_interactive.js
  - tests/eacr_a11y.test.js
---

# A partial ARIA pattern is worse than none — take the native control instead

> **One-sentence summary** — an ARIA role is a promise about how a control
> behaves, so declaring `role="tab"` without arrow keys tells a screen-reader
> user an interaction exists and then withholds it; where a native element
> carries the same semantics, taking it removes the whole class of error.

## Context

The EACR tab shipped two custom controls on 2026-08-16: a two-way sub-tab
switcher and a three-way scope selector. Both were built from `<button>`s. The
accessibility pass the next hour found four defects, and all four were in that
hours-old code rather than in anything inherited.

## The claim

### A role is a contract, and half of one is a lie

`role="tablist"` + `role="tab"` were set. `aria-selected`, `aria-controls`, the
`tabpanel` role and arrow-key navigation were not. The result announces *"tab, 1
of 2"* — which tells the user to press Left/Right — and then nothing happens.

**A sighted user encountering an unlabelled div at least knows they are on their
own. A screen-reader user handed a half-declared pattern has been actively
misinformed.** The complete pattern is small and well-specified: `aria-selected`
on every tab, `aria-controls` pointing at a `role="tabpanel"` that is
`aria-labelledby` its tab, roving `tabindex` so only the selected tab is in the
tab order, and Left/Right/Home/End. Ship all of it or none of it.

Use `[hidden]` rather than `display:none` on the inactive panel — it removes the
panel from the accessibility tree *and* from find-in-page, and it cannot be
defeated by a later CSS rule with higher specificity.

### Where a native element fits, the native element wins

The three scopes are mutually exclusive, which is a radiogroup. The first
implementation was three styled buttons with an `.on` class — meaning **no
selected state was exposed at all**; a screen-reader user could not tell which of
the three was active.

The fix was not a hand-rolled ARIA radiogroup. It was **native radios in a
`<fieldset>` with a `<legend>`**, visually restyled via `label`:

- arrow-key navigation, "2 of 3, selected", and group naming come for free
- the focus ring is the platform's, so it honours the user's settings
- there is no keyboard code to get subtly wrong a second time

Visually hide the input with `opacity:0` and absolute positioning — **never
`display:none` or `visibility:hidden`**, which remove it from the focus order and
break the very thing you took it for.

The judgment call: reach for ARIA when no native element carries the semantics
(a tablist is genuinely one of those). Reach for the native element the moment
one does.

### A live region for a control that changes the page underneath you

Changing scope silently re-filters the result set. A `role="status"
aria-live="polite"` hint that restates what the new scope means turns a silent
mutation into an announced one.

## How we got here

Session 162. Two more defects in the same pass, both worth naming because they
are easy to repeat:

- **Colour-only meaning (WCAG 1.4.1).** A "likely" could-adopt match was
  distinguished from a broad lead by an *outline colour*. Fixed by splitting into
  two **text-labelled** groups — the label carries the distinction, styling only
  reinforces it. A `@media (forced-colors: active)` block then keeps the selected
  states distinguishable under Windows high contrast, which drops background
  colour entirely.
- **A tooltip is not an accessible name.** College chips carried the full name in
  a `title` on a `<span>` — announced inconsistently, and on touch unreachable by
  anyone. `<abbr title>` is the element assistive tech actually expands, and it
  is semantically true: the short label *is* an abbreviation.

## Consequences

- Grep new UI for `role=` and check each one against its full pattern before
  merging. A role with no keyboard handler is the tell.
- When a control is a radio, a checkbox, a `<details>` or a `<select>`, prefer
  the native element even when the styling is more work.
- Test the pattern, not the appearance: assert `aria-selected` counts, roving
  `tabindex`, and that arrow keys actually move the selection.

## See also

- [[reference-ui-design-system]] — palette + canonical components.
- [[methodology-a-check-that-never-registers-can-never-fail]] — the harness that
  verified this pass had its own version of the same problem.
