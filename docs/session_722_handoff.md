---
title: "Session 722 handoff (from SkySkua, S721, the CPL Queue routine's collection run of 2026-11-24, from 10:41Z)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the handoff
his plain session S722 writes (S722 took number 722 while this run worked; its #3768 merged at 12:56Z), never this
file. **Numbering.** This run is S721, the number handoff 721 named, and writes 722. The routine's next session is
**SkyTropicbird**: it takes the next free session number at its start and writes the handoff one above the highest on
`main` (`d-routine-takes-next-free-number-s713`).

# You are SkyTropicbird, the routine's next session

From SkySkua (S721), the CPL Queue routine's 10:12Z firing of 2026-11-24, a conductor run for collection only under
Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Mon Nov 23, written 6:45 PM PT), served by Opus 5.5
(the form names Fable 5.2). A **full checkpoint** (the harvest lane moved; Rule 10 data writes ran: five guarded
applies, three loads and a display build), written by the checkpoint-docs worker from 13:13Z while #3763 and #3764
were landing; the conductor brings it to its final state: the memory rows (step 10), the vault note's commit (step
11), step 12, and the placeholders below for the two merges, the closing census and the spend. Skipped: step 2
(tonight's code sits in the harvest's own named-gap file, reader and scorer, which the lane and lessons document), step
3 (no user-facing surface changed), step 7 (no re-mint, no roadmap status change, no auditor counts moved) and step 9
(the UI pass is its own queue item). The start and the college split below were written before any worker started.

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (Mon Nov 23, 6:45 PM PT), and comment 7064588752 (Sam's two
   rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*
   (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Workers share one shallow clone, so fetch a branch by name with `--shallow-since` or `--deepen`,
   never `--depth` (`p-shared-shallow-clone-reshallows-s713`); a new branch gets a fresh worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at this writing (13:30Z):** #3763 (the lever), then #3764 (the pooled reading), each with one update
   from `main` right before its merge; this checkpoint, #3760, at sign-off. Whichever is still open at your start goes
   first. Dependabot's #3383 waits. Never merge S720's `claude/s720-piles-modesto`: #3764 supersedes it.

## The start (10:12Z firing, 2026-11-24)

- Step 0: not the night's first firing; `daily-dashboard.yml` ran on UTC 2026-11-24 (`29927316`, 06:27Z).
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 10:14Z: S720 SkyEider's checkpoint #3751 (updated
  10:09Z, its handoff 721 complete to its last line, `test` running) and dependabot's #3383. The firing stayed
  read-only and took the queue when #3751 merged at 10:40Z (`13d93cd1`), as the 10:12Z firing did in S681
  (`d-firing-takes-queue-after-routine-checkpoint-s721`). The rule for a hand-run session's open PR stands as written.
- No pause line (handoffs 720 and 721). Three repos attached. Sheet 200: no reply since 2026-11-19T23:47Z.
  `queue_todo_done` since 2026-11-24: none. Rule 8's memory read: S720's 23 rows are live.
- Steps 6, 7 and 9: the Library's requests are the daytime Library run's; the CER procedure request (2026-11-19) is a
  plain session's; no exhibit re-analysis request is open. Step 8: weekly, Sundays. Step 10, the credential harvest:
  not run since 2026-11-13 (#3210); the conductor runs since 2026-11-17 hold to collection, and this one does too
  (`d-credential-watch-held-in-conductor-runs-s721`).
- Step 11: `python3 scripts/next_slo_colleges.py --next` says the queue is empty, after the 10:08Z census.
- Census on `main` (run 45371224551, 10:08Z): of 20,282 active programs, 15,498 pass and 4,353 have no passing record;
  431 are collected with a named gap.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying the records S720 applied
    and loaded after `abf1f6396156`, gate college Glendale, then the whole build, then `harvest-gap-census.yml` on
    `main`.
  - `pooled` (Opus, high effort), the fix that keeps a wave from filing wrong gaps: the scorer reads a parent figure
    over nested sub-blocks as one pool (`f-pool-figure-gaps-pass-when-pooled-s720`), with its self-recall and a
    statewide dry run; then Modesto Junior's held plan (`claude/s720-piles-modesto`) under it, and the 16 applied
    `pool_figure_not_read` rows checked against it. Colleges: Modesto Junior, El Camino, Santa Monica, Ventura, City
    College of San Francisco, Clovis, College of the Sequoias, Fullerton.
  - `lever` (Opus, high effort), the census's Next wave: Antelope Valley 10, Saddleback 7, College of the Redwoods 5,
    MiraCosta 5. A free page read and pins first; paid reads with `only=` at most $5 a college on the estimate, which
    the conductor dispatches. Orange Coast's 8 wait until lane 2 leaves that college; College of the Desert's 23 stay
    behind robots.txt.
- **Lane 2 (cheap piles, one worker at a time, high effort):** the census's wording-rule piles, Palo Verde 20, then
  Orange Coast 20, then Porterville 19 if the run has room. Each record is collected with its gap named
  (`sam-collect-with-gaps-2026-11-17`) or passes on a rule its own page prints; a second reader, a pre-read and the
  conductor's apply.

## Split changes during the run

- 10:47Z: the declaration on #3760. Display, `pooled`, `lever` and the Palo Verde piles started on Opus 5.5 at high
  effort; lane 2 went on to Orange Coast, Porterville, Gavilan and Butte, a fresh worker for each college.
- 11:06Z to 11:50Z: Palo Verde's plan s721a (17) to an Opus reader, FIX THEN APPLY (41227 and 41242 held), rebuilt at 15
  and applied (migrate 45387462655).
- 11:23Z to 11:31Z: Orange Coast's plan s721b (3 named gaps, 17 held), a Sonnet reader's APPLY, applied (45384449239).
- 11:28Z: #3761 merged (`21ebe65d`), display build `6de40ebdf2fd` (18,700 records): Glendale gate 45378640148 (242 rows),
  whole build 45379239301 (18,457 rows); 18,699 rows live at the build, the same 32 at older builds. 11:33Z: census
  45384590964 on `main` (`3c2df00b`): 15,498 of 20,282 pass, 4,350 without a passing record, 434 collected with a
  named gap.
- 11:09Z to 11:49Z: `pooled`'s reading and plan s721p (15 rows; self-recall 28 fail to pass, 0 pass to fail). 11:2xZ to
  11:36Z: `lever`'s six free reads; Saddleback's 7 named `not_in_catalog`.
- 11:41Z to 11:59Z: Porterville's plan s721c (15), a Sonnet reader's APPLY, applied (45386964248); its test then failed
  on its own apply and was fixed.
- 11:56Z to 12:05Z: Gavilan's plan s721d (10), a Sonnet reader's FIX THEN APPLY (08460, 19378, 38787 held), applied at 7
  (45389821901).
- 12:09Z: #3765 merged (`5a653136`). 12:10Z: `lever`'s round 1 fixes (rule B for a bound pin, MiraCosta's window);
  round 2 DISPATCH. 12:17Z to 12:19Z: Redwoods' paid read 45390207374 ($0.25 against $0.30), load 45392331223.
- 12:14Z to 12:37Z: Butte's plan s721e (14), an Opus reader's FIX THEN APPLY (the nine held), applied at 5 (45394922393).
- 12:22Z: spend about $112; no new workers from here (`d-no-new-workers-after-12z-s721`).
- 12:51Z to 12:54Z: MiraCosta's forced re-read of 07863, 45392607854 ($0.08 against $0.11), load 45397967009, passing.
- 12:56Z: S722's #3768 merged (`23a03d6c`). 13:03Z: #3764's round 1 fixes (the recall runs live; hedged, negated and
  restating sentences refused). 13:10Z: #3769 merged (`3d39f29b`), closing #3762 and #3767 with pointers.
- 13:25Z: S722's #3770 merged (`cec2b680`, two sidebars).
- 13:31Z: #3764's round 2, MERGE AND APPLY; after a clean pre-read of 15, migrate 45404108418 returned 15: 14 pass with
  no gap, Modesto 06642 carries `pool_figure_not_read`. Antelope Valley's paid read 45399693231 ($0.56 against $0.80)
  and its load: all 8 live and passing. #3763 ready at head `45ae3364`, `test` running.
- <<FINAL: #3763's and #3764's merges and the closing census, each with its time>>

## What shipped

- **#3761 `21ebe65d`:** display build `6de40ebdf2fd`, 18,699 rows live at the build (above).
- **#3765 `5a653136`:** Orange Coast, 3 collected with named gaps (35182 `noted_figures_differ`, 32189
  `lists_not_closed`, 19547 `unit_line_not_read`; migrate 45384449239); 17 held.
- **#3769 `3d39f29b`** (the land PR, `d-piles-land-as-one-pr-s721`; Gavilan and Butte pushed without PRs under the cap),
  42 records, every one applied and live before the merge: Palo Verde 15 (s721a: 12 `figure_within_variable_units`
  and 2 `degree_electives_not_printed`, both new, and 22484 `noted_figures_differ`), Porterville 15 (s721c: 43554
  passing on its catalog's misprint CGRAP P152 for CGRA P152, renamed in the plan only; 14 named gaps), Gavilan 7
  (s721d) and Butte 5 (s721e: `degree_within_map_range`, new, at 01305, 01358, 07258 and 45652; 31000
  `pool_figure_not_read`). Each plan had a second reader (Palo Verde and Butte Opus; Orange Coast, Porterville and
  Gavilan Sonnet), a clean md5 pre-read and the conductor's apply, `.apply` restored after each run.
- **#3763 (`claude/s721-lever`), the census's `reader_page_assignment` wave:** `site_pages` pins on the eLumen and
  curriQunet roads, `site_award_subheading`, `RC.PIN_HEADING`; Redwoods 01816 and 22666 pass and 42928 is collected
  with its failing check named; MiraCosta 07863 passes; 14 named gaps (Antelope Valley 35818; Redwoods 13559, 30811;
  MiraCosta 15183, 22006, 36144, 36171; Saddleback 7). Antelope Valley's paid read 45399693231 ($0.56 against $0.80)
  put its 8 live (02145, 02149, 02153, 11647, 11648, 12161, 14414, 15404), all passing. In all, 12 collected and live,
  11 passing (Redwoods 42928 fails its arithmetic: blocks of 29-35 under its printed "Total 25 - 28"), $0.89 paid
  against $1.21 estimated. Beyond the lever: `f-elumen-sister-award-swap-s721`. Head `45ae3364`;
  <<FINAL: merged sha and time>>.
- **#3764 (`claude/s721-pooled`), the pooled reading:** the scorer reads one printed figure over named lists as one
  pool; plan s721p, 15 rows (14 to passing at Modesto, Ventura, Santa Monica, Clovis, Sequoias and Fullerton; Modesto
  06642 to `pool_figure_not_read`). Round 2, MERGE AND APPLY; a clean pre-read of 15, then migrate 45404108418
  returned 15 at 13:31Z: 14 pass with no gap, Modesto 06642 carries `pool_figure_not_read`. Two minors go to the
  follow-up. It merges after #3763; <<FINAL: merged sha and time>>.

**Tonight's count:** 65 records collected and live: lane 2, 45 (44 with named gaps, 1 passing); the lever, 12 (11
passing); the pooled reading, 8 at Modesto (7 passing, 06642 with a named gap). Besides: 7 records moved from a named
gap to passing (Ventura 20576, 06957; Santa Monica 03263, 32792; Clovis 33489; Sequoias 35415; Fullerton 18163) and 14
named gaps for programs with no record. 0 outline rows (step 11's queue is empty). Paid reads $0.89 against $1.21
estimated.

**The closing census on `main`:** <<FINAL: its run id and time, passing and without a passing record>>

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S721*; `docs/reference/conductor_mode.md`, *What went wrong in S721*;
[`methodology-a-test-must-not-take-its-rule-as-the-truth`](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md),
*A test that reads its own plan's receipt*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's):
   - Land what is open of #3763 and #3764 (merge order above); then the display build carrying tonight's records, gate
     college Glendale, then `harvest-gap-census.yml` on `main` (NEXT (9)).
   - The pooled reading's next: Modesto's 5 s720j holds that pass under it, El Camino 02513, 02515 and 02517, the flips
     at Rio Hondo 3, Cuyamaca 2 and Golden West 1, and the `pool_figure_not_read` rows applied elsewhere (NEXT (2)).
   - Lane 1, the lever: the eLumen sister-award swap, a reader fix to `assign()`, unbuilt (Antelope Valley about 47;
     Redwoods 42895, 45557, 45595; `f-elumen-sister-award-swap-s721`); San Bernardino Valley 32317's paid read once
     #3763 is on `main`; Orange Coast's 8; then the Next wave of a fresh census (NEXT (3)).
   - Lane 2, the census's next piles: College of the Canyons 20, American River 19, Shasta 19, Santa Barbara City 18;
     a Butte reconcile that reads the map's elective line for the nine (NEXT (4)).
   - The one follow-up PR, after the waves (NEXT (5)): S713's minors (SDCCE's 6 SLO-label rows first), COBIx's minors,
     Cerritos 35166's pin, the free rules (City College of San Francisco 17615 to 17618; Cabrillo's recommended lists;
     the closed-list rescore), the `within_map` check on a kept `degree_within_map_range`, the plural department
     heading and #3764's two minors.
   - Sacramento City's one reread; Cosumnes River 33542; Folsom Lake 38736 (NEXT (6)). Step 11: the outline queue is
     empty until a census, a capture or a verdict row changes (NEXT (1)).
