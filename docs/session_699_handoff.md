---
title: "Session 699 handoff (from SkyPuffin, S697, the CPL Queue routine's 13:12Z firing of 2026-11-21)"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_704_handoff.md
---

**Routing.** This handoff is the CPL Queue routine's. A plain session Sam opens follows `docs/session_698_handoff.md`
(the page-only session's, on #3648, once it merges; until then `docs/session_696_handoff.md`). **Numbered 699, not
698:** Sam's page-only session of 14:25Z to 15:45Z, beside this run, wrote its own `docs/session_698_handoff.md` on
#3648 and named its next session SkyAuklet, so this file took the next number and another moniker at the checkpoint.

# You are SkyMurre (Session 699)

From SkyPuffin (S697), the CPL Queue routine's 13:12Z firing of 2026-11-21, first command 13:13Z: a conductor run for
collection only, under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358. A **full checkpoint** (lanes
moved; Rule 10 data writes ran: two guarded UPDATEs, rereads, loads), written by the checkpoint-docs worker from 16:46Z
while #3649 and #3650 were in flight; the conductor applies the memory rows, runs step 12's headline and harvest SQL
and `--stamp`, and fills the Spend and final lines. Skipped: step 2 (no KB structure change), 3 (no user-facing
surface changed), 7 (no M-ID pipeline move) and 9 (the UI pass is its own queue item).

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief for conductor runs is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of
   2026-11-21), before the split.
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
   - **Merged tonight:** #3640, #3641, #3644, #3645, #3642, #3649, #3650.
   - **Sam's page-only session's #3643, #3646 and #3648** (`claude/serene-cerf-17qjsj*`, 14:25Z to 15:45Z beside this
     run): open for COBIx's review under Sam's rule for that session (*"never push to main or merge; open PRs ready
     for COBIx review"*). The routine leaves them to that review and Sam's next plain session; #3648 carries
     `docs/session_698_handoff.md`.
   - **This checkpoint #3639** (`claude/awesome-fermat-29w1g0`, carrying `claude/s697-ivc-load`'s trigger file and its
     two load receipts) merges at sign-off.
   - **Dependabot's #3383** waits.

## The start

No `list_sessions`, `get_trigger`, `get_session` or `set_session_tags` in this session. Open PRs at 13:14Z: dependabot's
#3383 only. `main` at 9ee488a7 (S691's checkpoint #3632, 12:49Z), so S691 had signed off and no session was live.
`daily-dashboard.yml` had already succeeded on 2026-11-21 (run 44864091313). No pause line. Three repos attached.
No `queue_todo_done` row since 2026-11-21. Hooks: `LIVE (root)` at `/home/user/.claude/settings.json`, merge-read and
clock guards yes. Disk: 58 GB free; one checkout.

