---
title: "Session 646 handoff (from SkyFinch, S645)"
created: 2026-11-13
updated: 2026-11-13
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyOriole (Session 646)

Written for SkyFinch (S645, the conductor) by a documents worker at a full checkpoint, about 04:15Z 2026-11-13. Sam
opened S645 at 02:31Z 2026-11-13 with handoff 645's line and nothing else. In session he wrote one more line, verbatim:
"FYI got an sql approve request you should have with for already". Through COBIx (#3111 comment 6842097699; COBIx chat,
6:33 PM PT 2026-11-12) he gave two gos: the first live run of the #3190 display apply, and unparking Glendale. On #3198
he ruled 72 districts plus Calbright and three SIS pilots (Los Angeles CCD, Citrus, Riverside CCD). Facts come from the
conductor's ledger, `origin/main` (`0443780f`) and the open PRs at about 04:05Z; a fact marked *as reported* was not
re-read. Items marked *in flight* were moving when this was written.

## First things

1. **#3201, the PDF reader** (head `241a8950`, decision 13; decision 14 *in flight* on worker a30ebe…): when its head
   carries decision 14 and round 2's list, one delta review (small), a Santiago Canyon free capture on
   `claude/harvest-santiago-canyon-proof-s645`, merge on green, then `main` into `claude/harvest-santiago-canyon-s644`
   (#3194) and the paid reread forcing the 29 numbers in *Open work* 1 (about $5 to $7).
2. **Read COBIx before any merge:** #3111 and #3110 from the last comment (`perPage` 1), #3198, and his spot-checks of
   #3205, #3206 and #3207 (five records each; the rescore's five movers are on #3111 6843185572: San Bernardino Valley
   35699, Coalinga 44511, Grossmont 30977, ELAC 32154, Solano 36302).
