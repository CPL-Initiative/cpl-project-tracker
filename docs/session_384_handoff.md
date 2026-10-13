---
title: "Session 384 handoff — the whole-harvest measure, the build queue, the eLumen hubs, and Sam's Sheet 76"
date: 2026-10-13
session: 383 (SkySpruce)
tags: [handoff, program-requirements, elumen, annual-goals, progress-view]
status: current
---

# You are Session 384

Your moniker is **SkyPoplar**. Session 383 (**SkySpruce**, `session_018mfJkXYCV7i1J3Ndr4VqT1`) ran with Sam present
and checkpointed at Rule 9a's warning line. `list_sessions` first and agree one writer.

## What shipped (S383)

- **Merged:** S382's checkpoint (#2081; one shard flaked in `cpl_funding_applied`, green on one re-run), Coastline
  (#2074), Cabrillo (#2078: dated reads add Cabrillo, 112 codes; build `dc7d157aff73` on all 2,840 rows, display run
  38456098516; procedure record v1, md5 442d35fb), Sheet 75 card 3 (#2082).
- **Sheet 75 answered** (Sam, 19:17-19:18Z: drop, both, reviewer; `cpl_memory` `sam-sheet-75-annual-goals-rulings-2026-10-13`).
  Card 3 (#2082): a reviewer gets **Table** beside Move on Annual Goals (the Activities tab's own dialog) and a
  **Tabled and archived** list with Restore; `setGoalsRowsHidden` now takes a `th[rowspan]` name cell.
- **Open, CI pending when S383 stopped:**
  - **#2083**, card 2: `workplan-rebuild` function plus page queue; an editor sees rows added or moved since the
    build. The lane's NEXT 5.
  - **#2084**, the **whole-harvest measure** (Sam: *"an overall measure ... how far we are through the whole harvest
    process"*, confirm left out). About 28% on 2026-10-13, stamped by `scripts/queue_status.py --harvest`.
  - **#2085**, the **eLumen hub reader** (Modesto `programs`/`bytype`, Palo Verde award categories). Capture-only
    reads of both were dispatched on its branch.
- **Vault:** [Open Asks Sheet 76](https://claude.ai/artifact/U2MasFDQYkzsqVFFUpCQr9) (current; CPLBrain #334).
  [Sheet 75](https://claude.ai/artifact/FHD8da5vuCN7M3XaL5g4a1) is answered.

## Decisions Sam made this run

1. Sheet 75: drop 4.7's Activity 1 link; show adds and removals at once AND queue the rebuild on save; a reviewer may
   table an official sub-activity, reversibly.
2. The whole-harvest measure, the confirm step left out; later *"an optional college confirm once the procedures look
   stable and dependable"* (`cpl_memory` `sam-whole-harvest-measure-and-optional-college-confirm-2026-10-13`).
3. COCI differences are for the colleges to correct, not his confirm (priority 4 below; his yes on the build pending).

## Priority, in order

1. **Merge #2083, #2084, #2085 on `test`** (each a sibling of main; merge main first if one turns dirty, regenerate
   the dependency map, never pick). After #2083: dispatch `cpl-chat-deploy.yml` (`confirm=DEPLOY`,
   `function=workplan-rebuild`) and read the function back.
2. **Read Modesto's and Palo Verde's captures** on `claude/s383-elumen-hubs` (`capture.json`: `menu_hubs`,
   `hub_programs`, found of with a course list). Good counts go to Sam for the extraction go; a miss means a one-page
   read before any fix (lessons S381).
3. **Sheet 76's replies** (read the store before acting): card 1 the `WORKPLAN_DISPATCH_TOKEN` key; card 2 whether
   the team phrase keeps Table / Archive on the Activities tab.
4. **COCI-difference flags (Sam, ~20:20Z, `sam-coci-mismatch-flags-for-colleges-2026-10-13`):** he sees the larger
   "Catalog and state file differ" boxes (owner college; 3,341 on 942 of 2,840 records) as the colleges' to correct,
   outside his confirm. S383 proposed: keep each course as printed with its quiet COCI chip; collapse college-owned
   COCI boxes to one line a record; a per-college COCI list (My College, the MAP-team queue); numbered boxes only for
   reading-procedure flags (214 check not met, 148 no printed total, 76 possible misread). Build on his yes.
5. **Sheet 75 card 1:** Sam runs the delete in `kb/receipts/workplan_2026-10-13_s383_drop_4_7_activity_1_link.sql`
   (the MCP guard refuses a delete). Read it back (one row gone) and note APPLIED in the receipt.

## Docs to read

`docs/reference/lanes/program-requirements-harvest.md` · `docs/reference/lanes/workplan-annual-goals.md` ·
`docs/program_requirements_harvest_lessons.md` (S383) · `docs/workplan_annual_goals_lessons.md` (S383).

## Patterns that worked

- **Verify a card's premise against the code before building its answer** (Sheet 75 card 3 said official rows
  were immune; since Session 95 they were not).
- **A bot-pushed head runs no CI:** merge main (a real change) on top, never an empty commit.
- **`check_generated.sh` in a `&&` chain behind `| tail` always passes**: read its last line before committing.

## Not refreshed this checkpoint

The UI pass (9) was skipped for lack of room for a fix PR; the ledger keeps the view due. The pipeline viz (7)
was skipped because the M-ID pipeline did not move. `CLAUDE.md` is 440 bytes over its 60,000 budget (pre-existing).

## Subscriptions and check-ins

S383 drops its subscriptions (#2083, #2084, #2085, CPLBrain #334) at sign-off and holds no check-in. Subscribe
when you take them up.