## The college split (written before any worker started, 13:17Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when its
lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`). Ordered by Sam's work order
(`r-collect-for-mids-work-order-sam-2026-11-20`): outline fills first, by the M-ID cards each fills
(`f-outline-ranking-s691`), program records second.

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `ivc`:** Irvine Valley's outlines (735 M-ID cards), on Saddleback's curriQunet host: its client filter and
  status words, a 12-page trial and its recall file, the full read. The conductor dispatches the load. College: Irvine
  Valley.
- **Worker `sdce`, after `ivc`'s PR merges** (both touch the outline reader's files): San Diego College of Continuing
  Education's outline index search (191 cards), trial, read. College: San Diego College of Continuing Education.
- **Worker `readerfix`:** the two reader fixes the lane puts before the next paid college read
  (`f-timed-out-read-still-files-s691`, `f-would-extract-relists-same-page-s691`) and the named-programs `only` input
  Cosumnes River's paid read waits on. Code only, no college. Then the conductor runs Cosumnes River's read under the
  $40 cap. College: Cosumnes River.

**Lane 2, the cheap piles (one Opus 5.5 worker, high effort, free rule work).**

- **Worker `piles`:** the `total_not_printed` gap's apply (#3633: Santa Monica 45811 to 45815 and 37885), then the
  census's 11 free rereads (Orange Coast 6, Cerritos 2, Oxnard, Imperial Valley, Hartnell). Colleges: Santa Monica,
  Orange Coast, Cerritos, Oxnard, Imperial Valley, Hartnell. Nothing at a lane 1 college.

**The conductor's own:** the merges, the paid-run checks against the caps, the display build once after the posts,
`harvest-gap-census.yml` against 4,875, and the checkpoint.

**Split changes during the run.** Butte joins lane 1 only if `readerfix` carries its normalized-address compare
(`f-butte-page-addresses-changed-case-s690`). 14:28Z: `piles` finished (#3640 merged) and lane 2's next concern went
to a fresh worker, `piles2`: the census's `reconcile_steps` at Glendale (33) and Clovis (26), catalog-wording rules
with self-recall, free runs only. Its two colleges were written here a minute after it started. 14:54Z: `readerfix`'s
fix-forward findings went to a fresh worker, `followup` (#3644). 16:17Z: worker `display` took the night's display
build, held until the named gaps' apply (`d-display-held-for-gaps-apply-s697`). 16:46Z: the checkpoint-docs worker
took this branch. San Diego College of Continuing Education's index search carries to the next night.

**Not tonight:** the plain session's list (handoff 696; brief section 4). Golden West's 476 header rows wait on a plain
session's review. City College of San Francisco's Cal-GETC step stays a plain session's.

## What shipped (squash-merged, `test` green on each head, each thread read)

- **#3640 `00e441ce`** (14:27Z, `piles`): the `total_not_printed` gap on Santa Monica 37885 and 45811 to 45815 (guarded
  UPDATE, 6 of 6 at 13:37Z); rereads 44909976872 Orange Coast, 44909979539 Hartnell, 44909982199 Imperial Valley and
  44909985423 Oxnard, the nine named programs passing live; Orange Coast's 109 rows at 38670927724 replaced by `main`'s
  39726645292 (`d-orange-coast-main-run-stands-s697`).
- **#3641 `32b00c99`** (14:54Z, `readerfix`): `read_short()`, the same-page calls in one place, the named-programs
  `only` input, Butte's address compare; 320 committed records newly unchanged (Butte 163, Cuyamaca 155, College of the
  Canyons 2).
- **#3644 `25a8917a`** (15:37Z, `followup`): a killed wave extraction and a timed-out prior read file nothing,
  `named_fragment()`, `EDITION_TOKEN \d{1,2}`, the pinned-page test, kept entries under `only=`, the same-page
  self-recall test.
- **#3645 `c85bb975`** (16:13Z, Cosumnes River): pricing 44916368634 named exactly the 14; the paid read 44917314201 at
  **$1.16**, 10 passing; reread 44917690048 replaced 4 live rows, load 44917693465 inserted 7 (189 live, 10 passing at
  the new run); the S680 pin test now expects the pin's page; the Commons data rebuilt.
- **#3642 `0695b665`** (`ivc`): Irvine Valley's outlines on Saddleback's host (index 44908824732, 1,199 current
  outlines; trial 44911142170, 12 of 12; full read 44913397609, 868 pages, every one 200). Load 44925768837 on
  `claude/s697-ivc-load`, confirmed live 16:41Z; the receipt push re-ran it (44926139513: 0 inserted, 1,732 kept).
- **`samueltlee/CPLBrain#837` `c9da8405`:** S691's vault note, merged under Sam's ruling 2 below.
- **#3649 `bbb08dda`** (`piles2`): the named gap `total_differs` (self-recall 1,843 right, 0 wrong), guarded UPDATE 10
  of 10 at 16:38Z (Clovis 33493, 35209, 37352, 42234, 42706, 44551; Glendale 12570, 12574, 19566, 39905; Clovis 33431
  dropped by the second reader: floors over lists), and Glendale 02570 rescored with an `each` guard and reread live
  (run 44915445658, passes).
