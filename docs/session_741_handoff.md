---
title: "Session 741 handoff (from SkySkimmer, S740, the CPL Queue routine's collection run of 2026-11-26, from 13:12Z)"
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
**Numbering.** S739 (SkyOystercatcher) wrote 740 and named SkySkimmer for the routine's next session, to take the next
free number: this run is S740 and writes 741. 739 stays SkyTurnstone's (Sam's next plain session), 737 SkyBrant's if it
writes one.

# You are SkyWillet, the routine's next session

From SkySkimmer (S740), the CPL Queue routine's 13:12Z firing of 2026-11-26, a conductor run for collection only under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358, served by Opus 5.5 (the routine's form names Fable 5.2). Handoff 740 named SkySkimmer for the routine's next session, and no plain session held the name. You take the next free session number and write the handoff one above the highest on `main`.

A **full checkpoint** (the harvest lane moved; Rule 10 data writes ran: guarded plans s740a to s740j, s740c1 to s740c6 and
s740r1 to s740r4, the reads' loads and rereads, a display build; and the memory rows, drafted for the conductor), written by the
checkpoint-docs worker from 16:39Z, while Santa Ana 12242's read, Orange Coast's read and the combined land were in flight. The
conductor's final facts fill the places marked in angle brackets. Skipped: step 2 (tonight's code sits in the harvest's own named-gap
kind, reconcile steps and registry), step 3 (no user-facing surface changed), step 5 (no kb-note: tonight's learnings sit in the
lessons and memory rows), step 7 (no re-mint, no roadmap status change, no auditor counts moved) and step 9 (the UI pass is its own
queue item). The start and the college split below were written before any worker started, and the split changes are the run's
log, kept whole.

