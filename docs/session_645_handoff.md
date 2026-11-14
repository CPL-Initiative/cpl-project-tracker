---
title: "Session 645 handoff (from SkyWren, S644)"
created: 2026-11-13
updated: 2026-11-13
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_650_handoff.md
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

1. **Santiago Canyon's PDF files programs under the wrong control number** (the session's most serious open finding).
   COBIx's spot-check on #3194 (comment 6841001207; summary #3111 6841073592): 3 of 5 records agree, 2 differ. The PDF
   prints `Control Number: N` after each program, so a transfer degree is filed under the preceding local degree's
   number; Economics AA and Sociology AA pass while holding their AA-T. Other PDF colleges may hold passing records filed
   under the wrong program. A worker on `claude/harvest-pdf-control-number-s644` (unfinished at sign-off) was measuring
   heading-against-filed-program agreement at Santiago Canyon and every PDF college, filing COBIx's scout file to
   `kb/harvest_scouting/scout-2026-11-12.json`, and proposing the reader fix (bind a PDF window by its printed control
   number) and a failing reason for a record whose own heading names another award type. Brief a fresh worker from the
   branch.
2. **Read COBIx before any merge.** #3110 and #3111 to their last comment (page with `perPage` 1 from the last page),
   #3198 (district profiles; four questions wait for Sky), #3194's thread, every issue or PR COBIx touched today.
3. **#3196** (head `032f3305`, `main` merged twice, review clean): merge on a green `test`, then San Jose City's free
   capture on a fresh branch off `main` (`college="San Jose City College" extract=0`).
4. **Diablo Valley's free capture** (`claude/harvest-diablo-valley-read-s644`, dispatched 02:13Z): read
   `capture_preview.json`, price it, a paid read within $40.
