---
title: Public-domain art sourcing for the dashboard (Adams, plein air, and the traps)
created: 2026-06-12
updated: 2026-06-12
tags: [reference, public-domain, copyright, art, first-light, plein-air]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/first_light_lessons]]"
artifacts:
  - first_light.js
---

# Public-domain art sourcing for the dashboard

> **One-sentence summary** — Which artwork the dashboard may legally ship
> (Ansel Adams' NARA Mural Project, pre-1931 publications, museum-tagged
> CC0/PD California Impressionists) and the four traps that bite even when
> the image itself is free (museum prose, artist names, living "plein air,"
> and voice/persona rights).

## Context

First Light (the daily painting greeting) and the coming retheme's ghosted
background need a growing manifest of artwork on a *publicly owned* tool.
Session 48 established the sourcing rules; every manifest entry must satisfy
them (`tests/first_light.test.js` lints that each entry carries a PD license
line).

## The claim

**Clean sources, in order of preference:**

1. **NARA 79-AA — "Ansel Adams Photographs of National Parks and Monuments"
   (1941–42 Mural Project).** US-government work-for-hire → public domain,
   "use without permission" per the National Archives; fully digitized
   (catalog id 519830; hi-res mirrored on Wikimedia Commons). **Only the 226
   photos in the series** — Adams' personal work from the same trips (e.g.
   *Moonrise, Hernandez*) is Trust-controlled, as are his later prints.
2. **Museum-tagged CC0/PD collections:** The Met, Art Institute of Chicago,
   Smithsonian American Art Museum, National Gallery of Art, Cleveland,
   LACMA. The **California Impressionists / plein-air school (c. 1890–1930)**
   are the on-theme vein: Granville Redmond (Deaf artist, Chaplin's friend —
   great blurb material), Edgar Payne, Guy Rose, William Wendt, Franz
   Bischoff, Anna Hills, Percy Gray, Maurice Braun. The deep CA collections
   (Crocker, UCI/IMCA, Laguna) are NOT broadly open-access — verify or skip.
3. **US works published before 1931** (as of 2026; the line advances yearly)
   — e.g. Adams' *Parmelian Prints* (1927) — but publication-history
   diligence is on us; prefer 1–2 where a museum has already done it.
4. **Hotlinking:** Wikimedia Commons `Special:FilePath/<File name>?width=N`
   is the stable redirect; always ship an offline/blocked fallback panel.

**The four traps (all hit or dodged in Session 48):**

- **Museum prose is copyrighted even when the image is CC0.** Facts are
  free; wall-text and catalog blurbs are not. Write our own 2–3-sentence
  artist/setting blurbs (they double as curatorial warmth + alt-text seed).
- **A PD image ≠ a free name.** "ANSEL ADAMS" is a registered trademark of
  his Trust; California post-mortem publicity rights run 70 years. Factual
  credit lines are fine; branding with the name is not.
- **"Plein air" is a living practice, not a period.** Contemporary plein air
  painters' work is fully copyrighted — never source from galleries,
  Instagram, or auction sites.
- **Voice/persona is a right too.** Huell Howser narration was wished for
  and declined: cloning a real (deceased 2013) broadcaster's voice triggers
  the same CA publicity rights + ethics line. Browser `speechSynthesis`
  ships instead; the Huell **archive lives at Chapman University** if real
  licensed audio is ever wanted (a Sam-side inquiry).

**Manifest contract** (`first_light.js`): every entry = verified PD/CC0
status + explicit license line + our-own-prose `blurb`/`setting` + hand-written
`alt`. Growth target 60–90 entries; each addition repeats the diligence.

## How we got here

The Yosemite/Ansel Adams IP question (this session's opening consult) →
WebSearch-verified NARA 79-AA status → three Commons-verified paintings
shipped in `first_light.js` (#394). Trademark/publicity framing follows the
same analysis applied to "The Ahwahnee" (Delaware North saga) and Huell.

## When this applies (and when it doesn't)

Applies to anything the repo *ships publicly* (committed images, hotlinked
art, blurbs). Doesn't constrain private inspiration/mood boards, and doesn't
substitute for counsel if the use ever becomes commercial merchandising
rather than a public dashboard.

## See also

- [[docs/first_light_lessons]] — the workstream
- PR #394 / #396 — manifest + PD-annotation test lint
- National Archives: archives.gov/research/ansel-adams · catalog id 519830
