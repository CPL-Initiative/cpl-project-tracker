---
title: An undefined CSS custom property fails to an invisible state, and no jsdom test can see it
created: 2026-09-06
updated: 2026-09-06
tags: [methodology, ui, accessibility, testing, first-light]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[reference-ui-design-system]]"
  - "[[methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration]]"
artifacts:
  - kb/_decision_sheet_replies.py
  - tests/decision_sheet_replies.test.js
---

# An undefined CSS custom property fails to an invisible state, and no jsdom test can see it

`background: var(--seal-blue)` against a token no stylesheet defines is not a
no-op and not a visible error. The declaration is **invalid at computed-value
time**, so the property falls back to its inherited or initial value — for
`background-color`, transparent. Paired with `color: #fff` on a white card, the
result is white on white at **1.00:1**: the element is still there, still
clickable, still correct in the DOM, and completely unreadable.

## How it shipped

`kb/_decision_sheet_replies.py` injects the reply chips onto every decision
sheet. Its selected state read:

```css
.reply-chip[aria-pressed="true"] { background: var(--seal-blue); border-color: var(--seal-blue); color: #fff; }
```

`--seal-blue` is a real First Light token, and the injector assumed the host
sheet defined it. **No sheet did** — the template defines a 14-token subset that
does not include it. Sam answered seven calls on one such sheet and ten on
another; every click registered and every verdict saved, and he could not see
which chip he had picked.

⚠️ **An injected block cannot assume what its host defines.** The fix is a
fallback, which makes the block self-sufficient wherever it lands:

```css
background: var(--seal-blue, #002F6D);
```

## Why the tests were green

`tests/decision_sheet_replies.test.js` had 25 passing checks over exactly this
component, including six on the pressed state. Every one asserts the
**attribute**:

```js
check("click 1: Retire pressed", chip(RETIRE, "retire").getAttribute("aria-pressed") === "true");
```

That is the right assertion for the behavior and it is blind to the defect.
jsdom computes no layout and does not resolve custom properties, so a rendering
assertion was not available to be written. This is the repo's standing warning —
*`npm test` passing proves nothing about layout* — arriving in a component whose
tests looked thorough.

⚠️ **And `npm run a11y` would not have caught it either**, for two independent
reasons worth separating:

1. `a11y.config.js` names five files. **No sheet under `docs/visuals/` is
   covered at all** — a whole class of view we ship and ask people to act on.
2. Even with coverage, **the broken state does not exist until someone clicks**.
   A contrast pass over the page at rest sees a chip that is correctly styled;
   the failure is only in `[aria-pressed="true"]`.

## The guard that does work

Not a rendering test — a **text** check over the shipped artifacts: a bare
`var(--x)` must be defined by the sheet that carries it, or carry a fallback.

```js
for (const m of src.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
  if (!root.has(m[1])) broken.push(f + " -> " + m[1]);
}
```

Cheap, deterministic, covers the whole class rather than the one instance, and
it earned its place on the first run: it immediately named a **second** sheet
carrying the same bug that nobody had looked at. Perturbation-tested — the
fallback removed turns it red, restored turns it green.

## The general rule

**A state that only exists after an interaction is invisible to a scan of the
page at rest**, and a component test that asserts the attribute is not evidence
that the state can be seen. When a style depends on a token, a theme, or a host
you do not control, check the *resolution* statically — that is the part a
headless DOM can actually answer.
