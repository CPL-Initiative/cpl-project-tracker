---
title: "A correct measurement can name the wrong place — re-check the attribution, not just the number"
created: 2026-09-06
updated: 2026-09-06
tags: [methodology, measurement, skyview, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-fix-can-be-right-about-the-complaint-and-wrong-about-the-axis]]"
  - "[[methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names]]"
---

# A correct measurement can name the wrong place

A handoff hands you a number. The number is right, the symptom is right, the
trigger is right — and the **element it blames is wrong**. You then fix the
thing that was named, the fix looks correct in review, and nothing changes on
screen.

This happened twice in one session (S235, 2026-09-06), from two different
inherited diagnoses, which is what makes it a shape rather than an accident.

## Case 1 — the number was right, the element was not

S234 measured SkyView's suggestion dropdown dropping **36px on the fourth pick
at 1440px** and attributed it to `#u-bar` growing 30 → 76.

Every part of that is correct except the last clause. Walking the real ancestor
chain of `#sug` in Chromium:

| element | height before → after | top before → after |
|---|---|---|
| `#sug` | 620 → 620 | **40 → 76** |
| `.sugwrap` | **30 → 66** | 6 → 6 |
| `#u-bar` | *not in the chain* | — |

`#u-bar` never changed. `.u-tokens{display:contents}` makes each chip a flex
child of `.u-search-slot .sugwrap`, so that is the element that wraps.

**A `min-height` on `#u-bar` would have shipped, reviewed clean, and moved
nothing.** Worse, it would have looked like the fix had been tried and failed,
which is how a real defect gets reclassified as unfixable.

## Case 2 — the symptom was right, the moment was not

Sam predicted that leaving SkyView for a work surface and returning would lose
his welding picks, and it did. The obvious reading — the one everybody had,
including the triage — is that the rebuild **on return** discards them.

Measured: `__ccrTokenKeys()` already reads `[]` **on the work surface**, before
any return. `homeSearch()` called `clearTokens()`, and `setCrumbs()` calls
`homeSearch()` on *every* view entry. The picks died on the way **out**.

Every hour spent making the return path non-destructive would have fixed
nothing, because by then there was nothing left to preserve.

## Why this shape is common

A measurement has two halves — **what happened** and **where it happened** — and
only the first half is what you observed. The second is an inference drawn at
write-up time, when the observer is looking at the code and reasoning about
which element *ought* to be responsible. That inference is unlabeled in the
handoff: it reads with exactly the same confidence as the measured number
beside it.

So the number gets re-verified (it survives) and the attribution never does.

## The rule

**When you inherit a measurement, re-measure the attribution, not just the
number.** Cheaply:

- **Walk the real chain**, don't reason about it. For layout, print
  `getBoundingClientRect()` for every ancestor before and after the trigger and
  see which one actually moved. It costs one script.
- **Measure one step EARLIER than the reported symptom.** If state is missing on
  return, check it on departure. If a value is wrong at the consumer, read it at
  the producer.
- **Ask what the fix would prove.** If the fix aimed at the named element could
  pass review while changing nothing observable, you have not yet located the
  defect — you have located a plausible story about it.

## The tell

In both cases the giveaway was available before any code was written: the
inherited claim named an element or a moment that the reporter **had not
printed a value for**. The 36px was measured; `#u-bar` was reasoned. The reset
was observed; "on return" was assumed.

**Values are evidence. The nouns around them are usually inference.**
