---
title: Session 319 handoff — Sierra can read each program's own course list; confirm the link, A/B it, ask to deploy
date: 2026-10-02
session: 318 (SkyKeel)
tags: [handoff, sierra-retrieval-corpus, program-course, coci, implementation-funding]
status: current
superseded: true
superseded_by: session_320_handoff.md
---

# You are Session 319

Your moniker is **SkyRudder**. SkyKeel (S318, `session_01CJpguRbXJMmmrJFNdv5VvY`) took Sam's ask:
*"Can you work on giving Sierra good access to the MIS program and course dataset? ... Goal is to be able to
list the courses in particular programs at a given college."* This checkpoint ran on the context WARN
threshold (110k left), so it is a full checkpoint written short.

## First, in this order

1. **Read the `coci-offerings-sync` run dispatched 2026-10-02 ~19:43Z** (main, after Sam's SQL). It reloads
   `coci_college_programs` through the new loader, so `control_number` should be set on ~22,335 rows; the
   course-list step should print "already live ... nothing to write". Read back:
   `select count(*) from coci_college_programs where control_number is not null;`
2. **Check the join:** `select program_title, list_size, count(*) from college_program_courses('Mt. San Antonio College', array['lvn','vocational','nursing']) group by 1,2;`
   The LVN-to-RN A.S. (control 08086) should show `list_size` 27. A null `list_size` means the reload has not
   filled `control_number` yet.
3. **Then A/B and the deploy ask.** Add a smoke mode for the route (a course question naming one college;
   assert a non-NURS course by number appears, for example ANAT 35 at Mt. San Antonio), run
   `cpl-chat-preview-ab.yml` on main, read the grid and the candidate's answer, and ask Sam for the deploy go.
   Sierra is **not deployed** with #1828; `cpl-chat-deploy.yml` is the dispatch.
4. **Sheet 22 is answered** (Sam in chat, ~21:05Z: *"OK, we're on a paid plan with Elevenlabs"*). No lane carries a
   NEEDS-SAM marker, so no sheet is open. Confirm the Sierra PR below merged and Pages carries `_Draft_3`.

## What shipped (all merged)

- **#1826** `coci_program_courses`: 313,710 rows from the Data Mart Program Course File
  (`kb/reference/coci_program_course_file.csv.gz`, 2026-07-16), 20,451 of 22,335 programs, 118 colleges.
  `chatbox/build_program_courses.py` resolves the MIS college code through two signals that must agree;
  MIS `CB_COLLEGE_ID` decides which college owns a course. `coci_college_programs.control_number` is the key.
- **#1827, #1829** the loader (`chatbox/sync_program_courses.py`): content-hash load id, writes nothing when
  the load is already live, else upsert then prune after an exact count with 30-150 s patience.
- **#1828** the route: `college_program_courses()` (calls `search_college_programs` narrowed to one college,
  8 candidates) and `index.ts` (`asksProgramCourses`, `programTerms`, `titleCoverage`,
  `buildProgramCoursesContext`). Three lists, the rest named. "Lists", never "required", never a unit total.
  Guard `tests/sierra_program_courses.test.js` (23 checks).
- **Sam's SQL (19:40Z):** the programs loader carries `control_number`; `coci_programs_replace`,
  `coci_offerings_replace`, `college_geo_replace` now grant EXECUTE to service_role only (they were open to
  `authenticated`); `coci_program_courses` is SELECT-only for anon/authenticated.
- **KB note:** `methodology-a-load-id-should-be-the-content`. Lessons: `docs/cpl_assistant_lessons.md` (S318).

## Sam's rulings this run

- The ask above (`cpl_memory` `sam-sierra-program-course-lists-2026-10-02`).
- Sheet 21: card 1 *pasted* (he ran the SQL), card 2 *later* (ElevenLabs plan), card 3 *keep* (Sierra's voice,
  name, credit and music bed as drawn; the funding lane records it).
- He already holds a Supabase Pro plan; no upgrade. Compute is the smallest size (224 MB shared buffers,
  60 connections); nothing here needs more.

## Open

- The prospective-credit block (`fetchProgramCourses`) still lists courses by TOP code. Switch it to the real
  lists once the route is live.
- #1828's smoke check went red on production probes during a catalog reload (7r/7p 57014); one re-run was
  queued. The truncate-and-reload of offerings/programs still opens that window on every sync.
- `cpl-program-records` was attached to this session; its README says working sessions must never reach it.
  Only its README was read. Tell Sam if it is attached again.

## Patterns that worked

- **Measure the proxy against the real list before building.** The 33% figure decided the design.
- **A loader triggered by code changes must no-op on unchanged data.**
- **Hand Sam the SQL itself.** "Paste the file" produced a path in the SQL editor.

## Safety patterns

- ⚠️ `apply_migration` times out at 60 s, applying nothing, on drop, revoke or delete (the connector's
  confirm). Read back after each timeout; never reword a statement to dodge it. Create-only DDL applies.
- ⚠️ A count right after a 300k-row write can exceed PostgREST's 8 s timeout for minutes.
- ⚠️ Budgets: lanes `sierra-retrieval-corpus` 19,980 and `implementation-funding` 19,946 of 20,000 bytes.

## Later the same day: S317 SkyCompass finished Sierra's narration

- Sam: *"Narration sounds good to start with."* Sierra (ElevenLabs premade Bella) read the last scene, Minimum
  conditions, once the account moved to a paid plan. `_Draft_3` (2:37) renders from `narration_s2.json`, and the
  explainer's Scenario 2 view links `funding_in_motion_n2.html`. `cpl_memory` `sam-sierra-narration-approved-2026-10-02`.
- KB note: `methodology-an-input-read-outside-the-repo-carries-its-text-and-its-gaps`. Send ElevenLabs reads one
  at a time: ten parallel calls from this container tripped its abuse check.
- If Sam asks for changes "to start with" covers: edit the scene text, read it again in flow
  `DORtbrSu16j7ETeqaSkB` (voice `hpp4J3VqNfWAUOO0d1Us`), update `read`, then `narrate.py s2`, `build.py n2` and
  `render.sh n2` (README).
