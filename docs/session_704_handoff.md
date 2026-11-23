---
title: "Session 704 handoff (from SkyDovekie, S703, the CPL Queue routine's collection run of 2026-11-22)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_714_handoff.md
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows
`docs/session_703_handoff.md` (SkyRazorbill's, S702), which names that session SkyTystie, Session 705; never this file.
**Numbering.** Sam's plain session S702 wrote 703, so this run took S703 and handoff 704. The routine's next session is
**Session 704, SkyKittiwake**, and writes 705; the plain S705 writes 706.

# You are SkyKittiwake (Session 704)

From SkyDovekie (S703), the CPL Queue routine's collection run of 2026-11-22, a conductor run for collection only under
Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358. A **full checkpoint** (lanes moved; Rule 10 data writes
ran: four guarded UPDATEs, rereads, loads), written by the checkpoint-docs worker from 14:48Z while #3686, #3675, #3683,
#3684 and the display build were in flight. The conductor applies the memory rows, runs step 12's headline and harvest
SQL and `--stamp`, and fills the Spend and final lines. Skipped: steps 2 (no KB structure change), 3 (no user-facing
surface changed), 7 (no M-ID pipeline move) and 9 (the UI pass is its own queue item).

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of 2026-11-21), before the
   split.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and read its output
   yourself every few turns; it stops at the two-hour background limit, so restart it. Act on each new
   `<!-- cobix -->` comment; read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3686 (`levers`), #3675 (`glendale`, with Butte), #3683 (the follow-up), #3684 (Peralta, after its
   load), then this checkpoint #3674 (`claude/awesome-fermat-lwf2xm`, carrying `claude/s703-sdcce-load`'s receipt) at
   sign-off. Dependabot's #3383 waits. Each records PR merges `main` once right before its merge, takes `main`'s side
   of a conflicted Commons file and reruns both builders.

## The start

The 10:12Z firing found S701 (Sam's plain session) live with no declared side-session scope, so it stood down. S701
signed off at 11:00Z. At about 11:03Z Sam said, live: *"/coord and keep going. I will be starting another session but
don't let that stop the queue."* This run declared on draft #3674 at 11:08Z and ran beside his plain session S702
(#3673): S702 kept `commons_subjects.js`, `kb/*subject*` and `lanes/commons.md`; this run kept the harvest files.

## The college split (written before any worker started, 11:08Z)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`);
outline fills first, program records second (`r-collect-for-mids-work-order-sam-2026-11-20`). **Lane 1:** `outlines`
(City College of San Francisco's gate, then San Diego College of Continuing Education), `pins` (Clovis, Cosumnes
River), `glendale` (Glendale, Butte). **Lane 2:** `piles` (the general education units rule, the noncredit hours total,
the catalog-wording rules) at every college but lane 1's. **Held to a later slot:** the free page-finding levers.

## Split changes during the run

- 11:25Z: Glendale's 11 have no text, so `only=` refuses them; filed as named gaps (`d-glendale-own-pages-filed-as-gaps-s703`).
  11:33Z: 38973's OBT prints as STV (`d-glendale-obt-stv-prefix-alias-s703`).
- 11:38Z: #3678's second reader held 21 (`d-ge-gap-only-where-no-figure-s703`). Six open PRs against three: `piles`
  built on a local branch until the count dropped.
- 11:44Z: City College of San Francisco's gate refreshed by a free trial (`d-ccsf-gate-refresh-by-free-trial-s703`).
- 11:46Z: Clovis 33432 and 33492 to the follow-up's `through` pin field (`d-clovis-through-pin-to-followup-s703`).
- 11:55Z: #3677's second reader held the load for HMID 535 (`d-legacy-objectives-kept-when-only-copy-s703`); #3679's
  held 19 (`d-hours-gaps-hold-misreads-s703`). 12:13Z: SDCCE loads objectives only (`d-sdcce-load-objectives-only-s703`).
- 12:50Z: the page-finding levers went to a fresh lane 1 worker, `levers` (Ohlone, San Joaquin Delta, Mt. San Antonio,
  Santa Barbara City, Orange Coast); City College of San Francisco's 53 stay for a later run. `piles` signed off; its
  wording rule went to `piles2` once #3679 merged.
- 12:55Z: worker `peralta` (the four Peralta colleges). 13:00Z: the night's one follow-up went to worker `followup`.
- 13:15Z: `levers` dispatches paid reads to $5 a college per run after free pricing (`d-levers-paid-under-5-delegated-s703`).
- After the merges: worker `display` took the night's display build, gate college Cosumnes River.

## What shipped (squash-merged on a green `test`, each thread read)

- **#3676 `d8b5e4ee`:** a recall count binds to its own trial's parser (City College of San Francisco's stale gate).
- **#3678 `5dbc743d`:** the `ge_units_not_read` named gap, 131 records at 29 colleges (migrate 45019924640, 131
  returned, none skipped); the second read held 21 that print a figure.
- **#3679 `94406494`:** three hours gaps, 50 records at 11 colleges (32 not read, 11 differs, 7 within; migrate
  45023631381); the second read held 19.
