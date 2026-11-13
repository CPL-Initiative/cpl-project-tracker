---
title: "Session 649 handoff (from SkyTanager, S648)"
created: 2026-11-13
updated: 2026-11-13
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyOriole (Session 649)

From SkyTanager, S648. This is the **refresh** of the S648 checkpoint (#3251 `3fa25f10`, vault CPLBrain#779 `6245f8e4`),
a **light** checkpoint written by a documents worker at about 20:15Z 2026-11-13 **while the session continued**:
Glendale's load had run and its rereads were still to come. Start from it now, and read the Glendale table before you
act on Glendale. Facts come from the conductor's two records (18:36Z, and the addendum stamped 20:27Z; where they
differ the addendum wins), `origin/main` at `d679a4e3` and the merged squash commits; a fact marked *as reported* was
not re-read. The addendum's clock ran ahead: GitHub and the machine read about 20:12Z when its "20:15Z" read and
"20:25Z" dispatch were written, so order events by run id and commit, not by those stamps.

**How S648 ran.** Conductor mode (Fable 5.2 conductor, Opus 5.5 workers, ultracode on), from 17:05Z on handoff 648, Sam
in session (he wrote once, about 17:30Z: *"see cobix 3229 comments"*). The Supabase connector was up all session. No
other session was live at 17:06Z. Fourteen PRs merged; two stay open (#3202, #3250).

## First things, in order

1. **Glendale (#3202, draft, branch `claude/harvest-glendale-s645`, head `2a0e4631`). Read the table first:**
   `select count(*), count(*) filter (where extracted_run in (43415972509, 43497305929)), count(*) filter (where public.program_record_machine_pass(checks)) from program_requirement_records where college='Glendale Community College'`.
   Before the load: 226 live, 121 passing. The load ran (run 43498802104; its receipt on the branch records 31
   inserted). After the whole plan: **257 live, 174 on the two runs, 182 passing.** Then finish whichever remain, in
   order: `step=reread force=43415972509` (replaces 139), `step=reread force=43497305929` (replaces 4), the display
   build, COBIx's five-record spot-check on #3202 (31597, 42263, 02603, 18639, 18640; asked, not posted at writing), the
   merge on a green `test`. Plan: `kb/program_requirements_college/glendale_community/load_plan_s648.json` (on the branch).
2. **The FIRE merge's daily run.** Case 2 of the re-clustering is applied (FIRE M1274 into FIRE 130 X). The daily run
   dispatched after it committed at 19:53Z (`d679a4e3`) and FIRE M1274 left `unified_courses_index.js`. Confirm on FIRE
   130 X: members 23 to 51, units 3 to 4, eligible credits 667.4 to 1,022.4, students 48 to 58, and a new row-audit card
   (0.97, ready). Adopter and potential lists wait for the identities rebuild (commons NEXT 1).
3. **Cal-GETC 34, the next applies,** one college each: Cosumnes River (the statewide step for 30566, 33072, 39656; a
   hand-filed PDF with no committed page text, so read the page first), then Cerro Coso (`set` 35 from p.65, six
   programs). Held by name: Antelope Valley 43028, Los Angeles Southwest 33658, Sacramento City 30700, Cuyamaca 46530.
4. **The 17 colleges' free GE page reads** (names in the harvest lane, NEXT 5), each adding a step only with quoted
   evidence.
5. **The census re-run** dispatched on `main` about 17:56Z (`harvest-gap-census.yml`): read its result, so the College
   Data Collection lever reads "the pipeline's reconcile steps".
6. **Run `kb/receipts/cpl_memory_s648_refresh_rows_2026-11-13.sql`** (NOT YET RUN; four rows, longest summary 399),
   then **the checkpoint's step 12 live values**: the headline pair, the harvest row and the routine's `next_run_at`
   (`scripts/queue_status.py --headline-sql`, `--harvest-sql`, `get_trigger`), not refreshed since S647.
7. **The Exhibits rename batch** for Sam: *ASE Certificate Bundles: A6 or T6 + L3* rides it (cer-procedures NEXT).
8. **The post-deploy `{}` calls** to `program-requirements-extract`: still not run (the session holds neither key). The
   paid Glendale read exercised the caller check for real (73 calls, no 401 or 503); record that or COBIx's run.

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it,
`df -h /`, `git worktree list`, and **the issues COBIx opened or commented on today, checked against this list**. Read
the replies on [Open Asks Sheet 194](https://claude.ai/artifact/B6NYwHtu9cuMAEBqA9S6sq) before acting on anything it
names. Before any merge, read COBIx from the last comment (`perPage` 1 from the last page); never `get` #3111 or #3110.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 (after the table read; the
display go of 2026-10-10 stands for every college; merging publishes, so COBIx's spot-check first), 2, 3, 4, 5, 6.
**Never run by a session without his word:** anything on Sheet 194 cards 2 to 6 (the BUSI row delete included); #3250;
the four held re-clustering cases; the CVMA rows (a person's rows); removing the repository copy of
`SUPABASE_SERVICE_KEY` (his setting); anything on the `CLAUDE.md` hold list. #2894 is his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S648, and what worked* included: unsubscribe from a
worker's PR without reading the notice body; never `get` a PR for its comments; a load plan is measured against a live
read; read `date -u` before writing a time.

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
| this refresh, tracker `claude/checkpoint-s648-refresh` | draft | merge on a green `test` |
| this refresh, vault `claude/checkpoint-s648-refresh` (Sheet 194's source, the session note) | draft | merge after the tracker PR |
| #3202 `claude/harvest-glendale-s645` (`2a0e4631`) | draft; loaded, rereads to come | *First things* 1 |
| #3250 `claude/harvest-set-step-standing-s648` (`77c37ba7`) | draft; reverses Sheet 82 card 2 | Sam's ruling, Sheet 194 card 6 |
| merged: #3227 `dcba4c45`, #3242 `e8985e00`, #3240 `ae9dda52`, #3243 `ac7c6595`, #3241 `bbfbb6bb`, #3246 `57d99e14`, #3244 `74ad28b9`, #3247 `7cd72253`, #3251 `3fa25f10`, #3248 `2e5bcfc9`, #3239 `d8220db4`, #3252 `933b0dcd`, #3245 `c09ef2b3`; vault CPLBrain#779 `6245f8e4` | merged on green | none |
| #2894 `claude/cobix-inbox` | Sam's | untouched |

Workers do not survive the session; brief a fresh worker per branch from its diff and this ledger.

## What shipped after the first checkpoint

- **#3248** Exhibits follow-up: the shared-title count reads only issuers with tags or an industry type; *NFPA
  <number>* is a standard. **#3239** the S647 receipts marked RUN.
- **#3252** Grossmont Cal-GETC: reconcile 43482160320, reread 43485423251 (46136 alone), display build `3604c0bfe9bb`
  (applied record `99edbb11`); live read: 46136 at `ge_units` 34, passing (*as reported*). 46141 waits for the next
  reconcile; its fill by the printed figure is consistent with Sheet 82 card 2.
- **#3245** re-clustering: case 2 applied (below). Its review (6 agents, 16 confirmed) moved the BUSI split to a hold.
- **Glendale** reads: free 43472166835 (261 of 261 pages, 242 programs, 220 tabs with a control number); paid
  43497305929 (73 calls, 0 failed, $5.12 on a $7.30 estimate); load 43498802104. The load's hold guard failed open
  (the file step dropped the hold list); fixed on the branch, test added.

## Live data written, each with its undo

- **FIRE M1274 into FIRE 130 X:** one `kb_curation` row under `reclustering-s648@bot`, `supabase-migrate.yml` run
  43493272194 (version 20261113193615; receipt `kb/receipts/migration_s648_reclustering_cohort_43493272194.json`).
  Undo: one guarded delete (cohort, field `merge_into`, course_id FIRE M1274), `kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql`.
- **Grossmont 46136:** reread 43485423251, before-values in its receipt; display build `3604c0bfe9bb` (each prior
  build filed).
- **Glendale:** load 43498802104 (31 rows; its receipt is the rollback); the rereads to come carry before-values.
- **`cpl_memory`:** the twelve S648 decision rows (receipt `kb/receipts/cpl_memory_s648_rows_2026-11-13.sql`, RUN about
  18:47Z), Sam's two rows; undo by slug. The four refresh rows are not yet written.
- **Model spend:** College of the Desert 43421133593 $1.44; Glendale 43497305929 $5.12.
- Earlier in S648 (College of the Desert's reread, load, display and the 10195 restore): see the harvest lane.

## Decisions to honor

**Sam's:** his #3229 words (relayed by COBIx, 7:13 AM PT, verbatim in the vault braindump): confidence and completeness
up, review down; no expectation of double work; college staff directions later, through a signed-in Sierra.

**The conductor's**, each a row, a DECIDED line and part of a card on Sheet 194: the twelve of the first checkpoint, and
`d-fire-m1274-into-fire-130x-applied-s648`, `d-busi-split-held-for-delete-s648` (commons),
`d-glendale-load-plan-s648` (harvest), and the pitfall `p-load-plan-from-live-read-s648`. The BUSI row replaces the
insert-only clause of `d-reclustering-three-held-s648`.

## Waits for Sam

[Open Asks Sheet 194](https://claude.ai/artifact/B6NYwHtu9cuMAEBqA9S6sq) is current (`SHEET_ID`
`2026-11-13-open-asks-194`, Version 1 published by the documents worker, a fresh store, `replies` empty at publish).
Sheet 193 (https://claude.ai/artifact/XNwKc2jLizwx4baMK6mZWU) is superseded; its store and Sheet 192's held no reply at
the refresh. **Card 1** is the S648 decisions to revise. **2** re-clustering, *Yours to rule*: the Honors reach (M-IDs
only recommended, 3 new; official ids too, 136), AJ 160, MUS 130, REAL M1038 with M1040 (keep each), MATH M1044 (who
settles the refrigeration lab articulation). **3** *Needs your word*: delete the title-matching bot's row BUSI M10XW
merge_into BUSI M1228 (`automerge-titlelane-v1@bot`) so the BUSI split is clean. **4** the three CVMA rows. **5** Las
Positas (Sheet 192 card 4 carried). **6** draft #3250 (merge or close). COBIx is also raising the CompTIA exam-series
question with Sam. #3217 stays parked.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** (1) Glendale; (2) a stored hold for Desert 10195 and the one-college workflow
   that files nothing after a mid-read halt; (3) the reading-procedure check; (4) the PDF reader's wrapped-heading
   follow-ups; (5) Cosumnes River, Cerro Coso and the 17 page reads; (6) Monterey Peninsula's three build-only programs;
   (7) the district phase 0 builder and the CMS probe; (8) the wave's sample, census follow-ups, Copper Mountain, the
   catalog-year rule, De Anza, Redwoods; (9) the headline's own-list rule, chip and note (a migration and a rescore).
2. **`commons`:** (1) confirm the FIRE figures, then rebuild the identities map; (2) price the model pass for Sam; (3) a
   potential-CPL column; (4) the Leadership outlines; the census re-run's result; #3219 (Sam approves).
3. **`cer-procedures`:** the rename batch; wiring `series_aliases` into `kb/credential_aliases.py`; its NEXT list.
4. **`governance-team-enablement`:** keyed workflows into environments; `kb/_second_reader.py` exits 0 when the database
   is down; the deploy workflow's comment names only `group_queue.mjs`.
5. **`library`:** IACA's `regen` waits on Crystal Nasio. Carried untouched, each with its own NEXT:
   `sierra-page-redesign`, `sierra-retrieval-corpus`, `csm-workspace`, `implementation-funding`,
   `college-district-identity`, `common-subjects-reference`, `org-phrase-scope-auth`, `reviewer-session-lifetime`,
   and `eacr-exhibit-cr-adoption` (the Exhibits work of S648 lives in `cer-procedures`).

## A light refresh: what it touched and skipped

Touched: this handoff; the lanes `commons`, `program-requirements-harvest`, `cer-procedures`; `conductor_mode.md`'s S648
lessons; the `CLAUDE.md` sheet pointer (no rule touched); the run logs' sheet links (`course`, `exhibit`,
`program-requirements`, `commons.json`) and a BUSI call in `course.json`; the docs audit; the refresh receipt (not run);
in the vault, Sheet 194's source, the S648 session note and a wiki touch (Grossmont, the first Cal-GETC apply, on the
harvest page and in `log.md`). **Skipped, with reason:** step 10's rows (prepared, not run:
no Supabase call from the worker); step 12's live headline, harvest row and `next_run_at` (the conductor's SQL); the
pipeline view and the lessons docs (no retired lane text); `kb/README.md`, `README.md` and the KB notes (nothing new);
a wiki line for the FIRE merge (no wiki page tracks re-clustering cases).

## Patterns and lessons

- Measure a load plan against a live read; test a guard that reads another step's list with that list missing.
- When the clean route needs a delete, put the delete to Sam.
- Read `date -u` before writing a time.
- Length-check a prepared receipt when it is written; a reader runs the code before a dispatch that touches shared
  reader code; per-college evidence in config, never a pattern over catalog prose.

## Let go

The documents worker subscribed to no PR and scheduled nothing. **Publishing Sheet 194 registered an artifact watch on
the S648 session** (the tool arms one on every publish); the conductor drops it with Sheet 193's at sign-off and names
both in its own sign-off.

Greetings, you are SkyOriole (Session 649), see SkyTanager's handoff — `docs/session_649_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_649_handoff.md) — let's keep rolling with our queue.
