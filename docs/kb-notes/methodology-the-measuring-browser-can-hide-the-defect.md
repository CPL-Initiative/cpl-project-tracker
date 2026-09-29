---
title: The measuring browser can hide the defect
created: 2026-08-20
updated: 2026-08-20
tags: [methodology, testing, verification, accessibility, browser, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect]]"
  - "[[docs/public_pages_a11y_lessons]]"
artifacts:
  - scripts/check_public_page_layout.js
  - tests/public_pages_a11y.test.js
---

# The measuring browser can hide the defect

> **One-sentence summary** — a behavioral check runs in ONE engine, and that
> engine's forgiveness becomes your test's blind spot, so when the browser is
> more permissive than the browsers you ship to, the ATTRIBUTE is the check and
> the behavior is only a regression guard.

## Context

Session 173 established the split that fixed the Fact Sheet: structure in jsdom,
geometry in Chromium, because *jsdom has no layout engine*. Session 175 pointed
the same instrument at Sierra and found the sequel — the Chromium half has a
blind spot of its own, and it is not the one you would guess.

Sierra's conversation log is `overflow-y:auto` with no `tabindex`. A scroll
container that is not focusable is unreachable by keyboard (WCAG 2.1.1), and the
log was reachable only by accident: the starter chips inside it are focusable,
and `submit()` **removes them after the first question**. So the log was
reachable while it was empty and had nothing to scroll, and stopped being
reachable the moment it filled up.

Two behavioral checks were written for it. Both passed against the **pre-fix**
page.

## The claim

**Chromium 127+ ships "keyboard-focusable scrollers": an element that ACTUALLY
OVERFLOWS is focusable with no `tabindex` at all.** Measured directly on
Chromium 141 — an overflowing `div` takes focus, an identical non-overflowing
one does not. So in a Chromium harness:

- `document.activeElement === log` after `log.focus()` → **true, pre-fix.**
- focus it and press `End`, then assert `scrollTop > 0` → **passes, pre-fix.**

Neither check was badly written. Both asked the right question and got the
answer the *measuring* engine gives, which is not the answer every engine gives —
and Chromium's implicit focusability grants the region **no role and no
accessible name**, so even where it works it is not the same thing as the fix.

The rule that follows:

> When the instrument is more permissive than the population you ship to, assert
> the **attribute**, and label the behavioral check a **regression guard**.

This is the inverse of the Session-173 lesson and completes it. There, the
instrument was too *weak* to see the defect (jsdom, no layout). Here it is too
*strong* — it repairs the defect before the check can observe it. Both are the
same question: *can this instrument distinguish the broken state from the fixed
one?* If you cannot make a check fail on purpose, you do not know what it tests.

## How to apply it

1. **Run every new check against the unfixed code.** `git stash` the source fix,
   keep the harness, re-run. This run: 38 of 44 jsdom checks failed pre-fix, and
   every Chromium check failed except the two above — which is exactly how the
   blind spot surfaced.
2. **When a check passes both ways, find out why before calling it a regression
   guard.** "Passes both ways" and "cannot fail" look identical in a green run.
   Here the reason was a browser feature nobody had in mind.
3. **Prefer the attribute for anything the platform may paper over.** Focusable
   scrollers, implicit ARIA roles, autofilled accessible names from `title`,
   form validation — all places where one engine is kinder than the spec.
4. **Write the reason next to the check**, not in the commit message. The next
   person to see it green has no way to reconstruct why it is weak.

## Caveats

- This does **not** demote behavioral checks in general. Where the engines
  agree, behavior is the better check — the map's markers were genuinely
  mouse-only, and `Enter` on a focused pin failing pre-fix and passing after is
  a real proof.
- The Fact Sheet's `.tbl-wrap` region has the same nuance and is unaffected in
  practice: `factsheet.js` sets `tabindex` explicitly, and its check reads the
  attribute.
- Chromium's behavior is a genuine improvement for users of Chromium. The point
  is only that it cannot be relied on as *the* fix, and must not be allowed to
  stand in for one during verification.