- **#3677 `50e4bc1d`:** San Diego College of Continuing Education's outlines (index 45016944119, 199 of 228 codes;
  trial 45017581874, 12 of 12; full read 45018663453, 199 pages, all 200); City College of San Francisco's recall
  refreshed (trial 45018845370, 12 of 12 on parser 2629a09a); HMID 535's Legacy Data objectives kept. Load
  45021318423 on `claude/s703-sdcce-load`: 198 objective rows, 1,860 objectives, 198 courses, confirmed live; its
  receipt rides #3674, whose `kb/course_outcomes/.load` stays at `main`'s value so no push re-runs it.
- **#3681 `40b9a2f6`:** Cosumnes River and Clovis pins and own pages (paid reads 45018951701 $0.36 and 45018954283
  $0.23; rereads 45021161151 and 45022017976; load 45022641854): 3 new, 4 replaced, 5 passing. Clovis 33433
  `total_not_printed` and 33491 `total_differs` (migrate 45024254789, 2 of 2).
- **#3685 `be37ec75`:** the `lists_past_their_figure` gap, 17 records at 9 colleges (migrate 45030559364); the second
  read held 12 more, 29 in all.

**In flight at the checkpoint:** #3686 (Ohlone 2 loaded, 45026280729, $0.14; San Joaquin Delta 6 loaded, 45029460149,
$0.36, through prefix aliases IND, ELE and MEC with an A- prefix; 141 filed as named gaps in `no_record_s703.json`);
#3675 (Glendale's 11 filed as named gaps, the OBT to STV alias, Butte 39882 at $0.05, load 45026794241, live and
passing; Glendale 38973's fresh read 45030485543); #3683 (S697's four findings, the `through` pin field, the named-gaps
tag; second reader: merge, three minors fixed; Clovis 33492 passes at $0.15, read 45033577888, reread 45034008640,
load 45034109582; 33432 at coverage 0.933 with no total); #3684 (Peralta: index 45025388165, 2,201 codes, 376 shared;
trial 45030224450, 11 of 12; full read 45031089800, 1,869 pages in 5 parts, queued 14:07Z, part 1 filed 14:38Z).

**The display build and the census:** deferred to you. `main`'s `test` broke at the daily update `cbcfeee7` (rebuilt on
`be37ec75`): `tests/subject_decisions_noncredit_test.py` check (3), "nothing else moves", reports
`[["los_angeles_pierce", "OLD"]]` after the day's synced subject saves. It fails on `main` and on every PR that takes
`main`, so #3686, #3675 and #3683 could not merge, and the display build (worker `display`'s plan: gate college Cosumnes
River, 192 programs, then the whole build, about 18,629; `program-requirements-college.yml` `step=display`) waits for
them. The Subjects files are S705 SkyTystie's (#3687); S703 reported it there at 15:11Z (comment 7081112623) and left
the fix to that writer. The census `harvest-gap-census.yml` ran on `main` at 15:14Z (45037095240, `29e2a88d`) and then
broke three S703 tests, which read the live census: it reads the 131, 50 and 17 planned programs collected. **#3689**
(`claude/s703-gap-tests-frozen-census`) freezes the plans' census in `tests/fixtures/harvest_gap_census_s703_plans.json`
and carries #3687's Subjects hunk byte for byte, so it clears both red checks on `main`
(`p-test-reads-live-census-s703`: a test of an applied plan reads the census it was built from). It merged at 16:06Z (`5ecfc451`); the CER procedures run 45039686524 then broke
`tests/exhibits_review_card_panels.test.js` (it folded one of Sam's CAL FIRE pair), fixed on `main` by `68e839fb`. Merge
#3686, #3675, #3683 and #3684 one at a time, each merging `main` again. Read the census's count at your start. The headline at 15:13Z: 15,349 of 20,282 active programs pass the machine checks, at 118 colleges (15,334 at the
brief).

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S703*; `docs/reference/conductor_mode.md`, *What went wrong in S703*;
[`methodology-a-test-must-not-take-its-rule-as-the-truth`](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md),
*A named gap's self-recall*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (outline fills first):
   - **Peralta's load first**, once read 45031089800 lands: a dry run, then `.load` with `host=lan` and
     `slugs=laney,merritt,college_of_alameda,berkeley_city`.
   - Land #3686, #3675 and #3683, one at a time; then the next display build and `harvest-gap-census.yml` on `main`.
   - City College of San Francisco's gate is fresh: its next outline read can run.
   - Lane 2: the wording rules at Glendale (28), Clovis (14) and City College of San Francisco (28), each with a claim
     check, boundary readings and a precision count before its second read.
   - The next follow-up's minors (lane NEXT (2)), after the waves.
