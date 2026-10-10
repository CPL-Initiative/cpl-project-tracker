---
title: Session 350 handoff — the veteran map waits on Sheet 55
date: 2026-10-09
session: 349 (SkyHarbor)
tags: [handoff, sierra, sierra-page-redesign, veteran-map, decision-sheets, checkpoint]
status: current
superseded: true
superseded_by: session_356_handoff.md
---

# You are Session 350

Your moniker is **SkyTide**. SkyHarbor (S349, `session_01S1DzeKpYnLayH9d13A8Ard`) ran SkyMeadow's queue: it merged
S348's open PRs, built the docked Sierra's full screen, ran the first UI pass on Sierra's public page, and mocked up
the veteran map on First Light for Sam. Sam gave no new rulings this run. The CPL Queue routine
(`trig_01L8K64ZKYb5eALdT4HW6NAV`) still reads `enabled: false`; turning it back on is Sam's call.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`).
2. **Open PR.** CPL-Initiative/cpl-project-tracker#1922 (the veteran map mock-up, the refreshed counts, the lane's
   NEEDS SAM, the Sheet 55 Library receipt) if it has not merged; the vault's #280 (its card) is merged. Merge once
   `test` passes on its head.
3. **Read Sheet 55's replies first:** [Open Asks Sheet 55](https://claude.ai/artifact/FfCtXWkFBdSBX4BGcitj5o)
   (current), `ArtifactData list` on collection `replies`. One card.
4. **Rule 8:** `cpl_memory` tags `sierra-page-redesign`, `veteran-map`, `checkpoint`.

## Priority 1: carry out Sheet 55

Card 1 asks whether to port the veteran map's First Light mock-up
([Colleges and Installations](https://claude.ai/artifact/NXB75PqESUBumqSajpdHbm), `prototype/veteran_map_mockup.py`)
into `veteran-sprint-map/build_selfcontained.py`. On **Port it**: move the mock-up's template into the builder (it
already imports the builder's data and `extract_military.snapshot()`), keep the element ids so the `veteran-map` a11y
target and its pin exemption carry over, rebuild, `npm run a11y -- veteran-map` plus a dark run, lift the lane's
NEEDS SAM and the builder's card in the same pair of PRs. On **Change it**: his note says what to keep; redo the
mock-up first. On **Later** or no reply: the live page keeps its look with today's counts. Lane:
[`sierra-page-redesign`](reference/lanes/sierra-page-redesign.md).

## Priority 2: the Library paste

`kb/receipts/cpl_library_open_asks_sheet55_2026-10-09_s349.sql` takes the open-asks record from version 50 (or 54)
to 55: Sheets 51 to 55 in one paste. It supersedes S348's sheet 54 receipt, which never landed. `apply_migration`
timed out once (nothing written; the table's known pitfall, `cpl_memory` `apply-migration-cpl-library-table-specific`).
Hand Sam the paste if he has not run it; read back version 55, n 28, Sheet 55 first.

## Carried, waiting on Sam

- **Two program records** (S347): Irvine Valley Art A.A. 10265 and Santa Monica Barbering A.S. 43767, Confirm or
  Needs a fix from the Records view. `program_record_verdicts` was empty at 00:55Z on Oct 9.
- **The guard change** (S347, *"Turn the guard off on updates"*): lands only in a session Sam runs in Accept edits.
- **Sam's reaction to the full-screen dock**: screenshots sent in chat on Oct 9.

## What shipped (S349)

- **#1920** (S348's Sierra port) and vault **#279** merged after `test` and coverage passed.
- **#1921**: the docked Sierra (My College, Program Requirements) expands in place to full screen when she answers,
  keeping the tab's scope, surface and credential; *Back to the tab* or Escape returns her; a reader who goes back
  stays docked for that conversation. The answer's feedback row now meets AA on every COBI surface (it was 2.48:1
  and 23.4px). `tests/cpl_chat_dock_full.test.js` (55), a11y targets `sierra-dock-full` and `-dark`. The first UI pass
  on Sierra's public page: nothing to fix.
- **#1922** (open): the veteran map mock-up; the live page's served count refreshed to 28,884 (as of Oct 8; it showed
  30 June's 24,834 with no date); Sheet 55's Library receipt.
- **Vault #280**: Open Asks Sheet 55 (one card, measured premise `p_veteran_map_not_first_light`).

## Patterns that worked

- **Seed an a11y target through the real code path**, stubbing only the network. The first seeded conversation found
  a defect every empty-state sweep had passed. KB note `methodology-a-sweep-sees-only-the-states-its-seed-reaches`.
- **A mock-up imports the builder's data** (the builder writes only under `__main__`; output byte-identical).
- **One receipt from either earlier state** replaces two queued pastes.

## Safety patterns

- A modal makes the page `inert`, except a fixed layer that paints above it (First Light's greeting).
- A stub's URL literal is a dependency edge: match by pattern; seed links use `example.org`.
- Never reformulate a write to slip past the connector's confirmation step; a timed-out `cpl_library` write goes to
  Sam as a paste.

## Checkpoint notes

Refreshed: this handoff, the Sierra lane (on #1922), the lessons doc, one KB note, `CLAUDE.md`'s standing-sheet
pointer (Sheet 55), the docs index, `README.md` (the box fills the screen), three `cpl_memory` rows (logged),
`kb/queue_status.json`, the vault session note. Not needed: `kb/README.md`, the pipeline tab (the pipeline did not
move). The UI pass ran this run (Sierra).

## What S349 let go of at sign-off

PR subscriptions: #1920, #1921, #1922, vault #279 and #280. Artifact watches: the veteran map mock-up and Sheet 55.
