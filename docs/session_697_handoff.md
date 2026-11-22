---
title: "Session 697 handoff (from SkyPetrel, S691, the CPL Queue routine's collection night of 2026-11-21)"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_701_handoff.md
---

**Routing.** This handoff is the CPL Queue routine's. A plain session Sam opens follows `docs/session_696_handoff.md`
(SkyFulmar, from SkyShearwater).

# You are SkyPuffin (Session 697)

From SkyPetrel (S691), the CPL Queue routine's collection night of 2026-11-21, first command 07:13Z. S694, a plain
session, also signed as SkyPetrel, so this run always carries its number. A conductor run for collection only, under
Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (updated 2026-11-21T02:33Z). A **full checkpoint**
(lanes moved; Rule 10 data writes ran: posts, loads, a display build), written by the checkpoint-docs worker at about
10:50Z while worker `outlines2` still ran; the conductor applies the memory rows, writes the vault note (step 11) and
fills the Spend and Final lines. Skipped: step 2 (no KB structure change; the harvest's files live in its lane), 3 (no
user-facing surface changed), 7 (no M-ID pipeline move) and 9 (the UI pass is its own queue item). Step 12: the run
log's session fields are written; its headline pair, harvest row and next firing are the conductor's (Supabase and
`get_trigger`). `kb/status/course.json` waits on `outlines2`'s loads.

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief for conductor runs is on issue #3358** (updated 2026-11-21T02:33Z): read it before the split.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and read its output
   yourself every few turns: it wakes no one and stops at the two-hour background limit, so restart it. Act on each
   new `<!-- cobix -->` comment; read a PR's whole thread before you merge it or apply what it carries
   (`p-apply-before-thread-read-s685`).
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints
   match. Stop a review after two rounds.
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:**
   - **Merged tonight:** #3602, #3634 (the wave), #3633 (the follow-up), #3635 (the display page file).
   - **First, `outlines2`'s PR** (Saddleback, then Rio Hondo), running at this checkpoint: a second reader, `test`,
     one update from `main`, then the merge; its loads carry their receipts.
   - **This checkpoint #3632** (`claude/awesome-fermat-8cosoz`) merges at sign-off. It carries, as its own commit,
     the fix for `main`'s red `test`: from the census commit c1700e76, `tests/spend_daily_build_test.py` pinned the
     spend file's `updated` to 2026-11-15, a day the census's full build now moves (run 44893759916, `lints`).
   - **Dependabot's #3383** waits.

## The start

No `list_sessions`, `get_trigger`, `get_session` or `set_session_tags` in this session. Open PRs at 07:13Z: #3602
(draft, last updated 2026-11-20T17:35Z) and dependabot's #3383; `main`'s last commit 08506fa4 at 05:15Z (S695's
checkpoint), so no live session. `daily-dashboard.yml` had already succeeded on 2026-11-21 (run 44864091313). No pause
line. Three repos attached. Open Asks Sheet 200 is fully answered, so nothing waits on Sam.

