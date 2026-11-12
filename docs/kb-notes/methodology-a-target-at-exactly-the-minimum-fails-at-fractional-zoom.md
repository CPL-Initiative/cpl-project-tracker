---
title: A target at exactly the minimum size fails at fractional zoom
created: 2026-11-12
updated: 2026-11-12
tags: [methodology, accessibility, target-size, library]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/library_lessons]]"
  - "[[docs/kb-notes/methodology-the-first-run-of-a-new-instrument-measures-the-instrument]]"
artifacts:
  - tests/public_target_floor.test.js
---

# A target at exactly the minimum size fails at fractional zoom

> **One-sentence summary** — a control styled at exactly WCAG 2.2's 24px target minimum renders a fraction under it at some browser zoom levels, so set the floor a pixel above the threshold.

## Context

Sam's Revise and remediate request on the public DSP Credit Starting Points page (2026-11-11) turned up eight targets
that failed WCAG 2.2's 2.5.8 target size though their CSS said `min-height:24px`. Lessons: [`library_lessons`](../library_lessons.md), *S641*.

## The claim

A browser at a fractional zoom (90%, 133%) lays out in device pixels and rounds. A box whose height is exactly the
threshold can come out at 23.9px, and a measurement of the rendered page reports a failure the stylesheet does not
show. A length set at exactly a threshold has no room for that rounding. Set the floor above it (25px for a 24px rule)
and pin it with a test that reads the length from the source.

## How we got here

The audit measured the page at several zoom levels. At 100% every target passed; at 90% and 133% eight measured 23.9px:
the shared public header's Links, Light and Dark, and five Request Adopt links. The fix went into the vault sources (the
public header, the agency visual, tabs) and every public page took the header's lengths (#3151).
`tests/public_target_floor.test.js` fails a public page whose floor falls below 25px.

## When this applies (and when it doesn't)

Any size rule with a hard threshold that a rendered measure checks: target size, a minimum font size, a gap between
targets. It does not apply to a length the rule leaves room around. COBI's controls are specified at 24px in
[`reference-ui-design-system`](reference-ui-design-system.md); the 25px floor so far covers the public pages.

## See also

- [`methodology-the-first-run-of-a-new-instrument-measures-the-instrument`](methodology-the-first-run-of-a-new-instrument-measures-the-instrument.md): 23.95px reported as 24, the same threshold seen from the measuring side.
