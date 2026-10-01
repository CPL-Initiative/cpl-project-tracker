---
title: Session 305 handoff — the register is statewide, card 9 landed, card 7's Scenario 2 write is the loose end
date: 2026-09-30
session: 304 (SkyHinge)
tags: [handoff, my-college, partner-crosswalks, implementation-funding, cr-reference, eths-remint, side-menu]
status: current
superseded: true
superseded_by: session_311_handoff.md
---

# You are Session 305

Your moniker is **SkyLatch**. SkyHinge (S304) took the queue from
[`session_304_handoff.md`](session_304_handoff.md) plus three asks from Sam, and checkpointed at the
context meter's warning line (106,778 tokens left). Check every PR below on its current head.

## First, in this order

1. **Card 7's Scenario 2 config write.** #1771 merged at 03:47Z; the dry run of
   `funding-config-edit-apply.yml` (`plan_dir=kb/funding_config_edits_out/2026-09-30`, run
   36665994938) was running at the checkpoint, and a check-in at 03:52Z was set to dispatch the
   commit. Read the receipt in that plan directory: if `applied_*.json` says `written`, read the
   Scenario 2 config back (`prioRemoved` [1,3], `reportedCards` [C,D], titles Career Attainment and
   Innovation Projects, `reportedAsReports` true). If there is no receipt, run dry-run then commit.
   If a path moved, a curator changed it: stop and tell Sam which one.
2. **Card 3's rename on the corpus.** After the next `daily-dashboard.yml` run, the CR Reference
   worklist should carry `_stats.groups_named_noncredit`; `tests/cr_reference.test.js` A30 then holds
   that no group name opens at 0.
3. **Card 8: the Scenario 2 narrated draft**, from draft 4's script (`prototype/funding_video/`).
   **Card 2: the Reporting box, spending first**, a new write surface, so Governance
   (`kb/governance_surface_map.json`, DR-09) and the privacy ADRs come before any build.

## Sam's decisions this run

- *"check why the My College tab will not open San Diego City College isn't populating"* and
  *"clean up the Cobi side menu so it doesn't wrap and isn't bold font. I want it to look clean and
  sleek"* (2026-09-30). Both built.
- *"go ahead with the card 7 mockup"* (2026-09-30), approving artifact `RRTSSiTW1k6jk6gvxUAQ1D`.
- Sheet 4's replies read from its store: card 3 `noncredit`, card 9 `athl` (no notes).

## What shipped (S304)

- **#1767** side menu: one item per line, regular weight, `--rail-w` 280px.
- **#1768** 0 hours reads as noncredit (code-only; the cron renames the ten).
- **#1769** the occupation register in all nine regions (117 colleges), one root-level file per
  region, keyed by `map_colleges.name`. Cañada, CCSF and Marin had been blank since #1591.
- **#1770** card 9: `KINE M12OI`–`M12OL` → `ATHL M11FQ`–`M11FT`; `supabase-rekey.yml` run
  36661504929 succeeded, read back 0 rows on the eight ids; dashboard dispatched.
- **#1771** card 7: `reportedAsReports`, the report-shaped card, and the applier's declared create.
- Card 1 confirmed: `map_coordinator_summary()` reads 49 coordinators, 43 with all three parts.

## Read in order

1. This file. 2. [`implementation-funding`](reference/lanes/implementation-funding.md) and
[`partner-crosswalks`](reference/lanes/partner-crosswalks.md). 3. The S304 sections of
[`cpl_funding_lessons`](cpl_funding_lessons.md) and
[`regional_cpl_opportunity_lessons`](regional_cpl_opportunity_lessons.md).

## Patterns that worked

- **Read the live scenario before designing the fix**: card 7's real shape was a measured 0%-share
  Career Attainment card beside a reported one; the fix removed a card.
- **Key an artifact by the reader's names**, and fail the build on a name that will not map.
- **One branch, serialized PRs**: merge, reset the designated branch to main, push the next.

## Safety patterns

- ⚠️ `scripts/stamp_asset_versions.py` versions **root-level** `.js` only; a data file in a folder is
  served stale.
- ⚠️ The config applier creates a key only on `"create": true` with a null `before`.
- ⚠️ A re-mint that moves a reused slot can break a test's assumption that the slot is final:
  `tests/eths_remint_test.py` now reads a slot's course where its stamp names it today.
- ⚠️ `pgrep -f`/`pkill -f` match your own shell's command line; a pattern that appears in the
  command kills the command.
- ⚠️ The full `npm test` takes ~40 minutes locally; run the changed suites and let CI's four shards
  run the rest.

## Carryover

- Still Sam's: the "units waiting" label (two figures, one name, on My College); When and Where on the
  two reported cards; card 7 of sheet 3's two old lines; the Chancellor's word on Scenario 2.
- Not refreshed: `kb/README.md`, `README.md` (no structure change). KB note: one section added to
  `methodology-a-display-name-is-not-a-key`.
