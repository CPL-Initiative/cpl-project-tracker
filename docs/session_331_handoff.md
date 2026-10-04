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

1. **Sheet 36 replies** ([Open Asks Sheet 36](https://claude.ai/artifact/CrFtAh1wMEiKnooFzKUsDx), current; read
   `replies` and `replies/done` with ArtifactData before anything else). Three cards:
   1. Paste Cerritos's procedure record v2 (receipt `kb/receipts/program_source_registry_procedure_2026-10-04_s330.sql`,
      guarded on v1's md5 `7083fab5…`). On "pasted", read back: `procedure_by` = `college-page-read S330`, `v` = 2,
      5 steps; then the lane's card-1 text leaves.
   2. Send the drafted request for Cerritos's high school articulation list (outward: the MAP team sends; a session
      never sends). On "send", the record's `requests[0].status` becomes sent with the date, by a later receipt.
   3. The Ironworker film draft v1: keep, narrate with Sierra, or edit. On "narrate", follow
      `prototype/funding_video/README.md`'s Sierra path (ElevenLabs, voice Bella `hpp4J3VqNfWAUOO0d1Us`).
   Each answer changes the harvest lane's NEEDS SAM text in the same PR (`decision_sheets`).
2. **#1859** (the form step, Cerritos reads 4-5, sheet 36, the film, this checkpoint): merge it on a green `test`
   if S330 did not.
3. **The harvest tab port with its Procedures view** (the lane's NEXT ①): port the approved mock-up
   ([Program Requirements Harvest](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), v3) into COBI, with a
   Procedures view that reads `program_source_registry.procedure` (anon holds SELECT). Sierra docks beside it via
   `CPL_CHAT.mountInto(host, "program-requirements")`, which needs the surface in `cpl-chat`'s `KNOWN_SURFACES`
   (a deploy: hold for Sam unless a standing authorization covers it). Beta draft label (Sam's ruling).

## Decisions Sam made this run

None. Sam opened the session with the handoff line and did not write again. The run acted on the queue and on
his standing scheduled-session terms (go with a clear, reversible recommendation; card it).

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
- cpl_memory: five rows, each logged (receipts `kb/receipts/cpl_memory_2026-10-04_s330.sql` and `..._s330b.sql`).
- KB note `methodology-an-advisor-asserts-what-its-fact-list-does-not-say`.

## Safety patterns

- **The Supabase connector holds a guarded UPDATE for a person** (apply_migration times out at 60 s, nothing written;
  read back to be sure). A paste card with the statement in `<pre>` is the path; the builder reads it from the receipt.
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
