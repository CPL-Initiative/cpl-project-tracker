---
title: "Session 741 handoff (from SkySkimmer, S740, the CPL Queue routine's collection run of 2026-11-26, from 13:12Z)"
created: 2026-11-26
updated: 2026-11-26
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Conductor model: Opus 5.5 (claude-opus-5-5), as this run's header reports; the routine's form names Fable 5.2.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (738, S737 SkyWhimbrel's, naming SkyTurnstone for Session 738), never this file.
**Numbering.** S739 (SkyOystercatcher) wrote 740 and named SkySkimmer for the routine's next session, to take the next
free number: this run is S740 and writes 741. 739 stays SkyTurnstone's (Sam's next plain session), 737 SkyBrant's if it
writes one.

*(Declaration, written at 13:22Z before any worker started. The checkpoint fills the rest.)*

## The start (13:12Z firing, 2026-11-26)

- Brief: COBIx's on #3358 (Wed Nov 25, 6:30 PM PT, updated 02:31Z); the newest comment on the thread is still
  7064588752 (Sam's two rulings of 2026-11-21). Handoff 740 (S739) is the newest; its checkpoint #3879 merged at
  12:23Z (`609c2a2b`, confirmed on `origin/main`).
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 13:15Z: dependabot's #3383 alone. No commit on
  `main` after `609c2a2b`. S739 let go of everything at sign-off.
- Step 0: not the night's first firing (S739 dispatched the day's dashboard at 06:14Z; `15088513` is on `main`).
- No pause line (handoffs 738 and 740). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter, the merge-read and clock guards). No `set_session_tags` here.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-25: none. Rule 8's memory read: no row
  since S739's 12 (11:29Z). Steps 6 to 10: held in a conductor run, as S727, S731 and S739 held them. Step 11: the
  outline queue is empty until a census, a capture or a verdict row changes.
- Census on `main` (45816008322, 12:06Z): of 20,282 active programs, 15,610 pass and 4,082 have no passing record;
  590 are collected with a named gap. Its `next_wave` (51 colleges, 125 programs, $9.19) is almost all S739's
  relists (`f-census-ignores-college-named-gaps-s727`) and holds, so tonight's collection goes to the levers instead:
  `reconcile_steps` 894 programs at 109 colleges, `reader_page_search` 1,097, `reader_page_assignment` 130.
- **Spend aim:** about $250 for this run, no new worker after about $190. S739 spent about $273 on this UTC day and
  S736 and S737 ran unmetered (01:13Z to 05:15Z), so the day stays under about $750 with room for Sam's plain session.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S739's records, gate
    college Glendale, then the whole build, then `harvest-gap-census.yml` on `main`.
  - `reads` (Fable 5.2, high effort): Copper Mountain 41085 (the registry names a 404; the reissued catalog is
    `https://www.cmccd.edu/wp-content/uploads/2026/11/Final-26-27-Catalog-11.18.26r1.pdf`), then San Diego City 22367
    and Santa Ana 12242 (long fresh captures), then Santa Ana's `reconcile_steps` pile (13 unequal, 3 incomplete).
    Colleges: Copper Mountain, San Diego City, Santa Ana.
  - `reconcile` (Fable 5.2, high effort): the `reconcile_steps` lever (correction rules from the catalog's own
    wording, a free reconcile, a reread), and a named gap where no rule is true, at San Bernardino Valley, San Jose
    City, Norco and Solano. Colleges: San Bernardino Valley, San Jose City, Norco, Solano.
