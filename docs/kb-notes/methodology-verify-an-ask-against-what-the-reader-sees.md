---
title: Verify an ask against what the reader sees, not what the code does
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, ui, verification, skyview, requests]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-ask-which-container-before-you-debug-the-control]]"
artifacts:
  - prototype/ccr_universe.js
  - unified_courses.js
  - docs/ccr_atlas_lessons.md
---

# Verify an ask against what the reader sees, not what the code does

> **One-sentence summary** — When a request comes back with "none of them have
> worked", the thing to diff is the screen the person sees after they click,
> not the mechanism each attempt added; three sessions each shipped a real,
> plausible change to "open SkyView full screen" and none changed that screen.

## Context

Sam asked for SkyView to open "full screen" from the Common Course Reference
menu on 2026-08-25, 2026-09-03 and 2026-09-04, and on 2026-09-05 wrote: *"I've
made several requests for this so far and none of them have worked."* Each
session had verified its change: Session 192 made the map the tab's landing
view (an iframe beside the list); Session 223 added `allow="fullscreen"` so
the map's own button was no longer refused; Session 227 added a side-menu link
that opened the page in its own tab. Every one of those was true from inside
the code and every one left the tab looking the same: a boxed frame under a
banner, a heading, a toggle row and a note, with a masthead and panes inside
the frame. Story: [docs/ccr_atlas_lessons.md](../ccr_atlas_lessons.md), the
2026-09-05 section.

## The claim

A request about what a surface *looks like* is verified only by looking at
the surface the way the requester does: click the same control, from the same
place, and compare the screen to the words. A test that asserts the mechanism
(the iframe exists, the attribute is set, the link points at the page) can
pass three times while the ask stays unmet, because each mechanism was a
guess at what "full screen" meant and none of the guesses were checked
against the picture.

Two habits follow:

- **Get the definition before the third attempt.** The 2026-09-05 note
  supplied it unprompted: full screen is what the Full screen button paints,
  the map section and nothing else. Once that was written down, the change
  was a body class and a sizing rule. The two earlier sessions could have
  asked the question in one line.
- **Screenshot the click.** The fix was accepted on three screenshots taken
  with Playwright from the served page and from COBI's side menu, the way Sam
  would reach them, before any test was written. The tests came after, to
  keep it; the screenshots were what proved it.

## Evidence

- Three mechanisms, one unchanged screen, over eleven days: the handoffs for
  Sessions 192, 223 and 227 each record the change as done.
- The fourth attempt changed only what is painted (`body.u-solo` on the page;
  `uc-map-on` on COBI's tab) and was accepted on sight.
- The same session's Chromium harness, once it walked the comprehensive view
  the way a reader does, found a click that had been destroying the page's
  only search box since the day before. Walking the surface finds what
  asserting the mechanism cannot.

## How to apply it

1. When an ask repeats, stop adding mechanisms. Write down, in the
   requester's words, what the screen should show after the click.
2. Reproduce the click from where they click (the menu, not the URL) and
   capture it. Compare the capture to the words before touching code.
3. Ship the smallest change that makes the capture match, then pin it with a
   test that reads the rendered result (a class on `body`, an element's
   geometry, the painted height), not the code path.
