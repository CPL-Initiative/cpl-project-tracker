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

1. **Ship #1854** (`claude/busy-gauss-n9pbad`, head `6feb18a`). **Subscribe to its activity first**
   (and to samueltlee/CPLBrain#236, the vault notes); S327 handed both over at 19:00Z with the A/B
   still running.
   - A/B run 37225759463 (on `5badbe5`, the same `index.ts` bytes as the head) was in progress at
     19:00Z. Read its grid. A clean A/B (zero regressions, all modes OK) is the standing authorization to
     deploy (cpl_memory `s275-deployed-v70-under-standing-authorization-2026-09-18`).
   - The push-triggered `smoke` is red on one assertion by design: 7t asks **production** Sierra for the
     31.5 figure, which only this PR's function can give (explained on the PR). The other 90 assertions pass.
   - Mark #1854 ready. Once `test` is green on the head, squash-merge, dispatch `cpl-chat-deploy.yml` on
     main with `confirm: DEPLOY`, then `cpl-chat-smoke.yml`. 7t must pass: the anon read of `display`
     (up to 31.5), plus IWAP and 31.5 in her answer.
   - The new smoke mode is **7t**: `7r` is the offerings mode and the A/B's control. Delete the preview
     function (`cleanup: true`) once shipped.
2. **Sheet 33 is answered** (Sam, 18:52-18:57Z, all five his own calls; cpl_memory
   `sam-sheet33-rulings-2026-10-04` holds his notes verbatim). In your first PR, carry each ruling into
   its lane and remove the NEEDS SAM markers (college-district-identity, implementation-funding,
   program-requirements-harvest x3). Then retire the five cards from `kb/_build_open_asks_decision_sheet.py`
   with a one-line comment, the way sheet 32's were.
   - **1. Who CPL serves.** He asked for one concise statement. S327's draft, for him to confirm:
     *"The CPL Initiative serves California's 116 community colleges, two noncredit campuses, and partner
     programs such as LAUNCH and Futuro Health. Cal State LA is the first CSU campus on MAP. Adult
     education, ROP and not-for-credit programs such as UpSkill CA join next."* The 116 is the 115 credit
     colleges plus Calbright. MAP's own scrape count (115 community colleges and Cal State LA) says what
     it counts.
     - Apply the statement to the KPI card, Sierra's line and the public KB letter blocks. The KB
       blocks go through its curation pipeline, as a draft PR.
     - The CSU systemwide talks are context, not a public line.
   - **2. Funding.** It goes only to CCC colleges and campuses. Leave CSU LA out by name, with the guard.
     Partner project funding needs no focus and no hiding.
   - **3. CSU LA's harvest:** later. *"I want to get our CCC process nailed down before getting into
     partners."*
   - **4. Outcomes:** as proposed. Record shape v3 keeps program and course outcomes as printed.
   - **5. Exhaust the agent before any request.** *"You draft the request only after we have exhausted all
     our efforts at having the agent harvest needed data... we will need to have agents configured for
     each college."* He asked for advice; S327's, for you to put to him:
     - One procedure record per college: hosts, platform, reading steps, refusals, workarounds tried,
       nuances. The reader loads it.
     - The harvest tab's Procedures view shows it, and each workaround he suggests lands as a change to
       it (the S320 ruling: an agent per college that the college and the MAP team own and train).
     - A request is drafted only when the record shows the steps exhausted.
     - First, for Cerritos: a runner read, since runners reach the sites this container cannot. Read the
       B.S. page, the EPP articulation list, the Pre-Apprenticeship catalog page and
       `2026_Welding_Roadmap_ua.pdf`.
3. **The Ironworker proof of concept** (Sam's 18:23Z note, verbatim in the vault braindump
   `braindump-2026-10-04-1823-ironworker-proof-of-concept-full-pathway.md` and in cpl_memory
   `sam-ironworker-proof-of-concept-full-pathway-2026-10-04`). Build a First Light mock-up of the
   whole ladder first: show, don't describe. The research is in
   `docs/program_requirements_harvest_lessons.md` (S327), VERIFIED vs LEAD. Sam, 19:00Z: the mock-up is this session's work ("if we should do it in the next session,
   that's probably better"). Then port the
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
  and smoke 7t holds her to the page. `sierra.js` fills the box from `?ask=` and never sends.
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

## Emergency close (S327, 19:0xZ)

The full Rule 9 checkpoint ran at `7ff8d57`. After it, two things changed: the smoke rename (7r to 7t) and
sheet 33's answers (item 2 above; memory row written). The session then closed at the context emergency
line. **Not refreshed after those changes:**
- the three lanes still carry the five sheet-33 NEEDS SAM markers (item 2 says what to write);
- `kb/cpl_todos.json` still asks Sam to answer sheet 33 (delete that item);
- the vault session note and the lessons doc do not mention the rulings;
- the cpl_memory row `roep-display-build-live-2026-10-04` still says "smoke 7r" (the repo guard blocks
  an UPDATE there; supersede it with a corrected row if it matters).
INDEX, the pipeline tab and the READMEs needed nothing new.
