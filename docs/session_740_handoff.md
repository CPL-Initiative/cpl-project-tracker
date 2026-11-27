---
title: "Session 740 handoff (from SkyOystercatcher, S739, the CPL Queue routine's collection run of 2026-11-26, from 06:12Z)"
created: 2026-11-26
updated: 2026-11-26
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_742_handoff.md
---

**Conductor model: Opus 5.5 (claude-opus-5-5), as this run's header reports; the routine's form names Fable 5.2.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (738, S737 SkyWhimbrel's, naming SkyTurnstone for Session 738), never this file.
**Numbering.** Handoff 738 names SkyTurnstone for Sam's next plain session as Session 738, so this run took the next
free number, S739, and writes 740, leaving 739 to SkyTurnstone's handoff (`d-routine-takes-next-free-number-s713`,
`d-routine-leaves-plain-handoff-number-s727`). S736 (SkyBrant) may still write 737. The routine's next session is
**SkySkimmer**: it takes the next free session number at its start and writes the handoff one above the highest on
`main`. Read `main`'s highest handoff before each merge of this file.

# You are SkySkimmer, the routine's next session

From SkyOystercatcher (S739), the CPL Queue routine's 06:12Z firing of 2026-11-26, a conductor run for collection only
under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358, served by Opus 5.5 (the routine's form names
Fable 5.2). Handoff 732 named SkyOystercatcher for the routine's next session, and no plain session held the name.

