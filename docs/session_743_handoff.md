---
title: "Session 743 handoff (from SkyGodwit, S742, the CPL Queue routine's collection run of 2026-11-27, from 12:12Z)"
created: 2026-11-27
updated: 2026-11-27
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_747_handoff.md
---

**Conductor model: Opus 5.5 (claude-opus-5-5), as this run's header reports; the routine's form names Fable 5.2.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (738, S737 SkyWhimbrel's, naming SkyTurnstone for Session 738), never this file.
**Numbering.** S741 (SkyWillet) wrote 742 and named SkyGodwit for the routine's next session, to take the next free
number: this run is S742 and writes 743. 739 stays SkyTurnstone's (Sam's next plain session).

*(Declaration, written at 12:21Z before any worker started.)*

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (Thu Nov 26, 6:50 PM PT, at this writing), and comment
   7064588752 (Sam's two rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*
   (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Workers share one shallow clone, so fetch a branch by name with `--shallow-since` or `--deepen`,
   never `--depth` (`p-shared-shallow-clone-reshallows-s713`); a new branch gets a fresh worker. A worker's push counts
   once `git ls-remote` shows its head (`p-worker-push-proved-by-ls-remote-s731`). Fetch `main` by name first
   (`p-shared-clone-origin-main-stale-s739`).
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at sign-off:** #3904 (`1a3e3be8`, the display build `5b80d4de75e9`) has merged; the land #3905 (merged
   `1c12d1a7`, confirmed on `origin/main`) carries `keys`, `readers`, `piles` and the sibling branches; this checkpoint, #3903,
   merges after it, with one update from `main` right before its merge. Open PRs at sign-off: #3903, the land, and
   dependabot's #3383, which waits. The vault note's draft PR on `samueltlee/CPLBrain` merges on its own (Sam's ruling of
   2026-11-21).

## The start (12:12Z firing, 2026-11-27)

- Brief: COBIx's on #3358 (comment 6894464154, Thu Nov 26, written 6:50 PM PT, `main` at `b896d6f4`), the same brief
  S741 worked from; the newest other comment is still 7064588752 (Sam's two rulings of 2026-11-21). Handoff 742 (S741)
  is the newest; its checkpoint #3897 merged at 11:45Z (`ee42134e`). On `main` since: the closing census 45986575262
  (`c9c7cb0c`, 11:03Z) and #3897.
- One writer: no `list_sessions`, `get_trigger` or `get_session` here. Open PRs at 12:16Z: dependabot's #3383 alone.
- Step 0: not the night's first firing (S741 dispatched `daily-dashboard.yml` at 06:15Z).
- No pause line (handoffs 742 and 741). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter). No `set_session_tags` here.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-26: none. Rule 8's memory read: no row
  since S741's nine. Steps 6 to 10: held in a conductor run, as S727 to S741 held them (two Library requests wait).
  Step 11: the outline queue is empty until a census, a capture or a verdict row changes.
- Census on `main` (45986575262, 11:03Z): of 20,282 active programs, 15,669 pass and 3,950 have no passing record; 663
  are collected with a named gap.
- **Spend aim:** about $250 for this run, no new worker after about $190. The UTC day holds S741's $255, so the day stays
  under about $750 with room for Sam's plain session.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S741's records on
    `claude/s742-display`, built on `ee42134e` with Python 3.12, gate college Glendale, then the whole build, then
    `harvest-gap-census.yml` on `main`.
  - `keys` (Fable 5.2, high effort): Cosumnes River first (`claude/s741-keys-crc`, `49e6c644`: either-state edits to
    the two S739 tests, then the reread force 45972311864 for 33542); then the holds by key, each collected with its gap
    named where the gap is true: San Bernardino Valley 17829 (the S741 keep-better ranking may admit its reconcile),
    04873, 04894, 39483; San Jose City 18449, 38499; Cuesta 43053, 41744 (`pair_read_as_alternatives` for AVMT 110 and
    120); San Diego City 38732, 22352. Colleges: Cosumnes River, San Bernardino Valley, San Jose City, Cuesta, San Diego
    City.
  - `readers` (Fable 5.2, high effort): Cuyamaca 18637 (a Fable second reader of `claude/s741-keys-wordtest`,
    `302c12c5`, then a paid read `only=18637`); then the reader and scorer changes, each with a self-recall and a second
    reader before any dispatch on it: El Camino 19861, 19866, 38948, 43993 and 19883's `site_pages` pin (the Acalog road
    never reads `site_pages`), with 19857; Coastline 43057 (the title rule binds legacy 33014); Modesto 35127; Reedley
    30465 (rule A); Los Angeles Pierce 19181 (number runs); Grossmont 21402. Colleges: Cuyamaca, El Camino, Coastline,
    Modesto, Reedley, Los Angeles Pierce, Grossmont.
- **Lane 2 (cheap piles, one worker, high effort):** `piles` (Fable 5.2): the pins awaiting a free capture (Butte 14583,
  Orange Coast 08663 and 08626); S740's remaining holds by key, each collected with its gap named where the gap is true
  (Long Beach City 37213; Butte 01312; Santa Monica 21026, 43767; Gavilan 08464, 45357; Cabrillo 11293, 45306, 06352,
  06380, 06381, 44992; Contra Costa 33660; Los Angeles Trade-Technical 31280, 45285; Santa Barbara City 30746, 43553,
  32775; Fullerton 33680, 42143); East Los Angeles 02456, 35088, 35888, 37510 (keep-better said no dispatch in S741);
  then S720's and S721's rest (Fullerton 7, City College of San Francisco 9, College of the Sequoias 2, East Los Angeles
  6, Butte's and Orange Coast's others); discontinued flags, units rules and retired courses over its colleges. At its
  land, the Spend line's builders and the Commons page counts are rebuilt. Colleges: Butte, Orange Coast, Long Beach
  City, Santa Monica, Gavilan, Cabrillo, Contra Costa, Los Angeles Trade-Technical, Santa Barbara City, Fullerton, East
  Los Angeles, City College of San Francisco, College of the Sequoias.