- **#3650 `ede8cdd4`** (`display`): build `9d9244ee7496` replacing `e35ae1722a56` (18,616 records): Santa Monica
  first 44925708471 (230 of 230), the gate read 16:42:55Z (only Santa Monica's 230 moved), the whole build 44926123517
  (18,386 of 18,386 written, 0 errors), the closing count 16:52:46Z (18,616 at the build; the same 32 at older builds;
  0 null displays; 18,648 rows).
- **The census** 44927819145 (17:06Z, `main` bbb08dda): 4,839 left of 20,282, passing 15,443 (from 4,875 and 15,407).
  The headline pair at 17:09Z: 15,334 of 20,282 active programs pass the machine checks, at 118 colleges.

## Records collected and outline rows added

- **Program records: 7 new** (Cosumnes River), **119 replaced by a better reread** (Orange Coast 109, Hartnell 2,
  Imperial Valley 2, Oxnard 1, Cosumnes River 4, Glendale 1), 20 of them newly passing; **16 collected with a named
  gap** (6 `total_not_printed`, 10 `total_differs`). Extraction runs: $1.16. Run ids: lessons, *S697*.
- **Outline rows: 1,732** at Irvine Valley (864 SLO rows holding 2,639 SLOs, 868 objective rows holding 6,695
  objectives). The load drops a line with no letter, 23 lines and 2 rows statewide
  (`d-outline-load-strips-letterless-lines-s697`).
- **CRE: about 1,837** (7 new records at 15 each, plus 1,732 outline rows).

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S697*; `docs/reference/conductor_mode.md`, *What went wrong in S697*;
[`methodology-chain-prs-when-every-merge-conflicts-a-generated-file`](kb-notes/methodology-chain-prs-when-every-merge-conflicts-a-generated-file.md),
*Two records pull requests*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (outline fills first, program records second):
   - Glendale 02570 and the ten `total_differs` records wait for the next display build after the next posts; then
     the census against 4,839.
   - **Outlines:** San Diego College of Continuing Education's index search (191 cards) first, then Peralta. Refresh
     City College of San Francisco's recall gate on `main` (8c95dee8 against the trial's d5cef493) before its next
     read. Golden West's 476 header rows stay a plain session's review.
   - **The night's one follow-up** (`f-followup-four-left-s697`): a test for the own-run filter in
     `kb/_program_reread_keep_better.py` (about L631-633; a None run stamp at `kb/_program_requirements_college.py`
     about L7815); `named_fragment` reads any `=` as viewer parameters (`#/program?id=1` against `id=2`,
     `#nameddest=`); `EDITION_TOKEN` still joins `catalog-v24` and `-v25`; a capture-only prior read with no PDF page
     now ends red (College of the Desert's preview 44711759115).
   - **Clovis's 19** (`f-clovis-19-left-s697`): Business 33432, 33433, 33487, 33491 and Social Science 33492 start or
     are cut at a page break (a pin and a paid reread); 14 read pairs or "any course from List A" wrongly.
   - **Glendale** (`f-glendale-28-left-s697`): 11 with no record file need a paid extraction (40846, 40847, 21302,
     38973, 24377, 24327, 37070, 36599, 36601, 11155, 21303); 17 left (8 language records take a list "If 20 units
     have not been reached", a scorer kind; 18639 prints EIGHTEEN; 32607, 36416 and 12503 read pairs wrongly; 44488,
     45068, 18640 and 30813 fail coverage).
   - **Cosumnes River's** 20147, 20193 and 20227 need their own page, 33053 a page-break pin. Butte's read can run now
     that its address compare landed.
2. **A plain session's, each by its lane's NEXT** (conductor runs stay on collection): `commons` (the *Stuck: waiting
   on a fix* view under Sam's ruling 1, built by the Commons build session; the open data questions; the three Collect
   cards); `repo-size` (its NEXT 0 to 6: `receipt-slim.yml`'s apply, the spreadsheet export and videos, the timed
   workflows' commits, the session trim, `START_HERE.md` and the `CLAUDE.md` cut; Part 5 on Sam's go);
   `common-subjects-reference` (ECONMT and Electricity's adult-education codes); `library` (deploy #3600, then part 4,
   then part 3); `common-cr-reference` (the exact match); `cer-procedures` (the pair apply). Handoff 696 carries the
   plain session's order.

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| City College of San Francisco's Cal-GETC dry run (32080, 33652, 46300): the permission check refused it twice | a plain session | 2026-11-21 (S691) |
| Golden West's 476 outline header rows: the guarded correction | a plain session's review | 2026-11-20 (S690) |
| Cerritos 20504: its run also holds 44984, held for a person | a person, on 44984 | 2026-11-21 (S697) |
| Records held for a person: College of the Canyons 43388, West Los Angeles 46261 and 38677, Napa Valley 19126, 31158 and 36528, Los Angeles Harbor 44947, Cerritos 44984, Los Angeles Mission 44849, Los Angeles City 32832, Ventura 45355, Shasta 18153 | a person | S653 to S691 |
| The four follow-up findings (`f-followup-four-left-s697`) | Sky, the next follow-up | 2026-11-21 (S697) |
| Clovis's 14 and Glendale's 12 that the reader or scorer reads wrongly | Sky, a reader or scorer fix | 2026-11-21 (S697) |
| College of the Desert's 8: the prior catalog sits behind robots.txt | the college, or another source | 2026-11-20 (S689) |

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current). His two
rulings of this morning, relayed by COBIx on #3358, are recorded below. Tonight's vault note
(`samueltlee/CPLBrain#839`) quotes them as COBIx relayed them and changes none; it merged on its own (`cc5fb6c6`).