- **Lane 2 (cheap piles, one worker at a time, high effort):** `piles` (Fable 5.2): the units within-range kind, a twin
  of `hours_within_printed_range` with a self-recall, for Gavilan 08460, 19378, 38787 and 41394, Orange Coast 41373,
  Shasta 32162 and College of the Canyons 36793 (`d-within-range-sums-hold-for-units-kind-s739`); the holds S739 left
  for a reread, each collected with its gap named where the gap is true (gaps noted instead of rereads): American
  River 39731 and 39732, Shasta 18625, Santa Barbara City 30746 and 43553, Los Angeles Trade-Technical 45285 and 31280,
  Long Beach City 37213, Santa Monica 03281, Los Angeles City 32832, Gavilan 45357, Ventura 06948, 08253, 35654, 37415,
  44994 and 44995; the aliases and free reconciles for Shasta 18655 and Los Angeles Trade-Technical 31089 and 41150;
  Cerritos 44984's reload (the conductor dispatches it); then Cabrillo's 13, then S720's rest (Fullerton 7, City
  College of San Francisco 9, Santa Monica 3, College of the Sequoias 2, East Los Angeles 6, Glendale 1, Contra Costa
  6, El Camino 8) and S721's (Butte 3, Orange Coast's 14 and 08626). At its land, the Spend line's builders and the
  Commons page counts are rebuilt. Colleges: Gavilan, Orange Coast, Shasta, College of the Canyons, American River,
  Santa Barbara City, Los Angeles Trade-Technical, Long Beach City, Santa Monica, Los Angeles City, Ventura, Cerritos,
  Cabrillo, Fullerton, City College of San Francisco, College of the Sequoias, East Los Angeles, Glendale, Contra
  Costa, El Camino, Butte.
