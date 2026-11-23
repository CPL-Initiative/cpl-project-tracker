---
title: "Session 714 handoff (from SkyKittiwake, S713, the CPL Queue routine's collection run of 2026-11-23)"
created: 2026-11-23
updated: 2026-11-23
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
plain-session handoff, `docs/session_712_handoff.md` at this writing (#3702, S712's PR, wrote no handoff, so 713 stays
free), never this file. **Numbering.** Handoff 704 named the routine's next session SkyKittiwake, Session 704, but Sam's
plain sessions took 705 to 712, so this run took the next free number, S713, and wrote 714
(`d-routine-takes-next-free-number-s713`). The routine's next session is **SkyFulmar**: it takes the next free session
number at its start and writes the handoff one above the highest on `main`.

# You are SkyFulmar, the routine's next session

From SkyKittiwake (S713), the CPL Queue routine's 06:12Z collection run of 2026-11-23, a conductor run for collection
only under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358. A **full checkpoint** (lanes moved; Rule 10
data writes ran: three guarded UPDATE applies, two outline loads, the display build), written by the checkpoint-docs
worker from 09:46Z while #3707, Glendale's, City College of San Francisco's and Clovis's work were in flight. The
conductor applies the memory rows, runs step 12's headline and harvest SQL and `--stamp`, keeps step 11's vault note,
and fills the census, Spend and final lines. Skipped: steps 2 (no KB structure change), 3 (no user-facing surface
changed), 7 (no M-ID pipeline move) and 9 (the UI pass is its own queue item).

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of 2026-11-21), before the
   split.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and read its output
   yourself every few turns. It stops at the two-hour background limit (S713's stopped shortly after 08:10Z and the run
   fell back to single polls), so restart it each time it stops. Act on each new `<!-- cobix -->` comment; read a PR's
   whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker. Workers share the clone's object store, so fetch a branch by name
   with `--shallow-since` or `--deepen`, never `--depth` (`p-shared-shallow-clone-reshallows-s713`).
2. **Merge rules:** at most 3 open PRs (plus dependabot's), the oldest finished first, one update from `main` right
   before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop a
   review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`), and a college
   whose work sits on two branches goes in one PR (`d-ccsf-one-pr-s713`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order** (the conductor works it to sign-off; what it did not reach is yours, in this order): #3707 (general
   education steps, applied), Glendale's PR (`claude/s713-piles2` `d87880f7`, applied), City College of San Francisco's
   (`claude/slo-ccsf` `34f7f05a`, loaded), Clovis's (`s713-piles2-clovis` `2f42cdb9`, local, in review, not applied),
   then `harvest-gap-census.yml` on `main`, then this checkpoint #3704 (`claude/awesome-fermat-0bgzd3`) at sign-off.
   #3708 merged at 09:56Z. Dependabot's #3383 waits. Each records PR merges `main` once right before its merge, takes
   `main`'s side of a conflicted Commons file and reruns both builders.

## The start (06:12Z firing, 2026-11-23)

- Step 0: no `daily-dashboard.yml` run created on 2026-11-23 UTC, so this firing dispatched it on `main` at 06:16Z;
  the day's update landed at 06:23Z (`a588fc77`).
- One writer: no `list_sessions` or `get_trigger` in this session, so the run read the open PRs (#3684, #3675, #3683,
  #3686, all S703's, newest updated 16:26Z on 11-22) and `main` since handoff 712 (#3702 at 02:40Z, then nothing). No
  PR was updated in the last half hour, so the run took the queue and declared on draft #3704 at 06:20Z.
- No pause line in handoffs 704 or 712. Three repos attached. Sheet 200's replies: none since 2026-11-19.
  `queue_todo_done` since 11-22: none. No exhibit re-analysis request open.

## The college split (written before any worker started, 06:20Z)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`);
outline fills first, program records second (`r-collect-for-mids-work-order-sam-2026-11-20`).

**Lane 1 (collection):**
- `peralta`: #3684's dry run and load (Laney, Merritt, College of Alameda, Berkeley City); then City College of San
  Francisco, whole (its next outline read, then its 53 page-finding programs), as the one writer there.
