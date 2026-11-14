---
title: "Session 648 handoff (from SkyPipit, S647)"
created: 2026-11-13
updated: 2026-11-13
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_650_handoff.md
---

# You are SkyTanager (Session 648)

From SkyPipit, S647, written at a full checkpoint at about 16:25Z 2026-11-13 by a documents worker, covering the whole
session: the morning's two halves, Sam's sheet answers (13:11Z to 14:11Z) and the afternoon (14:30Z to 16:20Z, Sam in
session). Facts come from the conductor's record, `origin/main` at `1b630eeb`, PRs #3231, #3232, #3233 and #3236, and
issues #3223 and #3228; a fact marked *as reported* was not re-read.

**How S647 ran.** A session took S647 at 08:55Z from handoff 647 and stopped at about 10:12Z with no handoff (its last
push 10:11:34Z); from about 09:29Z the Supabase connector refused every query and it rightly held every apply. The
11:12Z firing of the CPL Queue routine read the stop from #3205 green with COBIx's check left unmerged for an hour and
every thread quiet, opened draft #3221 as its declaration before any other write, and took the queue under the same
number (`scheduled_sessions.md`, *A session that stopped without a handoff*). Sam joined at 13:11Z, answered every
waiting card, ruled the shape of a card that needs him, and in the afternoon asked for the Commons data dashboard to be
completed and for the Exhibits fixes COBIx described. **The Supabase connector was down from about 12:40Z to the end of
the session**, so nothing after 12:37Z was written to or read from the database by the session.

## First things, in order

1. **Run the two NOT YET RUN `cpl_memory` receipts, in this order, then read back the carry-basis function.**
   `kb/receipts/cpl_memory_s647_sheet_shape_2026-11-13.sql` (Sam's card-shape ruling, his answers on Sheets 186, 187,
   188 and 190, and both Sheet 191 rulings; its header carries the one guarded supersede of
   `d-no-closed-list-separate-grade-s644`, to uncomment and run after the insert), then
   `kb/receipts/cpl_memory_s647_afternoon_2026-11-13.sql` (the afternoon's six rows). Sheet 191's rulings have no file
   of their own: they are in the first. Each is one call of three statements and returns its slugs. Then
   `select pg_get_functiondef('public.program_record_carry_basis(jsonb)'::regprocedure)` and confirm
   `electives_fill_words` and `hours_total_printed` are out of the carry basis (Sam said apply at 13:20Z,
   [Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ) card 6; `supabase-migrate.yml` run 43433381780
   applied it at 13:27Z, status and ledger 201, version 20261113132729, receipt
   `kb/receipts/migration_s644_carry_basis_electives_fill_words_43433381780.json`; nobody read it back).
2. **Deploy `docket-process`, then `library-publish-now`, from `main`**: Sam's go, 13:11Z,
   [Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) card 4. `cpl-chat-deploy.yml`, `confirm=DEPLOY`, one
   function per dispatch, then the library lane's smoke.
3. **#3227, the 503 fix** (`claude/extract-503-on-upstream-s647`, head `1a62b30a`, draft, not deployed): Sam's go,
   13:21Z, [Sheet 190](https://claude.ai/artifact/D3sp4Prwk3sueVtuAdDF6y) card 6. A review of at most 9 agents and
   COBIx's read, merge on a green `test`, then `cpl-chat-deploy.yml` with `confirm=DEPLOY` and
   `function=program-requirements-extract`. It conflicts with #3202's `extract()` (`7482ece6` is only on the Glendale
   branch); the PR says how to resolve it.
4. **Glendale, #3202** (draft, head `16e5d86e`, not loaded). The free page read 43423479582 found why neither CIS program
   got its own tab: the pre-filter read only a run's first number ("CS/IS 241, 242, 243"); the fix reads whole runs,
   Coursedog tabs only. NCHSD's heading names 31597, so 24432 read 31597's page (21 invented codes). Before
   `step=load`: hold 24432 as a wrong-tab read (`d-keep-passing-record-no-read-s647`) and give NCHSD to 31597; a small
   paid re-extract of the programs whose tab changes (both CIS programs, 37070, 31597, 24432), priced first and far under
   $40; one reader on the delta since `f852f421`; the compare tool (1 of 121 at `16e5d86e`: 19577, in teach-out, as
   intended). Hartnell's and Merced's next reads get a compare before filing. The harvest lane on that branch is over
   budget: when #3202 merges, keep `main`'s lane and add only what the branch learned.
5. **College of the Desert**, branch `claude/harvest-desert-read-s647` (head `1fa312e0`), no PR. Paid read 43421133593:
   358 extracted, 0 errors, 241 pass (221 before). Its summary's `cost_usd` 28.43 repeats the October baseline: read this
   run's own cost from the run. Then open its PR, the compare tool against `main`, `step=reread` (323 rows live, none
   checked), then the display build.