- **Not tonight:** Porterville (the follow-up's guard first); Saddleback (its `repeat` window first); West Valley
  35588, Southwestern and Pasadena City (reader changes); Antelope Valley and Mission (the eLumen follow-up's rest);
  College of the Desert (robots.txt); Los Medanos (parked); MiraCosta 36144 and 36171; El Camino's four on the Acalog
  road and the other reader changes (Cuyamaca, Cosumnes River 33542, Coastline 43057, Reedley, Los Angeles Pierce,
  Grossmont, Cuesta, Modesto 35127); the follow-up PR, after the waves if the run has room.

## Split changes during the run

- 13:22Z: the declaration (this file's first commit), draft #3885.
- 13:24Z: display build `9e28519af71f` on `claude/s740-display` (built on `609c2a2b` with Python 3.12; the
  sandbox's default 3.11 prints false STALE lines in `check_generated.sh`, so every worker runs a 3.12 shim at
  `/home/user/wt/.py312bin`). 13:28Z: the Glendale gate 45829454750 dispatched; green at 13:31Z: 242 Glendale rows at
  `9e28519af71f`, nothing else moved (live: 18,485 at `3a699eddc8c9`, 16 rows with no display yet). 13:33Z: the whole
  build dispatched on the branch at 13:32Z.
- 13:38Z: the whole build 45830104263 green: 18,743 rows at `9e28519af71f` (the 16 with no display now carry one), the
  same 32 at older builds, none without a display. 13:41Z: #3886 opened; `test` green at 13:51Z (run 45831658269).
- 13:54Z: #3886 merged (`0017cd97`, confirmed on `origin/main`; `main` had not moved since its base). 13:55Z: the census
  dispatched on `main`.
- 14:03Z: the census after the display build, 45833723371 on `main` (`a2008423`): 15,610 of 20,282 pass, 4,082 have no
  passing record, 590 collected with a named gap (unchanged, as a display build moves no record).
- 14:05Z: `reads` reported (head `3e59a452`): neither long capture is needed, since both filed captures' artifacts
  still exist and `sources_from` stages them with no page loaded (free staged runs 45830705593 and 45830902990, each
  priced at $0.10); plan s740r1, Copper Mountain's registry row (Sam's Sheet 88 correction, applied by S405) moved to
  the same 2026-2027 catalog's reissue, the old address answering 404. The conductor read it (one row, guarded, the
  history trigger and the receipt both hold the before-row; new source evidence reopens a person's save,
  `CLAUDE.md`, *Person-settled wins*), pre-read clean 1 of 1; migrate 45835717010 returned 1; `.apply` restored
  (`0b2b5042`). 14:08Z: paid read San Diego City 22367 (staged from 38347787891, `only` and `force` 22367, $0.10 on the
  estimate; the force has its cause: S739's page read prints the four courses and the total the filed record lacks):
  run 45836017170. None of the three records has a live row, so each goes live by `load`.
- 14:14Z: `reads`' correction: run 45836017170 ended green and extracted nothing, since the price step holds a restaged
  capture that predates the page counts (no charge); San Diego City 22367 and Santa Ana 12242 do need fresh captures,
  as S739 said. Copper Mountain's free capture 45836130411 read the reissue (184 pages) and bound 41085 to p.106,
  coverage 1.0. 14:13Z: Copper Mountain 41085's paid read on `claude/s740-reads` (only 41085, $0.10); a sibling branch
  `claude/s740-reads-sdcity` cut at `3d347018` for San Diego City's fresh read (only and force 22367, $0.10, about 95
  minutes), so Santa Ana's two-hour read keeps the reads branch after its reconcile.
- 14:17Z: `piles` reported (head `22b6dfe2`): the kind `units_within_printed_range` (50) in `kb/_program_named_gaps.py`,
  filed only by reviewed key lists (its self-recall: on 28 held answers the figures alone were right on 6 and wrong on
  22, so no matcher files it); s740a Gavilan 4, s740b Orange Coast 41373, s740c College of the Canyons 36793, all
  named gaps; Shasta 32162 held (the own-page guard), Gavilan 08464 and 45357 held. To a Sonnet second reader on a
  fixed worktree at `22b6dfe2`. 14:18Z: Cerritos 44984 and 20504 (both unchecked, live at run 37961137169) reread at
  38064252862 on a clean branch off `main`, `claude/s740-cerritos`, so the write runs on reviewed code.
- 14:26Z: the reader of s740a to s740c (Sonnet): APPLY, APPLY, APPLY. All six gaps true (08460 36 in 30-36, 19378 24 in
  14-24, 38787 53-60 in 48-60, 41394 27 in 26-27, 41373 29 in 28-29, 36793 19-22 in 18-22); nothing files the kind past
  the listed keys (its recall over 12,141 passing records and 48,486 held readings: 0 wrong); the 12 md5s match.
  MINORs for the follow-up: the S739 Gavilan and Orange Coast tests now accept "none or this kind"; 38787's core prints
  42-48 over courses summing to 47, carried as a note; NIT, 41394's STAT C1000 for the closed list's MATH 5.
- 14:27Z to 14:32Z: clean md5 pre-reads (4 of 4, 1 of 1, 1 of 1); migrate 45839224932 returned 4 (s740a), 45839553639
  returned 1 (s740b), 45839834306 returned 1 (s740c), none skipped; `.apply` restored on `claude/s740-piles`
  (`7bd5120b`). Live: each row carries `units_within_printed_range`.
- 14:23Z: Cerritos's reread 45837760519 (receipt `1a0bd569` on `claude/s740-cerritos`): 44984 and 20504 live at
  38064252862, arithmetic equal, both passing.
- 14:47Z: `reads` reported (head `13df9d78`): Copper Mountain 41085 filed passing (read 45836803063, $0.06; 5 of 5
  placed, degree 60 against 60); seven `course_renumbers` pairs (BI to BIOL, PE to KINE), each cited by the reissued
  catalog's "Formerly known as" sentence, bound 43132 to its own page p.107 (coverage 4 of 11 before, 1.0 after);
  Santa Ana's first reconcile entry, one `pool_lists` step for the Liberal Arts emphases ("Complete a minimum of 18
  units from a single Area of Emphasis"), filed by the free staged reconcile 45841675928: 66 restamped, 4 fail to
  pass (18581, 18582, 19268 by the step; Earth Science 31980 by today's scorer), 0 pass to fail. Its forced change:
  `kb/_build_commons_data_status.py` drops Copper Mountain's hand-entered `CATALOG_LINKS` entry, as its own comment
  asks once a recapture moves the capture root.
- 14:48Z: Copper Mountain 43132's paid read 45842624535 (filed passing at 14:50Z, arithmetic equal, $0.10) and Santa
  Ana's long read 45842667274 (only 12242, about two hours) dispatched on `claude/s740-reads`.
- 14:54Z: the reader of the reads branch (Sonnet): Santa Ana reread GO, Copper Mountain load GO (43132 only once filed
  passing). It re-derived the 4 fail-to-pass and 0 pass-to-fail from the filed records; the step's self-recall joins
  exactly 18581, 18582 and 19268; the pairs reach only 43132 and 18520, which passes with or without them. MAJOR for the
  land, not the writes: both Commons sidecars were built before the reconcile filed and must be rebuilt after the
  reread posts. NITs: 19268's pool admits list d into list e's choice (the count stays 18); Copper Mountain's display
  link becomes the PDF. 14:55Z: Santa Ana's reread (force 45841675928) and Copper Mountain's load dispatched.
- 15:01Z: live: Copper Mountain 41085 and 43132 inserted and passing (arithmetic equal); Santa Ana's 66 rows at
  45841675928, with 18581, 18582, 19268 and 31980 now passing. Records collected so far: 14 (Cerritos 2, s740a to
  s740c 6, Copper Mountain 2, Santa Ana 4). `reads`' plan s740r2 (Santa Ana, 8 named gaps, 3 held) is being committed.
- 15:10Z: `reconcile` reported (head `33f47436`): cited `course_renumbers` steps and one San Jose City `course_units`
  step (BIOL 020) in `kb/program_requirements_reconcile.json`; free reconciles at Solano (45840125172: 12 restamped, 6
  fail to pass on the live checks) and San Jose City (45840981324: 20 restamped, 11 fail to pass), 0 pass to fail on
  the live table's three checks; plans s740c1 Norco 2 (`lists_not_closed`; 11 held for a curriQunet reader change)
  and s740c2 Solano 3. 15:17Z: its reader (Sonnet): San Jose City reread GO, s740c1 APPLY, s740c2 APPLY; **Solano
  reread FIX THEN GO** (MAJOR: the branch holds the raw reread, so 20973, 36420 and 42205 lose their overall pass on
  ligature text until `kb/_program_reread_keep_better.py` restores them); MINORs: 22239's careers check flips (not a
  live check); the BIOL 020 step also fills 38426 (true, verdict unchanged); KINPE56 to `KINPE 9B` joins one state
  control number printed as two courses at 32260 (placed rows unchanged).
- 15:18Z: San Jose City's reread 45847599186 (receipt `a15c5aba`): 20 rows at 45840981324, the 11 passing live.
  15:18Z to 15:21Z: clean pre-reads (2 of 2, 3 of 3); migrate 45847730410 returned 2 (s740c1), 45848030080 returned 3
  (s740c2); `.apply` restored on `claude/s740-reconcile` (`db8d0286`).
- 15:17Z: `piles` batch 2 (head `b845150f`): s740d Cabrillo 7, s740e El Camino 4, s740f Santa Monica 1 (all named
  gaps); free reconciles for Shasta 18655 (45841957622) and Los Angeles Trade-Technical 41150 and 31089 (45844759766).
  To a Sonnet second reader at `b845150f`. 15:21Z: Ventura's paid read for its six reread holds on
  `claude/s740-piles` (about $0.36; the page read shows today's capture holds each Requirements tab).
- Records collected by 15:22Z: 30 (Cerritos 2, s740a to s740c 6, Copper Mountain 2, Santa Ana 4, San Jose City 11,
  s740c1 2, s740c2 3).
- 13:31Z: `piles`, `reads` and `reconcile` started on Fable 5.2 at high effort, each in its own worktree off `609c2a2b`
  (`/home/user/wt/<name>`), told to open no PR (the conductor opens each land) and to leave `.apply` to the conductor.
