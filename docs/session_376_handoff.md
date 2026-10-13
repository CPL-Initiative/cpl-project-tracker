---
title: Session 376 handoff — load the course outcomes, then re-read Mesa
date: 2026-10-12
session: 374 (SkyJuniper)
tags: [handoff, program-requirements, course-outlines, course-outcomes, san-diego-mesa]
status: current
---

# You are Session 376

Your moniker is **SkyLinden**. Session 374 (**SkyJuniper**, `session_01AHDZvwJgxnDZhHCH4FJP9T`) ran with Sam present.
A parallel session (SkyLedger) ran the Annual Goals and Activities work the same evening and wrote
`docs/session_375_handoff.md` (SkyTally): **two queues are live.** Read 375's priorities too and agree one writer
(`list_sessions`). This handoff took 376 because both checkpoints wrote 375; SkyLedger's merged first (#2053).

## First, in this order

0. **One writer.** `list_sessions`; Sam's routine fires 05:12Z (`trig_01L8K64ZKYb5eALdT4HW6NAV`). Merge this checkpoint
   PR (`claude/s374-checkpoint`, #2052) on `test` if S374 has not; the vault note (CPLBrain#324) is merged.
1. **Rule 8:** `cpl_memory` tags `course-outlines`, `program-requirements-harvest`, `san-diego-mesa`; read
   `apply-migration-timeouts-2026-10-12` before any migration.
2. **The course outcomes read (#2049, branch `claude/s374-course-outcomes-read`).** Run 38318152644 reads the SLOs of
   the 1,605 RCCD courses the loaded records name, four slices in turn. Slice 1 landed (402 outlines, 1,367 SLOs, all
   parsed from the HTML); slices 2 to 4 land on the branch as `kb/course_outcomes/rccd/read_38318152644_p<i>of4.json`
   (if a slice's push failed, its artifact `course-outcomes-38318152644-part<i>` holds it). Check each the way slice 1
   was checked: every row 200, `parsed_from` html, heading *Student Learning Outcomes*.
   - **The table is not created.** `chatbox/supabase_course_outcomes.sql` (table `course_outcomes`, public read,
     insert-only `course_outcomes_load()` on the service role) timed out in `apply_migration` six times with nothing
     reaching the database. First read Sam's reply on [Open Asks Sheet 71](https://claude.ai/artifact/6QK18kTxtsbbX51CPvzdSQ)
     (`ArtifactData list replies`; card 1 *I'll paste it* or *Wait for the tool*) and `to_regclass('public.course_outcomes')`.
     If not, try `apply_migration` once, then read back. Never DDL through `execute_sql` (the guard's rule).
   - **Then the load:** write `host=rccd` to `kb/course_outcomes/.load` and push; `course-outcomes-load.yml` posts
     the rows and commits `kb/receipts/course_outcomes_rccd_<run>.json` (every id and its delete). Read it back:
     `select college, count(*) from course_outcomes group by 1`.
   - Then merge #2049 on `test`; then SDCCD (`DynamicReports/AllFieldsReportByEntity/<id>?entityType=Course`) and
     Chaffey (outlines with no SLO heading: look for another public source, `cor_slo_source_url`).
3. **Mesa's nine (#2050, merged).** They are in catalog 70's index; each shows six tabs with Requirements fifth,
   and the reader read four. #2050 reads a Requirements tab first. **The re-read is running:** run 38322747831 on
   `claude/s374-mesa-reread` (dispatch: San Diego Mesa College, `extract: 1`, Sam's standing go for Mesa extraction).
   Extraction keeps every record filed from an unchanged page, so it should send about nine programs to the model.
   When it files: check `capture.json` (`not_found` should lose the nine), dispatch `step: load` then
   `step: display` on the same branch, read both back, open the PR and merge on `test`. Then check Miramar's four
   not found (16779, 30512, 30532, 36254) and San Diego City's place-none records for the same tab layout.
4. **The gallery picks** when Sam says he has marked them: `ArtifactData list picks` on
   https://claude.ai/artifact/21o45k6MbPKsPMgNQk69hn.

## What shipped (S374)

S373's #2046 (RCCD course index), #2047 (registry fill) and #2048 (its checkpoint) merged. **#2049** the course
outcomes read (draft: reader, load, table SQL, governance entries, two workflows, tests 7 and 4 checks). **#2050** the
curriQunet Requirements-tab fix (merged; 109 checks, the two new ones fail without it). KB note
`methodology-a-lead-in-sentence-is-not-a-section-heading`. Five `cpl_memory` rows (receipt
`kb/receipts/cpl_memory_2026-10-12_s374.sql`).

## Decisions Sam made this run

None on a sheet. In chat: *"keep rolling. Note, I have another session working on Annual Goals and Activities
tabs--shouldn't collide with you"* (about 23:07Z).

## Patterns that worked

- **File a trial's pages and test against them.** The trial of twelve filed each page's text and HTML; that is how
  the objectives-for-SLOs error showed, and the files are the test's fixtures.
- **Walk the tree before guessing where a thing is listed.** Seven small JSON reads found Mesa's nine in the index the
  reader already walked; the coverage number (0.0) said the page, not the index, was the problem.

## Safety patterns

- A timeout in `apply_migration` is no proof of failure: read `to_regclass` and the migrations ledger before retrying.
- A runner that commits back after the branch merged main: land on the tip one commit deep, never `pull --rebase`.
- The dependency map reads a workflow's push target: keep it unquoted.
- The lints job's `supabase_table_grants_test` wants every new table to grant select to `service_role`.

## Not refreshed this checkpoint

UI pass (two PRs and a running read in flight; the due view is `cobi:annual-report`); Pipeline tab (the
M-ID pipeline did not move); `kb/README.md` (the new scripts are on #2049, not main); `README.md`. Watches: #2049,
#2052 and CPLBrain#324 subscribed (#2050 merged). S374 drops these at sign-off.

## Sign-off line for Sam

Greetings, you are SkyLinden (Session 376), see SkyJuniper's handoff — `docs/session_376_handoff.md` — let's keep rolling with our queue.
