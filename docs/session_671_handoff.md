---
title: "Session 671 handoff (from SkyBunting, S670)"
created: 2026-11-17
updated: 2026-11-17
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_680_handoff.md
---

# You are SkyKinglet (Session 671)

From SkyBunting, S670, Sam's session on 2026-11-17 (02:53Z on, opened by hand: *"keep rolling with our queue"*). A
**full checkpoint**: the harvest lane moved and the run wrote data receipts (Coastline's objectives load, Skyline's
guarded delete, two rereads, memory rows). Skipped: step 7 (the pipeline did not move), `kb/README.md` and `README.md`
(nothing they describe changed); no KB note.

Read this file, then the harvest lane (`docs/reference/lanes/program-requirements-harvest.md`, NEXT), then
`docs/program_requirements_harvest_lessons.md` S670, then the governance lane's NEXT (1).

## What shipped

- **#3420** Coastline's objectives reread loaded: 522 objective rows (load 44006629705). Also on it: the outcomes loader
  keeps one slice per college set, part and split (`d-outcomes-slice-keys-college-set-s670`). Before it, Coastline's
  new slices displaced Golden West's in an unfiltered `cccd` load; none was lost, because loads only insert (COBIx).
- **#3423** Skyline's yield read, merged after a display rebuild (b640e31b114a); COBIx spot-checked it first.
- **#3436** the one live row of the six records #3423 dropped (32337) removed by a guarded delete; its full image is
  `kb/receipts/program_requirement_records_before_skyline_32337_s670.json` (`d-skyline-yield-one-live-row-s670`).
- **#3433** Rio Hondo 32258 and **#3434** Santa Ana 32062, 32989: their own 2025-2026 catalogs, rereads 44007311695 and
  44007316281. The curriQunet prior reads are done.
- **#3435** S668's Berkeley City memory row through the runner.

Check on `main` with `git log origin/main` that #3420, #3434 and #3436 merged; this checkpoint was written while their
last `test` runs were going.

## First things, in order

1. **Step 11 (UTC Nov 18):** Golden West's objectives reread is the full read: a new branch
   `claude/slo-objectives-golden-west` off `main`, `.run` from `objectives_reread_plan.json` step 1; when it is filed,
   write `.load` by hand (`host=cccd`, `kind=objective`, `slugs=golden_west`), rebuild the Commons data
   (`kb/_build_commons_data_status.py`), drop the step from the plan, merge on green. One preparation run on another
   host. Diablo Valley (#3421) moves to its full read on a later day (one full read a day). Redwoods #3387 and Allan
   Hancock #3284 wait. COBIx's non-blocking edge on #3420: when a college is re-read in a new number of parts, one
   part fails and no earlier run used the same split, that part's courses drop out of the load with no warning (nothing is
   deleted; the load is just incomplete). A warning in `read_files` when a chosen split is missing a part closes it.
2. **Slice B:** the other 7 yield colleges capture again under the #3408 code; then the `NCL_EXTRACT` switch once the
   Commons sidecars hold `no_state_list` records back (harvest NEXT 3).
3. **Free rescores:** Butte Physics 31950 to the Mathematics reading (COBIx on #3426); Berkeley City 41778 after a cited
   Cal-GETC step.
   Santa Ana 32989 (COBIx on #3434): its `ge_pattern: "Cal-GETC"` is the reader's inference, not printed text; set it
   null or mark it inferred and reread before a Cal-GETC 34 fill reads it. Re-read trigger: when Santa Ana's closed course
   list moves to MATH C2210/C2220, 32062 and 32989 read again from the current catalog.
4. **Memory rows:** `kb/migrations/2026-11-17_s670_cpl_memory_rows.sql` is named in `.apply` on this checkpoint's branch;
   confirm its receipt landed on the checkpoint PR.
5. **governance-team-enablement:** NEXT (1) reads the first scheduled runs of `docket-process` and
   `credential-catalog-sync` in `live-counts` before group 3.
6. **Harvest NEXT (4) to (7):** #3293 (keep); Lassen's pinned capture; Los Medanos and Los Angeles Valley.
7. **Lanes with a NEXT not taken:** `commons`, `cer-procedures`, `library` (#3416, the semantic scorer),
   `implementation-funding` (card 11 is Sam's), `csm-workspace`, `common-subjects-reference`,
   `college-district-identity`, `my-college-action-page` (card 2, the nightly landing-page snapshot; S669's display build is live), `eacr-exhibit-cr-adoption`, `reviewer-session-lifetime`, `sierra-retrieval-corpus`,
   `sierra-page-redesign` (#3159 is Sam's), `workplan-annual-goals`, `map-users-student-contact`.

## Session settings

One Opus 5.5 session works the queue. The $40-per-college-per-run limits and the #3351 gates stand. Merge only to
`main`, confirmed with `git log origin/main`. **Database writes go through the runner**, never Execute SQL: a committed
SQL file named in `kb/migrations/.apply`, applied on push to a `claude/` branch, which leaves a receipt. A live read is
an Execute SQL prompt for Sam: keep it to one batched call.

## Ledger (PR or branch, state, next)

| PR or branch | State | Next |
|---|---|---|
| #3423, #3433, #3435 | merged | none |
| #3420, #3434, #3436 | merge on green `test` | confirm on `main` |
| #3421 Diablo Valley | trial read 11 of 12 | full read, a later day |
| #3387, #3284, #3293 | drafts; keep | First thing 1; harvest NEXT (4) |
| `claude/prior-2025-berkeley-city-s668` | unmerged; keep | First thing 3 |
| `claude/curriqunet-prior-pairs-s668` | no PR; keep (read plans) | none |
| this checkpoint's PR | memory rows through the runner | merge on green |

## Decisions

`cpl_memory` rows, in `kb/migrations/2026-11-17_s670_cpl_memory_rows.sql` (rollback by slug beside it):
`d-outcomes-slice-keys-college-set-s670`, `d-skyline-yield-one-live-row-s670`,
`p-read-live-rows-before-guarded-delete-s670`, `p-apply-merge-takes-mains-copy-s670`,
`f-coastline-objectives-loaded-s670`. Sam gave no new ruling this run.

## Patterns that worked, and safety

- Before a guarded delete, read the live rows once: the list of six held one row. Match on key, page and run, raise on
  any other count, and file each row's full image.
- When merging `main` into a branch whose `.apply` conflicts, take main's copy, so the push does not re-run the branch's
  migration.
- Each worktree of this repo costs about 5 GB and the session's disk filled at three; work in one checkout and switch
  branches.
- A merge publishes a college's display build: COBIx's spot-check comes first (`d-merge-is-publication-spot-check-first-s645`).

## Let go

S670 drops its subscriptions at sign-off: #3420, #3434, #3436 and the checkpoint PR, and cancels its check-in
(`trig_01LrWXma1j9rPoxfHn37i9Fy`). No artifact watch stays. The standing sheet stays
[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current).

Spend: not available; 2026-11-17T02:53Z to 2026-11-17T03:50Z.

Greetings, you are SkyKinglet (Session 671), see SkyBunting's handoff — `docs/session_671_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_671_handoff.md) — let's keep rolling with our queue.
