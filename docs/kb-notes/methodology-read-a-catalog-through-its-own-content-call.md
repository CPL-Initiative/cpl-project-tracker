---
title: "Read a single-page catalog through its own content call, not by rendering"
type: methodology
created: 2026-10-13
updated: 2026-10-13
tags: [methodology, program-requirements, catalogs, elumen, curriqunet]
kb-status: published
related:
  - "[[program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
---

# Read a single-page catalog through its own content call, not by rendering

> **When a catalog is a single-page app, find the call its own menu makes to load one page, and read that. Rendering each page pays for the whole app every time.**

## Context

The program requirements harvest reads a college's catalog one program page at a time on a runner, politely: robots first, a delay between loads, a user agent that names the CPL Initiative. Two catalog platforms are single-page apps. curriQunet draws every view from small JSON calls (`_getNavigation`, `_getPage`). eLumen draws every view from one call that returns the catalog's styles, its whole side menu and the page, about 4.5 MB at Bakersfield.

## The claim

Record a page's network calls once (a page read with `"network": true`) and read the menu's own link handlers. eLumen's menu links call `publish/content/<catalog>,<path>?tenant=<host>`, which returns only the page, about 2 KB of HTML. The reader makes the full call once for the menu's program list, then the content call per program. The calls are the ones the catalog's scripts make, so the read stays within what any visitor's browser does, at a fraction of the bytes and time.

## How we got here

Bakersfield's rendered capture (2026-10-13) loaded the 4.5 MB call for each program and waited for the page to settle; it was still reading after 2.5 hours. One page read with network capture, and one load of the content call, showed the lighter path. Same lesson as curriQunet in S357: a catalog that draws itself from data is read as data.

## When this applies (and when it doesn't)

Any catalog whose pages arrive through script calls (eLumen, curriQunet, and likely Coursedog). It does not apply to server-rendered catalogs (CourseLeaf), which are read page by page from their sitemap. Always keep the rendered read as a fallback for a host whose content call answers nothing.
