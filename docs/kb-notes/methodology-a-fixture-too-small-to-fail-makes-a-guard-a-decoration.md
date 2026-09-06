---
title: A fixture too small to reproduce the defect makes the guard a decoration
created: 2026-09-06
updated: 2026-09-06
tags: [methodology, testing, fixtures, perturbation, false-green, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-harness-must-verify-its-own-fixture]]"
  - "[[docs/kb-notes/methodology-a-floor-lives-in-fixtures-as-well-as-code]]"
  - "[[docs/ccr_atlas_lessons]]"
artifacts:
  - tests/ccr_skyview_hover_disc.test.js
  - tests/ccr_skyview_universe.test.js
  - prototype/ccr_universe.js
---

# A fixture too small to reproduce the defect makes the guard a decoration

> **One-sentence summary** — a test written against the nearest existing fixture
> can assert the right thing and still be worthless, because the fixture never
> creates the condition the bug needs; perturbation is what exposes it, and the
> fix is to size a fixture for the defect rather than to reword the assertion.

## What happened

Two SkyView defects were fixed on 2026-09-06 and guarded in the suite that
already covered that surface, `tests/ccr_skyview_universe.test.js`. The
assertions were correct and specific:

- every college course on an opened identity hovers to its own card, not the
  identity's;
- no painted disc outgrows the canvas.

Both passed. Then both were perturbation-tested — the fix reverted, the test
re-run, expecting red:

```
=== P: remove the focused-member rule ===   222/222 checks passed
=== P: un-clamp the halo ===                222/222 checks passed
```

**Both guards were decorations.** That fixture holds 6 identities and 11 member
courses. The hover bug needs an opened identity whose ring of college courses
*spreads across a neighboring identity's circle* — with 11 members spread over 6
identities, no ring ever reaches a neighbor. The disc bug needs a disc whose
radius exceeds the canvas — the radius scales with the member count, and the
largest disc that fixture can draw is 17px against a 252px cap.

Neither test could fail. Both would have shipped, and the next session would have
read them as protection.

## Why the assertion was not the problem

The instinct on a passing perturbation is to suspect the assertion — to make it
stricter, or to check a different property. That was wrong here twice. The
assertions were already exactly right; re-reading them found nothing, because
nothing was wrong with them. What was missing was upstream of the assertion:
**the state under test never existed.**

The diagnostic question is not *"is my assertion strong enough?"* but ***"can
this fixture produce the condition the bug needs?"*** For a defect that only
appears at density, at scale, or past a threshold, the answer from a
convenience fixture is usually no.

## What to do instead

`tests/ccr_skyview_hover_disc.test.js` is a new file whose fixture exists for
these two defects and says so in its header: **120 identities packed two units
apart, one of them carrying 30 college courses** — the shape of a real
well-adopted course (WELD M1109 is taught at 24 colleges). On that fixture the
perturbations behave:

```
=== P: remove the focused-member rule ===   9/10  (16 of 30 stars → wrong card)
=== P: un-cap the glow ===                  9/10  (3 of 3 glows past 132px, largest 983)
=== restored ===                            10/10
```

The failure output now *reproduces the user's report in words* — `WELD 111 ->
WELD M1099 Welding Practice 99` is a hover landing on a different identity,
which is precisely what was reported.

- **A new fixture is cheaper than a wrong one.** Adding density to a shared
  fixture risks every other assertion built on its counts; a purpose-built file
  costs one harness and is free of that coupling.
- **Say in the file why the fixture is that size.** A future reader who
  "simplifies" it back down to six identities re-creates the decoration, and
  nothing will fail to tell them.
- **Sizing is derivable.** The disc's radius comes from `nodeRad`, which comes
  from the row count and the zoom; reading the formula said 2,500 rows at
  reading zoom would clear the cap. That beat guessing.

## The general rule

**Perturbation is not a formality you run after the test passes — it is the only
thing that distinguishes a guard from a decoration**, and when it comes back
green the first suspect is the fixture, not the assertion. A defect that needs
density, overlap, scale or a threshold needs a fixture built to produce it, and
that fixture is part of the fix, not an accessory to it.