*(Declaration, written at 13:22Z before any worker started.)*

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (Wed Nov 25, 6:30 PM PT, at this writing), and comment
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
3. **Merge order at sign-off:** #3886 (`0017cd97`, the display build) has merged; the land #3892 (`claude/s740-land`, all five working branches as one PR off `main`): merged at 17:48Z as `7f00b827`, confirmed on `origin/main`, without a final update from `main`, which had moved only by Sam's lightning-round PR (`e965ebb1`), touching none of the land's files (**DECIDED** `d-land-merged-without-main-update-s740`, as `d-display-merged-without-main-update-s731`); `test` green on `c957bda9` (run 45868426477). This checkpoint, #3885, merges at sign-off, with one update from `main` right before its merge. Open PRs at sign-off: #3885 and dependabot's #3383, which waits.

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
- 15:24Z: the reader of piles batch 2 (Sonnet): s740d, s740e, s740f APPLY; Shasta and LATTC rereads GO (41150's pass
  stands on the catalog line "DIGLMD 100 Introduction to Digital Media 3", the line S739's reader asked for). MINORs: pin
  the run id in the three older tests that now accept either state; 45306's hold reason should say it is on no live run;
  02520's computed 64.5 equals the printed Program Total. 15:26Z: the two rereads dispatched on `claude/s740-piles`
  (Shasta posts 18655 at 45841957622, LATTC 41150 and 31089 at 45844759766). 15:28Z to 15:33Z: clean pre-reads (7 of
  7, 4 of 4, 1 of 1); migrate 45849528191 returned 7 (s740d), 45849791694 returned 4 (s740e), 45850056682 returned 1
  (s740f), none skipped; `.apply` restored (`1eb74d5c`). Live: 41150 passes; 18655 and 31089 sit at their reconcile runs
  for a gap plan.
- 15:30Z: `reads` pushed s740r2 (head `98673952`; Santa Ana, 8 named gaps; 31859 moved to `lists_not_closed` after
  `tests/reconcile_keeps_named_gaps_test.py` caught the first kind). Its reader (Sonnet): FIX THEN APPLY. MAJOR: 31859
  is the within-range case (computed 19-19.5 against the printed 18-19.5), so it leaves the plan and holds with 21789
  for `units_within_printed_range`, filed by key once the kind is on `main`; 31887 files with its hand words naming the
  reverse containment (the printed 52 inside the sum 51-52). The other six are true.
- 15:32Z: `reconcile`'s San Bernardino Valley reconcile 45844530701: 8 restamped, 40833 and 41756 fail to pass, and 4
  noncredit records (38013, 38014, 39191, 40280) pass to fail on fresh text, which keep-better restores from `main`
  with Solano's three; the conductor's live read for keep-better (no checked rows at either college) handed over.
- Records collected by 15:34Z: 43 (adds s740d 7, s740e 4, s740f 1 and LATTC 41150).
- 15:37Z: `reads` pushed s740r2's fix (head `984c8079`, 7 rows; 31859 out). Clean md5 pre-read, 7 of 7; migrate
  45851366093 returned 7, none skipped; `.apply` restored on `claude/s740-reads` (`211a5599`).
- 15:43Z: `reconcile` committed keep-better at `3b22ef61` (Solano 20973, 36420, 42205 and San Bernardino Valley
  38013, 38014, 39191, 40280, 17829 restored from `main`, from the conductor's live read of 15:32:58Z); the conductor
  checked the commit (only those records and the two accounts move) and dispatched both rereads at 15:41Z. Live at
  15:44Z: Solano's 9 rows at 45840125172 with 06555, 08337, 19450, 30678, 35213, 43144 passing the live checks (08337's
  outcomes and careers checks stay false); San Bernardino Valley's 3 at 45844530701 with 40833 and 41756 passing.
- 15:43Z: `piles` batch 3 (head `724e6a93`): s740g Contra Costa 2, s740h Butte 1, s740i Shasta 18655, s740j LATTC
  31089 (all named gaps), to a Sonnet second reader. Orange Coast's 13 keep s739j's reasons; Glendale 45068 holds (the
  capture's 16,000-character cap).
- Records collected by 15:44Z: 58 (adds s740r2 7, Solano 6, San Bernardino Valley 2).
- 15:50Z: batch 3's reader (Sonnet): s740g, s740h, s740i, s740j APPLY. MINORs for the follow-up: Butte 33579's
  sentence says the program "requires" the AGS 20/40 list apart from the total while its note says the map places those
  courses in List A (S721 held it for a reread): reword it, or bring its 70 near 50; Contra Costa 33370's sum 42.5-73.5
  straddles the printed 47 (defensible); the LATTC and S727 Shasta test edits accept the refiled state without tying it
  to the S740 receipt. 15:51Z to 16:05Z: clean pre-reads (5 of 5); migrate 45853194962 returned 2 (s740g), 45853610378
  1 (s740h), 45854815868 1 (s740i), 45855074670 1 (s740j), none skipped; `.apply` restored (`6b723a73`).
- 15:44Z: San Diego City's fresh read 45836824944 on `claude/s740-reads-sdcity` captured for 90 minutes and failed at
  its price step; nothing was extracted or charged; its capture artifact stays. To `reads` for the cause.
- 16:03Z: `reads` pushed seven more cited Copper Mountain pairs and s740r3 (Biology 42178, one named gap; head
  `65de8fed`); the free reconcile it first proposed would move nothing (the moved-page guard leaves records read from
  the old address as filed), so a paid read of the eight held programs (about $0.80) runs on a sibling branch,
  `claude/s740-reads-cm`, cut at `65de8fed` (16:05Z). s740r3 and the pairs to a Sonnet reader.
- Records collected by 16:05Z: 63 (adds s740g 2, s740h 1, s740i 1, s740j 1).
- 16:07Z: the reader of s740r3 and the seven pairs (Sonnet): s740r3 APPLY (42178's blocks sum to 30 against the printed
  32-33), pairs GO (no two keys share a value; the self-recall over every Copper Mountain record moves no pass to fail).
  MINOR: CDEV C1000's sentence also names "ECE-010A + ECE-010B", which no record lists yet. Clean pre-read 1 of 1;
  migrate 45855882400 returned 1; `.apply` restored on `claude/s740-reads` (`ee4496f4`).
- 16:08Z: Copper Mountain's read 45855512160 filed on `claude/s740-reads-cm` (`3d986aa2`, about $0.75): 18519 passes,
  the other seven read unequal. 16:10Z: its reread (force 45855512160) dispatched there.
- 16:13Z: `reads` on San Diego City: the price step refused because the 90-minute capture gave 22367 no page (`only=
  refused: 22367 has no text in the capture`); the reader's page checks, rule B, read its entry as "descriptions" since
  its own "Courses" child page prints four course descriptions. A staged read from the artifact fails the same way, so
  22367 holds for a rule B reader change with its self-recall and a second reader (next session's); no switch tonight
  (`CPL_READER_PAGE_CHECKS=0` would turn the rules off statewide). Santa Ana 12242 is clear of rule B (no record, not
  marked; `page_type` "other", 32 of 34 courses found).
- Records collected by 16:11Z: 64 (adds s740r3 1).
- 16:12Z: Copper Mountain's reread 45855997214 posted the eight at 45855512160; 18519 live and passing.
- 16:13Z: `reconcile`'s second batch (head `b0e4977b`): s740c3 San Bernardino Valley 6, s740c4 San Jose City 4, s740c5
  San Jose City 2 and s740c6 Solano 1 (42041), all named gaps; then it stopped. 16:19Z: its reader (Sonnet): APPLY on
  all four. MINORs: 42041's evidence says Human Services sits on p.303 where 08337's note reads p.304 (reword); San
  Bernardino Valley 22771 and 22776 sum at the top of their printed ranges (24 in 20-24, 44 in 40-44). **DECIDED**
  `d-waived-course-counted-at-range-top-s740`: `waived_course_counted` stands for both, since the gap names the
  record's own reading fault (it counted the 0-4 unit course the page lets a student waive, so its low end misses the
  printed one), which S739's within-range rule (a record with nothing wrong) does not cover. 16:20Z: clean pre-reads
  (6 of 6, 4 of 4, 2 of 2, 1 of 1); migrate 45857815541 returned 6 (s740c3), 45858064730 returned 4 (s740c4); s740c5
  and s740c6 applying.
- 16:13Z: Sam's plain session merged #3889 and #3890 (the sign-in pane and the magic link) to `main` at 15:51Z and
  16:12Z; no file shared with tonight's branches, and no other open PR.
- 16:24Z: `reads` pushed s740r4 on `claude/s740-reads-cm` (head `d16bd570`): Registered Nursing 16657
  `prerequisites_counted`, six held. To a Sonnet reader.
- 16:25Z: `piles` final (head `9bc1cb5f`): 23 named gaps applied in all, 41150 passing; step 6 (discontinued flags,
  units rules, retired courses) filed nothing over its colleges. Left for the next session: Ventura's read (a new
  `tabs_with_prose` opt-in, shared reader config no reader has seen, so it waits for one: `sources_from=45853684392`,
  `only=35654,37415,44994,44995,40179,06948,08253`, `force=06948,08253`, then its reread). 16:25Z: Orange Coast's paid
  read dispatched on `claude/s740-piles` (only and force 03954, 08664, 31217; page read 45851759039 shows the
  Requirements tabs).
- 16:26Z: spend at the repo's rates $180.09 (16:24Z), so no new collection worker; `land` (Sonnet) started on
  `claude/s740-land` off `main`, to carry all five branches in one PR.
- Records collected by 16:24Z: 75 (adds Copper Mountain 18519, s740c3 6, s740c4 4).
- 13:31Z: `piles`, `reads` and `reconcile` started on Fable 5.2 at high effort, each in its own worktree off `609c2a2b`
  (`/home/user/wt/<name>`), told to open no PR (the conductor opens each land) and to leave `.apply` to the conductor.

## What shipped

In all: 82 records collected (32 passing by reread or load, 50 named gaps by guarded plans), no outline rows, paid
reads about $1.28 on their meter (Copper Mountain $0.91, Santa Ana 12242 $0.11, Orange Coast $0.26; San Diego City and
Ventura charged nothing). Headline and census: run 45870806616 on `main` (17:51Z, `53a9b577`): 15,640 of 20,282 pass, 4,002 have no passing record (80 fewer than the 12:06Z census's 4,082), 640 are collected with a named gap (50 more); Cerritos 44984 and 20504 already passed in the committed files the census reads, so 80 of tonight's 82 moved its count.

**Merged.**
- **#3886 (`0017cd97`, 13:54Z), the display build `9e28519af71f`** (18,743 rows; S739's records): the gate at Glendale
  45829454750 (242 rows), then the whole build 45830104263; the 16 rows with no display now carry one, the same 32 stay at
  older builds, none without a display. The census on `main` after it, 45833723371 (14:03Z): 15,610 of 20,282 pass,
  4,082 have no passing record, 590 collected with a named gap.
- **The land #3892 (`claude/s740-land`, `7f00b827`, merged 17:48Z)**, all five working branches as one PR off `main`:
  `reads`, `reconcile`, `piles`, `claude/s740-cerritos` and `claude/s740-reads-cm`.

**Live (each applied or loaded before the land).**
- Passing by reread or load: Cerritos 44984 and 20504 (reread 45837760519, receipt `1a0bd569`); Copper Mountain 41085,
  43132 and 18519 (reads 45836803063, 45842624535, 45855512160, reread 45855997214); Santa Ana 18581, 18582, 19268 and
  31980 (reconcile 45841675928); San Jose City 11 (reread 45847599186, receipt `a15c5aba`); Solano 6 and San Bernardino
  Valley 2 (rereads at 45840125172 and 45844530701, keep-better `3b22ef61` first); Los Angeles Trade-Technical 41150;
  Santa Ana 12242 (read 45842667274, load 45863040323); Orange Coast 03954 and 31217 (read 45858495107 and its reread).
- Named gaps by guarded plans, each with a Sonnet reader's APPLY, a clean md5 pre-read and the conductor's apply, `.apply`
  restored after each: s740a Gavilan 4 (45839224932), s740b Orange Coast 1 (45839553639), s740c College of the Canyons 1
  (45839834306), s740c1 Norco 2 (45847730410), s740c2 Solano 3 (45848030080), s740d Cabrillo 7 (45849528191), s740e El
  Camino 4 (45849791694), s740f Santa Monica 1 (45850056682), s740g Contra Costa 2 (45853194962), s740h Butte 1
  (45853610378), s740i Shasta 18655 (45854815868), s740j Los Angeles Trade-Technical 31089 (45855074670), s740r2 Santa
  Ana 7 (45851366093), s740r3 Copper Mountain 42178 (45855882400), s740c3 San Bernardino Valley 6 (45857815541), s740c4
  San Jose City 4 (45858064730), s740c5 San Jose City 2, s740c6 Solano 42041, s740r4 Copper Mountain 16657 (its
  receipts: lessons, *S740*). Registry plan s740r1 (migrate 45835717010).
- New code: `units_within_printed_range` (50) in `kb/_program_named_gaps.py`, filed only by reviewed key lists; cited
  `course_renumbers` and `course_units` steps in `kb/program_requirements_reconcile.json`; Copper Mountain's hand-entered
  `CATALOG_LINKS` entry dropped from `kb/_build_commons_data_status.py`.

**Pending at the checkpoint's write (16:40Z; the conductor fills the outcome in the places marked).**
- Santa Ana 12242's long read (run 45842667274, dispatched 14:48Z) and its load: read 45842667274 filed 12242 passing at 16:54Z (38.5 against the printed 38.5, $0.11); load 45863040323 inserted it alone (receipt `b6455ebe`).
- Orange Coast 03954, 08664 and 31217's paid read 45858495107 (16:24Z) and its reread: the read filed at 17:04Z ($0.26): 03954 and 31217 pass, 08664 reads unequal; reread (receipt `ddbf12f5`) posted the three at 45858495107, all three failing and unchecked before, so 2 records collected.
- The land #3892: merged at 17:48Z as `7f00b827`, confirmed on `origin/main`, without a final update from `main`, which had moved only by Sam's lightning-round PR (`e965ebb1`), touching none of the land's files (**DECIDED** `d-land-merged-without-main-update-s740`, as `d-display-merged-without-main-update-s731`); `test` green on `c957bda9` (run 45868426477). The closing census: run 45870806616 on `main` (17:51Z, `53a9b577`): 15,640 of 20,282 pass, 4,002 have no passing record (80 fewer than the 12:06Z census's 4,082), 640 are collected with a named gap (50 more); Cerritos 44984 and 20504 already passed in the committed files the census reads, so 80 of tonight's 82 moved its count.
- The display build carrying S740's records, once no apply is in flight, and the Spend line's builders.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's), by the lane's NEXT:
   - The display build carrying S740's records, gate college Glendale, then `harvest-gap-census.yml` on `main`
     (NEXT (2)).
   - Lane 1 (NEXT (3)): the units kind's reviewed keys (Santa Ana 31859 and 21789, Copper Mountain 43854, San Bernardino
     Valley 35833; Shasta 32162 first needs the own-page guard cleared), each with a second reader; Copper Mountain
     14737 and 20094 (`total_differs`); the rule B reader change for San Diego City 22367, with its self-recall and a
     second reader, then one 91-minute capture; Ventura's read behind a second reader of its `tabs_with_prose` opt-in;
     Norco's 11 (a curriQunet reader change) and 30061; the reader and scorer changes still open (El Camino 19861,
     19866, 38948, 43993; Cuyamaca 18634 to 18637; Modesto 35127; Cosumnes River 33542; Coastline 43057; Reedley 30465;
     Los Angeles Pierce 19181; Grossmont 21402; Cuesta 43053, 41744); then a fresh census's wave.
   - Lane 2 (NEXT (5)): the holds by key in lessons *S740* (rereads and page pins), then S720's and S721's rest.
   - The follow-up PR (NEXT (6)): the Porterville 06773 guard first, then S731's four, S739's items, and S740's minors
     (`extracted_run` str to int; the page words that live only in test strings; the LATTC and Shasta test edits; Butte
     33579's sentence; the stale Copper Mountain `named_gaps_s739.json` row for 43132).
   - Step 11: the outline queue is empty until a census, a capture or a verdict row changes (NEXT (1)).
2. **A plain session's, each by its lane's NEXT.** They wait because conductor runs stay on collection (Sam's routine
   prompt of 2026-11-17: *"No new UI, tooling or governance work in conductor runs."*): `common-subjects-reference` and
   `commons` (Sam's plain sessions hold them); `implementation-funding` (27,661 bytes against 20,000: compact the lane
   first, then its NEXT); `cer-procedures` (21,633 bytes: compact first); `commons` (20,625 bytes); `my-college-action-page`;
   `nc-learning-partners`; `repo-size`; `governance-team-enablement`, `library`, `sierra-page-redesign` and
   `common-cr-reference`, each by its lane's NEXT; and the brief's slimming items (`d-slimming-left-to-plain-session-s720`).
   None was worked tonight.

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

Handoff 740's table stands in every row this run did not clear; the rows below changed. Everything else in 740's table
(Porterville 06773, the reader changes, West Valley 35588, Southwestern and Pasadena City, the eLumen follow-up's rest,
the census's relists, S721's, S720's and S713's holds, the follow-up's minors, the artifact for a person, the plain
sessions' items) keeps its owner and its date.

| Block | Who clears it | Since |
|---|---|---|
| The units within-range kind's keys: Santa Ana 31859, 21789; Copper Mountain 43854; San Bernardino Valley 35833; Shasta 32162 (the kind is on `main`; it files only by reviewed key lists, `f-units-within-range-by-key-only-s740`) | Sky, a key list with a second reader | 2026-11-26 (S740) |
| San Diego City 22367: rule B of the reader's page checks reads its entry as descriptions; then a 91-minute capture | Sky, a reader change and a second reader | 2026-11-26 (S739, S740) |
| Santa Ana 12242's long read and Orange Coast 03954, 08664, 31217's read: the results are in *Pending* | Sky, their loads | 2026-11-26 (S740) |
| Ventura 06948, 08253, 35654, 37415, 44994, 44995, 40179: a read behind a second reader of the `tabs_with_prose` opt-in | Sky, lane 2 | 2026-11-26 (S739, S740) |
| Norco: 11 for a curriQunet reader change; 30061 a paid reread. Solano 30184, 30185, 43134 (own-page guard), 38591 (page pin, paid reread). San Bernardino Valley 04873, 04894, 17829, 22784, 22821, 39483. San Jose City 18449, 38499 | Sky, lane 1 | 2026-11-26 (S740) |
| Copper Mountain 14737, 20094 (`total_differs`), 14751, 45594, 14710 (no reading closes them); the stale `named_gaps_s739.json` row for 43132 | Sky, lane 1 and the follow-up | 2026-11-26 (S740) |
| Lane 2's holds by key (the program's own page, no proved live run, not collectable, no kind true, the "Recommended" rule; Shasta 32162, 18625; American River 39731, 39732; Long Beach City 37213; El Camino 19883, 19857, 31319, 42541; Butte 14583, 01312; Santa Monica 43767, 21026; Gavilan 08464, 45357; Cabrillo 11293, 45306, 06352, 06380, 06381, 44992; Contra Costa 01400, 40761, 33660; Los Angeles Trade-Technical 31280, 45285; Santa Barbara City 30746, 43553): lessons *S740* | Sky, lane 2 | 2026-11-26 (S740) |
| Closed-list rescores: Fullerton 33680, 42143; Santa Barbara City 32775 | Sky, the follow-up | 2026-11-26 (S740) |
| The follow-up's minors from S740's readers (lessons *S740*, *Readers' MINORs*) | Sky, the follow-up | 2026-11-26 (S740) |

Cleared tonight: Copper Mountain 41085 (registry and read), 43132, 18519; Cerritos 44984; Santa Ana's Liberal Arts emphases (4 passing); Shasta 18655 and Los Angeles Trade-Technical 41150 and 31089; and, as named gaps by the units kind, Gavilan 08460, 19378, 38787, 41394, Orange Coast 41373 and College of the Canyons 36793.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no reply
since 2026-11-19T23:47Z). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. Sam's words in this session: none. The run acted on his routine prompt of 2026-11-17 (*"Conductor mode is
back for collection only."*; *"Two lanes, never on the same college"*; *"Stop a review after two rounds and send what is
left to Sam or COBIx."*), his collect-with-gaps ruling of the same day (`sam-collect-with-gaps-2026-11-17`) and his work
order of 2026-11-20.

## Decisions (the conductor's, each reversible)

- `d-waived-course-counted-at-range-top-s740`: San Bernardino Valley 22771 and 22776 sum at the top of their printed
  ranges, and `waived_course_counted` stands for both (the gap names the record's own reading fault, which S739's
  within-range rule does not cover).
- `d-copper-mountain-registry-moves-to-reissue-s740`: Copper Mountain's registry row (Sam's Sheet 88 correction, S405)
  moved to the reissued 2026-2027 catalog by plan s740r1; new source evidence reopens a person's save.

