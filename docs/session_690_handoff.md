---
title: "Session 690 handoff (from SkyTern, S689)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyMerlin (Session 690)

From SkyTern, S689, the CPL Queue routine's 06:12Z firing of 2026-11-20 (started 06:13Z): a conductor run for
collection only under Sam's routine prompt of 2026-11-17, following the COBIx brief on #3358 as updated
2026-11-20T02:38Z. A **full checkpoint** (lanes moved; Rule 10 data writes ran: reread posts and loads, outline loads),
written by the checkpoint-docs worker at about 10:45Z while the run went on. The conductor refreshed it at sign-off (about 12:11Z): every PR the run opened is merged or
carried over (#3593, #3597), and Mt. San Antonio's outlines are loaded. Skipped: steps 2 and 3 (no KB structure or user-facing surface changed), 7 (no M-ID pipeline move) and 9
(the UI pass is its own queue item).

**The start.** No session was live: the only open PR was dependabot's #3383, and `main`'s newest commit was handoff
689's merge (#3583, 04:40Z). The firing dispatched `daily-dashboard.yml` on `main` at 06:15Z (no run had been created
that UTC day), restarted the COBIx watcher, and wrote this split before any worker started. No `list_sessions`,
`get_trigger` or `set_session_tags` in this session.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Read a PR's whole thread before you merge it or apply any file it carries
   (`p-apply-before-thread-read-s685`).
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first
   (`d-oldest-finished-among-finished-s688`), one update from `main` right before its merge, no dependency-map rebuild
   inside a PR, no full rerun when the input fingerprints match. S689 held seven at 10:02Z: bring it back to three.
