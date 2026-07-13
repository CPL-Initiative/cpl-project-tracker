---
title: Session 114 handoff — into CCR wave 4
date: 2026-07-13
tags: [handoff, ccr, wave-4, discipline, auditor]
related: [docs/subject_discipline_cleanup_lessons.md, docs/ccr_convergence_lessons.md, docs/session_113_handoff.md]
---

# You are Session 114.

Sam (MAP@rccd.edu) runs the **CPL Initiative**. You continue the **CCR
convergence** work. Session 113 was **SkyTeleo** — a mis-mint/discipline-cleanup
detour Sam asked for *before* wave 4. That detour is done and merged; **wave 4
is your headline.**

Claim a moniker (the "Sky…" family is the current run — **SkyWave** fits wave 4,
but coin your own). Confirm the session number with Sam if his greeting names a
different one — the authoritative handoff is always the highest-numbered
`docs/session_<N>_handoff.md`.

## Read these first, in order
1. **This file.**
2. **`docs/subject_discipline_cleanup_lessons.md`** — the S113 workstream (the
   mis-mint detector + blank-discipline cleanup) in full.
3. **`docs/ccr_convergence_lessons.md`** — the CCR doctrine (v0.6, the
   student-repeat test = P-1) + wave 1–3 state. This is wave 4's rulebook.
4. **`docs/session_113_handoff.md`** — S112→S113; its carryover (the v0.6
   calibration re-seed) is still live.
5. **`CLAUDE.md`** — Rule 9 (Supabase live-curation safety) + Rule 4 + §11.

## What shipped in S113 (all merged)
- **#760** — fixed the Annual Goals association-editor **409 dup-key loop**
  (the "Contributes to which Activities?" popover): a `409`/`23505` on the
  association PK is now treated as success (a stale baked `data-assoc` snapshot
  was re-POSTing rows that already existed). Also centered the Annual Goals
  numbers/headers.
- **#761** — new **`subject_discipline_outlier`** auditor rule
  (`kb/_row_audit.py`): a minted row's assigned discipline is a small minority
  (≤15%, ≤3 rows) of its **local subject-code cohort** AND the TOP code OR the
  curated lexicon corroborates the **same** correction (two-signals-agree). It
  **covers singletons** — the class `top_discipline_disagreement` skips, which
  is exactly where Sam's `HVAC M10FR` (really Diesel) lived. **~302 live flags**,
  each with a `suggested_fix`. **41 discipline corrections fired** to
  `kb_curation` under `mismint-s113@bot` (Rule 9), receipt
  `kb/mismint_out/2026-07-13/`.
- **#762** — wired the tag into the Unified Courses **Triage** dropdown
  ("Subject-code outlier (likely mis-mint)"); + blanked the **Common SUBJ**
  column ("—") for rows with no discipline (the provisional-mint invariant).
- **#763** — blank-discipline **pre-seed**: 5 homonym-checked codes
  (`ARCE/ARTF/NCART→Art`, `PHTO→Photography`, `CSMTLGY→Cosmetology`) added to
  the **live minter lexicon** (`reference/subject_discipline_map.json` via
  `_seed_subject_discipline_map.py` GROUPS). ~77 blanks fill **at the next coci
  reseed**.

## Your priority workstream: CCR WAVE 4
- **Run it:** `kb/_ccr_trail.py 2000 40 <out> 2000 --stratum multi --wave 4`
  (multi-college ranks **2,001–4,000**). **Re-run the auditor first**; inject
  held decisions + pending merge-confirms.
- Wave 4 now has two new inputs from S113: the **`subject_discipline_outlier`
  chip** (302 flags — filter to it in Unified Courses) and the **shrinking
  blank-discipline set**.
- **Doctrine gate:** the **v0.6 calibration re-seed** should run first (from the
  S112/S113 carryover) — draw a fresh ~52-group sample
  (`kb/_doctrine_calibration_sample.py` + `unified_courses_suggestions.js` both
  present), re-adjudicate through Sam's **student-repeat test**, measure the
  ≥90% graduate gate. ≥90% → doctrine graduates, batch-apply unlocks.
- **Heads-up (from S112):** Fable's monthly spend cap was hit — a big fan-out
  may need Opus or a fresh cap window.

## Carryover (see `kb/cpl_todos.json` for the live list)
- **Blank-discipline follow-through (NEW, S113):** the ~77 pre-seeds apply only
  at the next **coci reseed** — the reseed/backfill is **not in any workflow**,
  and `_infer_disciplines.py` writes compact JSON that doesn't match the
  committed pretty format. Worth closing that gap so lexicon edits apply
  cleanly + visibly. The remaining **~480 ambiguous blanks** → wave-4 human
  disposition (NC/ATC/IXD/HTT/DANCFOLK/MCOM/LIS etc.).
- **v0.6 calibration re-seed** (above) — graduates the doctrine.
- **crnc-detector-wire** — suppress the D-3 `credit_mixed` flag for the 1,337
  CR/NC mirror identities in the auditor + CCR scanner.
- **aviation-restage** — 4 wave-2 findings proposed "Aeronautics" (no canonical
  SUBJ4); correct fill is **Aviation**.
- **cte-parse-gaps** — ~30 TOP codes dropped leave 6,495 rows `cte:null`.
- Sam's curation lanes: Carpentry merge-confirms, CER Trail-Crew lanes, CSR
  curator queue (3).

## Patterns that worked (S113)
- **Two-signals-agree.** Never seed/correct a discipline from a single signal.
  Local code + (TOP OR title/description) must corroborate the **same** target.
  This killed real false positives: `DANCFOLK` code says Folk Dance but its
  titles are "Mind Body Health"/"Wealth & Wellness"; `MCOM`'s existing rows are
  Broadcasting/Journalism, not "Mass Communication".
- **Measure → dry-run → review → write.** The 41-row apply: fresh live read,
  validate every target is an exact MQ name, review the batch, then INSERT-only
  `ON CONFLICT DO NOTHING` under a cohort `reviewer_email` + committed receipt.
- **Homonym-audit before seeding** a subject code globally (a code can mean
  different fields at different colleges — `OT` = Office Tech vs Occupational
  Therapy).

## Safety patterns to honor
- **Rule 9** — Supabase live-curation: fresh read at write-time, cross-check
  pending `unified_title_merge_confirm` targets, INSERT-only
  `ON CONFLICT DO NOTHING` under `<lane>-s<N>@bot`, committed receipt. Reads are
  Range-paginated. Supabase only via the MCP tools (the sandbox can't reach
  `*.supabase.co`).
- **Rule 4** — `CPL_Dashboard.html` and `index.html` byte-identical.
- **Never force-push `main`.** Merge-on-green (`clean` OR `unstable`); squash.
- Poll CI via the **MCP `github` tools**, not `curl`.

Go get wave 4. — SkyTeleo (S113)
