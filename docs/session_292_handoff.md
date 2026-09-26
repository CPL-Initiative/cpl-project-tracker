---
title: Session 292 handoff — Scenario 2 guide video, the explainer's title and statutory intro, the noncredit header fix
date: 2026-09-26
session: 292 (SkyRelay)
tags: [handoff, implementation-funding, video, explainer]
status: current
---

# You are Session 293

Your moniker is **SkyBeam**. SkyRelay (S292) ran from Sam's greeting that named it
Session 289; the highest handoff on disk was 291, so this file is 292. Read
[`session_291_handoff.md`](session_291_handoff.md) for the Scenario 1 guide video and
[`session_289_handoff.md`](session_289_handoff.md) for the funding lane and CI.

## What shipped (one PR, branch `claude/skyrelay-session-289-5eqrnq`)

1. **The noncredit drill-in header is readable.** Its rule painted the blue fill and
   left the base rule's muted ink on it (Sam's screenshot, dark text on blue). Fill
   and ink are now one rule per lane; `tests/cpl_funding_dtl_align.test.js` c1–c3
   resolve the cascade for both headers.
2. **The explainer is titled "2026-2028 CPL Initiative Funding: How It Works"** and opens
   with a one-paragraph statutory intro: SB 135 (Stats. 2026, Ch. 79) added Ed. Code
   Article 9 (§78093–78093.2, effective 2026-07-13), the four goals of §78093.2(d)(1),
   and what the page sets out. The tab's link text stays "How this funding model works"
   (three suites pin it). The vocabulary scan in `funding_model_page.test.js` lifts the
   statute's "advancing career attainment" out before scanning.
3. **Scenario 2 has its own 90-second guide**: `prototype/funding_video/funding_in_motion_s2.src.html`,
   the built page, and `20260926_CPL_Funding_in_Motion_Scenario_2.mp4`. Two priorities at
   50/50, the Career attainment and innovation projects card as a reported card, Sample
   College's Access target 67.1 FTES / $170,431. Orchestral score (horns, timpani,
   strings, contrabass, pizzicato). The CPL Initiative logo leads, the MAP wordmark beneath it at three-fifths
   the width (Sam's follow-up ruling: CPL Initiative most prominent, MAP second
   fiddle with special treatment); the MAP logo's red arrow flies every scene and
   nests back into the A at the close. Its home is measured from the layout.
   The explainer links the Scenario 2 guide when it shows Scenario 2.
4. `build.py [s2] [--render]`, `render.sh [s2]`, `render.mjs` (`PAGE` env) take a variant.
   `prototype/funding_video/README.md` carries the details.

## How the Scenario 2 figures were computed

The tab's tests run `NO_REMOTE`, so the data file's default shares (30/42/28) are not the
stored config. The session booted the tab in jsdom with `CPL_FUNDING_NO_REMOTE = false`
and a stubbed `window.fetch` that returns the stored Scenario 2 config for the
`cpl_funding_config` URL; the same harness reproduces Scenario 1's $345,220 / 44.3 FTES,
so the method is verified against the S291 video. Script kept in the session's
scratchpad only; rebuild it from this description if a dial moves.

## Verified

- `cpl_funding_dtl_align` 19/19 · `funding_model_page` 84/84 · `cpl_funding_calm` 58/58 ·
  `cpl_funding_gate_ledger_public` 58/58 · `cpl_funding_public_private` 17/17.
- `npm run a11y funding-model`: all routes pass at 9 widths.
- The Scenario 2 score, rendered offline: peak 0.91, no clipped samples, 46% of energy
  under 120 Hz (the first mix clipped 552 samples at 89%; rebalanced).

## Open

- Sam has not yet heard the score or watched the arrow; both were checked by
  measurement and frame captures only. Expect taste notes.
- The explainer timeline still reads "Undispersed Funds Rolled to Year 2 and Releveled"
  (Aug 2027), contradicting the 2026-09-25 ruling. Curator edit on the tab, on the To-Do feed.
- Production: change `EXPLAINER` in both video sources to the public repo's address and
  re-render.
- The video pages are not in `a11y.config.js`; add them when the guide becomes a shipped view.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` (the guide-video paragraphs)
2. `prototype/funding_video/README.md`
3. `docs/kb-notes/methodology-render-an-html-animation-to-mp4.md`
