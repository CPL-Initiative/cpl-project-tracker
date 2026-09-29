---
title: Session 83 Handoff
created: 2026-06-28
updated: 2026-06-28
tags: [handoff, session-83, fact-sheet, m-id-renumber, tmc, cpl-assistant]
obsidian-folder: cpl-project-tracker
related: [[CLAUDE]], [[docs/fact_sheet_lessons]], [[docs/kb-notes/methodology-stable-dom-keys-exclude-live-text]]
superseded: true
superseded_by: session_132_handoff.md
---

You are Session 83 of the CPL Project Tracker. Session 82 (SkyFlyer) finished a focused Fact Sheet
pass; the **standing engineering queue is now yours** (it's been waiting through several Fact Sheet
sessions). Sam's cadence: he interleaves quick UI asks with the deeper data lanes, so expect both.

## What shipped (Session 82 — SkyFlyer)

One merged PR — **#584** (squash-merged to `main`, `acddca1`; the Fact Sheet is **standalone**, so it
goes live on the next Pages deploy — NO daily-cron dispatch, NO Rule-4 mirror; it is NOT one of the
two COBI HTMLs). Branch `claude/fact-sheet-editable-boxes-9vb1kx`. Two asks from Sam ("a few more fact
sheet changes" + "ensure WCAG 2.1 AA"):

1. **Make the rest of the Fact Sheet Curate-able** (`fact-sheet/factsheet_edit.js`). The editor grew
   from one rule to **three capability lanes** (per-block flags `live`/`noEdit`/`isTable`/`movable`/
   `gridSig` + `canEditHtml`):
   - **Veteran-Sprint stats → editable + moveable + Add box** even though they're `[data-bind]` live.
     The danger (an overlay clobbering a live value) is handled in `applyBlock`: an editable LIVE box
     with NO html override leaves `innerHTML` alone (binding wins); an edit makes it static.
   - **`#progress` KPI cards → move + delete only** (`MOVE_ONLY_SECTIONS`). Drag-reorder + hide;
     un-hide by clicking the ghost. Never the text editor (live data). Removed `progress` from
     `EXCLUDE_SECTIONS`.
   - **`#funding` budget table → hide-only** (`isTable` block on the `.tbl-wrap`, single ✕).
   - **Per-GRID ＋Add box.** Sections with several grids (`#what-is-cpl` cols-2 + CPL-Bump stat-grid;
     `#vision-goals` ×2; `#teams` ×3) each get one Add box per grid; added boxes carry a `gN` grid
     signature in the key (`<sid>|add|<kind>|gN|<token>`) so they materialize into the right grid.
     Order stays ONE key per section (`applyOrder` appends each box to its own parent).
   - **Stable keys exclude `[data-bind]` text** (`stableText`) so KPI/Vet-Sprint keys don't churn when
     the daily number changes. (KB note: `methodology-stable-dom-keys-exclude-live-text.md`.)
2. **Spin-through QA**: ~15 embedded links (verified by a URL-check agent first); a **WCAG 2.1 AA**
   pass (`--faint`/`--mustard-text` contrast, `:focus-visible`, `role=status` live chip, statewide
   `<summary>` `aria-label`s via `factsheet.js labelSectors()`, table `th scope`+`<caption>`,
   link-purpose labels, reduced-motion, `.sr-only`); **print fixes** (the navy `thead th` was printing
   white-on-white — `print-color-adjust:exact`; URLs revealed in reference contexts; long sections
   flow; `<details>` open on paper); and a **new `⬇ Word` export** (`factsheet_word.js`,
   dependency-free DOM-to-`.doc` reflecting live data + Curate overrides; KB note
   `playbook-standalone-dom-to-word-export.md`).

All on the **unchanged `factsheet_overrides` table** (no schema change). Tests: `factsheet_edit` (35,
updated), `factsheet_edit_sections` (19, new), `factsheet_word` (19, new). Full suite **102 files green**.

**Surfaced, NOT changed** (live/snapshot data + Sam's domain facts — see the To-Do feed): Statewide
"12 program areas" vs 13 listed rows; could-adopt 116 (deduped) vs 454 summed; 30,000 vs 34,000+ vets.
If Sam asks, reconcile these — but they're his numbers, so don't touch them unprompted.

## The carryover you own (priority order)

**STANDING LANES (your priority — pick one and go deep, or follow Sam's lead):**

1. **Unverified-M-ID renumber re-mint** — `docs/unverified_mid_renumber_scope.md`. Follow the **Rule 7
   playbook**: dry-run → committed alias map → re-key `kb/promotions.json` (`kb/_rekey_promotions.py`)
   → atomic land in the 06:17 UTC cron window. This is the most-deferred lane.
2. **TMC Phase-2 acceptance engine** — `docs/kb-notes/tmc-co-review-scope.md`. The CO-review scoring
   that decides whether a college's submitted courses meet each ADT's requirements (the
   `tmc_templates.js` acceptance metadata from Session 66 is the input — `flexible` slots, per-TMC
   `flexibility`, C-ID matching).
3. **CPL-Assistant CCR/CER recommender ETL** — `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.

**STILL ON SAM (one-time, don't block on these):**
- Add the Fact Sheet URL (or `…/cpl-project-tracker/**`) to Supabase **Auth → Redirect URLs** so a
  *direct* magic-link sign-in from the Fact Sheet completes on that page.
- Public KB **PR #15** (Veterans plans) awaiting his review/merge — nudge, don't self-merge (the public
  KB is human-gated curation only).

## Docs to read, in order

1. `CLAUDE.md` — Critical Rules (esp. Rule 5 never-force-main, Rule 7 re-mint playbook, Rule 8
   checkpoint, the auto-merge policy) + §11 roadmap. The M-ID pipeline tag counts in §11 are your map
   for lane 1.
2. `docs/fact_sheet_lessons.md` (2026-06-28, SkyFlyer section) — only if you touch `fact-sheet/` again.
3. For lane 1: `docs/coursecontrolnumber_remint.md` + `docs/kb-notes/methodology-alias-map-resolution-semantics.md`
   + `docs/unverified_mid_renumber_scope.md`.
4. `kb/cpl_todos.json` — the dashboard To-Do feed; refresh it at your checkpoint.

## Patterns that worked (Session 82)

- **Fan-out audit → build in parallel → apply verified findings.** For a "spin through everything" ask,
  a background `Workflow` of N specialist agents (completeness, links, a11y, print/export, a DOM-map to
  verify your plan) running while you build the unambiguous part is the right shape. A second agent
  *verified the link URLs* before any were applied — no guessed deep links shipped.
- **Surface, don't silently fix, numbers you didn't author** on a public doc with a live data layer.
- **Capability lanes per section** (edit / move-only / hide-only) instead of one boolean — the block
  model carries per-block flags and a derived `canEditHtml`.
- **Live-aware overlay** — when an override layer coexists with a data-binding layer, the overlay must
  leave un-overridden live boxes alone (preserve the binding) and only apply on an explicit override.

## Safety patterns to honor

- **Never commit to `main`** — sibling `claude/<desc>` branch per independent PR; squash-merge via
  `mcp__github__merge_pull_request`. (Local `main` was stale this session — `git fetch origin main` +
  `git reset --hard origin/main` before branching.)
- **Squash-merge on `clean` OR `unstable`** — `unstable` = only a non-required check pending. Don't
  over-wait for `clean`; don't end the turn to wait for Sam's "Go!". `enable_pr_auto_merge` (SQUASH) is
  the backstop once required checks register, but it refuses while a required check is still in-progress
  — then poll via the MCP `github` tools (curl can't reach GitHub from the sandbox).
- **Re-mints follow the Rule 7 playbook** (lane 1) — dry-run first, alias map committed, fresh-read
  Supabase at write-time, re-key promotions, atomic land in one cron window. The safety is *inside* the
  workstream (V1–V5 gates), not the merge button.
- **Rule 4** (CPL_Dashboard.html === index.html) does NOT apply to `fact-sheet/` (standalone). It DOES
  apply to the two COBI HTMLs if your lane touches a tab.

## A moniker for you

The Sky/Star streak runs deep (…StarFarout → SkyFlyer). Keep it — StarChart, SkyForge, StarHelm,
SkyWright — or break orbit and claim your own. Sign your §11 narrative and the next handoff with it.
