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
3. **Merge order:** #3548 (the named gaps, applied), then the lane-2 wave PR (see the final block), then #3545 (this
   checkpoint), then #3529.

## Your first steps, in order

1. **Apply the memory rows:** point `kb/migrations/.apply` at `kb/migrations/2026-11-19_s684_cpl_memory_rows.sql`
   (rollback beside it) and let `supabase-migrate.yml` run it.
2. **Merge in the order above.** #3548's head `8e30736c` carries both receipts and the rollback; its second reader
   said apply and merge. The wave PR carries the ten colleges' reread branches.
3. **College of the Siskiyous' outline branch** (`claude/slo-college_of_the_siskiyous`, head `9769a585`): loaded and
   receipted (366 rows); land it with the next wave.
4. **The display build, once** (`d-no-display-tonight-s684`): on a branch, `kb/_build_roep_display.py`, commit only
   `cpl_pathways_roep_data.js`, dispatch `step=display`, clear of the 12:17Z daily slot; then dispatch
   `harvest-gap-census.yml` on `main` and report the shrink against 5,395.
5. **Keep-the-better's two open items, with COBIx** (#3547's docstring and comment 7007297442; Ventura's evidence on
   `claude/reread-wave-s684`): a second pass after a post holds the row; a generic CourseLeaf heading passes the
   own-program test. No second pass at a college until the first is fixed.
6. **The reread plan's second ten:** Copper Mountain, Woodland, MiraCosta, American River, Yuba, Cerritos, Grossmont,
   Imperial Valley, Modesto Junior and Skyline. Then rule D through `rule_d` (CCSF, Santa Rosa, College of the Desert)
   and `kb/_program_discontinued.py --capture`.
7. **Outlines:** Crafton Hills' full read, then the standing test and a load; Southwestern and NOCE previews off `main`.

Read this file, then the NEXT of `program-requirements-harvest`, then `docs/reference/conductor_mode.md`,
*What went wrong in S684*, then `docs/program_requirements_harvest_lessons.md`, *S684*.

## What shipped

- **`main` repaired:** #3544 (the S683 wave, 8baace0f) with `tests/issuer_tags.test.js` (five issuers from Sam's own
  saves of 2026-11-18, registered with no tag or acronym, `d-issuer-tags-registered-empty-s684`) and
  `tests/course_id_route_test.py` (CCSF's COMM for CMST alias kept, `d-ccsf-comm-cmst-kept-again-s684`). Then #3535
  (S683's checkpoint, 09e5c0d1) and #3528 (1ad7ae80). S683's 19 memory rows applied (migrate run 44506909495).
- **#3547, keep-the-better's guard** (94a02499, COBIx on #3544): the checked list first, a `live_runs` hold, five-digit
  control numbers as strings. Two review rounds.
- **#3548, named gaps over the re-read records:** 2 rows (Santa Rosa Junior 44788, CCSF 41049; apply 44515993146).
- **The second reread batch, ten colleges** (figures in the final block); **Siskiyous' outlines loaded** (load
  44512255004: 247 `slo`, 119 `objective`, error null).
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
   (the new KB note) starts once #3229 lands.
4. **To COBIx:** `main` now lacks a record file for 160 live rows from S683's wave, plus tonight's
   (`f-reread-drops-files-live-rows-stay-s684`); under `live_runs` a later re-read of one is held for a person. Rule D
   and the discontinued capture are the path that labels them.

## For Sam

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
`d-live-read-through-the-migrate-runner-s684`.

## Patterns that worked

- Running the rest of `lints` locally before a repair push (164 steps, about 8 minutes).
- A live read generated and parsed by script through the migrate runner, returning counts and differences only.
- Posting on a PR's reviewed head while its CI ran, so the lane did not wait on the merge.

## Safety patterns to honor

All of 683's (`git -C`, never `cd`; one `supabase-migrate` at a time; summaries at most 400 characters; never merge
#3511). New: `p-lints-stops-at-first-failure-s684`, `p-control-number-leading-zero-s684`,
`p-hung-size-jobs-starve-the-pool-s684`, `p-branch-update-starts-read-only-workflows-s684` (update one PR at a time),
`p-migrate-receipt-keeps-4000-chars-s684`, `p-cobix-watch-misses-on-search-lag-s684`,
`p-ci-log-tails-fill-the-context-s684` (read a failed log with `tail_lines` 15; gate through pr-gate).

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
| #3548 named gaps | applied, head `8e30736c`, reviewed | merge on green `test` |
| the lane-2 wave PR (`claude/reread-wave-s684`, `-b`, `-c`) | see the final block | merge after #3548 |
| #3545 this checkpoint | draft | update from `main`, merge after the wave |
| #3529 | open | a plain session, after COBIx's read |
| #3537 Mt. San Antonio reader | open | the parser fix, a plain session |
| #3511 | ready | Sam merges it |
| #3544, #3535, #3528, #3547 | merged | none |
| #3543 (another session's) | merged as f869acfe | none |
| `claude/slo-college_of_the_siskiyous` (`9769a585`) | loaded, receipt on the branch | land it |
| `claude/slo-crafton_hills` | full read | standing test, then the load |
| `claude/slo-rio_hondo` | discover run 44508907581 | the reader change, a plain session |
| `claude/named-gaps-apply-s684`, `claude/s684-live-read` | trigger branches, no PR, done | none |
| `claude/spend-lines-s684` | merged into this branch, no PR | none |

Subscriptions, check-ins and artifact watches: the COBIx watcher (Monitor, 30-minute arms) is the one the ledger names; the conductor confirms the rest at sign-off.

## Final figures (the conductor fills this block at sign-off)

**Not yet filled.** The conductor's closing figures arrive at about 13:10Z: the lane-2 workers' final counts (the ten colleges, Crafton Hills), the wave PR's number and state, the Spend line, the running tally since Nov 17 and the one-line session summary. If this line is still here, the checkpoint was pushed without them.

Opening line: *Greetings, you are SkyTowhee (Session 685), see SkyVerdin's handoff, `docs/session_685_handoff.md`,
let's keep rolling with our queue.*