A **full checkpoint** (the harvest lane moved; Rule 10 data writes ran: guarded plans `s739a` to `s739n` and `s739l`,
waveB's own plan, one row's rollback, and the reads' reconciles, rereads and loads; a display build; and the memory
rows, drafted for the conductor), written by the checkpoint-docs worker from 11:16Z, before land 4's merge and before
waveB's plan and the waves' loads finished. The conductor's final facts (land 4's merge, the closing census, the Spend
line and the last line's numbers) fill the places marked in angle brackets. Skipped: step 2 (tonight's code sits in the
harvest's own named-gap files, scorer and reconcile, which the lane and lessons document), step 3 (no user-facing
surface changed), step 7 (no re-mint, no roadmap status change, no auditor counts moved) and step 9 (the UI pass is its
own queue item). The start and the college split below were written before any worker started, and the split changes
are the run's log, kept whole.

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (Tue Nov 24, 6:45 PM PT, at this writing), and comment
   7064588752 (Sam's two rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*
   (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Workers share one shallow clone, so fetch a branch by name with `--shallow-since` or `--deepen`,
   never `--depth` (`p-shared-shallow-clone-reshallows-s713`); a new branch gets a fresh worker. A worker's push counts
   once `git ls-remote` shows its head (`p-worker-push-proved-by-ls-remote-s731`). **Fetch `main` by name first:** this
   container's shared clone had `origin/main` at S719's commit tonight, and the harness made every worker's worktree
   there (`p-shared-clone-origin-main-stale-s739`).
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at sign-off:** #3880 (`075d1ee8`, the display build), #3881 (`48966ffa`, the lever's land), #3882
   (`1caef64a`, the pooled reading's land) and #3883 (`2e4ccabb`, the applied piles s739a to s739h) have merged; land 4,
   #3884 (`claude/s739-piles2`, `waveA` and `waveB` as one PR off `main`), merged at 12:02Z (`91a3a856`, confirmed on `origin/main`). This checkpoint,
   #3879, merges at sign-off, with one update from `main` right before its merge. Open PRs at sign-off: #3879 and
   dependabot's #3383, which waits.

## The start (06:12Z firing, 2026-11-26)

- Step 0: the night's first firing. No `daily-dashboard.yml` run created on 2026-11-26 UTC, so the run dispatched it
  on `main` at 06:14Z.
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 06:15Z: dependabot's #3383 alone. `main` at
  `51744a70` (the dependency map after #3878, handoff 738). S737 (SkyWhimbrel) signed off at about 05:15Z; S736
  (SkyBrant) has no open PR.
- No pause line (handoffs 732 and 738). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter). Context at start 19.4% of 786,077.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-25: none. Rule 8's memory read: no
  harvest row since S731's 19 (14:36Z); S733 to S737 filed Commons, Library and funding rows only. Steps 6 to 10:
  held in a conductor run, as S727 and S731 held them. Step 11: the outline queue is empty until a census changes.
- Census on `main` (45733846878, 01:19Z): of 20,282 active programs, 15,577 pass and 4,176 have no passing record;
  529 are collected with a named gap.
- Supabase's connector answered Bad Gateway from 06:16Z to about 06:17Z; reads went through after.
- **Spend aim:** about $350 for this run, no new worker after about $275. S736 and S737 ran unmetered earlier on
  this UTC day (01:13Z to 05:15Z), so the day stays under about $750.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S731's records, gate
    college Glendale, then the whole build, then `harvest-gap-census.yml` on `main`.
  - `lever` (Fable 5.2, high effort): Los Angeles Southwest 4; Sacramento City 4 with its one reread; Cosumnes River 3
    with 33542; Folsom Lake 38736 (pinned to p.176); Santiago Canyon 3; Coastline 7; East Los Angeles 38332 and 45540
    (a paid read, about $0.16) and its person row 33013, collected with its gap named; Napa Valley 3. Free page reads
    first; a paid read takes `only=` and at most $5 a college on the estimate. Colleges: Los Angeles Southwest,
    Sacramento City, Cosumnes River, Folsom Lake, Santiago Canyon, Coastline, East Los Angeles, Napa Valley.
  - `pooled` (Fable 5.2, high effort): El Camino 02513, 02515 and 02517 (a free reconcile) and 19861, 19866, 38948 and
    43993 (a paid read); Cuyamaca 18634 to 18637; Modesto 06683, 35127 and 42664. Colleges: El Camino, Cuyamaca,
    Modesto Junior. No Porterville reconcile before the 06773 guard.
- **Lane 2 (cheap piles, one worker at a time, high effort):** S727's holds by key at American River 7, Shasta 15,
  College of the Canyons 14 and Santa Barbara City 5; S731's at Los Angeles Trade-Technical 11, Saddleback 2 and Long
  Beach City 4; the person rows outside lane 1's colleges, each collected with its gap named and a lower score on the
  0-100 bar (Santa Monica 03281, Clovis 36326 and 39539, Los Angeles City 32832, Los Angeles Mission 44849, Glendale
  44488 after the display build, Cerritos 44984 a reload); then Orange Coast's 17 and 08626; then S720's and S721's
  holds by key as spend allows (Palo Verde 5, Gavilan 11, Ventura 17, Cabrillo 13 and the rest). Cosumnes River's 17
  join lane 2 only once `lever` leaves Cosumnes River. At its land, the Spend line's builders and the Commons page
  counts are rebuilt. Colleges: American River, Shasta, College of the Canyons, Santa Barbara City, Los Angeles
  Trade-Technical, Saddleback, Long Beach City, Santa Monica, Clovis, Los Angeles City, Los Angeles Mission, Glendale,
  Cerritos, then Orange Coast, Palo Verde, Gavilan, Ventura, Cabrillo.
- **Not tonight:** Porterville (the follow-up's guard first); Saddleback's next read (its `repeat` window fix first);
  West Valley 35588 and rule A's three (a reader change); the eLumen follow-up's rest (Antelope Valley, Mission) unless a
  slot and spend allow; College of the Desert (robots.txt); Los Medanos (parked); MiraCosta 36144 and 36171; the
  follow-up PR, after the waves if the run has room.

## Split changes during the run

- 06:19Z: the declaration, #3879. 06:22Z: `lever`, `pooled` and `piles` started on Fable 5.2 at high effort.
- 06:23Z: this clone's `origin/main` ref was stale (`56c38abf`, S719's), so the harness made each worker's worktree
  there. The conductor fetched `main` by name (`51744a70`) and told all three to start their branches at it before
  any work (`p-shared-clone-origin-main-stale-s739`).
- 06:24Z: display build `3a699eddc8c9` on `claude/s739-display` (built on `51744a70` with Python 3.12; the sandbox's
  3.12 lacked `openpyxl` until `requirements.txt` was installed). 06:25Z: the Glendale gate 45768078451 dispatched,
  beside the day's dashboard run 45766799397 (green at 06:25Z).
- 06:28Z: the Glendale gate green: 242 rows at `3a699eddc8c9`, nothing else moved. 06:29Z to 06:37Z: the whole build:
  18,727 rows at `3a699eddc8c9` (the 4 with no display now carry one), the same 32 at older builds, none without a
  display. #3880 opened for the merge; the census on `main` follows it.
- 06:30Z: workers told to open no PR (the run keeps at most 3 open); the conductor opens each land.
- 06:50Z: #3880 merged (`075d1ee8`, confirmed on `origin/main`) without a final update from `main`, which had moved
  only by the day's dashboard commit `15088513`, touching none of its files (as `d-display-merged-without-main-update-s731`).
  The census dispatched on `main` at 06:50Z.
- 06:55Z: the census after the display build, 45771011713 on `main` (`00e3011b`): 15,578 of 20,282 pass, 4,175 have
  no passing record.
- 07:50Z: `pooled` reported (head `a7c8bedc`): 5 live and passing (El Camino 02513, 02515, 02517 by reconcile
  45768189197 and reread 45774563911; Modesto 06683 and 42664 by a Modesto reconcile entry, reconcile 45772245635 and
  reread 45774398044), 9 held (El Camino 19861, 19866, 38948, 43993: the Acalog road never reads `site_pages`; Modesto
  35127: no gap kind fits two learner paths; Cuyamaca 18634 to 18636: a scorer change; 18637: `page_is_own` compares
  "Science" with "Sciences"), $0 paid. It ran free page reads through `college-page-read.yml`, which the lift did not
  name (**DECIDED** `d-free-page-read-workflow-in-lift-s739`: a free, branch-only page read is inside the lift's words).
  To a Sonnet second reader before its land.
- 07:59Z: `pooled`'s reader: FIX THEN MERGE. The rereads' blast radius: El Camino 126 records, 0 pass to fail, 3 fail
  to pass, no course or total lost; Modesto 188, 0 pass to fail, 2 fail to pass. MAJOR, pre-existing on `main`: El
  Camino 02487's filed `score` reads pass (27-28) while the scorer gives fail (51-62 against 60), so the Commons counts
  a pass the scorer rejects; its committed `was` step fixes it at the next reconcile
  (`f-elcamino-02487-stale-pass-s739`, for the lane). MINORs: the test crashed rather than asserted with the Modesto
  steps removed; two sibling tests now accept either state (the S731 pattern). `pooled` resumed to merge `main`,
  regenerate and tidy the test; the conductor opens the land.
- 08:05Z: `lever` reported (head `dbfd245a`, `main` merged in): 3 live and passing (Folsom Lake 38736; East Los
  Angeles 38332, pinned to pp.195-196; Coastline 40476); Sacramento City's reconcile and reread restamped 30 rows with
  no verdict moved; 6 named gaps with no record (East Los Angeles 45540 `list_by_reference`; Coastline 03724, 20353,
  18054, 11459, 18216 `credit_not_in_catalog`); Coastline 43057 held (the title rule binds legacy 33014 on its page, a
  shared reader change); Los Angeles Southwest 4, Cosumnes River 3, Santiago Canyon 3 and Napa Valley 3 were already
  named gaps with no record, relisted by the census (`f-census-ignores-college-named-gaps-s727`). Plan s739l, 2 rows
  for the conductor: Cosumnes River 33542 `option_lists_read_apart` and East Los Angeles 33013 `noted_figures_differ`,
  each at 40. Paid reads $0.34 charged. To a Sonnet second reader (the land and the plan).
- 08:10Z: lane 1 takes the fresh census's wave (45771011713's `next_wave`, less the colleges held, parked or blocked),
  split in two before either worker started its first write: `waveA` (Fable 5.2, high effort): North Orange
  Continuing Education, Allan Hancock, Bakersfield, Citrus, College of the Redwoods, Copper Mountain, Cuesta, De Anza,
  Grossmont, Las Positas, Los Angeles Harbor, Los Angeles Pierce, Moorpark. `waveB` (Fable 5.2, high effort): San
  Diego City, San Diego College of Continuing Education, Santa Rosa Junior, Sierra, Skyline, Taft, West Los Angeles,
  Riverside City, Berkeley City, Chaffey, Evergreen Valley, Lassen, Merced, Mt. San Antonio, Ohlone, Reedley, Santa
  Ana, Victor Valley, Yuba. Each checks its colleges' own named-gap files first; a paid read takes `only=`, at most $5
  a college and $15 a worker on the estimate. Left out of the wave: College of the Desert (robots.txt), Saddleback (its
  `repeat` window first), MiraCosta (a wider text window), Southwestern, Pasadena City and West Valley (rule A and
  35588, reader changes), Antelope Valley and Mission (the eLumen follow-up's rest), and every lane 2 college.
- 08:06Z: `lever`'s reader: LAND: MERGE; PLAN: APPLY (Sacramento City 0 pass to fail, 0 fail to pass; both kinds
  exist on `main`; MINOR, the window-fill floor 18 to 17 because Folsom 38736 left the cut population). 08:07Z: clean
  md5 pre-read (2 of 2); migrate 45780554871 returned 2, none skipped; `.apply` restored (`1cf011f2`). Cosumnes
  River leaves lane 1: its 17 piles may join lane 2. 08:12Z: #3881 opened for `lever`'s land.
- 08:24Z: #3881 merged (`48966ffa`, confirmed on `origin/main`; `main` had not moved since its base). `pooled` resumed
  to take `main` once more before its land.
- 08:25Z: `piles`' first five plans on `claude/s739-piles` (`b4accaca`), 40 rows (11 passing, 29 named gaps), no new
  kind: s739a American River 5 named gaps (39731 and 39732 held, another award's section); s739b Shasta 12 (18625,
  18655 and 32162 held); s739c College of the Canyons 13 (7 passing by a rename their notes name, 6 named gaps; 36793
  held); s739d Santa Barbara City 3 (30746 needs a reread, 43553 a page read); s739e Los Angeles Trade-Technical 7 (4
  passing by a rename, 3 named gaps; 4 held). Their shared `kb/_program_piles_s739.py` adds an own-page guard on the
  record's own heading (or its own list, for `heading_not_in_text` alone) and a rename rescore (S721 Porterville's
  form). Two Sonnet readers took them (s739a and s739b; s739c to s739e), with the shared module in scope.
- 08:31Z: the second reader of s739c to s739e: s739c APPLY, s739d APPLY, s739e FIX THEN APPLY. MAJOR: s739e's 41150
  (Fashion Media) renames `DIGMD 100` to `DIGLMD100` on a note that names a title mismatch ("Introduction to Digital
  Video" in the state list against "Introduction to Digital Media" in the catalog), so it leaves the plan (expect 6)
  unless a catalog line shows the same course. MINOR: s739e 31090's own-heading pass rests on the PLUMBING 028 rename
  that 02911's note carries. The shared guard and the rename rescore are sound otherwise (11 rows move by the rename,
  through coverage only); every kind exists on `main`.
- 08:33Z: clean md5 pre-reads, s739c 13 of 13 and s739d 3 of 3. 08:34Z: s739c's trigger on `claude/s739-piles`
  (`5302ff02`); migrate 45784291084 returned 13, none skipped. 08:36Z: s739d's trigger (`61d2fcb3`). The `piles`
  worker was told to pull before its next commit. 08:35Z: #3882 opened for `pooled`'s land (head `ddb18d16`, `main`
  `48966ffa` merged in). 08:37Z: migrate 45784554765 returned 3 for s739d, none skipped; `.apply` restored
  (`d0b32281`).
- 08:40Z: `piles`' interim 2 (head `2b3566b3`): s739e fixed in round 1 (41150 left the plan and holds; 6 rows,
  expect 6, its SQL and receipt rewritten); s739f Saddleback 2 named gaps (04073 `waived_course_counted`, 36625
  `pool_figure_not_read`); s739g Long Beach City 1 (44848 `noted_section_cut_off`; 43021, 37213 and 42970 held). The
  shared module now tells same-title page-mates apart only where the awards differ and the heading names this record's
  award (the heading's words alone had let Long Beach City 43021 through beside 02677). A Sonnet reader took s739e's
  second and last round, s739f, s739g and the shared change.
- 08:46Z: #3882's `test` failed (lints 2 and 5, run 45784375158); `pooled` resumed to read the two failed jobs and fix.
- 08:48Z: the reader of s739a and s739b: APPLY, APPLY (all kinds on `main`; the shared guard sound; the rename rescore
  moves none of their rows). MINORs: Shasta 30580 holds the same list as 43618 from one "Communication Studies 2.0"
  section and looks mis-filed (`f-shasta-30580-shares-43618-list-s739`, for the lane); 18144's live run rests on the
  plan's hard-coded file history; a mutated held row passes its test silently. 08:49Z: their SQL unchanged since
  `b4accaca`; clean md5 pre-reads, s739a 5 of 5 and s739b 12 of 12. Migrate 45786607372 returned 5 and 45786864971
  returned 12, none skipped; `.apply` restored (`1f932c3b`).
- 08:55Z: the reader of s739e (round 2), s739f and s739g: APPLY, APPLY, APPLY (41150 out and identical to `main`;
  every kind on `main`). MAJOR in the shared module, hit by no row tonight: `_heading_apart` lets both same-title
  sisters claim `own_heading` when the heading names both awards (Palomar's "A.A. Degree Major or Certificate of
  Achievement": 27 of 348 identical-heading sister pairs both pass); `piles` fixes it, with a Palomar-shaped test,
  before any later plan uses it (`f-heading-apart-both-awards-s739`). MINOR: the common test misses an edited
  after-image or md5 in the apply SQL. 08:55Z: clean md5 pre-reads, s739e 6 of 6, s739f 2 of 2, s739g 1 of 1; the
  three applies run in order, each after the last one's receipt.
- 08:56Z to 09:01Z: migrate 45787269553 returned 6 (s739e), 45787472150 returned 2 (s739f), 45787671731 returned 1
  (s739g), none skipped; `.apply` restored (`964038b6`). The shared clone's `shallow.lock` held four fetches for a
  minute while workers fetched; the apply script retried each.
- 09:05Z: `pooled`'s lint fix (head `8c632530`): lints 2 failed because its new test step carried the docs-only skip
  without a line in `tests/lints_docs_only_skip.json` (it now runs on every diff); lints 5 because two El Camino page
  plans named no `http_hosts` reason for nine http pages (both now do; the push read nothing again). The worklist
  date's hand edit was not a cause.
- 09:10Z: `piles` reported (head `5d92c461`): 44 rows planned (10 passing on a rescore, 34 named gaps), 42 applied;
  s739h, the person rows at Clovis (36326 `lists_not_closed`, 39539 `heading_not_in_text`), to a Sonnet reader with
  the shared module's two later changes (the Palomar-shaped `_heading_apart` fix, guarded by
  `tests/program_piles_s739_guard_test.py`; `on_live_run` accepting a row already at its after-image, since Shasta's
  test went red on 18144 once s739b applied). Los Angeles Mission 44849 is named with no record. A reread or page read
  is the lever for American River 39731 and 39732, Shasta 18625, Santa Barbara City 30746 and 43553, Los Angeles
  Trade-Technical 45285 and 31280, Long Beach City 37213, Santa Monica 03281 and Los Angeles City 32832; an alias and
  a free reconcile for Shasta 18655 and Los Angeles Trade-Technical 31089 and 41150; a reload for Cerritos 44984; a
  units twin of `hours_within_printed_range` for Shasta 32162 and College of the Canyons 36793. Glendale 44488 stays
  held (its invented check fails; the college's call). 09:12Z: `piles` resumed on Cosumnes River's 17 (s739i), then
  Orange Coast's 17 and 08626 (s739j), to stop at 11:00Z.
- 09:15Z: #3882 merged (`1caef64a`, confirmed on `origin/main`; `main` had not moved since the branch took it).
- 09:19Z: s739h's reader: APPLY; the shared module's two later changes SOUND (MINOR: a vacuous check in the persons
  test). 09:20Z: clean md5 pre-read, 2 of 2; Los Angeles Mission 44849 has no live row, as its named gap says. The
  s739h apply dispatched. 09:23Z: migrate 45790943587 returned 2, none skipped; `.apply` restored (`59486d6e`).
- 09:25Z: the applied plans s739a to s739h land now from `claude/s739-piles-land`, cut at `59486d6e` and brought up
  to `main` by a Sonnet worker (no data writes), while `piles` keeps writing s739i and s739j on `claude/s739-piles`,
  whose own land follows once the first merges (**DECIDED** `d-land-applied-piles-apart-s739`).
- 09:34Z: `claude/s739-piles-land` at `a7c293a8` (`main` `1caef64a` merged; the three Commons files took `main`'s side,
  then both builders reran; `check_generated.sh` all ok; every S739 test passes). #3883 opened for its land.
- 09:36Z: `piles`' second report (head `20982003`): s739i Cosumnes River, 11 rows (4 passing by a rename to a fused
  state code: MKT 495 for 'MKT 495 23085' at 04596 and 35899, RE 296 for 'RE296282560' at 20197 and 39139; 7 named
  gaps; 5 held), and s739j Orange Coast, 4 named gaps (13 held; 08626 no key). The shared module adds `LiveRuns`, the
  live-run reading for a college with no earlier module. Both, with `LiveRuns`, to a Sonnet reader. `piles` finished
  (Palo Verde, Gavilan, Ventura and Cabrillo not reached). 09:38Z: `piles2` (Fable 5.2, high effort) took Palo
  Verde, Gavilan and Ventura on `claude/s739-piles2`, cut at `20982003` (s739k, s739m, s739n), to stop at 10:50Z;
  `claude/s739-piles` lands through it.
- 09:43Z: #3883's `test` failed (lints 2 and 6, run 45793085708). 09:45Z: fixed on the land branch (`36ba8d32`): nine
  new S739 test steps carried the docs-only skip with no line in `tests/lints_docs_only_skip.json` (they now run on
  every diff), and `tests/program_piles_s727_shasta_test.py`'s pin read s739b's posted runs as unnamed (it takes
  `skip=("s727c","s739b")`). `piles2` told both (`p-new-ci-step-docs-only-skip-needs-list-s739`).
- 09:47Z: the reader of s739i and s739j: APPLY, APPLY. The fused-code renames stand on the committed
  `kb/reference/cb_course_basic_fall2025.csv` (`MKT495-23085` "Indep Studies in MKT", 1-3 units; `RE296-28256`
  "Internship in Real Estate", 3 units; the state list holds no separate MKT 495 or RE 296). MINOR: `LiveRuns`' reread
  SQL keeps a row when `cur.extracted_run >= new_run`, so a kept key proves only a run at least the reread's; 32737
  and 36732 are unaffected and the apply's run guard aborts on a wrong run (`piles2` fixes it). 09:47Z: clean md5
  pre-reads, s739i 11 of 11 and s739j 4 of 4; their applies run in order on `claude/s739-piles`, and `piles2` merges
  that branch's receipts before its first push.
- 09:51Z and 09:54Z: migrate 45795171251 returned 11 (s739i) and 45795874952 returned 4 (s739j), none skipped;
  `.apply` restored on `claude/s739-piles` (`53ec5da1`).
- 09:55Z: #3883 at `36ba8d32` failed lints 6 (run 45794921914). 10:17Z: fixed (`8aa14169`):
  `tests/program_piles_s727_canyons_test.py` pinned 15477's run, which s739c's receipt moves (it takes
  `skip=("s727a","s739c")`); the worker ran all 47 piles and reconcile tests and shard 6's other steps first. An
  older plan's test that pins posted runs fails when a later plan posts on top of it
  (`p-older-pile-tests-pin-runs-later-plans-move-s739`); `piles2` told to run all 47 before its push.
- 10:26Z: `piles2` reported (head `1272ca87`, carrying s739i's and s739j's receipts): s739k Palo Verde 5 named gaps,
  s739m Gavilan 9 (08464 and 45357 held), s739n Ventura 7 (10 held, six for a reread); no passing row, no new kind; the
  kept-key fix in the shared module. It files `noted_figures_differ` on Gavilan 08460, 38787, 41394 and 19378, whose
  sums sit inside their printed range, where S703 decided they take no lists gap
  (`d-lists-gap-holds-range-sums-s703`); its Sonnet reader settles whether that kind is true for each.
- 10:27Z: #3883 merged (`2e4ccabb`, confirmed on `origin/main`; `main` had not moved since the land branch took it).
- 10:33Z: the reader of s739k, s739m and s739n: APPLY, FIX THEN APPLY, APPLY. MAJOR: `noted_figures_differ` is not
  true for Gavilan 08460, 19378, 38787 and 41394, whose sums sit inside their printed ranges (36 in 30-36, 27 in
  26-27, 24 in 14-24, 53-60 in 48-60): the S703 within-range case. **DECIDED**
  `d-within-range-sums-hold-for-units-kind-s739`: the four leave s739m (rebuilt at 5 rows), and Orange Coast 41373,
  applied in s739j on the same reading, rolls back from s739j's receipt to its before-checks; all five hold for a
  units twin of `hours_within_printed_range`, with Shasta 32162 and College of the Canyons 36793 (the follow-up's
  item). `piles2` resumed for the fix and the one-row rollback.
- 10:52Z: `piles2`'s fix (`3daa35e3`, `main` `2e4ccabb` merged; 52 of 52 tests): s739m at 5 rows (the kept rows'
  images unchanged, renumbered); `kb/migrations/2026-11-26_s739j_41373_rollback.sql` with its md5 pre-read; 41373's
  committed record file back to `main`'s copy, so no later load re-posts the gap; 17998's field is a default, noted.