- **Not tonight:** Porterville (the follow-up's 06773 guard first); Saddleback (its `repeat` window first); West Valley
  35588, Southwestern and Pasadena City (reader changes); Antelope Valley and Mission (the eLumen follow-up's rest);
  College of the Desert (robots.txt); Los Medanos (parked); Solano 43134 (a person's); Glendale 44488 (the college's
  call) and 45068; City College of San Francisco's Cal-GETC dry run (a plain session's); the follow-up PR, after the
  waves if the run has room.

## Split changes during the run

- 12:16Z: one writer confirmed (open PRs: #3383 alone; `main` unmoved since #3897).
- 12:21Z: the declaration pushed (`0f3101e8`), draft #3903.
- 12:25Z: display build `5b80d4de75e9` pushed on `claude/s742-display` (`2ec94a69`, built on `ee42134e` with Python 3.12;
  `tests/roep_display_test.py` and `check_generated.sh` clean); the Glendale gate dispatched.
- 12:27Z: `keys`, `readers` and `piles` started on Fable 5.2 at high effort, each in the harness's own worktree off
  `ee42134e`, told to open no PR (the conductor opens the land), to dispatch only free runs on their own branch, and to
  leave paid runs, rereads, loads, `.apply` and every Supabase call to the conductor.
- 12:29Z: the Glendale gate 45998506887 green at 12:28Z: 242 Glendale rows at `5b80d4de75e9`, nothing else moved (live:
  18,504 at `a143061a2ae2`, 16 at `0874a3a15f22`, 15 Glendale rows at `bef8ef819af7`, 1 at `4c57fd250cce`, 1 with no
  display; 18,779 rows). The whole build dispatched on the branch.
- 12:36Z: the whole build 45998968540 green at 12:35Z: 18,747 rows at `5b80d4de75e9` (the 1 with no display now carries
  one), the same 32 at older builds, none without a display. #3904 opened from `claude/s742-display` and marked ready.
- 12:46Z: `readers` stop 1 (head `bb59eaed`): the plural fold for Cuyamaca 18637 (`e3291376`, a cherry-pick of S741's
  parked `302c12c5`; recall on today's `main`: 44 answers move at 24 colleges, right 44, wrong 0) and the Acalog road
  reading `site_pages` pins for El Camino (`1f591e73`; 105 own pages, right 98 before and after, wrong 0 from 3).
  The conductor's live read at the seven `readers` colleges (12:46Z) filed whole on the branch (`b7bf3c7b`), checked
  against the live table by a per-college md5 of control_number:run (seven equal); no person's check at any of them.
- 12:50Z: both changes to one Fable 5.2 second reader from a detached worktree at `b7bf3c7b`; `readers` carries on with
  Coastline, Modesto, Reedley, Los Angeles Pierce and Grossmont.
- 12:59Z: #3904 merged (`1a3e3be8`, confirmed on `origin/main`; `test` green on `583600f4`, `main` unmoved since its
  base). 13:00Z: the census dispatched on `main`.
- 13:01Z: the readers' second reader (Fable 5.2): `1f591e73` (the Acalog road) GO, with a MINOR host check for
  `ac_pin_in_catalog` and a NIT for the follow-up; `e3291376` (the plural fold) FIX THEN GO (MAJOR: its recall cannot
  report a wrong, since page match and coverage both hold by construction; MAJOR: the fold lets an award phrase or a
  longer sibling title name the program: across 3,343,033 sibling pairs it admits 386 more, 296 of them "Art" on "Studio
  Arts" or an "Associate in Arts" page). One finding list to `readers`; round 2 is the fold's last.
- 13:01Z: Cuyamaca 18637's paid read dispatched on a sibling, `claude/s742-readers-cuy`, cut at `main` `1a3e3be8`
  (only 18637, sources_from 45966682528, about $0.25); its keep-better waits for the fold's round 2.
- 13:04Z: the census after the display build, 46003215768 on `main` (`3502e99c`): 15,669 of 20,282 pass, 3,950 have no
  passing record, 663 collected with a named gap (unchanged, as a display build moves no record).
- 13:08Z: `keys` stop 1 (head `599eedf8`): Cosumnes River's parked filing on the branch with the two S739 tests reading
  either state (the hand-filed PDF's sha256 is unchanged: the capture opens the Marketing window one page earlier);
  plan s742k1 (Cuesta 43053, 41744, `pair_read_as_alternatives`); San Diego City 22352 and 38732 noted as having no entry
  in the capture's 228 (both Teachout Only; no write). The conductor's live read at keys' five colleges (13:08Z) checked
  by the per-college md5 (four equal), handed to `keys` to commit. Two free page reads (San Jose City's JOURN 138 and CGID
  lines, Cuesta's AVMT entries) GO on `keys`' branch.
- 13:10Z: s742k1 to a Sonnet plan reader from a detached worktree at `418596af`.
- 13:13Z: s742k1's reader (Sonnet): APPLY (the guard and rollback match S741k1's shape; the receipt's images equal the
  SQL; MINOR: no page text is committed for either program, so the gap rests on the reader's notes, which agree with the
  figures; NIT: the branch carries other plans). Clean md5 pre-read 2 of 2. Applies go on a branch of their own,
  `claude/s742-apply`, cut at the worker's reviewed head, so a worker's branch stays free for its pushes.
- 13:15Z: s742k1's migrate 46005400935 returned 2, none skipped; `.apply` restored on `claude/s742-apply` (`6df6937c`).
  Records collected: 2.
- 13:22Z: `keys` stop 2 (head `f1cd19e7`): keep-better on the 13:08Z read: Cosumnes River's reconcile 45972311864 re-read
  8, kept 3 (33542 passes 19 of 19; 31055 and 38017 equal), restored 5 filed passes; San Bernardino Valley's free
  reconcile 46000859685 re-read 5, kept 1 (17829, incomplete with its major equal, over the filed unequal: S741's
  ranking), restored 4. Plan s742k2 (San Bernardino Valley 04873 and 39483, `lists_not_closed`, the two S741 held as no
  kind true) to a Sonnet plan reader. Held: 04894 (its scorer change moves 9 fail to pass and 22 pass to fail over
  18,970 records: not proposed).
- 13:24Z: no person's check at either college (live read 13:23Z); the rereads dispatched on `claude/s742-keys`, each in
  its own college's concurrency group: Cosumnes River force 45972311864, San Bernardino Valley force 46000859685.
- 13:28Z: both rereads posted. Live at 13:28Z: Cosumnes River 33542 passing at 45972311864 (from its named gap
  `option_lists_read_apart`: an upgrade, not a new record), 31055 and 38017 as kept; San Bernardino Valley 17829 at
  46000859685, incomplete, for plan s742k3.
- 13:29Z: s742k2's reader (Sonnet): APPLY (both gaps true of their pages: 04873's lists print "Two courses" over one and
  "Four courses" over two with no unit figure; 39483's List A prints "One to two courses" with no figure, so its lists run
  23 to 31 against 27-30; S741's hold wanted a kind naming the shape, and the sentence needs none; the guard run against
  a scratch Postgres aborts on a wrong run, a changed record, a confirm and a missing row). Clean md5 pre-read 2 of 2.
- 13:30Z: `readers` stop 2 (head `918f6b6d`): the fold's round 2 (`a0226f16`: wrong joins over 3,343,033 sibling pairs
  fold alone 2, both own pages); the Acalog MINOR and NIT fixed (`d2f211f9`); El Camino's free capture 46003498776 bound
  all five pins at coverage 1.0 (263 of 263 pages); Coastline 43057's pin and plural heading (`918f6b6d`). 19857 held:
  the preview hands it the A.S. page on a tie (Acalog's title label reads "Certificate" on every page).
- 13:31Z: El Camino's paid read dispatched on `claude/s742-readers-ec`, cut at `d2f211f9` (only 19861, 19866, 38948,
  43993, 19883; sources_from 46003498776; about $0.50). The fold's round 2, the Acalog fix and Coastline's change to the
  Fable reader's second round. Cuyamaca 18637's paid read filed as run 46003456131 on `claude/s742-readers-cuy`.
- 13:32Z: s742k2's migrate 46007691479 returned 2, none skipped; `.apply` restored (`25591739`). Records collected: 4.
- 13:34Z: `keys` stop 3 (head `276ddcd4`): plan s742k3 (San Bernardino Valley 17829, `ge_units_not_read`, the named-gaps
  module's wave pass after reread 46006706537 posted the row; self-recall 1,701 right, 0 wrong). Its Sonnet reader:
  APPLY (NIT: the rule reads the stored score, not the record). Clean md5 pre-read 1 of 1.
- 13:37Z: s742k3's migrate 46008643446 returned 1, none skipped; `.apply` restored (`0f322a8d`). Records collected: 5.
- 13:37Z: the Fable reader's round 2: the fold `a0226f16` GO (all 386 sibling admits refuse; the fold alone admits 2,
  both own pages), the Acalog fix `d2f211f9` GO, Coastline 43057's pin and plural heading `918f6b6d` GO (nothing outside
  Coastline moves). El Camino's paid read filed as run 46007782666 on `claude/s742-readers-ec` (`6e5c8ef6`).
- 13:43Z: `piles` stop 1 (head `ab7346d6`): plan s742a (Santa Monica 21026 `total_differs`, Butte 01312
  `degree_electives_not_printed`, Cabrillo 45306 and Gavilan 08464 `lists_not_closed`; a new batch plan module
  `kb/_program_piles_s742.py`); keep-better's `plan_code_own` (a generic heading printing the program's own Academic Plan
  code counts as its own page; recall over 92 such headings, wrong 0), which would let East Los Angeles's ten keep; the
  Butte capture 45999110725 running and Orange Coast's pending; sibling branches for Fullerton, Santa Barbara City and
  Cabrillo's free reconciles (GO). The conductor's live read (13:44Z) in the compact form, all six whole colleges' md5s
  equal; one person's check among the 13 colleges (Cabrillo 06326).
