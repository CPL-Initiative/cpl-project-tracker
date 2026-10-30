---
title: "Session 522 handoff: Sierra's program search fixed live, the smoke retries and reports, Sheet 142 answered"
date: 2026-10-30
session: 521 (SkyBearberry, Sam's session)
tags: [handoff, sierra, supabase, smoke, ci]
status: current
---

# You are Session 522

Your moniker is **SkyCrowberry**. Session 521 (SkyBearberry) ran with Sam on the evening of 2026-10-29 Pacific, the night before the 7th Annual CPL Summit (Friday 2026-10-30). This is a full checkpoint, written at the context WARN line (about 100,000 tokens left).

## What shipped

- **Sierra's program search is fast and writes no temp files (live).** `search_college_programs` copied every program into a MATERIALIZED CTE and grouped DF by a tsquery, which has no hash opclass. Both spilled past work_mem (2 MB): 79 MB temp a call, mean 2.0 s, max 7.8 s since 10-26, smoke 7c's timeout. Sam ruled *tonight* (Open Asks Sheet 142 card 1), then said "Push it" and "Push the fix".
  - **s521** (00:38Z, run 40980527319) read the table but kept the tsquery grouping: set 05 took 6.8 s. The after-read's temp check caught it.
  - **s521b** (01:03Z, run 40983125508) groups by ordinal: 149 ms warm (555 before), 733 ms on 30 terms (3,570), no temp, all 13 key sequences and row sets equal BEFORE.
  - Smoke `modes=7c,7p` green: the LVN question 0.22 s through anon.
  - Receipt: `kb/receipts/search_college_programs_no_copy_2026-10-30_s521.sql`. Rollback: `kb/migrations/2026-10-30_s521_search_college_programs_no_copy_rollback.sql`.
- **[Open Asks Sheet 142](https://claude.ai/artifact/VeK9VxyrH4EdXFUKZzhfY2)** answered at 00:21Z, all his own call: tonight, retry-report, later. Never republish onto 142. Sheet 143 (the address card alone) is built in the vault and not published; publish it with the next new card.
- **samueltlee/CPLBrain#545 merged** (Sheets 142 and 143 in the builder). **samueltlee/CPLBrain#546** (S521's session note) is open: squash-merge it on a green `coverage`.

## Open work, in order

1. **Land cpl-project-tracker#2570** (the fix's source, migrations, receipt, guard test, lane and lessons; this checkpoint rides it). `test` failed on shard 3 twice, and the failure is not this PR's (comment on the PR). S521 spent the one re-run at ~01:40Z. Green: squash-merge. Red again: the shard is real, so read its log for a `✗ FAILED` line, and fix `tests/run.js` first (next item).
2. **`tests/run.js` loses its own summary on a failing shard.** It prints the summary with `console.log` to a pipe, then `process.exit(1)` drops the buffer, so no file is named. Write the summary with `fs.writeSync(1, ...)`. A small PR of its own; likely culprit `sierra_prospective_credit.test.js` (a timeout-sensitive check).
3. **Land cpl-project-tracker#2571** (Sheet 142 card 2): `rpc_post` retries a read once, wording checks report as `::warning::` under `SMOKE_ANSWER_CHECKS=report` (set only in `cpl-chat-smoke.yml`), rule guards still fail. Guard `tests/smoke_retry_report.test.js` (28). After it merges, record card 2 as built in the Sierra lane (#2570 changes the same lines, so merge main in first).
4. **Apply `kb/receipts/cpl_memory_s521_2026-10-30.sql`** (four rows; INSERT-only, rollback in its header). The session's permission check treats a push to `kb/migrations/.apply` as a production deploy: ask Sam in chat, naming the push.
5. **Sam's Quick Adopt ask (NEXT, Sierra lane):** *"Would have been perfect if it gave the request quick adopt links for courses not yet approved"*. Links render only for an unadopted credential; a partly adopted one's unapproved courses get none. A Sierra deploy, so after the Summit unless he says sooner.
6. **Carryover:** Sierra's first text took 22 s on Sam's Bakersfield turn (16 s of prep, a 175,000-character prompt), worth a look after the Summit; `credential_alignment_for_college` (~2 s, CPU, no temp) is the next slow read; the college short-name editor and the public page's Contents (after the Summit); Glendale's course units (harvest NEXT); lints' checkout read 1 min 50 s on one run (watch one more).

## Sam's decisions this run

`sam-sheet-142-rulings-2026-10-30` and `sam-quick-adopt-partly-adopted-2026-10-30` (in the receipt, item 4; verified by him).

## Read first

`docs/cpl_assistant_lessons.md` (*S521*), `docs/reference/lanes/sierra-retrieval-corpus.md`, the receipt above.

## Lessons to honor

- **A plain-query stand-in must keep the function's GROUP BY.** S521's pre-apply timing grouped by ord alone and measured a shape the function did not have. Time the deployed text, and keep the after-read's temp check.
- **The repo's Supabase guard refuses `create`, even into `pg_temp`.** Test a candidate as a plain query with its parse `as materialized`.
- **A push changing `.apply` needs Sam's words in chat.** A sheet ruling alone did not clear the permission check.
- **An md5 of a row set at a limit is not stable across plans:** ties on rank, college and title trade the last place. Compare key sequences, then list the rows at the cut.

## Let go

Before signing off, S521 dropped its subscriptions to cpl-project-tracker#2570 and #2571 and samueltlee/CPLBrain#546, and stopped its watch on Sheet 142; the next session re-subscribes. No check-in is pending. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) next fires at 05:12Z.