Memory rows: `kb/migrations/2026-11-26_s740_cpl_memory_rows.sql` (10 rows, all proposed, INSERT-only with
`ON CONFLICT DO NOTHING`, rollback in its header), drafted by the checkpoint-docs worker, applied by the conductor
(run 45865222835; 10 rows, all proposed; `.apply` restored at `ede596c4`). DECIDED lines: the harvest lane.

## Patterns that worked

- **A land branch for all five working branches** (`d-one-land-for-piles2-and-waves-s739`'s shape), cut off `main` and
  carrying the Cerritos and Copper Mountain read branches whole.
- **A sibling branch for a long read** (`claude/s740-reads-sdcity`, `claude/s740-reads-cm`), so one two-hour read keeps
  its branch and the next worker's plan does not wait on it.
- **A staged free read first** (`sources_from` an earlier capture's artifact stages the pages with no page loaded,
  priced at $0.10), then the paid read with `only=`.
- **Keep-better from the conductor's live read before a reread** (`p-reread-posts-raw-reconcile-keep-better-first-s740`).
- **A second reader on every plan and land** (Sonnet, seven); a clean md5 pre-read before every apply; one apply in
  flight at a time, `.apply` restored after each.

## Findings

- `p-plan-tests-pin-plan-time-census-s740`: four of tonight's plan tests (Norco, Solano, San Jose City, San Bernardino
  Valley) checked the census's `reconcile_steps` members against the plan-time list, so the closing census
  45870806616, which moved the collected rows out of that lever, turned them red on `main` after the land; #3885's
  `lints (1)` caught it. Each now accepts either state: the plan-time lever, or a later census from which tonight's
  passed and named rows have left (a capped lever may list others or be gone). A census-reading plan test is written
  for both states from the start.