- 11:05Z: `waveB` reported (head `24b34c77`): 6 records live (Riverside City 33230, San Diego College of Continuing
  Education 38411, Yuba 37946, Evergreen Valley 40353, Mt. San Antonio 41116, Skyline 30882; five pass), 15 named gaps
  with no record, 2 relists, 3 held (San Diego City 22367 and Santa Ana 12242 need a 91-minute and a two-hour fresh
  capture; Reedley 30465, rule A); a 1-row plan, its own "s739b" (`kb/migrations/2026-11-26_s739b_prreq_named_gaps_*`,
  Riverside City 33230 `ge_units_not_read`; the id repeats `piles`' Shasta plan, the files do not); paid reads $0.385.
  `waveA` reported (head `2e1a1ada`): 8 records live (De Anza 41327 and 31504; Las Positas 18813 and 36449; Cuesta
  21050 and 43053; Grossmont 32879; Bakersfield 09968; six pass), 8 named gaps with no record, 11 relists, Copper
  Mountain 41085 held (the registry names a 404 address; the reissued catalog is
  `https://www.cmccd.edu/wp-content/uploads/2026/11/Final-26-27-Catalog-11.18.26r1.pdf`); paid reads $0.50. Each to
  a Sonnet reader. 11:06Z: clean md5 pre-reads, s739k 5 of 5, s739m 5 of 5, s739n 7 of 7, and 41373 at s739j's
  after-image; the four run in order on `claude/s739-piles2`.
- 11:07Z: `waveB`'s reader: LAND: MERGE, PLAN: APPLY (four of its colleges went fail to pass, none pass to fail; every
  named-gap reason exists on `main`; no person's name filed). The plan's pre-read compares whole jsonb; the conductor
  read run, before-checks, the checked flag, heading, blocks and total instead (1 of 1 clean), since the apply guards
  on the whole before-record itself. 11:10Z: `waveA`'s reader: FIX THEN MERGE: the eight records and eleven relists
  hold (none pass to fail); the branch must take `main` and regenerate its Commons files (its hand-set
  `kb/status/commons.json` value matches its base, not `main`); and four of its named-gap labels are new on `main`:
  `catalog_list_differs`, `certificate_names_the_major`, `list_printed_as_number_run` and `catalog_renumbered`, free
  text in inert `named_gaps_s739.json` files, so no matcher reads them yet (`f-four-new-named-gap-labels-s739`: no
  census or `kb/_program_named_gaps.py` match on them without a recall test). **DECIDED**
  `d-one-land-for-piles2-and-waves-s739`: `piles2`, `waveA` and `waveB` land as one PR off `main`, once the applies
  finish, as S731's #3830 did.
- 11:06Z to 11:11Z: migrate 45807245565 returned 5 (s739k), 45807528712 returned 5 (s739m), 45807753854 returned 7
  (s739n), none skipped; 45807976291 returned 1 for the 41373 rollback (Orange Coast 41373 back at its before-checks);
  `.apply` restored on `claude/s739-piles2` (`9b58f0f9`). 11:12Z: `waveB`'s plan dispatched on its branch.

## What shipped

In all: **99 records collected** (22 live by reads and loads, 77 by guarded plans: 14 passing on a rescore by a rename and
63 named gaps), plus **30 named gaps for programs with no record** (lever 6, piles 1, waveA 8, waveB 15); no outline rows;
Sacramento City's 30 restamped rows are not counted. Paid reads about $1.23. Headline at 11:14Z: 15,610 of 20,282 active
programs complete at 118 colleges.

**Merged.**
- **#3880 (`075d1ee8`, 06:50Z), the display build `3a699eddc8c9`** (18,727 rows; S731's records): the gate at Glendale
  45768078451 (242 rows), then the whole build; the 4 rows with no display now carry one, the same 32 stay at older
  builds, none without a display. It merged without a final update from `main`, which had moved only by the day's
  dashboard commit (`d-display-merged-without-main-update-s731`). The census on `main` after it, 45771011713 (06:55Z):
  15,578 of 20,282 pass, 4,175 have no passing record.
- **#3881 (`48966ffa`, 08:24Z), `lever`'s land:** Folsom Lake 38736, East Los Angeles 38332 and Coastline 40476 live and
  passing; Sacramento City's reconcile and reread restamped 30 rows with no verdict moved; 6 named gaps with no record.
  Plan s739l, 2 rows (Cosumnes River 33542 `option_lists_read_apart`, East Los Angeles 33013 `noted_figures_differ`,
  each at 40), applied at 08:07Z (migrate 45780554871, 2 rows). Paid reads $0.34.
- **#3882 (`1caef64a`, 09:15Z), `pooled`'s land:** El Camino 02513, 02515 and 02517 (reconcile 45768189197, reread
  45774563911), Modesto 06683 and 42664 (reconcile 45772245635, reread 45774398044), all live and passing; $0 paid. The
  reader's finds: `f-elcamino-02487-stale-pass-s739`. A new CI step needed a line in `tests/lints_docs_only_skip.json`
  (`p-new-ci-step-docs-only-skip-needs-list-s739`).
