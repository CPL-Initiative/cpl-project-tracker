---
title: Session 286 handoff — the staged memory rows land, the briefing's funding box, and a budget on prompts
date: 2026-09-24
session: 285 (SkyGrant)
tags: [handoff, implementation-funding, cpl-memory, approval-prompts, supabase-grants]
status: current
---

# You are Session 286

Your moniker is **SkyTally**. S285 (SkyGrant) wrote the fifteen memory rows three sessions had staged, swept the college
briefing's funding box to the funding vocabulary, and took Sam's ruling that the SQL prompt swarm is not to be worked.
[#1674](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1674) merged (f7949e2);
[#1675](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1675) (the briefing sweep) merged (d02e8ae);
the checkpoint PR follows. The grants check-in fires at 14:10 UTC in S285's own
session, so read the lane before repeating it.

## ⛔ SAM'S RULING THIS RUN (2026-09-24) — READ FIRST

*"Don't try and solve the swarm problem—I wasted 2 days of fable use and not changes helped. Look at the handoff prompt
text for the solution that was supposed to solve it. Probably had a dozen or more approve requests this session so far."*

The opening line's `check_hooks_live.py --fix` IS the solution and it held: 33 rules, the `execute_sql` rule present,
and the LIVE line's own caveat that this one tool still asks once per call. Nothing else is silent-able from here. **Your
lever is arithmetic: budget the session's SQL in prompts before the first call.** One statement per purpose; fold reads
with CTEs or UNION; a memory write, its log and its verify go as three statements in ONE call (they see each other; only
a data-modifying CTE does not). S285 spent thirteen prompts where five would have done. Recorded in
[`approval_prompt_hooks`](reference/approval_prompt_hooks.md) and beside its pointer in `CLAUDE.md`.

## ✅ WHAT SHIPPED

- **The fifteen staged rows** (S281 4, S283 6 + 5) are in `cpl_memory`, logged (`creates = 1` on all), each re-read against
  2026-09-24 first: six changed and the receipt names them; the zero-share P4 fact went in already `superseded`; the
  session-sourced counselor row was superseded as S283 planned, with a before/after log entry. Receipt
  `kb/receipts/cpl_memory_2026-09-24_s285.sql`; the three staged files carry a header pointing at it. (#1674)
- **The briefing's funding box** says *count toward*, *qualifies for*, *demonstrated funding*, *the funding*; the base,
  off-roster and failed-load sentences are stated positively; *modeled*. Guard `tests/college_briefing_earn_retired.test.js`
  reads the source (earn, draw, unspent, the dollars, money, pool, advance, British spellings; identifiers and the
  student sentence exempt). Four floors added by hand from isolated runs (the guard 9; S284's delete_confirm 11,
  press_hold 11, save_over_newer 15), under `files`, where the ledger reads. (#1675)
- **Checkpoint prep:** the S215–S217 funding lessons sections moved to the archive (the live doc was at 116 KB of 120);
  the To-Do feed refreshed; the approval doc carries the ruling above and the connector-level lever as a note not to be
  pursued unless Sam asks.

## THE CONFIG, READ 2026-09-24 00:2x UTC

`updated_at` 2026-09-23 21:30:12; `projects.cpl-implementation.published` **unset**; Scenario 1 Year 1: Access `ppa_u`
0.33 · Completion `ptc_u` 0.34 (7 strategies) · Career attainment 0.33, factor 0.5 (**6 strategies, the carried ones**);
`prioRemoved [1]`. **Both of Sam's evening-sheet edits are still his**: press Publish on Scenario 1 again, and move the
six strategies to Completion in Year 1. Colleges see Scenario 1 by the fallback. Project 1.1.2's team field still reads
Santiago Canyon, Norco, Trade Partners (last edited 2026-07-22): his edit in Activities.

## THE NEXT CONCRETE STEP

1. **Grants verification** after the 2026-09-24 13:40 UTC promotion: S285's check-in at 14:10 UTC does it in one SQL
   statement (the `map_data_loads` promote row, `has_table_privilege` for anon/authenticated/service_role on the five
   rebuilt tables, today's row counts) and records the result in
   [`lanes/map-custom-reports`](reference/lanes/map-custom-reports.md) NEXT ⓪. If you start before that lane says so,
   run it yourself, once.
2. **Read the config once** to see whether Sam's two tab edits landed (the query shape is in the funding lessons doc,
   2026-09-24 section); say so in one line and do nothing in the tab. Curator edits are his, through the tab, never SQL.
3. **Carryover, unchanged:** the ESL merging decision sheet (Sam's ask, S282); ask Sam to retry Designate on the (D)
   card; the funding tab's pre-existing a11y findings (four small targets, one prose line at 390px); the college
   briefing's `applyPriorityOrder()` still repeats `priorityOrder()`'s rule (lane ⓪c); Pedro's one request (lane ⓪d).
4. **CO research's first career-attainment file** is the gate on Career attainment qualifying anything (share 0.33,
   factor 0.5 are set). Nothing to build until it arrives.

## ⚠️ Watch for

- **SQL prompts are Sam's pain point.** Every `execute_sql` call is one prompt on his phone. Count them before you start.
- The standing open-asks sheet still must not be republished as it stands (store keyed to 21 cards, builder 15).
- `CLAUDE.md` is 61.6 KB against 60 KB (pre-existing); `docs/cpl_funding_lessons_archive.md` is 305 KB against 150 KB
  after this run's move. Neither grows further without a pare-down.
- The funding lane sits at ~19.9 KB of 20 KB; condense before adding.
- `tests/check_floor.json` keeps its floors under `files`; a top-level entry is silently ignored.
- The hook runs the WORKING-TREE `scripts/supabase_sql_guard.py`; a session editing its own guard draws the classifier's
  `[Self-Modification]` refusal. Stop, restore, ask.

## Read in order

This file · [`lanes/implementation-funding`](reference/lanes/implementation-funding.md) ·
`docs/cpl_funding_lessons.md` § 2026-09-24 S285 · `docs/cobi_memory_tab_lessons.md` § 2026-09-24 ·
[`approval_prompt_hooks`](reference/approval_prompt_hooks.md) (Still open, first bullet) ·
[`decision_sheets`](reference/decision_sheets.md).

## Things that worked

- **Validating every memory row locally first** (length, one sentence, kind, status, `plain` present) and running the
  receipt through the repo's SQL guard before sending: the fifteen-row insert landed on its first send.
- **Two statements in one call**: the update and its log entry traveled together and both landed.
- **A sibling branch for the sweep** while the receipt PR ran its CI, so neither waited on the other.

## Safety patterns to honor

Rule 4 · Rule 5 · Rule 10 (fresh read, INSERT-only, receipt; the MCP guard blocks writes) · curator edits through the
tab, never SQL · house voice on outward prose · budget SQL in prompts · end the turn during a wait.

---

*Greetings, you are Sky**Tally** (Session 286), see Sky**Grant**'s handoff —
`docs/session_286_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE
line, no investigation.*
