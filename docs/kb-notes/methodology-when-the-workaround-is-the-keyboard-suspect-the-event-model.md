---
title: When the workaround is the keyboard, suspect the event model
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, ui, events, accessibility, debugging]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - cobi_identity.js
  - tests/cobi_identity.test.js
related:
  - "[[reference-ui-design-system]]"
---

# When the workaround is the keyboard, suspect the event model

> **One-sentence summary** — a control you can reach by Tab but not by click is
> almost never a focus bug; it is a click handler firing somewhere you did not
> mean it to, and the input device in the user's workaround is the clue.

## The report

Sam, 2026-08-28: *"I logged out but when I try to log back in, the drop down
closes when I try to click into the email box… I have to trick it and tab to
it."*

Read as a focus problem, that sends you into `autofocus`, `tabindex`, focus
traps, re-render timing — none of which are involved.

## The cause

```js
document.addEventListener("click", function () {
  if (openPane) { openPane = false; render(); } });
```

The pane closed on **any** document click. The toggle button survived because it
calls `stopPropagation()` on *itself*. Nothing **inside** the pane did — so a
click on the email field bubbled to this listener, `openPane` went false, and
`render()` destroyed the field mid-click.

**Tab worked because a tab is not a click.** The two input paths reach different
listeners, so one worked and one did not, and the difference looked like focus.

## The rule

**When a user's workaround names a different input device, the bug is in the
event model, not in focus.** Symptom and mechanism live in different event
paths; that mismatch is exactly what makes it feel mysterious.

The same shape shows up as:

- works with the keyboard, not the mouse → a stray `click`/`mousedown` handler
- works with the mouse, not the keyboard → a missing `keydown` path, or a
  `div` that should be a `button`
- works on desktop, not touch → `mouseleave`/hover doing load-bearing work

## The fix, and why not the obvious one

Fix **containment at the boundary**:

```js
document.addEventListener("click", function (e) {
  if (!openPane) return;
  var t = e && e.target;
  if (t && typeof t.closest === "function" && t.closest(".my-pane")) return;
  openPane = false; render();
});
```

Not `stopPropagation()` on each control inside the pane. ⚠️ **A container grows
new children** — here `reviewer_signin.js` mounts a whole sign-in form into the
pane — and every one of them would have to remember. One test at the boundary
cannot be forgotten by a control that does not exist yet.

⚠️ **Guard both directions.** A fix that stops the pane closing on an inside
click can just as easily stop it closing at all. Assert both:

- a click **inside** leaves it open
- a click **outside** still closes it

## Finding others

```
grep -rn 'document.addEventListener("click", function () {' --include=*.js .
```

The no-argument handler is the tell: it cannot be checking where the click came
from. In this repo the sweep found **one** — 47 other sites already did a
containment check, which is why this one read as an oddity rather than a pattern.
