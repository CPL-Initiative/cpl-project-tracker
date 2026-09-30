---
title: Session 307 handoff — sheet 6 is with Sam; the funding surfaces now follow the model
date: 2026-09-30
session: 306 (SkyRivet)
tags: [handoff, implementation-funding, my-college, refresh, unit-sources, decision-sheet]
status: current
---

# You are Session 307

Your moniker is **SkyGusset**. SkyRivet (S306) took Sam's three asks of 2026-09-30 and a fourth he
sent mid-run, and shipped them in one PR on `claude/scenario-2-funding-updates-4slauk`. Check the PR on
its current head before anything else.

## First, in this order

1. **Read sheet 6's replies** (`2026-09-30-open-asks-6`, https://claude.ai/artifact/KCuKxKytRRWqNvqrusvtmr,
   collection `replies`) **and sheet 5's** (https://claude.ai/artifact/4PhPMFSvUVJLxrV7PazTQr): sheet 6 carries
   sheet 5's five cards, and a reply on either counts. Both were empty at 15:17Z.
2. **Cards 2 to 4 (the Reporting box):** on his calls, build `cpl_funding_reports` as the S306 handoff
   described (INSERT-only, reviewer RLS through `is_allowed_reviewer()`, `has_function_privilege` before any
   revoke), then port `prototype/cplfund_reporting_box_v1.html` into the drill-in with a jsdom test.
3. **Card 6 (Scenario 2 reads as published):** the stored config names Scenario 2 as published (Sam's save,
   13:41Z). If he confirms the Chancellor finalized it, drop the hold in the funding lane and card 1's link can
   follow his approval of the narrated draft. If not, he republishes Scenario 1 himself.
4. **Card 7 (P1's wording):** Sam types any new wording on the tab. Never pin P1 back or combine `pa_u` with
   `ppa_u`: both are his rulings.
5. **Card 5:** rename in `college_briefing.js` as he rules, with a jsdom test.

## Sam's decisions this run

- **P1 (Access) measures `pa_u`**, every applied unit, in both scenarios (his save, 13:41Z; in chat: *"I made
  changes to Scenario 2 funding model P1 metric"*). 49 of 115 colleges reach the P1 target (0 under `ppa_u`).
- **Exam credit is a valid use of applied units.** On Chaffey: *"they are largely from Standardized exam
  exhibits and Credit by Exam, which is a valid and useful application."* (`cpl_memory`
  `sam-exam-cpl-applied-units-valid-2026-09-30`.)

## What shipped (S306)

- **Chaffey's 634.0 FTES is correct:** 19,020 applied units ÷ 30; the model reproduced his screenshot to the
  dollar. **Drill-in hovers** on the priority label (goal, measure, share, price), the Max cell (funding × share;
  target = proportional funding ÷ price) and the Curr cell (units ÷ units per FTES; fraction × Max).
- **Frozen header:** the college table scrolls in a 75vh wrap; print releases it.
- **Refresh everything** (Internal view): re-reads the saved model here and in every other window of the
  browser (BroadcastChannel `cpl-funding-model`; a save posts it too), then a dialog lists what it reached,
  what is built when opened, and what is not live (the videos, the frozen snapshot).
- **My College follows the model:** it adopts the module's config on every change (it had kept its own copy);
  the model clears its caches before it notifies.
- **My CPL Funding beside the table** on the explainer and the Public view (`fundingPanel`, one renderer).
- **Unit sources** (reviewer, Internal only): military vs non-military, the exhibits and the recommendations,
  from `map_college_cr_unit`.
- Sheet 6 published; five `cpl_memory` rows (`SkyRivetS306`); KB note
  [`methodology-a-sticky-header-sticks-only-inside-a-box-that-scrolls`](kb-notes/methodology-a-sticky-header-sticks-only-inside-a-box-that-scrolls.md).

## Read in order

1. This file. 2. [`implementation-funding`](reference/lanes/implementation-funding.md). 3. The S306 section of
[`cpl_funding_lessons`](cpl_funding_lessons.md). 4. [`decision_sheets`](reference/decision_sheets.md).

## Patterns that worked

- **Reproduce a questioned figure through the model first.** A minimal config with the scenario's dials
  reproduced every cell of Sam's screenshot; that made "the arithmetic is right" a finding.
- **Measure a table's grain and a proxy's agreement before building on them** (the military rule: 99.5%).
- **Check the UI in Chromium, not only jsdom:** the frozen header and the explainer's leaking `header` style
  showed only there (`/opt/pw-browsers/chromium`; remove `.cplfl-overlay` before clicking).

## Safety patterns

- ⚠️ A control inside a drill-in figure cell must be dropped by `readCells()` (the harness does it for
  `.cplfund-srclink`); a new one needs the same.
- ⚠️ Rules for nested tables in a drill-in must name their panel: `tr.cplfund-detail td` and
  `.cplfund-table th` reach every nested cell.
- ⚠️ The funding lane sits at ~19,970 of 20,000 bytes and the lessons doc at ~118,500 of 120,000: move
  settled text out before adding.
- ⚠️ `scripts/check_generated.sh` runs after the last edit, then the push.

## Carryover

- Still Sam's, in the tab: When and Where on the two reported cards; card 7 of sheet 3's two old lines;
  whether the Supabase tool setting changed for the organization or his account.
- `p1-stranded-funding-is-accepted` and `p1-origin-p2-counselor-the-split` (human-sourced) describe P1 before
  his change; left for him to supersede (Rule 8), flagged by `sam-p1-on-pa-u-2026-09-30`.
- Not refreshed: `kb/README.md`, `README.md` (no structure change); the Pipeline tab (the pipeline did not move).
