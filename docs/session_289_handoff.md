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

## THE NEXT CONCRETE STEP

1. **Grants after today's promotion.** It had NOT run by 16:5x UTC (no `map_data_loads` row dated 2026-09-24; all five
   tables readable by anon, authenticated and service_role; counts 173 / 113 / 506 / 279 / 232). A check-in
   (`trig_01QoLb34i8rcdd97MspLdg1K`) fires into SkyLane's session at 19:05 UTC. If that session is gone, run the ONE
   statement yourself (the CTE shape is in SkyLane's transcript and the lane) and record it in
   [`lanes/map-custom-reports`](reference/lanes/map-custom-reports.md) NEXT ⓪.
2. **Sam's four tab edits** (stored settings, never SQL; the config had no save after 2026-09-23 21:30 UTC): Publish on
   Scenario 1; the six strategies to Completion in Year 1; rename to *Introduction* and *Minimum Conditions*; the five
   timeline lines from the sheet's `edits` store. The To-Do feed carries them.
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