- `f-units-within-range-by-key-only-s740`: the kind `units_within_printed_range` files only by reviewed key lists.
- `f-rule-b-refuses-san-diego-city-22367-s740`: the reader's page checks refuse an entry whose child page prints
  descriptions.
- `p-reread-posts-raw-reconcile-keep-better-first-s740`, `p-staged-read-predating-page-counts-held-by-price-step-s740`,
  `p-free-reconcile-cannot-reach-moved-address-records-s740`: three read-pipeline pitfalls (lessons *S740*).
- `p-sandbox-python-311-check-generated-false-stale-s740`: the sandbox's default `python3` is 3.11 and
  `check_generated.sh` prints false STALE lines under it; a 3.12 shim at `/home/user/wt/.py312bin`.
- `p-harness-pins-worker-worktree-s740`: the harness pins each worker to its own `.claude/worktrees/agent-*` worktree
  whatever path the brief names; worker report times ran a few minutes ahead of the conductor's clock.

## Safety patterns to honor

All of handoff 740's. New tonight: a reread runs keep-better against a live read first; the units kind files only by a
reviewed key list; a staged read from an earlier capture needs page counts in that capture, or the price step holds it
(no charge); a record read from an address the registry has since moved takes a paid read of the reissue, not a free
reconcile; no `CPL_READER_PAGE_CHECKS=0` statewide to clear one college; a Commons sidecar built before a reconcile files
is rebuilt after the reread posts. Never file a person's name from an outline page anywhere. A permission-check refusal is
never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Back for collection only*; review rounds as his ruling of 2026-11-20 sets them). Settings block (Sam, 2026-11-11, his
latest change; the block copied from `docs/reference/conductor_mode.md`):

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx; the routine's form sets the model and ultracode;
  medium effort lives in its prompt. Tonight Opus 5.5 served the run (the form names Fable 5.2).