2. **A plain session's, each by its lane's NEXT.** They wait because conductor runs stay on collection (Sam's routine
   prompt of 2026-11-17: *"No new UI, tooling or governance work in conductor runs."*):
   - `commons` and `common-subjects-reference`: Sam's plain session S722 holds them (its #3768 and #3770; the `commons`
     lane is 20,470 bytes and waits on its next compaction); then the CSR lane's NEXT (1), the re-point of the folded
     local codes, a re-mint dry run first;
   - `cer-procedures` (compact the lane first, 21,633 bytes against 20,000), `my-college-action-page` (card 2, the
     nightly landing-page snapshot), `repo-size`, `governance-team-enablement`, `implementation-funding`, `library`,
     `sierra-page-redesign` and `common-cr-reference`, each by its lane's NEXT;
   - the brief's slimming items, its sections 1 and 4 (`d-slimming-left-to-plain-session-s720`).

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| Tonight's holds by key, each reason in its plan's receipt: Orange Coast 17; Palo Verde 5 (17998, 17999, 41227, 41242, 45359); Porterville 4 (09528, 35229, 35449, 45511); Gavilan 11 (08460, 19378, 38787 among them) | Sky, lane 2 | 2026-11-24 (S721) |
| Butte's 12: nine (01362, 07269, 11136, 31042, 31941, 32469, 33199, 40923, 43453) pass under a reconcile that reads the map's elective line; 01312, 14583, 33579 | Sky, a Butte reconcile | 2026-11-24 (S721) |
| Orange Coast's wording rules (08670 `degree_total_minimum`, 32737's substitution list) and its 8 on the reader-page lever | Sky, lane 1 and 2 | 2026-11-24 (S721) |
| The pooled reading's next: Modesto's 13 s720j holds (5 pass under it: 08104, 08111, 33944, 37300, 38067); El Camino 02513, 02515, 02517; Rio Hondo 3, Cuyamaca 2, Golden West 1 | Sky, after #3764 | 2026-11-24 (S720, S721) |
| San Bernardino Valley 32317: its S720 pin binds under #3763's `RC.PIN_HEADING`; its paid read | Sky, lane 1, after #3763 | 2026-11-24 (S720, S721) |
| MiraCosta 36144 and 36171 (`text_window_cut`: their section prints past the capture's 16,000 characters) | Sky, a wider text window | 2026-11-24 (S721) |
| The eLumen sister-award swap: Antelope Valley about 47 programs and Redwoods 42895, 45557 and 45595 are handed their sister award's page; a reader fix to `assign()`, unbuilt | Sky, lane 1 | 2026-11-24 (S721) |
| The follow-up's new minors: a kept `degree_within_map_range` is not checked against `within_map`; a certificate's heading check accepts a plural department heading; #3764's `live_flips` reads the filed arithmetic for rescored rows, and "List A requires 9 units together with its lab" still pools | Sky, the follow-up | 2026-11-24 (S721) |
| S720's holds by key, each reason in its plan's receipt: Fullerton 7, City College of San Francisco 9, Santa Monica 3, College of the Sequoias 2 (06770, 45030), Clovis 5, East Los Angeles 6 (33013 among them), Glendale 1 (45068), Ventura 17, Cabrillo 13, Contra Costa 6, El Camino 8 | Sky, lane 2 (a person for 33013) | 2026-11-24 (S720) |
| The free rules: City College of San Francisco 17615 to 17618 (own-option reading); Cabrillo 06352, 06380, 06381, 44992 (recommended lists); Fullerton 33680, 42143 and Ventura 30587 (a closed-list rescore); Cerritos 35166 (a pin, the whole-major exception) | Sky, the follow-up | 2026-11-24 (S720) |
| Sacramento City: 26 course-id gains and 4 kept `ge_units_not_read` gaps (04662, 17873, 17875, 42894) | Sky, one reread | 2026-11-24 (S720) |
| Cosumnes River 33542 (Option II's two blocks read as alternatives), held on `main`'s filing; Folsom Lake 38736, not rescored by its reconcile | Sky | 2026-11-23 (S714), S720 |
| Fullerton: 15 of its 296 passing records are not on their own page | Sky, a page read | 2026-11-24 (S720) |
| East Los Angeles's bound is unmeasured on capture text (41097 likely; 36345, 37924, 43632, 45935 possible) | Sky, a free reconcile before its next text run | 2026-11-23 (S714) |
| Santa Barbara City 05934: today's capture finds 31 of its option's 33 courses (ENVS 112, ENVS 115) | Sky, a read | 2026-11-23 (S714) |
| The 30-day artifact `course-outcomes-45026998155-part1` holds trial pages that print a staff name: delete it | a person | 2026-11-22 (S703) |
| Antelope Valley 43028 (CSU and IGETC figures on a Cal-GETC degree) and De Anza 45499 (a 180-unit bachelor's) | a person | 2026-11-23 (S713) |
| Santa Rosa Junior 06566 and 32298, held: the second reader found the wrong cause | Sky, a reread or a rule | 2026-11-23 (S713) |
| Santa Monica 03281, 10345 and 43765; Glendale 44488 (MATH 102 and 102+ against one file row); Clovis 33501, 36326, 39539 | a person | 2026-11-23 (S713) |
| Las Positas 01037 (passes only by double counting) and 09227; Antelope Valley 39295 | Sky, lane 2 | 2026-11-23 (S713) |
| College of Marin: its program URLs changed form, so the moved-page guard stopped its general education step (19789, 19791) | Sky, a capture or guard fix | 2026-11-23 (S713) |
| The next follow-up's minors (S703 and S713's list, lessons, *Moved from the lane (S714 checkpoint)*, NEXT (2)), SDCCE's 6 SLO-label rows first | Sky, the next follow-up | 2026-11-22 (S703) |
| COBIx's minors: `f-cobix-minors-s713`; `f-cobix-minors-s714` | COBIx | 2026-11-23 (S713, S714) |
| City College of San Francisco's Cal-GETC dry run (32080, 33652, 46300): the permission check refused it twice | a plain session | 2026-11-21 (S691) |
| Golden West's 476 outline header rows: the guarded correction | a plain session's review | 2026-11-20 (S690) |
| Cerritos 20504: its run also holds 44984, held for a person | a person, on 44984 | 2026-11-21 (S697) |
| Records held for a person: Contra Costa 01417 (two entry paths; S720), College of the Canyons 43388, West Los Angeles 46261 and 38677, Napa Valley 19126, 31158 and 36528, Los Angeles Harbor 44947, Cerritos 44984, Los Angeles Mission 44849, Los Angeles City 32832, Ventura 45355, Shasta 18153 | a person | S653 to S720 |
| College of the Desert: its 8 keep their gap and its 23 on the reader-page lever wait (the prior catalog sits behind robots.txt) | the college, or another source | 2026-11-20 (S689) |

Cleared tonight: handoff 721's Modesto Junior row (its plan s720j is superseded by #3764's s721p, which moves its 7
and 06642; its holds are the new pooled row above); San Bernardino Valley 32317's rule-B skip and its test's marking
(#3763's pin test marks it); Santiago Canyon's 3 pins, which handoff 721 still listed though #3758 had loaded them
(load 45363308686); the census's Next wave at Antelope Valley, Redwoods, MiraCosta and Saddleback (12 loaded, 14
named gaps). The pooled reading's apply moved 7 of S720's applied named gaps to passing.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no reply
since 2026-11-19T23:47Z). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. The run acted on his routine prompt of 2026-11-17 (*"Conductor mode is back for collection only."*;
*"Two lanes, never on the same college"*; *"Stop a review after two rounds and send what is left to Sam or COBIx."*)
and his collect-with-gaps ruling of the same day.

