---
title: Session 358 handoff — curriQunet catalogs read as data; the next college on Open Asks Sheet 59
date: 2026-10-10
session: 357 (SkyCanopy)
tags: [handoff, program-requirements, harvest, phase-2, curriqunet, decision-sheet, checkpoint]
status: current
---

# You are Session 358

Your moniker is **SkyFern**. SkyCanopy (S357, `session_01CZkuAk1wqbLX6eFuiqA4qy`) put the next college to Sam, taught the
college read curriQunet catalogs, and scoped district catalogs. This handoff is refreshed at each checkpoint.

## First, in this order

0. **One writer.** `list_sessions` (`mine: true`). At sign-off S357 drops every PR subscription and check-in it holds.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `phase-2`, `curriqunet` (S357's rows:
   `roep-curriqunet-catalog-json-2026-10-10`, `roep-curriqunet-read-riverside-capture-2026-10-10`,
   `roep-code-net-missed-alphanumeric-numbers-2026-10-10`).
2. **Read Open Asks Sheet 59's replies** (https://claude.ai/artifact/5TquL7JV4vEQcGfsxx5V62, collection `replies`) before
   anything else. Sheet 58 (https://claude.ai/artifact/FQRfjZmPUz3BTprr3X9tid) is superseded; its store held no reply.
3. **Open PRs:** #1961 (the curriQunet read, this checkpoint) and CPLBrain#293 (sheet 59 and the S357 session note). Merge
   #1961 on a green `test`; then re-run CPLBrain#293's `coverage` once (it reads the tracker's `main`, so it fails until
   #1961 lands) and merge it on green.

## Priority: Sheet 59's two calls

- **Card 1, the next college.** Proposed: RCCD's three. On "RCCD's three now": dispatch `program-requirements-college.yml`
  for Riverside City with `extract=1` (about $13; the capture is already filed as
  `kb/program_requirements_college/riverside_city/capture_preview.json`, 228 of 262), then capture Moreno Valley and Norco
  with `extract=0`, and extract each whose capture finds a page for 85% of its programs. Load each (`step=load`), rebuild
  the display and dispatch `step=display` (Sam's standing go). On "Long Beach City first": one college page read finds its
  catalog's own address (the registry holds www.lbcc.edu/college-catalog), correct the registry, then read.
- **Card 2, the eight dropped rows** (Cerritos 19170, 19172; Mt. San Antonio 31598, 32892, 38942, 43373, 43777, 43999).
  On "Remove them": a guarded DELETE with a receipt holding each full row (Rule 10 a2). On "Mark them": the display build
  carries a note that the current reading does not carry the record.
- When a card is answered, record the ruling in the lane and drop its NEEDS SAM marker in the same PR.

## What shipped (S357)

- #1958: Open Asks Sheet 58, the lane markers, the lessons correction (five `page_claimed`, three `not_found`).
- #1959: `district_scope()`; a college on a shared CourseLeaf host reads only its own path.
- #1960: the college page read's `"network": true`; two RCCD probes found curriQunet's JSON calls (`_getNavigation`,
  `_getPage`).
- #1961 (open): `capture` reads curriQunet (`cq_catalog_id`, `cq_index`, `cq_page`); `CODE_TOKEN` reads COS 60A1; the
  Riverside City capture (run 38077405309); sheet 59's link and Library receipt; this checkpoint.
- CPLBrain#292 (sheet 58) merged; CPLBrain#293 (sheet 59, session note) open.
- The Library row for the open-asks series follows each sheet through `apply_migration` (worked first try twice).

## Not done at this checkpoint

- **UI pass skipped** (context pressure); `cobi:map-users` stays due, plus Team & RACI's deferred keyboard access and the
  Mission Control wiring entry from S356.
- The 34 Riverside City programs with no page (Liberal Arts emphasis, Baking and Pastry, Anesthesia Technology, two ADTs):
  read their catalog entries before Riverside City's extraction if time allows.
- The 681 unchecked records still wait on Sam's reading (the ten Mt. San Antonio ones on the Progress call).

## Patterns that worked

- **Read what a JavaScript page fetches** before scraping it: the college page read's `network` flag found curriQunet's
  data calls in two free runs ([KB note](kb-notes/methodology-a-javascript-catalog-is-data-read-what-it-fetches.md)).
- **Capture before you extract**: a dispatch with `extract=0` costs nothing and files `capture_preview.json`.
- **A card's premise guard caught its own staleness**: the builder refused sheet 58 once the code it described changed.

## Safety patterns

- An extraction spends model calls only on Sam's go per college; a capture needs none.
- `cq_json` keeps the census's rules: robots first, the delay before every call, the census user agent.
- Vault PRs whose sheet premise reads tracker files merge after the tracker PR that carries them.

## Sign-off line for Sam

Greetings, you are SkyFern (Session 358), see SkyCanopy's handoff — `docs/session_358_handoff.md` — let's keep rolling with our queue.