2. **A plain session's, each by its lane's NEXT** (conductor runs stay on collection): `commons` (the Subjects page's
   one Save for every college, then the hand-over box); `cer-procedures` (the pair apply; compact the lane first, it is
   over 20,000 bytes); `repo-size` (dispatch `receipt-slim.yml` `mode=apply` outside the cron windows, then the
   spreadsheet export and videos, the timed workflows' commits, the session trim, `START_HERE.md` and the `CLAUDE.md`
   cut; Part 5 on Sam's go); `common-subjects-reference` (ECONMT and Electricity's adult-education codes); `library`
   (deploy #3600, then part 4, then part 3).

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| The 30-day artifact `course-outcomes-45026998155-part1` holds trial pages that print a staff name: delete it | a person | 2026-11-22 (S703) |
| Peralta's load (dry run, then `.load` `host=lan`) | the next session | 2026-11-22 (S703) |
| The next follow-up's minors: SDCCE's 6 SLO-label rows; Peralta's 4 parse minors; Los Angeles Harbor 44271, Los Angeles Trade-Technical 44345 and 45670; Orange Coast 03997, 08668, 12159; the hours reconcile eight (Laney 38970, 39365, 39366, 39368, 43451; De Anza 41176; Mendocino 43158; Coastline 42718); Mt. San Antonio 43777 and 43999 (capture reach); Glendale's data-names-the-program lever; the coarse-net hyphen; the `sources_from` pinned refusal; the `through` window's `until` field | Sky, the next follow-up | 2026-11-22 (S703) |
| The Commons shows SDCCE's 6 SLO-label rows as outcomes | Sky, the next follow-up | 2026-11-22 (S703) |
| City College of San Francisco's Cal-GETC dry run (32080, 33652, 46300): the permission check refused it twice | a plain session | 2026-11-21 (S691) |
| Golden West's 476 outline header rows: the guarded correction | a plain session's review | 2026-11-20 (S690) |
| Cerritos 20504: its run also holds 44984, held for a person | a person, on 44984 | 2026-11-21 (S697) |
| Records held for a person: College of the Canyons 43388, West Los Angeles 46261 and 38677, Napa Valley 19126, 31158 and 36528, Los Angeles Harbor 44947, Cerritos 44984, Los Angeles Mission 44849, Los Angeles City 32832, Ventura 45355, Shasta 18153 | a person | S653 to S691 |
| Clovis's 14 and Glendale's 12 that the reader or scorer reads wrongly | Sky, lane 2's wording rules | 2026-11-21 (S697) |
| College of the Desert's 8: the prior catalog sits behind robots.txt | the college, or another source | 2026-11-20 (S689) |

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current). The vault
note (`samueltlee/CPLBrain#846`, draft, branch `claude/pensive-archimedes-lwf2xm`) quotes his words below, adds no
ruling and merges on its own checks (`r-vault-notes-merge-on-checks-sam-2026-11-21`).

## Decisions Sam made

1. **2026-11-22, about 11:03Z, live:** *"/coord and keep going. I will be starting another session but don't let that
   stop the queue."* (`d-coord-and-keep-going-sam-2026-11-22`). A decision for tonight; it adds no standing ruling.

## Decisions (the conductor's, each reversible)

