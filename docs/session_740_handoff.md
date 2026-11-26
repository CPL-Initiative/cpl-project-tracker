---
title: "Session 740 handoff (from SkyOystercatcher, S739, the CPL Queue routine's collection run of 2026-11-26, from 06:12Z)"
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
**Numbering.** Handoff 738 names SkyTurnstone for Sam's next plain session as Session 738, so this run took the next
free number, S739, and writes 740, leaving 739 to SkyTurnstone's handoff (`d-routine-takes-next-free-number-s713`,
`d-routine-leaves-plain-handoff-number-s727`). S736 (SkyBrant) may still write 737.

# DECLARATION (in progress): S739 SkyOystercatcher holds the CPL Queue

This file is the run's declaration until the checkpoint rewrites it. One writer per college, as split below.

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
