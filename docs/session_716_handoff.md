---
title: "Session 716 handoff (from SkyFulmar, S714, the CPL Queue routine's collection run of 2026-11-23)"
created: 2026-11-23
updated: 2026-11-23
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
plain-session handoff, `docs/session_715_handoff.md` (S712 SkyPuffin's, for SkyAlbatross, Session 715), never this
file. **Numbering.** Handoff 714 named the routine's next session SkyFulmar, Session 714; no plain session took 714,
so this run is S714. S712's #3712 merged handoff 715 at 11:52Z while this run's declaration held 715, so this run
writes 716, the next free number (`d-routine-takes-next-free-number-s713`).

# DRAFT: the declaration of a live run

SkyFulmar (S714), the CPL Queue routine's 11:12Z firing of 2026-11-23, a conductor run for collection only under
Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358. This draft is the sign another firing reads: the run
is live while its PR is updated within the half hour. It becomes the Rule 9 checkpoint at sign-off.

## The start (11:12Z firing, 2026-11-23)

- Step 0: S713's 06:12Z firing dispatched `daily-dashboard.yml` at 06:16Z; the day's update landed at 06:23Z
  (`a588fc77`). Nothing to dispatch.
- One writer: no `list_sessions` or `get_trigger` in this session, so the run read the open PRs. #3704 (S713's
  checkpoint) was updated at 11:11Z, a live session at its last step, so this firing waited for its sign-off before
  writing anything; it merged at 11:31Z (`3145d379`), and this run took the queue then. #3712 (S712 SkyPuffin, Sam's plain session, created 11:09Z) declares its scope: the re-mint
  readiness gate, the statewide subject list and three read plans; this run stays off its files
  (`kb/_mid_readiness.py`, `kb/_statewide_subject_codes.py`, `kb/status/mid_outcomes_compare_*`,
  `kb/college_reads/s712_*`) and off the three colleges its read plans probe (Allan Hancock, Bakersfield, Antelope
  Valley). Dependabot's #3383 waits.
