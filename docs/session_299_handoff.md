---
title: Session 298 handoff — the College Dashboard redesign locked, the gate at three conditions, Sierra Training in mockup
date: 2026-09-28
session: 298 (SkyLatch)
tags: [handoff, implementation-funding, sierra-training, mockup, ui]
status: current
---

# You are Session 299

Your moniker is **SkyTrellis**. SkyLatch (S298) took the queue from
[`session_298_handoff.md`](session_298_handoff.md), and Sam turned the day to UI fixes "in a new
way": he talked the changes through while a mockup drawn by COBI's own code updated in front of
him. Method: [`methodology-mock-up-from-the-running-code`](kb-notes/methodology-mock-up-from-the-running-code.md);
story: [`ui_mockup_lessons`](ui_mockup_lessons.md).

## First thing: two things in flight

1. **[#1726](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1726), funding waits on all
   three minimum conditions.** 21 lines in `baselineGate()` (the third condition read from
   `eligReqList()`, fail-open while its feed pends) plus the regenerated `kb/dependency_map.json`.
   Local tests were refused by the auto-mode classifier; Sam chose CI on the draft PR. Read the
   `test` check on the current head; fix what it names; merge on green (squash).
2. **The College Dashboard port.** A background agent built it in a worktree on branch
   `claude/funding-dashboard-ui-s298`. If that branch is on GitHub, open or finish its PR: merge
   `main` in after #1726 lands, regenerate `kb/dependency_map.json` (never pick a side), run the
   `test` check, merge on green. If it never reached GitHub, the container took it: redo the port
   from the mockup, the lane file's status line and the `cpl_memory` rows below.
   Spec: [mockup, round 7](https://claude.ai/artifact/2V1aWwtjwob5gSM6TEkfyQ) (read it with the
   Artifact tool; `#view-mock` is the design, `#view-today` the old code).

## Then: Sierra Training

Sam's second priority. [Mockup](https://claude.ai/artifact/Agmbu7UNGRcdEf48Sx5PTi): round 0 is
today's tab; round 1 applies his five asks of 2026-09-28: the five number cards filter the list
below by category; every Sierra response left-justified; "Try it on Sierra" offers the Sierra tab
or the My College tab; the whole tab to First Light, AA and phone width, with the clip-art glyphs
gone; "pretty, simple, and user friendly". Keep taking his rounds, then port to
`sierra_training.js` the same way (consumer map first, tests, `npm run a11y`).

## Sam's decisions, recorded (2026-09-28)

1. **Three minimum conditions gate funding**: "3 conditions but the Star is a feel-good restatement
   of one of them" (`sam-three-minimum-conditions-gate-funding-2026-09-28`; supersedes the
   2026-07-30 two-condition call, which lived only in the gate's code comment).
2. **TBA everywhere a measure has yet to arrive**, "so when it changes, it will already be wired"
   (`sam-tba-replaces-awaiting-measurement-2026-09-28`; the CLAUDE.md vocabulary line changes in the
   port PR).
3. **The College Dashboard redesign** (`sam-college-dashboard-redesign-2026-09-28`): no reserve
   figure anywhere on screen; "Minimum Conditions is a better term than baseline"; Mark confirmed
   and the CO Confirm deleted, Reject kept; "Curr" for Current; Total and Curr Total Funds; the
   Confirm chip dated from the deadline, "Confirm now" after it.
4. **Tests on the gate PR run in CI** (Sam's choice after the classifier refusal).

## What shipped

- #1726 (draft, open at this checkpoint). This checkpoint's PR. Three `cpl_memory` decision rows.
- Two mockups (links above). The CO Monitor's note was confirmed signed-in-reviewer only at both
  layers (RLS `is_allowed_reviewer()`; the team phrase does not open it).
- The handoff's SQL test ran: calls 1 to 3 executed; call 4 was refused by the guard. Sam has not
  said whether 1 to 3 asked him to Allow.

## Waiting on Sam

- Whether the three test queries asked him to Allow, and whether he changed the Owner's connector
  setting or his own (then the S297 cleanup: `approval_prompt_hooks`, §15, the
  `check_hooks_live.py` note).
- The Sierra Training rounds. The open-asks sheet, cards 1 to 3. The timeline label.

## The queue after Sierra

Jev (S298 deferred it for the UI work; read the handoff for S298's Jev section) · SkyView's phone
opening · cue the narrated video · the ETHS answer (card 3) · ESL monthly after 2026-10-28 ·
governance for the two write surfaces · the unit-range display check.

## Read in order

1. This file. 2. [`ui_mockup_lessons`](ui_mockup_lessons.md). 3. The funding lane's status line.

## Patterns that worked

- **Replay the data, keep the code.** A local render with Supabase answered from fixtures matched
  Sam's screenshot to the dollar, so every round changed real markup.
- **A stamp on every round.** "Round N · updated <time>" ended a stale-window false alarm at once.
- **Put the old ruling in front of the owner with the numbers.** The two-condition gate comment,
  set beside "59 of 116 colleges hold the star", drew a one-line ruling.

## Safety patterns

- Local work in the scratchpad and in worktrees dies with the container: push before sign-off.
- A local full-suite run beside another job is refused as shared-resource risk; ask, or use CI.
- The docs lint flags `cpl_funding_lessons.md` (120 KB) as oversized: compact it before appending.

## Carryover

- Not refreshed this checkpoint: `kb/README.md`, `README.md` (no user-facing change landed), the
  Pipeline tab (the pipeline did not move), `cpl_funding_lessons.md` (oversized; this run's story is
  in the new lessons doc).
