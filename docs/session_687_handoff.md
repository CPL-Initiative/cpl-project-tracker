---
title: "Session 687 handoff (from SkyBushtit, S686)"
created: 2026-11-19
updated: 2026-11-19
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_689_handoff.md
---

# You are SkyPipit (Session 687)

From SkyBushtit, S686: Sam's side session of Nov 19, 2026 (started 13:11Z from the phone, "CPL Commons page"),
which built the CPL Commons page COBIx asked for on #3533 for the CCLC conference, then merged what Sam asked for.
It read handoff 686 only at its end. **This is a light checkpoint:** no Roadmap row moved, and no re-mint or Rule 10
data write ran. Skipped: the wiki candidates (0c), the status files (12; `kb/status/commons.json` still lists 6
catalog-blocked colleges, see below), and steps 2, 3, 5, 7 and 9.

## Read handoff 686 first: its standing block and queue still hold

[`docs/session_686_handoff.md`](session_686_handoff.md) (from SkyTowhee, S685, the CPL Queue routine) carries COBIx's
standing block on #3358 and the queue. Nothing here replaces it. This run worked outside that queue, on Sam's own asks.

## What landed (all squash-merged on `main`, `test` green on each head)

- **#3554 `5a7a6f24`, the CPL Commons front page.** `commons_front.js` draws the bare `#commons`: the Projected
  Completion Date (computed from the 7-day pace, never stored: December 21, 2026 on the November 19 data), 30 daily
  bars from the live files, Needs you, eight cards in Collect / Curate / Connect. College Data Collection moved to
  `#collect` (`tabs.js` rewrites every old `#commons/data...` link); the earlier first view is `#commons/details`.
  COBIx reviewed it twice; every finding was fixed or answered on the PR. Lane:
  [`commons`](reference/lanes/commons.md); decisions `d-commons-front-page-routes-3554`,
  `d-commons-front-card-layout-3554`.
- **#3559 `cf7f6ca0`, the size guard's base.** It now reads the merge commit's first parent; an older PR's event
  `base.sha` had gone a day stale on #3511. Lane: [`repo-size`](reference/lanes/repo-size.md); pitfall
  `p-pr-event-base-sha-goes-stale`.
- **#3511 `b194cb08`, First Light to 194 paintings** (Sam: "merge 3511 too"). Main merged in; the one conflict,
  `tools/first_light_verify.json`, kept main's newest results for the 194. Follow-up **#3561** (the Apply's receipt of
  mark ids), as COBIx relayed from Sam.
- **#3562 `0159aacb`, Library Publish now: one status line.** Publishing, Deploying, Live only once the page answers,
  or Failed with its reason. Lane: [`library`](reference/lanes/library.md); decision
  `d-library-publish-one-status-line-3562`.

## Open, in order

1. **#3560, the rest of it** (Sam's decisions of Nov 19, 8:23 and 8:55 AM PT, relayed by COBIx): the progress bar from
   real step events in `library-revise-draft`; the accessibility gate before Publish to Public Library, the footer from
   each piece's check record, and per-division settings; the two publish buttons ("Publish to Internal Library",
   "Publish to Public Library", no approval from Sam, Public includes Internal); Publish all; Add existing; redraft and
   republish; the Template checkbox. Edge Functions, `library-publish.yml` and new record fields.
2. **The Commons' open data questions** (#3554's description): `blocked_hunt` in `kb/status/commons_data.json` lists 6
   catalog-blocked colleges while the captures show 118 of 118; the readable-course count for SLO and objective dates;
   a recount of the 713 COCI-only programs (`ASKED.cociOnly` in `commons_front.js`); the generators that still write
   `#commons/data` links.
3. **#3561**, the First Light Apply's receipt.

## Let go

No PR subscription, check-in or artifact watch is held. CPLBrain #826 (this session's vault note) is a draft for Sam.
The snapshot artifact of the Commons page (claude.ai/artifact/GuubNtmRLiyKhnHHAgZwaA) is a private preview; the live
page is on Pages.
