---
title: "Session 394 handoff: merge Cerritos's reconcile steps, read Cabrillo under extraction v9, the overnight sweep"
date: 2026-10-15
session: 393 (SkySycamore)
tags: [handoff, program-requirements, reconcile, extraction, scheduled-sessions, decision-sheet]
status: current
---

# You are Session 394

Your moniker is **SkyMadrone**. Session 393 (**SkySycamore**, `session_01NWcnS4gQRXwEKo4QnxQqqz`) wrote this at a context
checkpoint (about 105,000 tokens left; the meter warned). Run `list_sessions` first: S393 dropped every watch at sign-off. If the
CPL Queue routine started you, follow `docs/reference/scheduled_sessions.md`.

## What shipped (S393)

- **#2134:** the overnight schedule Sam chose and his standing go on extraction, **up to $40 a college with no card**
  (`sam-extraction-standing-go-40-per-college-2026-10-14`; `scheduled_sessions.md`). The routine still fires once a day until
  Sam sets the schedule in the Routines form: the platform refuses an agent's edit (`update_trigger`: created via http_api).
- **#2136, Sheet 82 carried out.** *overlap*: ten transfer degrees past their total add up (rescore, migrate 38652994360).
  *carry*: the re-read carries a confirm when the latest verdict is a confirm of the replaced record and the new record has the
  same `program_record_carry_basis`; Astronomy 06326 carried once (verdict 35, checked). Display build `b87c61607e71` applied.
- **#2138, extraction version 9 (deployed, run 38660944049).** Version 8 failed every call: the API allows at most 16
  union-typed schema parameters and v8 had 17 (`extraction-v8-schema-union-limit-2026-10-14`). v9 holds 12; a test counts them.
- **CPLBrain #350:** [Open Asks Sheet 83](https://claude.ai/artifact/X2yLySn9SR5jauQuTWQybN) (current; store empty at publish).

## Decisions Sam made this run

- Sheet 82: carry, overlap (`sam-sheet-82-rulings-2026-10-14`).
- *"set it and limit is $40 per college"*: the schedule (his to set in the form) and the standing extraction go.
- An idea for later, not built: a weekly routine per district to keep the data fresh
  (`sam-weekly-refresh-per-district-idea-2026-10-14`; S393 recommended a page fingerprint in the census instead).

## Priority, in order

1. **Cerritos is done (#2139 merged; display `45fdd29240cb` dispatched on `main` at sign-off).** Confirm the display run
   succeeded and committed its applied record. The live rows were replaced by re-read 38661017876 (89; 3 checked rows held:
   02201, 02203, 02213; one confirm carried, 02235, unchecked).
2. **Read Sheet 83's replies first** (`ArtifactData` list `replies` on the sheet). Card 1 is Sam's own action (the schedule);
   cards 2 and 3 are calls S393 proceeded on. A *narrow* or *flag* reply reverses them (the carry basis in
   `chatbox/supabase_program_requirement_records_college_reread.sql`; `degree_total_minimum` in the scorer).
3. **Read the Cabrillo re-extract under v9** (run on `claude/s393-cabrillo-v9`, `force=06350,06378`, about $0.25). If both
   records read with their Recommended Major Electives block, `step=reread` on that branch, then a display build. The older
   branch `claude/s393-cabrillo-v8` holds two failed records (record null): never merge or re-read from it.
4. **The catalog sweep** (Sam's aim tonight: every catalog, then curated audit sweeps). 96 credit colleges are not loaded.
   Extraction runs with no card up to $40 a college. Pick colleges the readers handle (CourseLeaf, curriQunet, eLumen, Acalog),
   capture, extract, load, display, one PR a college.
5. **Reconcile steps for the next colleges.** Cerritos's 56 left: 34 transfer degrees (read one AA-T page for its wording) and
   22 AA/AS. Then Long Beach City (127 Major only), Mt. San Antonio (117), San Diego Mesa (116): their CourseLeaf pages may print
   the same "Complete a minimum of 60 units" sentence.
6. **The UI pass:** `python3 scripts/ui_pass.py --next` names **GR Priorities** (S392 and S393 skipped it: no room).

## Docs to read

`docs/program_requirements_harvest_lessons.md` (S393 section), `docs/reference/lanes/program-requirements-harvest.md`,
`docs/reference/scheduled_sessions.md`, `kb/program_requirements_reconcile.json`.

## Patterns that worked

- Read the page, its catalog's site map, then the page the site map names: three runner reads (`college-page-read.yml`).
- Test SQL on the container's Postgres 16 before the migrate job (stubs for `auth.role()`, the roles and the tables; initdb as
  the postgres user under `/var/tmp`). jsonb text md5 reads `3` and `3.0` apart; compare jsonb values.
- Diff every reconciled college's pass/fail against `main` before posting (Cerritos: none moved from pass to fail).

## The parallel funding session (closed)

#2132, #2135 and #2137 merged. Sam sets 15% noncredit on a Scenario 3 copy himself; Scenario 2 stays published and blank.
`{2025-26 remaining}` names the remaining 2025-26 balance; the house text still types "$9.04 million" (Sam's to change).

## Subscriptions and check-ins

S393 drops every PR watch and the Sheet 83 artifact watch at sign-off, and holds no check-in. Watch Sheet 83. The CPL Queue routine fires next at 2026-10-15 05:12 UTC (hourly overnight once Sam sets it).
