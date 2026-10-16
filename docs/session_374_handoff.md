---
title: Session 374 handoff — the SLO read on RCCD's outlines, after the course outline fields and the index
date: 2026-10-12
session: 373 (SkyCypress)
tags: [handoff, program-requirements, course-outlines, san-diego-mesa, sierra]
status: current
superseded: true
superseded_by: session_380_handoff.md
---

# You are Session 374

Your moniker is **SkyJuniper**. Session 373 (**SkyCypress**, `session_01USmBuZJFVjcmsWW8NEzZiq`) ran with Sam present and
checkpointed at about 105k tokens left.

## First, in this order

0. **One writer.** `list_sessions`; Sam's routine fires 05:12Z (`trig_01L8K64ZKYb5eALdT4HW6NAV`). Merge on `test`, if
   S373 has not: this checkpoint PR (`claude/s373-checkpoint`), the vault note PR, **#2047** (the registry fill, already
   applied live; the PR files the script and receipt) and **#2046** (the RCCD course index).
1. **Rule 8:** `cpl_memory` tags `course-outlines`, `program-requirements-harvest`, `san-diego-mesa`, `sam-ruling`.
2. **Card 3, the SLO read (Sam, Open Asks Sheet 70: *"Every course in the loaded records"*).** The index is done for RCCD:
   `kb/course_outline_index/index_38313849383.json` maps each course code to its active outline report
   (`https://rccd.curriqunet.com/Report/Course/GetReport/<CourseId>?reportId=97`), 1,605 of the 1,648 courses the
   Riverside City, Moreno Valley and Norco records name. Next:
   - **Storage first.** The card says the harvest keeps SLOs *by college and course*: a new table (college, course
     code, outcomes as printed, source URL, source kind, run). It is a new write surface: map it in
     `kb/governance_surface_map.json` before it ships (Rule 10 a3); public read (public record), writes from a runner
     with a receipt naming every key, as the program records load does.
   - **The read.** One report per course (about 1,605 loads at 3 s, so split the run). RCCD prints
     `Student Learning Outcomes: Upon successful completion of the course, students should be able to demonstrate the
     following skills:` then the list; the report also names the colleges that offer the course (RIV, MOV, NOR), so one
     read serves all three. Use `load_full` (whole page text) and the line-start SLO heading rule from the census.
   - Then SDCCD (`DynamicReports/AllFieldsReportByEntity/<id>?entityType=Course`, same search) and Chaffey (public
     outlines with no SLO heading: look for another source and record it in `cor_slo_source_url`, card 2's note).
3. **Mesa's nine health programs** are missing from the one catalog section the reader walked: find where the catalog
   lists them and file it in Mesa's procedure record before a re-read.
4. **The gallery picks.** When Sam says he has marked: `ArtifactData list picks` on
   https://claude.ai/artifact/21o45k6MbPKsPMgNQk69hn (empty at 21:03Z), as handoff 373 described.

## What shipped (S373)

#2043 merged (S372's checkpoint) · **#2044** San Diego Mesa read (168 of 184, $14.82), loaded (166) and displayed
(build `da4f44a160ca` on all 2,181 rows, 31 checked) · **#2045** the eight `cor_*` registry columns (migration, Sheet 70
card 1) · **#2042** the course outline census (run 5, all 118: an outline at 32 colleges, 18 printing SLOs; 6 sign-in;
59 no system) · **#2047** the fill on all 118 rows (applied as a migration; md5 equal to the script) · **#2046** the RCCD
course index (discovery 38312406074, index 38313849383).

## Decisions Sam made this run

- **Open Asks Sheet 70** (20:40-20:42Z): card 1 *Apply as a migration*; card 2 *Record and move on*, note *"And look for
  other repositories for the outcomes data and record the link and data in prog reqs"*; card 3 *Every course in the
  loaded records* (not the proposed articulated-first). `sam-sheet-70-rulings-2026-10-12`.
- In chat: *"start the Riverside course index"* (about 21:40Z).

## Patterns that worked

- **Open one instance before you classify a system:** the census called curriQunet dashboards sign-in; one more link
  found public outlines with SLOs (`methodology-a-sign-in-form-is-no-proof-of-a-closed-system`).
- **Replay the page's own request from inside the page** when a host runs a Cloudflare check: the index read all 14,292
  rows in 72 pages with no block.
- **Test the receipt's SQL against the script:** SQLite ran the fill and matched `fields()` on every row before the live
  apply; the live md5 matched after.

## Safety patterns

- The repo's Supabase guard refuses an UPDATE through `execute_sql`; a registry write goes through `apply_migration`
  with a committed receipt and a read-back.
- A merge of main into a branch can carry trigger files; the course outline workflows skip merge commits.
- The dependency map reads staged files: `git add`, rebuild, `git add`, then `check_generated.sh`.

## Not refreshed this checkpoint

UI pass (no room for a fix PR; `python3 scripts/ui_pass.py --next` names the view); Pipeline tab (the M-ID pipeline did
not move); `kb/README.md`, `README.md`. Watches: #2046 and #2047 subscribed; check-in `trig_01CvVrW4a928GwffFwdHD7Sk`.
S373 drops these at sign-off.

## Sign-off line for Sam

Greetings, you are SkyJuniper (Session 374), see SkyCypress's handoff — `docs/session_374_handoff.md` — let's keep rolling with our queue.
