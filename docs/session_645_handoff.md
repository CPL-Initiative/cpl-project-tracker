---
title: "Session 645 handoff (from SkyWren, S644)"
created: 2026-11-13
updated: 2026-11-13
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyFinch (Session 645)

Written for SkyWren (S644, the conductor) by a documents worker at a full checkpoint, about 01:50Z 2026-11-13. Sam
opened S644 at about 23:53Z 2026-11-12 with the 644 handoff's line and, verbatim: "I want to continue progress on our
commons harvesting. we are making great progress but we need to increase our throughput." Later, verbatim: "Good.
Cobix has an offer for you in comment" and "Cobix is offering to work with you to design specialist bots you can
commission. See comments". He said nothing else and has not answered cards A to C below. No other session was live at
the start. The container restarted at about 01:38Z; pushed work survived. Facts were read from `origin/main`
(`6e8b267d`) and the open PRs at about 01:45Z; a fact marked *as reported* came from the conductor's notes.

## First things

1. **Read COBIx before any merge.** #3110 and #3111 to their last comment (page with `perPage` 1 from the last page;
   ten full comments cost about 10,000 tokens), every issue or PR COBIx touched today, then each open PR's own thread.
   His threads carry the bots' contract (#3111 comment 6840743191) and his doubt on card A (Sheet 187 card 3) (6840723274).
2. **#3193** (the scorer): merge on a green `test` on its head; the live rescore is a separate reviewed step.
3. **The wave's first free trial**, run 43343741511 on `claude/harvest-wave-s644trial`: read
   `kb/program_requirements_wave/s644trial.md` once it files.
4. **Did the first real daily run after #3180 publish?** The 06:17 UTC run on 2026-11-13: its log for `Daily push
   rebased over a changed input` or `Daily push conflicted`, the rebuild's minutes, whether its push landed; then
   `get_check_runs` on `main`'s head, `test`.
5. Rule 8's `cpl_memory` query (tags `program-requirements`, `commons`, `conductor`, `first-light`,
   `governance-team-enablement`), the three-repo check, the highest-numbered handoff, `list_sessions` if you hold it,
   `df -h /home/user` and `git worktree list`. Fetch branches by name with `--depth 50`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: Open work 1 (the merge only, never the
rescore), 3, 4's reviews and free captures, 6 and 7. **Waits for Sam, never run by a session:** `step=display` after
tonight's loads until card A (Sheet 187 card 3) is answered; the headline counting card B's grade (card 4); card C's (card 5) statewide figure; the deploy of
`docket-process` and `library-publish-now`; the GitHub Actions pull-request setting; the six re-clustering cases and the
Honors question; anything on the `CLAUDE.md` hold list. #2894 is his. **Open Asks Sheet 187** (built by this checkpoint,
published by the conductor; its link is in `CLAUDE.md`'s standing-sheet line once published) carries the conductor's
nine decisions on cards 1 and 2 and cards A, B and C as cards 3 to 5 (`SHEET_ID` `2026-11-13-open-asks-187`, 54,879
bytes). [Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt), current for its own cards, still holds
cards 4 to 6 waiting; 187 does not carry them, to stay under 60 KB.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S644, and what worked* included.

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*; Sam's latest change was 2026-11-11:

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx (Sam, 2026-11-11, relayed by COBIx on #3110;
  `cpl_memory` `sam-conductor-model-fable-5-2-2026-11-11`). The routine's form sets the model and ultracode; medium
  effort lives in its prompt.
- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`).
- A worker building anything that writes shared data or changes an apply runs at **high** effort: the conductor passes
  `effort: "high"` on that worker (Sam asked for it, which is what the Agent tool requires). Other workers run at the
  default.
- A review workflow uses **at most 9 agents in all**, readers and second readers together. Drop the second reader on
  minor findings first.
- **Cost limits** (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling): $40 per
  college per run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs
  and course objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

