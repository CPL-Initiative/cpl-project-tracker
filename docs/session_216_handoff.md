---
title: Session 216 handoff — from SkyPool (Session 215, the full-tab-mock run)
created: 2026-08-31
updated: 2026-08-31
tags: [handoff, session-216, implementation-funding, one-pool, port, origination]
kb-status: internal
obsidian-folder: cpl-project-tracker
superseded: true
superseded_by: session_217_handoff.md
---

# You are Session 216

SkyPool here. S215 ran the funding lane only, in tight reaction loops with Sam
live. Everything is merged (#1424, #1425); the artifact "CPL Implementation
Funding" (same URL all day) is the reaction surface. Read in order:

1. `docs/reference/lanes/implementation-funding.md` — lane current truth.
2. `docs/cpl_funding_lessons.md` § "2026-08-31 — S215 (SkyPool)" — the story.
3. `docs/visuals/2026-08-31-if-tab-simplified.html` — now the COMPLETE revised
   tab, not just the three phases; the R1–R11 removals sheet is at its bottom.

## DECISIONS SAM MADE THIS RUN (they outrank inference)

- **The detail labels are "Current Total" / "Total Possible"** — ruled twice in
  one sitting: first "Current Total / Potential Total", then, when the session
  flagged that Potential Total reads as ceiling OR gap, his refinement verbatim:
  *"I see that it can be read both ways. Let's use 'Total Possible' as the
  ceiling."* Ceiling semantics: per priority the CR+NC shares' sum; per
  institution the max award (captions keep his coined term); statewide as a
  mini-label on the card headline, never a duplicate row. `cpl_memory`:
  `current-total-total-possible-labels` (verified, updated in place with a
  before/after receipt).
- **Show the fully revised tab before the port.** He looked at the live tab,
  saw the pre-port hybrid plus redundancies, and asked for a complete mock
  first. That mock now exists and is the approval surface.

## What shipped

- **#1424** — Current/Total-Possible columns in every college expand (7-column
  table, scroll-wrapped), the statewide cards, and the trio's expands.
- **#1425** — the full revised tab in one mock, built from an agent inventory
  of `cpl_funding.js`'s ACTUAL render assembly (~30 surfaces): Draft chip +
  sub-tab chrome, named-projects fold, allocation-formula fold + average award,
  Baseline-eligibility card (N1 a replaces the veteran-JST gate for the trio;
  held-in-reserve never redistributed), goal superscripts + the four
  §78093.2(d)(1) goal cards with the (d)(2) note, live search + word-control
  toolbar, sticky header + ONE SYSTEM row (offset measured, never typed), the
  MAP-team-only note, and **R1–R11 "what leaves the tab"** — 8 ruled, 3
  proposed (R8 parity card · R10 eligibility-pie column · R11 balance-box
  consolidation), reply-by-number.

## Priority queue

1. **Execute Sam's R1–R11 verdicts + look edits as they land** — update the
   mock on the same artifact URL; small edits merge freely.
2. **His lock starts THE PORT** of `cpl_funding.js`: one-pool solver mode, the
   restructure per the mock, R1–R11's ruled removals as the demolition list.
   **Origination feed first per N2 b** for the trio's earn-out (it must ride
   the daily performance pull — `funding/_build_funding_performance.py`); the
   card/table restructure does NOT depend on the feed. Port checklist extras:
   the Report/memo generator's allocation table (still carve-out shaped) and a
   CCC-vocabulary sweep of live-tab strings ("Reading the money" exists).
   Decide during the port which NC share/factor editors survive (s202 folded).
3. **Origination data** — the Malone/Pedro docx is with Sam to forward; the
   ITPI second-landing-page question is the open external dependency.
4. Register sheet + Sierra small-model sweep sequencing unchanged (a parallel
   line may own it if Sam rules there).

## Watch-outs this run earned

- **A greeting can be AHEAD of main, not just stale**: "Session 215" was right;
  the handoff sat in an in-flight checkpoint PR that merged minutes in. Check
  open PRs before declaring a number wrong.
- **A phrase sweep misses what a line break splits** — sweep `Word\s+Word`, and
  always end with a residual scan for the distinctive WORD (new KB note).
- The smoke for the visual lives at the session scratchpad, not `tests/` —
  rebuild it if you extend the mock; its figures of record: earned $7,900,711 ·
  trio $482,669 · college NC $1,300,738 · 51 at base / 7 at cap · SYSTEM NC
  $1,783,407.

## Carryovers (unchanged)

cpl-knowledge-base#22 (Sam merges) · context-pressure hook install ·
`s202-fable-savesweep` + `s203-fable-savesweep2` · Sierra small-model sweep
before register rewrites · `roadmap_archive.md` oversized (budget question) ·
`cpl_pathways_ccr_data.js` stale-copy fix · memory-table lint (DR-19).

## Safety patterns to honor

Rule 8 query first, per workstream. Rule 10 for any shared-table write
(INSERT-only + receipts; guarded UPDATEs only with before/after logged — the
label row is the worked example). Probe-program content never restated
tracker/vault/memory-side. Public KB only via its curation pipeline. Never
force-push main. Verify the three-repo set at start.

Moniker suggestion: claim your own (SkyPort fits what you inherit).
