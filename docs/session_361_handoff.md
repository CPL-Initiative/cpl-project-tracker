---
title: Session 361 handoff — rules 4 and 5 deploy and sample, then Long Beach City; 39120's delete; Sierra's go
date: 2026-10-11
session: 360 (SkyLichen)
tags: [handoff, program-requirements, harvest, phase-2, long-beach-city, coci-status, record-shape-4, emergency-checkpoint]
status: current
---

# You are Session 361

Your moniker is **SkyBirch**. SkyLichen (S360, `session_01Ng2d2zq3umwTuX5vm1rzcr`) checkpointed at the context warning
(70K left). **This is an emergency-set checkpoint (Rule 9a):** refreshed are this handoff, the harvest lane and the
`cpl_memory` rows. **Not refreshed:** the lessons doc (no S360 section), the KB notes, `kb/queue_status.json`, the docs
index and catalog, today's docs audit, the vault session note, the UI pass ledger, §11. Write them first.

## First, in this order

0. **One writer.** `list_sessions`. S360 holds no check-in; it drops its PR watches at sign-off.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `coci-status`, `record-shape`, `long-beach-city`. S360 rows:
   `sam-sheet-61-rulings-lbcc-rules-remove-39120-2026-10-11`, `sam-catalog-addenda-correct-errors-late-courses-2026-10-11`,
   `roep-catalog-additions-retired-on-program-2026-10-11`, `roep-record-shape-4-recommended-careers-2026-10-11`,
   `roep-delete-via-mcp-times-out-2026-10-11`.
2. **No sheet is open.** Sheet 61 (https://claude.ai/artifact/F45i4HkCA1X9iZbqZriUeB) is answered (both his own call).

## In flight, in merge order

1. **#1972** (rules 1-3, display build `195fe0c35a2d`, applied and md5-verified): merge when `test` passes (a
   dependency-map rerun was pushed at 0ff8c87).
2. **`claude/s360-rules-4-5`** (b25c284, stacked on #1972's earlier head): after #1972 merges,
   `git rebase --onto origin/main 2a4844d`, open its PR, merge on `test`. Then: dispatch `cpl-chat-deploy.yml` on main,
   function `program-requirements-extract`, confirm `DEPLOY`; then `program-requirements-extract.yml` with only
   `cerritos_41982,ivc_10265,mtsac_42916,smc_43767,wlac_37050` (about $0.30; records print in the job log between
   `PILOT RECORDS JSON BEGIN/END`). Show Sam the five (recommended blocks, careers) before Long Beach City's read:
   `program-requirements-college.yml`, college Long Beach City College, extract 1 (capture about 2 h 15 m, about $22).
3. **`claude/s360-remove-39120`** (this handoff, the lane's Sheet 61 rulings, the 39120 receipt): open its PR, merge on
   `test`. **Then** re-run vault **CPLBrain#296**'s `coverage` (it fails while tracker main still carries the Sheet 61
   markers) and merge it.

## Waiting on Sam

- **39120's delete.** Two `apply_migration` tries timed out at 60 s, nothing applied (likely an unanswered confirm).
  He was asked to reply "retry" and approve, or paste the SQL (in the receipt). Read back: the row count must be 0.
  Then the lane line "goes with a receipt" becomes "removed", and the next display build covers every live row.
- **Sierra (`cpl-chat`) deploy.** Her `ruleOf` read any unknown rule as "all required"; the fix is on the rules branch.
  Deploy only on his "deploy Sierra", before any record with a recommended block is checked; then `cpl-chat-smoke.yml`.

## Sam's replies after the handoff (2026-10-11 ~02:15Z): "retry and deploy Sierra"

- **Deploy Sierra: his go is given.** The `cpl-chat` change (recommended reads "not required", careers line) is on
  `claude/s360-rules-4-5`; `cpl-chat-deploy.yml` deploys from main only. Merge #1972, then the rules branch, then
  dispatch `cpl-chat-deploy.yml` (function `cpl-chat`, confirm `DEPLOY`) and `cpl-chat-smoke.yml` (deploy playbook,
  pipeline_reference section 7c). Then deploy `program-requirements-extract` the same way and run the sample.
- **39120: the retry timed out a third time** with his approval given (no migration recorded, row still live, 1,226
  rows). The connector, not an unanswered prompt, is the cause. Hand Sam the paste (SQL and read-back in
  `kb/receipts/program_requirement_records_rcc_39120_removed_2026-10-11_s360.sql`), or try `execute_sql` with the same
  guarded statement and read back.
- **This was an EMERGENCY checkpoint (Rule 9a).** Not refreshed: the lessons doc, KB notes, `kb/queue_status.json`,
  the To-Do feed, the pipeline tab, kb/README, root README, the docs audit, the vault session note, the UI pass ledger,
  section 11.

## What shipped (S360)

#1970 (the review flow: the reading room opens the catalog by itself, a verdict brings the next record, no home-tab
flash via a head guard + `tabs.js`), #1971 (RCCD's recovered programs: Riverside City +7, display `f571b009992c`),
display `195fe0c35a2d` applied (#1972 pending merge), Sheet 61, `program_record_fp` leaves out careers.

## Safety patterns

- Pushing `kb/_program_requirements_extract.py` starts the pilot extraction on the live function: cancel or avoid.
- A display build's applied-record commit makes the dependency map stale: regenerate before CI.
- A vault sheet PR's `coverage` reads tracker main: merge the tracker lane change first.

## Sign-off line for Sam

Greetings, you are SkyBirch (Session 361), see SkyLichen's handoff — `docs/session_361_handoff.md` — let's keep rolling with our queue.
