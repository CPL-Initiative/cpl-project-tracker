---
title: Session 362 handoff — Long Beach City's read, the two-call extraction, and RCCD's three Humanities programs
date: 2026-10-11
session: 361 (SkyBirch)
tags: [handoff, program-requirements, harvest, phase-2, long-beach-city, extraction, two-call-split, ui-pass]
status: current
---

# You are Session 362

Your moniker is **SkyAlder**. SkyBirch (S361, `session_01DC4o6CVGDEbXQneus7oCfk`) wrote this checkpoint at about 03:25Z on
2026-10-11 with ample context left and kept working; if it is still live (`list_sessions`), agree one writer before you touch
the queue below.

## First, in this order

0. **One writer.** `list_sessions`. S361 holds a check-in for Long Beach City (`trig_01QHag2Lna3oZorbb2EUvGXz`, 04:55Z) and
   watches tracker #1975 and #1978 and vault #297. If S361 has signed off, it named in its last message what it dropped.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `extraction`, `long-beach-city`. S361 rows:
   `sam-split-long-program-into-two-calls-2026-10-11`, `roep-rcc-39120-removed-by-sam-2026-10-11`,
   `sierra-and-extract-v5-deployed-rules-4-5-2026-10-11`, `roep-extract-push-runs-on-merged-main-2026-10-11`,
   `roep-two-call-split-built-2026-10-11`.
2. **No sheet is open.** Nothing waits on Sam.

## In flight

1. **Long Beach City's read** (run 38105864413 on `claude/s361-lbcc`, started 02:39Z; about 2 h of capture, then about $22
   of extraction). When it lands: read `summary.json` on the branch (found, extracted, passing, cost), dispatch
   `program-requirements-college.yml` with `step=load` from the same branch, then `step=display` (Sam's standing go for a
   display after a load), regenerate the dependency map if the applied-record commit stales it, open the PR, merge on
   `test`. Add Long Beach City to the builder's dated reads first if the display build asks for it.
2. **#1978, the two-call extraction (v6)**: merge on `test`. Then dispatch `cpl-chat-deploy.yml` on main (function
   `program-requirements-extract`, confirm `DEPLOY`); a body without `part` reads as v5, so the deploy is safe beside any
   read. Then re-read Riverside City, Moreno Valley and Norco, one at a time, with extraction, each from its own `claude/*`
   branch: the capture costs nothing, and only the Humanities, Philosophy & Arts program (failed) and any changed program
   go to the model. Read each run's summary for `parts: 2` on the Humanities record and its four checks; then load and
   display as above. Mt. San Antonio 24171 (an idle timeout) is retried the same way at its next read.
3. **#1975 (this checkpoint)** and **vault #297 (session notes S360 and S361)**: merge on `test` / `coverage`.

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
