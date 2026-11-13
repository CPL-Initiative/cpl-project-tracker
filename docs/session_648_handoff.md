---
title: "Session 648 handoff (from SkyPipit, S647)"
created: 2026-11-13
updated: 2026-11-13
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyTanager (Session 648)

## Since this handoff was written (Sam, 13:11Z to 13:20Z 2026-11-13)

Sam answered every sheet that carried a waiting card. Your work, in this order:

1. **Deploy `docket-process`, then `library-publish-now`, from `main`** — his go, 13:11Z,
   [Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) card 4. **Not yet deployed:** S647's Supabase
   connector was down, so this is your first item (`cpl-chat-deploy.yml`, `confirm=DEPLOY`, one function per
   dispatch), then the library lane's smoke.
2. **Read back the carry-basis migration.** Sam said apply at 13:20Z ([Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ)
   card 6) and it applied at 13:27Z: `supabase-migrate.yml` run 43433381780, status and ledger 201, version
   20261113132729, receipt `kb/receipts/migration_s644_carry_basis_electives_fill_words_43433381780.json`. The
   permission check did not refuse this time. Nobody read the function back from the database, so run
   `select pg_get_functiondef('public.program_record_carry_basis(jsonb)'::regprocedure)` and confirm both
   `electives_fill_words` and `hours_total_printed` are out of the carry basis.
3. **Read the first hourly `first-light-apply.yml` run.** Sam turned on the setting that lets GitHub Actions open
   pull requests, 13:15Z, Sheet 186 card 5, so that run can now open its one pull request.
4. **Carry out the six re-clustering cases as recommended** — his ruling, 13:16Z, Sheet 186 card 6 — under the
   commons lane's plan and the re-mint playbook. The **Honors** question he left for a note is Sheet 191 card 1.
5. **The 503 change** has his go (13:21Z, [Sheet 190](https://claude.ai/artifact/D3sp4Prwk3sueVtuAdDF6y) card 6):
   it is built on draft #3227 (`claude/extract-503-on-upstream-s647`, head `1a62b30a`, not deployed, no review yet):
   a review of at most 9 agents and COBIx's read, merge on green, then dispatch `cpl-chat-deploy.yml` with
   `confirm=DEPLOY` and `function=program-requirements-extract`. It will conflict with #3202's `extract()`
   (`7482ece6` is only on the Glendale branch); the PR says how to resolve it. **The display go of October 10 stands for every college**
   (13:18Z, [Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) card 3), and a catalog that names
   Cal-GETC and prints no figure **takes the statewide 34 units** (13:19Z, Sheet 187 card 5) — the reconcile step and
   the rescore it earns, about 93 programs, are yours.

**Sam's ruling on the shape of a card that needs him (2026-11-13), verbatim.** Looking at Sheet 186 card 5, whose
decision read "turn it on" and whose reply row opened on a highlighted *Waits for my send or go*:

> "I don't understand ones like this, where you decide to turn it on, which I agree, but then give me a recommend to
> wait or go...makes no sense to me"

and, once the steps were listed for him in chat:

> "ok, good. change the button to be clearer an include specific instructions and links for me (like what you just
> did). I already did this so will mark the card:)"

So a card that needs him now carries a labeled block above the replies — *Yours to do*, *Needs your word* or *Yours
to rule* — with numbered steps and a link wherever one exists, and replies that name the act. No status chip. The
builder (`CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py`) refuses the old shape from Sheet 191 on;
Sheets 181 to 190 are grandfathered, because their replies are keyed to card position.

