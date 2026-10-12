---
title: Session 362 handoff — Long Beach City's read, the two-call extraction, and RCCD's three Humanities programs
date: 2026-10-11
session: 361 (SkyBirch)
tags: [handoff, program-requirements, harvest, phase-2, long-beach-city, extraction, two-call-split, ui-pass]
status: current
superseded: true
superseded_by: session_368_handoff.md
---

# You are Session 362

Your moniker is **SkyAlder**. SkyBirch (S361, `session_01DC4o6CVGDEbXQneus7oCfk`) refreshed this checkpoint at the context
warning (about 05:05Z, 2026-10-11) and signed off; it holds no check-in and no PR watch.

## First, in this order

0. **One writer.** `list_sessions`. S361 holds nothing; four workflow runs it started may still be running (above).
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `extraction`, `long-beach-city`. S361 rows:
   `sam-split-long-program-into-two-calls-2026-10-11`, `roep-rcc-39120-removed-by-sam-2026-10-11`,
   `sierra-and-extract-v5-deployed-rules-4-5-2026-10-11`, `roep-extract-push-runs-on-merged-main-2026-10-11`,
   `roep-two-call-split-built-2026-10-11`.
2. **No sheet is open.** Nothing waits on Sam.

## In flight (S361 signed off at the context warning, about 05:05Z)

1. **Long Beach City's read** (run 38105864413 on `claude/s361-lbcc`, started 02:39Z, still running at 05:00Z): when it
   files, read `summary.json` (found, extracted, passing; count `extracted_run` for the run's own cost), dispatch
   `program-requirements-college.yml` `step=load` from the same branch. Add Long Beach City to the builder's dated reads
   (`kb/program_requirements_pilot/map_cr_by_course.json`, `registry_read.json`) before its display.
2. **RCCD's Humanities, Philosophy & Arts, read in two calls (v6 deployed, run 38108425951):**
   - Riverside City 18111: read and loaded (runs 38108461470, 38111047238; branch `claude/s361-rcc-reread`).
   - Moreno Valley 30169: read (run 38111056537); its load was dispatched at 04:57Z on `claude/s361-mvc-reread`: confirm
     the receipt commit and the live row.
   - Norco 30109: read dispatched at 04:58Z on `claude/s361-norco-reread`; when it files, check the record (parts 2, its
     checks), then `step=load`.
3. **One display build** covering every load above (Sam's standing go): run `kb/_build_roep_display.py`, commit the build
   and its receipt to one branch, dispatch `step=display` from it, regenerate the dependency map after the applied-record
   commit, then open one PR carrying the three re-read branches' commits (merge them into it) and merge on `test`.
4. Refresh `kb/queue_status.json`: add 30169 and 30109 when loaded, and Long Beach City's rows.

Nothing is watched or scheduled: S361 dropped its PR subscriptions (all its PRs merged) and has no pending check-in.

## Sam's decisions this session

- 2026-10-11 ~02:15Z (to S360, carried out here): *"retry and deploy Sierra"*. Sierra deployed after #1974 merged.
- ~02:40Z: *"Supabase removed record:)"*. He ran the 39120 delete himself; read back 0 rows, 1,225 live.
- ~03:05Z: *"go with splitting the program into two calls"* (over streaming, which the gateway's 150 s idle limit caps).

## What shipped (S361)

#1972 (COCI status chips, units, unit differences), #1973 (S360's handoff), #1974 (rules 4 and 5: recommended blocks,
careers), Sierra and extraction v5 deployed and smoke-tested (run 38106291463 passed in full), the five-program sample
(run 38105588567), #1976 (the extraction workflow's push guard), #1977 (UI pass: Annual Workplan Goals AA in both themes;
the daily dashboard was dispatched to publish it), vault #296 (Sheet 61's builder cards), S360's missing lessons section
and vault note. KB note: `methodology-a-path-filter-compares-pushes-not-branches`.

## Safety patterns

- A guarded DELETE on a shared table cannot run from a session (`execute_sql` is refused by the repo's guard;
  `apply_migration` timed out three times): hand Sam the paste as one statement returning the count, then read back.
- A push that changes `kb/_program_requirements_extract.py` still starts the pilot extraction (the guard lets a real change
  through): cancel it unless the pilot is what you want to run. A merge from main no longer does (#1976).
- A display build's applied-record commit stales the dependency map: regenerate before CI.
- Three smoke failures in ten minutes after a deploy were a passing NOCE read outage; re-dispatch once before diagnosing.
- The college read commits to the branch that runs it: dispatch from a `claude/*` branch, never main.

## Not refreshed / skipped this checkpoint

kb/README and README (no structure or surface change), the Pipeline tab (the M-ID pipeline did not move), §11 (the lane's
state did not change: Phase 2 stays in progress until Long Beach City loads).

## Sign-off line for Sam

Greetings, you are SkyAlder (Session 362), see SkyBirch's handoff — `docs/session_362_handoff.md` — let's keep rolling with our queue.