2a. **Collection comes first (Sam, 2026-11-20, 2:24 AM PT, relayed by COBIx on #3584, comment 7037137301):** *"get all
   the cows back in the pasture first and then we can tend to their needs."* Data waves go first; a fix goes ahead of
   the next wave only if it blocks that wave or would file bad data (wrong rows reaching the live tables). Minor
   findings and hunches, COBIx's included, go into one follow-up PR per night, after the waves, never a PR each.
   Review rounds match what the change needs: a small fix that writes no shared data needs no second round
   (`r-collection-first-sam-2026-11-20`; S689 held seven PRs open against a cap of three).
2b. **Collection serves the M-IDs (Sam's work order, 2:28 to 3:43 AM PT on Nov 20, from his walk through the Commons,
   relayed by COBIx on #3584, comment 7038766315):** course outlines behind a sign-in are no longer a collection
   priority, except the 12 courses still taught (name them: the page reads "TBA until the hunt list is filed").
   Collection has three sets, each with one simple measure and a ranked list of fixes: catalog programs (PLOs, course
   requirements), course outlines (SLOs, objectives, COCI data) and credentials (issuing agency, skills). Curation
   runs in order (subject code, local subject title, M-ID, common exhibit title, common credential title, credential
   skills), and the focus now is step 3: rank collection fixes by the M-ID cards each would unblock (missing COCI
   descriptions from catalogs, SLOs and objectives, catalog subject data, units and hours, credit or noncredit, still
   taught, prerequisites). Today's M-ID groupings and counts are rough. His words: *"no one's getting any younger out
   there"*; the point is *"getting credit for being you"* (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** none of S689's PRs remains to merge. #3593 and #3597 carry over and fold into S690's one
   follow-up PR after the next wave (item 2a), with the minor findings of #3586, #3590 and #3594; dependabot's #3383
   waits as before.

## What shipped (squash-merged on `main`, `test` green on each head, each thread read)

- **#3589 `41cae8c9`** (07:27Z): the four high schools the 06:24Z daily run brought into `kb/credentials.json`
  (Foothill, Granada, Kimball, Livermore) registered with empty issuer tags; `main` green again.
- **#3588 `3a73ff71`** (07:53Z): City College of San Francisco's outlines by `ccsf.curricunet.com` (COBIx on #3533).
- **#3587 `cd9e8451`** (08:19Z) and **#3590 `2d3d28b2`** (09:37Z): the page checks fold PDF ligatures and stand-in
  glyphs before rule A and rule D match, keep a refused program marked until a record places its courses, and hold a
  staged page the rules did not accept.
- **#3586 `9d11684a`** (09:51Z): the outline readers skip a column header, read Palomar's objectives, know report 485
  prints none, take Mt. San Antonio's results block, and pass over a `never_load` read.
- **#3591 `d449bb5d`** (10:13Z): the wave, the third ten, Santa Rosa Junior, the free captures and the live reads.
- **#3594 `a03baa73`**: `slug_awards` reads `-ca`, `-cert(ificate)`, `-aa-t-degree`, `-for-transfer` and `-adt`.
  **#3598 `eae40d6b`**: the display page file. **#3596 `3455814d`**: keep-the-better names a load only for rows the
  load inserts (`load_skips`), and compares runs as numbers. **#3592 `57c00120`**: rule D's prior-year read opens a
  PDF catalog by its direct link, and a `blocked_sources` row records Desert's archive. **#3595 `86c1dedb`**: the outline
  files (Feather River, Palomar and Mt. San Antonio's reads and receipts, CCSF's census and index).
- **Display build `4c57fd250cce`**, live and confirmed by its closing count: 18,459 programs, replacing `3361e3aa5b7d`
  (one college, Barstow, run 44718082566; the gate 44718607626; the whole build 44718939233; the closing count
  44719715170). Its page file is #3598 (`eae40d6b`); the gate and close-read receipts wait on
  `claude/s689-display-gate-read` and `claude/s689-display-close-read` for the next wave.
- **The census** (run 44719996895, `main` fb454129): 5,069 left of 20,282, down from 5,145; passing 15,120;
  `places_none` 396 to 309.

## Records collected and outline rows added

- **Program records: 79 new, 43 replaced by a better re-read.** The reread plan's third ten: 56 new and 37 replaced
  ($8.32; live read 44695498920). Santa Rosa Junior: 23 new and 6 replaced ($4.22; load 44703311509); its census gaps
  went from 41 to 19.
- **Outline rows: 3,623.** Feather River 336 SLO rows (load 44700832207); Palomar 1,108 SLO and 1,106 objective rows
  (load 44708472734); Mt. San Antonio 1,073 SLO rows (read 44710704435, load 44729553938; 629 pages print no SLOs).
- **CRE: 4,808** (79 new records at 15 each, plus 3,623 outline rows).

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S689*; `docs/reference/conductor_mode.md`, *What went wrong in S689*;
[`methodology-a-pdf-ligature-hides-a-heading-from-an-exact-match`](kb-notes/methodology-a-pdf-ligature-hides-a-heading-from-an-exact-match.md).

## Open work, from the lanes' NEXT lines

1. **program-requirements-harvest:** land S689's PRs (above); the reread plan's fourth ten (rows 46 to 55: Napa
   Valley, North Orange Continuing Education, Saddleback, Cerro Coso, Mt. San Antonio, Santa Monica, San Diego College
   of Continuing Education, Bakersfield, Berkeley City after #3593, Butte; $40 per college per run); a free capture at
   Solano (11 marked) and Cañada (3), where the fold changes what rule A reads, then a paid read only where the own page
   is found; rule D's prior-year read for City College of San Francisco's 27 after #3592 (College of the Desert's 8
   keep their gap); the next display build after the next posts, then the census against 5,069; Copper Mountain's
   new catalog address; the cheap piles; the outline readers (Golden West's 474 header rows, City College of San
   Francisco's trial on parsed outcomes only, COBIx's points on #3586 and #3590).
2. **commons:** the confidence apply, a dry run of `kb/_ccr_confidence_apply.py --rule G --fill-members`, then
   `--apply --expect` with that dry run's own count; the #3570 gaps; the open data questions; check on the deployed tab
   that a college's `course_outcomes` rows carry its name.
3. **common-cr-reference:** the exact match from issue #3523 against the 2026-11-18 counts, in a plain session.
4. **library:** parts 1 and 2 are applied (S688; the lane's NEXT still names those two applies). The first real check run came at 12:10Z (`library-publish` run
   44733588776, success): 8 check rows, 7 pass and 1 fail, all from that run; the 21 listed pieces stay listed (Sam's
   Nov 19 ruling). Read the failing piece's findings on its card first. Then part 4, then part 3. A plain session's; conductor runs stay on collection.
5. **cer-procedures** (the pair apply) and **repo-size** (Part 5 waits on Sam's go; the slimming items): a plain
   session's.
6. **For the night's one follow-up PR, beside #3593 and #3597:** `kb/_build_spend_daily.py` never sets the spend
   file's top-level `updated` (still 2026-11-15) when it writes `sessions` (COBIx's brief of Nov 19).

## For Sam

Nothing waits on Sam. [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current; cleared on
Nov 19, relayed by COBIx on #3560) is unchanged. For his information only:

- College of the Desert's 2025-26 catalog is online only in an archive that its robots.txt closes to the reader
  (`catalog.collegeofthedesert.edu/archive/2025-2026/`). Its 8 programs keep their gap, and a row in
  `blocked_sources` rides #3592. The reader never routes around robots.txt.
- Madera 39814: COCI spells its title *Philosphy*; keep-the-better restored its filed record.
- Los Angeles Harbor 44947 is held for a person.
- City College of San Francisco's outline report names curriculum staff, and 37 trial pages already on `main` file
  originator names. The CCSF trial waits until it files outcomes only; whether the committed pages stay goes to a plain
  session with COBIx.

## Decisions Sam made

- **Collection comes first** (Nov 20, 2:24 AM PT, relayed by COBIx on #3584, comment 7037137301): *"get all the cows
  back in the pasture first and then we can tend to their needs."* Row `r-collection-first-sam-2026-11-20`
  (verified, applied with `execute_sql` by 11:30Z); `sam_rulings.md`; the standing block, item 2a. The checkpoint at f0a2087a missed it: the
  watcher surfaced the 10:24Z comment only at 10:50Z (search lag), after the documents were written.
- **Collection serves the M-IDs** (Nov 20, 2:28 to 3:43 AM PT, relayed by COBIx on #3584, comment 7038766315): the
  work order in item 2b. Row `r-collect-for-mids-work-order-sam-2026-11-20` (verified, applied at sign-off);
  `sam_rulings.md`. It reached the run at 11:48Z, after the night's waves had run.

## Decisions (the session's)

The conductor's, all reversible: `d-issuer-tags-four-high-schools-s689`, `d-reader-pages-ship-after-two-rounds-s689`,
`d-ccsf-outline-trial-no-staff-names-s689`. Memory rows: `kb/migrations/2026-11-20_s689_cpl_memory_rows.sql` (15
rows, `proposed`; rollback beside it), not pointed at by `.apply`; the conductor applies it.

## Patterns that worked

- Free first: six free captures chose one paid read, and Santa Rosa Junior found its own page for 22 of 34 refusals.
- Two review rounds, then ship the verified part; the open items became #3590 within the hour, verified by COBIx.
- A replay over the committed files before each merge (#3590: 0 flips against `main`).
- One wave PR for every branch's files (#3591), with no `.apply` change and no dependency map.

## Safety patterns to honor

All of 688's. New: `p-sources-from-repays-refused-pages-s689` (pay for a refused program only through a fresh capture
and extract) and `p-reader-cap-hides-mtsac-results-s689` (a trial parses what the full read will see). Say where a
replay's hits are, not only where it looked. Never file a person's name from an outline page into a memory row, a lane
or a handoff. Keep to three open PRs.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*, Sam's change of 2026-11-11): two lanes, never on one college; about $750 a day for everything, $10k and
$30k running totals for the whole job; workers on Opus 5.5, cheaper models for routine reads, high effort on any
worker that writes shared data; reviews at most 9 agents; $40 per college per run for program requirements and a
separate $40 for SLOs, PLOs and course objectives, per run, never a remaining pot. The routine's form set the
conductor to Opus 5.5 tonight (Sam's switch at about 3:47 PM PT on Nov 19, relayed by COBIx): the first Opus night of
the comparison. A session Sam starts by hand works the queue itself.

## The college split (written before any worker started, 06:19Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when
its lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`).

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `reread` (the reread plan's third ten):** Sierra, Barstow, Pasadena City, Rio Hondo, Los Angeles Harbor,
  College of San Mateo, College of the Sequoias, Fresno City, Contra Costa and Madera. $40 per college per run, keep
  the better record before posting, a load after each reread.
- **Worker `pages` (the census's free page-finding levers 3, 6, 8, 11, 12 and 14):** College of the Canyons, City
  College of San Francisco, Santa Rosa Junior, Ohlone, San Joaquin Delta and Santa Barbara City; a free page read
  first, paid extraction only for programs whose own page is found. Then Copper Mountain's 404 address to the
  discontinued check, and Cosumnes River's 29 (lever 13) only once the named-programs-only `only` input exists.
- **Worker `outlines` (course outlines):** Feather River's and Palomar's header fixes, then their trials; Mt. San
  Antonio's 12-page trial, counted by eye into `kb/course_outcomes/mtsac_recall.json`; City College of San Francisco
  by `ccsf.curricunet.com` (`route_of` accepting `curricunet.com`, a census row for that host). City College of San
  Francisco's outline load waits until worker `pages` has nothing in flight there.

**Lane 2, the cheap piles (one worker, free rule work only; starts after lane 1's workers sign off).** Rule D's
prior-year read (`CAPTURE_PRIOR`) for College of the Desert's 8; census lever 2 (the general education pattern's
units, 206, statewide) and lever 4 (the noncredit hours total, 68); levers 5, 9, 10 and 15 (catalog-wording rules at
Glendale, Santa Monica, College of the Canyons and City College of San Francisco); keep-the-better's follow-ups
(`needs_load`, the shared no-ending address rule, `slug_awards` endings); Los Medanos's 59 only if its parked decision
allows.

**The conductor's own:** the display build once, after the night's posts, then `harvest-gap-census.yml` against
5,145; merges; the checkpoint.

**Not tonight:** the Library (#3560 parts 4 and 3), repo slimming, Rule G, one credential list, the cer-procedures
pair apply and the CR exact match: the plain session's list (brief section 4).

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3584 this declaration and checkpoint (`claude/awesome-fermat-cx0hdk`) | merged at sign-off | none |
| #3593 Berkeley City's Cal-GETC 34 (`claude/ge-units-rule-s689`, e3a57de0) | draft, carried over; the reconcile run's 17 records restored | S690's follow-up: a second free reconcile, `--calgetc-review` with `--restore`, a self-recall of the next-line reading, a review, then the reread |
| #3597 a no-ending address two awards share (`claude/keep-better-shared-address-s689`, 82022d5c) | draft, carried over; one blocking test with `main` merged | S690's follow-up: accept either evidence for the `-ca` page title, merge `main`, rerun (COBIx comment 7038199226) |
| #3589, #3588, #3587, #3590, #3586, #3591, #3594, #3598, #3596, #3592, #3595 | merged (41cae8c9, 3a73ff71, cd9e8451, 2d3d28b2, 9d11684a, d449bb5d, a03baa73, eae40d6b, 3455814d, 57c00120, 86c1dedb) | none |
| `claude/s689-display-gate-read` (d4bc261a), `claude/s689-display-close-read` (146cd876) | receipts, no PR | ride the next wave |
| samueltlee/CPLBrain#830, the vault note and the braindump (`claude/pensive-archimedes-cx0hdk`) | draft | merge it |
| #3383 | dependabot's | as before |

Lane 2 ran two review rounds: #3592, #3594 and #3596 merged; #3593 and #3597 carry over. #3511 is no longer open.

## Let go

Dropped in the sign-off turn: the COBIx watcher (stopped). No PR subscription was held (the run gated each PR by
reads), no check-in is scheduled, and no artifact is watched. Every worker is finished and its checkout removed.

Spend: $193.54 (Opus 5.5 $191.96, Haiku 5.5 $1.58); collection $178.26, infrastructure $15.28; 2026-11-20T06:13Z to 2026-11-20T12:11Z.

An estimate from the session's and its workers' token counts at list prices (Opus 5.5 at $4 and $20 per million tokens, cache reads $0.20, cache writes $5; `kb/_spend_meter.py`), to 12:11Z; the sign-off turns after it add about $2. The filed extraction runs' own cost, $12.54 (the third ten $8.32, Santa Rosa Junior $4.22), is listed apart. Lane 1 and its readers: $118.31. The cheap-piles share: $35.68 (its worker and its second reader) and no records posted (College of the Desert's 8 sit behind robots.txt; Berkeley City's rule holds for S690). The checkpoint-docs worker: $12.28 (infrastructure).

Opening line: *Greetings, you are SkyMerlin (Session 690), see SkyTern's handoff — `docs/session_690_handoff.md` — let's keep rolling with our queue.*

S689 final: cost about $193.54 at list prices, estimated from token counts, plus $12.54 of filed extraction runs; records collected: 79 new program records (plus 43 replaced by a better re-read); outline rows added: 3,623; substantive PRs merged: 11, not counting the checkpoint.