5. **The first real daily run after #3180** (06:17 UTC 2026-11-13): its log and whether its push landed.
6. Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions`, `df -h
   /home/user`, `git worktree list`. Run the second statement in `kb/receipts/cpl_memory_s644_rows_2026-11-13.sql`
   (two rows, NOT RUN).

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: Open work 2 up to the display build (never
the display), 3 and 4 (the merges and free captures), 6 and 7; never Open work 1's rescore. **Waits for Sam, never run by a session:** `step=display` after
tonight's loads until Sam gives his explicit go for the first live run; the headline counting card B's grade (card 4); card C's (card 5) statewide figure; the deploy of
`docket-process` and `library-publish-now`; the GitHub Actions pull-request setting; the six re-clustering cases and the
Honors question; anything on the `CLAUDE.md` hold list. #2894 is his. **[Open Asks Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA)** is current
(Version 1, published by the conductor about 02:09Z 2026-11-13, a fresh store, `replies` empty at publish; `SHEET_ID`
`2026-11-13-open-asks-187`, 54,879 bytes): the conductor's nine decisions on cards 1 and 2, cards A, B and C as cards 3
to 5. [Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt), current for its own cards, still holds cards 4 to 6 waiting; 187 does not carry them, to stay
under 60 KB.

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

## Ledger (PR, branch, state) at sign-off

| PR or branch | State | Next |
|---|---|---|
| #3199, this checkpoint, `claude/checkpoint-s644` | draft | merge on a green `test` |
| CPLBrain#770, `claude/confident-wozniak-irdwcw` ([Open Asks Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA)'s source, current; the session note, the wiki touch) | draft | merge after #3199 |
| #3194 `claude/harvest-santiago-canyon-s644` | "HELD:", draft; head kept as `claude/harvest-santiago-canyon-hold-s644` (the load receipt, the rollback) | the reader fix and a reread first |
| `claude/harvest-pdf-control-number-s644` | worker branch, unfinished | First things 1 |
| `claude/harvest-noce-ship-s644` | North Orange alone, its own PR and display build; the worker's state NOT confirmed | finish, merge; display on Sam's go |
| #3196 `claude/harvest-sjcc-pages-s644` (head `032f3305`) | ready, review clean, waiting on `test` | merge on green; San Jose City's free capture |
| `claude/harvest-diablo-valley-read-s644` | free capture dispatched 02:13Z, not read | read, price, paid read |
| `claude/harvest-noce-s644` | North Orange's read and load receipt | carried by `-noce-ship-s644` |
| `claude/harvest-sjcc-s644` | a free capture only | superseded by the fresh capture after #3196 |
| `claude/harvest-wave-s644trial` | trial filed: Feather River 81 of 81 and Palo Verde 96 of 96 captured, Copper Mountain held | paid reads in a new wave |
| `claude/confident-wozniak-irdwcw` (tracker) | the census run commit `f371cf07` (*as reported*) | the conductor's call |
| #3193 `408c1c4b`, #3195 `326f1faa`, #3197 `867a5ecf` | merged on green | #3193's rescore is a reviewed step |
| #2894 `claude/cobix-inbox` | Sam's | untouched |

No S644 worker survives a new session (two were unfinished: the PDF control-number worker and the North Orange ship
worker). Brief a fresh one per branch from its diff and this ledger.

## What shipped (S644): seven PRs, each squash-merged on a green `test`

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
- **#3193** `408c1c4b` the scorer: the electives sentence, GE steps, the gated no-colon hours reading,
  `counts_passing_on_tab`. Its migration is prepared, not applied; the rescore is a separate reviewed step.
- **#3197** `867a5ecf` the dated reads on a runner (`program-requirements-dated-reads.yml`). Its first live run stopped
  at verify, correctly: Merced and Glendale equal, Cuesta six course codes only in the fresh read, which a live read
  confirms is drift.
- **The wave's first free trial** (run 43343741511, $0): Feather River 81 of 81 and Palo Verde 96 of 96 `captured`;
  Copper Mountain `held: partial capture (0 of 1 pages answered)`.

## Live data written, each with its undo

- **Los Angeles City `step=load`**, run 43333288596, 23:59Z: 22 rows inserted (18 pass), insert-only; receipt on `main`
  (`a0afb88c`), which names every inserted key and is the rollback.
- **Santiago Canyon:** paid read 43339249633 ($16.98, 222 extracted, 148 pass the machine checks); `step=load` run
  43342030025, 01:05Z: 192 rows, all unchecked, 149 pass by the tab's rule; receipt on #3194's branch (the rollback).
- **North Orange Continuing Education:** paid read 43342034608 ($3.66, 82 extracted, 77 pass); `step=load` 01:22Z: 78
  rows, 77 pass by the tab's rule, confirmed live; receipt on `claude/harvest-noce-s644` (the rollback). Neither
  college is displayed yet.
- **Diablo Valley's procedure record**, about 02:12Z, through `program_source_procedure_set` (md5 before none, after
  `5511f5a5b0a03e77ea1c13260bfdfaee`); receipt `kb/receipts/program_source_procedure_diablo_valley_s644_2026-11-13.sql`
  (written after the fact), its rollback in the header.
- **Model spend:** $20.64, each college under $40 (*as reported*).
- **`cpl_memory`:** 15 rows by `SkyWren (S644)` (nine decisions, Sam's opening direction, five pitfalls), run by the
  conductor through the Supabase MCP at about 02:08Z, all 15 returned. Receipt
  `kb/receipts/cpl_memory_s644_rows_2026-11-13.sql`, rollback in its header.

## Decisions to honor

**Sam's:** his opening direction (above; row `sam-harvest-throughput-2026-11-12`); his go for COBIx's offers and bots,
relayed by COBIx ("Sam's go, Nov 12, 4:55 PM PT"; "his go, 5:07 PM PT"); and his display ruling, relayed by COBIx
(#3111 comment 6840755612; COBIx chat, Nov 12, 2026, 5:09 PM PT), in COBIx's wording: "the first live run of the new
display apply goes out on Sam's explicit go. After that first run, his 2026-10-10 standing go covers a display apply
that follows a load that passed its checks. Each run still posts its confirmed record, rollback receipt and display
minutes on the run-health line." It answers Sheet 187 card 3 (row `sam-first-display-run-explicit-go-2026-11-12`, in
the receipt's second statement, not yet run); post the first run's record and receipt on #3111. His vision for
district profiles (Nov 12, 5:37 PM PT, relayed by COBIx on #3198): a bot per CCC district that learns its SIS, CMS and
CPL coding, 72 districts plus Calbright; the scout and wave-check bots are phase 1.

**The conductor's** (each a `cpl_memory` row, a DECIDED line in its lane, and a card on [Open Asks Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA), current, cards 1 and 2, for Sam to revise):
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
   outside the headline (`d-no-closed-list-separate-grade-s644`); whether it counts is card B ([Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) card 4, current).
8. COBIx's offers accepted: source scouting, the five-record spot-check after each wave, blast-radius ranking, the SLO
   lane after the first paid wave; two read-only bots, not built (`d-cobix-offers-specialist-bots-s644`).
9. A college PR's dated reads move to a runner job (#3197) (`d-dated-reads-runner-job-s644`).
10. Santiago Canyon's display is held: its 192 live rows stay, unchecked, no delete; the reader fix and a reread come
    next; North Orange ships alone (`d-santiago-canyon-display-held-s644`, proposed, in the receipt's second statement).

## Waits for Sam

On [Open Asks Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) (current; card 3 answered by the relayed ruling above, cards 4 and 5 wait):

- **The first live display run** of #3190's apply waits for Sam's explicit go (his ruling). North Orange's display is
  the first candidate; Santiago Canyon's is held.
- **B (card 4).** Does a program read against the college's own course list (1,604 with no closed list in the state file)
  count in the headline?
- **C (card 5).** A statewide Cal-GETC figure of 34 units would pass 93 more programs.
- Glendale's move to a Coursedog 2026-27 catalog (COBIx's scout): unparking it is Sam's call.
- Still on [Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) (current for its cards), cards 4 to 6: "deploy" for `docket-process` and
  `library-publish-now`; whether GitHub Actions may create pull requests; the six re-clustering cases and the Honors
  question.

## Open work, in order (from the lanes' NEXT lines)

0. **Harvest NEXT (1), first:** the PDF control-number finding (*First things* 1), then Santiago Canyon's reread;
   North Orange alone on `claude/harvest-noce-ship-s644`, its display on Sam's explicit go. COBIx's scout file (12
   colleges: Desert by its CourseLeaf HTML, not the 21 MB PDF; Skyline; Sierra; CCSF by its PDF; Santa Rosa; American
   River; Cosumnes River pinned to the Nov 6 file; Canyons' procedure moves to v3 with errata and addendum; Fresno City
   needs a rendered read; Southwestern by `blocked_sources`) and #3198's four questions want answers.
1. **`program-requirements-harvest` NEXT (1):** #3193 merged; its rescore as a reviewed step: the migration
   `kb/migrations/2026-11-13_s644_carry_basis_electives_fill_words.sql`, then reconcile and reread at San Bernardino
   Valley, Coalinga, Grossmont, ELAC, Pierce and Solano.
2. **Harvest NEXT (2):** Santiago Canyon stays held (#3194, "HELD:"); its dated reads filed (`1ab5e293`, verify
   passed against Merced, Glendale and Hartnell; Cuesta refreshed). No `step=display` until Sam's explicit go.
3. **Harvest NEXT (3):** the trial: paid reads for Feather River and Palo Verde within $40 (a new wave, since an
   extracting wave runs once); Copper Mountain's capture answered none of its one page, so read why first.
4. **Harvest NEXT (4):** #3195 and #3196 merge on green; then free captures of Diablo Valley (procedure record first,
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

## Not refreshed / left to the next session

The documents worker made no Supabase call, published nothing, dispatched nothing and merged nothing. The conductor ran
step 10's 15 rows (02:08Z, all returned), published [Open Asks Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) (02:09Z), and read step 12's row live at 02:24Z:
14,196 of 20,282 active programs complete by the tab's rule, at 116 colleges (114 before tonight; Santiago Canyon and
North Orange Continuing Education the two new), stamped into `kb/status/program-requirements.json` with the harvest
counts. **Not done by S644:** the routine's `get_trigger` (so `next_run` is not refreshed); the second statement of the
`cpl_memory` receipt (two rows, NOT RUN); answering COBIx on #3198 and on the scout file; the wave's fixed-rule sample
in the filing job; #3193's live rescore; the census follow-ups. The Diablo Valley procedure receipt
(`kb/receipts/program_source_procedure_diablo_valley_s644_2026-11-13.sql`) was written after the fact from the
session's record. Refreshed: three lane files, `conductor_mode.md`, the two lessons docs, INDEX and catalog, the run
log, the docs audit and its `--apply` stamp, the vault note, Sheet 187's source and the wiki touch. Not touched: the
pipeline view, `kb/README.md`, `README.md`, the other four run logs; no new KB note. Wiki candidates, written in the
vault's wiki touch: the gap census; the wave runner; the tab's passing rule against the guard's.

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

Dropped at sign-off: the subscriptions on PRs #3194, #3196, #3199, CPLBrain#770 and any PR the two unfinished workers
opened; the check-in `trig_01KVui1enuoD2qrurPoSK7Kr`; the artifact watch on [Open Asks Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA). Nothing else is held.

Greetings, you are SkyFinch (Session 645), see SkyWren's handoff — `docs/session_645_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_645_handoff.md) — let's keep rolling with our queue.

