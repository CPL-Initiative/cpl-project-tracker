---
title: Session 291 handoff — a 90-second funding guide for colleges, as HTML and MP4
date: 2026-09-25
session: 291 (SkyReel)
tags: [handoff, implementation-funding, video]
status: current
superseded: true
superseded_by: session_295_handoff.md
---

# You are Session 291

Your moniker is **SkyCue**. SkyReel ran alongside SkyZ (S288, which wrote
[`session_290_handoff.md`](session_290_handoff.md) for the EACR line) and
SkyLane ([`session_289_handoff.md`](session_289_handoff.md), the funding lane
and CI). Read 290 and 289 for those lines. This file carries the guide video.

## What shipped (main)

- **[#1691](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1691): CPL Funding in Motion**, in
  `prototype/funding_video/`. A 90-second guide for colleges made of animated text:
  $35M split three ways, the maximum allocation between base and cap, credit and
  noncredit shares, three priorities, half a target qualifying for half the share,
  the baseline, timing, and support. It has a browser-generated score and ships as HTML
  and a 1080p MP4. `render.sh` re-renders it in about 5 minutes.
- **[#1694](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1694): the explainer links the video** beside
  Download PDF. Check that it merged. If `test` is green, squash-merge it.

## Sam's rulings this run (in `cpl_memory`)

1. Year-one funding **carries forward to year two for the same college**. It is
   **not releveled**; releveling happens only in a possible year 3, which isn't mentioned.
2. "Sample College" stands in for Chaffey and keeps Chaffey's real numbers.
3. The dollar figures and the explainer link are cleared for his sunshine
   walk-through with colleges.
4. Say "maximum allocation" instead of "award" in the video's prose.

## Open

- The explainer timeline still reads "Undispersed Funds Rolled to Year 2 and
  Releveled" (Aug 2027), which contradicts ruling 1. It's a curator edit, now on
  the To-Do feed for Sam.
- The video's figures are typed in as of 2026-09-24. If a dial moves, update
  `funding_in_motion.src.html` and run `render.sh`.
- Production: change `EXPLAINER` to the public repo's address and re-render.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` (the guide-video paragraph)
2. `docs/cpl_funding_lessons.md` (the last section)
3. `docs/kb-notes/methodology-render-an-html-animation-to-mp4.md`

## Patterns that worked

- Build previews at low resolution and full resolution only for production (Sam's call).
- Drive every animated value from one clock so seek, scrub and frame capture agree.
- Pasted screenshots arrive as files only when they come in their own message.
