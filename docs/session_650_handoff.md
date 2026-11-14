---
title: "Session 650 handoff (from SkyOriole, S649)"
created: 2026-11-14
updated: 2026-11-14
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyPlover (Session 650)

From SkyOriole, S649. This is the S649 checkpoint, a full one (lanes changed state and data receipts were written),
written about 01:10Z 2026-11-14 (`date -u`) on `main` at `32bd5742`. The session continues after it (the Riverside
objectives reread is in flight), so this file may be refreshed. A fact marked *as reported* was not re-read. Times come
from GitHub's timestamps or `date -u`.

**How S649 ran.** Conductor mode (Fable 5.2 conductor, Opus 5.5 workers, ultracode on), from 22:21Z 2026-11-13 on
handoff 649, Sam in session (two statements, below). The Supabase connector was up all session. A second session Sam
opened from iOS at 23:52Z with the same greeting ran as a declared side session, **SkyOriole-B**
(`session_01Rvwe2XpJ9892BvDE9kTT2v`): it takes the nine carried-untouched lanes, small governance items and the
identities rebuild (a dry-run plan waiting on Sam for a refused commit); its PRs #3266 (merged `be0a7319`), #3267
(design principles v3, adds one `CLAUDE.md` bullet, leaving the file at 59,985 of 60,000 bytes) and #3268. It writes no
numbered handoff and sends its ledger to the conductor before sign-off.

## First things, in order

1. **The objectives reread** (#3265, draft, `claude/slo-objectives-rccd`): the Riverside district read was on the
   runner at writing. Read the loader's `--dry` and a live count before `.load` (host=rccd, kind=objective) is pushed;
   then sdccd, sac, laspositas, Coastline, Golden West, one host at a time (`d-objectives-reread-order-s649`).
2. **Cosumnes River's display:** the step dispatched on `main` at 01:07Z for build `6e5081a4b3a0`; confirm its applied
   record. Then the seven records that pass on the rescore alone (04602, 04607, 04614, 07305, 11319, 11338, 33542), as
   their own plan, compared with main first.
3. **College Data Collection follow-ups:** COBIx's answer on #3229 (comment 6866973526) for the four dead catalog
   links (Copper Mountain, Cosumnes River, El Camino, Citrus); the builder's eLumen constant to `OBJECTIVES_BY_SYSTEM`;
   `#commons/data` into `a11y.config.js`; MIS course matches and COE regional demand.
4. **Exhibits Review:** a title cleared in another browser tab reopens only on reload (COBIx's open point on #3260).
5. **The `cpl_memory` receipt** `kb/receipts/cpl_memory_s649_rows_2026-11-14.sql`: confirm it is marked RUN; if not,
   run it.
6. **The side session's ledger:** read what SkyOriole-B sent; #3267 and #3268 merge on its own gates.

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it,
`df -h /`, `git worktree list`, and the issues COBIx opened or commented on today, checked against this list. Read the
replies on Open Asks Sheet 195 (link: the conductor fills it at publish; `CLAUDE.md` §11 points at it) before acting on
anything it names. Before any merge, read COBIx from the last comment (`perPage` 1 from the last page); never `get`
#3111 or #3110.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1, 2, 3 (only what has a
committed source), 4, 5; the display go of 2026-10-10 stands for every college, and a merge that publishes waits on
COBIx's spot-check. **Never run by a session without his word:** anything on Sheet 195 cards 2 to 5 (the BUSI row
delete included); #3250; the four held re-clustering cases; the CVMA rows (a person's rows); anything on the
`CLAUDE.md` hold list. #2894 is his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S649, and what worked* included: `date -u` before
any time; a reviewer brief names a read-only worktree, and the conductor checks `du` on the scratchpad; a test pins a
fixture, never a live file's size.

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
| #3265 `claude/slo-objectives-rccd` | draft; the Riverside read on the runner | dry run and live count, then `.load` |
| this checkpoint, `claude/checkpoint-s649` | open | merge on green |
| #3267, #3268 (side session SkyOriole-B) | open | its own gates |
| #3250 `claude/harvest-set-step-standing-s648` | draft, Sam's | Sheet 195 card 5 |
| #2894 `claude/cobix-inbox` | Sam's | untouched |
| merged: #3260 `dc4ba840` (23:53Z), #3263 `ac8dfb2f` and #3259 `bab40263` (00:10Z), #3269 `88e96c5f` (00:50Z), #3266 `be0a7319`, #3261 `58d46cc4` and #3262 `32bd5742` (01:06Z) | merged on green | none |

Workers do not survive the session; brief a fresh worker per branch from its diff and this ledger.

## What shipped

- **#3260 Exhibits Review: a decided card stays decided** (on Sam's words, below). Tab and builder read the saved
  titles from COBI (anon key, `--live`); the daily run of 23:53Z (`28569a14`) took the held queue from 168 to 0.
  **#3269** pinned `tests/exhibits_related_actions.test.js` to a fixture after `main` went red on the empty queue.
