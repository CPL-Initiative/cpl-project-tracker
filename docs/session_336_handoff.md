---
title: Session 336 handoff — drafts for the college, Miramar's AUTO 156G traced to its source, sheet 42
date: 2026-10-05
session: 335 (SkyKeel)
tags: [handoff, program-requirements-harvest, decision-sheet, sierra, cleanup]
status: current
---

# You are Session 336

Your moniker is **SkyCourier**. SkyKeel (S335, `session_01XjXudFRRa4F4MPSQwnagSt`) checkpointed at session end, with
plenty of context left. If Sam's routine started you, read
[`docs/reference/scheduled_sessions.md`](reference/scheduled_sessions.md) first and follow it.

## First, in this order

1. **Merge CPL-Initiative/cpl-project-tracker#1874 on a green `test`** if S335 did not. It carries this file. Its JS
   tests run was blocked twice: GitHub abandoned the `gate` job in the queue before any step ran (19:24-20:05Z on
   2026-10-05). PR #1873, another session's, stalled the same way. The full suite passed locally on the same head:
   all 396 test files. Read `get_check_runs` on the current head. If `gate` is abandoned again with no log, the cause
   is still GitHub, not the diff.
2. **Read [Open Asks Sheet 42](https://claude.ai/artifact/HqVTZRKnuSqfUEpmm3VdSX)'s replies** (ArtifactData `list`,
   collection `replies`). Sheet 41 had no replies and is retitled as superseded. Three cards:
   - **Card 1, go:** re-run the outcomes verify query (`python3 kb/_program_requirements_load.py --outcomes-delta`
     prints it; every row must read `before`). Apply `kb/receipts/program_requirement_records_outcomes_2026-10-05.sql`
     through `apply_migration`, then re-run the query; every row should read `after`.
   - **Card 2, go:** deploy cpl-chat first, through `cpl-chat-deploy.yml` (type DEPLOY), then dispatch
     `cpl-chat-smoke.yml`. Sierra then names a college gap by its kind; until the deploy she calls Miramar's two drafts
     "Catalog and state file differ". Then apply
     `kb/receipts/program_requirement_records_display_2026-10-05_1cb75672ba6c_delta.sql` and read all 20 rows back with
     `python3 kb/_build_roep_display.py --verify-sql` (every row `match`). Each statement is guarded on the row's
     799bfb9a7dbf md5, and all 20 matched on 2026-10-05.
   - **Card 3:** when drafts show on My College. The proposal is *once sent*: a later session proposes a record of
     what was sent on its own card. If Sam answers *show them now*, My College lists them marked for review.

   Drop the lane's NEEDS SAM markers and the answered cards in one PR.

## Decisions Sam made this run

None. Sam has not written since the greeting.

## What shipped (PR #1874)

- **Sheet 32 card 2, harvest-tab half.** Program records gathers each college's own gaps under its heading as
  *Drafts for the college*, with a draft to copy. Catalogs counts them and filters to colleges that have some. A
  record's notes list only what the procedure owns. 26 drafts live at the five pilot colleges, 28 after card 2.
  `tests/program_requirements.test.js` block 6c.
- **Miramar's AUTO 156G, traced.** `map_college_cr_unit` puts both exhibits on EMGM-106 and FIPT-321P at 0.25 hours.
  MAP's articulated-exhibit view lists AUTO 156G only on the 0.3-hour versions, beside those same courses. No
  credit came through AUTO 156G. `second_courses()` in `kb/_build_roep_display.py` finds this shape. Build
  `1cb75672ba6c` adds the two drafts and nothing else; with the detector stubbed out, the build reproduces 799bfb9a7dbf.
- **Sierra** labels each college gap by its kind (`displayLines` in cpl-chat; `tests/sierra_program_courses.test.js`).
  This is in the repo, not deployed.
- KB note `methodology-trace-a-finding-to-what-students-received`; lessons doc S335; lane compacted under 20,000 bytes.

## Patterns that worked

- **Read the student-grain table before raising a finding with a college.** One query changed the sentence Miramar
  receives.
- **Isolate a builder change by building without it.** The stubbed build matched the live stamp, so the new stamp
  had one cause.
- **`grep` a field across `*.js` and `*.ts` before adding a new kind of value to it.** `display.gaps` has three
  readers, and Sierra's would have mislabeled the new kind.

## Safety patterns

- **Check a command's exit code, never a pipe's.** `check_generated.sh | tail -1 && git commit` committed past a
  stale dependency map; S334 recorded the same slip. Redirect to a file, then test `$?`.
- `npm test` runs past the 10-minute foreground limit. Run it in the background and read the summary line.
- Writes wait on Sam's go (sheet card), with a guarded receipt and a read-back.

## Next work

- Sheet 42 (above). Then the skills comparison waits on `kb/reference/industry_credential_skills.json`.
- The addenda reading agent after the 2026-10-11 census apply. Re-read Cerritos Schedule+ for Spring 2027 IWAP and
  AED sections once they post. Irvine Valley's and Santa Monica's maps. Widen the harvest past the pilot, with a
  procedure record per college.
- San Bernardino Valley's Basic Military Training health credit on KINF 138A matches the second-course shape. It is
  outside the pilot, so it becomes a draft when that college's programs are harvested.