- `land`: S703's records PRs brought up from `main` one at a time and merged by the conductor: #3686 (Ohlone, San
  Joaquin Delta, Mt. San Antonio, Santa Barbara City, Orange Coast), #3675 (Glendale, Butte; Glendale 38973 filed as a
  named gap), #3683 (Clovis and S697's findings); then the display build (gate college Cosumnes River) and the census on
  `main`. Each college leaves lane 1 when its PR merges.
- Later, when a slot frees: `levers` at Mt. San Antonio, Santa Barbara City and Orange Coast where #3686 did not
  reach, and Santa Ana's program pages from its filed credit catalog (#3669).

**Lane 2 (cheap piles, one worker, `piles`):** Santa Monica (30) and Santa Rosa Junior (27) first; Glendale's 28 once
#3675 merges and Clovis's 14 once #3683 merges. City College of San Francisco's 28 wording rules stay with lane 1's
writer there and wait for a later run.

**Held to a later slot:** Mt. San Antonio's credit-catalog program pages wait for `levers`, since #3686 holds that
college until it merges.

## Split changes during the run

- 06:34Z: Peralta's dry run (3,738 rows) carried label lines, so a load-time clean at the `lan` folder went ahead of the
  load (`d-peralta-load-cleans-labels-first-s713`); its second reader then held the load for 12 system notes ("Won't
  delete", "duplicate to be removed") until the clean dropped them too.
- 06:58Z: `piles` took three general education steps beside Santa Rosa Junior's and Santa Monica's piles, on the 11 of
  S703's 21 general education holds outside lane 1's colleges (`d-ge-steps-three-colleges-s713`): Las Positas, Antelope
  Valley, College of Marin.
- 07:24Z: the page read #3675's merge push started (45128802291, rereading #3686's 11 plans) was canceled as redundant
  (`d-cancel-merge-push-page-read-s713`).
- 07:30Z: Santa Rosa Junior 06566 and 32298 left #3705's plan (`d-srjc-cut-off-holds-two-s713`).
- 07:45Z: `peralta` took City College of San Francisco whole and opened no PR while the count was over the cap.
- Shortly after 08:10Z: the COBIx watcher stopped at its two-hour limit; single polls after.
- 08:28Z: #3707's plan keeps only rows that change a verdict (`d-plan-rows-change-a-verdict-s713`): Las Positas 09227
  and Antelope Valley 39295 left it.
- 08:33Z: `piles` signed off; `piles2` took Glendale's 17, then Clovis's 14 on `s713-piles2-clovis` once #3683 merged.
- 09:00Z: `land` signed off after #3683; its checkout was removed. Worker `display` (high effort) took the display build
  on `claude/s713-display`, gate college Cosumnes River.
- 09:02Z: City College of San Francisco's Cal-GETC 45768 was filed under the census's existing `ge_pattern_certificate`
  gap (`d-ccsf-45768-existing-gap-s713`).
- 09:13Z: Las Positas 01037 held (`d-ge-01037-held-double-count-s713`); #3707 went to 8 rows.
- 09:21Z to 09:32Z: one writer per table: #3707's apply waited for the whole display build (45146020705).
- 09:30Z: Glendale's reader minors fixed before its apply, the 13 after-images unchanged
  (`d-glendale-minors-before-apply-s713`).
- 09:40Z: City College of San Francisco's pages merged into its outline branch, for one PR (`d-ccsf-one-pr-s713`).

## What shipped (squash-merged on a green `test`, each thread read)

- **#3686 `9b8480e3` (06:57Z):** S703's page-finding at five colleges: Ohlone 2 and San Joaquin Delta 6 loaded, 141
  named gaps.
- **#3675 `706c0154` (07:24Z):** Glendale's 11 named gaps and Butte's read; Glendale 38973 filed as `page_challenged`
  (the host's bot check, run 45030485543).
- **#3684 `e0fa378d` (07:59Z):** Peralta's per-college outlines. Load 45127831747 inserted 3,731 rows, confirmed live
  (Laney 663 SLO and 663 objective rows, Merritt 463 and 465, College of Alameda 365 and 368, Berkeley City 372 and
  372; 7 placeholder blocks skipped); rollback by college and read run 45031089800; receipt
  `kb/receipts/course_outcomes_lan_45127831747.json`.
- **#3705 `1d8b5cfd` (08:31Z):** Santa Rosa Junior's 15. A code that prints its common course number in parentheses
  keys as that number: 15243, 16965, 21729, 30840 and 40890 pass. `section_cut_off`, 10: 06602, 15461, 15463, 30750,
  32300, 32330, 32357, 33166, 45477, 45558. Migrate 45131380266 (07:30Z), 15 of 15 live; rollback
  `kb/migrations/2026-11-23_s713_prreq_piles_rollback.sql`; receipt
  `kb/receipts/migration_s713_prreq_piles_45131380266.json`.
- **#3683 `0f5b849e` (09:00Z):** S703's follow-up (S697's four findings, a `through` field on a page pin, the
  named-gaps tag; Clovis 33492's passing record rebuilt). All four of S703's PRs are on `main`.
- **#3708 `02c44ae4` (09:56Z):** display build `da3198af6b98`: the gate 45144424595 (Cosumnes River 192 at the build,
  none elsewhere), the whole build 45146020705 (09:24Z): 18,628 rows at the build and the same 32 at older builds,
  18,660; 12 added (San Joaquin Delta 6, Cosumnes River 3, Ohlone 2, Butte 1), 232 changed at 50 colleges, none
  dropped. Its `test` came from a `js-tests.yml` dispatch on the bot receipt head
  (`p-bot-receipt-head-dispatch-js-tests-s713`).

**Applied or loaded and live, its PR still to merge at this writing (10:0xZ):**
- **#3707** (`claude/s713-piles-ge` `194d3c41`): general education steps, 8 records from failing to passing (Las Positas
  01032, 09214, 36235, 38886; Antelope Valley 36852, 40870, 43686, 43722; free reconcile runs 45127792228 and
  45133183717). Migrate 45147953792 (09:34Z), 8 of 8 live. The Antelope Valley fill takes only the degree total less
  the major's total; 18813 took the Las Positas step, places none of its courses and was never loaded; College of
  Marin's run 45135695869 moved nothing.
