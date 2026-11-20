---
title: "Session 691 handoff (from SkyMerlin, S690)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyPetrel (Session 691)

**Routing.** This handoff is the CPL Queue routine's. A plain session Sam opens follows `docs/session_692_handoff.md` (SkyGannet, from SkyShrike, the plain session that ran beside this one).

From SkyMerlin, S690, the CPL Queue routine's 11:12Z firing of 2026-11-20: it found S689 live on #3584 and stood down
at 11:13Z, was told *"keep going"* at 11:45Z, waited for S689's sign-off push (about 12:13Z), declared on draft #3599
and took the queue. A conductor run for collection only under Sam's routine prompt of 2026-11-17, following the COBIx
brief on #3358 (updated 2026-11-20T02:38Z) and Sam's work order of Nov 20. A **full checkpoint** (lanes moved; Rule 10
data writes ran: reread and pages posts and loads, City College of San Francisco's outline load), written by the
checkpoint-docs worker at about 16:50Z while the run went on. The conductor filled its sign-off lines at 17:43Z.
(no user-facing surface changed; #3600 is not deployed), step 7 (no M-ID pipeline move: no re-mint, no roadmap state
change) and step 9 (the UI pass is its own queue item).

**The start.** S689 was live (PR #3593 updated 11:07Z, a `main` merge at 11:12Z), so the firing stood down in one line,
then waited for S689's final handoff push on #3584 before writing anything shared, the pattern of
`d-firing-waits-for-sign-off-then-takes-queue-s685`. A plain session with Sam ran beside it (the Commons fixes, the
M-ID census, the hunt file, `checkpoint.md`; the split is on #3584, comment 7039601326). No `list_sessions`,
`get_trigger`, `get_session` or `set_session_tags` in this session (the remote tools held only `add_repo` and the PR
subscription tools).

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief for conductor runs is on issue #3358** (updated 2026-11-20T02:38Z): read it before the split.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Read a PR's whole thread before you merge it or apply any file it carries
   (`p-apply-before-thread-read-s685`).
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus dependabot's), the oldest finished first
   (`d-oldest-finished-among-finished-s688`), one update from `main` right before its merge, no dependency-map rebuild
   inside a PR, no full rerun when the input fingerprints match.
2a. **Collection comes first** (Sam, 2026-11-20, 2:24 AM PT, `r-collection-first-sam-2026-11-20`): data waves go first;
   a fix goes ahead of the next wave only if it blocks that wave or would file wrong rows into the live tables; minor
   findings go into one follow-up PR per night; review rounds match what the change needs.
2b. **Collection serves the M-IDs** (Sam's work order, 2:28 to 3:43 AM PT on Nov 20,
   `r-collect-for-mids-work-order-sam-2026-11-20`, with `r-curation-order-adds-crs-sam-2026-11-20`): rank collection
   fixes by the M-ID cards each would unblock. *"no one's getting any younger out there."*
2c. **The plain page read** (Sam's go, 6:26 AM PT on Nov 20, `r-plain-page-read-blocked-catalogs-sam-2026-11-20`):
   the colleges marked *Sky can read* in the harvest lane are read every night with an ordinary page request; robots.txt
   first, no challenge solved, no 403 retried.
3. **Merge order:**
   - **Merged:** #3604 (the wave, with the display page folded in, so #3606 closed into it) as `b2635d43`.
   - **First, #3602** (the night's one follow-up PR, `claude/s690-follow-up`, head bf11c15d), which carries over. Update it
     from `main` once and rebuild `kb/status/commons_data.json` with `kb/_build_commons_data_status.py`: it conflicts on that
     generated file. Then wait for `test` and merge. Its second reader's round 1 is done: verdict fix first, and the blocking
     `catalog_style` was dropped. A fix that drops code needs no second round.
   - **This checkpoint #3599** merges at sign-off.
   - **Dependabot's #3383** waits as before.

## What shipped (squash-merged on `main`, `test` green on each head, each thread read)

- **#3600 `9fc88a07`** (13:01Z): `main` was red from 653864b7, the Library check run's first pass (run 44733588776),
  which stamped every page's accessibility line, the starter page's included. ELL IET's reading text passed Sierra's
  34,000 characters and new pieces copied the starter's line. The reading text now skips the check block and new pieces
  drop it (`d-main-red-check-line-stays-out-s690`). **Not deployed:** `cpl-chat-deploy.yml` for `cpl-chat` and
  `library-revise-draft` waits for a plain session.
- **#3601 `46f92c76`** (13:48Z): City College of San Francisco's outline reads file parsed outcomes only. The recall
  gate counts by eye from the trial's job-log SLO excerpt under the parser's fingerprint; the second reader's first
  round was BLOCKING (the hand counts equalled the parser's own), the second said merge.
- S689 merged its checkpoint #3584 (`bcc3f8a8`) at about 13:49Z.
- **#3604 `b2635d43`** (17:41Z), the wave: City College of San Francisco's 1,416 outline rows, the 17,341 printed courses,
  the program records at nine colleges (CCSF's seven from its 2025-26 catalog among them) and the display page.
  - CCSF's prior-year read: capture 44777204746, 7 of 27 own pages, extract 44777882954 ($0.49), load 44779214785.
    The other 20 need another source.
- **Display build `ac082e9d96dc`**, replacing `4c57fd250cce`:
  - Laney first: 44773599660, 156 of 156.
  - The gate: 44774197489.
  - The whole build: 44774570780, writing 18,337, 0 errors.
  - The closing count: 44775521409, with 18,493 rows at the new build. One row still sits at `4c57fd250cce`, a gap
    older than the build.
- **The census:** `harvest-gap-census.yml` dispatched on `main` after #3604 at 17:42Z; read its result against 5,069 first.
  The live headline at about 17:06Z, before the census, was 15,163 of 20,282 passing at 118 colleges.
- **The follow-up PR, #3602** (open; see the merge order). Its rereads already ran live: Berkeley City 44783512034
  (15 posted, 14 machine pass) and Glendale 44783518135 (59 posted, 47 machine pass). The conductor's live read
  confirmed 15 and 59 rows, none checked. The PR files their records.

## Records collected and outline rows added

- **Program records: 35 new, 129 replaced by a better reread, 6 restored, 3 held for a person.** The pages levers:
  Laney 6 and 26, Diablo Valley 1 and 27 (18885 restored), Orange Coast 4 and 16 ($7.68). The reread plan's rows 46 to
  55: Napa Valley 6 and 24 (3 restored, 3 held), Cerro Coso 4 and 6, Santa Monica 5 and 0, San Diego College of
  Continuing Education 8 and 5, Mt. San Antonio 1 and 25 (08086 and 31650 restored) ($7.89). Run ids: lessons, *S690*.
- **Outline rows: 1,416**, City College of San Francisco's SLOs (read 44748015052, 1,417 pages, every page 200; load
  44767903173; receipt `kb/receipts/course_outcomes_ccsf_44767903173.json`; live count confirmed).
- **Printed catalog courses: 17,341 at 16 colleges** (below), filed in `kb/hand_filed_catalogs/courses/` on #3604.
- **CRE: 1,941** (35 new records at 15 each, plus 1,416 outline rows) at the checkpoint.

## The morning line, one per college (Sam's go asked for it)

All filed for 2026-27, read on the runner by the census Reader, no paid extraction:

- North Orange Continuing Education: 1,089 courses, 48 subjects (HLTH 167 and PARN 170 among them), HTML (runs
  44756513382, 44757980757). Programs: nothing to pay (44758918611). Outlines: CurricUNET, still on the hunt.
- Southwestern: 1,692, HTML (44759854547).
- Cerritos: 1,656, HTML (44767159068).
- Long Beach City: 1,595, HTML (44765123063).
- Monterey Peninsula: 1,137, HTML (44765198579).
- Clovis 473, Los Angeles City 1,123 and Los Angeles Valley 939: catalog PDFs (44759950664); Los Angeles Valley's
  program park stands.
- East Los Angeles 1,676, Los Angeles Harbor 765 and Los Angeles Southwest 724: catalog PDFs (44762233563); Harbor's
  Sept 10 addendum is not in its PDF.
- Los Angeles Mission 798, Pierce 414 and Los Angeles Trade-Technical 1,099: catalog PDFs (44763620806).
- West Los Angeles: 719, catalog PDF (44764775167 and 44763620806).
- El Camino: 1,442 from Sam's copy (44762315427); its Fall and Summer 2026 addenda not read.

Sam's copies of the other four colleges print two columns, so those were read from their own PDFs. PDF rows are
best-effort, and each file names an upper bound of missed courses. No committed pipeline yet joins these files to the
M-ID cards, so a description gap the Commons shows at these colleges stays until one does (harvest lane NEXT (2)).

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S690*; `docs/reference/conductor_mode.md`, *What went wrong in S690*;
[`methodology-a-bot-wall-answers-each-network-on-its-own`](kb-notes/methodology-a-bot-wall-answers-each-network-on-its-own.md);
[`methodology-a-test-must-not-take-its-rule-as-the-truth`](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md),
*A recall gate on outline pages*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (Sam's work order: outline fills first, program records second):
   - Land S690's open work: #3604, the display build and its page-file PR, the census against 5,069, the follow-up PR.
   - Golden West's header rows, stopped after two review rounds (`d-golden-west-stops-after-two-rounds-s690`; the plan
     on `claude/s690-goldenwest-header` ae5be1d5): settle the rollback and the write-before-merge order with COBIx,
     then the guarded correction of 476 rows (`f-golden-west-476-header-rows-s690`).
   - The reread plan's rows 56 to 73: post the filed extracts through keep-the-better and load them (Cuyamaca, Moreno
     Valley, Norco, Fullerton; then College of the Canyons, San Jose City, San Diego City and San Diego Mesa once their
     runs are read); Merced, Reedley and Sacramento City failed the gate.
   - Butte: compare normalized page addresses in `unchanged()` and `held()`, then its one aim program.
   - Solano (11) and Cañada (3): free captures, then pay only where the own page is found.
   - The shared-page lever at Orange Coast and Diablo Valley (34 programs), measured free; Orange Coast's 109 live rows
     at an older run than `main`'s files.
   - City College of San Francisco's rule D prior-year read waits on COBIx (#3358, comment 7040201320).
   - Then the outline readers' list, Copper Mountain, the cheap piles and items 12 to 19, as the lane gives them.
2. **`library`:** deploy #3600 (a plain session); read the one failing piece's findings on its card; then #3560 part 4,
   then part 3.
3. **A plain session's, each by its lane's NEXT** (conductor runs stay on collection, Sam's prompt of 2026-11-17):
   `commons` (the open data questions, the #3570 gaps, a deployed check that a college's `course_outcomes` rows carry
   its name, and the Rule G confidence apply); `common-cr-reference` (the exact match from issue #3523);
   `governance-team-enablement` (`daily-dashboard.yml` in its own PR, the branch-run files, the next function
   deploy's usage return); `implementation-funding` (the credit lane's items still Sam's in the tab);
   `map-users-student-contact` (the 7 search-tier candidates, the 17 blanks, Sunday's district-page reads);
   `my-college-action-page` (the display apply after #3424, card 2's nightly snapshot); `repo-size` (Part 5 waits on
   Sam's go; the slimming items); `sierra-page-redesign` (phase B and the photo design call); `workplan-annual-goals`
   (its NEXT list); `cer-procedures` (the pair apply).

## For Sam

Nothing waits on Sam. [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current) is unchanged.
For his information only:

- The sixteen catalogs of his 6:26 AM go are filed, one line each above. The runner was served the pages the sandbox
  saw challenged (`f-waf-answers-runner-and-session-apart-s690`).
- City College of San Francisco's 2025-26 catalog sits behind a Cloudflare 403 at `www.ccsf.edu`; its 27 not-printed
  programs keep their gap until COBIx answers on #3358.
- Napa Valley 19126, 31158 and 36528 are held for a person.

## Decisions Sam made

- **The plain page read** (Nov 20, 6:26 AM PT, relayed by COBIx on #3584, comment 7042043701): *"read these catalogs
  with a plain, browser-like page read in tonight's collection wave."* COBIx's reading (comment 7042639554): an
  ordinary page request, robots.txt followed, no challenge solved, no 403 retried. Row
  `r-plain-page-read-blocked-catalogs-sam-2026-11-20` (verified, in the drafted migration); `sam_rulings.md`; the
  standing block, item 2c.
- Sam's earlier rulings of Nov 20, recorded by S689, stand: collection first, collection serves the M-IDs, and credit
  recommendations in the curation order.

## Decisions (the session's)

The conductor's, all reversible: `d-main-red-check-line-stays-out-s690`, `d-mid-ranking-orders-lane-1-s690`,
`d-carryovers-closed-for-cap-s690`, `d-course-rows-gzipped-s690`, `d-noce-stays-on-outline-hunt-s690`,
`d-reread-gate-same-page-calls-s690`, `d-golden-west-stops-after-two-rounds-s690`. Memory rows:
`kb/migrations/2026-11-20_s690_cpl_memory_rows.sql` (19 rows, 18 `proposed` and Sam's verified; rollback beside it),
not pointed at by `.apply`; the conductor applies it with `execute_sql`.

## Patterns that worked

- One read-only M-ID count ordered the night, and its first item, City College of San Francisco's outlines, loaded.
- The reader's own capture settled access: sixteen catalogs the sandbox saw challenged were read on the runner.
- Free first: Victor Valley, Mt. San Jacinto and Southwestern found no own page, so nothing was paid there.
- Two review rounds, then ship (#3601) or stop with the plan on a branch (Golden West).
- Closing the carry-overs with pointers held the three-PR cap.

## Safety patterns to honor

All of 690's. New: `p-recall-gate-counts-parser-output-s690` (count the page by eye, and refuse an empty, refused or
re-fingerprinted trial); `p-workers-hand-back-on-background-wait-s690` (a worker waits on its own runs with a
background check); cite the reader's capture for access, never a session's probe; a correction whose rollback rests on
one large returned value waits until the receipt can undo it row by row. Never file a person's name from an outline
page into a memory row, a lane or a handoff. Keep to three open PRs.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*, Sam's change of 2026-11-11; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one
college; about $750 a day for everything, $10k and $30k running totals for the whole job; workers on Opus 5.5, cheaper
models for routine reads, high effort on any worker that writes shared data; reviews at most 9 agents, stopped after
two rounds with what is left sent to Sam or COBIx; $40 per college per run for program requirements and a separate $40
for SLOs, PLOs and course objectives, per run, never a remaining pot. The routine's form sets the conductor (Opus 5.5
since Sam's switch of Nov 19, relayed by COBIx). A session Sam starts by hand works the queue itself.

## The college split (written before any worker started, 12:23Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when its
lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`).

**The order follows Sam's work order (handoff 690, item 2b; `r-collect-for-mids-work-order-sam-2026-11-20`): fixes
ranked by the M-ID cards each would unblock.** A read-only count over the committed files (12:22Z; 49,558 live
cards): City College of San Francisco's outlines are the one outline fill runnable tonight and the largest, with
2,065 cards improved, 1,020 completed and 1,401 given their first SLO or objective text. The next six by that count
(American River, Southwestern, Glendale, Santa Barbara City, Fullerton, College of the Canyons) have no public
outline system or sit behind a bot challenge, and no committed pipeline fills a missing course description. Program
records feed no M-ID card, so the two program workers run beside `ccsf` as the second tier.

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `ccsf` (City College of San Francisco, every table; first):** its outline trial filing parsed outcomes only
  (`d-ccsf-outline-trial-no-staff-names-s689`), then its full read and load if the trial holds; rule D's prior-year
  read of its 27 not printed. Then, at colleges no other worker holds: Golden West's 474 header rows (the reader fix,
  and a guarded correction with before-values, run by the conductor after a second reader), and the held outline
  colleges' index fixes (Rio Hondo's search, Irvine Valley's status words).
- **Worker `reread` (the reread plan, `kb/program_requirements_reread_plan_s683.json`, rows 46 to 73 but Berkeley City):**
  Napa Valley, North Orange Continuing Education, Saddleback, Cerro Coso, Mt. San Antonio, Santa Monica, San Diego
  College of Continuing Education, Bakersfield and Butte; then Chaffey, Cuyamaca, Cypress, Fullerton, Merced, Mission,
  Moreno Valley, Norco, Reedley, San Diego City, San Joaquin Delta, San Jose City, Sacramento City, San Diego Mesa,
  College of the Canyons, Los Angeles Trade Technical, Los Angeles Southwest and West Los Angeles; then the free
  captures at Solano and Cañada (the ligature fold). $40 per college per run, at most 10 colleges a batch, the better
  record kept before posting, a load after each reread.
- **Worker `pages` (the census's next free page-finding levers):** Victor Valley, Diablo Valley, Laney, Mt. San
  Jacinto, Orange Coast and Southwestern. A free page read first; paid extraction only for programs whose own page is
  found.

**Split changes during the run.**
- Worker `pages` finished at 14:1xZ, and its six colleges are released.
- Lane 2's worker `piles` started at about 14:15Z on Berkeley City and Glendale only.
- At 14:35Z, Sam's go of Nov 20, 6:26 AM PT (relayed by COBIx on #3584, comment 7042043701: *"read these catalogs with
  a plain, browser-like page read in tonight's collection wave"*) started worker `catalogs` on NOCE first, then
  Southwestern, Cerritos, Long Beach City, Monterey Peninsula, Clovis, Los Angeles Valley, Los Angeles City, Los
  Angeles Southwest, Los Angeles Harbor, East Los Angeles, West Los Angeles, Los Angeles Trade-Tech, Pierce, Los
  Angeles Mission and El Camino.
- `reread` released North Orange Continuing Education, Los Angeles Trade Technical, Los Angeles Southwest and West
  Los Angeles to it.
- Worker `ccsf` finished before the checkpoint: City College of San Francisco's outlines loaded, its rule D prior-year
  read blocked, Golden West stopped after two rounds; its checkout removed.
- Worker `catalogs` filed its sixteen colleges; worker `reread` handed back with rows 56 to 73 extracted on read
  branches and not posted.
- Worker `display` started on `claude/s690-display`, off the wave branch: Laney first, the gate, the whole build, the
  closing count.

**Lane 2, the cheap piles (one worker, free rule work; starts after lane 1's workers sign off).** S689's carry-overs
#3593 (Berkeley City's Cal-GETC 34, then Berkeley City's reread) and #3597 (the shared no-ending address), the minor
findings of #3586, #3590 and #3594, and the spend file's `updated`, in the night's one follow-up PR (item 2a of
handoff 690); then the catalog-wording rules at Glendale, Santa Monica, College of the Canyons and City College of San
Francisco once lane 1 has nothing in flight there. Los Medanos stays parked.

**The conductor's own:** dispositions of the open PRs, the wave PR, merges, the display build once after the night's
posts, then `harvest-gap-census.yml` against 5,069, and the checkpoint.

**Not tonight:** the Library (#3560 parts 4 and 3), repo slimming, Rule G, one credential list, the cer-procedures
pair apply and the CR exact match (the plain session's list, brief section 4).

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3599 this declaration and checkpoint (`claude/awesome-fermat-8o89wm`) | the checkpoint | merged at sign-off (see `main`) |
| #3604 the wave (`claude/s690-wave`) | merged `b2635d43` | none |
| `claude/s690-display` | the display build, running at the checkpoint | the page folded into #3604; #3606 closed | none |
| `claude/s690-follow-up` | #3602, open, head bf11c15d; rereads ran live | update from `main` once, rebuild `commons_data.json`, merge on a green `test` |
| #3600, #3601 | merged (9fc88a07, 46f92c76) | #3600's deploy, a plain session's |
| #3593, #3597 | closed with pointers (comments 7039647197, 7039648134) | fold into the follow-up PR |
| #3603 | closed into #3604 | none |
| `claude/s690-goldenwest-header` (ae5be1d5) | stopped after two review rounds, no PR | COBIx and the next session |
| `claude/s690-ccsf-prior` | trigger branch, left | COBIx's answer on #3358 (comment 7040201320) |
| the read branches of rows 56 to 73 (`claude/s690-read-<slug>`) | extracts filed, not posted | keep-the-better, post, load |
| samueltlee/CPLBrain#832, the vault note (`claude/pensive-archimedes-8o89wm`) | draft | merge it |
| #3383 | dependabot's | as before |

## Let go

Dropped in the sign-off turn: the COBIx watcher (its Monitor stopped). No PR subscription was held (each PR was gated by reads), no check-in is scheduled, and no artifact is watched. Every worker is finished and its checkout removed, except the checkpoint's own.

Spend: $202 (estimate from token counts at list prices; Opus 5.5 $200.50, Sonnet 5.5 $1.31, Haiku 5.5 $0.19); collection $181.50, infrastructure $20.50; 2026-11-20T11:12Z to 2026-11-20T17:43Z.

The filed extraction runs' own cost is listed apart: $7.68 (the pages levers), $7.89 (rows 46 to 55) and rows 56 to
73's runs (Cuyamaca $2.30 and the others, in their receipts). After the line is final, with its tags, run
`python3 kb/_build_spend_daily.py --sessions-only`.

Opening line: *Greetings, you are SkyPetrel (Session 691), see SkyMerlin's handoff — `docs/session_691_handoff.md` — let's keep rolling with our queue.*

S690 final: cost about $202 at list prices, estimated from token counts, plus $18.36 of named filed extraction runs (pages $7.68, reread batch 1 $7.89, City College of San Francisco's prior year $0.49, Cuyamaca $2.30) plus batch 2's other extracts, in their run receipts; records collected: 42 new program records (plus 203 replaced by a better reread or rescore, 6 restored, 3 held for a person) and 17,341 printed catalog courses; outline rows added: 1,416; substantive PRs merged: 3 (#3600, #3601, #3604), not counting checkpoints.