- 13:46Z: `keys` ended (its run's limit) with San Jose City 38499 unfinished: one cited renumber (`JOURN138` for the
  state's `JournalismJO`, from the page's own line; self-recall over 83 records: 1 moves, fail to pass, 0 wrong). The
  conductor carries it: a reader, then a free reconcile, keep-better and the reread. Held by `keys`: San Diego City 22352
  and 38732 (no entry in the capture's 228, both Teachout Only; filed as college-named gaps, no write); San Jose City 18449
  (the state's `ComputerGrap` stands for 13 courses under one key); San Bernardino Valley 04894 (its scorer change moves 9
  fail to pass and 22 pass to fail).
- 13:47Z: s742a and San Jose City's pair to one Sonnet reader; `plan_code_own` to a Fable reader.
- 13:52Z: `readers` stop 3 (head `5e9bd74f`): both siblings merged; keep-better on the 12:46Z read kept Cuyamaca 18637 (92 of
  92 from its own page) and El Camino's five; plan s742r1 (Modesto 35127, `units_within_printed_range`) to a Sonnet
  reader. Coastline's free capture running since 13:39Z.
- 13:53Z: the Sonnet reader of s742a and San Jose City's pair: s742a APPLY (its own scratch-Postgres proof of the batch
  guard and rollback; Cabrillo 06326 untouched); the pair GO (the page's own line, run 46008386875; MINOR: keyed by the
  name `JournalismJO`, which 8 control numbers share, one unnamed today). The Fable reader of `plan_code_own`: FIX THEN GO
  (MAJOR: a code beside another program's section passes, East Los Angeles 45986's heading printing 45717's code; fix:
  admit on the code only where coverage passes; MINOR: compare every code token), to `piles` for its last round.