## Decisions (the conductor's, each reversible)

- `d-firing-takes-queue-after-routine-checkpoint-s721`: the firing stayed read-only while S720's checkpoint #3751 was
  open and took the queue at its merge, 10:40Z.
- `d-credential-watch-held-in-conductor-runs-s721`: the routine's step 10 did not run; conductor runs hold to collection.
- `d-piles-land-as-one-pr-s721`: Palo Verde, Porterville, Gavilan and Butte landed as one PR, #3769, under the PR cap.
- `d-palo-verde-41242-held-own-notes-s721`: 41242 held, since none of its own notes ties its 17.25 to FST 090's range.
- `d-miracosta-force-07863-only-s721`: MiraCosta's forced re-read ran on 07863 alone; the others are named gaps.
- `d-land-merged-without-main-update-s721`: #3769 merged without an update from `main`, which had moved only by S722's
  `23a03d6c`, touching none of its files.
- `d-orange-coast-lever-waits-s721`: lane 2 held Orange Coast, so its 8 on the reader-page lever wait.
- `d-no-new-workers-after-12z-s721`: once spend passed about $110 (12:22Z), the run landed what was in flight.

Memory rows: `kb/migrations/2026-11-24_s721_cpl_memory_rows.sql` (23 rows, rollback in its header), not pointed at by
`.apply`; the conductor applies it with one `execute_sql` call. DECIDED lines: the harvest lane.

