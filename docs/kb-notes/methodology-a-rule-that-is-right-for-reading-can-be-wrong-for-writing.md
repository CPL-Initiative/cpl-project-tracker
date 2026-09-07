---
title: A rule that is right for reading can be wrong for writing
created: 2026-09-07
updated: 2026-09-07
tags: [methodology, ui, hit-testing, curation, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/kb-notes/methodology-a-snapshot-cannot-be-the-authority-on-intent]]"
artifacts:
  - prototype/ccr_universe.js
  - tests/ccr_skyview_drop_target.test.js
---

# A rule that is right for reading can be wrong for writing

> **One-sentence summary** — a disambiguation rule tuned for *what am I looking
> at* will quietly break *where does this go*, because the two verbs want
> opposite answers from the same pixel.

## Context

SkyView draws course identities as circles. Opening one rings it with the college
courses it carries, and that ring **spreads** outward so the names can be read —
far enough that a member star routinely lands on top of a neighboring identity's
circle.

An earlier round measured that and fixed it: with the pointer exactly on a drawn
star, 110 of 120 hits returned the *identity* card instead of the *course* card,
and reading those courses is the whole reason the ring exists. So the hit test
was given a rule — **a focused identity's own members outrank the circle they
overlap**. That rule was correct, and it is still correct.

Then a curator reported that drag and drop had stopped working. Nothing was
wrong with the drag.

## The claim

**A hit test answers a question, and different verbs ask different questions.**
The same pointer position over the same pixels means *this course* to a reader
and *that identity* to someone carrying a course to it. A rule that resolves the
ambiguity for one of them will silently resolve it wrongly for the other.

Here the drop resolved to a star, the star belonged to the identity the course
was **already in**, and the move was refused as a no-op. Measured in Chromium
with one identity open at 296% zoom: **six identity circles inside the viewport
sat under one of that identity's own stars**, and a drop on each of the first
three moved nothing.

The fix is not to weaken either rule but to **parameterize the hit test by the
verb** — one extra argument, `forDrop`, that resolves circles only while
something is being carried. Reading kept its rule intact (24 of 24 drawn stars
still open the college course).

## Why it is easy to miss

1. **The symptom names the wrong variable.** The report was *"no longer
   responsive after the 2nd drag and drop"*, and the second drag is fine —
   repeating the same gesture eight times in a row all landed. What varies is the
   destination, not the count. Reproducing the literal report confirms the code
   works and sends you looking somewhere else.
2. **The refusal was invisible.** The message printed in a status line at the
   foot of the window, and the pane that records staged moves is not painted at
   all in the full-window view. A refusal nobody can see is indistinguishable
   from a dead control — which is exactly what the reader reported.
3. **Both rules were separately verified.** Neither the reading fix nor the
   drop path had a bug in isolation. The defect lives in the seam.

## What to do

- When a pointer-resolution rule is tuned for one interaction, **name the verb
  in the rule** and ask what the other verbs would want from the same pixel.
  Write both answers down where the rule lives; a comment saying only *why the
  star wins* invites the next reader to extend it to a case it was never
  measured against.
- **Make the destination legible before the release.** Ring the target and name
  it under the pointer. A drop that lands on nothing and a drop that is refused
  leave the screen identically; only a pre-commitment tells them apart.
- **Never let a refusal print somewhere the reader is not looking.** Check what
  the surface actually paints in the mode people use — here, the default view
  hides the pane the receipt was pointing at.
- **Guard the arrangement, not the coordinate.** The regression test builds the
  eclipse deliberately (it moves a second identity onto one of the drawn stars)
  rather than hunting for it in the live layout, so the guard survives a layout
  rebuild. Reverting the fix makes it fail with the reported symptom, verbatim.

## Where this has bitten before

The same shape, one layer up: a snapshot of what survived, used as the authority
on what the reader *meant* — see
[`methodology-a-snapshot-cannot-be-the-authority-on-intent`](methodology-a-snapshot-cannot-be-the-authority-on-intent.md).
In both cases a mechanism that was right for the case it was measured on was
carried, unexamined, onto a case with the opposite requirement.
