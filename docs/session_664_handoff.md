---
title: "Session 664 handoff (from SkyLark, S663)"
created: 2026-11-16
updated: 2026-11-16
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyWren (Session 664)

From SkyLark, S663, written by the CPL Queue routine's 06:12Z firing on 2026-11-16 for both S663 runs. The first S663
session (`01Rvwe2UqcSy5PcrxfhGtQe7`, about 02:35Z to 05:06Z) merged #3382 and #3384 and wrote no handoff, PR or memory
row; this firing found it quiet for 68 minutes, declared with #3385 and took the queue under the same number. A **full
checkpoint** (the harvest lane moved; a Rule 10 reread receipt). Step 7 skipped (the pipeline did not move).

Read this file, then the harvest lane (`docs/reference/lanes/program-requirements-harvest.md`, the Riverside City
paragraph), then `docs/program_requirements_harvest_lessons.md` S663.

## What shipped

- **#3381** (`87f30d0e`, Sam's session before this one): handoff 663's First thing 1, COBIx's two leftovers on #3379.
- **#3382** (`d76501bd`) and **#3384** (`f61390fa`), the first S663 run: Riverside City's 2025-2026 catalog is
  curriQunet archive 71; `CAPTURE_PRIOR` reads named programs from a prior catalog and `file_prior` files them beside
  the rest. Its four-program read failed on the 2026 renumbering and was reverted.
- **#3385** (`3fbba21e`), this firing: `course_renumbers_by_year[<year>]` in `kb/program_requirements_reconcile.json`
  scores a record against its own year's course numbers (guard `tests/program_requirements_year_renumbers_test.py`).
  Riverside City's 2025-2026 map from page read 43815976514: MAT 1C/2/3/5 to MATH, ECO 7H/8H to ECON C2002H/C2001H.
  Run 43816942139 ($0.13) filed Mathematics 32692 from its own 2025-2026 page (every check passes); reread
  43822316519 replaced its row alone (receipt `51b304dd` on main, rollback inside). Physics 32745 kept its filed
  record: its 2025-2026 record reads the 60-unit degree total and Cal-GETC with no Cal-GETC units.
- **Found:** catalog 71's Communication Studies and Business Administration entries are titled 2.0, so 30578 and
  33829's originals are older than 2025-2026.

## First things, in order

1. **Step 11.** Las Positas' objectives reread is loaded (#3386: run 43816095571, load 43825849738, 776 objective
   rows inserted, 751 SLO rows held back, receipt `kb/receipts/course_outcomes_laspositas_43825849738.json`). Next in
   the reread plan: Coastline, then Golden West (`cccd`). College of the Redwoods' trial (#3387, run 43817157271) and
   Allan Hancock's (#3284) each parsed 12 of 12: both are *read*. The next UTC day takes one full read (Coastline's
   reread counts as it) and one preparation run; the other *read* college waits its turn.
   **COBIx on #3386, verified:** the curriQunet SLO parse keeps the lead sentence (*Upon the completion of this course,
   the student should be able to:*) as the first outcome with `lead` null: all 505 live Las Positas SLO rows, 535 of
   8,217 curriQunet rows at 2 colleges, 6 CourseLeaf rows. Fix it in the parse (move it to `lead`, tested with
   `--reparse` on the filed pages), and decide which copy wins first, since the fingerprint changes and the load only inserts.
2. **The prior-catalog read** (harvest lane NEXT): (b) a Cal-GETC units step for Riverside City cited from its own
   catalog, then the prior dispatch for 32745; (c) 30578 and 33829 from archive 7 (2024-2025), with that year's
   renumber map read from its pages the same way. Then the other colleges' same-page pairs.
3. **For Sam:** `cdc-restricted-tables-read-by-team-phrase-s660` (the `org-phrase-scope-auth` lane's call) and Honors
   step 2's apply (Sheet 200 card 1). Change no grant or policy here.
4. **Monterey Peninsula** 03653, 22098, 39361, with a person; **Slice B of #3299** waits behind #3293; next Sunday's
   contacts (`map-users-student-contact`).
5. **Sam's billing paste after Nov 15** into `kb/reference/model_spend_daily.json` when he supplies it (`commons`).
6. **Lanes with a NEXT not taken:** `library` (his List publicly), `college-district-identity` (waits on MAP's two
   `awaiting_map_id` ids, nothing to do until they come), `eacr-exhibit-cr-adoption`, `implementation-funding` (card
   11 is Sam's), `reviewer-session-lifetime`, `sierra-retrieval-corpus`, `sierra-page-redesign` (#3159 is Sam's),
   `governance-team-enablement`, `cer-procedures`, `workplan-annual-goals`, `csm-workspace`.

## Session settings

One Opus 5.5 session works the queue: no conductor, no ultracode, no parallel workers unless Sam starts them. The
$40-per-college-per-run limits (program requirements; SLOs, PLOs and objectives apart) and the #3351 gates stand.
Merge only to `main`, confirmed with `git log origin/main`; two review rounds, then Sam or COBIx.

## Ledger (PR, state, next)

| PR | State | Next |
|---|---|---|
| #3385 | merged | none |
| #3386 | merged | none |
| #3387, #3284 | drafts; keep | First thing 1 (full reads) |
| #3293 | draft; keep | First thing 4 |
| #2894 | Sam's | none |
| #3383 | dependabot | none taken |

## Decisions and pitfalls

Receipt `kb/receipts/cpl_memory_s663_year_renumbers_2026-11-16.sql` (RUN, with its `cpl_memory_log` rows):
`d-renumbers-scoped-by-catalog-year-s663`, `f-rcc-2025-catalog-prints-two-2-0-programs-s663`,
`p-prior-read-names-more-than-filed-s663`. S662's `cpl_memory_s662_checkpoint_rows_2026-11-16.sql` holds rows already
in the table (`p-handoff-built-file-never-committed-s662` and two more, written 01:38Z), so it needs no run. No new
ruling from Sam. **Pitfalls:** pair a renumber on the catalog's own title and units, never on a code's shape; read a
prior page's heading before calling it the original's; never file a failing record over a passing one.
`cpl_memory_log.action` takes `create`, not `insert`.

## Checkpoint notes

Lint: 76 vault-heavy paths, 5 oversized docs, 1 kb-note dialect. The harvest lane went from 25.7 KB to 23.5 KB (two
paragraphs moved verbatim to lessons) and is still over its 20 KB budget; the next harvest checkpoint compacts the
NEXT list. Wiki candidates for `/wiki-ingest`: a prior-year record is scored against its own year's course numbers.

## Let go

No PR subscription, check-in or artifact watch was made. Nothing is held. The standing sheet stays
[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current; card 1 waits on Sam).

Cost: this session's cost not available (no `get_session` tool in this firing); substantive PRs merged 2 (#3385, #3386).

Spend: not available; 2026-11-16T06:12Z to 2026-11-16T08:05Z.

Greetings, you are SkyWren (Session 664), see SkyLark's handoff — `docs/session_664_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_664_handoff.md) — let's keep rolling with our queue.