- 13:55Z: no person's check at Cuyamaca, El Camino or San Jose City; md5s equal to keep-better's reads. Dispatched on
  `claude/s742-readers`: Cuyamaca's reread (force 46003456131), El Camino's load, then its reread (force 46007782666); on
  `claude/s742-keys`: San Jose City's free reconcile. Clean md5 pre-read of s742a 4 of 4; its plan files alone taken
  onto `claude/s742-apply` (the two workers' `kb/status/commons_data.json` conflict).
- 13:57Z: s742a's migrate 46011459090 returned 4, none skipped; `.apply` restored (`5d80744d`). Records collected: 9.
- 13:58Z: live: El Camino 19861, 19866, 43993 passing (loaded; records collected: 12); 38948 and 19883 unequal at
  46007782666, for plan s742r2; Cuyamaca 18637 at 46003456131, degree incomplete, for a reconcile step.
- 13:59Z: s742r1's reader (Sonnet): APPLY (the lists add 23 inside the printed "Total 19 - 23"; MINOR: the rollback
  guard does not check the record, which the plan leaves unchanged). Clean md5 pre-read 1 of 1; its plan files taken
  onto `claude/s742-apply`.
- 14:00Z: s742r1's migrate 46011828459 returned 1, none skipped; `.apply` restored (`595f694d`). Records collected: 13.
- 14:03Z: `piles` stop 2 (head `fdfad046`, carrying the 13:44Z read): `plan_code_own` round 2 (all four findings fixed;
  recall 92 headings, wrong 0; on base `f0d84966` and run 45176404274 East Los Angeles's ten keep); Cabrillo's reconcile
  kind `recommended_counts` parked on `claude/s742-piles-cabrillo` (`abc31e19`; over Cabrillo's 269 records it reads
  06352, 06380, 06381 and 44992 alone, all four turn passing). In flight on `piles`' branches: Butte's capture
  45999110725 (pin 14583), Orange Coast's 45999669017 pending, free reconciles at Fullerton 46010143379 and Santa Barbara
  City 46010148668. Step 5 over its colleges: 16 discontinued flags, none new; the units rules move 0 rows.
- 14:03Z: both to the Fable reader (round 2 for `plan_code_own`, its last).
- 14:07Z: Butte 14583's pin binds in free capture 45999110725 (its own page, coverage 1.0; it had been read from the
  Accelerated Track's page); the paid read dispatched on a sibling, `claude/s742-piles-butte`, cut at `711d0407` (only
  14583, about $0.07), so it cannot cancel Orange Coast's capture on `claude/s742-piles`.
- 14:08Z: the Fable reader's round 2: `plan_code_own` GO (the MAJOR refuses; 28 records move, all East Los Angeles);
  Cabrillo's `recommended_counts` FIX THEN GO (MAJOR: its recall builds each page from the record's own lists, so it
  cannot report a wrong page, and Dance 06352 and Exercise and Sports Science 44992 were never read; MAJOR: no arithmetic
  guard; MINOR: keep it per college), to `piles` for its last round. No person's check at East Los Angeles (14:08Z, md5
  equal to the 13:44Z read): its reread dispatched on `claude/s742-piles` (force 45176404274).
- 14:10Z: Butte 14583's paid read 46012628995 filed it from its own page ("AS Degree in Registered Nursing", $0.06);
  keep-better kept 1 (no person's check). Its reread dispatched on `claude/s742-piles-butte` (force 46012628995): the
  program's own record replaces the Accelerated Track's, still failing (the text holds the application prerequisites and
  stops after the second outcome), so `noted_section_cut_off` is the next plan's, not tonight's.
- 14:17Z: East Los Angeles's reread 46013175731 posted the ten at 45176404274 (live at 14:17Z): 37510 turns passing
  (records collected: 14); seven already passed on run 43357061643 and now sit on the committed run
  (`f-ela-committed-passes-live-older-s741` cleared for these ten); 02456 and 31017 unequal. Plan s742b (02456
  `unit_line_not_read`) to a Sonnet reader.
- 14:19Z: s742b's reader (Sonnet): APPLY (45 + 3 = 48 and 45 + 5 = 50 against the printed 48-50; MINOR: the before
  record is the load's image, by design). Clean md5 pre-read 1 of 1; its plan files taken onto `claude/s742-apply`.
- 14:21Z: s742b's migrate 46015104644 returned 1, none skipped; `.apply` restored (`3a9dbbf4`). Records collected: 15.
  Cabrillo's `recommended_counts` round 2 (`a186f665`: the recall on the four degrees' own committed text, the
  arithmetic guard) to the Fable reader, its last round.
