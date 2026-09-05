---
title: The mark is not the footprint — draw inside what you packed, and spread at load
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, skyview, layout, canvas, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
artifacts:
  - prototype/ccr_universe.js
  - tests/ccr_skyview_universe.test.js
---

# The mark is not the footprint — draw inside what you packed, and spread at load

> **One-sentence summary** — A packed layout can be made airy without moving a
> point: draw each mark smaller than the footprint it was packed with, move
> whole clusters apart once at load, and let tests read positions from the
> page's copy rather than from the fixture.

## Context

SkyView's map is packed by a builder — every course has a footprint, every
discipline a circle — into a 7 MB payload that is committed and that no
workflow regenerates. Sam, with Obsidian's graph beside it (2026-09-05):
*"see how it spreads more"* and *"spread out the disc and course circles more
for readability."* Repacking meant a payload diff; the readability he wanted
did not need one.

## The claim

1. **Separate the mark from the footprint.** The packing radius is what keeps
   points from overlapping; the drawn radius is what the eye sees. Drawing the
   mark at two thirds of the footprint doubles the air between neighbors and
   moves nothing — hit-testing, labels, drags and tethers keep the footprint.
2. **Spread clusters as a load-time transform.** Moving each cluster's center
   away from the map's center by a factor, translating its points with it and
   rescaling the bounds, is one pass over the data at load, idempotent behind
   a flag, and a single constant to tune. The builder's packing stays true.
3. **A fixture coordinate is where a point was packed, not where it is
   drawn.** Tests that fly to typed coordinates break the moment the page
   transforms its data; read the position from the page's own copy
   (`AT(id)`) and the test survives every knob.
4. **Say why the client and not the builder.** The transform belongs in the
   client only while the payload is expensive to regenerate or the factor is a
   matter of taste; the note in the code names both, so a later session with a
   cheap rebuild can move it back.

## How we got here

The dot rendering and the ×1.22 spread shipped together on 2026-09-05; six
jsdom checks that flew to `-120, 0` failed until the tests read positions
from the fixture the page had already spread.

## When this applies (and when it doesn't)

Any canvas or SVG view drawn from a packed layout: maps, graphs, treemaps. Not
for layouts the client computes itself (change the packing there), and not
when the marks carry text that needs the full footprint to stay legible.

## See also

- `[[docs/ccr_atlas_lessons]]` — the 2026-09-05 afternoon section
- `[[docs/reference/lanes/skyview-ccr-interface]]` — the knobs

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
