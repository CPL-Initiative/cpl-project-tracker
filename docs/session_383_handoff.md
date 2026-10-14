---
title: "Session 383 handoff — Cabrillo's display, #2074's merge, the eLumen hub reader, and Sam's Annual Goals asks"
date: 2026-10-13
session: 382 (SkyLarch)
tags: [handoff, program-requirements, coastline, cabrillo, elumen, annual-goals]
status: current
superseded: true
superseded_by: session_386_handoff.md
---

# You are Session 383

Your moniker is **SkySpruce**, on the **program requirements** queue. Session 382 (**SkyLarch**,
`session_01Lbkg4WyHNMN5dbXM7An3N7`) ran it with Sam present; it checkpointed at Rule 9a's warning line
(~105k tokens left). `list_sessions` first and agree one writer.

## What shipped (S382)

- **Coastline (#2074, open):** the coarse net now reads a page's hidden Requirements tab (`page_net()`), and
  `SUBJECT_TOKEN` takes the Coast district's C-numbered courses (f3d8969, 138 checks). Read 38445051060: 154 of 159,
  124 pass, $8.52. Load 38449045399 inserted 140 unchecked (14 place none). Display build `14e436537733`
  (all 2,572 rows before Cabrillo) applied by run 38449957832; procedure record v1 applied (md5 804419067ba6).
- **Cabrillo (#2078, open):** read 38442109713 (Sam's go 17:51Z): 271 of 281, 183 pass, $18.17. Load 38450067209
  inserted 268. 58 of 88 arithmetic failures are the catalog stating only the degree total (read 38449079970). No display yet.
- **#2076 merged:** the Supabase migrate runner (Sam, Sheet 74 card 2 "allow"); Sheet 74 card 1 "pasted", Chaffey row read back.
- **#2080 merged:** the Annual Goals add dialog (Sam's 4.7 EMS Corps report): Under lists each Activity above its own
  sub-activities, offers rows added since the rebuild, and clears a stale home check. Dashboard run 590 drew 4.7.
- **eLumen menus (`claude/s382-elumen-menus`, no PR, read plans only):** Modesto links a Programs A-Z hub, Palo Verde
  award categories, both linking `<catalog>/program/<slug>`; Santiago Canyon's listing has no links.

## Priority, in order

1. **Merge #2074 on `test`.** Pull first: the display job commits its applied record. `lints` was red only for the
   missing display receipt; it should be green on the head after c8a9acd.
2. **Cabrillo's display (#2078):** merge main (regenerate the dependency map, never pick), add Cabrillo to the builder's
   two dated reads (`registry_read.json` from `program_source_registry`, `map_cr_by_course.json` from
   `map_cr_by_course.sql`; S381's commit fe4c0b1 is the worked example), `python3 kb/_build_roep_display.py`,
   `tests/roep_display_test.py` 0 failures, push, dispatch `step=display` (Sam's standing go), read back, procedure
   record v1 (`program_source_procedure_set`, expect 'none'), merge on `test`.
3. **The eLumen hub reader:** after #2078 merges, a sibling branch: when the menu names no program or department, read
   the menu's program and award hubs (Modesto `programs`, `bytype`; Palo Verde `adt`, `associate-of-*`,
   `certificate-of-*`, `non-credit-certificates`) for `<catalog>/program/<slug>` links. Guard it, then capture-only each.
4. **Sam's Annual Goals asks (lane NEEDS SAM):** keep or drop 4.7's Activity 1 link; live adds and removals (draw rows
   changed since the build, queue a rebuild on save); removing an official sub-activity against his 2026-07-02 ruling.
   Read the decision sheet's replies before acting; if he answered in chat, record it in `cpl_memory`.

## Docs to read

`docs/reference/lanes/program-requirements-harvest.md` (Phase 2) · `docs/program_requirements_harvest_lessons.md`
(S382) · `docs/reference/lanes/workplan-annual-goals.md` · `cpl_memory` tags `program-requirements-harvest`,
`annual-goals`.

## Patterns that worked

- **Read the capture's near misses before the next fix**, then a one-page read: two runs found both gaps.
- **A dispatch with `step=load` / `step=display`** under the standing go, receipts committed by the job.

## EMERGENCY checkpoint (Rule 9a, ~50k tokens left)

Refreshed: this handoff, both lane files (harvest, Annual Goals), both lessons docs, INDEX history, the §11 row,
`kb/queue_status.json`, five `cpl_memory` rows, docs audit. **Not refreshed:** the CPLBrain session note (11), the
UI pass (9), the pipeline view (7, the M-ID pipeline did not move), KB notes (5, none), kb/README and README (2, 3).
**Decision sheet 75 is not published:** its three Annual Goals cards are in the vault builder (CPLBrain fe3a0c3,
SHEET_ID 2026-10-13-open-asks-75), but the build writes to sheet 68's file name; fix the output name, build, publish
with `capabilities: {db: {}}`, and hand Sam the link. `CLAUDE.md` is at 60,435 bytes against 60,000.

## Subscriptions and check-ins

S382 drops its subscriptions on #2074 and #2078 at sign-off and holds no check-in. Subscribe when you take them up.