- **#3263 objectives with every SLO read:** `OBJECTIVES_BY_SYSTEM`, `collects`, loader `--kind objective` and
  `--slugs`, the reread plan; `kb/_build_adopt_align.py` reads `kind=eq.slo` (COBIx's finding).
- **#3259 Cerro Coso Cal-GETC 35** (p.65): reread 43521333437 replaced five rows; 31540, 38665, 43206 now pass; display
  build `98e783806131`, applied record `b9f9af4d`.
- **#3262 Cosumnes River:** the catalog prints no total, so the statewide 34 stands; reread 43523284838 posted 39656
  alone; display dispatched 01:07Z.
- **#3261 College Data Collection,** Sam's asks 1 to 5: full width, the SLOs and objectives column, links open in the
  side panel, CPL Pathways per college, `#commons/data/slos`, each cause opens its programs from the live census.

## Live data written, each with its undo

- `program_requirement_records`, Cerro Coso: 5 rows by reread 43521333437 (guarded update; before-values in
  `kb/receipts/program_requirement_records_college_reread_cerro_coso_community_43521333437.json`).
- `program_requirement_records`, Cosumnes River: 1 row (39656) by reread 43523284838 (before-values in
  `kb/receipts/program_requirement_records_college_reread_cosumnes_river_43523284838.json`).
- Display builds from `main`: Cerro Coso (applied record `b9f9af4d`, each prior build filed); Cosumnes River
  (dispatched 01:07Z; confirm).
- `cpl_memory`: the S649 rows, receipt `kb/receipts/cpl_memory_s649_rows_2026-11-14.sql` (the conductor runs it); undo
  by slug.
- No `kb_curation` write, no model spend.

## Decisions to honor

**Sam's:** (1) relayed by COBIx on #3223 (comment 6865613134), 1:38 PM PT 2026-11-13: *"I changed those las positas
exhibits in the exhibit commons and think we have a loop going where the reanalysis does know I just relied on them and
then brings them back endlessly"* (`sam-review-loop-las-positas-2026-11-13`). (2) In session about 22:28Z, six asks on
College Data Collection, verbatim in the vault braindump (`sam-data-collection-six-asks-2026-11-13`); 1 to 5 built in
#3261, 6 in #3263.

**The conductor's,** each a row (status proposed), a DECIDED line in its lane and part of Sheet 195 card 1:
`d-exhibits-review-reads-saved-titles-s649`, `d-review-builder-anon-read-s649` (cer-procedures);
`d-data-collection-links-open-in-panel-s649`, `d-data-collection-one-base-per-card-s649` (commons);
`d-contra-costa-commented-objectives-unread-s649`, `d-chaffey-objectives-only-read-next-s649`,
`d-first-reconcile-all-records-compared-s649`, `d-cerro-coso-calgetc-35-applied-s649`,
`d-cosumnes-39656-calgetc-34-applied-s649`, `d-objectives-reread-order-s649` (harvest); pitfalls
`p-test-reads-live-review-file-s649`, `p-reviewer-copies-repo-s649`.

## Waits for Sam

Open Asks Sheet 195 (`SHEET_ID` `2026-11-14-open-asks-195`; link filled at publish) replaces Sheet 194
(https://claude.ai/artifact/B6NYwHtu9cuMAEBqA9S6sq), which held no reply at 22:25Z. **Card 1** the S649 decisions to
revise; Sheet 194's Las Positas card is closed there, answered by his own saves on 2026-11-13. **2** re-clustering:
Honors' reach and the four held cases. **3** *Needs your word*: delete the title-matching bot's BUSI M10XW row.
**4** the three CVMA rows. **5** draft #3250 (merge or close). #3217 stays parked.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** (4) the objectives reread (First things 1); (1) COBIx's three Glendale
   follow-ups; (2) a stored hold for Desert 10195 and the halted one-college run; (3) the reading-procedure check;
   (4) the PDF reader's wrapped headings; (5) Cosumnes River's display and its seven, then the 17 free GE page reads;
   (6) Monterey Peninsula's three build-only programs; (7) the district phase 0 builder; (8) the wave's sample,
   Copper Mountain, the catalog-year rule, De Anza, Redwoods; (9) the headline's own-list rule. Chaffey's
   objectives-only read is NEXT, not built.
2. **`commons`:** the data dashboard's NEXT (dead links, the eLumen constant, MIS and COE, a11y); FIRE 130 X's
   row-audit card, then the identities rebuild (the side session holds the plan); price the model pass; a
   potential-CPL column; the Leadership outlines; #3219 (Sam approves).
3. **`cer-procedures`:** (0) the cross-tab reload; the rename batch with the ASE bundle; `series_aliases` into
   `kb/credential_aliases.py`; its NEXT list.
4. **Side session's lanes** (SkyOriole-B): `governance-team-enablement`, `library` and the nine carried lanes
   (`sierra-page-redesign`, `sierra-retrieval-corpus`, `csm-workspace`, `implementation-funding`,
   `college-district-identity`, `common-subjects-reference`, `org-phrase-scope-auth`, `reviewer-session-lifetime`,
   `eacr-exhibit-cr-adoption`), each with its own NEXT.

## A full checkpoint: what it touched

The docs audit; this handoff (`--apply` stamped the older ones); the lanes `cer-procedures`, `commons` (both compacted
under 20,000 bytes) and `program-requirements-harvest`; the lessons docs (each lane's retired text moved verbatim, older
sections to `docs/commons_lessons_archive.md`, `docs/program_requirements_harvest_lessons_archive_5.md` and
`docs/exhibit_canonicalization_lessons_archive.md`); `conductor_mode.md`'s S649 lessons; the run logs
`program-requirements` (headline 20,282 active, 14,594 complete, 118 colleges; the harvest row; `next_run_at`
06:12Z), `exhibit`, `course`; the index; the memory receipt (not run by the worker). **Skipped, with reason:** the
`CLAUDE.md` sheet pointer (the conductor sets it to Sheet 195 at publish, byte-neutral); the pipeline view (no
roadmap row or auditor count moved); `kb/README.md` and `README.md` (no structure change); a new KB note (nothing
crossed the bar).

## Let go

Every PR subscription was dropped as it was created; the artifact watch on Sheet 194 and the one on Sheet 195 are the
conductor's to drop at sign-off.

Greetings, you are SkyPlover (Session 650), see SkyOriole's handoff — `docs/session_650_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_650_handoff.md) — let's keep rolling with our queue.
