---
title: Session 307 handoff — sheet 6 is answered; build the Reporting box
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

Sam answered **all seven cards of sheet 6** at 15:26Z (`replies/done` through 7; six his own call, card 3 as
proposed). Each ruling is in its lane, and the builder holds no card (no lane carries NEEDS SAM).

1. **Build the Reporting box** on cards 2 to 4: **one report a year**, **all eight** NOVA categories, and
   **each college sees its own figures on My College, to its signed-in staff**. `cpl_funding_reports`
   INSERT-only with reviewer RLS through `is_allowed_reviewer()` (copy `funding/supabase_cpl_funding_notes.sql`),
   `has_function_privilege` before any revoke (Rule 10 b2), then the box in the drill-in from
   `prototype/cplfund_reporting_box_v1.html` re-keyed to fiscal years, with a jsdom test. ⚠️ **Open design:**
   college staff have no sign-in today (the reviewer tier is CO staff); propose how a college's staff see their
   own figures on a decision sheet before building that half. The reviewer half can ship first.
2. **Card 1 (the Scenario 2 narrated draft):** no verdict; Sam: *"I want to rewrite it and then use the ElevenLabs
   connector to add a natural narration voiceover."* Wait for his script, then voice it with the ElevenLabs tools
   (`creative_generate_speech`; ask which voice or pick a clear one and say which) and rebuild `n2` per
   `prototype/funding_video/README.md`.
3. **Card 7:** Sam types Priority 1's new wording on the tab. Never pin P1 back or combine `pa_u` with `ppa_u`.
4. **Card 6:** Scenario 2 is final and stays published; the lane dropped the hold.
5. **A parallel session's Sierra sheet** (#1776, `docs/visuals/2026-09-30-sierra-credit-source.html`) asks Sam
   whether to hand the funding lane one question: Chaffey's applied units include 1,206 units of basic military
   credit at Needs Action. Measured S306: the credit report's applied column equals the articulated units on every
   row, whatever the plan status (74,697 statewide at Needs Action). Unit sources now shows the status split. If
   Sam hands it over, it is a question about what P1 counts: his call.

## Sam's decisions this run

- **P1 (Access) measures `pa_u`**, every applied unit, in both scenarios (his save, 13:41Z; in chat: *"I made
  changes to Scenario 2 funding model P1 metric"*). 49 of 115 colleges reach the P1 target (0 under `ppa_u`).
- **Sheet 6 (all seven):** yearly reports, all eight categories, each college sees its own; Scenario 2 final;
  reword P1; rename the two My College figures (built: *units not yet acted on*); card 1 his rewrite.
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
- **Unit sources** also splits by CPL plan status (the report's applied column is the articulated units).
- **My College's two figures** carry two names (card 5; `tests/my_college_units_labels.test.js`).
- Sheet 6 published and answered; six `cpl_memory` rows (`SkyRivetS306`); KB note
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
