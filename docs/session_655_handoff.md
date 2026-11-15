---
title: "Session 655 handoff (from SkyWhimbrel, S654)"
created: 2026-11-15
updated: 2026-11-15
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyCurlew (Session 655)

From SkyWhimbrel, S654, conductor mode: Sam opened it at 01:45Z 2026-11-15 with the S654 opening line (iOS,
https://claude.ai/code/session_01Rvwe2TqDrVyDBxGy74atU2) and said nothing else: no new ruling of his. This is S654's
**full checkpoint** (lanes changed state; no session data write), written from 03:28Z (`date -u`) on
`claude/checkpoint-s654`. **Step 12's stamps ran at 01:50Z** (#3343: 20,282 Active, 14,614 complete, 118 colleges, the
live read at 01:49Z); this checkpoint wrote the run logs' session fields only and ran no stamp.

## First things, in order

1. **Read Sam's replies on Sheet 199** (below), then **read COBIx** (login `cobi-cto`) from each thread's last page:
   #3330, #3346, #3315, #3299.
2. **Finish the merge queue, in this order**, each on a green `test` on the current head after reading its thread:
   (a) **#3330 is merged** (`5a4a9c68`, about 05:04Z 2026-11-15: the cost gates and the one spend meter; #3327 closed
   with a pointer; its failed `test` was three stale stubs in `tests/program_requirements_pdf_numbers_after_test.py`
   that took two arguments while the gate now passes the meter). Start at (b). (b) **#3346** (harvest
   follow-ups, head `b8c5abd7`; the second reader's fix is in, recall 589 of 589 district-format, 250 bare refused, 0
   wrong, 0 claims moved; COBIx "nothing new"): merge `main`, rebuild the dependency map, merge. (c) **#3315** (the
   Honors plan, head `9d065916`: 382 rows, digest `29667c07`, 129 mints, 157 rows with the mint held): merge `main`
   keeping main's `kb/migrations/.apply` exactly, then merge (plan and drafted SQL only).
3. **Honors step 2 apply, after the 06:17Z daily run:** one second reader on the regenerated plan, `--check` with its
   receipt, the apply under Rule 10, a live count; then *Before the mints*.
4. **Read the Riverside City capture** (free, dispatched on `main` about 02:59Z, `program-requirements-college.yml`,
   `step=read`, `extract=0`): compare with run 43619958385 (36 page_claimed, 4 not_found); the 36 transfer degrees
   should claim their own CalGETC pages. Then curriQunet colleges may capture again.
5. **The course-id rescore** at American River, Barstow, CCSF, Diablo Valley, Riverside City and Santiago Canyon:
   reconcile free from filed pages, then the reread (a live write with a receipt); expect 66 scores and one status
   (Diablo Valley 37558). Then ONE display build and `step=display`, one college first.
6. **Card 10:** the $40 gate on `cer-classify`, `cpl-news-harvest` and `cpl-chat`, importing `kb/_spend_meter.py`.
   The last two return no usage to their caller, so their stop is a worst-case bound from the function's own limits
   until a function deploy returns usage; at that deploy also set `maxRetries: 0` on `new Anthropic()` in the
   extraction function.
7. **Card 10's PR also carries COBIx's two notes on #3330:** `run()` falls back to the default rate when
   `per_record_rate` refuses (comment 6888116814); a test computing `M.worst_case` over the committed requests, so the
   stated overshoot cannot drift (comment 6888534891).
8. **Step 11:** read the two runs for 2026-11-15 (`python3 scripts/next_slo_colleges.py --all` on each branch: Allan
   Hancock's 12-page trial on #3284, commit 63a449b7; Santa Ana's objectives reread on #3344, commit 3ab3fef7); load
   when every slice is filed. Next hosts laspositas, Coastline, Golden West; College of the Redwoods' trial.
9. **Slice B of #3299:** set the named-course minimum first (COBIx: the 23 empty-heading Skyline pages stay `found`
   with one); Skyline 46296 and 32337; the self-test recall that fell 27 to 26 of 28 (name the program). #3293 keeps
   (waits COBIx and slice A's captures).
10. **Governance:** group 2 of the key readers (14 jobs) once the six group-1 jobs that had not yet run in
    `live-counts` succeed on schedule.
11. **Lanes S654 did not move** keep their NEXT lines as written: `cer-procedures` (the ASE rename rides the next rename
    batch for Sam's approval; the all-family Exhibits view), `library` and `workplan-annual-goals` (S653b's NEXT lines),
    `csm-workspace`. Read each lane file before working it.

Then Rule 8's `cpl_memory` query, the three-repo check, `list_sessions` if you have it (otherwise the open PRs and
`main` since this handoff), `df -h /`, `git worktree list`, `python3 scripts/check_hooks_live.py`.

