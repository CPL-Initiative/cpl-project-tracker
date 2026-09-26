---
title: Session 293 handoff — the funding video becomes an introduction, fills the screen, shoots down barriers, and its score builds
date: 2026-09-26
session: 293 (SkyBeam)
tags: [handoff, implementation-funding, video]
status: current
---

# You are Session 294

Your moniker is **SkyForge**. SkyBeam (S293) took Sam's five notes on the funding
video and landed all five in one PR. Read
[`session_292_handoff.md`](session_292_handoff.md) for the Scenario 2 video and the
one-source build, and [`session_289_handoff.md`](session_289_handoff.md) for the
funding lane. This was a short session (one commit's worth of work), so the full
Rule 9 checkpoint did not run; the lane file, the README and a `cpl_memory` row
carry the state.

## What shipped (one PR, branch `claude/jolly-hopper-txrag9`)

Sam's notes, verbatim in `cpl_memory`
(`sam-funding-video-is-an-introduction-barriers-building-score-2026-09-26`):

1. **An introduction, not a guide.** *"a guide would be much longer and more
   detailed."* The page title, kicker, Play button, region label and the
   explainer's link (both scenarios) say **"90-second introduction"**. File names
   are unchanged, so every link holds. A real guide is a separate, longer piece.
2. **The arrow shoots down barriers to CPL**, *"sly"*: five muted gray pixel
   invaders at scene seams (`ENC` in the source), captioned Retaking what you
   know · No transcript on file · Nobody to ask · Unclear local policy · Credit
   left on the table. About a second each; none under reduced motion; a small
   shot and pop pitched in the key.
3. **The score builds**: seven sections over one four-bar theme, a B-minor
   breakdown, and a key change up to D for the last statement. Measured RMS climbs
   at every step (intro −24.4 → climax −16.3 dBFS), peak 0.81, no clipping.
4. **Everything fills the frame**: every scene re-laid out (1920-wide body line 63
   px, headline 115 px; the title and closing scenes set the lockup beside the
   title). The arrow's keyframes are now **measured from the elements**, so a
   future layout change carries the arrow with it.
5. **Full window + download**: the player opens at the largest 16:9 box that keeps
   the controls on screen; **Full screen** and **Download MP4** controls; the big
   Play button enters full screen and plays in one click. The explainer's MP4 link
   gained `download`.

Both MP4s re-rendered (`20260926_*`). `tests/funding_video_page.test.js` (new,
28 checks) guards the rename, the controls, the download targets, the barriers and
that the built pages carry the current source.

## Verified

- `funding_video_page` 28/28 · `funding_model_page` 84/84.
- Frames sampled across all ten scenes, one iteration to clear six overlaps.
- Live page at 1440×900 (stage 1408×792, controls on screen) and 390×844, no
  sideways scroll.

## Open

- Sam has not yet seen or heard this version. Expect taste notes on the invaders
  (size, how many) and the score.
- Carried from S292: the explainer timeline's "Undispersed Funds Rolled to Year 2
  and Releveled" wording (a curator edit); `EXPLAINER` to the public repo's address
  before production; the video pages are still not in `a11y.config.js`.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` (the video paragraphs)
2. `prototype/funding_video/README.md`
