---
title: "Session 380 handoff — load the course outcomes, finish SDCCD's SLO read, then the next college"
date: 2026-10-13
session: 376 (SkyLinden)
tags: [handoff, program-requirements, course-outcomes, course-outlines, sdccd, san-diego-miramar]
status: current
superseded: true
superseded_by: session_386_handoff.md
---

# You are Session 380

Your moniker is **SkyAlder**, on the **program requirements** queue. Session 376 (**SkyLinden**,
`session_01VeL5b2x7FHg7ge2jtkt8S3`) ran it with Sam present at the start. A second queue runs beside
it: **`docs/session_379_handoff.md`** (SkyTamarack, Annual Goals, written by the 05:12Z routine's S378).
If Sam opened you with this file, work this queue; `list_sessions` first and agree one writer.

## What shipped (S376)

- **Three re-reads under #2050's Requirements-tab fix, loaded unchecked and displayed:** Mesa's nine health
  programs (166 to 175, #2064), San Diego City's two nursing degrees and Cyber Defense B.S. (164 to 167,
  #2068), Miramar's ten aviation programs (110 to 120, #2070). Build `98becf9fafc7` on all 2,203 rows,
  31 checked. Miramar 39433 got another program's page on the re-read; its good filed record was restored
  before the load and the build.
- **SDCCD's course outline index (#2065):** each host's link form learned from its own dashboard, comparison
  reports left out, and the report a `.run` names (`report=^All Fields$`). SDCCD's Course Outline Report
  prints objectives only; All Fields prints each college's SLOs under its own Group Title. 1,641 of 1,660.
- **The trigger-file gate (#2069):** census and index run only when the pushed `.run` differs from main's.
- **#2066 (draft, stacked on #2049):** SDCCD's SLOs by college group (reader and load), the same gate for the
  outcomes read and load, and the full read in four slices (run 38351637385; slices 1 and 2 landed: slice 1
  411 read, 381 with outcomes, 1,433 SLOs).
- **Chaffey:** course outcomes live on section syllabi; no public course SLO list found.
- **Sheet 72:** card 1 *paste* (03:44Z) is Sam's; card 4 *phrase* went to the Annual Goals queue (S377).

## Docs to read, in order

1. `docs/reference/lanes/program-requirements-harvest.md`: the outcomes paragraph and NEXT.
2. `docs/program_requirements_harvest_lessons.md`: the S374 and S376 sections.
3. `cpl_memory` tags `course-outcomes`, `program-requirements-harvest` (S376 adds six rows, author
   `SkyLindenS376`).

## Priority, in order

1. **The table.** `select to_regclass('public.course_outcomes')`. Sam chose to paste
   `chatbox/supabase_course_outcomes.sql` (Sheet 72 card 1). If it is still null, try `apply_migration` once
   (seven timeouts so far; read `supabase_migrations.schema_migrations` and `to_regclass` after a timeout),
   then remind Sam in one line. Never DDL through `execute_sql`.
2. **The RCCD load** once the table exists: on #2049's branch write `host=rccd` to `kb/course_outcomes/.load`
   and push (the gate passes: main holds no `.load`); read the receipt back
   (`select college, count(*) from course_outcomes group by 1`); merge #2049 on `test`.
3. **#2066:** check slices 3 and 4 the way slices 1 and 2 were checked (every row 200, parsed from HTML, no
   group title outside City, Mesa, Miramar). Retarget to main after #2049 merges, merge main in, then
   `host=sdccd` in `.load`, read back, merge on `test`.
4. **Chaffey:** record the finding in `program_source_registry.cor_slo_source_url` and its note (a
   migration; the tool permitting). Then the next host with public outlines printing SLOs (census run 5:
   Allan Hancock, Crafton Hills, Cuesta, Feather River, Las Positas, Palomar on curriQunet).
5. **The gallery picks** when Sam marks them (`ArtifactData list picks` on
   https://claude.ai/artifact/21o45k6MbPKsPMgNQk69hn; empty at 07:50Z).

## Patterns that worked

- **File a trial of twelve pages before writing a parser.** The first SDCCD trial showed the report titled
  for the outline prints objectives only; the second showed the per-college groups.
- **Diff the re-read's records against the filed ones before loading** (`git diff --name-status`): it caught
  39433.
- **A runner commit has no CI;** a lane commit after it gives the head its own `test` run.

## Safety patterns to honor

- A re-read keeps a record filed from an unchanged page, and can still move a good one to a wrong page:
  restore its file before the build.
- Merging main into a branch carries every trigger file main holds. The four `kb/` trigger workflows now
  gate on main; four others (`cpl-landing-pages`, `cpl-news`, `first-light-art`, `first-light-gallery-thumbs`)
  do not.
- `scripts/check_generated.sh` after `git add`, and stop on its output.

## Skipped this checkpoint (and why)

- **UI pass (9):** no room this run (context at the warning line); `cobi:canonical-subj4` stays due.
- **Pipeline view (7):** the M-ID pipeline did not move. **`kb/README.md`, `README.md`:** no new surface.

## Subscriptions and check-ins

At sign-off S376 holds a subscription on #2066 and #2049, which it drops at sign-off; no check-in, no
artifact watch.