## Patterns that worked

- **A plan's test holds before and after its own apply** (`p-test-reads-own-apply-receipt-s721`): its answers come
  from the page or a live derivation, never from the receipt the plan writes.
- **No test asserts another open PR's change absent** (`p-test-asserts-other-pr-absent-s721`): Butte's 01312 check now
  reads the hold.
- **A push touching `kb/college_reads/*.json` starts a page read** (`p-plan-file-push-starts-page-read-s721`): the read's
  commit goes last, and a third queued run cancels the pending one.
- **A pin test marks its members as the capture does** (`p-pin-test-sets-production-mark-s721`).
- **A named gap's test states only what its page prints** (`p-named-gap-asserts-only-the-page-s721`).
- **A record a cheaper lever passes is held, never gap-filed** (`p-gap-filing-leaves-census-lever-s721`): Butte's nine
  stay on the reconcile lever that passes them.
- **A forced re-read needs a text window that reaches the section** (`p-force-reread-needs-text-window-s721`).
- A second reader on every plan before its apply, each apply proved first on a local Postgres 16, and free rule work
  first: 45 records at five colleges for no paid read.

## Findings

- `f-cert-heading-accepts-plural-department-s721`: #3763's open minor.
- `f-degree-within-map-range-keep-unchecked-s721`: a reconcile keeps the kind without checking `within_map`.
- `f-butte-nine-pass-on-elective-line-s721`: the nine pass once the map's "Only necessary if the 60 units needed to
  graduate have not been completed" line reads as electives that fill the degree.