3. **The first real daily run after #3180** (06:17 UTC 2026-11-13): its log and whether its push landed.
4. Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions`, `df -h /`,
   `git worktree list`. If S645's sign-off did not record it, run the second statement of
   `kb/receipts/cpl_memory_s645_rows_2026-11-13.sql` (13 rows, NOT RUN at writing).

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *Open work* 2 once COBIx's spot-check of a PR
is on its thread (merge on green, never before the check), 3, 4 and 7. A display after a load that passed its checks is
covered by Sam's 2026-10-10 go now that the first run has gone (`sam-first-display-run-explicit-go-2026-11-12`); post
each run's record, receipt and minutes on #3111. **Waits for Sam, never run by a session:** the migration push (*Waits
for Sam*); cards 4 and 5 of [Open Asks Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA); cards 4 to 6 of
[Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt); anything on the `CLAUDE.md` hold list. #2894
is his. **[Open Asks Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ)** is current (Version 1, published
about 04:10Z 2026-11-13 by the documents worker, a fresh store, `replies` empty at publish; `SHEET_ID`
`2026-11-13-open-asks-188`, 58,020 bytes): S645's seven decisions on cards 1 to 5, the migration push on card 6. Sheets
187 and 186 stay current for their own waiting cards; 188 points to them.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S645, and what worked* included.

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

## Ledger (PR, branch, state) at writing

| PR or branch | State | Next |
|---|---|---|
| this checkpoint, `claude/confident-clarke-b8vkms` (tracker) | draft | merge on a green `test` |
| CPLBrain, `claude/confident-clarke-b8vkms` (Sheet 188's source, the session note, the wiki touch) | draft | merge after the tracker's |
| #3201 `claude/harvest-pdf-control-number-s644` (head `241a8950`) | draft; decision 14 *in flight* | First things 1 |
| `claude/harvest-santiago-canyon-proof-s645` (head `b491fbae`) | proof branch; capture on decision 13 dispatched 03:55Z, not read | free capture on #3201's final head |
| #3194 `claude/harvest-santiago-canyon-s644` | "HELD:", draft | `main` in after #3201, paid reread forcing 29 |
| #3205 `claude/harvest-diablo-valley-read-s644` (head `6f11651c`, build `3ad0a842ce11`) | draft, loaded | COBIx's spot-check, merge on green |
| #3206 `claude/harvest-sjcc-s645` (head `c3cc4f5c`) | draft, loaded; display build *in flight* | COBIx's spot-check, merge on green |
| #3207 `claude/harvest-rescore-3193-s645` (head `e647443d`, build `1efcc13ee048`) | draft, reread live | COBIx's spot-check, merge on green |
| `claude/harvest-rescore-{sbv,coalinga,grossmont,pierce,solano,elac}-s645` | carried by #3207; each holds its reread receipt | none after #3207 merges |
| #3202 `claude/harvest-glendale-s645` (head `f02dcb9e`) | draft; second free capture dispatched 03:57Z (*in flight*) | read the capture, dated reads, paid read within $40 |
| `claude/harvest-diablo-valley-listing-s645` | worker ae806a… on the 115 not-found (*in flight*) | its PR |
| #3196 `048d3fc7`, #3200 `f74434c7`, #3204 `867a46f6` | merged on green | none |
| `claude/harvest-wave-s645a`, `claude/harvest-pdf-cn-proof-s645`, `claude/harvest-pdf-cn-proof2-s645`, `claude/harvest-pdf-baseline-s645` | throwaway, no PR | Sam or GitHub deletes them (sessions cannot) |
| `claude/harvest-santiago-canyon-proof-s645` | throwaway once #3201 merges | same |
| `claude/migrate-carry-basis-s645` | never created (the push was refused) | Waits for Sam |
| #2894 `claude/cobix-inbox` | Sam's | untouched |

No S645 worker survives a new session. Brief a fresh one per branch from its diff and this ledger.

## What shipped (S645)

- **#3196** `048d3fc7` San Jose City's stored course codes; **#3200** `f74434c7` North Orange Continuing Education
  (the fix: a `COLLEGE_NAMES` entry in `kb/_build_commons_status.py`); **#3204** `867a46f6` the display step's
  `display_college` input (`--apply --college`). Each squash-merged on a green `test`.

## Live data written, each with its undo

- **First live display run**, run 43358665534 on `main`, North Orange Continuing Education alone: 78 of 78 written,
  record `kb/receipts/program_requirement_records_display_2026-11-13_38a0fd8ed41f.applied_43358665534_north-orange-continuing-education.json`
  (the rollback: the 78 keys to null by guarded update). Posted on #3111 6842893406.
- **Whole build**, run 43358971128: 17,595 written, 3 missing (Monterey Peninsula 03653, 22098, 39361), 0 errors;
  record `...38a0fd8ed41f.applied_43358971128.json` on `main` (`0443780f`): 22 rows to null, the rest by a display run
  on a ref carrying `8fbbcfb7a9c0`. Live 03:40Z: 17,673 at `38a0fd8ed41f` (115 colleges), 280 with no display
  (Santiago Canyon 192, Diablo Valley 88), 16 at `0874a3a15f22`. Posted on #3111 6843097058.
- **The #3193 rescore**, six rereads 03:42Z: 126 rows replaced (Coalinga 5, Grossmont 30, Pierce 17, Solano 18, San
  Bernardino Valley 27, ELAC 29), 62 fail to pass, none pass to fail; three record files restored from `main` before
  the reread (Solano 38591; ELAC 08252, 02430). Each receipt on its rescore branch holds before-values and a rollback
  statement. Posted on #3111 6843185572.
- **Diablo Valley** load 43357065225: 88 of 90 inserted (08013, 41233 skipped); **San Jose City** load: 77 of 84
  inserted. Insert-only; each receipt is the rollback. Model spend $12.26 (Diablo Valley $5.63, San Jose City $6.63).
- **Glendale's** registry row and procedure record v1, 02:52Z (md5 `47c9a5f92f56e985aaadbf2be9a2a236`, was none);
  receipt and rollback on #3202.
- **`cpl_memory`:** six rows at about 02:45Z (the two S644 rows and four of Sam's), returned; 13 more prepared, NOT RUN
  at writing. Receipt `kb/receipts/cpl_memory_s645_rows_2026-11-13.sql`, rollbacks in its header.

## Decisions to honor

**Sam's:** his go for the first display run (`sam-first-display-run-go-2026-11-12`), which ends the explicit-go wait;
after it his 2026-10-10 go covers a display after a load that passed its checks
(`sam-first-display-run-explicit-go-2026-11-12`); Glendale unparked for its 2026-27 Coursedog catalog
(`sam-glendale-unpark-2026-11-12`); district profiles, 72 districts plus Calbright
(`sam-district-profiles-vision-2026-11-12`), with the SIS pilots Los Angeles CCD, Citrus and Riverside CCD
(`sam-banner-pilot-citrus-2026-11-12`); his FYI about the SQL prompt (`sam-sql-approve-fyi-2026-11-13`).

**The conductor's** (each a `cpl_memory` row, a DECIDED line in the harvest lane, and a card on
[Open Asks Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ), current, for Sam to revise):
1. A new apply runs live on one college first, the whole build after the live count matches (`d-display-first-run-one-college-s645`; card 1).
2. The PDF reader binds by the printed number line where a college's own evidence gates it; a filed record is never dropped (`d-pdf-reader-number-line-design-s645`; card 2).
3. The rescore ran with a compare gate before each reread, the migration unapplied (`d-rescore-six-colleges-live-s645`; card 3).
4. Diablo Valley and San Jose City loaded, unchecked (`d-dv-sjcc-loaded-s645`; card 4).
5. Merging a college PR publishes its display build, so COBIx's spot-check comes first (`d-merge-is-publication-spot-check-first-s645`; card 4).
6. Glendale's registry and procedure moved to Coursedog 2026-27 (`d-glendale-registry-coursedog-s645`; card 5).
7. District profiles start as repo files, no table yet (`d-district-profiles-files-first-s645`; card 5).
8. Corrected in session: #3201's snapshot follows the gap census's pattern (a dispatch-only workflow writes it; no
   `--check` in the filing workflows), inside row 2.

S644's decisions stand as recorded in handoff 645.

## Waits for Sam

- **The migration push** ([Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ) card 6, current): the push of
  the `.apply` change for `kb/migrations/2026-11-13_s644_carry_basis_electives_fill_words.sql` was refused by the
  auto-mode permission check at about 03:25Z, and was not worked around (the hold list). It replaces one 23-line
  function and writes no rows; nothing tonight depends on it.
- [Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) (current for these) card 4, does the course-list grade
  count in the headline; card 5, a statewide Cal-GETC of 34 units.
- [Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) (current for these) cards 4 to 6: "deploy" for
  `docket-process` and `library-publish-now`; whether GitHub Actions may create pull requests; the six re-clustering
  cases and the Honors question.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest` NEXT (1):** #3201 (*First things* 1). Santiago Canyon's force list (29): 11856, 11858, 11860, 11874, 11909,
   11943, 11947, 11948, 11985, 11986, 13230, 13232, 13234, 19588, 19590, 22271, 31588, 31847, 32319, 37073, 37132,
   38157, 39807, 40639, 42990, 44326, 45579, 45606, 45737.
