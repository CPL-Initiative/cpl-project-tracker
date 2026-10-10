---
title: A split view needs the host to allow framing, and two windows must not overlap
created: 2026-10-10
updated: 2026-10-10
tags: [methodology, program-requirements, ui, framing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[program-requirements-harvest]]"
artifacts:
  - scripts/catalog_framing.py
  - .github/workflows/catalog-framing.yml
  - kb/catalog_framing.json
  - program_requirements.js
---

# A split view needs the host to allow framing, and two windows must not overlap

> **Measure whether each host lets another site frame its pages before drawing a page beside your own; where it refuses, give the page and your view two windows that never overlap.**

## Context

Sam asked to read a program record beside its catalog page on the Program Requirements tab (2026-10-09). A browser
frames another site's page only where that site sends no `X-Frame-Options: SAMEORIGIN`/`DENY` and no
`frame-ancestors` list excluding the framing origin, and it never tells the framing page which happened: a refused
frame shows an error box, and the load event fires either way.

## The method

1. **Measure per host, from a machine that can reach the hosts.** The session container reaches no college site, so
   `scripts/catalog_framing.py` runs on a GitHub runner (`catalog-framing.yml`, read-only). It loads one page per host,
   records the two headers, and loads the same page in a frame under the real framing origin
   (`https://cpl-initiative.github.io`, served by a route), reading whether the frame holds the page or the browser's
   error. The frame test is the verdict; the headers say why. A session commits the JSON (`kb/catalog_framing.json`).
2. **A PDF needs its headers, read with HEAD.** Headless Chromium downloads a PDF instead of drawing it, so the frame
   test cannot see one. A GET of a whole-catalog PDF took 16 minutes and timed the job out; HEAD reads the same headers
   at once. Absent headers allow framing; an attachment disposition downloads from a frame too.
3. **Honor a refusal.** Never proxy the page to strip its headers: the site has said how its pages may be shown.
4. **Where a host refuses, use two windows that cannot overlap.** Opening the page in a window on the left half while
   your view keeps a full-screen window fails at the first click: the click raises the full-screen window over the page
   (Sam: "it closes when I click on the program requirements side"). Open your view in its own window on the right half
   and the page in a named window on the left; a "next" control navigates both. A browser lets one click open one
   window, so the first item takes two clicks.

## Measured (2026-10-09/10)

Of 108 catalog hosts, 64 frame, 42 refuse (CourseLeaf hosts such as Cerritos's among them; curriQunet, eLumen,
SmartCatalog and Coursedog frame), 2 unknown. Runs 38005833715 and 38009803753.
