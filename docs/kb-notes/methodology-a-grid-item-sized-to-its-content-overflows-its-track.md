---
title: A layout that cannot shrink does not wrap — it overflows and paints over its neighbour
created: 2026-09-04
updated: 2026-09-04
tags: [methodology, ui, css, layout, accessibility, first-light]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_lessons]]"
  - "[[docs/reference/engineering_ui_practices]]"
artifacts:
  - cobi_brand.js
  - cobi_orgs.js
  - scripts/check_cobi_header_layout.js
---

# A layout that cannot shrink does not wrap — it overflows and paints over its neighbour

> **One-sentence summary** — Three separate CSS defaults each silently give an
> element a minimum size it will not go below, and any one of them turns a
> responsive row into overlapping clusters as the viewport narrows; browser zoom
> is the usual way this gets discovered, because zooming *is* narrowing.

## Context

Sam, 2026-09-04, on the COBI masthead: *"the header is all a mess when I zoom in
or out, it gets messed up and ugly"* — with the site switcher painted straight
over the search box. The instinct is to treat this as a styling problem. It is a
sizing problem, and the sizes come from defaults nobody wrote down.

## The claim

**Zoom is not a separate case to handle. Zoom changes how many CSS pixels fit in
the window** — so walking the width range *is* walking the zoom range, and a
layout correct at every width is correct at every zoom. There is no zoom media
query to write.

**Three defaults each impose a floor**, and all three must be cleared or the row
overflows instead of wrapping:

1. **A bare `1fr` is `minmax(auto, 1fr)`.** The `auto` minimum means the track
   refuses to shrink below its content. Write `minmax(0, 1fr)` for any track
   that must be able to give way.
2. **A flex item's default is `min-width: auto`.** It will not shrink below its
   own min-content, and it drags its *container* past its grid track with it.
   Set `min-width: 0` on every nowrap cluster, not just the outermost one — the
   floor belongs to whichever descendant refuses to yield.
3. **A non-stretch `justify-self` sizes a grid item to its own content.**
   `justify-self: start` or `end` makes the item `fit-content`, so it can exceed
   the track it sits in even after (1) and (2) are fixed.

**The symptom is overlap, not clipping**, which is why it reads as a visual bug
rather than a sizing one: the overflowing cluster is still painted, just outside
its box and on top of whatever is next to it.

## How we got here

Measured, not reasoned. On `main`, at a 768px viewport, `.cobi-brand` drew
**580px of content inside a 322px grid track**, painting 240px across the
utility cluster. The floor came from `.cobi-orgswitch`, a flex item whose
default `min-width: auto` would not yield — the outer container already had
`min-width: 0` and it made no difference.

A Chromium harness across 17 widths (2560px → 360px) failed 19 of 136 checks on
`main`, including 78–158px of overlap at 1440px and 1280px — ordinary desktop
widths, not edge cases. After fixing all three defaults: 136/136.

Every one of 299 jsdom test files passed throughout, because jsdom returns zeroes
for every rectangle.

## When this applies (and when it doesn't)

**Applies** to any grid or flex row of nowrap clusters: mastheads, toolbars,
table headers, filter bars, card footers.

**Does not apply** to content that is allowed to clip or scroll inside its own
container — a wide data table in an `overflow-x: auto` wrapper is behaving
correctly, and forcing it to shrink would destroy it instead.

**Beware fixing only the track.** Each of the three defaults reproduces the
symptom alone, so a fix that changes `1fr` to `minmax(0,1fr)` and stops will
appear to work at the width it was tested at and fail elsewhere. Test a range.

## See also

- `[[docs/cobi_lessons]]` — the masthead rework this came from
- `scripts/check_cobi_header_layout.js` — the harness; fails 19/136 on the
  pre-fix code, so it guards the actual failure mode
- PR `#1469`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
