---
title: Session 342 handoff — sheet 47 carried out; the display apply and the sheet move remain
date: 2026-10-07
session: 341 (SkyTerrace)
tags: [handoff, program-requirements-harvest, cpl-pathways, decision-sheets, library]
status: current
superseded: true
superseded_by: session_343_handoff.md
---

# You are Session 342

Your moniker is **SkyBeacon**. SkyTerrace (S341, `session_01NDadSdMVbcvDjjek3iaNWL`) signed off once, then Sam
answered Open Asks Sheet 47 by its Complete button (2026-10-07 14:20Z) and sent it to this session, which carried
it out until its context ran low (checkpointed at ~109,000 tokens left).

> **EMERGENCY CHECKPOINT (S341, 2026-10-07 ~15:00Z, ~47,000 tokens left).** Refreshed: this handoff, the three
> lanes it moved (harvest, library, partner-crosswalks), `cpl_memory`, the To-Do feed, lessons S341. NOT refreshed after
> sheet 48 card 1: the To-Do feed's sheet 48 item (card 1 is done), docs INDEX history, the vault session note. PR #1896
> and vault #266 were left open: merge #1896 on a green `test`, then re-run #266's `coverage` once and merge it.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`); S341 may still hold a wake (see the end of this file).
2. **Open Asks Sheet 48** ([FWGJ2uNEGB1RrhMPrFsaCJ](https://claude.ai/artifact/FWGJ2uNEGB1RrhMPrFsaCJ), current).
   Read `replies` and `done` with `ArtifactData`. Card 1: the Ironworker film's web player (Later on sheet 47).
   Card 2: the team's addresses for CPLLibrary.
3. **PR #1896** (tracker). If it is still open: `test` green on the head, then squash-merge. The preview A/B ran
   on its first commit (run 37638064917); read its compare step before merging. The push-triggered `smoke` is red by
   design until the deploy (it tests production with the branch's assertions).

## Sam's sheet 47 calls (2026-10-07 14:17-14:20Z; seven his own, 5 and 7 as proposed; through 9)

1 Fixed (routine settings; in chat: *"routine edits done"*) · 2 Later · 3 Shared · 4 Move them · 5 One per series ·
6 Date made · 7 Keep it · 8 Load both · 9 As proposed.

## Done

- **Card 8, the load:** both records moved into `records/`; the table holds 22 rows, 20 checked (migration
  `program_requirement_records_load_ivc_smc_s341`; receipt `kb/receipts/program_requirement_records_load_2026-10-07_s341_delta.sql`;
  record and checks md5 equal the receipt's). Sierra reads only checked rows, so she quotes neither yet.
- **Card 9, the rule (#1896):** `map_hints()` and `plan(..., hints, path)` in `kb/_build_roep_display.py`. A choice
  with no printed minimum takes the map's least through a CPL course; along the map, a course the map names inside a
  choice counts in place of the CPL course. Santa Monica up to 22.5 of 26.5 and 22.5 along its map; Irvine Valley 3
  and 3; no pilot figure moved. Display build **8292780f6cd5** (page data and receipt committed).
- **Card 5:** Library record `open-asks-sheets` (21 linked versions, sheets 28-48; migration
  `cpl_library_open_asks_series_s341`, cohort `library-s341@bot`). Add each new sheet as a version.
- **Card 1:** the routine was updated 14:06Z; next run Monday 2026-10-12 12:51Z. Read that run's PR.
- **Sheet 48 (Sam, 14:52Z):** card 1 *Keep it public*: the Ironworker film's Library audience is Public (receipt
  `kb/receipts/cpl_library_ironworker_public_2026-10-07_s341.sql`). Card 2 (addresses) is unanswered: no note.
- **Sheet 48 card 2 (15:3xZ):** Sam sent 19 addresses in chat (not committed: the tracker is public). The Drive
  connector's `share_file` refused every one tried (10 of 19: *invalid argument* or *caller does not have permission*);
  CPLLibrary still lists the owner alone. Sam shares it in Drive, or pastes the list into a session that can.
- **Card 3:** not done in Drive. CPLLibrary and Drafts still list the owner alone (read 14:4xZ); sheet 48 card 2 asks
  for addresses. Never guess one.

## Priority 1: finish card 8 (Sam's go is given)

1. ⚠️ **The preview A/B FAILED** (run 37638064917, job `ab`, on #1896's first commit). Do not deploy until you have
   read its compare step and the downloaded answers, found the regression, and fixed it or shown it is not this
   change's; then re-run the A/B on `main` and dispatch `cpl-chat-deploy.yml` with `confirm: DEPLOY`. The deploy ships
   the read-map status, each course's term and the figure along the map.
2. Apply `kb/receipts/program_requirement_records_display_2026-10-06_8292780f6cd5.sql` (185 KB): too big for one
   migration (~40 KB carried). Split it by statement (one per program) into parts under ~35 KB and apply each as a
   named migration (`..._display_8292780f6cd5_s342_partN`). A fresh read first: all 22 rows; 20 on 1cb75672ba6c.
3. `python3 kb/_build_roep_display.py --verify-sql`, run the printed query: every row `match`.

## Priority 2: card 4, the other decision sheets to the vault

13 builders in `kb/` (`_build_*sheet*.py`; list in `docs/reference/lanes/library.md`), their 13 sheets and 18
hand-made ones in `docs/visuals/` (31 carry reply chips). The template and reply-chip code stay in the tracker.
`tests/decision_sheet_template.test.js` (REAL = the Jev CR pairs sheet, 51 proposals) and
`tests/decision_sheet_replies.test.js` (the memory audit sheet) read real sheets: give them synthetic fixtures first.
Also `tests/cpl_funding_review_sheet_s286.test.js` and `tests/esl_sheet_apply_test.py`. About 50 references in docs.
Builders move to `CPLBrain/decision-sheets/` and find the tracker the way the open-asks builder does
(`CPL_TRACKER_ROOT`). Then each moved sheet gets a Library record under its own occasion (card 5).

## Patterns that worked

- Read the sheet's store, not the comment: the replies and `done` were the record; the comment only rang.
- A two-row delta from a 67 KB receipt, proven by md5 of each jsonb against the receipt's own literal.
- Measure a definition's blast radius first: card 9 moved one number.

## Safety patterns

- `git fetch --prune` on this tracker can hang for minutes; to push a branch whose remote was deleted on merge,
  drop the stale tracking ref (`git update-ref -d refs/remotes/origin/<branch>`) and push plainly.
- Keep `delete`, `drop`, `revoke`, `truncate` out of a migration, comments included (the connector holds them).
- `jsdom` needs `npm install --no-audit --no-fund` in a fresh container.

## What S341 let go of at sign-off

The PR subscription on #1896 and the check-in `trig_01GYV1KGV43uE8JRurU2t5ka` (15:06Z), if still pending; the
artifact watches on sheets 47 and 48. The thread reply on sheet 47's comment (thread 3b5dd4d8) states what was done.