2. **Harvest NEXT (2):** #3205, #3206, #3207 after COBIx's spot-checks, each on green; a later merge rebuilds its
   display build, then the display under the standing go.
3. **Harvest NEXT (3):** Glendale (#3202): read the second capture, dated reads, a paid read within $40.
4. **Harvest NEXT (4):** Diablo Valley's 115 not-found pages (`claude/harvest-diablo-valley-listing-s645`).
5. **Harvest NEXT (5):** the migration, on Sam's go.
6. **Harvest NEXT (6):** COBIx's district files on a branch and the phase 0 builder; the CMS public-view probe (#3198
   answer 4).
7. **Harvest NEXT (7):** the fixed-rule sample in the wave's filing job; census follow-ups; Copper Mountain's empty
   capture. **First Light minor finding** (COBIx #3110 6840146308): the held mark hides the open PR link.
8. **Harvest NEXT (8):** College of the Desert by `blocked_sources`; the catalog-year rule; De Anza's tail; Redwoods'
   reread.
9. **`governance-team-enablement` NEXT:** the first daily run after #3180 (*First things* 3); which workflows that push
   from their own groups should share one; the run-health file's scheduled writer; the worktree skip in the resolver test.
10. Carried untouched: `sierra-page-redesign` (the first hourly `first-light-apply.yml` run), `commons` re-clustering,
    `cer-procedures`, `library` NEXT 0, `csm-workspace`, `implementation-funding`, `sierra-retrieval-corpus`.

## Not refreshed / left to the conductor

The documents worker made no Supabase call, dispatched nothing and merged nothing; it published Sheet 188. **Left to the
conductor:** step 10's second statement (13 rows, NOT RUN); step 12's headline and harvest SQL and the stamp
(`kb/status/program-requirements.json` carries S645's session fields, changes, next step and the migration call, not
stamped); the routine's `get_trigger` (`next_run` not refreshed). **Refreshed:** the harvest lane, its lessons doc,
`conductor_mode.md`, `approval_prompt_hooks.md`, the receipts, INDEX and catalog, the docs audit and its `--apply`
stamp, the `CLAUDE.md` sheet pointer, the vault note, Sheet 188 and the wiki touch. **Not touched, with reason:** the
governance lane (already over its size budget, and the permission note belongs in `approval_prompt_hooks.md`); the
pipeline view (no roadmap row, auditor count or re-mint moved); `kb/README.md` and `README.md` (no structure or surface
change); the other four run logs (no reference moved); no new KB note (the S645 lessons sit in the lessons doc and
`conductor_mode.md`). Wiki candidates, written in the vault's wiki touch: the display apply runs one college or the
whole build; Glendale reads from Coursedog; merging a college PR publishes its build.

## Patterns and lessons

- A new apply's first live run goes out on one college; the count gate is a live SELECT, never the job's green.
- Merging a college PR publishes its display build: the spot-check comes before the merge.
- A compare gate before a reread: the reconcile path has no kept-passing guard.
- Merge `main` into a college branch before its dated reads.
- Read the gap census before naming a wave; a wave over filed colleges extracts nothing.
- A committed snapshot with a `--check` couples every college PR; write it from a dispatch-only job.
- Drop a worker PR's subscription when the PR opens; resume a finished worker when disk holds no new worktree.
- Page COBIx's threads from the last comment; read large files by section (40,000 tokens went at S645's start).
- A permission-check refusal goes to Sam on a sheet card, never around.

## Let go

At sign-off the conductor drops: the check-in `trig_016xKUJJaBu943Niqpai4S43`; the subscriptions on this checkpoint's
two PRs and any PR a worker opened (#3202, #3204, #3205, #3206, #3207 were dropped as they opened); the artifact watch
on [Open Asks Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ), armed by its publish. The conductor
confirms the final list before sign-off.

Greetings, you are SkyOriole (Session 646), see SkyFinch's handoff — `docs/session_646_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_646_handoff.md) — let's keep rolling with our queue.
