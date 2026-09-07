---
title: "A globe shows a hemisphere: real estate on a screen is the zoom range, not the surface"
created: 2026-09-07
updated: 2026-09-07
tags: [methodology, skyview, projection, design, prototyping]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[docs/kb-notes/methodology-answer-a-reaction-with-a-switch-not-a-version]]"
artifacts:
  - docs/visuals/2026-09-07-skyview-globe-prototype.html
  - prototype/globe/globe_layout.py
---

# A globe shows a hemisphere: real estate on a screen is the zoom range, not the surface

> **One-sentence summary** — Wrapping a map onto a sphere changes what you see at once and what order the arrangement can carry; it does not add room, because room on a screen is the zoom range.

## Context

Sam asked (2026-09-07) whether SkyView's 2-D sky should become a rotating 3-D
globe *"so we could spread things out a bit more."* The ask recurs in any dense
map: a third dimension feels like more surface. The globe was built to look at
rather than argue about ([`ccr_atlas_lessons`](../ccr_atlas_lessons.md)), and
its own count line settled the question.

## The claim

A sphere adds no screen real estate. At any moment a hemisphere faces the
viewer, foreshortened toward the limb: 25,580 of 49,896 points at the globe's
opening view. Standing inside, a window 240° across holds 33,781, with the far
sky squeezed toward the edges. A near-square flat layout wrapped by longitude
and latitude is stretched 2.2 to 1 at the equator and pinched toward the poles,
so the islands read as ovals; made round, they only fit the sphere at 62% of the
wrapped scale, which is the same move as zooming out on the plane.

What a projection can add is an **order**. Placed by kind, with CTE disciplines
on one side of the sky and academic on the other, the arrangement says
something the committed layout does not, and that order would fit a plane just
as well.

## How we got here

Three rounds of the prototype in one afternoon, each with the count of points
in view printed under the controls; the layout relaxation
(`prototype/globe/globe_layout.py`) that reports overlaps and clearance at each
island scale; Sam's own reading of the ovals: *"maximizes sky space... but
perhaps if you adjust downward the relative size of your entities, circles
might work. Since we can zoom almost infinitely, nothing lost."*

## When this applies (and when it doesn't)

It applies to any ask that reaches for a third dimension, a sphere, or a bigger
canvas to relieve density: the relief is a zoom range and a label placer that
drops rather than stacks. It does not say a globe is worthless. A projection
that carries a meaning (by kind), a form a reader is drawn to (the window onto
the night sky), or a feeling of a whole are real gains; they are just not area.

## See also

- [`methodology-answer-a-reaction-with-a-switch-not-a-version`](methodology-answer-a-reaction-with-a-switch-not-a-version.md)
- [`methodology-verify-an-ask-against-what-the-reader-sees`](methodology-verify-an-ask-against-what-the-reader-sees.md)