- **#3883 (`2e4ccabb`, 10:27Z), the applied piles s739a to s739h**, cut apart from `piles`' working branch
  (`d-land-applied-piles-apart-s739`), each plan with a Sonnet reader's APPLY, a clean md5 pre-read and the conductor's
  apply, `.apply` restored after each: s739a American River 5 (45786607372), s739b Shasta 12 (45786864971), s739c
  College of the Canyons 13 (45784291084), s739d Santa Barbara City 3 (45784554765), s739e Los Angeles Trade-Technical
  6 (45787269553), s739f Saddleback 2 (45787472150), s739g Long Beach City 1 (45787671731), s739h Clovis 2
  (45790943587). The shared `kb/_program_piles_s739.py` carries an own-page guard and a rename rescore.

**Applied, landing in land 4.** s739i Cosumnes River 11 (45795171251; 4 passing by a rename to a fused state code, 7
named gaps), s739j Orange Coast 4 (45795874952) less 41373, rolled back at 11:10Z from s739j's receipt
(`kb/migrations/2026-11-26_s739j_41373_rollback.sql`, 45807976291, 1 row), s739k Palo Verde 5 (45807245565), s739m
Gavilan 5 (45807528712; rebuilt from 9 after the reader's MAJOR), s739n Ventura 7 (45807753854); `.apply` restored on
`claude/s739-piles2` (`9b58f0f9`). The shared module adds `LiveRuns` and a kept-key fix.

**Land 4, #3884** (`claude/s739-piles2`, `waveA` head `2e1a1ada`, `waveB` head `24b34c77`, as one PR off `main`,
`d-one-land-for-piles2-and-waves-s739`): `waveB`'s 6 records (Riverside City 33230, San Diego College of Continuing
Education 38411, Yuba 37946, Evergreen Valley 40353, Mt. San Antonio 41116, Skyline 30882; five pass), 15 named gaps
with no record, 2 relists, its 1-row plan (Riverside City 33230 `ge_units_not_read`; the id repeats `piles`' Shasta
plan, the files do not), dispatched 11:12Z; `waveA`'s 8 records (De Anza 41327 and 31504; Las Positas 18813 and 36449;
Cuesta 21050 and 43053; Grossmont 32879; Bakersfield 09968; six pass), 8 named gaps with no record, 11 relists, which
must take `main` and regenerate its Commons files first. Applied and merged: migrate 45795171251 (s739i, 11), 45795874952 (s739j, 4), 45807976291 (the 41373 rollback, 1), 45807245565 (s739k, 5), 45807528712 (s739m, 5), 45807753854 (s739n, 7) and 45808312036 (`waveB`'s Riverside City 33230, 1), none skipped; one land branch, `claude/s739-land4`, took `main` and the three branches (the four generated Commons files rebuilt; `tests/program_requirements_reconcile_test.py`'s `pdf_pages` list and one `js-tests.yml` step list kept both sides). CI's lints 2 failed once on `6eb3af84`: `tests/program_piles_s739_orangecoast_test.py` rebuilt the 41373 pre-read through a local Postgres the runner lacks, so it now reads the committed file; green on `9ef4ebf3` (run 45813769463); merged `91a3a856` at 12:02Z, confirmed on `origin/main`.