## Addendum: Sam's replies on Open Asks Sheet 187 (an EMERGENCY checkpoint, 13:20Z 2026-11-13)

Written by SkyWren (S644) at 94% context, after the sign-off, when the sheet's watch woke the session. Nothing but this
addendum was refreshed: no lane file, no `cpl_memory` row (the Supabase connector was down), no INDEX, vault note or
status file. [Open Asks Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) is answered and Complete was
pressed (`replies/done`: 3 his own call, 2 as proposed, through card 5, 13:19Z 2026-11-13). Read `replies` off the sheet
before acting; these are his, in his own call unless marked:

- **Card 1** (waves, the $40 hard stop, COBIx's checks): **fine**, as proposed (not individually reviewed).
- **Card 2** (the tab's passing rule, the 22 Los Angeles City records): **fine**, as proposed (not individually reviewed).
- **Card 3** (the October 10 standing go for a display after a load): **"stands"**, his own call. Read it WITH his ruling
  relayed by COBIx on #3111 (comment 6840755612): the FIRST live run of the new display apply still goes on his explicit
  go; after that first run the standing go covers a display that follows a load that passed its checks. His sheet answer
  came later than the relayed ruling; if the two seem to differ, ask him in one line before the first run.
- **Card 4** (does a program checked against its college's own course list count in the headline): **no verdict**, a
  follow-up, his words: *"I don't understand this one. give me two examples"*. Owed to him: two real programs from the
  1,604 (`docs/harvest_no_closed_list_diagnosis_s644.md`, `kb/status/harvest_no_closed_list.json`), each shown as the
  catalog prints it, what the state's Program Course File holds for it (nothing, or only retired courses), and what
  each choice does to the headline. Put it on the next sheet in plain words.
- **Card 5** (the statewide Cal-GETC figure): **"use"** 34 statewide, his own call. To carry out: a reconcile step that
  sets Cal-GETC to 34 where a catalog names the pattern and prints no figure, naming this ruling as its source; 93
  programs are expected to move (the S644 scorer worker's count, not re-measured). It replaces the per-college counting
  of `d-rio-hondo-cal-getc-areas-count-s639` and `d-west-valley-cal-getc-areas-count-s639` only where no figure prints.

**Owed by S645 for these:** `cpl_memory` rows for cards 3, 4 and 5 as Sam's (verified), plus the two rows left NOT RUN in
`kb/receipts/cpl_memory_s644_rows_2026-11-13.sql`; DECIDED lines in the harvest lane; the two examples for card 4.
Also read draft #3201 (the PDF misfiling findings, which landed after this handoff was written).
