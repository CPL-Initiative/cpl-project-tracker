---
title: "Session 456 handoff: Hartnell's vendor course units, Sierra's IT Cybersecurity, display build b0a96907bf83"
date: 2026-10-23
session: 455 (SkyMonkeyflower)
tags: [handoff, program-requirements-harvest]
status: current
superseded: true
superseded_by: session_462_handoff.md
---

# You are Session 456

Your moniker is **SkyYarrow**. Session 455 (**SkyMonkeyflower**) was started by the CPL Queue routine at 11:20Z and
claimed S454's queue. Read, in order: this file, `docs/reference/lanes/program-requirements-harvest.md`,
`docs/program_requirements_harvest_lessons.md` S455, then `docs/reference/lanes/my-college-action-page.md` (Sam has
still not seen the fold's step 3 live).

A full checkpoint: the harvest lane moved and the run wrote data receipts. Skipped, nothing moved there:
`kb/README.md`, `README.md`, the pipeline viz, the four other Commons run logs, a KB note (the findings are
reader-specific: lessons S455 and three `cpl_memory` rows). The harvest lessons doc was compacted (S423-S424 to
archive 3).

## What shipped (#2376, the wave PR, which carries this checkpoint too)

- **S454's display build b2864d4d6992 is applied on `main`** (run 39941932979, its applied record committed).
- **Hartnell's course units from the vendor.** `cd_pages` keeps each Requirements tab's `courses/search` answer
  (`credits.creditHours`) as the source's `course_units`; the new `course_units` reconcile kind fills an empty course
  or alternative from it and names the call, skipping 0-hour noncredit courses and hours-measured records. The first
  reconcile (39946676559) wrote 0 units into noncredit programs; it was reverted and fixed. Reconcile 39949570443:
  86 priced; reread 39951764229 replaced 86 (receipt with rollback), 59 of 96 pass (from 44).
- **Sierra's IT.** Page read 39946962141 (capture view): the IT page heads "Information Technology—Cybersecurity".
  `with_acronyms` reads a short title word as the initials of the heading's words (each 4+ letters). Capture
  39949602062: 107 of 125 found, page-claimed 17 to 15. Extraction 39951768339 (both Cybersecurity awards pass, about
  $0.18), load 39952730580 (0 inserted, 98 kept), reread 39953021826 (2 replaced). IT: Business Information Worker
  (07963, 21537) is not in Sierra's 2026-2027 catalog: the college's to retire in COCI.
- **Display build b0a96907bf83** on the wave branch (`cpl_pathways_roep_data.js` and its `.sql.gz`).

## Decisions Sam made this run

On Open Asks Sheet 115 at 12:23-12:26Z (its `replies` store, read by S455 at 12:37Z; Complete, through card 3): **card 1
remove** (the 25 live records the newer reads no longer file, and Victor Valley's department-list records), **cards 2
and 3 keep** (Scenario 4's two noncredit-gate calls). Sheet 116 carries the same three cards at the same positions, so
the rulings stand there; card 4 (Hartnell's Local GE at 23) has no reply. No Library brief was requested.

**Who does what.** S450 (SkyMariposa, a session Sam opened, still live at 12:36Z) messaged S455 and took cards 2 and 3
(the funding lane line, a `cpl_memory` row, the sheet's comment thread). S455 had no `send_message`, so it answered on
#2376: S450 runs card 1 too, after #2376 merges and its display apply finishes. If S450 has not landed card 1 when you
start, read #2376's comments and S450's PRs before you touch it; one writer.

## Open work, in order

0. **#2376.** If it is still open, merge it (squash) once `test` passes on its head, then dispatch `step=display` on
   `main` (college=Hartnell College) for b0a96907bf83; the apply takes about 66 minutes. If it merged, confirm that
   run finished and committed its applied record.
1. **Sierra's last 15 page-claimed** (`kb/program_requirements_college/sierra/capture_preview.json`): Business
   (15307, 37810), Mathematics and Physics AS-T (31226, 32010), Embedded Systems, Building Industries (21573, 38749),
   Applied Art and Design, Watershed Ecology, Emergency Medical Sciences, Fire Company Officer, two ESL noncredit.
   Read one department page with `capture_view` (a `kb/college_reads/` plan pushed on its own branch) and grep the
   log with a large `tail_lines`. 07963 and 21537 are not in the catalog; leave them.
2. **Hartnell's remaining failures** (37 arithmetic): 7 still list a required course without units (the vendor's
   answer did not price it; check the code's form), 8 name a GE pattern without units on a degree the GE steps do not
   reach. Count each `why` first.
3. **Sheet 116** ([link](https://claude.ai/artifact/4oL4YfC4b43iVjUq1bSS8J)): cards 1-3 are answered (above), card 4
   open. Card 1's removal (S450's, unless #2376's comments say otherwise) goes through `supabase-migrate.yml` with a
   before-values receipt and an md5 guard, drops the lane's NEEDS SAM, and is followed by a display rebuild. The five
   rows of the same kind found since (Hartnell 21450, 31592; Long Beach City 43802, 46290; Palo Verde 04436) are a
   card on the next sheet, never a delete. The next sheet goes out under a fresh `SHEET_ID`.
4. Two standing offers from S448, neither a card: retarget Sierra Training's *Try it in: My College* to CPL
   Pathways' section, and decide whether CPL Pathways keeps My College's decision-right row.

## Lessons to honor

- A vendor's course data is a source field: keep it on the page as the tab loads, and cite the call.
- A noncredit course's 0 credit hours are no units. Inspect a reconcile's fills before the reread.
- An acronym match needs words of four letters or more ("intro to" is not IT).
- The sandbox has no `node_modules`: `npm test` fails here on jsdom. CI's `test` is the gate.

## Other sessions and the routine

S455 had no `list_sessions`. It read the open PRs (#2323 and #2257, days old) and `main`'s commits since the handoff,
and found no live session. The last overnight firing is 13:12Z.

## Let go

S455 held no PR subscription, check-in or artifact watch. Branches on the remote: `claude/practical-meitner-48enco`
(#2376, auto-deletes on merge), `claude/harvest-sierra-s455` and `claude/sierra-infotech-read-s455` (both merged into
the wave), plus the S452-S454 branches the last handoff named.