**Pending at the checkpoint's write.** The display build carrying S739's records (gate Glendale) and a census on `main`
wait for the next session; the closing census: run 45816008322 on `main` (12:06Z, `0b399a72`): 15,610 of 20,282 pass, 4,082 have no passing record (93 fewer than the 01:19Z census), 590 are collected with a named gap (61 more).

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's), by the lane's NEXT:
   - The display build carrying S739's records, gate college Glendale, then `harvest-gap-census.yml` on `main`
     (NEXT (2)).
   - The units within-range kind, a twin of `hours_within_printed_range`, with a self-recall, for Gavilan 08460, 19378,
     38787 and 41394, Orange Coast 41373, Shasta 32162 and College of the Canyons 36793
     (`d-within-range-sums-hold-for-units-kind-s739`).
   - Reader and scorer changes found tonight, each on a second reader: El Camino 19861, 19866, 38948 and 43993 (the
     Acalog road never reads `site_pages`); Cuyamaca 18634 to 18636 (the capture window opens below the page title) and
     18637 (`page_is_own` compares "Science" with "Sciences"); Modesto 35127 (two learner paths, no kind); Cosumnes
     River 33542 (`OPTION_PART` misses "OPTION II"); Coastline 43057 (the title rule binds legacy 33014); Reedley 30465
     (rule A); Los Angeles Pierce 19181 (number runs); Grossmont 21402; Cuesta 43053 and 41744 (paired halves as
     alternatives); Copper Mountain 41085 (the registry names a 404; the reissued catalog is
     `https://www.cmccd.edu/wp-content/uploads/2026/11/Final-26-27-Catalog-11.18.26r1.pdf`).
   - Long fresh captures: San Diego City 22367 (91 minutes) and Santa Ana 12242 (two hours).
   - Rereads from lane 2: American River 39731, 39732; Shasta 18625; Santa Barbara City 30746, 43553; Los Angeles
     Trade-Technical 45285, 31280; Long Beach City 37213; Santa Monica 03281; Los Angeles City 32832; Gavilan 45357;
     Ventura 06948, 08253, 35654, 37415, 44994, 44995. An alias and a free reconcile: Shasta 18655, Los Angeles
     Trade-Technical 31089 and 41150. A reload: Cerritos 44984.
   - Lane 2's next college, Cabrillo 13, then S720's rest (Fullerton 7, City College of San Francisco 9, Santa Monica 3,
     College of the Sequoias 2, East Los Angeles 6, Glendale 1, Contra Costa 6, El Camino 8).
   - The follow-up PR, after the waves (NEXT (6)): the Porterville 06773 guard first, S731's four
     (`f-continued-heading-list-b-joins-s731`, `f-waiver-shape-misses-six-s731`, `f-green-read-files-only-preview-s731`,
     `f-follow-up-minors-s731`), El Camino 02487's stale pass by its committed `was` step
     (`f-elcamino-02487-stale-pass-s739`), Shasta 30580 beside 43618 (`f-shasta-30580-shares-43618-list-s739`), the four
     new named-gap labels `catalog_list_differs`, `certificate_names_the_major`, `list_printed_as_number_run` and
     `catalog_renumbered` (`f-four-new-named-gap-labels-s739`), and the heading-apart fix's Palomar-shaped guard
     (`f-heading-apart-both-awards-s739`, fixed in `piles`; confirm it landed).
   - Step 11: the outline queue is empty until a census, a capture or a verdict row changes (NEXT (1)).
