---
title: "Session 477 handoff: the noncredit RPC gets a retry; Sheet 127 still waits"
date: 2026-10-25
session: 476 (SkyFiddleneck)
tags: [handoff, implementation-funding, noncredit, nc-1, supabase]
status: current
---

# You are Session 477

Your moniker is **SkyOwlsClover**. Session 476 (**SkyFiddleneck**) was started by the CPL Queue routine at 12:14Z on
2026-10-25. Its checkpoint was **light**: no lane's state changed and it wrote no re-mint or data receipt (one
`cpl_memory` row). It skipped the KB notes, `kb/README.md`, `README.md`, the Pipeline tab, the CLAUDE.md row, the lane
files (the funding lane sits at its 20 KB budget, so the note went to `docs/cpl_funding_lessons.md`) and the sheet
rebuild (Sheet 127 is unchanged and still current). Read, in order: this file, then `docs/session_475_handoff.md`
(its open work 0, 2, 3 and 5 still stand), then the item you act on.

## Who else is working

No `list_sessions` or `get_trigger` this run. The open tracker PRs (#2379, #2323, #2257) had not moved since 10-23;
CPLBrain's newest merge was S475's #475.

## What shipped

- **The noncredit RPC retries a cold call** (#2443). Today's first daily run (40189454249, 11:40Z) logged
  `cpl_funding_nc_counts failed (HTTP Error 500)`, so every nc key stayed absent (TBA). The Postgres log reads
  *canceling statement due to statement timeout*: PostgREST stops a call at the authenticator's 8 s, and the
  function's `statement_timeout=60s` does not extend it. Warm 1.1 s, cold 6.1 s. `call_nc_counts_rpc()` now tries up to
  three times on a 5xx; tests 8a to 8c. Lessons: `docs/cpl_funding_lessons.md`, *S476*.
- After the merge S476 dispatched `daily-dashboard.yml` to read the result; see *Open work* 1.

## Decisions Sam made this run

None. Sheet 127's store held no reply at 12:16Z.

## Open work, in order

0. **Read Sheet 127's replies** (https://claude.ai/artifact/VfX9JnaA5j3ESubzHKYc3A, `replies`), as handoff 475 item 0.
1. **Confirm the nc keys landed.** Grep the newest `daily-dashboard.yml` log for `cpl_funding_nc_counts` (a
   `retrying` line is fine; a final `failed` line is not) and `noncredit outcomes for`, then
   `cpl_funding_performance.js`: `colleges.Cabrillo.nc_exh` 34, `origination.in_scope.NOCE` present. If three attempts
   still fail, the fix is in the SQL (it should run well under 8 s), never a zeroed key.
2. **Sam sees it live** and **the UI pass** (the Fact Sheet, for the first scheduled session of 2026-10-26 UTC), as
   handoff 475 items 2 and 3.
3. **Waiting:** as handoff 475 item 5 and handoff 476 item 3.

## Lessons to honor

- **A function-level `statement_timeout` does not protect a PostgREST caller.** The 8 s authenticator timer starts with
  the outer statement. Retry a cold call, or make the SQL faster.
- **A mutation check can lie through a stale `.pyc`:** a one-byte `sed` inside the same second leaves the cache
  looking fresh. The test now sets `sys.dont_write_bytecode` before importing the builder.

## Let go

S476 holds no PR subscription after its PRs merge, no check-in and no artifact watch.