- 14:23Z: San Jose City's free reconcile 46011334736 filed on `claude/s742-keys` (`6391c29e`). The conductor ran
  keep-better on it from the 13:43Z read (expanded; md5 equal): re-read 1, kept 1 (38499, which now holds score.pass),
  restored 0 (`9718a1dd`). No person's check and the md5 unchanged at 14:24Z; the reread dispatched on
  `claude/s742-keys` (force 46011334736).
- 14:24Z: Santa Barbara City's free reconcile 46010148668 (on `claude/s742-piles-sbcc`, `1514c613`): 2 fail to pass, 0
  pass to fail; `piles` kept its two targets and put the other 13 back at main's files, 05934 among them (it turned
  passing in the run and keeps its ruled hold, `d-sbcc-05934-keeps-hold-s727`); keep-better kept 2. No person's check at
  Santa Barbara City or Fullerton (14:24Z, md5s equal): the reread dispatched (force 46010148668; it posts 32775 passing
  and 43553 rescored to its page's figures, still failing, for a `total_differs` plan next session).
- 14:25Z: Cabrillo's `recommended_counts` round 2 GO (Fable 5.2: each record steps on its own page alone; all 12 wrong
  pairings refuse; 4 of 684 records statewide, all Cabrillo; 06326, a person's, does not move). Its free reconcile
  dispatched on `claude/s742-piles-cabrillo`.
- 14:25Z: live: San Jose City 38499 passing at 46011334736 (records collected: 16); Santa Barbara City 32775 passing at
  46010148668 (records collected: 17) and 43553 unequal at 46010148668; Butte 14583 at 46012628995, incomplete (its own
  page now; a gap plan next session).
- 14:26Z: Fullerton's free reconcile 46010143379 (on `claude/s742-piles-fullerton`, `d5e17d4c`): 2 fail to pass, 0 pass
  to fail; the other 21 put back at main's files; keep-better kept 2. Its reread dispatched (force 46010143379; no
  person's check at 14:24Z): it posts 33680 (22-26 against 22-26) and 42143 (18-19 against 18-19), both passing.
- 14:27Z: `readers` stop 4 (head `4d394536`): plan s742r2 (El Camino 19883 and 38948, `total_differs`, each under its
  page's printed total); a Cuyamaca reconcile step for 18637 (the page's "CSU or UC transferable units" as
  `electives_fill_words`; recall over 180 records: the words land on 18637 alone, 0 turn failing); Coastline's free
  capture 46008933093 bound 43057 to its 2.0 page at coverage 1.0, and its paid read dispatched on `claude/s742-readers`
  (only 43057, about $0.15). Held, no plan by the wind-down: Reedley 30465 (its page is headed "Child Development,
  Certificate of Achievement"), Los Angeles Pierce 19181 (number runs), Grossmont 21402 (already a named gap with no
  record), El Camino 19857. s742r2 and the Cuyamaca step to one Sonnet reader.
- 14:33Z: s742r2's reader (Sonnet): APPLY (both pages print the totals the plan cites, read from the page-read runs'
  logs; NIT: the page text is not committed, only the run ids); the Cuyamaca step GO (its `only_with` keeps it to
  `electives_fill_degree` readings; the recall goes red when loosened). Cuyamaca's free reconcile dispatched on a
  sibling, `claude/s742-readers-cuy2`, cut at `4d394536`. Clean md5 pre-read of s742r2 2 of 2.
