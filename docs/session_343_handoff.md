---
title: Session 343 handoff — build the harvest's Progress view; Sierra finds NOCE
date: 2026-10-07
session: 342 (SkyBeacon)
tags: [handoff, program-requirements-harvest, roep, sierra, scheduled-sessions]
status: current
superseded: true
superseded_by: session_345_handoff.md
---

# You are Session 343

Your moniker is **SkyGantry**. SkyBeacon (S342, `session_01Hsa7rs6m5uPV8iqpPpWBWJ`) was a Sam-driven session. You are
probably the **CPL Queue routine's** run (`trig_01L8K64ZKYb5eALdT4HW6NAV`, daily 15:07Z): follow
`docs/reference/scheduled_sessions.md`, go with the recommendation, and put a *Proceeded* card on the sheet for any call
you make for Sam.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`). S342 let go of everything at sign-off (end of this file).
2. **The standing sheet:** Open Asks Sheet 48 ([FWGJ2uNEGB1RrhMPrFsaCJ](https://claude.ai/artifact/FWGJ2uNEGB1RrhMPrFsaCJ),
   current). Both cards are answered: card 1 *Keep it public* (applied by S341), card 2 the CPLLibrary addresses in his
   note (the Drive connector refused the share; it is his to do in Drive).
3. **Rule 8:** `cpl_memory` with tags `program-requirements-harvest`, `roep`, `sierra`. Read
   `sam-roep-progress-view-2026-10-07` (his words) and `display-8292780f6cd5-live-delta-2026-10-07`.
4. **The mock-up and any reactions:** artifact [6Pco7R1NVB5S45evjjfJsr](https://claude.ai/artifact/6Pco7R1NVB5S45evjjfJsr)
   (read it, and its comments with `ArtifactComments`); source `prototype/roep_progress_mockup.html`.

## Priority 1: the Progress view on the Program Requirements tab (Sam: "Yes start mock")

Sam, 2026-10-07: *"I want to pivot over to the Catalog ROEP work and the new COBI tab needed to monitor the work... a
workflow dashboard to monitor the progress like the attached."* Build it as the **first view** of `program_requirements.js`
(beside Catalogs, Records, Sequences, Procedures), from the mock-up: header, five milestones with *You are here*, the
eight parts, next step, needs your call, changed recently.

- **Read live, as the other four views do.** Registry: catalog address and year, `sequence_source`, `procedure`,
  `census_checked_at`. Records: `checked`, `display->'build'`, `display->'map'->>'status'`. Addenda: `status`. Active
  programs: `coci_college_programs?status=eq.Active` with `Prefer: count=exact`. A failed read says so, never zero.
- ⚠️ **Two reads anon cannot make (measured 2026-10-07).** Anon sees **checked** records only (policy
  `program_requirement_records_read: checked`), so it cannot count the two waiting on Sam; and
  `program_source_registry_history` has no anon grant, so *changed recently* cannot come from it. Choose one and say which
  in the PR: (a) a read-only counts function (`security definer`, counts only, no record text; route it through
  `kb/governance_surface_map.json` per Rule 10 a3, and close it with the revoke pattern in Rule 10 b2 except for anon's
  EXECUTE), or (b) a small status file the checkpoint writes (`kb/queue_status.json`: session, moniker, time, handoff,
  next routine run, unchecked count, the day's changes) that the tab fetches. (b) also gives the header its run line, which
  no browser read can; it is the recommendation. Add its write to `.claude/commands/checkpoint.md` in the same PR.
- **The milestones and parts are definitions, not code.** Keep them in one array at the top of the view so a session
  edits a milestone without touching the renderer. Current truth (12:40 PT): every catalog 118/118 (94 on 2026-27) ·
  the pilot 20 checked · maps 2 of 26 published read (*here*) · procedures 2 of 118 · every program 20,282 active.
- First Light tokens (both HTMLs' `:root` already carry them; inject view CSS from the JS), statuses as words, crimson
  only on the call, mobile single column under 560px. Extend `tests/program_requirements.test.js` (fixtures for each read,
  a failed read, the you-are-here step), then `npm run a11y` on the tab.

## Priority 2: Sierra's NOCE answer, two flaws (live answer read in A/B 37670895667)

1. She calls the Google IT Support program *"a direct lead-in to industry certs like CompTIA A+, Network+"*. The catalog
   names Google only. A rule line in the program block: name a certification only where a program or course title names it.
2. She reads the course list's duplicate *North Orange Continuing Education Credit* as a sibling *"about 1 mile away"*.
   The duplicate is the known naming quirk (`chatbox/build_program_courses.py` docstring; SDCCE has the same). Fold a
   "<college> Credit" row into its college in the offerings block, or label it the same college.
   Add both to smoke 7v as negatives.

## Priority 3: the harvest lane's NEXT

Procedure records for the five pilot colleges with none (Irvine Valley, San Diego Miramar, Mt. San Antonio, Riverside
City, West Los Angeles); the addenda reading agent after the 2026-10-11 census apply (79 listed at 52 colleges).

## What shipped (S342)

- **#1897** Sierra finds a college by its initials (aliases `noce`, `sdcce`, `sdce`), aliases match whole words (13 of
  7,504 logged questions had resolved wrong), ask-shape stop words; smoke 7v. Deployed 19:23Z; production smoke green.
- **#1896** (S341's card 8 and 9 work) merged after its A/B miss was shown to be wording. **#1898** display build
  8292780f6cd5 live on all 22 records as a 33 KB delta (`--verify-sql` 22/22), plus the mock-up source.
- **Vault #266** (sheet 48, S341 note) merged after its coverage re-run.

## Decisions Sam made this run

- The Progress view, run by his **CPL Queue** routine; *"Yes start mock"*. (`cpl_memory`, verified by Sam.)

## Waiting on Sam

- Read Irvine Valley Art A.A. 10265 and Santa Monica Barbering A.S. 43767 (Sierra quotes neither until he checks them).
- Share CPLLibrary in Drive with the addresses from sheet 48 card 2. Drop the Summit v2 MP4s into Drafts. Re-save the
  Library filer's three Google values.

## Patterns that worked

- **Read the turn's timings before the code.** `chat_interactions.timings` lists every read a turn made; one profile read
  meant the alias path, which found the COCI bug in a minute.
- **Measure an alias change over the whole log** before shipping it: 13 changed, all 13 were wrong, none right.
- **Diff the live build against the new one** before splitting a receipt: 185 KB became 33 KB, proven by `--verify-sql`.

## Safety patterns

- A preview A/B miss on a prose assertion is read in the log before it is called flake: check the question can reach
  the changed code at all. A `Search failed: TimeoutError` answer is the database, not the change.
- `program_source_registry_history` and unchecked records are closed to anon; never widen a policy to fill a view.

## What S342 let go of at sign-off

PR subscriptions: none left (#1897, #1898, vault #266 merged and auto-unsubscribed). Check-ins: both fired
(`trig_01GmrVBpYy4yyDcJhv9n7dMF`, `trig_01LM73DhE4yR7abH9BkR7GJm`). The artifact watch armed by publishing the mock-up.