6. **Sam's rulings to carry out.** The six re-clustering cases as recommended (13:16Z, Sheet 186 card 6) and the Honors
   split (14:08Z, [Sheet 191](https://claude.ai/artifact/NeR8fkQoj9GVd53NhT29b9) card 1: an Honors course gets its own
   M-ID with a declared equivalence to its base course), under the commons lane's plan and the re-mint playbook
   (`docs/coursecontrolnumber_remint.md`). Cal-GETC at the statewide 34 units where a catalog names it and prints no
   figure (13:19Z, [Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) card 5): the reconcile step and the
   rescore it earns, about 93 programs, after item 1's read-back. The headline counts a program checked against its
   college's own course list, with a chip and a note (14:11Z, Sheet 191 card 2, his note verbatim: *"count them but add
   a chip and note about the discrepancy. it is most likely a coding anomaly that will later be untangled and
   resolved"*): the harvest lane's NEXT (9), a migration (Rule 10) and a rescore. The display go of October 10 stands for
   every college (13:18Z, Sheet 187 card 3).
7. **The Commons data dashboard's Coming next items and its two unreconciled figures.** The dashboard is live at
   `#commons/data` with four views (the dashboard, the college list with each college's row and side panel, the data
   dictionary at `#commons/data/dictionary`, the API checklist at `#commons/data/apis`), and its live figures come from
   `harvest-gap-census.yml` run 43456843640. Before either figure is quoted outward, reconcile courses on Active
   programs (88,736 in the live read against 89,192 in the checkpoint's harvest row) and courses with SLOs (13,293
   against 12,815); likely course-code matching. Build each Coming next item when its source exists; the College view
   only on Sam's word.
8. **The Exhibits rulings that wait**, [Open Asks Sheet 192](https://claude.ai/artifact/1Kt8Yg88NWUpFduHLofWHQ) cards
   4 to 6: the 26 Las Positas *Industry Training Evidence for <course>* cards; which test the "or" means in *ASE Bundle
   — A6 or T6 + L3*; COBIx's four CompTIA questions. Read the sheet's `replies` before acting. Meanwhile, tighten
   `named_credential`'s issuer-word test (COBIx on #3233), keeping the 11 proposals.

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it,
`df -h /`, `git worktree list`. Before any merge, read COBIx from the last comment (`perPage` 1 from the last page) on
#3111, #3202 and #3227; never `get` #3111 or #3110.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 (the receipts are
INSERT-only with their rollback in the header), 2 and 3 (Sam's go on file for each deploy), 4 up to its load (the paid
re-extract within $40, after the reader), 5 through its reread, the Cal-GETC reconcile, and builds that merge on green
after COBIx's review. A display after a load that passed its checks is covered by Sam's 2026-10-10 go, which stands for
every college; merging a college PR publishes its build, so COBIx's spot-check comes first. **Never run by a session
without his word:** the Commons College view; the three Exhibits rulings on Sheet 192; removing the repository copy of
`SUPABASE_SERVICE_KEY` (his setting); anything on the `CLAUDE.md` hold list. #2894 is his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S647, and what worked* included. If you hold the queue
by a declaration PR, push to it within each half hour.

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
| this checkpoint, tracker `claude/practical-meitner-knf5o3` | draft | merge on a green `test` |
| this checkpoint, vault `claude/determined-mayer-knf5o3` (Sheet 192's source, the session note, the wiki touch) | draft | merge after the tracker PR |
| #3227 `claude/extract-503-on-upstream-s647` (head `1a62b30a`) | draft, Sam's go on file | *First things* 3 |
| #3202 `claude/harvest-glendale-s645` (head `16e5d86e`) | draft, not loaded | *First things* 4 |
| `claude/harvest-desert-read-s647` (head `1fa312e0`) | no PR; paid read filed | *First things* 5 |
| #3231 `3c161841`, #3233 `d2d51532`, #3232 `d87d21db`, #3236 `1b630eeb` | merged on green (afternoon) | none |
| #3221, #3225, #3226, #3230; CPLBrain#773, #774, #775 | merged (the morning checkpoint, Sheet 191, its rulings) | none |
| #3205, #3218, #3206, #3216, #3207, #3222 | merged on green (morning, second half) | none |
| #3211, #3214, #3194 | merged (morning, first half) | none |
| `claude/harvest-rescore-{sbv,coalinga,grossmont,pierce,solano,elac}-s645`, the S645 proof and wave branches | throwaway, no PR | Sam or GitHub deletes them (sessions cannot) |
| #2894 `claude/cobix-inbox` | Sam's | untouched |

No S647 worker survives the session. Brief a fresh worker per branch from its diff and this ledger.

## What shipped (S647)

- **Morning, first half:** #3211 (Marin held for its outline reports), #3214 (the PDF reader's wrapped headings), #3194
  (Santiago Canyon); on Glendale, the records restored (`dae051c0`), the `extract_failed` keep (`7482ece6`) and
  `sources_from` (`f852f421`).
- **Morning, second half**, each squash on a green `test`: #3205 Diablo Valley (COBIx 5 of 5); #3218 the ranged PDF
  read; #3206 San Jose City (COBIx 4 agree, 1 differs on 37604); #3216 the Library's Draft 2; #3207 the rescore at six
  colleges (COBIx 5 of 5 from the run artifacts); #3222 the Commons data dashboard's slice 1.
- **Sheet 191 and the card shape** (#3226, #3230): a card that needs Sam carries a labeled block (*Yours to do*, *Needs
  your word*, *Yours to rule*) with numbered steps and links, and replies that name the act; the builder refuses the old
  shape from Sheet 191 on.
- **Afternoon**, each squash on a green `test` after COBIx's read and a review of three or four agents that found real
  faults in every PR: **#3231** slice 2 (a college's row and side panel as a dialog, the college in the address, COBIx's
  two `confidence()` edge cases; 10 review findings fixed, among them an inert leak on Back and two false TBA reasons);
  **#3233** the Exhibits fixes for #3223 and #3228 (Sam's *(ASE X standards)* titles stand, so Another look goes from 10
  cards to 3 and the rename batch from 6 rows to 2; a skip with no proposal saves `cert_rename_kept`; *Renames on
  approval*; a failed read of saved decisions is announced; course details above Words in common; MAP ids open a
  summary in the side panel; the course-title gate, 11 of 170 proposals changed); **#3232** the data (the `live-counts`
  job, the `live`, `overall`, `dictionary` and `apis` keys, `docs/reference/data_dictionary.md` with 19 datasets from
  #3220, rows in `data_sources.md`, a governance entry); **#3236** slice 3 (the overall bar, live counts per college,
  the dictionary and API views, the platform filter, Coming next).
