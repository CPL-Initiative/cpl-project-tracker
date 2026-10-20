---
title: "Session 440 handoff: the funding page's JST counts and help, the two-priority film, then the CLAUDE.md pass"
date: 2026-10-20
session: 439 (SkySaltbush)
tags: [handoff, implementation-funding, funding-video, claude-md-pass, commons]
status: current
---

# You are Session 440

Your moniker is **SkyChaparral**. Session 439 (**SkySaltbush**, `session_011geRbk5yN9DqAcJySupY6K`) was opened by Sam with
handoff 439's line and seven asks on the funding page. It did those and did not reach handoff 439's priorities 1 to 5,
which carry over below unchanged. If the routine started you, follow `docs/reference/scheduled_sessions.md` first.

## Sam's words this run (decisions, recorded with who and when)

- **The funding page (two marked screenshots):** print the JSTs in MAP, the enrolled veterans MIS reports and the JSTs
  needed for 75% on the seed JST outcome and on implementation condition 3; the Coordinator's How to meet it links
  office hours and names the MAP Dashboard chat; the Contents adds office hours, the chosen college's CPL landing page
  (a hover recommends office hours) and the training video (youtube xW0I6iFgRuk); *"Change title on all views for
  section What is a choice, and what is a given to Funding Model Numbers"*; Step 1/2 type agrees, the struck sentence
  goes, *Choose another institution* sits beside the Step 2 title.
- **The film:** *"The 100-second video is an old version with the 3 priorities instead of 2"*; *"I don't need the
  voice over version."* `cpl_memory` `sam-funding-page-jst-help-video-2026-10-20` (verified).

## What shipped (all merged, all checks green)

- **#2296:** the JST figures (`jstNeedWords()` over `perf().vet_jst`), the Coordinator help, the Contents help items
  (`CPL_FUNDING_TAB.landingPage()`), Funding Model Numbers, the Step 1/2 box. Guard `funding_jst_counts_and_help`.
- **#2297, #2298:** the introduction link is always `funding_in_motion_s2.html`, the published scenario's film. The
  explainer's first paint reads Scenario 1 before the live config loads, so a per-scenario switch stuck on the
  three-priority film. The film and its MP4 (`…_Scenario_2_v8.mp4`; v7 removed) were rebuilt from Scenario 3:
  Completion counts transcribed units, the average Access target is 31.3 FTES ($90,908).
- **Handoff 439's item 0 is done:** S438's three `cpl_memory` rows are written. The cause of the timeouts: a Supabase
  MCP write hangs when its prose carries the English word for removing a table; rephrase and it lands
  (`supabase-mcp-write-hangs-on-the-word-2026-10-20`). The receipt is marked as run.

## Priority (carried from handoff 439)

1. **The CLAUDE.md pass (Sam, 2026-10-20 ~17:15Z: "yes").** Tag every rule in the tracker's CLAUDE.md keep, update or
   pull, each with its evidence: stale capability limits (other sessions are visible; the context meter's 786k
   ceiling against a 1M window), ritual weight (propose a light checkpoint for small sessions: handoff, lane, memory
   rows, status file; the full 13 on a lane state change), and the auto-mark rule. Change nothing in CLAUDE.md on
   your own: one short sheet of proposed edits, applied on his answers. Keep the PUSH rules.
2. **The Course Progress view** (Commons lane NEXT): the fourth host of `commons_progress.js`, inside SkyView; model it
   on `cr_progress.js` and `tests/cr_progress.test.js`; add `a11y.config.js` targets.
3. **The auto-mark rule waits on Sam's word.** Without "commit the auto-mark rule", put it on the standing sheet as a
   card (Sheet 109; `CPLBrain/decision-sheets/decision_sheets.md`).
4. **Grok:** nothing until Sam says the key is in.
5. Small: `kb/_test_activity_card_current.py` and `tests/workplan_description_drafts_test.py` fail on main; CI runs
   neither. Annual Goals lane NEXT 0a, 0c, 0d.

## Patterns that worked

- `curl` against the live Pages site told a deploy delay from a code fault in one line: the fix was live and still
  wrong, which pointed at the first paint.
- `render.sh s2` runs in the cloud sandbox (`CHROME=/opt/pw-browsers/chromium`, system ffmpeg), about 5 minutes.
  Pull three frames with ffmpeg and read them before shipping an MP4.

## Lessons to honor

- **A fix that passes every test can still fail for the reader.** The jsdom tests paint once; the page paints again
  after the config loads. Check a rendered page after load when a value depends on the scenario.
- **The film is built, not live.** When the published scenario's dials move, refresh `figures.json`
  (`scripts/funding_video_figures.js`), then `build.py s2` and `render.sh s2`, and grep the tests for pinned figures.
- Removing a rendered label, grep the tests for it before the push (`funding_video_page` a2 pinned it; CI caught it).
- `npm run a11y` hangs in the sandbox on blocked outbound hosts; S439 did not get a result.

## Not refreshed

The UI pass (no room for a fix PR at sign-off; the ledger keeps its view due), the Pipeline tab (nothing moved),
`kb/README.md`, `README.md`, no KB note, the Commons run logs (no reference touched).

## Let go

S439 holds no PR subscription (#2296, #2297, #2298 merged, unsubscribed), no artifact watch, no check-in. The CPL Queue
routine fires next at 05:12Z on 2026-10-21.
