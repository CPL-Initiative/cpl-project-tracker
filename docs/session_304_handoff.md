---
title: Session 304 handoff — sheet 4 is answered; the three-part check, 0 hours and Grossmont's four come first
date: 2026-09-29
session: 303 (SkyWarp)
tags: [handoff, decision-sheet, college-dashboard, implementation-funding, eths-remint]
status: current
superseded: true
superseded_by: session_305_handoff.md
---

# You are Session 304

Your moniker is **SkyHinge**. SkyWarp (S303) took the queue from
[`session_303_handoff.md`](session_303_handoff.md) and checkpointed at Sam's word (*"checkpoint when
ready"*, ~23:10Z). Check every PR below on its current head before you trust it.

## First, in this order

1. **#1765, sheet 4 card 1: the first condition reads all three parts** (coordinator, primary CPL
   contact, https landing page). Its database half is **already live**: migration
   `map_coordinator_summary_three_parts` added `has_primary_contact` and `has_landing_page` to
   `map_coordinator_summary()` (booleans only; 49 coordinators, 43 all three; anon and
   service_role keep EXECUTE). The tab half shipped with it. **Merged 23:30Z as `31ac7052`**; it
   carried the funding lane's notes for cards 1, 4, 5 and 6. Nothing left to do but confirm the
   tab reads the three parts on the live site.
2. **Card 3: a CR wording that states 0 hours reads as noncredit** (Sam overrode the proposal "no
   figure"). Ten wordings; three pull a range to 0 (*Oral Radiology (0–2 units)*, two *MCSE
   Certification Exam Prep* groups). `kb/_build_cr_reference.py` `unit_range_label()`; the sheet's
   predicate `p_crr_zero_hours` still measures them.
3. **Card 9: re-mint Grossmont's four KINE *Advanced Techniques and Strategies of …* titles
   (Baseball, Football, Softball, Water Polo) to ATHL**, under the playbook
   (`docs/coursecontrolnumber_remint.md`): dry run, alias map, apply, `supabase-rekey.yml`,
   read back, dashboard, in one cron window. Find their new KINE ids in
   `kb/eths_remint_out/2026-09-29/standalone+missed/alias_map.json`.
4. **Card 7: mock P3 and P4 shown as reported** (no FTES, target or funding line) and hand Sam
   the mockup before any port. **Card 8: start the Scenario 2 narrated draft** from draft 4's
   script. **Card 2: the Reporting box, spending first**: a new write surface, so Governance
   (`kb/governance_surface_map.json`, DR-09) before it is built.

## Sam's decisions this run

- Round 9 (verbatim): the Intro's Hide *"keeps opening up again after collapsing"*; *"The Vet/JST
  and % is not yet showing on the Minimum condition"*; *"The Current Funding on college rows should
  not be 0; it should show the calculated funding in gray with a hover over that it will be
  available once minimum conditions are met."* All built (#1761).
- *"Go ahead with the ETHS re-mint"*, *"go ahead with the setup-python bump"*, *"go ahead with
  decision sheet 4"*, *"go ahead with the config-edit workflow for 5 and 6"*.
- *"Per our rules, no need for instruction section on decision sheets; just the items."*
- Sheet 4 (22:26Z, nine of nine his own call): 1 all three · 2 spending · 3 noncredit · 4 approve ·
  5 P1/P2 · 6 carry · 7 mock · 8 start · 9 ATHL. `cpl_memory`
  `sam-open-asks-4-rulings-2026-09-29`.

## What shipped (S303)

- **#1761** round 9 (Hide holds, veteran counts masked under 10, gray computed funding).
- **#1755** the ETHS re-mint of the 43: 40 moved, 3 held; re-key run 36631294479 verified, read
  back 0/0/4/3; dashboard dispatched.
- **#854** setup-python 7 on all 30 uses; the COCI sync on v7 left 16,097 offerings rows whole.
- **#1762** sheet 4 and its rulings in the lanes (published PzVQ6KftWPtbk8afPXbZmf).
- **#1763** card 6's plan; written 22:53Z, receipt `applied_2026-09-29T22-53-45Z.json`. Card 5
  needed no write: `mirrorYears` already gives Year 2 Year 1's priorities.
- **#1764** card 4: the explainer links the narrated cut (Scenario 1 view only).

## Read in order

1. This file. 2. [`implementation-funding`](reference/lanes/implementation-funding.md) lane.
3. [`cpl_funding_lessons`](cpl_funding_lessons.md), the S303 section.
4. [`decision_sheets`](reference/decision_sheets.md), the "just the items" rule and the sheet 4 line.

## Patterns that worked

- **Read the replies store before acting on a Complete comment**, and apply the high-water mark
  (item 4 had no document but sat below the mark at 9).
- **Dry run, then commit, then read back** for every config write; the applier refuses a moved path.
- **Booleans for a public check** that reads a reviewer-only column.

## Safety patterns

- ⚠️ **Read what the model computes before you card a dial** (`_effective()`,
  `scripts/funding_effective.js`): card 5 asked about a block `mirrorYears` makes inert.
- ⚠️ **A PR whose head conflicts runs no `pull_request` CI.** If a head shows no check runs, fetch
  main and try the merge.
- ⚠️ **Hold a merge a cron run could overwrite** until the in-flight dashboard run finishes.
- ⚠️ **Card 7's plan (sheet 3) was replaced** by card 6's in `kb/funding_config_edits_out/2026-09-29/`;
  it lives in git history (#1757) if Sam asks a session to write card 7.
- ⚠️ Append to a lessons doc with mode `'a'`, never `open(p,'w').write(read(p)+more)`.

## Carryover

- Sierra's smoke check passed at 21:52Z, the first since 09-18, right after the COCI re-sync. Watch
  the next runs before closing the item (`cpl_memory` `cpl-chat-smoke-passed-after-coci-resync-2026-09-29`).
- The funding lane's trim landed with this checkpoint (#1766): 19,158 bytes; the redesign paragraph and the sheet 3 rulings moved verbatim to the funding lessons.
- Still Sam's: card 7's two lines in both scenarios (checked 23:25Z: old words); the Chancellor's
  word on Scenario 2 before it is published.
- Queue after sheet 4: card 11 (AUTB/AGAB), the Jev cards 8–10, the unit range's other surfaces.
- Not refreshed: `kb/README.md`, `README.md` (no structure change); KB notes (none crossed the bar).
