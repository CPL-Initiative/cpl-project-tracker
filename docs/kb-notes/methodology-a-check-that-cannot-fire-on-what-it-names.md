---
title: A check that cannot fire on what it names — disabled controls, and the falsification pass
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, accessibility, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - scripts/a11y.js
  - tests/ccr_skyview_pinch.test.js
---

# A check that cannot fire on what it names — disabled controls, and the falsification pass

> **One-sentence summary** — Two failures share one shape: a check that reports a
> finding its subject can never satisfy, and a check that passes for a reason
> unrelated to what it claims to guard; reverting each line and re-running is
> what tells them apart.

## Half one — a finding the subject cannot clear

`npm run a11y` reported *"1 focusable with no ring: `button#u-iso`"* on five
routes of one page, every run. No CSS could clear it, and the button's focus
styling was correct.

The button is **disabled** until something is selected — by design. The harness
enumerated `button`, called `el.focus()`, and read the computed outline.
`focus()` is a **no-op on a disabled element**, so `:focus-visible` never
matches, so there is no ring — for a reason that is not a defect. WCAG asks for a
visible indicator on what *can* be focused; a control that declines focus is not
in scope.

The harness already handled the same shape ten lines above, for a closed
`<details>`: Chromium hides its content with `content-visibility`, so the rect is
real while `focus()` is a no-op. ⚠️ **The two cases have opposite fixes** — a
closed section is *opened* for the measurement, because the reader can reveal it;
a disabled control is *skipped*, because there is nothing to reveal.

**The tell**: a finding that is stable across every run, on a control whose
styling is demonstrably right, is usually a finding the subject cannot clear.
Before styling it again, ask what state the subject is in when the check runs.

⚠️ **And establish whether it is yours.** Running the sweep against a stashed,
unmodified checkout took two minutes and turned "a red check on my branch" into
"a standing red on every view that disables a control" — a different fix, in a
different file, with a different blast radius.

## Half two — a check that passes for the wrong reason

The same run produced a check asserting *"the release that ends a pinch selects
nothing"*. It passed. It also passed with the pinch handling entirely reverted —
because a wide two-finger spread moves each finger far enough to set
`drag.moved`, and the click branches decline on their own. The check was green
for a reason that had nothing to do with the code it named.

The replacement pinches by six pixels on a point first proven to be a live target
by a single-finger tap. That one fails with the guard removed.

## The practice: falsify each check against its own line

For every check that claims to guard a specific line, **revert that line, re-run,
and record what went red.** It costs a minute per check and produces three
outcomes, all of them useful:

1. **The named check fails** — the mapping is real. Write it down.
2. **A *different* check fails** — the coupling is not what you thought. In this
   run, removing the pinch's `pointerup` early return did not fail the selection
   check; it failed *"one finger still pans"*, because the early return is what
   calls `endPinch()`. That is the loud symptom, and it belongs in the comment.
3. **Nothing fails** — either the line is redundant, or the check is decoration.
   Both need a decision. Here, `setIsolate(res.isolate === true && tokens.length
   > 0)` sat after an early return that had already proved the selection
   non-empty: the condition was unreachable-false and was removed, because a
   condition that cannot fail describes a case that cannot happen and the next
   reader has to work out which.

⚠️ **Where a guard is deliberately doubled, say so.** Two checks here survive
either single revert and fail only when both belts go. That is a design choice —
a pinch must never leave the reader on a course they did not pick — and stating
it in the suite header is what stops someone "simplifying" one away on the
grounds that the tests still pass.

## Why this keeps recurring

The repo has now recorded three variants within two days:
`methodology-a-count-based-guard-passes-when-its-subject-disappears`,
`methodology-a-pipelines-exit-status-is-its-last-commands`, and this one. The
common root is that **a green check is evidence about the check, not about the
code**, until someone has seen it go red for the stated reason.
