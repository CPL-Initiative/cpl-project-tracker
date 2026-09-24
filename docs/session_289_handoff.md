---
title: Session 289 handoff — CI cut to seven minutes, the lane tables landed, the review sheet's edit layer documented
date: 2026-09-24
session: 287 (SkyLane, beside SkyMatrix)
tags: [handoff, implementation-funding, ci, test-infra, decision-sheets]
status: current
---

# You are Session 289

Your moniker is **SkyRelay**. Two sessions ran as S287 on 2026-09-24: **SkyMatrix** (the EACR tweaks, #1681, its handoff
is [`session_288_handoff.md`](session_288_handoff.md)) and **SkyLane** (this one: the funding lane, and the CI suite).
This file is the highest-numbered and carries every pointer; read 288 for the EACR carryover.

## ✅ WHAT SHIPPED (main)

- **#1682 — the jsdom suite runs as four shards on four runners.** Sam: *"would it make sense to chunk our npm tests for
  git--they're taking 20 mins + each now."* Measured before: the `npm test` step read 18 min; timed file by file,
  `cpl_funding_*` is 56 files and **87%** of the suite's 3,592 s of serial work, and `tests/run.js` was already at one
  machine's memory ceiling (4 wide). `tests/run.js --shard i/N` (`tests/lib/shard.js`); `js-tests.yml` runs `gate` →
  `suite` (matrix of 4) beside `lints` → **`test`**, the fan-in that keeps the name the merge doctrine polls. First run:
  `test` reported **7 min 16 s** after the push. Note:
  [`methodology-a-memory-bound-suite-scales-across-machines-not-workers`](kb-notes/methodology-a-memory-bound-suite-scales-across-machines-not-workers.md).
- **#1679 — one drill-in table per lane, and the one-line card head.** Sam's six columns (Outcomes · Max FTES · Max Funds ·
  Actual FTES · Actual Funds · Difference), credit then noncredit, and *Priority N · (A) Access* with the pickers inline.
  Seven suites rewritten to the new surface; full `npm test` green; a11y unchanged (the pre-existing four targets and the
  390px line). The lane file states the current truth.
- **#1685 — the scenario selector keeps focus across a redraw, and Sam's wording.** Sam: *"The scenario selector freezes
  after first use."* Reproduced in Chromium on the live config: `render()` rebuilt the mount, focus fell to `BODY`, the
  second change went nowhere; a mouse click refocused, hence "intermittent". `render()` now notes the focused control's
  id and `wire()` restores it. House titles *Introduction* / *Minimum Conditions*; `DEFAULT_TIMING` names the
  *Confirmation Deadline* and drops " in MAP". Guard `tests/cpl_funding_selector_focus.test.js` (16 checks).
- **#1686 — the 2026-09-24 MAP load was refused, and the grants were sound.** The scheduled promotion (18:01 UTC) hit
  `map_student_credit_key_range_ck` (`student_key` 1..50,000, created with the table on 2026-08-10, in no repo file) at
  50,027 students; widened live to 250,000 by migration (receipt
  `kb/receipts/map_student_credit_key_range_2026-09-24_s287.sql`, runbook G5 note); the re-dispatched run promoted at
  19:21 UTC. Two more memory rows: the key-range fact, and *an interrupted tool call is not a decline* (below).
- **Memory:** the four rows S286 staged are written and logged (partners outside the model; the six columns; the house
  table format; edits in place), plus two checkpoint rows (the sharding fact; parallel sessions take the next free handoff
  number). Receipt `kb/receipts/cpl_memory_2026-09-24_s287_skylane.sql` (SkyMatrix took the unsuffixed name).
- **Docs:** `docs/reference/decision_sheets.md` gained the review sheet's edit layer (the `edits` collection,
  `{ref, before, after}`); the funding lane and lessons doc; the two doctrine lines that budget the merge wait now read
  ~2.5 min docs-only, ~7 code.

## ⛔ READ FIRST

- **`test` is a fan-in.** Never put an `if:` on it (a skipped required check never reports); the gate's `if:` sits on the
  shard jobs. The shard count is the matrix list in `js-tests.yml` and nowhere else. A shard cannot `--update-floor`;
  re-baseline unsharded. `tests/js_suite_gate_test.py` pins the shape.
- **Two sessions, one number:** a parallel session writes its handoff under the next FREE number and names its sibling.
  The shared files are `tests/check_floor.json` (merge by key: the branch's own changes over main's file, never
  "higher wins" — SkyMatrix had deliberately lowered `eacr_scope` to 44) and `kb/dependency_map.json` (regenerate).
- **The funding lane is at its 20,000-byte budget.** Condense before adding. `CLAUDE.md` is 1.03× its budget
  (pre-existing).
- **An interrupted tool call is not a decline (Sam, 2026-09-24: *"Never declined anything...I've seen this assertion
  before"*).** A message that lands while a call waits on approval closes it, and the tool result reads *"The user
  doesn't want to proceed with this tool use"*. That text is the interruption. Handle the message, re-issue the call,
  and never report that Sam declined. Memory row `an-interrupted-tool-call-is-not-a-decline`.

## THE NEXT CONCRETE STEP

1. **Grants re-check: done.** 19:06 UTC: all five tables readable by anon, authenticated and service_role; after the
   19:21 promotion the counts read 173 / 113 / 506 / 280 / 232. The check-in fired and is gone. If tomorrow's 13:40 UTC
   load fails, read its job log first: a 23514 with no G number is the key-range bound
   ([`lanes/map-custom-reports`](reference/lanes/map-custom-reports.md) NEXT ⓪; runbook G5 note).
2. **Sam's config write is a PASTE, and it sits with him.** The guard refuses a session's UPDATE, so
   `kb/receipts/cpl_funding_config_titles_timing_2026-09-24_s287.sql` went to Sam for the Supabase SQL editor (guarded
   on `updated_at` 2026-09-23 21:30 UTC; `rows_updated` 0 means the config moved: re-read and re-issue). As of 19:35 UTC
   the config was unchanged (his earlier titles still stored, `published` null). Still his in the tab: Publish on
   Scenario 1 (optional; an unset marker falls back to it) and the six strategies to Completion in Year 1. The To-Do
   feed carries them.
3. **The review sheet** (https://claude.ai/artifact/Ayp39ynE6Yw9cvsvQbH7eu): items 8 to 10 carry no verdict; the comment
   thread got the #1679 result. `scripts/tab_review_sheet/build_sheet.py` still points at S286's scratchpad.
4. **EACR (SkyMatrix, 288):** dispatch `daily-dashboard.yml` after #1681 if it has not run; Sam looks at the grid; the
   ASCCC roster when Pedro's export lands.
5. **Carryover, unchanged:** the ESL merging decision sheet; the (D) card's Designate retry; the funding tab's
   pre-existing a11y findings; `applyPriorityOrder()` (lane ⓪c); Pedro's one request (lane ⓪d); CO research's first
   career-attainment file.

## ⚠️ Watch for

- SQL prompts: this session spent three `execute_sql` calls (one folded read, two writes). Keep to one statement per
  purpose.
- `cpl_funding_*` is 87% of the suite: the next twenty funding files cost more than the next two hundred elsewhere, and a
  slower boot in `tests/lib/cpl_funding_harness.js` moves every shard.
- The a11y run's four small targets and the 390px prose line on the funding tab are pre-existing, not #1679's.

---

*Greetings, you are Sky**Relay** (Session 289), see Sky**Lane**'s handoff —
`docs/session_289_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE line, no investigation.*
