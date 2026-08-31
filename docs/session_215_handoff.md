---
title: Session 215 handoff — from SkyLedger (Sessions 210→214, the one-pool day)
created: 2026-08-31
updated: 2026-08-31
tags: [handoff, session-215, implementation-funding, one-pool, origination, gr-register]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 215

SkyLedger here — the S210 line ran continuously into 2026-08-31 and executed
the S214 slot. Sam spent the day in the Implementation Funding tab and **adopted
the one-pool model**. Everything below is committed; read in this order:

1. `docs/reference/lanes/implementation-funding.md` — lane current truth.
2. `docs/cpl_funding_lessons.md` § "2026-08-31 — The one-pool day" — the story.
3. `docs/visuals/2026-08-31-if-tab-simplified.html` — the adopted look (artifact
   "One-Pool Funding Tab"); F1 decision card lives on it.
4. `docs/reference/lanes/gr-register.md` — Memo A surface + register-sheet state.

## DECISIONS SAM MADE THIS RUN (Rule 9 step 0b — these outrank inference)

- **ONE POOL ADOPTED.** NC funding folds into one $25,240,308 pool
  ($35M − $800K admin − $8,959,692 projects), 118 institutions, size = credit +
  noncredit FTES, **$150K floor / $400K cap PER INSTITUTION (CR+NC combined,
  not per campus)**. At those dials: 51 at floor, 7 at cap, $0 unspent.
- **Origination design** (braindump CPLBrain#66, verbatim there): NOCE/SDCCE
  earn wherever their students land among their DISTRICT's credit colleges;
  Calbright statewide with an **ordinary allocation, no separate carve-out**;
  the same CPL credits both institutions **by design** (never say "double
  count" — that's an MIS audit-error term).
- **Rulings N1 a / N2 b / N3 a**: exhibits-in-MAP gate stays; **NO advances**
  on origination (the feed is the gate — no dollar moves to the trio until
  origination data flows); Calbright placeholder FTES kept for allocation but
  never disbursed against.
- **NC protection = the earning rule, not a second pool.** Every award shows
  "incl. NC $Y"; the NC share draws only against NC measures. **F1 PENDING:**
  hold vs label-and-report for the $1,300,738 of college NC shares — a
  one-letter ruling on the visual's F1 card. Do not build past it.
- **Vocabulary (now CLAUDE.md Naming doctrine):** *funding*, never "money";
  CCC norms — allocated / restricted / designated / redirect / brought up to
  the minimum; *apportionment* reserved for SCFF. Per-institution figure is
  the **max award** ("awards are based on outcomes, not automatically
  awarded"); institution lists **alphabetical**; plain-language hovers on all
  chips. Sweep prose only, never identifiers.

## What shipped (all merged unless noted)

- **#1418** — Memo A as an editable/exportable surface on the GR Priorities
  tab (`gr_memos` + `gr_memo_sections`, RLS, history triggers, DR-22 mapped,
  receipted seed). Sam iterates there now.
- **#1419/#1420** — Budget Balance mock (`docs/visuals/2026-08-30-budget-balance.html`):
  One-pool mode, N1–N3 stamps, settings persistence + Copy-these-settings.
- **#1421** — `whoMoves()` + the "Who moves — this exploration vs the saved
  model" pool card in `cpl_funding.js` (13-check test, floored).
- **#1422** — the One-Pool Funding Tab visual (phases 1–3 implemented).
- **#1423** — F1 card, max-award/alpha/hovers, CCC-vocabulary sweep,
  CLAUDE.md vocabulary doctrine, lane/todos updates + this checkpoint.
- **CPLBrain #64–#67** — Memo A snapshot banner; two braindumps (one-pool
  hunch; NC-origination design); the Malone/Pedro origination instructions
  (`04-projects/cpl-initiative/20260831_MAP_Custom_Reports_Origination_Data_Instructions.md`
  + docx, delivered to Sam).

## Priority queue

1. **F1 ruling** — when Sam answers (a hold / b label), execute on the visual
   + lane + memory; it shapes the tab port.
2. **The tab port** — Sam's reaction to the visual locks the look; then port
   phases 1–3 into `cpl_funding.js`. **Origination feed first per N2 b** for
   the trio's earn-out; phases ② (priority cards) and ③ (college table
   folds) do NOT depend on the feed and can start on his word.
3. **Origination feed** — Malone/Pedro docx is with Sam to forward; the ITPI
   second-landing-page question is the open external dependency.
4. Register sheet (#1413) still awaits Sam's by-number verdicts — run the
   Sierra small-model sweep BEFORE verdicts rewrite rows. A parallel session
   line may own this if Sam replies there.

## Carryovers (unchanged)

cpl-knowledge-base#22 (draft PR, human-gated — Sam merges) · context-pressure
hook install (Windows: `scripts\install-context-hook.ps1`) · s202-fable-ncdials
feed item · Memo A content iteration + the ACCJC touchpoint confirm.

## Patterns that worked

- **Mock first, lock, then wire** — the Budget Balance mock let Sam set dials
  himself; the who-moves card reuses the LIVE pipeline via
  `savedModelSnapshot()` (swap `SCENARIO={}`, clear caches, run, restore in
  `finally`) — never a second implementation.
- **Measure `summary` length BEFORE inserting** a `cpl_memory` row (≤400).
- Gate what-if features on `SCENARIO` keys, not `isDirty()` (SHARED reads).

## Safety patterns to honor

Probe program content never restated tracker/vault/memory-side. Public KB only
via its curation pipeline. Rule 5 (never force-push main). Supabase writes
INSERT-only + receipted (Rule 10). Verify the three-repo set at start.

Moniker suggestion: claim your own (SkyPool would fit the work you inherit).