2. **A plain session's, each by its lane's NEXT.** They wait because conductor runs stay on collection (Sam's routine
   prompt of 2026-11-17: *"No new UI, tooling or governance work in conductor runs."*): `common-subjects-reference`
   and `commons` (Sam's plain sessions hold them; the common-subjects-reference lane's NEXT: load COBIx's titles into
   the Subjects titles, rescore the stray codes' local subjects with the title leading, then the dry-run re-mint for
   Sam, `r-no-mid-on-a-stray-code-sam-2026-11-25`); `implementation-funding` (27,661 bytes against 20,000: compact the
   lane first, then its NEXT); `cer-procedures` (21,633 bytes: compact first); `my-college-action-page` (read the live
   count after the rebuild; the display build and apply after #3424); `nc-learning-partners` (NEXT (1): list Adult
   Education CPL Starting Points on the Public Library once its check passes, after #3864); `repo-size`;
   `governance-team-enablement`, `library`, `sierra-page-redesign` and `common-cr-reference`, each by its lane's NEXT;
   and the brief's slimming items (`d-slimming-left-to-plain-session-s720`). None was worked tonight.

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| Porterville 06773: under `POOLED_S731` a Porterville reconcile keeps its gap but files the fresh arithmetic (18 equal to 18), so the census and the tab would count it passing; keep the filed arithmetic for a `GAP_HELD` record (`kb/_program_requirements_college.py`, about line 7884), with a test that 06773 still fails (`f-porterville-06773-flips-on-reconcile-s731`); no Porterville reconcile before it | Sky, the follow-up | 2026-11-25 (S731) |
| The units within-range kind: Gavilan 08460, 19378, 38787, 41394, Orange Coast 41373 and Shasta 32162, College of the Canyons 36793 hold, their sums inside the printed range (`d-within-range-sums-hold-for-units-kind-s739`) | Sky, a kind with a self-recall and a second reader | 2026-11-26 (S739) |
| El Camino 19861, 19866, 38948, 43993 (the Acalog road never reads `site_pages`); Cuyamaca 18634 to 18636 (the capture window opens below the page title), 18637 (`page_is_own` compares "Science" with "Sciences"); Modesto 35127 (two learner paths, no gap kind fits) | Sky, a reader or scorer change | 2026-11-24 (S721), S739 |
| Cosumnes River 33542 (`OPTION_PART` misses "OPTION II"); Coastline 43057 (the title rule binds legacy 33014 on its page); Reedley 30465 (rule A); Los Angeles Pierce 19181 (number runs); Grossmont 21402; Cuesta 43053 and 41744 (paired halves as alternatives) | Sky, a reader change | 2026-11-26 (S739) |
| Copper Mountain 41085: the registry names a 404; the reissued catalog is `https://www.cmccd.edu/wp-content/uploads/2026/11/Final-26-27-Catalog-11.18.26r1.pdf` | Sky, the registry and a read | 2026-11-26 (S739) |
| San Diego City 22367 (a 91-minute fresh capture) and Santa Ana 12242 (two hours) | Sky, a fresh capture with room | 2026-11-26 (S739) |
| Held in lane 2 for a reread: American River 39731, 39732; Shasta 18625; Santa Barbara City 30746, 43553; Los Angeles Trade-Technical 45285, 31280; Long Beach City 37213; Santa Monica 03281; Los Angeles City 32832; Gavilan 45357; Ventura 06948, 08253, 35654, 37415, 44994, 44995 (each reason in its plan's receipt) | Sky, lane 2 | 2026-11-26 (S739) |
| An alias and a free reconcile: Shasta 18655, Los Angeles Trade-Technical 31089, 41150; a reload: Cerritos 44984 | Sky, lane 2 | 2026-11-26 (S739) |
| Tonight's other holds by key, each reason in its plan's receipt: Los Angeles Trade-Technical (the rest of s739e's 11), Long Beach City 43021 and 42970, Orange Coast 14 (41373 among them) and 08626 (the wrong page), Cosumnes River 5 (s739i), Gavilan 08464, Ventura 10 (six for a reread), Glendale 44488 (its invented check fails; the college's call), Los Angeles Mission 44849 (named, no record) | Sky, lane 2 | 2026-11-26 (S739) |
| The four new named-gap labels `catalog_list_differs`, `certificate_names_the_major`, `list_printed_as_number_run`, `catalog_renumbered` sit in inert `named_gaps_s739.json` files; no census or `kb/_program_named_gaps.py` match reads them without a recall test (`f-four-new-named-gap-labels-s739`) | Sky, the follow-up | 2026-11-26 (S739) |
| El Camino 02487: its filed `score` reads pass (27-28) while the scorer gives fail (51-62 against 60), so the Commons counts a pass the scorer rejects; its committed `was` step fixes it at the next reconcile (`f-elcamino-02487-stale-pass-s739`) | Sky, the follow-up | 2026-11-26 (S739) |
| Shasta 30580 holds the same list as 43618 from one "Communication Studies 2.0" section and looks mis-filed (`f-shasta-30580-shares-43618-list-s739`) | Sky, the follow-up | 2026-11-26 (S739) |
| Saddleback's `repeat` window: the steps' `[\s\S]{0,200}?` window can bind a code the words do not name; put `units:?\s*2(?:\.0+)?\s*` before the code, drop the second step and rerun the recall (`f-saddleback-repeat-window-s731`) | Sky, before Saddleback's next read | 2026-11-25 (S731) |
| West Valley 35588: its extraction overran the model's output limit even in two parts | Sky, lane 1 (a reader or capture change) | 2026-11-25 (S727), S731 |
| Southwestern 32693, 36634 and Pasadena City 31599: rule A refuses each page's heading (a title with no award word) | Sky, a reader change and a second reader | 2026-11-25 (S727), S731 |
| The eLumen follow-up's rest: Antelope Valley 16468 keeps its sister-page record (its own page adds to 59 to 61 against a stated 60); 02139 and 20148 read unequal, collected with no gap; Mission's 8 binds move at its next capture | Sky, lane 1 | 2026-11-25 (S727), S731 |
| "LIST A" then "LIST B CONTINUED" still joins, and GE and list-size sentences fire the new pooled phrasings (`f-continued-heading-list-b-joins-s731`) | Sky, the follow-up | 2026-11-25 (S731) |
| The waiver shape misses six: Saddleback 42644, 19551, 22933; Orange Coast 42331; Madera 39862; Reedley 18957 (`f-waiver-shape-misses-six-s731`) | Sky, the follow-up | 2026-11-25 (S731) |
| A read whose price step holds a partial capture skips extraction and still ends green (`f-green-read-files-only-preview-s731`) | Sky, the follow-up | 2026-11-25 (S731) |
| Minors: the pile SQL guards abort through a `::int` cast error; `js-tests.yml`'s Long Beach City step comment says 10 named gaps and 3 held where the receipt says 9 and 4 (`f-follow-up-minors-s731`); 18144's live run rests on s739b's hard-coded file history; a mutated held row passes its test silently; the common pile test misses an edited after-image or md5 in the apply SQL; a vacuous check in the persons test | Sky, the follow-up | 2026-11-25 (S731), S739 |
| Santa Barbara City 05934: on S714's hold until `find_codes` reads a slash cross-listing's first code (0 of 97 found) | Sky, the follow-up (a capture fix) | 2026-11-23 (S714), S727 |
| `noted_total_cut_off` fires on 664 failing records statewide: a self-recall before it files beyond 20130 | Sky, the follow-up | 2026-11-25 (S727) |
| The census ignores a college's own named-gap files (14 programs relisted; S739's waves relisted 13 more) (`f-census-ignores-college-named-gaps-s727`) | Sky, the follow-up | 2026-11-25 (S727), S739 |
| S721's holds by key, each reason in its plan's receipt: Porterville 4 (09528, 35229, 35449, 45511); Butte 3 (01312, 14583, 33579); Orange Coast 08670 (`degree_total_minimum`) and 32737's substitution list | Sky, lane 2 | 2026-11-24 (S721) |
| MiraCosta 36144 and 36171 (`text_window_cut`: their section prints past the capture's 16,000 characters) | Sky, a wider text window | 2026-11-24 (S721) |
| The follow-up's minors: a kept `degree_within_map_range` is not checked against `within_map`; a certificate's heading check accepts a plural department heading; #3764's `live_flips` reads the filed arithmetic for rescored rows, and "List A requires 9 units together with its lab" still pools | Sky, the follow-up | 2026-11-24 (S721) |
| S720's holds by key, each reason in its plan's receipt: Fullerton 7, City College of San Francisco 9, Santa Monica 3, College of the Sequoias 2 (06770, 45030), East Los Angeles 6 (33013 among them), Glendale 1 (45068), Cabrillo 13, Contra Costa 6, El Camino 8 | Sky, lane 2 (a person for 33013) | 2026-11-24 (S720) |
| The free rules: City College of San Francisco 17615 to 17618 (own-option reading); Cabrillo 06352, 06380, 06381, 44992 (recommended lists); Fullerton 33680, 42143 and Ventura 30587 (a closed-list rescore); Cerritos 35166 (a pin, the whole-major exception) | Sky, the follow-up | 2026-11-24 (S720) |
| Fullerton: 15 of its 296 passing records are not on their own page | Sky, a page read | 2026-11-24 (S720) |
| East Los Angeles's bound is unmeasured on capture text (41097 likely; 36345, 37924, 43632, 45935 possible) | Sky, a free reconcile before its next text run | 2026-11-23 (S714) |
| The 30-day artifact `course-outcomes-45026998155-part1` holds trial pages that print a staff name: delete it | a person | 2026-11-22 (S703) |
| Records held for a person: Glendale 44488, East Los Angeles 33013 (named at 40 in s739l, still a person's), Clovis 36326 and 39539 (named gaps, applied) | a person | S653 to S739 |
| Santa Rosa Junior 06566 and 32298, held: the second reader found the wrong cause | Sky, a reread or a rule | 2026-11-23 (S713) |
| Las Positas 01037 (passes only by double counting) and 09227; Antelope Valley 39295 | Sky, lane 2 | 2026-11-23 (S713) |
| College of Marin: its program URLs changed form, so the moved-page guard stopped its general education step (19789, 19791) | Sky, a capture or guard fix | 2026-11-23 (S713) |
| The next follow-up's minors (S703 and S713's list, lessons archive 9, *Moved from the lane (S714 checkpoint)*, NEXT (2)), SDCCE's 6 SLO-label rows first | Sky, the next follow-up | 2026-11-22 (S703) |
| COBIx's minors: `f-cobix-minors-s713`; `f-cobix-minors-s714` | COBIx | 2026-11-23 (S713, S714) |
| City College of San Francisco's Cal-GETC dry run (32080, 33652, 46300): the permission check refused it twice | a plain session | 2026-11-21 (S691) |
| Golden West's 476 outline header rows: the guarded correction | a plain session's review | 2026-11-20 (S690) |
| Cerritos 20504: its run also holds 44984, held for a reload | Sky, on 44984 | 2026-11-21 (S697) |
| College of the Desert: its 8 keep their gap and its 23 on the reader-page lever wait (the prior catalog sits behind robots.txt) | the college, or another source | 2026-11-20 (S689) |

Cleared tonight: Folsom Lake 38736, East Los Angeles 38332 and Coastline 40476 (live and passing); El Camino 02513,
02515, 02517 and Modesto 06683, 42664 (live and passing); Sacramento City's reread (30 rows restamped, no verdict moved);
S727's holds applied as named gaps or passing records at American River (5 of 7), Shasta (12 of 15), College of the
Canyons (13 of 14) and Santa Barbara City (3 of 5); S731's at Los Angeles Trade-Technical (6), Saddleback 04073 and
36625, Long Beach City 44848; Clovis 36326 and 39539; Cosumnes River's 11 of its 17; Orange Coast's 3 (41373 rolled
back); Palo Verde 5; Gavilan 5; Ventura 7; and the waves' colleges (waveA's 8 and waveB's 6 live, 23 named gaps with no
record). Los Angeles Southwest, Santiago Canyon, Napa Valley and Cosumnes River's 3 were already named gaps with no
record, relisted by the census.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no reply
since 2026-11-19T23:47Z). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. Sam's words in this session: none. The run acted on his routine prompt of 2026-11-17 (*"Conductor mode is
back for collection only."*; *"Two lanes, never on the same college"*; *"Stop a review after two rounds and send what is
left to Sam or COBIx."*), his collect-with-gaps ruling of the same day (`sam-collect-with-gaps-2026-11-17`) and his work
order of 2026-11-20.

