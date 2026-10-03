---
title: Session 320 handoff — Sierra's course lists and timing log are live; the program requirements harvest waits on Sam's eight calls
date: 2026-10-03
session: 319 (SkyRudder)
tags: [handoff, sierra-retrieval-corpus, program-requirements-harvest, timing, jev]
status: current
superseded: true
superseded_by: session_321_handoff.md
---

# You are Session 320

Your moniker is **SkyCensus**. SkyRudder (S319, `session_01EJfcrjnsMx1zxd9doHm8P9`) finished S318's
course-list work, deployed it twice, and opened a new lane from three statements Sam made unasked.

## First, in this order

1. **Sheet 23 is answered** (Sam, 15:05Z on 2026-10-03: "As proposed" on all eight calls; the lane lists
   them). Start Phase 0, the census: lane `program-requirements-harvest`, NEXT. Reading college websites from
   GitHub runners is approved (call 5). Still to name in Phase 1: Riverside City's program and who checks the
   sample.
2. **Read the timing log** over real traffic once a few days have passed:
   `chat_interactions.timings` (v1). The first 23 turns were smoke questions: median 15.2 s, first word 6.1 s,
   writing 8.8 s, prep 2.2 s, retrieval 1.4 s. Rows from before 14:57Z on 2026-10-03 carry none.

## What shipped (all merged, all deployed)

- **#1832** smoke mode 7l (LVN-to-RN at Mt. San Antonio: retrieval 27 courses, 7 subjects outside NURS; prose
  names a course outside nursing by number) and the honors-pair rule. cpl-chat deployed 14:15Z (run 37128917426).
- **#1833** 7s sets aside "has an exhibit ... articulating" as an articulation absence.
- **#1834** the timing log: `chat_interactions.timings` (column applied live first, migration
  `chat_interactions_timings`), every read through `timedFetch` inside the route limit, one `cpl-chat timing:`
  log line, and the insert's returned error logged. Deployed 14:57Z (run 37131460494); the smoke after it
  passed every mode (run 37131616028).
- **Docs:** lane `program-requirements-harvest` (new, §11 row), Sierra lane refreshed, lessons
  (`docs/cpl_assistant_lessons.md` S319), KB note `methodology-write-the-rule-as-the-sentence-you-want-said`,
  sheet 23, `cpl_memory` receipt `kb/receipts/cpl_memory_2026-10-03_s319.sql` (7 rows).
- **Vault:** CPLBrain #221-#223, Sam's three statements verbatim in
  `03-professional/braindumps/braindump-2026-10-03-1433-program-requirements-from-local-catalogs.md`.

## Sam's rulings this run

- *"go ahead and deploy once the A/B is clean"* (done twice).
- *"yes, add the timing log after the deploy and let see how best to use Jev as we continue to expand Sierra's
  knowledgebase and capability"*. Sierra never calls Jev today. First use proposed: a judge over A/B answers
  (no visitor text leaves); routing visitor questions through TypeSafe goes through Governance first.
- The harvest: our own best version now; the Tech Center's COCI ROE fields are a parallel track (*"working on
  that end is often a slog or dead end"*); a per-college source registry kept by agents; a per-college tab; an
  agent per college the college and we own and train.

## Open

- **7c's quick-list window:** the post-deploy smoke (run 37129004481) found the table at character 1,891 of
  1,800, and the answer opened with a self-correction ("Start with Santa Ana College's LVN-equivalent
  coursework: actually, the catalog data lists no college in Orange County..."). Both are existing behavior; the
  re-run passed. Sam has not asked for a fix.
- The prospective-credit block (`fetchProgramCourses`) still lists by TOP code; switch it to the real lists.
- `cpl-program-records` was attached again this session; nothing in it was read. Tell Sam if it reappears.

## Patterns that worked

- **Read the candidate's answer, not only the grid.** A clean grid hid a sentence telling a student to take both
  courses of an honors pair.
- **One suite at a time, by cancelling.** Push and merge smokes duplicate an A/B or a dispatched smoke; cancel
  the redundant one and say why once on the PR.
- **Merge before deploy:** `cpl-chat-deploy.yml` always ships `main`.

## Safety patterns

- ⚠️ Apply an additive column before deploying code that writes it: the preview writes the same tables.
- ⚠️ supabase-js returns errors from writes; read `.error`.
- ⚠️ Budgets: CLAUDE.md 59,989 of 60,000 bytes; lane `sierra-retrieval-corpus` 19,996 of 20,000.
- ⚠️ This container cannot reach CourseLeaf or curriQunet catalogs, nor the Actions artifact host; read job logs
  through the MCP and save them to a file.