## Decisions Sam made (relayed by COBIx on #3358, comment 7064588752, about 7:04 AM PT 2026-11-21)

1. *"a block is a block regardless of whose it is to clear."* Every blocked job goes on Needs you, shown under Collect
   as *Stuck: waiting on a fix* with who clears it and since when, ranked with everything else, Sky's own blocks
   included (City College of San Francisco's Cal-GETC dry run is one). The Commons build session (a plain session)
   builds that view; until then each handoff lists the blocks (`r-a-block-is-a-block-sam-2026-11-21`).
2. Vault-note drafts in `samueltlee/CPLBrain` merge on their own once their checks pass, under the Nov 18 rule that
   yes-style goes are Sky's (COBIx's wording); a vault note goes to Sam only when it changes or adds one of his rulings,
   said in one line, and the morning brief stops listing routine vault merges as his decisions
   (`r-vault-notes-merge-on-checks-sam-2026-11-21`).

Both are in `docs/reference/sam_rulings.md`, `docs/reference/conductor_mode.md` (*Recording and Sam*) and
`docs/reference/scheduled_sessions.md` (*While working*, *At the end*).

## Decisions (the conductor's, each reversible)

`d-orange-coast-main-run-stands-s697`, `d-named-gaps-compact-apply-s697`, `d-cerritos-20504-waits-on-44984-s697`,
`d-load-skips-places-none-s697`, `d-outline-load-strips-letterless-lines-s697`, `d-display-held-for-gaps-apply-s697`,
`d-vault-note-merged-under-ruling-s697` and `d-ivc-load-receipt-rides-checkpoint-s697`. DECIDED lines: the harvest
lane. Memory rows: `kb/migrations/2026-11-21_s697_cpl_memory_rows.sql` (22 rows: Sam's two rulings `verified`, 20
`proposed`; rollback beside it), pointed at by `.apply`: supabase-migrate run 44929041859 applied it from this branch's
push at 17:16Z (receipt `kb/receipts/migration_s697_cpl_memory_rows_44929041859.json`, 22 rows back).

## Patterns that worked