## Decisions (the conductor's, each reversible)

- `d-free-page-read-workflow-in-lift-s739`: `pooled`'s free, branch-only page reads through `college-page-read.yml` sit
  inside the lift's words, though the lift did not name that workflow.
- `d-land-applied-piles-apart-s739`: the applied plans s739a to s739h landed from `claude/s739-piles-land`, cut at the
  last apply's `.apply` restore and brought up to `main` by a worker that wrote no data, while `piles` kept writing.
- `d-within-range-sums-hold-for-units-kind-s739`: a units sum inside the printed range files no `noted_figures_differ`
  gap (S703's `d-lists-gap-holds-range-sums-s703`, extended to units); Gavilan 08460, 19378, 38787 and 41394 left s739m
  (rebuilt at 5 rows), Orange Coast 41373 rolled back, and all five hold for a units twin of `hours_within_printed_range`
  with Shasta 32162 and College of the Canyons 36793.
- `d-one-land-for-piles2-and-waves-s739`: `piles2`, `waveA` and `waveB` land as one PR off `main` once the applies
  finish, as S731's #3830 did.
- `d-display-merged-without-main-update-s731`, used again: #3880 merged without a final update from `main`.

Memory rows: `kb/migrations/2026-11-26_s739_cpl_memory_rows.sql` (12 rows, all proposed, INSERT-only with `ON CONFLICT DO
NOTHING`, rollback in its header), applied by the conductor through `supabase-migrate.yml` (run 45810901357 at 11:29Z; 12 rows, all
proposed; `.apply` restored). DECIDED lines: the harvest lane.

## Patterns that worked

- **One combined land for applied branches** (`d-one-land-for-piles2-and-waves-s739`), and **a land branch cut apart
  from a working branch** (`d-land-applied-piles-apart-s739`): `piles` kept writing while the applied plans merged.
- **The apply script that waits for each receipt:** the three s739e to s739g applies and the four s739k to the
  rollback ran in order, each after the last one's receipt, with a retry on the shared clone's `shallow.lock`.
- **The migrate workflow takes one pending slot:** one apply in flight, `.apply` restored to `main`'s value after each.
- A second reader on every plan and land (Sonnet; the shared module in scope each time); a clean md5 pre-read before
  every apply; a free page read before any paid one; a paid read with `only=`.
- A worker told to start its branch at a fetched `main` by sha when the clone's ref is stale.

## Findings

- `p-shared-clone-origin-main-stale-s739`: the shared clone's `origin/main` was days stale (S719's `56c38abf`), so the
  harness made each worker's worktree there; fetch `main` by name and tell every worker its start sha.