- 14:38Z: s742r2's migrate 46017601125 returned 2, none skipped; `.apply` restored (`8aec0dfb`). Records collected: 19.
- 14:39Z: Fullerton's reread posted 33680 and 42143, both passing at 46010143379. Records collected: 21.
- 14:41Z: `readers` final: Coastline 43057's paid read 46016403916 ended red at its price step and sent nothing ($0):
  43057 stands refused, so its pinned page staged as not found and `only=43057` had no text. Its fix (`f3a01a5b`: a bound
  pin's page stages as read) is shared reader code with no second reader yet: **DECIDED**
  `d-coastline-stage-fix-parked-s742`, parked on `claude/s742-readers-stagepin`; the land takes `claude/s742-readers` at
  `4d394536`. Held by `readers`: El Camino 19857 (its page's figures disagree, eight unlisted courses, and the capture
  ties it to the A.S. page), Reedley 30465 (a page read and a pin), Los Angeles Pierce 19181 (number runs), Grossmont
  21402 (a named gap with no record; its text is cut at "Certificate o").
- 14:43Z: `piles` final (heads: `claude/s742-piles` `99dfe1bd`, `-butte` `a62633da`, `-sbcc` `5cd1912b`, `-fullerton`
  `9768ce86`, `-cabrillo` `a186f665` with its free reconcile 46015798176 running). Orange Coast's free capture
  45999669017 binds both pins (08663 at coverage 0.6, 08626 at 1.0 with "held_no_gain"): **DECIDED**
  `d-orange-coast-read-parked-s742`, the paid read (only 08663,08626, force 08626, about $0.15) is the next session's.
  Held by `piles` with reasons in its final stop: Butte 14583, Santa Barbara City 43553 and East Los Angeles 31017 posted
  and still failing; Santa Monica 43767 (live on 37548804006, a run main never filed: a person compares); Cabrillo 11293;
  Contra Costa 33660; coverage fails at Los Angeles Trade-Technical 31280 and 45285, Santa Barbara City 30746, Fullerton
  18166, 18749 and 36863, City College of San Francisco 32079 and 41315, Orange Coast 43100; not the program's own: Long
  Beach City 37213, City College of San Francisco 19037; a reread or scorer reading: Gavilan 45357, East Los Angeles
  41231, College of the Sequoias 06770 and 45030, Orange Coast 03993, 08670, 36032, 42331.
- 14:44Z: the checkpoint-docs worker (Sonnet) started; the conductor stops writing this file (one writer).
- 14:56Z: Cabrillo's reconcile 46015798176 filed; the conductor kept its four targets alone (219 restamped records put
  back), ran keep-better (06326 a person's; md5 equal at 14:56Z; kept 4) and dispatched the reread: 06352, 06380, 06381
  and 44992 passing at 46015798176 at 15:00Z. Records collected: 25.
- 15:01Z: Cuyamaca's reconcile 46017556328 filed; keep-better (fresh read at 15:00Z, md5 equal) holds 18637 for a person
  until the land merges (its live row is tonight's reread run, `main` files the old one): parked on
  `claude/s742-readers-cuy2` (`284d0270`).
- 15:06Z: the 8 `cpl_memory` rows applied by migrate 46021590772 on the second try (the first, 46021306187, wrote nothing:
  the table's kind check has no `pattern`; the three rows take `procedure`); `.apply` restored (`7652c7d0`). The vault note
  merged as samueltlee/CPLBrain#875 (`904cff53`).
- 15:07Z to 15:57Z: #3905, the land, through three CI rounds: an either-state edit to the S739 Gavilan test (08464 now
  posts a later run), then to the S731 pooled test (Cuyamaca 18637's verdict moves with tonight's records), then a real fix
  in tonight's s742k3 test (its no-Postgres fallback caught `Exception` but not the `SystemExit` the md5 helper raises).
  `test` green on `24c68b2b`.
- 16:00Z: #3905 merged as `1c12d1a7`, confirmed on `origin/main`; the closing census dispatched on `main` (46029970004, `8f914656` at 16:06Z: 15,680 pass, 3,927 without, 675 with a named gap). The context meter
  read 109,569 tokens left at 15:17Z (the warning line): this checkpoint was already written, so the run finished the land
  and signed off.

## What shipped

In all: 25 records collected and live (12 passing, 13 named gaps by guarded plans), no outline rows, paid reads about
$0.81 on their estimates (Cuyamaca $0.25, El Camino $0.50, Butte $0.06, Coastline $0; page reads free). Census and headline: the census after the display build,
46003215768 on `main` (`3502e99c`, 13:04Z): 15,669 of 20,282 pass, 3,950 without, 663 with a named gap; the closing census,
46029970004 on `main` (`8f914656`, 16:06Z): 15,680 of 20,282 pass, 3,927 without, 675 with a named gap (from 15,669,
3,950 and 663).

**Merged.**
- **#3904 (`1a3e3be8`, 12:59Z), the display build `5b80d4de75e9`** (18,747 rows; the gate at Glendale 45998506887, then the
  whole build 45998968540).
- **#3905, the land** (`claude/s742-land`, merged `1c12d1a7`, confirmed on `origin/main`): `keys`, `readers` at `4d394536`,
  `piles` and its siblings (Cabrillo included), and `claude/s742-apply`; the closing census was dispatched on `main` after it.

**Live (each applied, reread or loaded).**
- Keys 6 (and one upgrade): San Jose City 38499 (the cited `JOURN138` renumber; the conductor carried it after `keys` ended); Cuesta 43053,
  41744 (s742k1); San Bernardino Valley 04873, 39483 (s742k2), 17829 (s742k3); Cosumnes River 33542 (an upgrade from a
  gap to passing, reread 45972311864, not counted).
- Readers 6: El Camino 19861, 19866, 43993 (paid read 46007782666, load), 19883, 38948 (s742r2); Modesto 35127 (s742r1).
- Piles 9: s742a Santa Monica 21026, Butte 01312, Cabrillo 45306, Gavilan 08464; s742b East Los Angeles 02456 and 37510
  (reread 46013175731 on `plan_code_own`); Santa Barbara City 32775; Fullerton 33680, 42143.
- Upgrades, not counted: Butte 14583 (its own page now, still failing), Santa Barbara City 43553 (rescored, still
  failing), East Los Angeles's seven moved to the committed run.
- New code (each passed its reader; verdicts in the log above): keep-better's `plural_longer` and `plan_code_own`; the
  Acalog road reading `site_pages` pins with its host check; Coastline's pin and `site_heading_plural`; San Jose City's
  `JOURN138` renumber; Cuyamaca's `electives_fill_words` step; Cabrillo's `recommended_counts` step; plan modules
  `kb/_program_piles_s742*.py`; the compact live-read form `kb/_live_read_expand.py`.
- Cabrillo 06352, 06380, 06381 and 44992 passing by the conductor's reread of reconcile 46015798176 (the four kept
  alone, 219 restamped records put back, 06326 a person's and untouched), in the land. Cuyamaca 18637 parked on
  `claude/s742-readers-cuy2` (`284d0270`): keep-better holds it for a person until the land merges (its live row is
  tonight's reread 46003456131 while `main` filed 38748833332).
- Parked, not landed: `claude/s742-readers-stagepin` (`f3a01a5b`, Coastline 43057's staging fix, unreviewed); Orange
  Coast's paid read (capture 45999669017); `claude/s742-readers-cuy2` (`284d0270`, Cuyamaca 18637).

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's), by the lane's NEXT:
   - NEXT (2): the display build carrying S742's records, gate college Glendale, then `harvest-gap-census.yml` on `main`.
   - NEXT (3), lane 1: Cuyamaca 18637 (`claude/s742-readers-cuy2`, `284d0270`: merge `main`, rerun keep-better, then the reread force
     46017556328); Coastline 43057's staging
     fix (a Fable second reader, then `only=43057`, about $0.15); Orange Coast 08663 and 08626's paid read (about $0.15);
     the gap plans Butte 14583, Santa Barbara City 43553 and East Los Angeles 31017 unlocked; the holds by key (San Jose City
     18449, San Bernardino Valley 04894, San Diego City 22352 and 38732, Solano 43134, El Camino 19857, Reedley 30465, Los
     Angeles Pierce 19181, Grossmont 21402, Santa Monica 43767, and the coverage and reading lists in the lane).
   - NEXT (5), lane 2: the rest of S720's and S721's holds, then a fresh census's piles.
   - NEXT (6), the follow-up PR: the Porterville 06773 guard first, then S731's, S739's, S740's, S741's and S742's minors
     (the Acalog `label_score`, `site_pinned`'s swapped title, the `JournalismJO` name key, `ge_units_not_read` reading the
     stored score, a bare code with no letter, 04873's note, Cabrillo's quoted text).
   - Step 11: the outline queue is empty until a census, a capture or a verdict row changes (NEXT (1)).
2. **`common-subjects-reference`** (a plain session's; conductor runs stay on collection): its NEXT (S719) in the lane,
   with `commons`, which Sam's plain sessions hold. None was worked tonight.
3. **A plain session's, each by its lane's NEXT:** `implementation-funding` (27,661 bytes against 20,000: compact
   first); `cer-procedures` (21,633: compact first); `commons` and `common-subjects-reference` (each about 20,500);
   `my-college-action-page`; `nc-learning-partners`; `repo-size`; `governance-team-enablement`, `library`,
   `sierra-page-redesign` and `common-cr-reference`; the brief's slimming items (`d-slimming-left-to-plain-session-s720`).

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

Handoff 742's table stands in every row this run did not clear; the rows below changed.

| Block | Who clears it | Since |
|---|---|---|
| Cuyamaca 18637: keep-better after the land, then the reread (`claude/s742-readers-cuy2`, `284d0270`) | Sky, lane 1 | 2026-11-27 (S742) |
| Coastline 43057: staging fix `claude/s742-readers-stagepin` (`f3a01a5b`, no second reader) | Sky, a Fable second reader, then the paid read | 2026-11-27 (S742) |
| Orange Coast 08663 and 08626: the paid read (capture 45999669017) | Sky, lane 2 | 2026-11-27 (S742) |
| Gap plans: Butte 14583, Santa Barbara City 43553, East Los Angeles 31017 | Sky, lane 2 | 2026-11-27 (S742) |
| San Jose City 18449; San Bernardino Valley 04894; San Diego City 22352, 38732; Solano 43134 (a person's) | Sky, shared code; Solano a person | 2026-11-26 (S740) to 2026-11-27 (S742) |
| El Camino 19857; Reedley 30465; Los Angeles Pierce 19181; Grossmont 21402; Santa Monica 43767 | Sky, reader changes with second readers | 2026-11-27 (S742) |
| The follow-up's minors from S742's readers (lessons *S742*, *Readers' MINORs and NITs*) | Sky, the follow-up | 2026-11-27 (S742) |

Cleared tonight: Cosumnes River 33542 (and `claude/s741-keys-crc`'s premise: the PDF is unchanged); Cuyamaca's plural fold
(`claude/s741-keys-wordtest`, now in the land); Cuesta 43053, 41744; San Bernardino Valley 04873, 39483, 17829; San Jose
City 38499; El Camino 19861, 19866, 43993, 19883, 38948 and the Acalog pins; Modesto 35127; Santa Monica 21026; Butte
01312; Cabrillo 45306; Gavilan 08464; East Los Angeles 02456, 37510; Santa Barbara City 32775; Fullerton 33680, 42143.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no reply since
2026-11-19T23:47Z). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. Sam's words in this session: none. The run acted on his routine prompt of 2026-11-17, his collect-with-gaps
ruling of the same day (`sam-collect-with-gaps-2026-11-17`), his work order of 2026-11-20 and his cost rules of 2026-11-25.

## Decisions (the conductor's, each reversible)

- `d-applies-on-own-branch-s742`: applies go on `claude/s742-apply`, the plan's files taken from the worker's reviewed
  head, so a worker's branch stays free.
- `d-coastline-stage-fix-parked-s742`: the staging fix is shared reader code with no second reader; parked on
  `claude/s742-readers-stagepin`.
- `d-orange-coast-read-parked-s742`: the paid read for 08663 and 08626 is the next session's.

Memory rows: `kb/migrations/2026-11-27_s742_cpl_memory_rows.sql` (8 rows, all proposed, INSERT-only with
`ON CONFLICT DO NOTHING`, rollback in its header), drafted by the checkpoint-docs worker, applied by the conductor.

## Patterns that worked

- **Plan, second reader, clean md5 pre-read, one apply, `.apply` restored**, for every plan; a Sonnet reader for plans
  and a Fable 5.2 reader for shared reader code (two rounds at most: the plural fold and `plan_code_own` each needed two).
- **A sibling branch for each long read** (`claude/s742-readers-cuy`, `-readers-ec`, `-piles-butte`, `-piles-sbcc`,
  `-piles-fullerton`, `-piles-cabrillo`), so a worker's branch stays free and a paid read cannot cancel a capture.
- **The compact live read**, grouped by run with a count and md5 per college, expanded and verified by the conductor.
- **Keep-better from the conductor's live read before every reread**, and a person's-check look at each college first.
- **The conductor carries a worker that ended**: San Jose City 38499 went from reader to reconcile to reread without
  `keys`.

## Findings

- `p-compact-live-read-s742`: the full-form live read cost about 35 KB each; the grouped form carries the same proof.
- `p-conductor-carries-ended-worker-s742`: a worker that ends at its limit leaves its key to the conductor.
- `p-paid-read-on-sibling-avoids-cancel-s742`: a paid read on a branch with a pending capture would cancel it.
- `f-cosumnes-pdf-unchanged-s742`: the hand-filed PDF's sha256 is unchanged; the capture opens the Marketing window a
  page earlier, correcting the premise of `d-crc-filing-parked-for-moved-pdf-s741`.

## Safety patterns to honor

All of handoff 742's. New tonight: an apply goes on its own branch cut at the worker's reviewed head; a live read is
verified by its per-college md5 before any reread; a paid read goes on a sibling branch; shared reader code takes a Fable
second reader before any dispatch on it, and a fix without one parks on a branch. Never file a person's name from an
outline page anywhere. A permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Back for collection only*; review rounds as his ruling of 2026-11-20 sets them). Settings block (Sam, 2026-11-11, his
latest change; the block copied from `docs/reference/conductor_mode.md`):

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx; the routine's form sets the model and ultracode;
  medium effort lives in its prompt. Tonight Opus 5.5 served the conductor (the form names Fable 5.2).
- Ultracode on. The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`); tonight no Opus worker ran: `keys`, `readers` and `piles`
  ran Fable 5.2 at high effort, the plan readers ran Sonnet, the shared-code readers ran Fable 5.2, and pr-gate ran Haiku.
- A worker building anything that writes shared data or changes an apply runs at **high** effort.
- A review workflow uses **at most 9 agents in all**, readers and second readers together.
- **Cost limits:** $40 per college per run, on the estimate, for program-requirements extraction, and a separate $40 per
  college for SLOs, PLOs and course objectives; per run, never a remaining pot. Paid runs go through the conductor.

Also: two lanes, never on one college; about $750 a day for everything, $10k running total for the whole job; stop rules
from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row; a
rollback that undoes over 1% of a day's rows; the $10k checkpoint. This run aimed at about $250, with no new worker after
about $190.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3903 (`claude/awesome-fermat-r0r7bv`) | the declaration, the log and this checkpoint (draft) | merges at sign-off, after the land and one update from `main` |
| #3904 (`claude/s742-display`) | merged `1a3e3be8` (12:59Z); display build `5b80d4de75e9` live | none |
| `claude/s742-keys`, `claude/s742-readers`, `-readers-ec`, `-readers-cuy`, `claude/s742-piles`, `-piles-butte`, `-piles-sbcc`, `-piles-fullerton`, `claude/s742-apply` | s742k1 to s742k3, s742r1, s742r2, s742a, s742b applied; reads and rereads live | the land PR (number to come) |
| #3905 (`claude/s742-land`) | merged `1c12d1a7` | none |
| `claude/s742-piles-cabrillo` | reread posted; in the land | none |
| `claude/s742-readers-cuy2` (`284d0270`) | Cuyamaca's reconcile 46017556328 filed, kept for 18637 alone | NEXT (3): merge `main`, keep-better, the reread |
| samueltlee/CPLBrain#875 | the vault note, merged `904cff53` | none |
| `claude/s742-readers-stagepin` (`f3a01a5b`) | parked, unreviewed | the next session (NEXT (3)) |
| Harvest gap census on `main` | 46003215768 (13:04Z): 15,669 pass | the next session's first read, after the display build carrying these records |
| #3383 | dependabot's | waits |

## Let go

The conductor holds no PR subscription, check-in or artifact watch: it opened no `subscribe_pr_activity`
subscription, no COBIx watcher (stopped by Sam, `d-cobix-watcher-stopped-on-sam-word-s714`) and no scheduled wake, so none is to
drop. Workers end with the session; each branch is pushed. The vault note for this run is
`CPLBrain/07-session-notes/2026-11-27-s742-skygodwit-collection.md`, merged by the conductor under Sam's ruling of
2026-11-21 that vault note drafts merge on their own.

Spend: about $185 estimate at list prices (Fable 5.2 $132.62, Opus 5.5 $43.53 to 16:01Z, Sonnet 5.5 $7.65, Haiku 5.5 $0.05, and about $1 for the sign-off), from the session's and its agents' transcripts; collection $185;
2026-11-27T12:12Z to 2026-11-27T16:15Z. (Fable 5.2 $8/$40 per MTok and cache reads $0.20; Opus 5.5 $4/$20 and $0.20; Sonnet 5.5
$2/$10 and $0.10; Haiku 5.5 $0.10/$0.50; cache writes at 1.25 times input. The paid reads' own cost, about $0.81 on their
estimates, is apart.)

Opening line: *Greetings, you are SkyStilt (the next free session number at your start; the routine takes it, so Session 743 and the run after it writes 744), see SkyGodwit's (S742) handoff — `docs/session_743_handoff.md` — let's keep rolling with our queue.*

Conductor model: Opus 5.5 (the form names Fable 5.2); session cost about $185 (a token-count estimate; get_session is not available here); 25 records collected and live (12 passing, 13 named gaps); 0 outline rows added; 2 substantive PRs merged (#3904, #3905), not counting checkpoints.