- `f-orange-coast-wording-rules-s721`: 08670 (`degree_total_minimum`) and 32737's substitution list, a later run.
- `f-modesto-s720j-holds-pass-pooled-s721`: 08104, 08111, 33944, 37300 and 38067 pass under the pooled reading.
- `f-pooled-flips-elsewhere-s721`: Rio Hondo 3, Cuyamaca 2 and Golden West 1, outside plan s721p.
- `f-elumen-sister-award-swap-s721`: both eLumen colleges hand programs their sister award's page beyond the lever
  (Antelope Valley about 47; Redwoods 42895, 45557, 45595); a reader fix to `assign()` is lane 1's next lever.

## Safety patterns to honor

All of handoff 721's: a test pins census members in a fixture, never the live census (`p-test-pins-census-members-s714`);
read `npm view <pkg> time` before pinning past a 404 (`p-fresh-release-404-reruns-s714`); one dispatch at a time per
branch; a fresh worker per branch; one writer of `.apply` per branch, the conductor, and a worker pulls before it
commits once the conductor has touched its branch; `on_live_run`, the own-page guard and `scorer_passes` on every plan;
a reconcile keeps only the records it was for. New tonight: a plan's test true before and after its own apply and
beside any PR it does not depend on; a record a cheaper lever passes stays on that lever. Each apply put `.apply` back
to `main`'s value after its run, so no merge carries a live trigger. Never file a person's name from an outline page
anywhere. A permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about $750 a day for
everything, $10k running total for the whole job; workers on Opus 5.5, high effort on any worker that writes shared
data; Sonnet or Haiku for routine reads; reviews at most 9 agents, stopped after two rounds with what is left sent to
Sam or COBIx; $40 per college per run for program requirements and a separate $40 for SLOs, PLOs and course
objectives, per run, never a remaining pot. Stop rules from the brief: a day over $300 with fewer than 40 new programs;
over $12 per new program or $0.50 per outline row; a rollback that undoes over 1% of a day's rows; the $10k
checkpoint. S720 spent about $255 earlier on this UTC day, so this run aimed at about $150. The form names Fable 5.2;
this run is served by Opus 5.5.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3760 (`claude/awesome-fermat-jzzf78`) | the declaration and this checkpoint | merges at sign-off |
| #3761 (`claude/s721-display`) | merged `21ebe65d` (11:28Z); display build `6de40ebdf2fd` live | none |
| #3765 (`claude/s721-piles-orangecoast`) | merged `5a653136` (12:09Z); applied by migrate 45384449239 | none |
| #3769 (`claude/s721-piles-land`) | merged `3d39f29b` (13:10Z): Palo Verde, Porterville, Gavilan and Butte, all applied and live | none |
| #3762, #3767 | closed with pointers to #3769 | none |
| #3763 (`claude/s721-lever`) | head `45ae3364` ready, `test` running at 13:35Z; its 12 loads live; <<FINAL: merged sha>> | the display build, then the eLumen swap |
| #3764 (`claude/s721-pooled`) | applied by migrate 45404108418 (15 rows live); merges after #3763; <<FINAL: merged sha>> | the display build, then Modesto's holds |
| `claude/s720-piles-modesto` (`a6d019a4`) | S720's held plan s720j, superseded by #3764 | never merge it |
| Harvest gap census on `main` | run 45384590964 (11:33Z), before Palo Verde, Porterville, Gavilan and Butte applied; <<FINAL: the closing census run>> | the next after tonight's display build |
| #3383 | dependabot's | waits |

## Let go

The brief names no PR subscription, scheduled check-in or artifact watch: the run gated each PR by reads, so there is
none to drop. No COBIx watcher ran (Sam's word of 2026-11-23). Workers end with the session; each branch is pushed. The
local Postgres 16 used for the apply proofs stops at sign-off. The vault note for this run is
`CPLBrain/07-session-notes/2026-11-24-s721-skyskua-collection.md`, on the vault's branch `claude/pensive-archimedes-jzzf78`.

Spend: <<FINAL: the run's spend by model and its collection tag, then its start (10:13Z) and end times in UTC, in the step 8 shape>>

Opening line: *Greetings, you are SkyTropicbird (the next free session number; Sam's plain session holds 722), see SkySkua's (S721) handoff — `docs/session_722_handoff.md` — let's keep rolling with our queue.*

This session's cost: <<FINAL: cost>>, records collected 65 (lane 2's 45, the lever's 12, the pooled reading's 8; besides, 7 moved from a named gap to passing and 14 named gaps for programs with no record), outline rows added 0, substantive PRs merged <<FINAL: count and numbers>>.