- **Queue steps:** step 0 done by S646 at 06:14Z; steps 7 and 9 no open request; step 8 not due (Friday); step 10 and
  the UI pass done for the UTC day by S646 (#3210, #3212); step 11: `next_slo_colleges.py --next` names Allan Hancock,
  nothing dispatched.

## Live data written and read, each with its undo

- **Displays** (each files every row's prior build, the rollback): Santiago Canyon run 43415894285, 216 written
  (`27593f56`); Diablo Valley run 43416282209, 213 of 213 (`ee935e97`); San Jose City run 43418731809, 77 of 77
  (`d6ccfb00`); the whole build after #3207, run 43421037587, 18,179 planned and written, 0 errors (`058c0a1e`). The
  table lacks Monterey Peninsula 03653, 22098 and 39361, which the build carries.
- **Registry, College of the Desert:** `catalog.resume = true`; rollback in
  `kb/receipts/program_source_procedure_desert_resume_s647_2026-11-13.sql`.
- **Library:** `kb/receipts/cpl_library_s647_how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1.sql` (cohort
  `library-s647@bot`); `_rollback.sql` beside it restores from `cpl_library_history`.
- **Migration:** the carry-basis change, applied 13:27Z (run 43433381780); rollback `..._rollback.sql` beside its
  receipt. Not read back (*First things* 1).
- **The live read, read-only:** `harvest-gap-census.yml` run 43456843640 on `main` in the `live-counts` environment,
  committed `6e4b4c0d` at 15:58Z: 118 colleges, none unmatched; Active 20,282, Teachout 630, Approved 1,423; records
  18,195 (Active 16,713, passing 14,525, with program outcomes 14,078); courses on Active programs 88,736, with SLOs
  13,293, with objectives 2,880; registry catalog link 118, outline link 48, pathway source 26; overall mean 0.6293. No
  table, grant, function or migration; undo is `git revert` of the census commit.
- **Model spend:** Glendale's failed slow read 43384599013 about $9.33 (as reported by COBIx); Glendale's re-extract
  43415972509, $13.97; College of the Desert 43421133593, unread. Each under $40.
- **`cpl_memory`:** nine rows run at 12:37Z (`kb/receipts/cpl_memory_s647_rows_2026-11-13.sql`); two receipts NOT YET
  RUN (*First things* 1).

## Decisions to honor

**Sam's, in session or on a sheet** (verified rows, in the NOT YET RUN receipts until the next session runs them):
the card shape (`sam-card-that-needs-me-says-what-to-do-2026-11-13`; his words in `decision_sheets.md`); deploy both
functions; GitHub Actions may open pull requests (he turned it on); the six re-clustering cases; the display go stands;
Cal-GETC at 34; apply the carry basis; deploy the 503 answer; Honors gets its own M-ID; the headline counts own-list
programs with a chip and a note. In the afternoon: *"looks like we have more room in t his session, can we complete the
college data collection dash?"* (`sam-complete-data-dash-2026-11-13`); *"and the fixes to the commons exhibits cobix
commented on"*; and on the environment, *"environment done...see cobix comments"*, *"new environment is live-counts"*,
*"that's the name I gave it. if you want me to change it, let me know. it's still a repo secret too"*
(`sam-live-counts-environment-2026-11-13`). Relayed by COBIx: his words on #3215, #3219 and #3220.

**The conductor's** (each a `cpl_memory` row, a DECIDED line in its lane, and a card for Sam to revise): the morning's
five on [Sheet 190](https://claude.ai/artifact/D3sp4Prwk3sueVtuAdDF6y) cards 1 to 5 (a passing record kept when a read
finds no page; slice 1 on his relayed words; a data receipt is one plain statement; captured text checked from run
artifacts by COBIx; a stopped session's queue taken with a declaration PR). The afternoon's four on
[Sheet 192](https://claude.ai/artifact/1Kt8Yg88NWUpFduHLofWHQ) cards 1 to 3:
`d-commons-data-coming-next-s647` (a feature with no source is a Coming next line naming the source, never an empty
panel; card 1); `d-live-counts-controls-s647` and `d-student-boundary-wording-s647` (the export's controls, and the
dictionary's corrected sentence "Student records stay in MAP; COBI keeps counts."; card 2);
`d-exhibits-course-title-gate-s647` (a course title only for credit by exam and noncredit, an official name only for
industry certifications; card 3). **Declined:** making the Exhibits apply and rebuild fail loudly in the workflows (it
changes how the daily run fails).

## Waits for Sam

[Open Asks Sheet 192](https://claude.ai/artifact/1Kt8Yg88NWUpFduHLofWHQ) is current (`SHEET_ID`
`2026-11-13-open-asks-192`, published about 16:15Z, a fresh store, `replies` empty at publish by a list read). Cards 4
to 6 wait, each *Yours to rule*: **4** the 26 Las Positas *Industry Training Evidence for <course>* cards (keep
department and code, or take the course title, which reverses his 2026-11-12 ruling); **5** which test the "or" means in
*ASE Bundle — A6 or T6 + L3*; **6** COBIx's four CompTIA questions (who confirms a new official name; the exam series in
titles; whether the longer CNT 7285 title inherits the October 31 fold; CompTIA's place in the batch order), a picker
per question. Sheets 186 to 191 hold no waiting card. **#3217** (the CVC chip) stays parked until he lifts it.
The repository copy of `SUPABASE_SERVICE_KEY` is not on a sheet: it becomes a *Yours to do* card when the other keyed
workflows are in environments.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** (1) Glendale and (2) College of the Desert, *First things* 4 and 5; (3) a
   reading-procedure check for a record whose notes carry a rule its blocks do not (Santiago Canyon 11910, 32319, 31848;
   San Jose City 37604); (4) the PDF reader's wrapped-heading follow-ups; (5) #3227 and the Cal-GETC reconcile; (6) why
   the build carries Monterey Peninsula 03653, 22098, 39361 and the table does not; (7) COBIx's district files, the
   phase 0 builder, the CMS probe (#3198); (8) the wave's fixed-rule sample, census follow-ups, Copper Mountain, the
   catalog-year rule, De Anza, Redwoods; (9) the headline's own-list rule, chip and note. Step 11: Allan Hancock's SLO
   read.
2. **`commons`:** the data dashboard's NEXT (the two figures, then Coming next); the seven re-clustering changes;
   #3219 (the COR description step; Sam approves the PR); the ASE slice's public copy, then CompTIA, AWS, NCCER,
   military; the path mock's items.
3. **`cer-procedures`:** the issuer-word test in `named_credential`; Sheet 192 cards 4 to 6 once ruled; its NEXT list
   (the Fact Sheet's categories, the 362 credentials without a subject, the issuer registry, the trainer move).
4. **`governance-team-enablement`:** (1) move the other workflows that read `SUPABASE_SERVICE_KEY` into environments,
   one PR per group, listed by `grep -l SUPABASE_SERVICE_KEY .github/workflows/*.yml` (38 files on 2026-11-13; only the
   `live-counts` job runs in an environment); (2) then Sam removes the repository copy, his setting; (3)
   `tests/standards_2_ruled_renames_test.py` fails 6 of 27 on `main` and no workflow runs it (as reported): fix or
   retire it, and have CI run what stays; the daily-log and push-group items already listed there.
5. **`library`:** IACA's `regen` (`iaca-mvpmcjyl`) waits on what Crystal Nasio wants changed; NEXT 0, Sam's List
   publicly.
6. Carried untouched, each with its own NEXT: `sierra-page-redesign` (the first hourly `first-light-apply.yml` run,
   which can now open its pull request); `sierra-retrieval-corpus`; `csm-workspace`; `implementation-funding`;
   `college-district-identity`; `common-subjects-reference`; `org-phrase-scope-auth`; `reviewer-session-lifetime`.

## Not refreshed / what the conductor ran

A full checkpoint. The documents worker made no Supabase call, dispatched nothing, merged nothing, and published Sheet
192. **Step 12:** the conductor could not run SQL after 12:40Z, so the run logs under `kb/status/` are not restamped.
**The 12:37Z headline stands: 20,282 active, 14,525 complete, 118 colleges**; the 15:53Z live read returned the same
two figures by another route (run 43456843640). The harvest row and the CPL Queue routine's next run are not refreshed
(`get_trigger` is not in this firing). **Step 10:** written as a receipt, not run (*First things* 1). **Refreshed:** this
handoff; the lanes `commons`, `cer-procedures`, `eacr-exhibit-cr-adoption`, `governance-team-enablement` and
`program-requirements-harvest` (older paragraphs moved verbatim to `commons_lessons.md`,
`exhibit_canonicalization_lessons.md` and `governance_lessons.md`, each with an S647 section); `conductor_mode.md`;
INDEX and catalog; the docs audit; the `CLAUDE.md` sheet pointer (no rule touched); the vault note, Sheet 192's source
and the wiki touch. **Not touched, with reason:** the pipeline view (no roadmap row, auditor count or re-mint moved);
`kb/README.md` and `README.md` (the data views sit inside the Commons tab; no new tab); `data_sources.md` and
`data_dictionary.md` (#3232 wrote both; the audit flagged neither); no new KB note. Wiki candidates, written in the
vault's wiki touch: the Commons data dashboard; the `live-counts` environment; the student boundary; the course-title
gate.

## Patterns and lessons

- A session that cannot read a table back does not start a write to it; a receipt it prepares says NOT YET RUN in its
  first line.
- Run a review of three or four agents on every view and every keyed job, whatever the diff's size: in S647 it found
  real faults in every PR after COBIx had cleared it.
- Check a claim about the data against a file before it ships as a TBA reason or a correction.
- Merge the first of several PRs that regenerate the dependency map, then have the others merge `main` before their last
  test run.
- Read the staged diff before committing on a stop-hook's word; a stale index once held pre-fix copies.
- Read COBIx from the last page at `perPage` 1; have a worker read a long thread and report the tally.
- A free capture before each paid read; a compare tool before each load; remove a worker's worktree when its PR merges.

## Let go

This session subscribed to no PR, scheduled no check-in and watched no artifact (Sheet 192's publish confirmed no watch:
remote sessions cannot subscribe). No worker survives the session. Throwaway branches are listed in the ledger.

Greetings, you are SkyTanager (Session 648), see SkyPipit's handoff — `docs/session_648_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_648_handoff.md) — let's keep rolling with our queue.
