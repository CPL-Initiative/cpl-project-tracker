---
title: "Session 478 handoff: the noncredit counts are live; a hand-opened session claims the queue with a draft PR"
date: 2026-10-25
session: 477 (SkyOwlsClover)
tags: [handoff, implementation-funding, noncredit, nc-1, scheduled-sessions, supabase]
status: current
superseded: true
superseded_by: session_481_handoff.md
---

# You are Session 478

Your moniker is **SkyTidyTips**. Session 477 (**SkyOwlsClover**) was opened by hand by Sam at 11:54Z on 2026-10-25
with a stale greeting (it named S471). It ran beside the 12:14Z scheduled firing, which also claimed S476 and shipped
the same fix. Its checkpoint was **light**: no lane's state changed and it wrote no re-mint or data receipt (four
`cpl_memory` rows). It skipped the KB notes, `kb/README.md`, `README.md`, the Pipeline tab, the CLAUDE.md row, the lane
files (the funding lane sits at its 20 KB budget) and the sheet rebuild (Sheet 127 is unchanged and still current).
Read, in order: this file, then `docs/session_475_handoff.md` (its open work 0, 2, 3 and 5 still stand), then the
item you act on.

## Who else is working

The 12:14Z firing (`cse_01TG7HifPSCFNJcG3LfGdh2y`) ran as S476, merged #2443 and wrote handoff 477; it finished at
12:25Z. The 13:13Z firing stood down in 66 s (it saw #2445). The routine's next firing is 2026-10-26 05:12Z.

## What shipped

- **The noncredit counts are live.** The 12:40Z daily run (40194164763) carried them: Cabrillo `nc_exh` 34, `nc_cdcp`
  166; statewide `nc_exh` 78, `nc_cdcp` 7,134, `nc_course` 0; `origination.in_scope.NOCE` present. Pages serves them.
  Handoff 477's open work 1 is done.
- **#2445:** the privacy screen in `tests/cpl_funding_performance.test.js` reads only the cells a row carries. The
  noncredit builder writes rows holding only `nc_*` keys for eight colleges with no MAP students (Cosumnes River,
  Folsom Lake, Imperial, LA Swest and four more), and the screen read their missing `p2`/`p3` as counts under the
  floor, so `suite (1)` failed on every PR off main. Every `perfFor()` reader treats a missing key as a missing row.
- **#2445:** `scheduled_sessions.md`: a session Sam opens by hand inside the routine's hours opens a draft PR in its
  first minutes. The S476 lesson and the `call_nc_counts_rpc` comment now name stalls, not a cold cache.
- **#2444 closed** as a duplicate of #2443.

## Decisions Sam made this run

- **Supabase without constant approvals** (about 12:20Z, his words): *"You have all the permissions in supabase to
  read, write, delete...hoping you can handle this without constant approvals"*. `cpl_memory`
  `sam-supabase-no-constant-approvals-2026-10-25` (verified). S477 read it as a go for reads, migrations and receipts;
  the hold list stands. The connector still asks the person to confirm an UPDATE: those prompts appear in the Claude
  app, and a "go" typed in chat does not answer them.

## Open work, in order

0. **Read Sheet 127's replies** (https://claude.ai/artifact/VfX9JnaA5j3ESubzHKYc3A, `replies`), as handoff 475 item 0.
   None at 13:20Z.
1. **The UI pass: the Fact Sheet**, as the first scheduled session of 2026-10-26 UTC (handoff 475 item 3).
2. **One memory UPDATE waits** on the connector's confirmation: the last statement of
   `kb/receipts/cpl_memory_2026-10-25_s477.sql` (S476's row still says "cold 6.1 s"). Guarded on that text, so it is
   safe to run; it needs a person to approve the prompt. Leave it if no one is there.
3. **Sam sees it live:** the noncredit outcomes on https://cpl-initiative.github.io/cpl-project-tracker/funding-model/
   (`?college=Cabrillo&view=one`), the two How to meet it passages and `memo_noncredit`.
4. **Waiting:** as handoff 475 item 5 and handoff 476 item 3.

## Lessons to honor

- **A firing cannot see a session with no PR.** A scheduled session has no `list_sessions`; it reads open PRs updated
  in the last half hour. A hand-opened session opens a draft PR before it diagnoses anything.
- **The database stalls 4 to 5 s at times.** One seq scan of 116,815 cached rows took 4,066 ms, the next 59 ms. Time a
  call more than once before you call a query slow, and read `Buffers` before you blame the cache.
- **The Supabase guard blocks `do` and `create` in `execute_sql`;** `apply_migration` is the path for DDL, and an
  UPDATE through `execute_sql` waits on the person's confirmation.

## Let go

S477 holds PR #2445 until it merges, then no PR subscription, no check-in and no artifact watch.
