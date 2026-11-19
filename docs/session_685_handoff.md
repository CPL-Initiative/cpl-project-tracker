---
title: "Session 685 handoff (from SkyVerdin, S684)"
created: 2026-11-19
updated: 2026-11-19
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyTowhee (Session 685)

From SkyVerdin, S684, the CPL Queue routine's 10:12Z firing of 2026-11-19 (started 10:13Z): a conductor run for
collection only under Sam's routine prompt of 2026-11-17, following the COBIx brief on #3358 as updated
2026-11-19T02:34Z. A **full checkpoint** (lanes moved, Rule 10 writes ran), written by the checkpoint-docs worker.
Skipped: steps 2 and 3 (no KB generator or user-facing surface changed), 7 (no M-ID pipeline move) and 9 (the UI pass
is its own queue item). `list_sessions`, `get_trigger`, `get_session` and `set_session_tags` were not among the tools:
no tag, no cost readout, no `next_run` refresh.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. It can miss one when GitHub search lags its index (`p-cobix-watch-misses-on-search-lag-s684`):
   read a PR's thread before you merge it.
1a. **Clone light (Sam, 2026-11-19):** every session and worker clones `cpl-project-tracker` with
   `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), oldest finished first, one update from `main` right
   before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
3. **Merge order:** the wave (`claude/wave-s684`; its PR was opening at sign-off), then #3545 (this checkpoint), then
   #3529.

## Your first steps, in order

0. **First item, for a plain session: COBIx on #3533 (comment 7006930860, edited 12:32Z), "Build the CPL Commons page
   now"** (Sam, in chat, 2026-11-19 4:28 AM PT, relayed): one front page named CPL Commons on a fresh branch off
   `main`, Opus 5.5 at high effort, a draft PR and a preview URL, wanted usable today at the CCLC conference. The
   comment is the full spec (copy, figures, hashes, layout, the tests that must hold, four open data questions for
   Sky). S684 did not start it (`d-commons-build-to-a-plain-session-s684`): Sam's routine prompt of 2026-11-17 keeps
   conductor runs to collection, and the run was at 88% of its context. Sam was told by phone notice at about 12:37Z,
   and COBIx on #3533 (comment 7009289564). What the build waited on is in place: `main` green, #3544, #3528 and #3547
   merged; #3229 not checked. **A routine firing that reads this must not start it on the routine's prompt alone; it
   needs Sam's word in the session or a session he opens.**
1. **Apply the memory rows:** point `kb/migrations/.apply` at `kb/migrations/2026-11-19_s684_cpl_memory_rows.sql`
   (rollback beside it) and let `supabase-migrate.yml` run it.
2. **Merge the wave** (`claude/wave-s684`): the three reread branches, both outline load branches, Rio Hondo's
   discover file and the live-read files. Read its thread first; merge on a green `test`.
3. **The display build, once** (`d-no-display-tonight-s684`): on a branch, `kb/_build_roep_display.py`, commit only
   `cpl_pathways_roep_data.js`, dispatch `step=display`, clear of the 12:17Z daily slot; then dispatch
   `harvest-gap-census.yml` on `main` and report the shrink against 5,395 (by tonight's headline pair, 5,300 left).
4. **Keep-the-better's two open items, with COBIx** (#3547's docstring and comment 7007297442): (a) a second pass after
   a post holds the row; no second pass at a college until it is fixed. (b) On CourseLeaf pages a re-read that placed
   courses was restored on a generic heading alone (*REQUIREMENTS*, *Course List*, *Major Requirements*,
   *Requirements*): Ventura 4 (31298, 35207, 44186, 45831) and Evergreen Valley 13 (all 13 re-reads pass; 6 of the
   filed records they gave way to fail). The fix: accept a re-read whose page is the program's own, by URL or page
   title, when the heading is generic; then re-post those 17. Evidence: each college's `reread_keep_better.json`.
   COBIx's `held_run` hunch on #3548 is answered on its thread; one assertion is owed when the script is next touched.
5. **Southwestern's paid read** (`claude/harvest-southwestern-s684`, head `3fc2e0c1`; free preview 44509366154, the
   2026-27 CourseLeaf catalog, 451 of 451 pages, none challenged): 24 programs for about $2.40. NOCE's preview
   (44509371084) would extract none.
6. **The reread plan's second ten:** Copper Mountain, Woodland, MiraCosta, American River, Yuba, Cerritos, Grossmont,
   Imperial Valley, Modesto Junior and Skyline. Then rule D through `rule_d` (CCSF, Santa Rosa, College of the Desert)
   and `kb/_program_discontinued.py --capture`.
7. **Outlines:** Rio Hondo's reader change, a plain session's (`kb/_course_outline_index.py` `search_all`, about line
   301: press the page's Search button when no NewSearch request arrives, capture the POST, then `--index` again).

Read this file, then the NEXT of `program-requirements-harvest`, then `docs/reference/conductor_mode.md`,
*What went wrong in S684*, then `docs/program_requirements_harvest_lessons.md`, *S684*.

## What shipped

- **`main` repaired:** #3544 (the S683 wave, 8baace0f) with `tests/issuer_tags.test.js` (five issuers from Sam's own
  saves of 2026-11-18, registered with no tag or acronym, `d-issuer-tags-registered-empty-s684`) and
  `tests/course_id_route_test.py` (CCSF's COMM for CMST alias kept, `d-ccsf-comm-cmst-kept-again-s684`). Then #3535
  (S683's checkpoint, 09e5c0d1) and #3528 (1ad7ae80). S683's 19 memory rows applied (migrate run 44506909495).
- **#3547, keep-the-better's guard** (94a02499, COBIx on #3544): the checked list first, a `live_runs` hold, five-digit
  control numbers as strings. Two review rounds.
- **#3548, named gaps over the re-read records** (84366bbc, 12:40Z): 2 rows (Santa Rosa Junior 44788, CCSF 41049;
  apply 44515993146). Its lints first failed on a stale `kb/status/commons_data.json`, which `check_generated.sh` did
  not catch (`p-commons-data-status-not-in-check-generated-s684`).
- **The second reread batch, ten colleges, every receipt `error` null:** $16.08 paid; kept 114, restored 24, new 22,
  held 2 (Ventura 45355, Shasta 18153, each in `held_for_person/`); 87 rows replaced, 42 inserted; 67 record files
  dropped, none of which passed live. Ventura, Cañada and Victor Valley dispatched nothing.
- **Outlines, 1,489 rows:** College of the Siskiyous 366 (load 44512255004) and Crafton Hills 1,123 (read 44509906805,
  566 of 566 pages; standing test 26 of 26; load 44522694613: 557 `slo`, 566 `objective`, error null).
- **Live at 12:36Z:** `program_requirement_records` 18,354 (18,312 at the start); `course_outcomes` 33,836 (32,347).
- **The Spend lines:** S680 to S682 restored as estimates and the parser's `estimate` flag (`claude/spend-lines-s684`,
  merged into this branch); S684's handoff line replaced from its own prose ($94, an estimate).
- **KB note:** `docs/kb-notes/adr-one-credential-list-exhibits-are-its-children.md`, the braindump COBIx relayed on
  #3533 (Sam's decisions; COBIx's figures on `main` fa5a5c10; the one-ETA reversal pending).

## Open work by lane (from the NEXT lines)

1. **program-requirements-harvest:** the first steps above; then cheap piles (the narrower A5, the `no_units_printed`
   wording, the six `NOTE_PAIR_ON` records); the outline readers (Rio Hondo's reader change, Peralta, Mt. San Antonio
   #3537, Saddleback and Irvine Valley, CCSF's outline index); Lassen's structured-fields step 1; (8) to (15) unchanged.
   For a person: West Los Angeles 38677; Los Angeles Mission 44849; Los Angeles City 32832 (live run 39006380342,
   `main` files 43212072618).
2. **repo-size:** Part 5 waits on Sam's go; the spreadsheet export and the videos; the three slimming items
   (`d-slimming-to-plain-session-s683` stands).
3. **For a plain session:** **cer-procedures** (1), the pair apply; **commons**, MIS course matches and COE demand,
   the `check_generated.sh` check; **library**, Ashley's pieces through Start and the requests (3 requested, among them
   Cable Splicer CPL Opportunities due 2026-11-18; 4 revise); **sierra-page-redesign**, Phase B's photo call and #3511
   (Sam merges it); #3529 (COBIx's read); the brief's section 5; `sam_rulings` rows for the AJ and high school
   articulation rulings; AATA's acronym and whether the three high schools stay issuers. The credential-list build
   (the new KB note) starts once #3229 lands. Also worked this week, each with a NEXT that waits for a plain session
   (conductor runs stay on collection): **common-cr-reference**, **governance-team-enablement**,
   **implementation-funding** and **my-college-action-page**; read each lane's NEXT before taking one.
4. **To COBIx:** `main` now lacks a record file for 160 live rows from S683's wave, plus tonight's
   (`f-reread-drops-files-live-rows-stay-s684`); under `live_runs` a later re-read of one is held for a person. Rule D
   and the discontinued capture are the path that labels them.

## For Sam

0. **COBIx's "Build the CPL Commons page now"** (your words in chat, 2026-11-19 4:28 AM PT, relayed on #3533, comment
   7006930860): S684 did not start it, since your routine prompt keeps conductor runs to collection and the run was at
   88% of its context (`d-commons-build-to-a-plain-session-s684`). It is the first item for a plain session; open one,
   or say so in a session, and it starts. Its prerequisites are in place except #3229, which was not checked.
1. The routine's form still sets Fable 5.2 for the conductor (the third Fable firing); the Opus night needs the form
   changed, which is yours.
2. Hung `Repo size guard / size` jobs held runners for hours after every PR push. #3543 fixes it and merged as
   f869acfe; cancelling any runs still hung is yours to allow (the permission check refused a cancel agent in S683).
3. [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current) is unchanged: one card.

## Decisions

No new ruling from Sam in his own words in this run; the braindump's decisions are filed as his in the KB note.
The conductor's, all reversible: `d-issuer-tags-registered-empty-s684`, `d-ccsf-comm-cmst-kept-again-s684`,
`d-skip-preview-under-ceiling-s684`, `d-post-on-reviewed-head-before-merge-s684`, `d-no-display-tonight-s684`,
`d-no-second-update-behind-a-docs-checkpoint-s684`, `d-two-rounds-then-ship-the-verified-part-s684`,
`d-live-read-through-the-migrate-runner-s684`, `d-commons-build-to-a-plain-session-s684`.

## Patterns that worked

- Running the rest of `lints` locally before a repair push (164 steps, about 8 minutes).
- A live read generated and parsed by script through the migrate runner, returning counts and differences only.
- Posting on a PR's reviewed head while its CI ran, so the lane did not wait on the merge.

## Safety patterns to honor

All of 683's (`git -C`, never `cd`; one `supabase-migrate` at a time; summaries at most 400 characters; never merge
#3511). New: `p-lints-stops-at-first-failure-s684`, `p-control-number-leading-zero-s684`,
`p-hung-size-jobs-starve-the-pool-s684`, `p-branch-update-starts-read-only-workflows-s684` (update one PR at a time),
`p-migrate-receipt-keeps-4000-chars-s684`, `p-cobix-watch-misses-on-search-lag-s684`,
`p-ci-log-tails-fill-the-context-s684` (read a failed log with `tail_lines` 15; gate through pr-gate),
`p-commons-data-status-not-in-check-generated-s684` (run `python3 tests/commons_data_status_build_test.py` after any
record write: `check_generated.sh` does not run that builder's check).

## The college split (written before any worker starts)

Two lanes, never on one college, one writer per college. A college moves between lanes only when its lane has nothing
in flight there, and the move is recorded here (`d-lane-names-only-colleges-in-flight-s681`).

**Lane 1, the cheap piles (one worker).** The fifteen colleges of the S683 reread wave, whose re-read records take the
named-gaps pass: Mendocino, City College of San Francisco, Santa Rosa Junior, Compton, Foothill, Porterville, Citrus,
San Bernardino Valley, Moorpark, West Los Angeles, Los Angeles Trade-Technical, Los Angeles Pierce, Los Angeles
Mission, East Los Angeles and El Camino. The same worker carries the work that belongs to no college: the
keep-the-better guard COBIx found on #3544, the Spend line, the display build and the gap census. Rule D (City College
of San Francisco, Santa Rosa Junior) is its last item, if the night allows.

**Lane 2, collection (Opus 5.5 workers).**
- The reread plan's next batch, in the plan's order, ten colleges: Ventura, Cañada, Los Angeles City, Evergreen Valley,
  Solano, Shasta, Santa Barbara City, Victor Valley, Ohlone and Clovis. Previews first; no paid read is dispatched
  until the guard fix has merged. A second ten only after the first ten's loads have filed: Copper Mountain, Woodland,
  MiraCosta, American River, Yuba, Cerritos, Grossmont, Imperial Valley, Modesto Junior and Skyline.
- Previews and outlines: Southwestern and North Orange Continuing Education (program previews through the sanctioned
  HTML read); College of the Siskiyous (the full outline read), Crafton Hills (a 12-page trial) and Rio Hondo (a
  `discover=` run).

**Not tonight:** College of the Desert (`d-desert-skipped-s683`); Long Beach City (its S683 preview looked stuck);
City College of San Francisco's outline index (the college is in lane 1 tonight).

## Ledger and let go

| PR or branch | State | Next |
|---|---|---|
| the wave `claude/wave-s684` | opening at sign-off (the lane-1 worker assembles it; in CI unless merged) | read its thread; merge on green `test` |
| #3545 this checkpoint | draft | update from `main`, merge after the wave |
| #3544, #3535, #3528, #3547, #3548 | merged (8baace0f, 09e5c0d1, 1ad7ae80, 94a02499, 84366bbc) | none |
| #3529 | open | a plain session, after COBIx's read; the note on it: `COLLECTION_LANE_S680` now means the five-college lane on `main` |
| #3537 Mt. San Antonio reader | open | the parser fix, a plain session (same note as #3529) |
| #3500 Cosumnes River | open | the paid read waits on a named-programs-only input |
| #3543 | another session's, merged as f869acfe | none |
| #3511 | ready | Sam merges it |
| `claude/reread-wave-s684` (`926fa8f6`), `-b` (`b8247c42`), `-c` (`ffb47ab3`) | posted, no PR | in the wave |
| `claude/slo-college_of_the_siskiyous` (`9769a585`), `claude/slo-crafton_hills` (`be26092b`) | loaded, receipts on the branches, no PR | in the wave |
| `claude/slo-rio_hondo` (`d391d127`) | discover file filed, no PR | in the wave; the reader change is a plain session's |
| `claude/harvest-southwestern-s684` (`3fc2e0c1`), `claude/harvest-noce-s684` (`6f790430`) | free previews, no PR | Southwestern's paid read (first step 5) |
| `claude/named-gaps-apply-s684` (`74964689`), `claude/s684-live-read` (`2af2b47e`) | trigger branches, no PR, done | the live-read files ride the wave |
| `claude/spend-lines-s684` (`6cefe21a`) | merged into this branch, no PR | none |

Subscriptions: none held. Check-ins: none. Artifact watches: none. The COBIx watcher (a 30-minute monitor) ends with
the session.

## Final figures

Spend: $95 (estimate from token counts at list prices; Fable 5.2 $50, Opus 5.5 $42, Haiku 5.5 $2, Sonnet 5.5 $1); collection $65, infrastructure $30; 2026-11-19T10:13Z to 2026-11-19T12:47Z.

No cost readout (`get_session` was not among the tools). The conductor's estimate from the session's transcripts at
12:37Z, at the rates handoff 684 used (Sonnet and Haiku rows assumed), was about $85 by then and about $95 at sign-off;
the billing page is the record. By purpose, a judgment: about $65 collection, $30 infrastructure (the repair of
`main`, the guard, the checkpoint). The extraction runs' own filed cost, $16.08, is separate.

| Running tally since Nov 17 | Value |
|---|---|
| Spend | about $749: collection about $393 (S680, S681, S683, S684); curation about $141; infrastructure about $78; untagged $120.82 plus runner $7.87; extraction runs apart ($25.20 in S683, $16.08 in S684) |
| Program records | about 276 (234 plus tonight's 42); 220 rows replaced by a better re-read (133 plus 87) |
| Outline rows | about 8,759 net (7,270 plus tonight's 1,489) |
| CRE / cost per CRE | about 12,899 CRE (tonight 2,119: 42 records at 15, 1,489 rows); tonight's collection about $0.038 per CRE (($65 + $16.08) / 2,119) |
| Tonight by lane | lane 1: #3547, #3548 (2 labels), the Spend lines; lane 2: 42 inserted and 87 replaced at ten colleges, $16.08 of run costs, 1,489 outline rows, two free previews |
| Gap left | the census was not dispatched; by the headline pair at 12:36Z, 20,282 active and 14,982 complete leave 5,300, 95 fewer than the census's 5,395 of 2026-11-18 |

S684: cost not available (no get_session; about $95 at list prices, an estimate, plus $16.08 of extraction runs); records collected 42 new program records and 87 rows replaced by a better re-read; outline rows added 1,489; substantive PRs merged 4 (#3544, #3528, #3547, #3548).

Opening line: *Greetings, you are SkyTowhee (Session 685), see SkyVerdin's handoff, `docs/session_685_handoff.md`,
let's keep rolling with our queue.*
