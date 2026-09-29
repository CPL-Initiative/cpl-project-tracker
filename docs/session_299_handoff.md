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

## First thing: the College Dashboard follow-ups

1. **Both PRs merged, every check green.** [#1726](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1726)
   (`1f55f60`, 2026-09-28): funding waits on all three minimum conditions.
   [#1729](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1729) (`1f60fdf`, 2026-09-29):
   the College Dashboard redesign, described in the lane file's COLLEGE DASHBOARD paragraph.
2. **Five follow-ups the port left, one small PR** (the lane's NEXT ⓪⁻):
   - The code's default participation deadline is still `2026-09-01` (`cpl_funding.js` near line
     2900); the live config sets `2026-11-01`. If the config fails to load, every chip reads
     "Confirm now". Move the default.
   - The explainer's Step two note (`funding-model/index.html` line 550) says the model reserves
     demonstrated funding, against Sam's no-reserve ruling, and "Max award by institution" (line
     443) now heads the Curr columns. Public wording: show Sam the revision before it ships.
   - `READING_DEFAULT_HTML` (`cpl_funding.js` near line 3211) says every funding cell shows the max
     award on top and its Current Total beneath it. The redesign gives each its own column. Find
     where it renders and whether a saved text overrides it before changing it.
   - The CSV's "Current total" repeats "Demonstrated", and "Withheld (baseline not met)" still says
     baseline where Sam's term is Minimum Conditions.
   - Two dead `.cplfund-dtl-sum` rules; print runs chips into the name ("CalbrightNC only").

## Then: Sierra Training

Sam's second priority. [Mockup](https://claude.ai/artifact/Agmbu7UNGRcdEf48Sx5PTi): round 0 is
today's tab; round 1 applies his five asks of 2026-09-28: the five number cards filter the list
below by category; every Sierra response left-justified; "Try it on Sierra" offers the Sierra tab
or the My College tab; the whole tab to First Light, AA and phone width, with the clip-art glyphs
gone; "pretty, simple, and user friendly". **Sam approved round 1** ("Sierra looks good", `cpl_memory`
`sam-approves-sierra-training-mockup-round-1-2026-09-28`). Port it to `sierra_training.js` the same way
(consumer map first, tests, `npm run a11y`); the page source, CSS and `mock.js` are inside the published
mockup (read it with the Artifact tool).

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

- #1726 (the gate) and #1729 (the College Dashboard), both merged; this checkpoint's PRs, #1727
  and #1728. Three `cpl_memory` decision rows.
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