`d-glendale-own-pages-filed-as-gaps-s703`, `d-glendale-obt-stv-prefix-alias-s703`, `d-ge-gap-only-where-no-figure-s703`,
`d-hours-gaps-hold-misreads-s703`, `d-ccsf-gate-refresh-by-free-trial-s703`, `d-clovis-through-pin-to-followup-s703`,
`d-clovis-management-is-the-standalone-degree-s703`, `d-clovis-two-gaps-existing-rules-s703`,
`d-legacy-objectives-kept-when-only-copy-s703`, `d-sdcce-load-objectives-only-s703`, `d-levers-paid-under-5-delegated-s703`,
`d-lan-parse-parts-in-lan-fingerprint-only-s703`, `d-lan-outcomes-only-host-s703`, `d-lists-gap-holds-claim-false-s703`,
`d-lists-gap-holds-range-sums-s703`, `d-sjdelta-prefix-alias-stopgap-s703`. DECIDED lines: the harvest lane. Memory
rows: `kb/migrations/2026-11-22_s703_cpl_memory_rows.sql` (rollback beside it), not pointed at by `.apply`; the
conductor applies it with one `execute_sql` call.

## Patterns that worked

- A second reader on every named gap before its apply: four applies, 200 rows, 69 held by key.
- Free pricing with `only` before each paid read: $1.29 of extraction in all.
- A fresh free trial to refresh a stale recall gate; per-college prefix aliases as a stopgap.
- One writer per file beside Sam's plain session, the queue kept running.

## Safety patterns to honor

All of handoff 699's. New tonight: `p-self-recall-reads-rule-fields-s703` (a held answer from the rule's own fields
measures nothing: a claim check, boundary readings, a precision count); `p-sources-from-refuses-pinned-refused-s703`
(read fresh); `p-merge-head-push-starts-no-read-s703` (dispatch by plan name); `p-global-fingerprint-stales-every-gate-s703`
(per-host fingerprints); `p-lan-not-outcomes-only-filed-names-s703` (an outline host is outcomes-only before any trial
files a page); `p-records-prs-merge-one-at-a-time-s703`; `p-test-check-after-lints-s703` (no `test` yet is pending,
never green). A push of a branch whose trigger file differs from `main`'s starts that job again: keep each trigger at
`main`'s value on a branch that has run it. Never file a person's name from an outline page anywhere. A
permission-check refusal is never routed around.

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
| #3674 (`claude/awesome-fermat-lwf2xm`) | the declaration and this checkpoint, carrying `claude/s703-sdcce-load`'s receipt | merges at sign-off |
| #3676, #3678, #3679, #3677, #3681, #3685 | merged | none |
| #3689 (`claude/s703-gap-tests-frozen-census`) | merged `5ecfc451` (16:06Z): `main`'s two red checks cleared | none |
| #3692 (`claude/s703-exhibits-test-frozen-titles`) | closed: `68e839fb` (another session) fixed the exhibits check the CER run 45039686524 broke | none |
| #3686 (`claude/s703-levers`) | open | merge, one at a time |
| #3675 (`claude/s703-glendale-butte`, Butte on `claude/s703-butte`) | open; 38973's read 45030485543 | merge after the read |
| #3683 (`claude/s703-followup`) | open; second reader: merge | merge |
| #3684 (`claude/s703-peralta-outlines`) | open; read 45031089800 | the load, then merge |
| `claude/s703-outlines-ccsf-refresh` | its content rode #3677 | none |
| `samueltlee/CPLBrain#846` (the vault note) | draft | merges on its own checks |
| #3383 | dependabot's | waits |

## Let go

No PR subscription was taken (the run gated each PR by reads), no check-in is scheduled, and no artifact is watched.
The COBIx watcher stopped at its two-hour limit at 13:08Z; single polls to 15:03Z found nothing new. Workers end with
the session; their branches are pushed. The main checkout was left detached.

Spend: $245.00 (estimate from token counts at list prices; Opus 5.5 $236.00, Haiku 5.5 $9.00); collection $215.00, infrastructure $30.00; 2026-11-22T10:12Z to 2026-11-22T17:20Z. The paid extraction runs' own cost, $1.29 (Cosumnes River $0.36, Clovis $0.23 and $0.15, Butte $0.05, Ohlone $0.14, San Joaquin Delta $0.36), is listed apart.

Opening line: *Greetings, you are SkyKittiwake (Session 704), see SkyDovekie's (S703) handoff — `docs/session_704_handoff.md` — let's keep rolling with our queue.*

This session's cost: about $245 at list prices (no `get_session` in this session; estimated from the session's and its workers' token counts) plus $1.29 of paid reads. Records collected: 218 (12 new, 6 replaced, 200 collected with a named gap), and 152 more programs filed as no-record gaps. Outline rows added: 198. Substantive PRs merged: 7 (#3676, #3677, #3678, #3679, #3681, #3685, #3689).
