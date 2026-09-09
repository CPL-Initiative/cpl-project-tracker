---
title: One symptom, two causes — and fixing the obvious one changes nothing
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, ui, measurement, debugging]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - prototype/ccr_universe.js
  - tests/ccr_skyview_mobile_row.test.js
---

# One symptom, two causes — and fixing the obvious one changes nothing

> **One-sentence summary** — When a user reports a symptom with an obvious cause,
> measure what the symptom is actually made of before fixing the obvious cause,
> because a second independent cause can absorb the entire win.

## The case

Sam, 2026-09-09, on SkyView's header on a phone: *"It now takes up half the
screen."* The obvious cause was the header, and the obvious fix was to make it
smaller. Both were correct and both were insufficient.

Measured at 390×844 before building:

| | |
|---|---|
| `#u-top` | 254px over four wrapped rows — **30%** of the viewport |
| the map | 523px — **62%** |
| the legend below it | **430px**, *more than the header* |

Two findings the report did not contain. First, the honest figure was **81% of a
screenful is not the map** — his "half" was low. Second, and the one that
mattered: the canvas was not taking what the header left. `fitCanvas()` tested
`window.innerWidth < 700` *before* it tested whether the view was the map-alone
view, so on any phone the canvas was assigned `0.62 × innerHeight` — 523px at
844, which is exactly the canvas that was there.

**The header and the canvas height were independent.** Shrinking the row from
254px to 114px would have freed 140 pixels that had nowhere to go: the canvas
would still have been 523px, and the reported symptom would have been about half
fixed while looking, in the code review, entirely fixed.

## Why the obvious cause is the dangerous one

A plausible cause invites you to stop looking. It is plausible *because* it is
genuinely part of the mechanism, so it survives every check short of measuring
the outcome — and the outcome is the one thing a code review cannot see. The tell
here was arithmetic: 254 + 523 = 777 against an 844px viewport, and the 67px
remainder is not the legend (430px). Numbers that do not add up are the cheapest
possible signal that a second mechanism is present.

## The practice

- **Measure the symptom's composition, not just its cause.** "The header is 30%"
  is a cause. "30% header, 62% map, and the map is pinned by arithmetic" is the
  composition, and only the second says how much the fix will buy.
- **Predict the win before making the change, then check it.** Here the
  prediction (header 254 → 114 ⇒ map 523 → 663) would have failed against the
  measurement, which is what surfaced the second cause.
- **Re-measure after, at the same widths.** The final numbers were header 114px,
  map 730px (86%) — reachable only with both causes fixed.
- **A third cause is not rare.** With both fixed the canvas still opened at
  451px, because `fitCanvas` had run before the row settled and nothing re-ran
  it. Three mechanisms, one symptom.

## The generalization

This is the same shape as `methodology-a-correct-measurement-can-name-the-wrong-place`
seen from the other side: there, a correct number pointed at the wrong file;
here, a correct diagnosis covered only part of the effect. Both are defeated by
the same discipline — **state what the fix should produce, in numbers, before
making it.** A fix that lands its predicted number is finished. A fix that lands
a smaller one has a companion you have not found yet.
