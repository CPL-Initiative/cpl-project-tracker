---
title: Session 328 handoff — the ROEP display build; Sierra wired to it; CSU LA, outcomes and the Ironworker proof
date: 2026-10-04
session: 327 (SkyAmend)
tags: [handoff, program-requirements-harvest, roep, sierra, cpl-pathways, decision-sheet]
status: current
---

# You are Session 328

Your moniker is **SkyLadder**. SkyAmend (S327, `session_01PrdsHWjWe25nQnF5dJcjnu`) ran a full
checkpoint at about 140K tokens left, with PR #1854 open and its A/B preview running.

## First, in this order

1. **Ship #1854** (`claude/busy-gauss-n9pbad`). The A/B preview, run 37225759463, was dispatched
   on the branch at 18:47Z. Read its grid. If it shows zero regressions and all modes OK, a
   clean A/B is the standing authorization to deploy (cpl_memory
   `s275-deployed-v70-under-standing-authorization-2026-09-18`). Then:
   - merge once `test` is green on the head (squash);
   - dispatch `cpl-chat-deploy.yml` on main with `confirm: DEPLOY`;
   - dispatch `cpl-chat-smoke.yml` and confirm 7r. The anon key reads the Ironworker A.S.'s
     `display` (up to 31.5), and Sierra's answer names IWAP courses and says 31.5.
   Then delete the preview function (`cleanup: true`) or note it.
2. **Read open-asks sheet 33's replies first**:
   [Open Asks Sheet 33](https://claude.ai/artifact/HLeo1NxQvsVkZNUnqw8YCQ) (current;
   `SHEET_ID` `2026-10-04-open-asks-33`, collection `replies`). Its five cards:
   1. what the counts call MAP's 116 now that CSU LA is counted;
   2. CSU LA out of the funding model by name;
   3. CSU LA's harvest procedure, now or after the Ironworker proof;
   4. outcomes in record shape v3;
   5. who at Cerritos confirms the Ironworker facts.
   Carry each ruling into its lane in the same PR (`decision_sheets`).
3. **The Ironworker proof of concept** (Sam's 18:23Z note, verbatim in the vault braindump
   `braindump-2026-10-04-1823-ironworker-proof-of-concept-full-pathway.md` and in cpl_memory
   `sam-ironworker-proof-of-concept-full-pathway-2026-10-04`). Build a First Light mock-up of the
   whole ladder first: show, don't describe. The research is in
   `docs/program_requirements_harvest_lessons.md` (S327), VERIFIED vs LEAD. Then port the
   Ironworker A.S. section of CPL Pathways to read `cpl_pathways_roep_data.js`; the hand-built map's
   "27-29 major units" is stale against the 34-38 the catalog prints.

## Decisions Sam made (recorded)

- **CSU LA** (opening note): *"Keep CSU LA in the mix as they are our first CSU starting to use MAP.
  We'll figure out a procedure for them as well."* It stays counted. The wording and funding
  questions are sheet 33 cards 1-2. **Until he rules, do not write "116 community colleges" anywhere
  new.**
- **Outcomes** (18:03Z): *"we need a process to compare the cert skills we harvest to course
  outcomes for alignment indicators ... add an element to our ROEP harvest procedures to grab any
  published course and program outcomes"*. Measured: 13 of 20 captured pilot pages print them.
- **The north star** (18:23Z): *"leverage CPL on clear paths to increase access and completion
  leading to career improvement"*, proved first on Cerritos Ironworker: high school, noncredit,
  adult ed and ROP; certificates; the A.S.; the B.S.; then jobs.
- He offered ultracode. SkyAmend answered: not for the wiring. Ask for it when the harvest widens past
  the pilot or the outcomes harvest starts across 115 catalogs.

## What shipped (S327)

- `kb/_build_roep_display.py` writes each checked program's facts once, under one build stamp, to
  `cpl_pathways_roep_data.js` and `program_requirement_records.display`:
  - CPL in three kinds per course;
  - the mock-up's `plan()` figure;
  - the gaps by owner and the map status.
  The `display` column is live and filled. Build `bbbbfb611f15`: all 20 rows match the receipt
  (`--verify-sql`).
- Sierra (in #1854): CATALOG REQUIREMENTS lines carry the facts, the rules keep the leads as leads,
  and smoke 7r holds her to the page. `sierra.js` fills the box from `?ask=` and never sends.
- Guards:
  - `tests/roep_display_test.py` (in CI);
  - `sierra_program_courses` blocks 14-15;
  - `sierra_ask_prefill`;
  - sheet 33 premises with fixtures.
- KB note `methodology-one-build-two-readers`. cpl_memory: seven rows by `SkyAmend-s327`, three
  verified by Sam's words.

## Safety patterns

- **The connector holds a bare UPDATE** and times out writing nothing. Write a row change as
  `insert ... select <the row> ... on conflict (key) do update set col = excluded.col` through
  `apply_migration`, about 40 KB a migration at most. `execute_sql` refuses any UPDATE at the repo
  guard.
- **Course keys have three spellings:** `40.5`/`40.50`, `ADJ-1`/`ADJ 1`, `ANATOMY 001`/`ANATOMY 1`.
  Use the builder's `ck()`.
- **Never offer could-adopt across a `cross_disciplinary` identity** (WEXP M1001).
- **The builder's MAP read is a dated copy**, `map_cr_by_course.json` with its query beside it.
  Refresh it and `registry_read.json` when the harvest adds a college. Then rebuild, apply as
  migrations, and run `--verify-sql`. CI never rebuilds it: its inputs move daily.
- **CLAUDE.md is at 59,992 of 60,000 bytes.** Add nothing without trimming.

## Next work (after the three above)

- The program view's By requirement / By term layouts.
- The harvest tab port with a Procedures view; fix its Ironworker row first, which reads 0 MAP recs.
- Read Irvine Valley's and Santa Monica's maps.
- The addenda reading agent once the 2026-10-11 apply fills the table.
- Raise Miramar's AUTO 156G articulations (EMT, Driver Operator 1B) in the clean-up lane.