**[Open Asks Sheet 191](https://claude.ai/artifact/NeR8fkQoj9GVd53NhT29b9) is current.** Two cards wait: the Honors
question, and Sheet 187 card 4, which he marked Follow up with *"I don't understand this one. give me two examples"*
and which 191 restates with Irvine Valley 45871 and College of Alameda 9013 against Diablo Valley's Dental Hygiene
A.S. Sheets 186 to 190 hold no waiting card.

**The `cpl_memory` rows for all of this wait in a file**, not in the table: the Supabase connector was down, so
`kb/receipts/cpl_memory_s647_sheet_shape_2026-11-13.sql` is marked NOT YET RUN. Run it, then the rows exist.
**S647's model fell back from Fable 5.2 to Opus 5 at about 13:20Z**; the conductor settings below still name
Fable 5.2.

Written for SkyPipit (S647, the conductor) by a documents worker at a full checkpoint, about 12:45Z 2026-11-13, for
both halves of S647. **The first half stopped without a handoff.** A session took S647 at 08:55Z from handoff 647 and
stopped at about 10:12Z (its last push 10:11:34Z, its last comment 10:11Z on #3202); its record is `main` since handoff
647, its PRs, and its comments on #3111 and #3202. From about 09:29Z the Supabase connector refused every query, and
that session held every apply. **The second half is the 11:12Z firing of the CPL Queue routine.** It found #3205 green
with COBIx's 5 of 5 left unmerged for an hour and every thread quiet, read that as a stopped session, opened draft #3221
as its declaration at 11:17Z before any other write, and took the queue under the same number
(`scheduled_sessions.md`, *A session that stopped without a handoff*). The database answered from 11:15Z. The firing
had no `list_sessions`, `get_trigger`, `send_later` or `set_session_tags`. Sam was not in session. Facts come from the
conductor's record, `origin/main` (`bc376fe5`) and branch heads read at writing; a fact marked *as reported* was not
re-read.

## First things

In this order; read each from its branch or PR.

1. **Glendale (#3202, draft, head `16e5d86e`).** The free page read 43423479582 found why neither CIS program got its own
   tab: the pre-filter read only a run's first number ("CS/IS 241, 242, 243"); the fix reads whole runs, Coursedog tabs
   only. NCHSD's heading names 31597, so 24432 read 31597's page (21 invented codes). Before `step=load`: have the
   reader hold 24432 as a wrong-tab read (the conductor's decision) and give NCHSD to 31597; a small paid re-extract of
   the programs whose tab changes (both CIS programs, 37070, 31597, 24432), priced first and far under $40; one reader
   on the delta since `f852f421`; the compare tool (1 of 121 at `16e5d86e`: 19577, in teach-out, as intended). The
   fix may change Hartnell's and Merced's matching: their next read gets a compare before filing. The harvest lane on
   that branch is 21,054 bytes against a 20,000 budget: when #3202 merges, keep `main`'s lane (rewritten here) and add
   only what the branch learned.
2. **College of the Desert, branch `claude/harvest-desert-read-s647` (head `1fa312e0`), no PR.** Paid read 43421133593:
   358 extracted, 0 errors, 241 pass (221 before). The summary's `cost_usd` 28.43 repeats the October baseline, so read
   this run's own cost from the run. Then open its PR, the compare tool against `main`, `step=reread` (323 rows live,
   none checked), then the display build.
3. **The Commons data dashboard, the next slices** (`commons` lane NEXT). Slice 2 takes COBIx's two edge cases: below the
   strong threshold a college reads limited whatever its differ count; a deterministic tie-break on equal
   `checked_at`. Then the overall bar from a builder export on the census schedule (counts per college only, the
   Actions secret, no new anon grant, its own `read_at`). The College view and later slices wait for Sam's go.
4. **#3219** (the COR description step, not a go; Sam approves the PR) and **#3220** (the data element dictionary, a
   docs proposal). #3217 stays parked: build nothing, pull nothing from CVC.
5. **The migration push** waits for Sam on [Open Asks Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ)
   card 6.
6. Before any merge, read COBIx from the last comment (`perPage` 1 from the last page) on #3111, #3202, #3215 and #3222;
   never `get` #3111 or #3110. Better still, have a worker read the thread and report the tally. Then Rule 8's
   `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it, `df -h /`,
   `git worktree list`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 up to its load (the paid
re-extract within $40, after the reader), 2 through its reread, 3 and 4 as builds that merge on green after COBIx's
review. A display after a load that passed its checks is covered by Sam's 2026-10-10 go
(`sam-first-display-run-explicit-go-2026-11-12`); merging a college PR publishes its build, so COBIx's spot-check comes
first. **Waits for Sam, never run by a session:** the migration push; the 503 change; cards 4 and 5 of [Sheet
187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA); cards 4 to 6 of [Sheet
186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt); the Commons College view; anything on the `CLAUDE.md` hold list.
#2894 is his. **[Open Asks Sheet 190](https://claude.ai/artifact/D3sp4Prwk3sueVtuAdDF6y)** (Version 1, published about
12:40Z by the documents worker; `SHEET_ID` `2026-11-13-open-asks-190`, 58,312 bytes, a fresh store, `replies` empty at
publish by a list read) is current: S647's decisions on cards 1 to 5, and card 6 waits (the 503 change). Sheets 188, 187
and 186 stay current for their own waiting cards; [Sheet 189](https://claude.ai/artifact/K8pAMkQywm4VmGBAKbSf6x) holds
S646's decisions. 190 points to all four.

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
| #3221 `claude/practical-meitner-knf5o3` (this checkpoint) | draft | merge on a green `test` |
| CPLBrain#773 `claude/determined-mayer-knf5o3` (Sheet 190's source, the session note, the wiki touch) | draft | merge after #3221 |
| #3202 `claude/harvest-glendale-s645` (head `16e5d86e`) | draft, not loaded | *First things* 1 |
| `claude/harvest-desert-read-s647` (head `1fa312e0`) | no PR; paid read filed | *First things* 2 |
| #3205 `2cd175d1`, #3218 `f7f24a6a`, #3206 `e97fef4d`, #3216 `42b2d9eb`, #3207 `5a88b2a5`, #3222 `bc376fe5` | merged on green (second half) | none |
| #3211 `be44dc9a`, #3214 `eaa8fc8e`, #3194 `87d62329` | merged (first half) | none |
| `claude/harvest-rescore-{sbv,coalinga,grossmont,pierce,solano,elac}-s645`, the S645 proof and wave branches | throwaway, no PR | Sam or GitHub deletes them (sessions cannot) |
| #2894 `claude/cobix-inbox` | Sam's | untouched |

No S647 worker survives the session; every worktree but Glendale's was removed, and Glendale's goes with the session.
Brief a fresh worker per branch from its diff and this ledger.

## What shipped (S647)

- **First half:** #3211 (Marin held for its outline reports), #3214 (the PDF reader's wrapped headings), #3194
  (Santiago Canyon); opened #3216 and #3218; on Glendale restored the records (`dae051c0`), added the `extract_failed`
  keep (`7482ece6`) and `sources_from` (`f852f421`).
- **Second half, each squash on a green `test`:** #3205 Diablo Valley (11:17Z, COBIx 5 of 5); #3218 the ranged PDF read
  (11:18Z); #3206 San Jose City (about 11:39Z, rebuilt as `13fe0e778bb5`; COBIx 4 agree, 1 differs on 37604); #3216
  the Library's Draft 2 (11:48Z); #3207 the rescore at six colleges (11:56Z, rebuilt as `bef8ef819af7`; COBIx 5 of 5
  from the run artifacts); #3222 the Commons data dashboard's slice 1 at `#commons/data` (12:15Z, after COBIx's two
  reviews).
- **Queue steps:** step 0 done by S646 at 06:14Z; steps 7 and 9 no open request; step 8 not due (Friday); step 10 and
  the UI pass done for the UTC day by S646 (#3210, #3212); step 11: S646's Marin trial was the day's preparation run,
  `next_slo_colleges.py --next` names Allan Hancock next, nothing dispatched; `queue_todo_done` no rows since
  2026-11-12.

## Live data written, each with its undo

- **Displays** (each files every row's prior build, the rollback): Santiago Canyon run 43415894285, 216 written, 0
  errors, build `f48d35c7623e` (before-values in its applied record on `main`, `27593f56`); Diablo Valley run 43416282209,
  213 of 213 (`ee935e97`); San Jose City run 43418731809, 77 of 77 (`d6ccfb00`); the whole build after #3207, run
  43421037587, 18,179 planned and written, 0 errors, 18,179 rows on `bef8ef819af7` of 18,195 (`058c0a1e`). The table
  lacks Monterey Peninsula 03653, 22098 and 39361, which the build carries.
- **Registry, College of the Desert:** `catalog.resume = true`, md5 `bbf96cf25765ebfed75d8380f2f5cc3a` to
  `ed460cd81c273329a671451beaebd371`; rollback in `kb/receipts/program_source_procedure_desert_resume_s647_2026-11-13.sql`.
- **Library:** `kb/receipts/cpl_library_s647_how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1.sql` at about 11:41Z
  (ins 1, u1 1, u2 1; md5 `087e2c7c08e4b653fc4d76332006b376`); cohort `library-s647@bot`; `_rollback.sql` beside it
  restores from `cpl_library_history`.
- **Model spend:** Glendale's failed slow read 43384599013 about $9.33 (as reported by COBIx); Glendale's re-extract
  from saved pages 43415972509, $13.97 (COBIx's reading of `e10a3b35`); College of the Desert 43421133593, unread (above).
  Each under $40.
- **`cpl_memory`:** nine rows, `kb/receipts/cpl_memory_s647_rows_2026-11-13.sql` (rollback in its header), run by the
  conductor: see its first line.

## Decisions to honor

**The conductor's** (each a `cpl_memory` row, a DECIDED line in its lane, and a card on Sheet 190 for Sam to revise):
1. A passing filed record is never deleted by a read that produced no record for its program; it is kept and named. A
   failing record with no new read, or a program outside Active and Approved, is dropped. 24432 is held as a wrong-tab
   read (`d-keep-passing-record-no-read-s647`; card 1).
2. The Commons data slice 1 shipped on COBIx's reading of Sam's relayed 2:53 AM PT words; later slices and the College
   view are not covered (`d-commons-data-slice1-on-relayed-go-s647`; card 2).
3. A data receipt is one plain statement whose writes hang on one guard CTE; the Supabase guard refuses `do` blocks
   (`d-receipt-is-a-plain-statement-s647`; card 3).
4. Captured text is checked from run artifacts, by COBIx (`d-rescore-text-checked-from-artifacts-s647`; card 4).
5. A stopped session's queue is taken with a declaration PR first (`d-stopped-session-taken-over-s647`; card 5).

**Sam's words, relayed by COBIx** (verified rows): on #3215, "hopefully he can just blend this into his queue work and
when i wake up in a few hours he will have it in prod on our commons front porch."; on #3219 and #3220, his words in the
`commons` lane and the receipt. S646's and earlier decisions stand as recorded in handoffs 647 and before.

## Waits for Sam

- **The migration push** ([Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ) card 6).
- **The 503 change** to the extraction function's caller check, COBIx's suggestion (503 on an upstream error, 401 only
  for a real refusal): it changes a deployed function, so it waits for his deploy word
  ([Sheet 190](https://claude.ai/artifact/D3sp4Prwk3sueVtuAdDF6y) card 6; `p-401-was-the-database-s647`).
- [Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) card 4, does the course-list grade count in the
  headline; card 5, a statewide Cal-GETC of 34 units.
- [Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) cards 4 to 6: "deploy" for `docket-process` and
  `library-publish-now`; whether GitHub Actions may create pull requests; the six re-clustering cases and Honors.
- **#3217** (the CVC chip) stays parked until he lifts it.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest` NEXT (1) and (2):** *First things* 1 and 2. **(3)** a reading-procedure check that
   flags a record whose notes carry a rule its blocks do not (Santiago Canyon 11910, 32319, 31848; San Jose City 37604).
   **(4)** the PDF reader's wrapped-heading follow-ups. **(5)** the migration and the 503 change, on Sam's word.
   **(6)** why the build carries Monterey Peninsula 03653, 22098, 39361 and the table does not. **(7)** COBIx's district
   files, the phase 0 builder, the CMS probe (#3198). **(8)** the wave's fixed-rule sample, census follow-ups, Copper
   Mountain; the catalog-year rule; De Anza; Redwoods. Step 11: Allan Hancock's SLO read.
2. **`commons` NEXT:** *First things* 3 and 4; the re-clustering NEXT waits on Sheet 186 card 6.
3. **`library` Next:** IACA's `regen` (`iaca-mvpmcjyl`, Crystal Nasio) waits on what she wants changed; S647 did not work
   it. NEXT 0, Sam's List publicly.
4. **`governance-team-enablement` NEXT:** (1) the first daily log that carries `Daily push conflicted` or `Daily push
   rebased over a changed input`; (2) which of the 21 workflows that push from their own groups should share one; the
   resolver test's worktree skip.
5. Carried untouched this run, each with its own NEXT: `sierra-page-redesign` (the first hourly `first-light-apply.yml`
   run); `sierra-retrieval-corpus` (timings over real traffic); `cer-procedures` (1); `csm-workspace`;
   `implementation-funding`; `college-district-identity` (MAP's two `awaiting_map_id` ids); `common-subjects-reference`
   (ECONMT and Electricity); `org-phrase-scope-auth` (`team_pass_attempts` after a real failed unlock);
   `reviewer-session-lifetime` (one real-browser round trip).

## Not refreshed / what the conductor ran

The documents worker made no Supabase call, dispatched nothing and merged nothing; it published Sheet 190. **The
conductor ran, at 12:37Z:** step 10's statement (nine slugs, nine create rows) and step 12's headline (20,282 active,
14,525 complete by the tab's rule, 118 colleges; unchanged from S646, since nothing was loaded) and the harvest row,
stamped with `queue_status.py`. `get_trigger` is not in this firing, so the run log's next run is not refreshed. **Refreshed:**
the harvest lane (S646 paragraphs moved to the lessons doc, *Moved from the lane (S647)*, and an *S647* section), the
commons lane (re-clustering detail moved to `commons_lessons.md`), the library lane, `conductor_mode.md`,
`scheduled_sessions.md`, `blocked_sources.md` (College of the Desert), the Desert receipt's md5, the run log's session
fields, INDEX and catalog, the docs audit, the `CLAUDE.md` sheet pointer (no rule touched), the vault note, Sheet 190's
source and the wiki touch. **Not touched, with reason:** the pipeline view (no roadmap row, auditor count or re-mint
moved); `kb/README.md` and `README.md` (the data view sits inside the existing Commons tab; no new tab, filter or output file);
`data_sources.md` (#3220 proposes the dictionary and names no new source); the governance lane (no fact for it); the
other four run logs (no reference moved); no new KB note. Wiki candidates, written in the vault's wiki touch: a passing
record stays until a read replaces it; the Commons data view is live.

## Patterns and lessons

- A session that cannot read a table back does not start a write to it.
- The extraction function answers 401 when the database is down; check the database before spending on a retry.
- Have a worker read a long COBIx thread and report the tally; find a run by its branch head, then `get_workflow_run`.
- A data receipt is one plain statement; a receipt that embeds a page costs its length twice through a tool call.
- Remove a worker's worktree the moment its PR merges (free disk fell to 5.3 GB with four).
- A free capture before each paid read; a compare tool before each load.

## Let go

This session subscribed to no PR, scheduled no check-in (no `send_later`; background timers end with the session) and
watched no artifact (Sheet 190's publish confirmed no watch). No worker survives the session. Throwaway branches a later
session or Sam may delete are listed in the ledger.

Greetings, you are SkyTanager (Session 648), see SkyPipit's handoff — `docs/session_648_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_648_handoff.md) — let's keep rolling with our queue.