- No pause line in handoff 714. Three repos attached. Sheet 200's replies: none since 2026-11-19 (the `done` row at
  23:47Z). `queue_todo_done` since 2026-11-22: none. No exhibit re-analysis request open. Library: two requested
  briefs and three revise requests stand from 2026-10-26 to 2026-11-13 (the daytime Library run's); one CER procedure
  request from 2026-11-19 has no built row (a plain session's). Conductor runs stay on collection.
- Step 11: `python3 scripts/next_slo_colleges.py --next` on `main` says the queue is empty (120 colleges: done 39,
  held 4, none 5, skip 72; census 44695851118), so the step ends in one line. It opens again when a census, a harvest
  capture or a verdict row changes. The four held (De Anza, Palo Verde, College of Marin, Antelope Valley) each wait
  on a reader.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`);
outline fills first, program records second (`r-collect-for-mids-work-order-sam-2026-11-20`). The outline queue is
empty, so both lanes work program records.

**Lane 1 (collection, Opus 5.5 workers):**
- `rios` (high effort): the Los Rios colleges' programs whose extraction placed none of the state's courses, the
  census's *a reader change hands it its own page, then extraction*: Sacramento City 22 and Cosumnes River 19 first,
  then American River 5 and Folsom Lake 3. A free page read on the runner first, each program's own page pinned or the
  program filed as a named gap, then a paid read with `only=` at most $5 a college on the estimate, dispatched by the
  conductor, then the reconcile steps and the load. One writer for those four colleges.
- `display` (high effort, later): one display build carrying the 27 records applied after S713's build (Las Positas
  4, Antelope Valley 4, Glendale 13, Clovis 6) and tonight's applies, gate college Glendale, then
  `harvest-gap-census.yml` on `main`. It runs only while no apply is in flight (one writer per table).
- Held for a later slot: the same lever at San Bernardino Valley 15, Los Angeles Southwest 9, Mendocino 6 and
  Santiago Canyon 6.

**Lane 2 (cheap piles, one worker, `piles`, high effort):** City College of San Francisco's 28 wording rules, with
its six held for a list or wording rule (17954, 09178, 17952, 31602, 36964, 42318); then East Los Angeles 24, Fullerton
24 and College of the Sequoias 22. Each rule gets a claim check on today's capture, boundary readings and a precision
count before its second read (`p-self-recall-reads-rule-fields-s703`, `p-claim-check-reads-current-capture-s713`); a
gap is noted where a reread would be needed; discontinued flags and retired courses where its colleges show them. It
stays off the Los Rios colleges and any college lane 1 takes later.

## Split changes during the run

- 11:37Z: workers `piles` (lane 2, `claude/s714-piles-ccsf`, City College of San Francisco first) and `rios`
  (lane 1, `claude/s714-rios`, Sacramento City and Cosumnes River first) started, each at high effort on Opus 5.5.
  The display build waits for a slot and for no apply in flight.
- 12:09Z: `piles` filed City College of San Francisco's plan, #3714 (`56916660`): 8 records to passing on three
  `course_renumbers` and a shared scorer reading `option_parts`; 13 others held with reasons. A second reader is on it
  before any apply. `piles` took East Los Angeles on `claude/s714-piles-ela`, in a new worktree so the reader's
  checkout stays at the PR head. Four checkouts at about 2 GB each against 55 GB free, over the three-checkout
  ceiling set when a checkout was 4.4 GB (`d-four-checkouts-on-measured-disk-s714`).
- 12:11Z: the harness keeps a worker inside its own worktree, so `piles` could not open a second one; a fresh worker,
  `piles2`, took East Los Angeles on `claude/s714-piles-ela` in its own worktree, and `piles` stays on #3714's
  checkout for the reader's fixes. S712's #3712 merged at 11:52Z (`3cc69ffc`).
- 12:32Z: `rios` filed its reader change and 38 pins, #3715 (`934beba4`): Sacramento City 19, Cosumnes River 16,
  Folsom Lake 3 given their own pages; six named gaps; free estimates $2.15, $1.76 and $0.33. American River's 5 are
  blocked: its host now serves a file whose sha256 differs from the hand-filed record. A second reader is on the
  reader change before the paid reads (the S652 rule for changed shared reader code).
- 12:38Z: #3714's second reader: FIX THEN APPLY, the 8 rows and the SQL stand (proved on a local Postgres 16: the
  apply writes 8, aborts on a rerun, a matching confirm or a changed record, skips a checked row; the rollback
  restores the before state exactly). Two majors are in the reach count and the test, not the apply: with each
  record's own state list `option_parts` moves 10 more records to passing at seven other colleges, and the test
  pins all 21 hand answers. Applied first, fixed forward (`d-apply-before-reach-fix-s714`): pre-read 8 of 8
  before-images, 0 checked, 0 matching confirms; `.apply` pushed at 12:37Z (`4dbb40c9`).
- 12:40Z: City College of San Francisco's 8 records live: migrate 45176130201 (12:39Z), 8 of 8 at their after-images,
  none checked; `.apply` back at main's value (`9b917c3a`). `piles` fixes the reach count and the test on #3714.
- 12:58Z: S712's #3712 had merged handoff 715 (for Sam's next plain session, SkyAlbatross), so this run's handoff
  moved to 716 in the merge of main (`194d76ba`). Handoff 715 records Sam at 01:53Z: *"No need for the Cobix check
  ins for now"*; this run stopped its COBIx watcher at once and reads each PR's thread before a merge.
  `piles` pushed the six fixes (#3714 head `8e461a7d`, 92 of 92); the second reader has round 2 of 2 on them, because
  the same-figure guard is new shared scorer code.
- 13:14Z: #3714's round 2: MERGE (the same-figure guard fires on no committed record, no false pass); its one minor,
  true parts that print one figure read as alternatives, goes to COBIx's list. `piles2` filed East Los Angeles's
  plan on `claude/s714-piles-ela` (`6f5c93ef`, no PR under the cap): 14 to passing and 45602 a named gap
  (`total_differs`), 9 held; it changes shared reconcile and scorer code (`own_heading_end`, `own_plan_line_at`,
  `set` with `was` and `hold`), so a second reader is on it before the apply.
- 13:15Z: #3715's second reader: FIX THEN DISPATCH. Its blocker: Sacramento City 30620 (Active - Teachout Only in the
  Program Course File) was pinned to 46304 Mathematics 2.0's section, so it leaves the read and becomes a named gap;
  the reconcile test failed on KeyError '07315' (a merge blocker only). Claim 1 held: 624 reads on 78 pinned fixtures
  and 26,000 fuzz calls, 0 windows changed outside S714's pins. The conductor dispatched the three paid reads on
  `claude/s714-rios` in that scope: Sacramento City 18 (about $2.04), Cosumnes River 16 ($1.76), Folsom Lake 3
  ($0.33). `rios` fixes the blocker, the test and the minors, then reconciles each filed read.
- 13:21Z: #3714 merged on a green `test` (`f0d84966`, confirmed on `origin/main`). `piles` takes the follow-up its
  reading opened: the 10 records at seven colleges that `option_parts` moves to passing (Foothill, Glendale, Golden
  West, MiraCosta, Monterey Peninsula, Reedley, Santa Barbara City), on `claude/s714-piles-optparts`, then
  Fullerton. Those seven colleges join lane 2 for the follow-up.
- 13:31Z: the three Los Rios dispatches went in at once, and the workflow's concurrency group (one running and one
  pending run per branch) canceled Cosumnes River's pending run 45181979022 four seconds after Folsom Lake's
  dispatch replaced it, before anything was paid (`p-one-pending-run-per-branch-s714`). Sacramento City
  (45181973475, 18 programs, $2.04) and Folsom Lake (45181983194, 3, $0.33) ran green; Cosumnes River was
  dispatched again alone (45184653221, 13:30Z). `rios` pushed its fixes at `31b802a3` on #3715.
- 13:46Z: the optparts plan came back at 10 rows (`58cfb1a2`); Santa Barbara City 05934 was held out because its claim
  check on today's capture finds 31 of its option's 33 courses (ENVS 112 and ENVS 115 missing), so the plan goes
  to 9 (`d-optparts-holds-05934-claim-check-s714`). `piles` then takes Fullerton on `claude/s714-piles-fullerton`.
- 13:46Z: East Los Angeles's second reader: FIX THEN APPLY, the 15 rows and the receipt standing (Postgres 16:
  writes exactly 15, aborts on a rerun, a confirm or a changed before-image; the rollback restores all 15;
  statewide only the 15 move). Its majors: the electives scope ran past the next program's plan line (a future
  false pass, no row here), and the branch needed main's merge. Applied first, fixed forward: pre-read 15 of 15
  before-images, 0 confirms; migrate 45186909162 (13:45Z), 15 of 15 live at their after-images; `.apply` back at
  main's value (`022a3511`). `piles2` bounds the scope, merges main and opens the PR.
- 13:56Z: the optparts plan's Sonnet reader: APPLY (Postgres 16: writes exactly 9; aborts on a rerun, a confirm or a
  changed before-image; a checked row is skipped; the rollback alone restores the before state). Pre-read 9 of 9;
  migrate 45188487600 (13:55Z), 9 of 9 live at Foothill, Glendale, Golden West, MiraCosta, Monterey Peninsula (2)
  and Reedley (3); `.apply` back at main's value. Its PR waits for a slot under the cap.
- 14:03Z: `piles2` opened #3716 (`0e9ec64f`) with the six fixes, the 15 after-images unchanged. Its reader's round 2:
  MERGE (the bound holds; rescoring 18,960 filed records gives 0 differences against main). Its minor, for COBIx and
  the next run: the bound is not yet measured on capture text, and a free reconcile at East Los Angeles
  (`extract=0`) should run before its next text run; 41097 (a department-name heading) may lose its pass, and
  36345, 37924, 43632 and 45935 might.
- 14:10Z: `piles` filed Fullerton's plan (`claude/s714-piles-fullerton`, `775c154d`): nine `course_renumbers` for the
  state file's campus-letter forms (`F HORT002` for the page's `HORT 002 F`, `CSTR 42` for `CSTR 042 F`) move 11
  records to passing on coverage alone; 13 held with reasons; the claim check reads free page read 45188452002.
  18747's state list still names THEA 142 F and 149 F, printed now as THEA 148 F and 153 F ("formerly"). A
  Sonnet reader is on it; `piles` takes College of the Sequoias on `claude/s714-piles-sequoias`.
- 14:17Z: Fullerton's Sonnet reader: APPLY for the 11 rows (Postgres 16 as before); before the merge, drop the
  `PE 248 F` renumber (the state file holds two PE 248 courses and the printed form matches the other one; it moves
  none of the 11 but rewrote 18166's score). Pre-read 11 of 11; migrate 45191999745 (14:15Z), 11 of 11 live; `.apply`
  back at main's value (`c4b8cf1e`). #3716 merged on a green `test` (`890eb465`, confirmed on `origin/main`). A
  `land` worker brings the optparts and Fullerton branches up from main and opens the optparts PR; East Los
  Angeles's worktree was removed.
- 14:54Z: `rios`: all fixes pushed (#3715 `97c70d84`, `test` and `lints` green; 30620 a named gap,
  `teach_out_successor_printed`); the three paid reads filed 37 records, 35 passing (Sacramento City 17 of 18,
  07334 short of its GE units; Cosumnes River 15 of 16, 35364 on outcomes; Folsom Lake 3 of 3). None of the 37
  had a live row, so each loads; the load skips any record that places none of its courses. The free reconciles
  changed no record and newly pass 9 with live rows; a Sonnet reader checks those before their reread. The
  rescore dropped 16 records' `ge_units_not_read` gaps (a reader bug, for the follow-up; `rios` restored the 49
  unchanged and 07319). Sacramento City's load 45198701869 (14:52Z): 18 of 18 live, unchecked.
- 15:00Z: Cosumnes River's load 45199218981: 16 of 16 live; Folsom Lake's: 3 of 3 live, all unchecked. The 9
  rescored records are held, never reread: a Sonnet reader found 8 pass only through main's program-level fill
  rule (`electives_fill_degree`, no degree total, `hi <= stated`, and "elective" anywhere in the text), while each
  record's notes say its table starts mid-page with rows cut off, so their failing verdicts stand; `rios` put all
  9 files back to main's (#3715 `597cfd85`). FINDING `f-elective-fill-passes-cut-off-windows-s714`: the same rule may
  pass truncated windows statewide; measure it before the next reconcile at any college. Sam's plain session S715
  (SkyAlbatross) opened #3717 and #3718 on the Subjects page beside this run. Fullerton rides #3719 with the
  optparts 9.

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
| #3713 (`claude/awesome-fermat-ka0z4l`) | the declaration | becomes the checkpoint at sign-off |
| #3714 (`claude/s714-piles-ccsf`, `piles`) | merged `f0d84966`; applied by migrate 45176130201 | none |
| #3719 (`claude/s714-piles-optparts`, `land`) | applied by migrate 45188487600, 9 rows live; Fullerton joins it | `test`, the merge |
| `claude/s714-piles-fullerton` (`land`) | applied by migrate 45191999745, 11 rows live | the PE 248 F drop, then into #3719 |
| `claude/s714-piles-sequoias` (`piles`) | started | its plan |
| #3716 (`claude/s714-piles-ela`, `piles2`) | merged `890eb465`; applied by migrate 45186909162 | none |
| #3715 (`claude/s714-rios`, `rios`) | 37 records loaded (loads 45198701869, 45199218981 and Folsom Lake's); the 9 rereads held | `test`, the merge |
| #3712 (S712, Sam's plain session) | merged `3cc69ffc` | none |
| #3383 | dependabot's | waits |
