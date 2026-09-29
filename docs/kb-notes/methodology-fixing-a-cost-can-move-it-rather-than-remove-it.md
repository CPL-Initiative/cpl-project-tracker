---
title: "Fixing a cost can move it rather than remove it — and only a second profile says which"
created: 2026-09-08
updated: 2026-09-08
tags: [methodology, performance, measurement, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-correct-measurement-can-name-the-wrong-place]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
---

# Fixing a cost can move it rather than remove it

A profile names the function that was *holding the bill* when the sample landed.
It does not name the function that *incurred* it. When those differ, removing the
first one hands the bill to whoever is next in line, the profile changes
completely, and nothing gets faster.

## The case

SkyView's Sky, 2026-09-08. `measureText` was **11.2% of the profile** — the
largest named JS entry — against `textW`, its only caller, at 0.5%. Fifteen calls
a frame, roughly half a millisecond each.

The cause looked plain. `textW` memoized on `ctx.font + "\0" + string`, and an
island label's size comes from its drawn radius: `18.0263px`, `18.2506px`,
`18.1185px`, a fresh float every frame as the sky turns. The memo never hit once.
Fixing it — measure at a fixed reference size, scale the result — took the calls
from **15.4 a frame to 0.17**.

The next profile had **`strokeText` at 9.6%, up from 0.6%**. Total time barely
moved.

Chromium builds a font object at its **first use**, not when `ctx.font` is
assigned. The drifting size meant a font had to be built every frame no matter
what. `measureText` had merely been standing first in the queue; with it out of
the way the stroke inherited the same work. The memo was never the problem — it
was the *messenger*.

The actual fix was to stop the size drifting at all: round the drawn size to whole
pixels, with a dead band so a value hovering near a boundary cannot flip back and
forth. Then `strokeText` fell out of the profile too, and the frame went from a
median **81 ms to 46 ms**.

## The rule

**Re-profile after the fix, and compare totals, not entries.** An entry
disappearing from the top of a profile is not evidence that the work stopped —
only that some *other* frame is now holding it.

Three questions worth asking before believing a performance fix:

1. **Did the total move?** Frame time, wall clock, throughput — a number that
   cannot be shuffled between functions. If only the ranking changed, nothing
   happened.
2. **Who else touches this resource?** A lazily-built resource (a font, a shader,
   a compiled regex, a prepared statement, a connection) is built by whoever
   reaches it first. Removing one caller promotes the next.
3. **Am I fixing the consumer or the cause?** "This function calls the expensive
   thing too often" and "the expensive thing is expensive because the input keeps
   changing" are different diagnoses with different fixes, and the first one is
   always the more obvious.

## Why it recurs

The first profile is genuinely informative and its top entry is genuinely real —
which is exactly what makes stopping there feel finished. The fix is verified
against the property it changed (calls went down, and they did), so it passes
every check the author thought to run.

This is the same failure as
[`a correctness fix and an appearance fix are different claims`](methodology-a-correct-measurement-can-name-the-wrong-place.md)
one level down: **verifying the property you changed is not verifying the outcome
you were asked for.** The outcome here is a frame time. Only a frame time can
confirm it.
