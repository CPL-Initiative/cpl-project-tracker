---
title: "Governance & team enablement — lane state"
created: 2026-08-28
updated: 2026-08-30
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Governance & team enablement

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Decision rights (who decides what), acceptance standards per input, and which cadences actually run — plus onboarding as the team grows past Sam.

## Status

✅ **LIVE — team-gated ⚖️ Governance tab: 23 decision rights · 8 acceptance standards · 7 cadences · 8 open questions** (SkyMail #997/#998; Sierra added SkyMiner #1031/#1034/#1036; expanded 12→18 SkyGate). **Every `owner` is deliberately unset — filling them IS the review (OQ-01).** The register **measures itself**: the contact-refresh cadence was decided in June and has never run (0 rows in `map_college_nudges`), and CA-06 measured Sierra feedback at *21 of 25 untriaged* until **Sam cleared the whole queue 2026-08-26 — 0 still to do, 51 of 51 handled**. Owners live in a separate gated `governance_owners` table overlaying by row id, so regenerating the JSON can never wipe an assignment; no delete policy (so `Clear owner` is a no-op on the 3 cadences carrying a register-file owner — the likeliest thing to be mistaken for a regression; 7 more reported defects unfixed). **DR-11** records what Sierra tells the public — honestly noting the decider has been Sam personally. **DR-13…DR-18** (SkyGate) cover the six surfaces nobody had recorded: **the workplan itself** (the most public artifact the project has, four tables editable in-page, no named owner), phrase rotation, contracts, CPL News, the Common CR Reference, TMC submissions. **Drift detector live + wired to the cron** (step 4a0): **proposes, never auto-adds**, and since 2026-08-30 (#1397, Sam's go) its table/tab scans **project from `kb/dependency_map.json`** instead of a local regex — the old scan could not see trailing-slash REST, verb-first helper wrappers, URL consts fetched far from their definition, served pages, or write-shaped RPCs, and **eight human-write surfaces were invisible to the whole governance layer at once**. **The 15 tables are RULED (Sam, 2026-08-30 — the Fifteen Tables judgment sheet, `docs/visuals/2026-08-30-governance-fifteen-tables.html`):** DR-19 `cpl_memory` (with Sam's edit-rules clarification — sessions propose, humans decide, everything logged; the row doubles as the spec for the S211 cross-store checker) · DR-20 `item_raci`/`item_updates`/`team_members` · DR-21 `factsheet_overrides` · DR-22 `gr_areas`/`gr_revisions`/`gr_artifacts` · DR-23 `cpl_adoption_interest` · CA-07 `map_data_quality` triage · folds: `liftoff_state`→DR-13, `cpl_funding_config`/`_notes`/`_participation`→DR-09 · `cpl_reflections` dismissed with the reason in the surface map. Queue now **11**: 9 cadences + 2 tabs (`chatbot`, `college-briefing` — write-shaped RPCs, still to judge). Readability guard tightened back to <25 in `tests/governance.test.js`. A tab whose only writes are tables is no longer proposed (each table is its own row); a tab earns a row only for RPC writes a table row cannot represent. `governance.test.js` **91/91**. **Promote-from-candidate NOT built** (needs judgment fields typed by a human). **Agents: recommended NOT yet** — an agent must be invoked, so it fails exactly when a new user forgets; standing instructions can't be. **Routing is standing doctrine since 2026-08-30** (#1402, remediation D): CLAUDE.md Rule 10 (a3) now requires every NEW write surface through this register + the privacy ADRs before it ships — the detector proposes, the rule obliges. **Next:** ① judge the 2 remaining tab candidates (`chatbot`, `college-briefing` — RPC writes a table row cannot represent); ② fill the owner column — DR-13 first, and the six new rows (DR-19..DR-23, CA-07) all ship owner-unset, CA-07 also needing a frequency; ③ run that cadence once end-to-end with a named owner; ④ decide CIP's promotion criteria BEFORE the fall-2026 cutover (OQ-03); ⑤ cut the load-bearing list — 8 of 10 is too many. Team guide: `docs/working_with_claude_code.md`.
