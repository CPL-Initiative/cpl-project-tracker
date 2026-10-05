---
title: Session 331 handoff — sheet 36, the harvest tab's Procedures view, the film's review
date: 2026-10-04
session: 330 (SkyRoutine)
tags: [handoff, program-requirements-harvest, cpl-pathways, college-page-read, ironworker-film, decision-sheet]
status: current
---

# You are Session 331

Your moniker is **SkyForge**. SkyRoutine (S330, `session_01JAYXAbagdKkZqsZbLXmLvz`) checkpointed with
about 270K of context left. If Sam's routine started you, read
[`docs/reference/scheduled_sessions.md`](reference/scheduled_sessions.md) first and follow it.

## First, in this order

1. **Sheet 36 is answered** ([Open Asks Sheet 36](https://claude.ai/artifact/CrFtAh1wMEiKnooFzKUsDx), done; no lane marks
   NEEDS SAM, so no sheet is outstanding). Build sheet 37 when a lane next marks one.
2. **#1859** (the form step, Cerritos reads 4-5, sheet 36, the film, this checkpoint): merge it on a green `test`
   if S330 did not.
3. **Cerritos read 7: the high school list, other routes** (Sam, sheet 36 card 2: *"lets work together to see if we
   ca find these another way and close the gap"*; the drafted request stays held). **First, CATEMA** (Sam, 2026-10-05
   ~00:15Z: *"there's a system called catema that the college's have been using for years to document their cte
   articulated hs courses in case we can scrub some data from there"*): find whether Cerritos's region publishes a
   public CATEMA articulation lookup (catema.net and its regional sites), read it from a runner under the census
   rules (robots first, public pages only, never a login), and record the host on the procedure record. Then the
   archive: the Internet Archive's 2016 capture
   of statewidepathways.org links `showagreements.php` (View existing agreements); read its captures through
   `https://web.archive.org/web/2016/http://www.statewidepathways.org/showagreements.php` and follow to Cerritos's
   agreements (the archive's index is in read 6's log, run 37245467142; captures after 2021 are a gambling site).
   Then the CCAP page's participating-schools section and the partner districts' board agendas. Record each step
   with `select public.program_source_procedure_set('Cerritos College', '<record>'::jsonb, '<by>', '<md5 as read>')`
   (Cerritos is at v3, md5 `dcf96a508207ee55e604437d9ef71802`).
4. **The harvest tab port with its Procedures view** (the lane's NEXT ①): port the approved mock-up
   ([Program Requirements Harvest](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), v3) into COBI, with a
   Procedures view that reads `program_source_registry.procedure` (anon holds SELECT). Sierra docks beside it via
   `CPL_CHAT.mountInto(host, "program-requirements")`, which needs the surface in `cpl-chat`'s `KNOWN_SURFACES`
   (a deploy: hold for Sam unless a standing authorization covers it). Beta draft label (Sam's ruling).

## Decisions Sam made this run (all in cpl_memory, verified)

- **The film** (23:42Z, in chat): *"Video is excellent!"* Draft v1 kept as is.
- **Sheet 36** (23:50-23:51Z): card 1 pasted (*"it gave the correct read back"*); card 2 edit and follow up:
  *"lets work together to see if we ca find these another way and close the gap"*.
- **The write function** (~00:00Z): *"go ahead on writing the function"*; on governance, *"we can revise governance
  if needed"*. His connector tools are all Always allow (he checked), so an UPDATE's 60-second hold comes from
  Supabase's server; `program_source_procedure_set()` writes a procedure record with a SELECT and no paste.

## What shipped (S330, #1859)

- `kb/_college_page_read.py` submits a form a plan names (fields, button; robots.txt for the action first; the log
  prints what it sent and every button), and skips a host the procedure record marks `gone`.
- Cerritos read 4 (run 37241442265) and read 5 (37241996688), on the ladder in `cpl_pathways_data.js`: Schedule+
  Fall 2026 lists 22 IWAP courses and none of the 26 noncredit AED 40-41 courses (nor the Pre-Apprenticeship
  certificate's), Spring has no IWAP yet; high school credit by Credit by Exam (B or better, petition within two
  years, up to 30 units, residency waived) or CCAP; `statewidepathways.org` is a domain for sale; the Chancellor's
  Office lists the B.S. as approved, coming soon. Two *To confirm* lines remain (the B.S. course list; the high
  school list and Columbus High's route).
- The Ironworker pathway film, draft v1: `prototype/ironworker_video/` (source forked from the funding film, `build.py`
  FACTS with sources, README), MP4 `20261004_Ironworker_Pathway_in_Motion_v1.mp4`, player
  [Ironworker Pathway in Motion](https://claude.ai/artifact/VdxzrRS7wVxw6o5m6fRTS9). Fable critiqued the storyboard;
  four of its lines were corrected against the ladder.
- cpl_memory: eight rows, each logged (receipts `kb/receipts/cpl_memory_2026-10-04_s330.sql` and `..._s330b.sql`, `..._s330c.sql`, `..._s330d.sql`).
- KB note `methodology-an-advisor-asserts-what-its-fact-list-does-not-say`.
- `program_source_procedure_set()` (migration `program_source_procedure_set_2026_10_04`, receipt
  `kb/receipts/program_source_procedure_set_2026-10-04_s330.sql`); Cerritos's record v3 through it (read 6).

## Safety patterns

- **A bare UPDATE still holds** (apply_migration waits 60 s, writes nothing; the repo guard refuses it in execute_sql).
  A procedure record goes through its function; any other one-off UPDATE is a paste card (the builder reads its receipt).
- **A form step needs its submit button named.** The first read of a form prints its buttons; the next plan names one.
- **`pkill -f <pattern>` matches its own shell** when the pattern is in the command line, and ends the command.
- **`check_generated.sh | grep` does not stop a commit.** Chain the commit with `&&` on a clean check, or read the
  output first (S330 committed past a stale dependency map once and fixed it next commit).
- **A published artifact grants a page no download permission.** Link a file on GitHub instead (the film does).
- The sandbox reaches cccco.edu but not college sites, `*.supabase.co` or artifact storage; runners reach the sites.
- CLAUDE.md is at 59,997 of 60,000 bytes. Add nothing without trimming.

## Next work (after the three above)

- Re-read Cerritos Schedule+ for Spring 2027 IWAP and AED sections once they post (read 5's Spring spec).
- Record shape v3 (outcomes as printed); the program view's By requirement / By term layouts.
- The addenda reading agent after the 2026-10-11 apply (Cerritos's B.S. list may arrive as an addendum).
- Apply the statement on the public KB once CPL-Initiative/cpl-knowledge-base#25 merges (Sam's review; redeploy
  `generate-letter` after).
- Raise Miramar's AUTO 156G articulations (EMT, Driver Operator 1B) in the clean-up lane.
- Statewide Career Pathways is gone for every college that names it: when the harvest widens, check whether other
  colleges point their public articulation list at it.