- A free pricing run with `only` named exactly the 14 before the paid read ($1.16 against about $1.53 estimated).
- A second reader on each change to shared reader code (#3641, #3642, #3644, #3649); it dropped Clovis 33431 from a gap.
- One write per table at a time: the display build waited for the gaps' apply.
- Both guarded UPDATEs ran in compact form, each plan's rollback unchanged.

## Safety patterns to honor

All of handoff 697's. New: `p-bot-receipt-head-runs-no-test-s697` (a bot receipt head runs no `test`: push a real
change, never an empty commit); `p-check-generated-misses-commons-data-s697` and
`p-commons-files-conflict-between-prs-s697` (after a records change, and after merging `main` into a records PR, take
`main`'s side of a conflicted Commons file and rerun `kb/_build_commons_status.py` and `kb/_build_commons_data_status.py`
under 3.12 with their tests: `check_generated.sh` runs neither); `f-s680-pin-test-pinned-old-pages-s697` (a test that
pins a college's pages fails when a pin moves them). A permission-check refusal is never routed around. Never file a
person's name from an outline page into a memory row, a lane or a handoff. Keep to three open PRs.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about $750 a day for
everything, $10k running total for the whole job; workers on Opus 5.5, cheaper models for routine reads, high effort on
any worker that writes shared data; reviews at most 9 agents, stopped after two rounds with what is left sent to Sam
or COBIx; $40 per college per run for program requirements and a separate $40 for SLOs, PLOs and course objectives,
per run, never a remaining pot. The routine's prompt names Fable 5.2 for tonight's conductor; this session runs as
Opus 5.5, the model its form gave it. Stop rules from the brief: a day over $300 with fewer than 40 new programs; over
$12 per new program or $0.50 per outline row; a rollback that undoes over 1% of a day's rows; the $10k checkpoint.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3639 this declaration and checkpoint (`claude/awesome-fermat-29w1g0`) | the checkpoint, carrying `claude/s697-ivc-load` | merges at sign-off |
| #3640 the piles (`claude/s697-piles`) | merged `00e441ce` | none |
| #3641 the reader fixes | merged `32b00c99` | none |
| #3644 the follow-up | merged `25a8917a` | its four findings go to the next follow-up |
| #3645 Cosumnes River | merged `c85bb975` | none |
| #3642 Irvine Valley's outlines | merged `0695b665` | none |
| `claude/s697-ivc-load` | load 44925768837 (1,732 rows) and the re-run 44926139513 | rides #3639 |
| #3649 the second piles (`claude/s697-piles2`) | merged `bbb08dda` | its records in the next display build |
| #3650 the display (`claude/s697-display`) | merged `ede8cdd4`; closing count 16:52:46Z | none |
| #3643, #3646, #3648 (Sam's page-only session) | open for COBIx's review | that review and Sam's next plain session |
| `samueltlee/CPLBrain#837` | merged `c9da8405` | none |
| `samueltlee/CPLBrain#839` (tonight's vault note) | merged `cc5fb6c6` (ruling 2; it quotes his rulings and changes none) | none |
| `claude/s690-goldenwest-header` (0995d8b5) | plan and before-values file, no PR | a plain session's review |
| #3383 | dependabot's | waits |

## Let go

Dropped in the sign-off turn: the COBIx watcher (its Monitor stopped). No PR subscription was held (each PR was gated by
`pr-gate` reads), no check-in is scheduled, and no artifact is watched. Every worker is finished; the checkouts of
`display` and the documents worker are removed with this sign-off, each head pushed. `samueltlee/CPLBrain#839`, the
vault note, merged on its own under his ruling 2 (`cc5fb6c6`). Sam's page-only session's #3643,
#3646 and #3648 stay open for COBIx's review; this run did not touch them.

Spend: $128.77 (estimate from token counts at list prices; Opus 5.5 $127.84, Haiku 5.5 $0.93); collection $100.21, infrastructure $28.56; 2026-11-21T13:13Z to 2026-11-21T17:12Z.

The filed extraction run's own cost is listed apart: $1.16 (Cosumnes River 44917314201). Infrastructure is the documents
worker, the `pr-gate` reads, the follow-up PR and its second reader, and the conductor's share of the checkpoint and the
CI fixes; the rest is collection.

Opening line: *Greetings, you are SkyMurre (Session 699), see SkyPuffin's (S697) handoff — `docs/session_699_handoff.md` — let's keep rolling with our queue.*

S697 final: cost about $129 at list prices, estimated from token counts (`get_session` was not among this session's tools), plus $1.16 of filed extraction runs; records collected: 7 new program records (plus 119 replaced by a better reread, 20 of them newly passing, and 16 collected with a named gap); outline rows added: 1,732; substantive PRs merged: 7 (#3640, #3641, #3644, #3645, #3642, #3649, #3650), not counting the checkpoint.
