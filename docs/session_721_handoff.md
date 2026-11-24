---
title: "Session 721 handoff (from SkyEider, S720, the CPL Queue routine's collection run of 2026-11-24)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
plain-session handoff, `docs/session_720_handoff.md` (S719 SkyShearwater's, for SkyCormorant), never this file.
**Numbering.** Handoff 716 named the routine's next session SkyPetrel, but Sam's plain session S718 took that name and
plain sessions took 715 to 719, so this run is S720, the next free number, and writes 721, one above the highest on
`main` (`d-routine-takes-next-free-number-s713`). Its name is **SkyEider**: both named monikers were held (SkyPetrel by
S718, SkyCormorant by handoff 720 for Sam's next plain session), so the run took an unused one
(`d-routine-moniker-fresh-on-collision-s720`). If Sam's SkyCormorant starts while this runs, it takes the next free
number above this run's. The routine's next session is **SkySkua**: it takes the next free session number at its
start and writes the handoff one above the highest on `main`.

# You are SkySkua, the routine's next session

From SkyEider (S720), the CPL Queue routine's 06:12Z firing of 2026-11-24, a conductor run for collection only under
Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Mon Nov 23, written 6:45 PM PT), served by Opus 5.5
(the form names Fable 5.2). A **full checkpoint** (lanes moved; Rule 10 data writes ran: thirteen guarded applies,
three loads and the display build), written by the checkpoint-docs worker from 08:45Z while #3752, #3758 and #3759
were open; the conductor brings it to its final state: the memory rows (step 10), the vault note (step 11), step 12,
and the census, Spend and last lines below. Skipped: step 2 (tonight's code changes sit inside the harvest's own
scorer, reader and gap files, which the lane and lessons document; no KB structure or generator changed), step 3 (no
user-facing surface changed), step 7 (no re-mint and no auditor counts moved) and step 9 (the UI pass is its own
queue item).

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (Mon Nov 23, 6:45 PM PT), and comment 7064588752 (Sam's two
   rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712 (handoff 715): *"No need for the Cobix check ins for now"*.
   Start none unless he asks (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge
   it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Workers share the clone's object store, so fetch a branch by name with `--shallow-since` or
   `--deepen`, never `--depth` (`p-shared-shallow-clone-reshallows-s713`). A new branch gets a fresh worker
   (`p-harness-keeps-worker-in-its-worktree-s714`).
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints
   match. Stop a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at this writing (09:10Z):** #3758 (the ten piles branches), then #3759 (Los Rios), each with one
   update from `main` right before its merge, `main`'s side of a conflicted Commons file and both builders rerun;
   #3752 (the lever) once San Bernardino Valley's load and Santiago Canyon's read land; this checkpoint, #3751, at
   sign-off. #3755 closes with a pointer to #3758. Dependabot's #3383 waits.

## The start (06:12Z firing, 2026-11-24)

- Step 0: no `daily-dashboard.yml` run created on UTC 2026-11-24, so the run dispatched it on `main` at 06:16Z.
- One writer: no `list_sessions` or `get_trigger` here. Open PRs: only dependabot's #3383. `main`'s head is S719's
  checkpoint #3750 (`56c38abf`, 04:25Z); S719 signed off at 03:37Z. No live session.
- No pause line (handoffs 716 and 720). Three repos attached. Sheet 200: no reply since 2026-11-19. `queue_todo_done`
  since 2026-11-23: none. No exhibit re-analysis request open. Library: two requested briefs and three revise
  requests, the daytime Library run's; one CER procedure request (2026-11-19), a plain session's.
- Step 11: `python3 scripts/next_slo_colleges.py --next` says the queue is empty.
- Census on `main` (run 45319725062, 03:32Z): of 20,282 active programs, 4,495 have no passing record; 320 are
  collected with a named gap.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` first, while no apply is in flight: one display build carrying the records applied after S713's build
    (#3708) and S714's, gate college Glendale, then the whole build, then `harvest-gap-census.yml` on `main`.
  - `fill` (high effort), the fix that blocks every reconcile: measure `f-elective-fill-passes-cut-off-windows-s714`
    statewide (read-only), fix the fill and `f-rescore-drops-ge-units-not-read-gaps-s714`, then the 9 Los Rios records
    held for it (Sacramento City, Cosumnes River, Folsom Lake).
  - `lever` (high effort): the reader-page lever at San Bernardino Valley 16, Los Angeles Southwest 9, Mendocino 6 and
    Santiago Canyon 6; American River's 5 after a checked filing. Free page reads and pins first; paid reads with
    `only=` at most $5 a college on the estimate; no reconcile until `fill` merges.
- **Lane 2 (cheap piles, one worker at a time, high effort):** the holds by key in handoff 716's block table that Sky
  clears: Fullerton 13, City College of San Francisco 26, College of the Sequoias 9, Clovis 8, Santa Monica 23, East
  Los Angeles 8, Glendale 3 (after the display gate), Las Positas 01037 and 09227 with Antelope Valley 39295, Santa
  Barbara City 05934, College of Marin's moved-page guard. Then the records the table marks for a person, collected
  each with its gap named and a lower confidence (`sam-collect-with-gaps-2026-11-17`), at those colleges and at College
  of the Canyons, West Los Angeles, Napa Valley, Los Angeles Harbor, Cerritos, Los Angeles Mission, Los Angeles City,
  Ventura, Shasta and De Anza. Then the census's next wording-rule piles (Contra Costa 22, El Camino 22, Ventura 22,
  Cabrillo 21). No lane 2 plan passes a record through the program-level fill before `fill` merges.

## Split changes during the run

- 06:24Z to 06:26Z: `fill`, `lever` and `piles` started on Opus 5.5 at high effort.
- 06:29Z to 06:43Z: the display build `abf1f6396156` (18,666 records): Glendale gate 45340786385 (242 rows), whole
  build 45341895811 (18,423 rows); live 18,665 at the build, the same 32 at older builds; #3754.
- 06:38Z: `lever`'s page read 45341735139 (its push) and American River's free read 45341899083 on #3752.
- 06:52Z: Fullerton's plan on #3753 (9 collected with named gaps, 4 held) went to a second reader; `piles` took City
  College of San Francisco.
- 07:00Z to 07:20Z: #3754 merged (`79a534fb`); the census dispatched on `main`. Fullerton's reader, FIX THEN APPLY
  (35174 read from a shared page; 33680 and 42143 pass under the printed floor): 6 rows, round 2 APPLY. #3756's
  reader, FIX THEN MERGE (four findings). #3752's reader, DISPATCH, merge after three fixes.
- 07:18Z to 07:31Z: applied and confirmed live: Fullerton 6 (migrate 45346957909), College of the Sequoias 7
  (45347712879), Clovis 3 (45348350867). Mendocino's paid read 45348021173 landed; Los Angeles Southwest's dispatched.
- 07:3xZ: East Los Angeles's pre-read found 02456's live row on an older extraction than its committed record: held,
  the plan rebuilt at 3 (`p-preread-catches-older-live-extraction-s720`).
- 07:40Z to 08:00Z: applied and live: Glendale 2, East Los Angeles 3, City College of San Francisco 17 (45351319471),
  Santa Monica 20 (45352015658); loaded: Mendocino 6 and Los Angeles Southwest 5 (all passing, $0.60 paid).
  Santiago Canyon's paid read failed before extraction, nothing paid: its registry row now names
  `SCC_2026_2027_Catalog_accessible.pdf` (1,165 pages), so its pins wait on a page read of that file.
- 07:53Z: `land` started (one PR for the six applied piles branches). #3753 merged (`949c3194`); #3756 merged
  (`35854487`) after a local merge with `main` passed the gap tests. `fill` took `claude/s720-rios` (AR 04544's
  apply, then the Los Rios reconciles). Contra Costa 17 and El Camino 15 at an Opus reader.
- 08:06Z: American River 04544's false pass corrected (migrate 45353104736, checks only).
- 08:10Z: Modesto Junior's plan filed (8 `pool_figure_not_read` named gaps, 13 held), then held unapplied: 7 of its 8
  pass today's scorer once the parent figure is read as one pool (`d-modesto-held-pooled-rule-s720`).
- 08:11Z to 08:16Z: Ventura 5 (45353655553) and Cabrillo 8 (45354440999) applied and live.
- 08:18Z to 08:33Z: the three free reconciles filed (Sacramento City 45353709365, Cosumnes River 45355422235, Folsom
  Lake 45356831201), each kept only the records it was for (`d-rios-reconcile-keeps-only-targets-s720`); Cosumnes
  River left `kb/collection_lane.py`'s collection lane (a stale S681 hold). American River's paid read 45353541681
  ($0.30) filed and loaded (45355395211), 5 passing.
- 08:36Z to 08:40Z: Contra Costa 16 (45357364157) and El Camino 14 (45357874656) applied and live.
- 08:44Z to 08:46Z: the nine `section_cut_off` named gaps (45358426469). A staged commit that still carried the plan's
  `.apply` fired migrate 45358888504 after the conductor had restored it; the plan's guard aborted it with nothing
  written (`p-one-apply-writer-per-branch-s720`). Sacramento City's four kept `ge_units_not_read` records went back to
  `main`'s filing for one reread.
- 08:45Z: the checkpoint-docs worker started. 08:52Z: San Bernardino Valley's paid read of 15 filed (45355976381,
  $0.93), its load next. 08:55Z: `land` had all ten branches in #3758 (`127a5c04`); #3759 open at `5941ee65`.

Off the queue tonight (Sam's routine prompt: *"No new UI, tooling or governance work in conductor runs."*): the brief's
section 1 slimming items and section 4 go to a plain session, as section 4 item 3 provides
(`d-slimming-left-to-plain-session-s720`).

## What shipped

- **#3754 `79a534fb`:** display build `abf1f6396156`, 18,665 rows live at the build (above).
- **#3753 `949c3194`:** Fullerton's 6 held records collected with named gaps (migrate 45346957909); 7 held.
- **#3756 `35854487`:** no electives fill over a cut-off window (`fill_refused`, `section_cut_off`), and a reconcile
  keeps a filed named gap its rule still names (`keep_named_gaps`); the statewide rescore of 18,960 committed records
  takes away 15 false passes and adds none.

**Applied or loaded and live, in open PRs:**
- **#3758** (`claude/s720-piles-land`): College of the Sequoias 7, Clovis 3, East Los Angeles 3, Glendale 2, City
  College of San Francisco 17, Santa Monica 20, Ventura 5, Cabrillo 8, Contra Costa 16, El Camino 14 (95 records, each
  collected with a named gap; run ids in the lessons, *S720*).
- **#3759** (`claude/s720-rios`): American River 04544's false pass corrected (45353104736) and nine `section_cut_off`
  named gaps (Sacramento City 04656, 04688, 07350, 21418; Cosumnes River 04602, 04614; Folsom Lake 15368, 39574, 42612;
  45358426469) after three free reconciles. Its records differ from `main` only in those ten rows; Folsom Lake 38736
  was not rescored by its reconcile.
- **#3752** (`claude/s720-lever`): Mendocino 6, Los Angeles Southwest 5 and American River 5 loaded, all passing, $0.90
  paid; 7 named gaps filed at Los Angeles Southwest and Santiago Canyon; San Bernardino Valley's read of 15 filed
  ($0.93), its load next; Santiago Canyon re-pinned to its accessible catalog, its read pending.

**At this writing:** 126 records live (101 collected with named gaps at eleven colleges, 9 named gaps at Los Rios, 16
passing loads); 0 outline rows (step 11's queue is empty).

CENSUS_LINE

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S720*; `docs/reference/conductor_mode.md`, *What went wrong in S720*;
[`methodology-a-fill-must-check-what-it-fills`](kb-notes/methodology-a-fill-must-check-what-it-fills.md), *S720*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's):
   - Land #3758 and #3759, then #3752 (merge order above); then the display build carrying tonight's records, gate
     college Glendale, then `harvest-gap-census.yml` on `main` (NEXT (8)).
   - The one follow-up PR, after the waves (NEXT (3)): S713's minors (SDCCE's 6 SLO-label rows first), COBIx's
     `f-cobix-minors-s713` and `f-cobix-minors-s714` with East Los Angeles's free reconcile (`extract=0`), Cerritos
     35166's pin (the whole-major exception), the free rules the plans leave for tomorrow (City College of San
     Francisco's own-option reading for 17615 to 17618; Cabrillo's recommended lists for 06352, 06380, 06381, 44992),
     and San Bernardino Valley 32317's rule-B skip with its test's marking.
   - Modesto Junior's pooled rule, then its 8, and a check of the `pool_figure_not_read` rows applied elsewhere
     against it (NEXT (3a)).
   - Lane 2: the next piles at Palo Verde 20 and Orange Coast 20, then Modesto's 10 unread holds (NEXT (6)).
   - Lane 1: the lever's next colleges from the census's Next wave: Antelope Valley 10, Orange Coast 8, Saddleback 7,
     College of the Redwoods 5, MiraCosta 5 (NEXT (5)); Sacramento City's one reread for its 26 course-id gains and 4
     kept gaps (NEXT (2)).
   - Step 11: the outline queue is empty until a census, a capture or a verdict row changes (NEXT (1)).
2. **A plain session's, each by its lane's NEXT.** They wait because conductor runs stay on collection (Sam's routine
   prompt of 2026-11-17: *"No new UI, tooling or governance work in conductor runs."*):
   - the brief's slimming items, its sections 1 and 4 (`d-slimming-left-to-plain-session-s720`);
   - `commons` and `common-subjects-reference`: Sam's next plain session, SkyCormorant, takes them from handoff 720's
     open work (#3748's merge; Southwestern's PE to ES line; the MICROTK to IT line; a per-code courses file; the MQ
     sections from the 20th edition; then the re-point of the folded local codes);
   - `cer-procedures` (compact the lane first, 21,633 bytes against 20,000), `my-college-action-page`, `repo-size`,
     `governance-team-enablement`, `implementation-funding`, `library`, `sierra-page-redesign` and
     `common-cr-reference`, each by its lane's NEXT.

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| Tonight's holds by key, each reason in its plan's receipt: Fullerton 7, City College of San Francisco 9, Santa Monica 3, College of the Sequoias 2 (06770, 45030), Clovis 5, East Los Angeles 6 (33013 among them), Glendale 1 (45068), Ventura 17, Cabrillo 13, Contra Costa 6, El Camino 8 | Sky, lane 2 (a person for 33013) | 2026-11-24 (S720) |
| Modesto Junior's plan of 8 `pool_figure_not_read` gaps, held unapplied; 13 held (06683, 35127, 42664 and 10 unread) | Sky, the pooled rule first | 2026-11-24 (S720) |
| The free rules: City College of San Francisco 17615 to 17618 (own-option reading); Cabrillo 06352, 06380, 06381, 44992 (recommended lists); Fullerton 33680, 42143 and Ventura 30587 (a closed-list rescore) | Sky, the follow-up | 2026-11-24 (S720) |
| San Bernardino Valley 32317 (its rule-B skip and its test's marking); Cerritos 35166 (a pin, the whole-major exception) | Sky, the follow-up | 2026-11-24 (S720) |
| Santiago Canyon's 3 pins on the accessible catalog: its paid read | Sky, lane 1 | 2026-11-24 (S720) |
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
| College of the Desert's 8: the prior catalog sits behind robots.txt | the college, or another source | 2026-11-20 (S689) |

Cleared tonight: handoff 716's rows on the fill over cut-off windows (#3756; the nine `section_cut_off` gaps, #3759),
the rescore's dropped gaps (#3756) and American River's 5 (refiled and loaded, #3752); its Fullerton, City College of
San Francisco, College of the Sequoias, East Los Angeles, Santa Monica, Glendale and Clovis rows fold into tonight's
first row.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no new
answers since 2026-11-19). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. The run acted on his routine prompt of 2026-11-17 (*"No new UI, tooling or governance work in conductor
runs."*; *"Stop a review after two rounds and send what is left to Sam or COBIx."*) and his collect-with-gaps ruling
of the same day.

## Decisions (the conductor's, each reversible)

- `d-routine-moniker-fresh-on-collision-s720`: both named monikers were held, so the run took an unused one.
- `d-slimming-left-to-plain-session-s720`: the brief's sections 1 and 4 go to a plain session.
- `d-piles-land-as-one-pr-s720`: the ten applied piles branches land as one PR, #3758, under the PR cap.
- `d-conductor-owns-applies-s720`: workers never push `.apply`; the conductor applies after an APPLY verdict and a
  clean pre-read, then restores `.apply`.
- `d-rios-reconcile-keeps-only-targets-s720`: each Los Rios reconcile keeps only the records it was for.
- `d-sbvc-without-32317-s720`: San Bernardino Valley's paid read went without 32317, with no third review round.
- `d-fill-merged-after-local-main-merge-s720`: #3756 merged once a local merge with `main` passed the gap tests.
- `d-modesto-held-pooled-rule-s720`: Modesto Junior's plan stays unapplied until the pooled rule.
- `d-display-merged-without-main-update-s720`: #3754 merged without an update from `main`, which had moved only by the
  daily dashboard commit, touching none of its four files.

Memory rows: `kb/migrations/2026-11-24_s720_cpl_memory_rows.sql` (23 rows, rollback in its header), not pointed at by
`.apply`; the conductor applies it with one `execute_sql` call. DECIDED lines: the harvest lane.

## Patterns that worked

- **A pre-read that compares live and committed runs** (`p-preread-catches-older-live-extraction-s720`): plans carry
  `on_live_run` and hold a record whose live row is an older extraction.
- **The own-page guard** (`p-own-page-guard-shared-pages-s720`): a page `shared_pages` lists with another program is
  never a record's own.
- **The `scorer_passes` guard** (`p-scorer-passes-guard-s720`): a record today's scorer passes is never gap-filed.
- **A cap in `confidence()`** (`p-cap-lives-in-confidence-s720`): a recompute through `keep_named_gaps` keeps it.
- **One writer of `.apply` per branch** (`p-one-apply-writer-per-branch-s720`): the plan's guard aborted the one stray
  run with nothing written.
- A second reader on every plan before its apply, each apply proved first on a local Postgres 16 (it writes exactly
  N; a rerun and a matching confirm abort; the rollback restores), and free rule work first: 101 named-gap records
  and 9 Los Rios gaps for no paid read.

## Findings

- `f-pool-figure-gaps-pass-when-pooled-s720`: 7 of Modesto's 8 pass once the parent figure is one pool; applied
  `pool_figure_not_read` rows elsewhere may pass under it.
- `f-cabrillo-recommended-lists-rule-s720` (06352, 06380, 06381, 44992) and `f-ccsf-own-option-reading-s720` (17615
  to 17618): free rules for the follow-up.
- `f-fullerton-shared-page-passing-s720`: 15 of Fullerton's 296 passing records are not on their own page.
- `f-scc-registry-file-changed-s720`: Santiago Canyon's registry row moved to a 1,165-page accessible catalog.
- `f-sbvc-32317-rule-b-s720`: San Bernardino Valley 32317's rule-B skip.
- `f-sacramento-city-course-id-gains-s720`: 26 plus 4 records await a reread.
- `f-fill-refuses-cut-window-s720`: #3756 closes S714's two fill findings.

## Safety patterns to honor

All of handoff 716's: a test never reads the live census for its members, it pins them in a fixture
(`p-test-pins-census-members-s714`); a CI run that dies at `npm install` on a 404 may be a package published seconds
before, so read `npm view <pkg> time` before pinning (`p-fresh-release-404-reruns-s714`); one dispatch at a time per
branch; a fresh worker per branch; the claim check reads today's capture. New tonight: one writer of `.apply` per
branch, and a worker pulls before it commits once the conductor has touched its branch; `on_live_run`, the own-page
guard and `scorer_passes` on every plan; a reconcile keeps only the records it was for. Each apply put `.apply` back
to `main`'s value after its run, so no merge carries a live trigger. Never file a person's name from an outline page
anywhere. A permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about $750 a day for
everything, $10k running total for the whole job; workers on Opus 5.5, high effort on any worker that writes shared
data; reviews at most 9 agents, stopped after two rounds with what is left sent to Sam or COBIx; $40 per college per run
for program requirements and a separate $40 for SLOs, PLOs and course objectives, per run, never a remaining pot. Stop
rules from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline
row; a rollback that undoes over 1% of a day's rows; the $10k checkpoint. The form names Fable 5.2; this run is served
by Opus 5.5.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3751 (`claude/awesome-fermat-398ayl`) | the declaration and this checkpoint | merges at sign-off |
| #3754 | merged `79a534fb`; display build `abf1f6396156` live | none |
| #3753 | merged `949c3194`; applied by migrate 45346957909 | none |
| #3756 | merged `35854487` | none |
| #3758 (`claude/s720-piles-land`, `127a5c04` at 08:55Z) | the ten piles branches, 95 records applied and live | `test`, one update from `main`, the merge |
| #3759 (`claude/s720-rios`, `5941ee65`) | American River 04544 and the nine `section_cut_off` gaps, applied and live | `test`, the merge after #3758 |
| #3752 (`claude/s720-lever`, `f465b972` at 08:52Z) | 16 records loaded; San Bernardino Valley's read filed (45355976381), its load next; Santiago Canyon's read pending | the load and the read, then the merge |
| #3755 (`claude/s720-piles-ccsf`) | City College of San Francisco's 17, applied, landing in #3758 | closes with a pointer to #3758 |
| `claude/s720-piles-modesto` (`a6d019a4`) | Modesto Junior's plan, held unapplied | the pooled rule |
| Harvest gap census 45345225943 on `main` | `d24901b0` (07:08Z) | the next after tonight's display build |
| #3383 | dependabot's | waits |

## Let go

The brief names no PR subscription, scheduled check-in or artifact watch: the run gated each PR by reads. No COBIx
watcher ran (Sam's word of 2026-11-23). Workers end with the session; each branch is pushed. The local Postgres 16
used for the apply proofs stops at sign-off.

SPEND_LINE

Opening line: *Greetings, you are SkySkua (Session 721), see SkyEider's (S720) handoff — `docs/session_721_handoff.md` — let's keep rolling with our queue.* (If a plain session has taken 721 by then, take the next free number and say so.)

FINAL_LINE
