---
title: "Session 709 handoff (from SkyNoddy, S708, Ashley's side session of 2026-11-22: the MAP team worklist of exhibits with no credit recommendation, statewide)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_715_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff (S703 SkyDovekie wrote 704), never this file. **Numbering.** If the routine has taken
709 by the time you start, take the next free number and say so in your handoff.

# You are SkyMurrelet (Session 709)

From SkyNoddy (S708), driven by Ashley, 2026-11-22, 17:35Z to about 20:15Z with long idle stretches. It began from
handoff 706's greeting while SkyPrion (S707) was still live, so it ran as a side session on files S707 did not touch.
SkyPrion's handoff 708 then named its successor *SkyNoddy (Session 708)*, so this session is that one. **Read
`docs/session_708_handoff.md` first: its open work stands unchanged,** and this file adds one item.

A **light checkpoint**: one lane's text moved with its PR, one `cpl_memory` row, no re-mint and no data receipt.
Skipped: steps 2, 3, 5, 7 and 9 (no KB structure, nav, re-mint or pipeline change), 4 (no retired text), and 12 (no
status file reads the queue).

## Open with the standing block (unchanged from handoff 703)

Handoff 708 carries it: COBIx on issue #3358 then #3655; a draft PR declaring side-session scope inside the routine's hours
(06:12Z to 14:12Z); the COBIx watcher; a light clone; at most 3 open PRs, one update from `main` right before a merge,
`test` green on the head; collection first; a plain session of about an hour, and the queue never stands down.
No COBIx comment arrived on #3358 or #3655 during this run.

## What shipped

- **#3695** (`kb/_build_exhibits_review.py`, `map_team_queue.js`, the map-queue seed in `a11y.config.js`): Sam's ruling
  `r-map-team-worklist-for-no-cr-exhibits-sam-2026-11-22`, widened from the held cards to every exhibit in MAP's
  statewide data. The builder writes `no_cr` into `kb/exhibits_review.json` (one row per MAP id: title, CPL type, and
  the college MAP's exhibit list names as owner, from `kb/reference/map_cpl_opportunities_verified.json`); the MAP Team
  Queue's `exhibits-no-cr` item lists the colleges most first, each opening its list in place, each id linking to MAP
  in a new tab. On this tree: 71 MAP ids on 68 of 3,085 exhibits at 19 colleges (Foothill 11, San Bernardino Valley 9,
  Santa Ana 9); two ids have no owner in the 2026-10-26 read. Code only: the nightly CER run writes the field, and
  until then the held cards are the fallback. Guards: `tests/exhibits_review_build_test.py` (S708 block),
  `tests/map_team_queue.test.js` (S708 block); `npm run a11y -- map-queue-team` passed with a college line open.
  This handoff rides on #3695, so finding it on `main` means #3695 merged.

## Decisions the session made (each Sam's to revise)

- `d-exhibits-no-cr-statewide-s708`: "every statewide exhibit" is every exhibit in `statewide_data.js`, not the Fact
  Sheet's statewide-collaborative catalog; the MAP id is the unit; the college is MAP's owner; the item names no tab,
  since its list is on the item.

## Open work

1. **`commons`, from its NEXT line** (the Subjects page): the readiness count per M-ID by the draft gate, AED scope
   first, then the statewide defaults, the outcomes rerun, the course-move sync and one re-mint dry run, as handoff
   708 orders them. **`cer-procedures`** and **`repo-size`** from their NEXT lines; this run moved neither, and the
   cer-procedures lane still needs compacting below 20,000 bytes at the next full checkpoint.
   **`program-requirements-harvest`** is the routine's.
2. **`my-college-action-page`:** after tonight's rebuild, read the live `exhibits-no-cr` count on the MAP Team Queue;
   `kb/_verify_map_exhibit_links.py --recheck` for the two ids with no owner.

## Pitfalls from this run

- **Two sessions took one greeting.** Handoff 706's opening line was pasted into two sessions about 45 minutes
  apart; the second found the first's PR titled with the same moniker. At start, read the open PRs' titles for the
  moniker you are about to claim, as well as `main`'s commits.
- **`scripts/check_generated.sh` looks for the vault beside the tracker by folder name.** A clone at
  `/home/claude/cplbrain` reads *NOT RUN* for the open-asks coverage check; set `CPL_VAULT_ROOT` to the clone.
- **`test` waits on `lints`** (`needs: [gate, suite, lints]`), so all six suites can pass with no `test` run yet.
- **A `check_suite.completed` wake named the PR's first commit**, not its head; read the head before acting.

## Memory and vault

One `cpl_memory` row by `SkyNoddy (S708)`: `kb/migrations/2026-11-22_s708_cpl_memory_rows.sql`, applied, rollback in
its header. Vault: a session note on a draft PR in samueltlee/CPLBrain. No wiki candidate: the worklist's rule is
Sam's ruling, already recorded.

## Let go

At sign-off: the PR subscription on #3695 (after it merges) and on the vault note's PR, and the check-in
`S708: merge #3695 on green test` (`trig_01PAzmzzVMEdpABiHbgQLsZc`, fired 19:54Z). The COBIx watcher was not run (S707
held it until 17:49Z). No artifact is watched.

Spend: not available; 2026-11-22T17:35Z to about 20:15Z.

Opening line: *Greetings, you are SkyMurrelet (Session 709), see SkyNoddy's handoff — `docs/session_709_handoff.md` — let's keep rolling with our queue.*
