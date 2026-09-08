---
title: "A bug report is evidence, not diagnosis — and the control that kills your favorite hypothesis"
created: 2026-09-07
updated: 2026-09-07
kb-status: published
type: methodology
tags: [debugging, measurement, methodology, skyview, video, profiling]
related:
  - "[[methodology-verify-an-ask-against-what-the-reader-sees]]"
  - "[[methodology-a-correct-measurement-can-name-the-wrong-place]]"
  - "[[docs/ccr_atlas_lessons]]"
---

# A bug report is evidence, not diagnosis

On 2026-09-07 Sam sent three screen recordings of SkyView, each with one
sentence of description. They contained six real defects. **Not one of the three
sentences named its own cause**, and the two most plausible explanations for the
headline symptom were both wrong.

This note is about the method that survived that, because the method is
transferable and the specific bugs are not.

## The report describes the symptom in the reporter's vocabulary

> *"note how the skyview flickers around"*

"Flicker" is what a reader calls any unstable image. It could be a strobe, a
judder, a tear, a repaint, a z-fight, or content appearing and disappearing. The
word narrows nothing. Two of the causes turned out to be things no reader could
have named: an animation clamp set below the frame time, and a zoom threshold
being crossed per-object by a projection's local scale.

> *"Staged move seems to clear but I can't drag it to the new home"*

This sounds like a bug in the *Put back* button. It was not. Put back worked
perfectly. The defect was that an earlier action had left a drag state set, and
a guard was silently swallowing every subsequent pick-up. The reporter correctly
described **what they could not do**; the causal clause in the middle was their
inference, and it pointed away from the bug.

⭐ **Read the report as two separate things: an observation, which is data, and
an attribution, which is a hypothesis with no more standing than yours.**

## Measure before you theorize — and let the measurement find the frame

A 12-second recording is 370 frames. Rather than scrub it, compute a per-frame
difference and let the numbers point:

```python
# mean absolute difference between consecutive frames
d = sum(abs(a-b) for a,b in zip(cur, prev)) / len(cur)
```

This immediately showed change on a strict two-frame cycle, and singled out the
pair where whole islands lost their dots while keeping their labels and discs.
That asymmetry — labels drawn, dots not — is what identified the responsible
line, because only one branch in the draw path can produce it.

The same move applies to a color complaint: sample the pixel, compare it to the
palette tokens. `rgb(34,29,49)` in a JPEG frame against `#2E2A44` in the
stylesheet is a match, and it named the token in one step.

## Build the rival hypothesis and run the control

Two very plausible causes were proposed, built, and **falsified**:

| variant | per-frame diff |
|---|---|
| as shipped, turning | 18.1 |
| twinkle removed | 19.5 |
| alpha quantization removed | 18.2 |
| **as shipped, turn stopped** | **0.000** |

The twinkle and the 8-step alpha bucketing across 27,000 stars were both
excellent stories. Neither moved the number. The *stopped* control is the one
that mattered: exactly zero says every bit of the change comes from the turn, so
no amount of work on the stars was ever going to help.

⭐ **A hypothesis you have not tried to kill is a preference.** Building the
variant costs minutes; shipping the wrong fix costs a release and the reporter's
trust.

## ⚠️ Beware the metric that improves because the thing stopped existing

One variant dropped the per-frame difference from 18.26 to 2.69 — a sevenfold
improvement, and very nearly shipped. It was an artifact. The change had made a
threshold comparison true for every object at once, so **no dots were drawn at
all**. An empty canvas is extremely stable.

The tell was that the improvement was too large and too uniform. The check is to
ask what the metric would read if the feature were simply deleted, and confirm
your result is not that number.

⭐ **Every "improvement" needs a second observable that would notice a
regression.** Here it was ink coverage; a diff metric alone could not tell
"smooth" from "blank."

## A constant tuned for a global scale becomes a flicker gate when the scale goes per-object

The deepest of the six bugs generalizes. A zoom band written for a flat map —
one scale for the whole view, crossed deliberately by the reader — was reused on
a projection where each object has its own local scale that drifts continuously
as the view moves. The same comparison that was a deliberate mode switch became
a per-object coin flip: 18 of 159 objects sat within ±3% of the threshold, and
11 crossed it inside 120 frames.

⭐ **When a scalar becomes a field, every threshold on it needs hysteresis.** And
whatever remembers which side it is on must be read by the hit-test too, or the
eye and the hand disagree about what is there.

## The corollaries worth keeping

- **`npm test` passing proves nothing about a frame rate, a color, or a
  pointer.** All six defects were invisible to 309 green jsdom suites. Two were
  caught only by driving a real browser; one was caught only by `npm run a11y`.
- **Profile before you optimize, even when a previous session left you a
  lever.** A prior handoff named the canvas as the frame budget's bottleneck. It
  was 4% of the frame. The cost was per-point JavaScript and text measurement.
  A confident, committed, wrong lever is more expensive than no lever.
- **Sometimes the reporter's own aside is the better fix.** Asked for a Back
  button that restores focus, Sam added *"maybe best way to avoid this is to make
  it a popup."* That removes the state-restoration problem instead of solving it.
  **The cheapest way to preserve state is not to leave.**
- **A fix can reverse an earlier session's committed assertion**, and when it
  does, say so where the assertion lives. A test here pinned "this row has no
  drag button" for good reasons that turned out to cost the reader the obvious
  correction. The check was changed *and* the old reasoning named in a comment,
  so the next session does not restore it as a regression.