- `p-new-ci-step-docs-only-skip-needs-list-s739`: a new test step with the docs-only skip needs a line in
  `tests/lints_docs_only_skip.json` (lints 2 and 6 failed #3882 and #3883).
- `p-older-pile-tests-pin-runs-later-plans-move-s739`: an older plan's test that pins posted runs fails when a later
  plan posts on top of it (`tests/program_piles_s727_canyons_test.py`, `..._shasta_test.py`; each now takes `skip=`).
- `f-elcamino-02487-stale-pass-s739`: a pass the scorer rejects, on `main`.
- `f-shasta-30580-shares-43618-list-s739`: a record that looks mis-filed.
- `f-heading-apart-both-awards-s739`: the shared `_heading_apart` let both same-title sisters claim `own_heading` when
  the heading names both awards (Palomar's "A.A. Degree Major or Certificate of Achievement": 27 of 348
  identical-heading sister pairs); no row tonight hit it; fixed in `piles` with a Palomar-shaped guard.
- `f-four-new-named-gap-labels-s739`: four labels no matcher reads.
- This container's git prints `+00:00` where `main` sometimes holds `Z`, so a hand edit crept in twice; read a date
  field's form on `main` before a hand edit.

## Safety patterns to honor

All of handoff 732's: a plan's test true before and after its own apply and beside any PR it does not depend on, and
accepting either state of a record another open branch moves; a record a cheaper lever passes stays on that lever; one
dispatch at a time per branch; a fresh worker per branch; one writer of `.apply` per branch, the conductor, and a worker
pulls before it commits once the conductor has touched its branch; `on_live_run`, the own-page guard and `scorer_passes`
on every plan; a reconcile keeps only the records it was for; an insert's rollback is proved against a verdict on the
inserted row; the conductor reads a branch's head with `git ls-remote` before it dispatches a read there; a kind
switched off after a failed self-recall files nothing; no Porterville reconcile runs before the `GAP_HELD` arithmetic
guard. New tonight: the heading-apart guard tells same-title sisters apart only where the awards differ and the heading
names this record's award; a kept key proves only a run at least the reread's, so the apply's run guard decides; a
rollback goes from its plan's receipt to the before-checks, with its committed record file put back to `main`'s copy;
`.apply` goes back to `main`'s value after every apply, so no merge carries a live trigger. Never file a person's name
from an outline page anywhere. A permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Back for collection only*; review rounds as his ruling of 2026-11-20 sets them). Settings block (Sam, 2026-11-11, his
latest change; the block copied from `docs/reference/conductor_mode.md`):

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx; the routine's form sets the model and ultracode;
  medium effort lives in its prompt. Tonight Opus 5.5 served the run (the form names Fable 5.2).
- Ultracode on. The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`); tonight `lever`, `pooled`, `piles`, `piles2`, `waveA`
  and `waveB` ran Fable 5.2 at high effort, and the readers ran Sonnet.
- A worker building anything that writes shared data or changes an apply runs at **high** effort.
- A review workflow uses **at most 9 agents in all**, readers and second readers together.
- **Cost limits:** $40 per college per run, on the estimate, for program-requirements extraction, and a separate $40 per
  college for SLOs, PLOs and course objectives; per run, never a remaining pot. Paid runs go through the conductor.

Also: two lanes, never on one college; about $750 a day for everything, $10k running total for the whole job; stop
rules from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row;
a rollback that undoes over 1% of a day's rows; the $10k checkpoint. S736 and S737 ran unmetered earlier on this UTC day
(01:13Z to 05:15Z), so this run aimed at about $350 and planned no new worker after about $275.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3879 (`claude/awesome-fermat-fluaqu`) | the declaration and this checkpoint | merges at sign-off |
| #3880 (`claude/s739-display`) | merged `075d1ee8` (06:50Z); display build `3a699eddc8c9` live | none |
| #3881 (`lever`'s branch) | merged `48966ffa` (08:24Z): the lever's land; s739l applied | none |
| #3882 (`pooled`'s branch) | merged `1caef64a` (09:15Z): El Camino and Modesto, live | none |
| #3883 (`claude/s739-piles-land`) | merged `2e4ccabb` (10:27Z): s739a to s739h, applied and live | none |
| `claude/s739-piles`, `claude/s739-piles2` | s739i, s739j (less 41373), s739k, s739m, s739n applied; 41373's rollback applied | land in #3884 |
| `waveA`'s and `waveB`'s branches | waveA head `2e1a1ada`, waveB head `24b34c77`; waveB's plan dispatched 11:12Z | land in #3884 |
| #3884, land 4 | piles2, waveA and waveB as one PR off `main` | merged `91a3a856` (12:02Z) |
| Harvest gap census on `main` | 45733846878 (01:19Z): 15,577 pass, 4,176 without, 529 with a named gap; after the display build 45771011713 (06:55Z): 15,578 pass, 4,175 without | the closing census: run 45816008322 on `main` (12:06Z, `0b399a72`): 15,610 of 20,282 pass, 4,082 have no passing record (93 fewer than the 01:19Z census), 590 are collected with a named gap (61 more) |
| #3383 | dependabot's | waits |

## Let go

No PR subscription, scheduled check-in, artifact watch or COBIx watcher was opened tonight, so there is none to drop.
Workers end with the session; each branch is pushed. The vault note for this run is
`CPLBrain/07-session-notes/2026-11-26-s739-skyoystercatcher-collection.md`, on the vault's branch
`claude/pensive-archimedes-fluaqu` (`1a9514e8`), draft PR samueltlee/CPLBrain#872. The checkpoint worker could not write the vault from its isolated worktree, so the conductor placed the note and pushed it.

Spend: $272.54 estimate (Opus 5.5 $32.04, Fable 5.2 $215.44, Sonnet $23.95, Haiku $1.12); collection $272.54; 2026-11-26T06:12Z to 2026-11-26T12:20Z.

(A token-count estimate at list prices, measured from the transcripts at 12:09Z, with Fable 5.2 priced at the Opus 5.5 rate since the meter's table names no Fable rate; the sign-off turns after 12:09Z are not in it. The paid reads' own cost, about $1.23 on their meter, is apart.)

Opening line: *Greetings, you are SkySkimmer (the next free session number at your start; Sam's plain sessions hold 738, and SkyTurnstone's handoff is 739), see SkyOystercatcher's (S739) handoff — `docs/session_740_handoff.md` — let's keep rolling with our queue.*

Conductor model: Opus 5.5 (the form names Fable 5.2); session cost about $272.54 (a token-count estimate; get_session is not available here); 99 records collected and live, plus 30 named gaps for programs with no record; 0 outline rows added; 5 substantive PRs merged (#3880, #3881, #3882, #3883, #3884), not counting checkpoints.
