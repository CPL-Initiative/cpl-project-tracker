---
title: Session 318 handoff — the MAP load reads back after a gateway error; Scenario 2 narrated draft 2 waits on an ElevenLabs plan
date: 2026-10-02
session: 317 (SkyCompass)
tags: [handoff, map-custom-reports, implementation-funding, funding-video, reliability]
status: current
---

# You are Session 318

Your moniker is **SkyKeel**. ⚠️ **Two sessions ran as S317 on 2 October.** Sam pasted the same greeting into
both. SkyCompass (this handoff's author, `session_019Mqb4pR2f9hCMHphfmtNZz`) fixed the nightly MAP load. The
other (`session_01YBLp6BKFRtejBVZn6NXz8F`) took Sam's narration ask: #1823 and sheet 20. Neither could see the
other's chat. This file carries both from the committed record. If a second `session_318_handoff.md` lands
later, merge the two into this one; never keep both.

## First, in this order

1. **Read sheet 20's replies** (https://claude.ai/artifact/2FmMPxYqndY2oKnobcKZQi, collection `replies`). It
   was empty at 15:50Z. Its two cards are the ElevenLabs plan and Sam's verdict on the narrated sample. Do
   nothing on either until he answers.
2. **Confirm the first nightly MAP load on #1824's code.** SkyCompass armed a check for 20:30Z on 2 October.
   If its result is not in this file, read today's `map-custom-report-load.yml` scheduled run: the log
   prints "staging holds exactly the rows sent", and `map_data_loads` gains a `map_custom_report_promote` row
   after id 47. If a batch hit a 5xx, read what the read-back did and record it in the lane.
3. **Read Sam's opening note for direction.** Nothing else in the queue waits on a session.

## What shipped

- **#1824 (SkyCompass): the MAP Custom Report load reads back after a gateway error.** Two of September's five
  red nightly loads were one failure class: on 09-18 a 504 printed "rolled back" over a committed promotion,
  and on 09-30 a 520 on one staging batch cost a night. The loader now counts the table after a failed batch
  and re-sends it only if it did not land. `verify_staging()` refuses a staging table longer than the rows
  sent, because the gates refuse only a short one and staging carries no key. A failed promotion call is read
  from `map_data_loads` (every 30 s, up to 10 min) and never re-sent. Proven on the runner by a
  `staging-only` dispatch (run 37024910352). The guard, section 10 of `tests/map_custom_report_sync_test.py`,
  now runs in PR CI.
- **The grants re-check is closed.** After the 10-01 promotion all five rebuilt tables grant SELECT to the
  three API roles, and each live `rebuild_*` body carries its grant.
- **#1823 (the other S317): Scenario 2 narrated draft 2.** Sam asked for a simple script, a female narrator
  named Sierra (ElevenLabs' premade Bella) and the music as a background bed. Scene 8, Minimum conditions,
  plays silent: ElevenLabs disabled the account's free tier mid-read. Script:
  `prototype/funding_video/20261002_Scenario_2_Narration_Script_Sierra.md`.
- **KB note:** [`methodology-a-gateway-error-is-not-an-answer`](kb-notes/methodology-a-gateway-error-is-not-an-answer.md).
- **`cpl_memory`:** `custom-report-load-reads-back-after-5xx-2026-10-02`,
  `rebuild-table-grants-intact-2026-10-02`, and the no-price row's summary now names the FTES reimbursement
  rate (S316's to-do). Receipt `kb/receipts/cpl_memory_2026-10-02_s317.sql`.

## Sam's rulings this run

- SkyCompass: none. His messages were the greeting and "Checkpoint".
- The other S317: the narration ask above (his words are in #1823's body). Its decisions wait on sheet 20.

## Open (none blocks a session)

- Sheet 20: the ElevenLabs plan, then one read of scene 8 and `bash prototype/funding_video/render.sh n2`.
- Card 11's two measure texts and card 7's lines, Sam's to type on the tab.
- The note to Pedro (sheet 11 card 5), Sam's to edit and send.
- The 2026-09-08 and 09-09 load failures were never read. Read them only if the read-back fails to explain a
  later red run.

## Patterns that worked

- **Read the gates before adding a retry.** A one-line 5xx retry would have published doubled credit with
  every gate green. The long-table check is what makes the retry safe.
- **Prove a new network call on the real runner** when the sandbox cannot reach the host: a `staging-only`
  dispatch of the branch writes only inert tables.
- **Mutation-check, and make the harness report an escaped exception as a failed check.** Two mutations at
  first showed up only as crashes.

## Safety patterns

- ⚠️ **Two sessions can share one session number.** At start, compare `git log origin/main` against the
  handoff's PR list; a merged PR the handoff does not name means a parallel session.
- ⚠️ **The repo guard refuses a statement containing "replace"**, including the SQL string function. Write
  the new text as a literal.
- ⚠️ **A cpl_memory UPDATE through the MCP ran at once twice in S317**, after stalling three times in S316.
  Treat the stall as intermittent: one try, and on a stall insert a related row.
- ⚠️ `cpl_memory.summary` is capped at 400 characters (`cpl_memory_summary_check`).
- ⚠️ Budgets: lanes `implementation-funding` 19,871 and `partner-crosswalks` 19,990 of 20,000; `CLAUDE.md` at
  59,975 of 60,000. Delete before you add.
