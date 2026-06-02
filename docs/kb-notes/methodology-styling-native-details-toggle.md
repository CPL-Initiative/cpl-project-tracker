---
title: Styling a native <details> — keep a visible affordance, drive the toggle in JS
created: 2026-06-01
updated: 2026-06-01
tags: [methodology, frontend, details-summary, css, ui-gotcha, eacr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/eacr_consolidation_lessons.md]]"
artifacts:
  - statewide_interactive.js
---

# Styling a native `<details>` — keep a visible affordance, drive the toggle in JS

> **One-sentence summary** — Hiding a `<details>` disclosure marker for styling
> removes the *only* affordance that tells a user it's clickable AND can mask a
> dead toggle; the robust fix is a CSS `::before` chevron + an explicit
> JS toggle with `preventDefault()` so the open state is fully under your control.

## Context

The EACR "Credential view" (v2) gallery section in `statewide_interactive.js` is
a native `<details>`/`<summary>`. It styled the summary with `list-style:none` +
`::-webkit-details-marker{display:none}` to drop the default triangle — and then
**wouldn't expand on click** (Session 27 → fixed Session 28, PR #252). Two
things were wrong at once, and a browser repro couldn't cleanly isolate which.

## The claim

When you restyle a native `<details>`, two failure modes compound:

1. **No affordance.** Hiding the marker (`list-style:none` +
   `::-webkit-details-marker{display:none}`, and the modern `::marker`) leaves a
   summary that *looks* like static text. Even if the toggle works, users don't
   know to click it. **Always restore a visible chevron** (a `::before` content
   triangle that rotates on `[open]` is enough):
   ```css
   .sum::before{content:"▸";display:inline-block;margin-right:.4rem;transition:transform .15s}
   details[open] > .sum::before{transform:rotate(90deg)}
   ```
2. **The native toggle can be swallowed.** A stacking/overflow neighbor (here the
   v1 table above it) can intercept the summary click, so the `<details>` never
   gains `open`. Rather than chase the exact culprit, **drive the open state in
   JS** with event delegation, and `preventDefault()` so the native toggle can't
   *race* yours (a JS toggle **without** `preventDefault` double-toggles → reads
   as "nothing happened"):
   ```js
   container.addEventListener("click", function (ev) {
     var sum = ev.target.closest(".sum");
     if (!sum) return;
     var det = sum.closest("details");
     if (det) { ev.preventDefault();
       det.open ? det.removeAttribute("open") : det.setAttribute("open",""); }
   });
   ```

**Scope the handler to your summary class** so nested `<details>` (here
`algo-details`, `sw-also-entered`) keep their native behavior — don't blanket
every `summary`.

## How we got here

PR #252. The fix is "robust either way": if native toggling was merely
intercepted, the JS toggle drives it; if it worked but lacked affordance, the
chevron fixes discoverability. Verified with a jsdom test (12 assertions): v1/v2
toggle, clicking an inner `<span>` resolves via `closest()`, `preventDefault` is
honored, and the nested non-gallery summaries are NOT hijacked. (jsdom doesn't
implement native `<details>` click-toggle, so any `open` change in the test is
proof the JS handler did it — a bonus.)

## When this applies (and when it doesn't)

- **Applies** whenever you hide/replace a `<details>` marker for design, OR a
  `<details>` lives inside a scroll/overflow/stacking context that might capture
  its summary click. This codebase has many `<details>` (project description,
  algo "how this is calculated", "also entered as N variants", the EACR gallery,
  the PR-4 prescriptive block) — the un-styled ones work natively and need no JS.
- **Doesn't apply** to a plain, default-styled `<details>` with its marker
  intact and no overlapping neighbor — native behavior is fine; don't add JS.
- **Accessibility note:** keep the element a real `<summary>` (focusable,
  Enter/Space fire a `click` → your handler still toggles). Don't replace it with
  a `<div>`.

## See also

- `[[docs/eacr_consolidation_lessons.md]]` — the workstream (Session 28)
- PR `#252` — the implementation
- CLAUDE.md §11 "Session 28" subsection

---

*Authoring check: durable (native `<details>` semantics are stable), reusable
(every styled disclosure widget hits this), distilled (one concept), self-contained.*