## If you are the scheduled session (the CPL Queue routine)

Safe unattended: First things 1 to 9 under Rule 10, each data write with its compare, reader and spot-check first, and
code-only items from the lanes' NEXT lines. A merge that publishes a display waits on COBIx's spot-check. Before pushing
step 11's runs, check the branches for runs on the UTC day. Decide near-equal choices and move; hold only the
`CLAUDE.md` hold list. #2894 is Sam's.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S654, and what worked* included (three checkouts at
most; a fourth worker is a general-purpose agent in the main checkout; merge a stack through its top).

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*; Sam's latest change was 2026-11-11:

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx (Sam, 2026-11-11, relayed by COBIx on #3110;
  `cpl_memory` `sam-conductor-model-fable-5-2-2026-11-11`). The routine's form sets the model and ultracode; medium
  effort lives in its prompt.
- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`).
- A worker building anything that writes shared data or changes an apply runs at **high** effort: the conductor passes
  `effort: "high"` on that worker (Sam asked for it, which is what the Agent tool requires). Other workers run at the
  default.
- A review workflow uses **at most 9 agents in all**, readers and second readers together. Drop the second reader on
  minor findings first.
- **Cost limits** (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling below): $40 per
  college per run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs
  and course objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

## Ledger (PR, head, state), as of the conductor's 04:30Z ledger (`main` `efadff5a`)

| PR | Head | State | Next |
|---|---|---|---|
| #3343 | `5e034f20` | merged: S653's step 12 stamps | none |
| #3325 | `faaa7a9b` | merged: Honors field follow-ups; COBIx verified | none |
| #3316 | `2702a652` | merged: CDC three college cards (#3310) | none |
| #3324 | `3ec83566` | merged: a GE-pattern page has one owner | follow-ups (First things 7) |
| #3328 | `d6ec2bed` | merged: a header fragment is never a program page | COBIx's note (First things 7) |
| #3345 | `c7b80e95` | merged: six colleges rescored, one wave; #3305, #3317 to #3321 closed with pointers | course-id rescore (5) |
| #3329 | `7e017287` | merged: Honors step 1 receipt; `.apply` equal to main's, migrate run 43671605511 skipped at its gate | none |
| #3326 / #3323 | `efadff5a` | merged 04:30Z: CDC data dictionary and integration view, the restricted class; #3323 closed with a pointer | the builder's table check (commons lane) |
| #3330 / #3327 | `claude/second-reader-gate-s653` `f11fe540` | `test` failed 04:16Z; finalizer diagnosing at 04:30Z | First things 2a |
| #3346 | `claude/harvest-followups-s654` `b8c5abd7` | fix in: recall 589 of 589, 0 wrong; COBIx nothing new | First things 2b |
| #3315 | `claude/honors-of-rows-s653` `9d065916` | ready plan: 382 rows, digest `29667c07`, 129 mints, 157 held; nothing applied | First things 2c, 3 |
| #3344 | `claude/slo-objectives-sac` | draft; Santa Ana objectives reread pushed 02:09Z | First things 8 |
| #3284 | `claude/slo-allan_hancock` | draft; Allan Hancock trial pushed 02:09Z | First things 8 |
| #3293 | `cb60a1b0` | draft; keep | First things 9 |
| #2894 | | Sam's | none |
| #3347 | `claude/checkpoint-s654` | this checkpoint | merge on a green `test` |
| samueltlee/CPLBrain#793 | `6f2622a9` | merged: session note, wiki touch, Sheet 199's builder (#791 closed with a pointer) | none |

**Why #3326 waited at its gate.** Its `test` went green on `4ed11763` at 04:05Z, but COBIx's point 1 (comments
6888070761 at 02:40Z and 6888592670 at 03:31Z) was open and real: the held-class sentence said anyone may read a held
field on the public site, which covered student rows, staff contacts and articulation status. The fix added a fifth
class, restricted (`d-cdc-restricted-class-s654`); COBIx cleared it at 04:15Z and it merged at 04:30Z. The thread went
unread for 86 minutes (`p-thread-unread-until-merge-s654`).

## Decisions to honor (rows in `kb/receipts/cpl_memory_s654_rows_2026-11-15.sql`)

`d-honors-anchored-rows-s654` (supersedes `d-honors-narrow-positive-rule-s654`), `d-cdc-held-means-not-shared-s654`,
`d-cdc-restricted-class-s654`, `d-honors-no-mint-on-split-candidate-s654` (COBIx's design read, adopted) (commons lane); `d-one-spend-meter-s654`, `d-rescore-wave-one-branch-s654`, `d-ge-control-number-needs-title-s654`,
`d-control-number-district-format-s654`, `d-step11-runs-2026-11-15` (harvest lane; governance points to the meter); `d-merge-stack-tops-s654`
(`conductor_mode`). Facts: `rescore-wave-passing-15856-s654` (statewide passing 15,840 to 15,856 of 22,335), `ppm-three-not-cccs-sam-s654` (Sam's Sheet 198 card 11 words; programmapper.org is outside
the cloud session's network, so the site was not read), `cobix-3299-spot-check-13-of-14-s654`.

## Pitfalls learned

The `worker` type always makes a worktree (`p-worker-type-always-makes-a-worktree-s654`); an API 522 can end a worker,
so tell long workers to push at each step (`p-api-522-kills-workers-s654`); keep briefs and finding lists in scratchpad
files (`p-context-half-in-70-minutes-s654`); read `date -u` in the same command as any time you write
(`p-conductor-times-from-memory-again-s654`); a stacked PR conflicts after its base squash-merges
(`p-stack-squash-conflicts-s654`); a matching rule written into a brief needs the self-recall test like any matcher
(`p-conductor-rule-without-self-recall-s654`: #3346's second reader caught 84 lost right answers before the merge); read
a PR's thread when its worker reports, not only at the merge gate (`p-thread-unread-until-merge-s654`).

## Patterns that worked

A finalizer worker that only brings one named PR up to `main` and rebuilds generated files (six merges, no red
`main`); a second reader on every fix delta; reading each PR's last comment page in the same step as the merge.

## Sam and the standing sheet

[Open Asks Sheet 199](https://claude.ai/artifact/KiRPjskYco3pSfDS7rt9Sc) is **current** (published 2026-11-15,
`SHEET_ID` `2026-11-15-open-asks-199`; seven cards recording the conductor's decisions; its `replies` store was empty at
publish; nothing waits on Sam). Read its replies first; an unanswered card holds only itself.
[Sheet 198](https://claude.ai/artifact/4C48Gufarc7L11b34Gu6Hy) is superseded by it (answered in full 2026-11-14). The
vault PR samueltlee/CPLBrain#793 is merged (`6f2622a9`: the session note, the wiki touch, Sheet 199's builder; it
carried S653's #791, closed with a pointer).

## A full checkpoint: what it touched and what it skipped

Touched: the docs audit (`kb/docs_audit/2026-11-15.*`) and `--apply`; this handoff; the lanes
`program-requirements-harvest`, `commons` and `governance-team-enablement` (each under 20,000 bytes; retired text
moved verbatim to the lessons docs, *Moved from the lane (S654 checkpoint)*); the three lessons docs' S654 sections;
`conductor_mode.md` (S654 lessons); the index rebuild; the run logs `kb/status/program-requirements.json` and
`course.json` (session fields and changes only); the memory receipt `kb/receipts/cpl_memory_s654_rows_2026-11-15.sql` (RUN by the conductor at about 04:42Z in one
`execute_sql` call; the verify read back 20 rows, each with one create log row, longest summary 398;
`ppm-three-not-cccs-sam-s654` is `proposed`, since Sam did not verify that the site was not read).
Skipped: step 12's stamps (run at 01:50Z, #3343); the pipeline view (no roadmap row, auditor count or re-mint moved);
`kb/README.md` and `README.md` (no KB structure or user-facing surface changed); the §11 rows (no lane changed live,
in progress or parked); `stack_scouting.md` (no tool trial); KB notes (none crossed the bar); the vault (another
worker). Wiki candidates (`/wiki-ingest`): Honors rows rest on same-college anchors; one spend meter prices every model
caller; a GE page's control number needs its title; held means left out of an outside share.

## Let go

The conductor holds no PR subscription (dropped #3343, #3344, #3345 as they opened) and no artifact watch; it deletes
any check-in still scheduled. Workers and their checkouts do not survive the session: brief a fresh worker per open
branch.

Greetings, you are SkyCurlew (Session 655), see SkyWhimbrel's handoff — `docs/session_655_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_655_handoff.md) — let's keep rolling with our queue.
