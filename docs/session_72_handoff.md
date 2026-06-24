---
title: Session 72 handoff — you are Session 72
created: 2026-06-24
updated: 2026-06-24
tags: [handoff, session-72, ccr, merge-workspace, re-mint, tmc, cpl-assistant]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_merge_workspace_lessons]]"
  - "[[docs/ccr_merge_workspace_epic_scope]]"
  - "[[docs/unverified_mid_renumber_scope]]"
  - "[[docs/kb-notes/tmc-co-review-scope]]"
---

# You are Session 72

Session 71 **completed the CCR merge-workspace epic** that Session 70 (PaintSky) scoped — **6 PRs,
all merged to `main`**. The two merge popups are now one shared editor, and the ✨ worklist is a
docked right-hand panel. 🛠️

## What shipped this session (all on `main`, verified)
- **#511** — **Scope** of the epic ([`docs/ccr_merge_workspace_epic_scope.md`](ccr_merge_workspace_epic_scope.md)):
  the feature-divergence table between the two merge surfaces, the two-feeders/one-editor design,
  the docked-panel design, the 4-PR ladder.
- **#512 — PR-1** — extracted the worklist's inner merge editor into one shared
  `buildMergeEditor(container, opts)`; the worklist embeds it. **Byte-identical DOM** (the 13
  `uc_worklist_*` tests were the parity guard).
- **#513 — PR-2a** — hoisted `buildMergeEditor` to `init` scope with a `deps: {byId, rowPassesCcr}`
  contract so both feeders reach it. Pure refactor, worklist parity.
- **#514 — PR-2b** — the per-row ⚇ Merge dialog adopts the shared editor with the **in-row ★
  target** model (Sam's pick; no more "Merge into" dropdown). Re-discipline-on-merge (#503) kept via
  `allowRediscipline`; seed-as-anchor via `preCheckedIds`. Fixed a latent precedence bug (seed `k`
  must be id_system, not display `kind`). ~190 dead lines removed.
- **#515** — the epic **lessons doc** ([`docs/ccr_merge_workspace_lessons.md`](ccr_merge_workspace_lessons.md)).
- **#516 — PR-3** — the ✨ worklist is now a **right-hand docked, collapsible/resizable panel**
  (drag left edge to resize · » collapse to a rail · ✕ close; page reflows via `body padding-right`;
  `localStorage` `cplWorklistDock.v1`). Per-row dialog stays a modal.

**77/77 tests green throughout.** The drift that caused Session-70 bugs is structurally gone: a
future merge-UX change lands once in `buildMergeEditor` and both surfaces inherit it.

## Read these first (in order)
1. [`docs/ccr_merge_workspace_lessons.md`](ccr_merge_workspace_lessons.md) — the full epic arc + lessons.
2. [`docs/ccr_merge_workspace_epic_scope.md`](ccr_merge_workspace_epic_scope.md) — the design of record
   (two feeders, one editor; the seed contract; the opts).
3. CLAUDE.md §11 "Session 71" + the Session-25 strategic queue (still the north star).
4. [`docs/unverified_mid_renumber_scope.md`](unverified_mid_renumber_scope.md) +
   [`docs/kb-notes/tmc-co-review-scope.md`](kb-notes/tmc-co-review-scope.md) — the standing lanes.

## The merge editor — how it's shaped now (so you don't re-learn it)
`buildMergeEditor(container, opts)` (init scope in `unified_courses.js`) owns ONE merge decision:
candidate list, Proposed title, Discipline + forward Common SUBJ, completion note, in-row ★ target
(+ "☆ set as target" + ⌕ override search), ➕ keyword-gather, Confirm. It appends to `container`.
Two feeders:
- **Worklist** (`openSuggestions`/`renderGroup`): seeds one precomputed group; wraps the editor in
  the docked panel + queue chrome (N-of-M, Skip/Keep-as-is, the Conservative↔Aggressive slider, band
  + CCR filters).
- **Per-row** (`openUnifyDialog`): seeds `findCandidates(seed)`; wraps it in a modal with a Cancel.

Opts that differ per feeder (each defaults to the worklist's behavior): `members`, `preTitle`,
`extraActions`, `onConfirm(result)`, `preCheckedIds`, `allowRediscipline`, `dismissLabel`,
`deps:{byId, rowPassesCcr}`. **Change merge UX once, here — never fork the two surfaces again.**

## Your options (pick with Sam — no single forced #1)
- **Epic PR-4 (optional, deferred):** make the docked worklist re-filter **live** as the CCR table
  filters change (today the CCR carry-over is snapshotted when the panel opens). Small; build only if
  Sam wants it. Sam will eyeball the dock on the deployed site — **act on any look feedback first**
  (default width/side, reflow behavior).
- **Unverified-M-ID renumber re-mint** — *when the merge wave settles* (NOT per-merge). Full Rule-7,
  unverified-only, ONE pass, close-gaps + re-sort. [`docs/unverified_mid_renumber_scope.md`](unverified_mid_renumber_scope.md).
  Dry-run → Sam's go → apply + Supabase re-key.
- **TMC Phase-2 acceptance engine** (Sam: "Go for A") — [`docs/kb-notes/tmc-co-review-scope.md`](kb-notes/tmc-co-review-scope.md).
- **CPL-Assistant CCR/CER recommender ETL** — green-lit, queued —
  [`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`](kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md).
- **First Light bonus** — more *Arroyo Seco*-style CA plein-air (Redmond, Guy Rose, Wendt, Payne) via
  the runner-as-Commons-proxy pipeline.

## Patterns that worked (reuse them)
- **Scope-first for a risky refactor.** The scope doc's divergence table was the literal checklist for
  the extraction; nothing was lost because every feature had a row + a test.
- **Relocate big blocks with a deterministic script** (extract → substitute → dedent → re-insert with
  `assert` guards), then `node -c` + full suite. Hand-copying 450 lines is where bugs live. (Scripts
  in the session scratchpad; not committed.)
- **Parameterize behavior the feeders genuinely differ on; default each opt to the incumbent.** That's
  what kept the worklist byte-identical while the per-row dialog gained features.
- **Split the risky PR** (PR-2a pure hoist / PR-2b the rewire). Small, tested, merge-on-green via the
  CI status check (`unstable` = required check passed → merge).
- **Assert *which id wins*, not just "a merge happened"** — that's what caught the seed-`k` bug.

## Safety patterns to honor
- **Branch fresh per PR off `main`; verify the DIFF on `origin/main` after every squash-merge** (the
  Session-70 empty-squash + mis-push lessons — `methodology-stacked-pr-empty-squash.md`).
- **CCR = static `unified_courses.js`** (Pages-served, live on merge); its DATA + the suggestions are
  cron/dispatch artifacts → ship code-only, then `workflow_dispatch daily-dashboard.yml` if a data
  regen is needed.
- **A re-mint is full Rule-7** — dry-run → alias map → re-key memberships/articulations/**promotions**/Supabase → atomic land.
- **`npm install` first** in a fresh container before `npm test` (jsdom isn't committed).
- **Stop-hook drift** — re-seat `cp scripts/stop-hook-git-check.sh ~/.claude/` if it false-flags squash/cron commits.

## Your moniker
Session 71 ran heads-down and shipped the whole epic — no moniker claimed. The Sky/Star lineage is
wide open; claim your own. 🛰️🛠️