## The college split (written before any worker started, 07:20Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when its
lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`). Order by Sam's work order
(`r-collect-for-mids-work-order-sam-2026-11-20`) and the brief's collection list.

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `reread`:** the reread plan's rows 56 to 73 (`kb/program_requirements_reread_plan_s683.json`), extracted on
  `claude/s690-read-<slug>` and not posted: Cuyamaca, Moreno Valley, Norco, Fullerton, College of the Canyons, San Jose
  City, San Diego City, San Diego Mesa. Keep-the-better, post, load. Merced, Reedley and Sacramento City failed the
  gate and stay. Then College of the Canyons' own levers (census lever 3, 101 programs, a free page read first; lever 8,
  37, its catalog wording), since it holds Canyons all night.
- **Worker `pages`:** the census's free page-finding levers: Ohlone 36, San Joaquin Delta 30, Santa Barbara City 28,
  Mt. San Antonio 28, Fresno City 26, West Los Angeles 24; then Solano 11 and Cañada 3 (the ligature fold). A free
  page read first; paid extraction only for programs whose own page is found.
- **Worker `outlines`:** outline readers, ranked by the M-ID cards each fills: Rio Hondo's index search, Irvine Valley's
  and Saddleback's status words, San Diego College of Continuing Education's index search; the 12 still-taught
  courses' outline text where a person's paste carries it (North Orange Continuing Education, Southwestern,
  Grossmont; Ohlone's four print nothing); then Golden West's before-values file, written first so the rollback
  undoes row by row (COBIx's call in the brief, section 2 item 4). The guarded correction of the 476 rows waits on a
  plain-session review and does not run tonight.

**Lane 2, the cheap piles (one Opus 5.5 worker, high effort, free rule work).**

- **Worker `piles`:** first #3602 (update from `main` once, rebuild `kb/status/commons_data.json`; the conductor gates
  and merges), which files Berkeley City's and Glendale's reread records. Then the census's free rule levers at
  colleges lane 1 does not hold: lever 2 (the general education pattern's units, 192 statewide), lever 4 (a noncredit
  total in hours, 68), the catalog-wording rules at Santa Monica 43, Glendale 33, Santa Rosa Junior 27, Clovis 26 and
  City College of San Francisco 28, and City College of San Francisco's 20 programs still unprinted after the 2025-26
  read (discontinued flags or a named gap). A rescore leaves out every college lane 1 holds. College of the Desert's
  8 stay behind robots.txt; Los Medanos stays parked.

**The conductor's own:** the dispositions of the open PRs, the merges, the paid-run checks against the caps, the
display build once after the night's posts, `harvest-gap-census.yml` against 4,982, and the checkpoint.

**Not tonight** (the plain session's list, brief section 4): repo slimming item 3, `START_HERE.md` and the `CLAUDE.md`
cut, the M-ID mint work, the Library, Rule G, one credential list, the cer-procedures pair apply, the CR exact match,
and the page fixes. The two Library briefs requested on 2026-11-12 stay a plain session's.

**Split changes during the run.**

- Worker `piles` did #3602's update, then ran out of context in its second task; `piles2` and `piles3` finished lane 2
  (`p-one-concern-per-worker-context-s691`).
- `reread` handed College of the Canyons and the wave branch to `canyons`.
- `outlines` handed its full reads to `outlines2`: Saddleback, then Rio Hondo, both loaded before the checkpoint
  merged (#3638).
- `display` ran the build after the wave merged.
- Four checkouts ran at once (`d-four-checkouts-on-measured-disk-s691`).

## What shipped (squash-merged, `test` green on each head, each thread read)

- **#3602 `4bb2276c`** (08:12Z): S690's follow-up, updated from `main`. `kb/status/commons_data.json` was rebuilt under
  Python 3.12 after CI failed on a 3.11 build (one mean 0.6544 against 0.6543; 3.12's `sum()` compensates).
- **#3634 `f46f65e7`, the wave:** the reread plan's rows 56 to 73 (Cuyamaca, Moreno Valley, Norco, Fullerton, San Jose
  City, College of the Canyons; San Diego City and San Diego Mesa had nothing to extract); College of the Canyons'
  noncredit codes (lever 3: the reader takes a dot inside a subject code, NC.BUS 204; $12.88) and prefix aliases
  (lever 8: PSYC, POLS and COMM; 24 re-posted, machine-passing live rows 179 to 194 of 246); San Joaquin Delta ($2.18)
  and Solano ($0.87). Free captures found no own page at Ohlone, Santa Barbara City, Mt. San Antonio and Fresno City,
  so nothing was paid there.
- **#3633 `b6d52c8e`** (10:04Z), the follow-up: `math.fsum` in the builder; Santa Monica's pins for eleven programs,
  the revert 6ba61a4c of a timed-out read that dropped 46 records, a second read ($1.72) and reread (11 replaced);
  the gap `total_not_printed` (built, self-recall 1,821 right and 0 wrong, not applied). City College of San
  Francisco's `not_printed_current_or_prior` rule was dropped after its second read.
- **#3635 `ca45115f`:** display build `e35ae1722a56` replaces `ac082e9d96dc`: College of the Canyons first
  44890523187 (246 of 246), the gate 44890803467, the whole build 44890972799 (18,363 written, 0 errors), the closing
  count 44891433372 (18,609 rows at the new build). 32 rows stay at older builds, the same 32 as S690.
- **The census** 44892712171 (10:10Z, `main` c1700e76): 4,875 left of 20,282, passing 15,314 (from 4,982 and 15,207).

## Records collected and outline rows added

- **Program records: 109 new, 201 replaced by a better reread, 24 re-posted, 5 restored, 2 held for a person**
  (College of the Canyons 43388, West Los Angeles 46261). Extraction runs: $17.70. Run ids: lessons, *S691*.
- **Outline rows: 4,465** (#3638). Saddleback 2,581 (1,280 SLO rows holding 4,749 SLOs, 1,301 objective rows holding
  10,617 objectives; read 44892658073, 1,301 pages; load 44900668650, ids 43185 to 45765) and Rio Hondo 1,884 (945 SLO
  rows holding 3,697 SLOs, 939 objective rows holding 6,271 objectives; read 44893126504, 946 pages, HOND 045 left
  unread; load 44900763784, ids 45766 to 47649). Every page answered 200, none cut or refused, all on parser
  `2629a09a`; recall gates 12 of 12 (trials 44890274600, 44890279483). Two stray lines loaded as printed, for a
  session's cleanup: Saddleback ARCH 10's SLO "#1" and Rio Hondo THTR 231's "Lab Outline:" heading lines.
- **CRE: 6,100** (109 new records at 15 each, plus 4,465 outline rows).

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S691*; `docs/reference/conductor_mode.md`, *What went wrong in S691*;
[`methodology-a-generated-file-is-built-with-the-runners-python`](kb-notes/methodology-a-generated-file-is-built-with-the-runners-python.md).

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (outline fills first, program records second):
   - Land `outlines2`'s PR and loads (Saddleback, then Rio Hondo; HOND 045 and HOND 045-1 fold into one code,
     `f-hond-045-fold-s691`). Then by the M-ID count (`f-outline-ranking-s691`): Irvine Valley's status words and San
     Diego College of Continuing Education's index search. Refresh City College of San Francisco's recall gate on `main`
     (8c95dee8 against the trial's d5cef493, `f-ccsf-outline-gate-stale-on-main-s691`) before its next read.
   - Golden West's 476 header rows: the before-values file is filed (checksum cb441aa1; the plan on
     `claude/s690-goldenwest-header` 0995d8b5); the guarded correction waits on a plain session's review.
   - Two reader fixes before the next paid college read: a timed-out read must not file
     (`f-timed-out-read-still-files-s691`), and `would_extract` must honor the reread gate's same-page calls
     (`f-would-extract-relists-same-page-s691`).
   - City College of San Francisco: its 20 not printed stay unnamed (`d-ccsf-20-not-named-s691`); its Cal-GETC step
     for 32080, 33652 and 46300 waits for a plain session, since the permission check refused the dry run twice.
   - The open levers: San Joaquin Delta's apprenticeship programs (`f-sjdelta-apprenticeship-coarse-net-s691`, measure
     free first); College of the Canyons' 9 noncredit programs with no page; Butte held; Cosumnes River waits on an
     `only` input; the cheap piles (lane 2's measures, the `total_not_printed` apply, lever 2's five free reads).
   - The next display build after the next posts, Santa Monica's eleven among them, then the census against 4,875.
2. **A plain session's, each by its lane's NEXT** (conductor runs stay on collection): `common-subjects-reference`
   (ECONMT and Electricity's adult-education codes; the Commons card's second count needs the confirms synced to a
   committed file); `repo-size` (the timed workflows' commits capped to once a day, the spreadsheet export and videos
   out of the tree, `START_HERE.md` and the `CLAUDE.md` cut, Part 5 on Sam's go; a finished worker's checkout removed
   once its head is pushed); `library` (deploy #3600, then part 4, then part 3); `commons` (the open data questions,
   the three Collect cards); `common-cr-reference` (the exact match); `cer-procedures` (the pair apply). Handoff 696
   carries the plain session's order.

## For Sam

Nothing waits on Sam. [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current) is fully
answered. For his information: College of the Canyons 43388 and West Los Angeles 46261 are held for a person; the
permission check refused City College of San Francisco's Cal-GETC dry run twice, and it waits for a plain session.

## Decisions Sam made

None this run. His standing rulings hold: collection first, collection serves the M-IDs, and the plain page read.

## Decisions (the session's, each reversible)

`d-four-checkouts-on-measured-disk-s691`, `d-canyons-nc-read-pays-v2-rereads-s691` (no `only` input, so the $21.90
estimate was paid; $12.88 actual), `d-ccsf-20-not-named-s691`, `d-generated-files-built-with-runner-python-s691`,
`d-merge-on-clean-when-files-disjoint-s691` and `d-golden-west-before-values-filed-s691`. DECIDED lines: the harvest
lane. Memory rows: `kb/migrations/2026-11-21_s691_cpl_memory_rows.sql` (23 rows, all `proposed`; rollback beside
it), not pointed at by `.apply`; the conductor applies it with `execute_sql`.

## Patterns that worked

- A free pricing run before paying caught College of the Canyons' doubled estimate.
- Second readers caught three real defects.
- `pr-gate` kept CI reads small.
- The declaration PR was refreshed within each half hour.

## Safety patterns to honor

All of handoff 691's. New: `p-one-concern-per-worker-context-s691` (one concern per worker); build a generated file
with the runner's Python, 3.12, and run `check_generated.sh` with a 3.12 `python3` first on PATH;
`p-clock-guard-guessed-time-s691` (read `date -u` before writing a time); `p-shared-git-shallow-lock-s691` (worktrees
share `.git`: confirm a merge with `git ls-remote`, never delete the lock); `p-actions-log-host-blocked-s691` (read a
job's tail with `get_job_logs`). A permission-check refusal is never routed around. Never file a person's name from an
outline page into a memory row, a lane or a handoff. Keep to three open PRs.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about $750 a day for
everything, $10k running total for the whole job; workers on Opus 5.5, cheaper models for routine reads, high effort on
any worker that writes shared data; reviews at most 9 agents, stopped after two rounds with what is left sent to Sam
or COBIx; $40 per college per run for program requirements and a separate $40 for SLOs, PLOs and course objectives,
per run, never a remaining pot. The routine's prompt names Fable 5.2 for tonight's conductor; this session runs as
Opus 5.5, the model its form gave it. Four checkouts at once on measured disk (1.5 GB a checkout, 58 GB free at
07:18Z), above the three of S653's smaller disk (`d-four-checkouts-on-measured-disk-s691`). Stop rules from the brief:
a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row; a rollback that
undoes over 1% of a day's rows; the $10k checkpoint.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3632 this declaration and checkpoint (`claude/awesome-fermat-8cosoz`) | the checkpoint | merges at sign-off |
| #3602 (`claude/s690-follow-up`) | merged `4bb2276c` | none |
| #3634 the wave | merged `f46f65e7` | none |
| #3633 the follow-up | merged `b6d52c8e` | none |
| #3635 the display page file | merged `ca45115f` | none |
| #3637 (`main`'s red `test`: the spend file's date) | merged `a34fa1c6` | none |
| #3638 the outlines (`claude/s691-outlines`) | merged `0672e874` | none; Irvine Valley's index is the lane's NEXT |
| `claude/s690-goldenwest-header` (0995d8b5) | plan and before-values file, no PR | a plain session's review |
| #3383 | dependabot's | waits |

## Let go

Dropped in the sign-off turn: the COBIx watcher (its Monitor stopped). No PR subscription was held (each PR was gated by
`pr-gate` reads), no check-in is scheduled, and no artifact is watched. Every worker is finished and its checkout
removed, except the documents worker's, which holds nothing unpushed. `samueltlee/CPLBrain#837`, the vault note, is a
draft for Sam to merge.

Spend: $156.72 (estimate from token counts at list prices; Opus 5.5 $155.57, Haiku 5.5 $1.15); collection $135.71, infrastructure $21.01; 2026-11-21T07:13Z to 2026-11-21T12:32Z.

The filed extraction runs' own cost is listed apart: $17.70 (College of the Canyons $12.88, San Joaquin Delta $2.18, Santa
Monica $1.72, Solano $0.87, West Los Angeles $0.05). Infrastructure is the documents worker, the PR gates and the
conductor's share of the checkpoint and the CI fixes; the rest is collection.

Opening line: *Greetings, you are SkyPuffin (Session 697), see SkyPetrel's (S691) handoff — `docs/session_697_handoff.md` — let's keep rolling with our queue.*

S691 final: cost about $157 at list prices, estimated from token counts (`get_session` was not among this session's tools), plus $17.70 of filed extraction runs; records collected: 109 new program records (plus 201 replaced by a better reread, 24 re-posted, 5 restored, 2 held for a person); outline rows added: 4,465; substantive PRs merged: 6 (#3602, #3634, #3633, #3635, #3637, #3638), not counting the checkpoint.
