---
title: "Answer a reviewer's \"make a version that…\" with a switch on the same page, not a second page"
created: 2026-09-07
updated: 2026-09-07
tags: [methodology, prototyping, review, skyview, design]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
artifacts:
  - docs/visuals/2026-09-07-skyview-globe-prototype.html
---

# Answer a reviewer's "make a version that…" with a switch on the same page, not a second page

> **One-sentence summary** — When a reviewer asks to see an alternative, build it as a control beside the current behavior so both are judged on the same data at the same zoom, and delete the loser the moment they decide.

## Context

Prototype review runs on reactions. Sam's came in the shape *"Can you make a
version that keeps the spheres round rather than oval in areas? I want to see
how the difference is perceived."* A second page, or a second artifact link,
answers the words and loses the comparison: the reviewer holds two states in
their head, at two zooms, and nothing records what was compared.

## The claim

Build the alternative as a switch on the page the reviewer already has —
*Round | Wrapped*, *Committed | Spread | By kind*, a row of color chips — with
the data, the zoom and the rest of the controls shared. The reviewer flips
between them and rules at once, on sight. When they rule, the losing control
leaves the header the same day; a control that has been decided against is
noise from then on.

## How we got here

The globe prototype went through three rounds in one afternoon this way
(2026-09-07). *Round | Wrapped* answered the ovals and was retired the same
hour: *"Now I don't think we need the wrapped option."* The chips answered
*"provide a chip to adjust MID color"* and settled Silver on sight. *By kind*
sat beside *Spread* and *Committed* so the order could be judged against the
neighborhoods it gave up. Every round's history is in
[`ccr_atlas_lessons`](../ccr_atlas_lessons.md).

## When this applies (and when it doesn't)

It applies to choices a reader can judge by looking: a shape, a color, a
placement, a projection, a pace. It does not settle a measurement (the coverage
line takes its numbers from one universe whatever the switch says) or a rule
(the glyph rule is not a toggle). And it is for prototypes: a shipped view keeps
one behavior, decided, with the switch gone.

## See also

- [`methodology-a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range`](methodology-a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range.md)
- The MAP-team obligation *Show, don't describe* in `CLAUDE.md`
