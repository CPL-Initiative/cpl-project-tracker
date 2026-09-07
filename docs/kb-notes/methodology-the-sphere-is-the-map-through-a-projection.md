---
title: The sphere is the map through a projection, not a second renderer
created: 2026-09-07
updated: 2026-09-07
tags: [methodology, skyview, ccr, ui, canvas, testing, globe]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[docs/kb-notes/methodology-a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range]]"
  - "[[docs/kb-notes/methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing]]"
artifacts:
  - prototype/ccr_universe.js
  - prototype/ccr_sky.json
  - tests/ccr_skyview_sky.test.js
---

# The sphere is the map through a projection, not a second renderer

> **One-sentence summary** — when a measured 2-D surface has to become a
> sphere, put a projection UNDER the existing draw and pick paths — each island a
> locally flat disc placed and scaled by its projected center's Jacobian — so every
> rule the flat surface earned is re-earned by construction rather than
> re-derived, and the old suites keep guarding it.

## Context

SkyView's flat map had five sessions of measured invariants: a drop lands on the
circle a curator aims at even when a star sits over it (S237), the label placer
drops rather than stacks, the member rings spread, the keyboard walks the node
graph, text keeps its size under zoom, and a staged move is marked on the model.
Sam ruled the globe in (2026-09-07). The obvious port — the prototype's point
cloud with a vertex shader — would have been a second renderer with none of
those rules, each to be rebuilt and each to drift.

## The method

1. **Place the islands, not the points.** The daily build puts each discipline's
   center on the sphere (`prototype/ccr_sky.json`, by kind). Nothing inside an
   island is recomputed.
2. **Linearize the projection at each center.** At the top of `draw()`,
   `prepSphere()` projects every island's center and the two points a thousandth
   of a radian east and north of it; the differences are the Jacobian — screen
   pixels per world unit east and down — and its determinant's root is the
   island's local scale. A point's place is one multiply-add from its island's
   offset on the flat map.
3. **Give the old functions an island.** `w2s(x, y, isl)` uses that island's
   frame; `nodeRad(nd, k)` takes the island's scale; `pick()` reads the same
   cache the frame drew from, so hit-testing and painting cannot disagree. The
   flat map is the identity case of the same code.
4. **Let the suites decide.** The drop-target fixture — a neighbor's circle
   placed exactly under the open identity's own star — was rebuilt on the curve
   through the sphere's own inverse and passed unchanged. The flat-map suites
   declare which view they measure with one harness line
   (`CPL_SKYVIEW_OPENS="map"`); the sphere has its own.
5. **Then pay only where the sphere is different.** At its opening width the
   sphere shows ~35,000 star-sized dots at once, where the flat map showed
   islands; the per-node path measured 117 ms a frame. A batched star pass —
   one filled path per color and alpha bucket, decorated points kept on the
   per-node path — brought it to 42 ms. That is the one piece of new rendering.

## Why it matters

A locally flat island is exact enough (the curvature across a 10° cap is a
cosine of 0.985) and it keeps every measured behavior for free. The cost of the
other road is not the first port but the second suite: two renderers with two
drop tests, two label placers and two ways for a mark to say "staged" will
disagree the first week nobody is looking.

## Related

- [[docs/kb-notes/methodology-a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range]]
  — what the sphere does and does not add.
- [[docs/kb-notes/methodology-a-slow-build-fingerprints-its-inputs-so-the-check-stays-cheap]]
  — the placement payload the sphere reads.