Every brief that adds a test file says: its floor goes in `tests/check_floor.json`, run the tests touching your files
plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest. A brief that adds
a migration says: it applies on the push of the `.apply` change, before any merge.

## Ledger (PR, branch, state) at the checkpoint

| PR or branch | State | Next |
|---|---|---|
| this checkpoint's PR, `claude/checkpoint-s644` | draft | merge on a green `test` |
| CPLBrain draft PR, `claude/confident-wozniak-irdwcw` (Sheet 187's source, the session note, the wiki touch) | draft | publish Sheet 187 from it, then merge |
| #3193 `claude/harvest-scorer-hours-ge-s644` (head `21a0bcdd`) | ready, CI running at 01:42Z | merge on green; rescore as a reviewed step |
| #3197 `claude/harvest-dated-reads-s644` (head `d7b88ab8`) | ready for review at 01:42Z | the worker's review fixes, merge |
| #3194 `claude/harvest-santiago-canyon-s644` | draft, red on `roep_display_test` | waits on #3197 (Open work 2) |
| #3195 `claude/harvest-diablo-valley-s644` (head `037581d8`) | draft, reader review running | review, merge |
| #3196 `claude/harvest-sjcc-pages-s644` (head `66254fb1`) | draft, reader review running | review, merge |
| `claude/harvest-noce-s644` | branch, no PR: NOCE's read and load receipt | merge into #3194's branch |
| `claude/harvest-sjcc-s644` | branch, no PR: a free capture only | per #3196 |
| `claude/harvest-wave-s644trial` | branch, trial run 43343741511 | read its table |
| `claude/confident-wozniak-irdwcw` (tracker) | branch, no PR: the census run commit `f371cf07` (*as reported*) | the conductor's call |
| #2894 `claude/cobix-inbox` | Sam's | untouched |

No S644 worker survives a new session. Brief a fresh one per open branch from its PR diff and this ledger.

## What shipped (S644): five PRs, each squash-merged on a green `test`

- **#3188** `b999cf76` First Light apply: COBIx's three findings on #3183 and four from review; the #3180 fallback
  comment (`sierra-page-redesign`).
- **#3189** `6b9296d2` the harvest gap census: `kb/_harvest_gap_census.py`, `harvest-gap-census.yml`,
  `kb/status/harvest_gap_census.{json,md}`.
- **#3190** `66945e6a` the display apply: paged before-read, eight parallel writes, a record filed from a confirming
  read, a missing key fatal only above max(1%, 30). Not yet run live.
- **#3192** `e6d2c178` why 1,604 active programs have no closed list
  (`docs/harvest_no_closed_list_diagnosis_s644.md`).
- **#3191** `6e8b267d` the wave runner: `program-requirements-wave.yml`, `kb/_program_requirements_wave.py`. Three
  review rounds plus COBIx's artifact-name finding. Version 1 writes no table.

## Live data written, each with its undo

- **Los Angeles City `step=load`**, run 43333288596, 23:59Z: 22 rows inserted (18 pass), insert-only; receipt on `main`
  (`a0afb88c`), which names every inserted key and is the rollback.
- **Santiago Canyon:** paid read 43339249633 ($16.98, 222 extracted, 148 pass the machine checks); `step=load` run
  43342030025, 01:05Z: 192 rows, all unchecked, 149 pass by the tab's rule; receipt on #3194's branch (the rollback).
- **North Orange Continuing Education:** paid read 43342034608 ($3.66, 82 extracted, 77 pass); `step=load` 01:22Z: 78
  rows, 77 pass; receipt on `claude/harvest-noce-s644` (the rollback). Neither college is displayed yet.
- **Model spend:** $20.64, each college under $40 (*as reported*).
- **`cpl_memory`:** none written yet. This checkpoint prepares the rows in
  `kb/receipts/cpl_memory_s644_rows_2026-11-13.sql` (rollback in its header); the conductor runs it.

## Decisions to honor

**Sam's:** his opening direction (above; row `sam-harvest-throughput-2026-11-12`), and his go for COBIx's offers and
bots, relayed by COBIx ("Sam's go, Nov 12, 4:55 PM PT"; "his go, 5:07 PM PT").

**The conductor's** (each a `cpl_memory` row, a DECIDED line in its lane, and a card on Sheet 187, cards 1 and 2, for Sam to revise):
1. Los Angeles City's 22 absent records loaded, IGETC 19842 and Cal-GETC 44946 included (`d-lacc-22-absent-loaded-s644`).
2. The display apply lists a missing key, fatal only above max(1% of statements, 30); the rollback names every row sent
   a write (`d-display-missing-threshold-s644`).
3. A wave is one branch, one PR, one filing job; $40 a college on the estimate and by a hard stop on actual cost; a
   re-run never extracts (`d-wave-one-branch-hard-stop-s644`; COBIx agreed, #3111 6839930221).
4. The price rate is max(0.08, the mean of filed records with a positive cost) (`d-wave-price-rate-floor-s644`).
5. `passes_live` stays equal only; the census and headline count by `counts_passing_on_tab`
   (`d-passes-live-stays-equal-only-s644`).
6. The no-colon hours reading is gated to San Bernardino Valley and Coalinga with positive evidence in the record's
   own section (`d-hours-reading-gated-sbv-coalinga-s644`).
7. Programs with no closed list are read and checked against the college's own active course list as a separate grade
   outside the headline (`d-no-closed-list-separate-grade-s644`); whether it counts is card B (Sheet 187 card 4).
8. COBIx's offers accepted: source scouting, the five-record spot-check after each wave, blast-radius ranking, the SLO
   lane after the first paid wave; two read-only bots, not built (`d-cobix-offers-specialist-bots-s644`).
9. A college PR's dated reads move to a runner job (#3197) (`d-dated-reads-runner-job-s644`).

## Waits for Sam (Open Asks Sheet 187 cards 3 to 5, and Sheet 186)

- **A (card 3).** Does his standing go of 2026-10-10 (a display build that follows a load needs no further go) still stand?
  COBIx could not confirm it from his records (#3111 6840723274). The display after tonight's loads waits on it.
- **B (card 4).** Does a program read against the college's own course list (1,604 with no closed list in the state file)
  count in the headline?
- **C (card 5).** A statewide Cal-GETC figure of 34 units would pass 93 more programs; so far each college's figure comes from
  its own printed areas.
- Still on [Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) cards 4 to 6: "deploy" for `docket-process` and `library-publish-now`; whether GitHub
  Actions may create pull requests; the six re-clustering cases and the Honors question.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest` NEXT (1):** #3193 on green, then its rescore as a reviewed step: the migration
   `kb/migrations/2026-11-13_s644_carry_basis_electives_fill_words.sql`, then reconcile and reread at San Bernardino
   Valley, Coalinga, Grossmont, ELAC, Pierce and Solano.
2. **Harvest NEXT (2):** #3197's fixes and merge; then on `claude/harvest-santiago-canyon-s644` merge `main` and
   `claude/harvest-noce-s644`, dispatch `program-requirements-dated-reads.yml` for both colleges, run
   `kb/_build_roep_display.py`, commit its outputs, green, merge #3194; then `step=display` on the new apply code (its
   first live run; card A, Sheet 187 card 3).
3. **Harvest NEXT (3):** the trial's table.
4. **Harvest NEXT (4):** #3195 and #3196 reviews and merges; free captures of Diablo Valley (procedure record first,
   JSON in the PR) and San Jose City; paid reads within $40.
5. **Harvest NEXT (5) and `commons`:** name the next wave's colleges to COBIx on #3111 for scouting; add the
   fixed-rule sample to the wave's filing job; census follow-ups (students reached as first sort key, missing display
   keys as a cause, display minutes on the run-health line).
6. **`governance-team-enablement` NEXT (1):** the first real daily run after #3180 (*First things* 4); NEXT (2) and
   (3): which workflows that push from their own groups should share one; the run-health file's scheduled writer.
7. **`sierra-page-redesign` NEXT:** the first hourly run of `first-light-apply.yml`; the three views read
   `hero_photos.json`; the first real Apply once Sam confirms the setting.
8. **`commons` re-clustering NEXT:** price the model pass (outside the $40 limits, so the price goes to Sam first);
   a potential-CPL column; the Leadership outlines. **`commons` NEXT (1):** the ASE slice's public copy.
9. **Harvest NEXT (6):** College of the Desert by `blocked_sources` (COBIx is scouting it); the catalog-year rule;
   De Anza's tail; Redwoods' reread.
10. Carried untouched: `cer-procedures` NEXT (5a) follow-ups and NEXT (1); `library` NEXT 0; `csm-workspace` and
    `implementation-funding` (the Funding Follow-up Dashboard session's lanes); `sierra-retrieval-corpus`; CPLBrain#765
    to close with a pointer (its content merged through #769).

## Not refreshed / left to the conductor

The documents worker made no Supabase call, published nothing, dispatched nothing, merged nothing and subscribed to
nothing. Left to the conductor: step 10, running `kb/receipts/cpl_memory_s644_rows_2026-11-13.sql` through the Supabase
MCP; step 12's headline and harvest SQL and the routine's `get_trigger`, so `kb/status/program-requirements.json`
carries S644's fields but its `headline` and `next_run` are not stamped; publishing Sheet 187 under its fresh
`SHEET_ID` and putting its link in `CLAUDE.md`'s standing-sheet line and the status file's three calls; merging this PR
and the CPLBrain PR. Refreshed: three lane files (`program-requirements-harvest`, `commons`, `sierra-page-redesign`),
`conductor_mode.md`, `docs/program_requirements_harvest_lessons.md`, `docs/commons_lessons.md`, `docs/INDEX.md` and the
catalog, the Program Requirements run log, the docs audit and its `--apply` stamp, the vault note, Sheet 187's source
and the wiki touch. Not touched: the pipeline view (no roadmap row, auditor count or re-mint moved), `kb/README.md`,
`README.md`, the other four run logs; no new KB note (the lessons are this repo's own).
Wiki candidates, written in the vault's wiki touch: the gap census and what it measures; the wave runner; the tab's
passing rule against the guard's.

## Patterns and lessons

- A new workflow file cannot be dispatched until it is on `main`: merge first, then trial on a branch.
- Read COBIx's threads at every wake: S644 missed his 00:21Z reply for forty minutes, and his finding on #3191's own
  thread was caught only because the thread was read before the merge.
- Page long comment threads with `perPage` 1 from the last page.
- Gate a free-text reading per college with positive evidence first; a statewide regex took three rounds and still
  passed constructed pages.
- A decision that changes a pinned test reverses someone's earlier decision: read why the test exists first. The
  conductor's own rules were wrong twice (the rate rule, `passes_live`) and review caught both.
- `get_job_logs`' tail is runner cleanup; reproduce a lint failure locally.
- A first-read college PR cannot go green without the display build: plan the dated reads and the build with the read.
- A worker's PR subscribes the session on its own; each notice costs context.
- The isolated documents worker cannot run git against `/home/user/CPLBrain`; it cloned the vault into its scratchpad
  and pushed from there. Pull `/home/user/CPLBrain` before writing in it.

## Let go

The documents worker holds no subscription, check-in or watch. The conductor's sign-off turn names and drops its own:
the PR subscriptions (the merged #3188 to #3192, which a worker's PR may have armed on its own, and the open #3193 to
#3197 and this checkpoint's PR), any scheduled check-in, and the artifact watch on Sheet 187 once published.

Greetings, you are SkyFinch (Session 645), see SkyWren's handoff — `docs/session_645_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_645_handoff.md) — let's keep rolling with our queue.