- **Glendale** (`claude/s713-piles2` `d87880f7`): 13 records: a list that stands in for one core course, 9 (32394,
  36667, 36711 to 36714, 36720, 36726, 36727); a figure in words, 2 (18639 EIGHTEEN, 12503 NINE); PSYC 104 read as the
  file's PSYCH 104, 2 (18640, 30813). Migrate 45148301846 (09:35Z), 13 of 13 live.
- **City College of San Francisco** (`claude/slo-ccsf` `34f7f05a`): outline read 45128775065 in four parts (parser
  2629a09a); load 45148533372 inserted 3 (CS 160B, VMD 192, CS 155P), kept 1,416 that match S690's live rows and
  skipped 1. Its 53 page-finding programs: 47 named gaps in `no_record_s713.json` (18 credit and 27 noncredit not
  printed under their own title, 24263 whose only page is 40432's, and Cal-GETC 45768 under `ge_pattern_certificate`);
  7 own pages pinned (capture 45131492116); 17954 read for $0.17 (45132633405) and held; 5 held for a list or wording
  rule.
- **Clovis** (`s713-piles2-clovis` `2f42cdb9`, local): 6 checks-only rows planned, its second reader running; nothing
  applied.

**The census on `main`:** CENSUS_LINE

**Tonight's count:** 36 records applied and live (Santa Rosa Junior 15, Las Positas and Antelope Valley 8, Glendale 13),
6 more in review (Clovis); 47 programs filed as named gaps at City College of San Francisco; 3,734 outline rows (Peralta
3,731, City College of San Francisco 3); $0.17 of paid extraction.

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S713*; `docs/reference/conductor_mode.md`, *What went wrong in S713*;
[`methodology-a-test-must-not-take-its-rule-as-the-truth`](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md),
*A named gap's self-recall*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (outline fills first):
   - Land what the conductor did not reach, one at a time, in the merge order above; then the census on `main` and the
     next display build, which carries the 21 records applied after tonight's build (Las Positas and Antelope Valley 8,
     Glendale 13) and Clovis's 6 once applied.
   - Clovis: its second reader, then the apply with the confirm guard (lane NEXT (5)).
   - The next outline reader: `python3 scripts/next_slo_colleges.py --next` on `main` once City College of San
     Francisco's PR merges (lane NEXT (1)).
   - Lane 2: City College of San Francisco's 28 wording rules, each with a claim check, boundary readings and a
     precision count; College of Marin's moved program URLs (a capture or guard fix before its step can run).
   - Lane 1 levers: Mt. San Antonio, Santa Barbara City and Orange Coast where #3686 did not reach, and Santa Ana's
     program pages from its filed credit catalog (#3669).
   - The next follow-up's minors (lane NEXT (2)), after the waves; COBIx's four (`f-cobix-minors-s713`).
2. **A plain session's, each by its lane's NEXT** (conductor runs stay on collection): `commons` (Cerritos AED's saves
   on the Subjects page, a person's; statewide defaults by the DR-25 route; where the gate's splits get answered);
   `common-subjects-reference` (ECONMT and Electricity's adult-education codes); `cer-procedures` (the pair apply, then
   the 71 `left_map_keep` rows; compact the lane first, 21,633 bytes against 20,000); `common-cr-reference` (Sam works
   the head, the top 50 groups, and the session watches which rungs he overrides); `repo-size` (dispatch
   `receipt-slim.yml` `mode=apply` outside the cron windows; then the spreadsheet export and videos, the timed
   workflows' commits, the session trim, `START_HERE.md` and the `CLAUDE.md` cut; Part 5 on Sam's go); `library`
   (deploy #3600, then part 4, then part 3); `my-college-action-page` (card 2's nightly snapshot of each college's
   landing page; Santiago Canyon and Sierra once the harvest reads their catalogs); `sierra-page-redesign` (#3511 merged
   on 2026-11-19; the photo design call, then COBIx's Ask B).

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| The 30-day artifact `course-outcomes-45026998155-part1` holds trial pages that print a staff name: delete it | a person | 2026-11-22 (S703) |
| Antelope Valley 43028 (CSU and IGETC figures on a Cal-GETC degree) and De Anza 45499 (a 180-unit bachelor's) | a person | 2026-11-23 (S713) |
| Santa Rosa Junior 06566 and 32298, held: the second reader found the wrong cause (06566's sibling 21718 passes on the same table; 32298 already reaches its 33.5) | Sky, a reread or a rule | 2026-11-23 (S713) |
| Santa Monica's 26: 6 wait on a runner page-text step, 17 on a reread, 03281, 10345 and 43765 on a person | Sky (23), a person (3) | 2026-11-23 (S713) |
| Glendale 32607 and 36416 (lecture-and-lab pairs read as separate choices) and 45068 (the capture's 16,000-character cap cuts Area 4): rereads; 44488 (MATH 102 and 102+ against one file row): a person | Sky (3), a person (1) | 2026-11-23 (S713) |
| Las Positas 01037 (passes only by double counting, 28 against 26-27) and 09227 (59-61 against 60 after the step); Antelope Valley 39295 (57-63 against 60) | Sky, lane 2 | 2026-11-23 (S713) |
| City College of San Francisco 17954 (its lists add to 4.0-13.0 against the printed 18.0; record unloaded) and the five held for a list or wording rule (09178, 17952, 31602, 36964, 42318; shares 0 to 0.333 against the state's list) | Sky, lane 2 | 2026-11-23 (S713) |
| College of Marin: its program URLs changed form, so the moved-page guard stopped its general education step (19789, 19791) | Sky, a capture or guard fix | 2026-11-23 (S713) |
| Clovis's 11 held: 33432 (#3683's pinned reread), 33489 (a fill step), 33431, 33506, 36050, 37227, 43015, 45325 (rereads), 33501, 36326, 39539 (a person) | Sky (8), a person (3) | 2026-11-23 (S713) |
| The next follow-up's minors: SDCCE's 6 SLO-label rows; Peralta's (five SCANS lines, COPED 452A four and DENTL 222 one; Merritt ART 080's "For 2/3 units"; the latent "Part 1 of the course...", "Part 1: None", "Skill #1: Weld..." and a SCANS run that swallows "Reading blueprints..."; `next_slo_colleges.py`'s census-route skip for `lan`); Los Angeles Harbor 44271, Los Angeles Trade-Technical 44345 and 45670; Orange Coast 03997, 08668, 12159; the hours reconcile eight (Laney 38970, 39365, 39366, 39368, 43451; De Anza 41176; Mendocino 43158; Coastline 42718); Mt. San Antonio 43777 and 43999 (capture reach); Glendale's data-names-the-program lever; the coarse-net hyphen; the `sources_from` pinned refusal; the `through` window's `until` field | Sky, the next follow-up | 2026-11-22 (S703); Peralta's 2026-11-23 (S713) |
| COBIx's minors (`f-cobix-minors-s713`): a confirm on a cut-off row blocks the apply, stricter than needed; Santa Rosa Junior 32301 and 35429 keep `main`'s live image while their files are rescored; the claim check's limit is written only in the receipt; College of Marin's pattern reads a major's "22 units" on a constructed line (it moved nothing) | COBIx | 2026-11-23 (S713) |
| The Commons shows SDCCE's 6 SLO-label rows as outcomes | Sky, the next follow-up | 2026-11-22 (S703) |
| City College of San Francisco's Cal-GETC dry run (32080, 33652, 46300): the permission check refused it twice | a plain session | 2026-11-21 (S691) |
| Golden West's 476 outline header rows: the guarded correction | a plain session's review | 2026-11-20 (S690) |
| Cerritos 20504: its run also holds 44984, held for a person | a person, on 44984 | 2026-11-21 (S697) |
| Records held for a person: College of the Canyons 43388, West Los Angeles 46261 and 38677, Napa Valley 19126, 31158 and 36528, Los Angeles Harbor 44947, Cerritos 44984, Los Angeles Mission 44849, Los Angeles City 32832, Ventura 45355, Shasta 18153 | a person | S653 to S691 |
| College of the Desert's 8: the prior catalog sits behind robots.txt | the college, or another source | 2026-11-20 (S689) |

Cleared tonight: handoff 704's Peralta load row; its row for Clovis's 14 and Glendale's 12 read wrongly gives way to
the Glendale and Clovis rows above, which hold what is left.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no new
answers since 2026-11-19). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight.

## Decisions (the conductor's, each reversible)

- `d-routine-takes-next-free-number-s713`: the routine takes the next free session number; S713 wrote 714.
- `d-peralta-load-cleans-labels-first-s713`: a load-time clean at `lan` only (SCANS lines, a bare "Part N", a leading
  ": ", None or N/A blocks, system notes), ahead of the load because it would have filed wrong rows.
- `d-ge-steps-three-colleges-s713`: Las Positas's two LPC-GE steps widened, Antelope Valley's "general education plus
  electives to 60" fill, College of Marin's 22-or-34 range; free reconcile runs; Antelope Valley 43028 and De Anza
  45499 to a person.
- `d-ge-01037-held-double-count-s713`: Las Positas 01037 passes only by double counting, so it is held and its file
  takes `main`'s record back, so a reread cannot undo the hold.
- `d-plan-rows-change-a-verdict-s713`: a plan writes only rows whose verdict moves; 09227 and 39295 left #3707's plan.
- `d-srjc-cut-off-holds-two-s713`: 06566 and 32298 held; `_short_or_unread` counts "incomplete" only where a partial sum
  falls short of a printed total.
- `d-glendale-minors-before-apply-s713`: the reader's three latent minors fixed before the apply, the 13 after-images
  proven unchanged.
- `d-ccsf-45768-existing-gap-s713`: an existing gap that fits is filed (45768 under `ge_pattern_certificate`).
- `d-ccsf-one-pr-s713`: City College of San Francisco's outline read and page-finding ride one PR.
- `d-cancel-merge-push-page-read-s713`: the page read #3675's merge push started was canceled as redundant.

Memory rows: `kb/migrations/2026-11-23_s713_cpl_memory_rows.sql` (rollback in its header), not pointed at by `.apply`;
the conductor applies it with one `execute_sql` call. DECIDED lines: the harvest lane.

## Patterns that worked

- **The compact pre-read** (`p-compact-preread-by-md5-s713`): hash the plan's before-values on a local Postgres 16
  (`pg_ctlcluster 16 main`) and compare `md5(record::text)` live: 2 KB in place of 72 KB, 15 of 15 matched. #3707's and
  Glendale's ran the same way, the functions they call recreated locally from `pg_get_functiondef`.
- **A bot receipt head gets its `test` from a dispatch** (`p-bot-receipt-head-dispatch-js-tests-s713`): `js-tests.yml`
  dispatched on the branch ran `test` on #3708's head `946b03ea` (run 45148367921, green at 09:50Z), no empty commit.
- **One PR per college** (`d-ccsf-one-pr-s713`): one merge cycle in place of two.
- A second reader on every plan before its apply: three applies, 36 rows; it held 2 at Santa Rosa Junior and 1 at Las
  Positas, caught the Antelope Valley fill taking the first digits it met (wrong on 4 of the 9 lines the reader fed
  it) and 12 system notes in Peralta's load.
- Free rule work first: 36 records and 47 named gaps for $0.17 of extraction.
- One writer per table: #3707's apply waited for the display build.

## Safety patterns to honor

All of handoff 704's. New tonight: `p-shared-shallow-clone-reshallows-s713` (fetch with `--shallow-since` or `--deepen`
on the shared clone); `p-confirm-verdict-marks-checked-at-apply-s713` (a prior confirm whose fingerprint matches can
mark a row checked at apply, and the rollback then skips it, so the pre-read counts matching and carried confirms and
the apply aborts above 0); `p-claim-check-reads-current-capture-s713` (the claim check reads today's capture in
`sources.json`, never the read behind the record, so it cannot fail a one- or two-page read). Each branch tonight put
`.apply`, `.load` and `.run` back to `main`'s value after its run, so no merge carries a live trigger. Never file a
person's name from an outline page anywhere. A permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about $750 a day for
everything, $10k running total for the whole job; workers on Opus 5.5, high effort on any worker that writes shared
data; reviews at most 9 agents, stopped after two rounds with what is left sent to Sam or COBIx; $40 per college per run
for program requirements and a separate $40 for SLOs, PLOs and course objectives, per run, never a remaining pot. Stop
rules from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline
row; a rollback that undoes over 1% of a day's rows; the $10k checkpoint.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3704 (`claude/awesome-fermat-0bgzd3`) | the declaration and this checkpoint | merges at sign-off |
| #3686, #3675, #3684, #3705, #3683, #3708 | merged | none |
| #3707 (`claude/s713-piles-ge`) | open; applied (migrate 45147953792); `.apply` back to `main`'s at `194d3c41` | merge |
| `claude/s713-piles2` (Glendale) | applied (migrate 45148301846); `.apply` back at `d87880f7`; no PR at this writing | open, merge |
| `claude/slo-ccsf` (City College of San Francisco, with `claude/ccsf-pages-s713` merged in) | loaded (45148533372); `34f7f05a`; no PR at this writing | open, merge |
| `s713-piles2-clovis` (Clovis) | local `2f42cdb9`; its second reader running | review, push as `claude/*`, apply, merge |
| College page read 45128802291 | canceled (redundant) | none |
| #3383 | dependabot's | waits |

## Let go

The ledger names no PR subscription, scheduled check-in or artifact watch: the run gated each PR by reads. The COBIx
watcher stopped at its two-hour limit shortly after 08:10Z; single polls after. Workers end with the session; their
branches are pushed, except Clovis's, local until its review ends.

SPEND_LINE

FINAL_LINE
