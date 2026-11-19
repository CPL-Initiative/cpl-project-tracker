---
title: "Session 684 handoff (from SkyNuthatch, S683)"
created: 2026-11-19
updated: 2026-11-19
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyVerdin (Session 684)

**DRAFT, written at the start of the run as its declaration.** SkyNuthatch (S683), the CPL Queue routine's 06:12Z
firing of 2026-11-19 (started 06:13Z), is working this queue. A firing that finds this pull request updated in the
last half hour ends in one line. The checkpoint replaces this text.

The run follows the COBIx brief on #3358 as updated 2026-11-19T02:34Z (the brief for the night of Wed Nov 18).
`list_sessions`, `get_trigger`, `get_session` and `set_session_tags` were not among this firing's tools: no tag and no
cost readout. The session is configured with Fable 5.2 as the conductor; the brief expected the routine's form to set
Opus 5.5 for tonight's side of the comparison, so tonight is a second Fable 5.2 night unless the form changes.

Start checks done at 06:13Z to 06:20Z: three repos present; no open PR updated since 02:56Z; `daily-dashboard.yml`
dispatched on `main` (no run created on 2026-11-19 UTC before it); the COBIx watcher restarted; no to-do marked done
since 2026-11-18; `course_outcomes` 30,321 rows.

## The college split (written before any worker started)

Two lanes, never on one college, one writer per college. A college is named here only while a run is in flight
there or about to start (`d-lane-names-only-colleges-in-flight-s681`).

**First, the conductor, under Sam's go of 2026-11-18 (7:08 AM PT, relayed by COBIx):** the two reviewed plans, #3497's
99-row named-gaps plan and #3508's 13-row A4 write after its findings 1 and 2. Neither lane starts a run at a college
those plans write until each has applied.

**Cheap-piles lane (one worker, `claude/cheap-piles-*`):** Mendocino College and City College of San Francisco first
(the two free previews and their gate), then the reread plan's colleges in its order
(`kb/program_requirements_reread_plan_s683.json`), leaving out every college the collection lane holds below. Rule D
at City College of San Francisco, Santa Rosa Junior College and College of the Desert. #3497's 54 named-gap records,
the 33 held-out records and A5's 31 wrong answers are reads of filed records, no run. The Spend line and the page
counts.

**Collection lane (Opus 5.5 workers):**

- Hand-fetched catalogs: West Los Angeles, Los Angeles Trade-Technical, Los Angeles Pierce, Los Angeles Mission, East
  Los Angeles, El Camino.
- The unblocker step and the census reader: Southwestern, North Orange Continuing Education, Cypress, Fullerton,
  Grossmont, Cuyamaca.
- Course outline index: Peralta's four (Alameda, Berkeley City, Laney, Merritt), Saddleback, Irvine Valley, Rio Hondo,
  Mt. San Antonio.
- Course outcomes: Chabot (#3492), then Crafton Hills and College of the Siskiyous.
- Lassen (the structured-fields step 1).

The reread plan's 83 records at collection-lane colleges wait until that lane releases the college. City College of
San Francisco's outline index (`ccsf.curricunet.com`, report 28) waits until the cheap-piles lane releases it.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*): two lanes, never on one college; about $750 a day for everything, $10k and $30k running totals for the
whole job; workers on Opus 5.5, high effort on any worker that writes shared data; reviews at most 9 agents; $40 per
college per run for program requirements and a separate $40 per college for SLOs, PLOs and course objectives. The
routine's form sets the conductor.
