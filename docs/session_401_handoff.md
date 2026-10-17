---
title: "Session 401 handoff: Sierra AI's format in My College, the program search's no-match path, wave 5 closed"
date: 2026-10-16
session: 400 (SkyBirch)
tags: [handoff, sierra, my-college, program-requirements, catalog-sweep, display-build]
status: current
superseded: true
superseded_by: session_402_handoff.md
---

# You are Session 401

Your moniker is **SkyManzanita**. Session 400 (**SkyBirch**, `session_01Sg9hmkzfaBqXR7m93275z9`) was opened by Sam by hand on
2026-10-16 with handoff 400. If the CPL Queue routine started you, follow `docs/reference/scheduled_sessions.md` first (it
fires hourly from 10:12 PM to 6:12 AM Pacific).

## What shipped (S400)

- **My College's Sierra is in Sierra AI's format** (#2171, Pages 20:39Z), Sam's ask of the session (below). One frame; her
  name and *Full screen* on a ruled bar; role row, starters, box; his 2026-08-21 Note verbatim under the box in both boxes;
  the description sentence dropped; the log draws no frame and no floor. Guard `tests/my_college_sierra_ai_format.test.js`;
  `npm run a11y` passes the six Sierra views. Lane: `sierra-page-redesign.md`.
- **The program search's no-match path** (#2173, applied by `supabase-migrate.yml` run 38967045972): the smoke's 7l
  negative control timed out (57014) because `search_college_programs`'s fuzzy fallback filtered with an OR a generic plan
  cannot index. One branch per scope now; the 7l call went from 2,742 ms to 204 ms; production smoke 38968410799 passed.
  Lane: `sierra-retrieval-corpus.md`.
- **Wave 5's second half** (#2170): Merritt 81, Berkeley City 66, Gavilan 101 loaded unchecked; build `9237d2cbf931`
  (8,772 programs) applied by run 38964970724.
- **Procedure records** (#2172 merged; #2174 open): Alameda, Feather River, Laney, Merritt, Berkeley City, Gavilan v1;
  Imperial Valley, Madera v2; Las Positas v3. All nine are applied live; #2174 carries the last three receipts.
- **Butte** loaded 19 of 168 (run 38965262431) and is parked for its reader.

## Decisions Sam made this run

- In chat, about 19:24Z: *"pick back up on the Sierra AI consolidation and make sure it's integrated in the My College tab,
  which still has the old format"* (`cpl_memory` `sam-my-college-sierra-ai-format-2026-10-16`, verified). Two calls were the
  session's own and wait on his reaction: dropping the description sentence, and moving the Note under the box.

## In flight at sign-off (check each first)

1. **#2174** (procedure receipts for Merritt, Berkeley City, Gavilan; Butte in the harvest lane). Merge on green `test`.
   Its records are already live; the PR is the receipt.

## Priority, in order

1. Sam's reaction to My College's Sierra (screenshots sent in S400).
2. **Butte's reader.** A page read of its navigation with `network: true` (the sandbox proxy refuses
   `butte.curriqunet.com`): the walk read 542 nodes and recognized 18 entries, since `cq_is_program` expects a
   "Name: award word" title. Fix the reader, reread, then Butte's dated reads (registry md5 69f90a0e; MAP names no course
   code there) ride the next build with its procedure record.
3. **Las Positas reread** (20 of 201: two ECONNRESETs mid-walk).
4. **The next wave:** the census's eLumen colleges (Antelope Valley, Columbia, Lake Tahoe, Marin, Redwoods, Siskiyous,
   Lemoore; Contra Costa and Los Medanos share Diablo Valley's district), then Copper Mountain and San Diego Continuing
   Education.
5. **Sierra follow-ups:** the materialized `tv` CTE in `search_college_programs` costs about 0.9 s a call (cut it if
   `timings` show it); render the Fact Sheet's baked statewide title lists from `fact-sheet/statewide_catalog.json`;
   retire the April vault note `map-exhibit-analysis.md`; curate the 22 "Other Statewide" exhibits.

## Patterns and safety

- `git add`, then `bash scripts/check_generated.sh` (with `CPL_VAULT_ROOT=/home/user/CPLBrain` from a worktree) before
  every push.
- The Supabase guard blocks `create`, `do` and `replace` through `execute_sql`, temporary functions included; a denial is a
  hold. `prepare` with `plan_cache_mode = force_generic_plan` times a generic plan.
- A bot-committed receipt (a migration or load) triggers no CI; push the PR's next real change to get `test` on the head.
- Read the registry's procedure md5s before writing records; a stale handoff item is common.
- Re-measure before reporting a regression: one cold read after a function replace read 2.80 s, then 354 ms.

## Not refreshed this checkpoint

The Pipeline tab (step 7): no phase moved. The UI pass (step 9): no room for a fix PR at the context left; the ledger keeps
its view due. No decision sheet: nothing waits on Sam.

## Subscriptions and check-ins

S400 watches #2174 and holds no check-in (its 21:39Z check-in, `trig_015gWPZRZrBfbxiMAj1ohcLX`, was deleted once its items
were done) and no artifact watch. It drops the #2174 subscription at sign-off.