- Ultracode on. The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`); tonight `reads`, `reconcile` and `piles` ran Fable 5.2
  at high effort, the seven second readers and the land ran Sonnet, and the checkpoint worker ran Sonnet.
- A worker building anything that writes shared data or changes an apply runs at **high** effort.
- A review workflow uses **at most 9 agents in all**, readers and second readers together.
- **Cost limits:** $40 per college per run, on the estimate, for program-requirements extraction, and a separate $40 per
  college for SLOs, PLOs and course objectives; per run, never a remaining pot. Paid runs go through the conductor.

Also: two lanes, never on one college; about $750 a day for everything, $10k running total for the whole job; stop
rules from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row;
a rollback that undoes over 1% of a day's rows; the $10k checkpoint. This run aimed at about $250, with no new worker
after about $190; the repo's rates read $180.09 at 16:24Z.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3885 (`claude/awesome-fermat-sqsn0p`) | the declaration, the log and this checkpoint (draft) | merges at sign-off, after one update from `main` |
| #3886 (`claude/s740-display`) | merged `0017cd97` (13:54Z); display build `9e28519af71f` live | none |
| `claude/s740-reads`, `claude/s740-reads-cm`, `claude/s740-reads-sdcity` | s740r1 to s740r4 applied; Copper Mountain's reads and reread live; San Diego City's read refused at the price step | land #3892 (the first two); the third, nothing to land |
| `claude/s740-reconcile`, `claude/s740-piles`, `claude/s740-cerritos` | s740a to s740j, s740c1 to s740c6 applied; Cerritos live | land #3892 |
| #3892 (`claude/s740-land`) | all five branches as one PR off `main` | merged at 17:48Z as `7f00b827`, confirmed on `origin/main`, without a final update from `main`, which had moved only by Sam's lightning-round PR (`e965ebb1`), touching none of the land's files (**DECIDED** `d-land-merged-without-main-update-s740`, as `d-display-merged-without-main-update-s731`); `test` green on `c957bda9` (run 45868426477) |
| Harvest gap census on `main` | 45816008322 (12:06Z): 15,610 pass; after the display build 45833723371 (14:03Z): 15,610 pass, 4,082 without, 590 with a named gap | the closing census: run 45870806616 on `main` (17:51Z, `53a9b577`): 15,640 of 20,282 pass, 4,002 have no passing record (80 fewer than the 12:06Z census's 4,082), 640 are collected with a named gap (50 more); Cerritos 44984 and 20504 already passed in the committed files the census reads, so 80 of tonight's 82 moved its count |
| #3383 | dependabot's | waits |

## Let go

No PR subscription, artifact watch or COBIx watcher was opened tonight, and the run's fallback wakes have all fired with none pending, so there is none to drop.
Workers end with the session; each branch is pushed. The vault note for this run is
`CPLBrain/07-session-notes/2026-11-26-s740-skyskimmer-collection.md` (merged as samueltlee/CPLBrain#873, `d3547b0c`; S739's #872 merged first, `ccc1977e`, under Sam's ruling of 2026-11-21 that vault note drafts merge on their own).

Spend: $206.12 estimate (Opus 5.5 $44.94, Fable 5.2 $141.29, Sonnet $19.68, Haiku $0.21); collection $206.12; 2026-11-26T13:12Z to 2026-11-26T17:55Z.

(A token-count estimate at the repo's list prices (`kb/_spend_meter.py`'s table: Opus 5.5 $4 in, $20 out, $0.20 cache read, $5 cache write), measured from this session's transcripts at 17:53Z, with Fable 5.2 priced at the Opus 5.5 rate as S739 did, since the table names no Fable rate; the sign-off turns after 17:53Z are not in it. The paid reads' own cost, about $1.28 on their meter, is apart.)

Opening line: *Greetings, you are SkyWillet (the next free session number at your start; the routine takes it), see SkySkimmer's (S740) handoff — `docs/session_741_handoff.md` — let's keep rolling with our queue.*

Conductor model: Opus 5.5 (the form names Fable 5.2); session cost about $206.12 (a token-count estimate; get_session is not available here); 82 records collected and live (32 passing by reread or load, 50 named gaps); 0 outline rows added; 2 substantive PRs merged (#3886, #3892), not counting checkpoints.
