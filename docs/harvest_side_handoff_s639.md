---
title: Program requirements harvest — side-session handoff (S639, second session)
date: 2026-11-12
tags: [handoff, program-requirements, harvest, side-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
related:
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/conductor_mode]]"
---

# Program requirements harvest: side session beside the S639 conductor

Sam opened a second session from iOS at 00:33Z 2026-11-12 with handoff 639's opening line while SkyQuail (S639, the
conductor, session `…wbUp`) was working. The two agreed one writer by message at 00:44Z: the conductor keeps the
moniker, handoff 640, the COBIx threads, Sheet 181, `kb_curation`, every cer, rename and family apply, and the
`cer-procedures`, `commons` and governance lanes. This session takes the `program-requirements-harvest` lane and
writes this file instead of a numbered handoff. **The numbered handoff is 640** (the conductor's, on `main` through #3134); this file stands beside it and covers the harvest lane alone.

**Scope (declared for the CPL Queue routine):** `docs/reference/lanes/program-requirements-harvest.md`, the harvest
lessons docs, `kb/program_requirements_reconcile.json`, `kb/_program_requirements_*.py`, `kb/college_reads/`,
`kb/program_requirements_college/`, `kb/receipts/program_requirement_records_*`, the ROEP display build and their
tests; table `program_requirement_records` through `program-requirements-college.yml` only.

**Agreed with the conductor:** receipt-only pushes from harvest runs are fine at any time. A merge that changes
generated `kb/` files waits until no `daily-dashboard`, `cer-decision-apply`, `cred-rename-apply` or
`credential-family-apply` run is in flight (read `list_workflow_runs` first).

## Read first, in order

1. This file. 2. The lane, [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md), its
*S639 side session* block. 3. The lessons, [`program_requirements_harvest_lessons`](program_requirements_harvest_lessons.md),
its last section, *S639 side session*. 4. For the three colleges not started:
[`harvest_wave3_diagnoses_s639`](harvest_wave3_diagnoses_s639.md). 5. Each open PR's body below: it states its
evidence, its simulation and its dispatch inputs.

## What is live and what is not (02:56Z 2026-11-12)

**Statewide at 02:40Z** (`program_requirement_records`): 17,581 rows, 14,988 pass the machine checks (01:20Z: 17,580
and 14,963). Headline at 01:26Z: 20,282 active programs, 13,779 complete, 114 colleges. The shared cause at about a
dozen colleges: a degree names a general education pattern and prints no units for it.

**Live and merged:** Los Angeles City, 181 of 223 (#3130, merged 02:49Z). **Live, not merged:** Orange Coast (reread
43142833449). **Not live:** Victor Valley, Rio Hondo, West Valley, Berkeley City (reconciles filed or filing, no
reread yet), American River (run 43134279776 neither loaded nor reread), the three diagnosed colleges. Read live
counts fresh before you cite one.

**The S639 conductor signed off at 02:36Z.** Handoff 640 (SkyHeron) is on `main` and names this side session. Its
dashboard hold is lifted. Before any merge, confirm no `daily-dashboard` run is in flight (cron slots 06:17, 09:17
and 12:17 UTC).

## Ledger (02:56Z 2026-11-12)

| College | PR, branch | State at 02:56Z |
|---|---|---|
| Los Angeles City | #3130, merged 02:49Z (64f736b0) | DONE. Rereads 43141074738 (27 replaced) and 43142129065 (29 replaced), none held, no error. 181 of 223 live (156 before). Left: the records read a page past their heading wait for a paid re-extraction on #3135's reader. |
| Orange Coast | #3133, `claude/harvest-orange-coast-s639` | LIVE. Reconcile 43136182950: 29 more pass, none regressed (223 of 274 filed). Reread 43142833449: 51 replaced, none held, no error. The review's test gap is closed. Marked ready, but in conflict with `main` since #3130 merged; the worker is merging `main`. |
| Victor Valley (108 of 168 live) | #3131, `claude/harvest-victor-valley-s639` | Reconcile 43139057384 filed at 02:38Z on the pre-fix head. The worker is restoring the out-of-scope files, merging `main` and pushing the eight review fixes. Nothing live. 37006 and 38352 stay as read (Sheet 85). |
| Rio Hondo (245 of 288 live) | #3136, `claude/harvest-rio-hondo-s639` | Step written under *count* (34 summed from its printed areas). Reconcile dispatched 02:28Z to 02:34Z. Simulated 276 of 288. |
| West Valley (93 of 133 live) | #3137, `claude/harvest-west-valley-s639` | Step written under *count*. Reconcile filed 02:50Z. Ceiling about 116 (the review), not 120. |
| Berkeley City (35 of 89 live) | #3138, `claude/harvest-berkeley-city-s639` | Local degrees take *at least 18 units in general education* and its electives rule; simulated 35 to 49. Reconcile dispatched 02:28Z to 02:34Z. 16645 must not be re-posted with the combined line's 21. Its 21 transfer degrees wait: the Cal-GETC tab prints no units. |
| The PDF reader | #3135, `claude/harvest-pdf-reader-s639` | Capture-only proofs filed for American River and Los Angeles City; the worker has not read them yet. Sacramento City, Los Angeles Valley and College of the Desert still to dispatch. |
| American River | `claude/harvest-american-river-s639`, no PR | Read 43134279776 ($12.99): 154 records rewritten, 16 improved, 30 passing now fail. Not loaded, not reread; kept for reference. |
| San Bernardino Valley, Grossmont, East Los Angeles | none | Diagnosed, not started: [`harvest_wave3_diagnoses_s639`](harvest_wave3_diagnoses_s639.md). |
| De Anza tail | none | 15 rows on 2025-2026 left behind by the wave (Sheet 118 card 1, the S456 method); 24 rows with no display; the display build after this wave's rereads. |

The review of Rio Hondo, West Valley and Berkeley City (three readers and a refuter) found no wrong record and five
minor findings, which the worker is fixing (16645, West Valley's ceiling, test gaps).

## Next, in order

Every dispatch is `program-requirements-college.yml` (`mcp__github__actions_run_trigger`, `run_workflow`) with the
inputs named. **Before each:** read `list_workflow_runs` for that workflow and confirm no run is in flight on the same
branch or the same college's host. Runs on one ref queue behind each other, and a third pending run cancels the
second, so dispatch one at a time. A push to a branch with a run in flight collides with the run's filing commit.
**Before any merge:** the PR's review is clean, `test` has succeeded on the current head (`get_check_runs`), and no
`daily-dashboard` run is in flight. A reread's receipt commit leaves the head with no checks, so the next real push
follows it before you read the checks. Merge with squash.

1. **Orange Coast, merge.** When the worker's `main` merge is pushed: `test` green on the new head, then squash-merge
   #3133. Then read one live count for Orange Coast College and record it in the lane.
2. **Victor Valley.** Read the worker's report on #3131 (the restored files, the eight fixes, reach still 22). Then
   reread: ref `claude/harvest-victor-valley-s639`, college `Victor Valley College`, step `reread`, extract `0`, force
   `43139057384`, unless the worker's report names a fresh reconcile run, in which case force that run. Then `test`
   green and merge.
3. **Rio Hondo, West Valley, Berkeley City, one at a time.** Each PR adds to the end of the same two files
   (`kb/program_requirements_reconcile.json`, `tests/program_requirements_reconcile_test.py`), so each merges `main`
   after the one before. For each, in order West Valley (filed first), Rio Hondo, Berkeley City: read the worker's
   push and measured result on the PR; then reread with ref `claude/harvest-<college>-s639` (`west-valley`,
   `rio-hondo`, `berkeley-city`), college `West Valley College` / `Rio Hondo College` / `Berkeley City College`, step
   `reread`, extract `0`, force `<that college's reconcile run, from list_workflow_runs>`; then merge `main`, `test`
   green, merge.
4. **The PDF reader's proofs (#3135).** Dispatch one at a time, each after the last finishes: ref
   `claude/harvest-pdf-reader-s639`, step `read`, extract `0`, force empty, college `Sacramento City College`, then
   `Los Angeles Valley College`, then `College of the Desert`. The worker (or you) then reads all five previews, with
   American River's and Los Angeles City's already filed, against the pass marks in the PR body. Then a review of at
   most nine agents, then merge.
5. **The paid re-extractions, only after #3135 merges.** Run the capture first with extract `0` on `main` and price
   the run from its `would_extract` count; the $40 a college go holds. American River: ref `main`, college `American
   River College`, step `read`, extract `1`, force empty. Los Angeles City's records read past their heading: ref
   `main`, college `Los Angeles City College`, step `read`, extract `1`, force `<their control numbers from #3130's
   body>`. Run 43134279776's records stay unloaded.
6. **San Bernardino Valley, Grossmont, East Los Angeles.** One writer for the two scorer readings in the diagnoses
   doc, each measured at every college first; then each college's free reads, steps, reconcile and reread as that doc
   says.
7. **De Anza tail**, then the display build: run `kb/_build_roep_display.py` on a branch, commit its two outputs, and
   dispatch step `display`. After this wave's rereads only.

## Decisions recorded (`cpl_memory`, status `proposed`, inserted 02:39Z under author `memory-s639-harvest-side-2026-11-12` from `kb/receipts/cpl_memory_s639_harvest_side_2026-11-12.sql`; all eight slugs returned)

- `d-lacc-heading-minimum-60-s639`: Los Angeles City's local degrees take the heading's *Minimum of 60* as a floor and GE 18-27 as printed.
- `d-occ-up-to-ge-maximum-s639`: Orange Coast's *Up to N* GE lines are that pattern's maximum.
- `d-hours-meets-top-term-length-s639`: the term-length hours reading (eight ninths, single figures, exactly the top); this session's call for Sam to revise, told to him in chat at about 01:50Z and 02:05Z, no reply. Sheet 120 card 1 unchanged.
- `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`: Cal-GETC 34 counted from each college's printed areas, extending Sam's *count* (Sheet 180 cards 2 and 4); the lane conductor's call for Sam to revise.

## Held at sign-off

This session holds **no subscription and no check-in** after sign-off. PRs left open: #3129 (until merged), #3131, #3133,
#3135, #3136, #3137, #3138, and CPLBrain#762 (the session note). A successor subscribes to the ones it drives, and drops
them at its own sign-off.

## Limits

**Disk:** about 5.4 GB free with four worker checkouts at 4.4 GB each, so no fifth; a worker done with its branch
removes its checkout first. **Context:** each new PR's subscription notice costs the conductor about 8,000 tokens; nine
PRs took this session from 16% to 86% of its window in two and a half hours. Open one PR per wave, or have workers
push branches and open a PR only when a branch is ready to merge.

**Workers do not survive a container restart.** Their checkouts lived under `.claude/worktrees/` in this session's
container and are lost with it; everything a successor needs is pushed on the branches. To brief a fresh one: give it the PR number, the branch, this file's
ledger row and its *Next* step; tell it to read the PR body (evidence, steps, simulation), the PR's review threads, and
the lessons section; and name the gate it must report on before any dispatch. It works in its own checkout of that
branch and writes nothing outside the PR's declared scope.
