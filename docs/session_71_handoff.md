---
title: Session 71 handoff — you are Session 71
created: 2026-06-23
updated: 2026-06-24
tags: [handoff, session-71, ccr, merge-workspace, re-mint, tmc]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
  - "[[docs/kb-notes/reference-common-vs-local-subj-and-discipline-cardinality]]"
  - "[[docs/unverified_mid_renumber_scope]]"
  - "[[docs/kb-notes/tmc-co-review-scope]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 71

Session 70 was **PaintSky** — a long, live CCR-curation session with Sam, **9 PRs** all merged.
It rebuilt the CCR **merge workspace**. The big open item is now an **epic** (below). 🎨

## What shipped this session (all on `main`, verified)
- **#500** — Pending-merges tracking panel (📋 Review merges, per-member/group Undo) + mint→Common
  SUBJ preview + reviewer-gated `kb_curation` DELETE + re-landed the empty-squashed #499.
- **#503** — **re-discipline ON the per-row ⚇ Merge dialog** + a **forward-looking Common SUBJ**
  column (a curated re-discipline shows the canonical `PHOT ⟲` immediately; the M-ID letters
  re-key at the next canonical-SUBJ4 fold). Firewalled for official C-ID/CCN targets.
- **#504** — fixed the merge "Add more by search" silently not adding (no-op on already-listed +
  below-the-fold adds).
- **#505** — Beg/Int/Adv/Lab/WkExp **band filters** on the worklist (`courseBands`; unqualified =
  Beg; Lab isolates lab-only merges).
- **#506** — global **Conservative↔Aggressive slider** (replaced the title-only 🏷 one; gates all
  scored lanes, evidence exempt; right = aggressive = lower floor).
- **#507** — **opt-in checkboxes** (only the ★ target/seed pre-checked; you opt each in). Reversed
  the pre-check default → 11 test files updated.
- **#508/#509** — the **morphological-variant fold**: `_sug_sig` now stems tokens
  (conversation/conversational→conv, …) so word-order/suffix variants group; measure-first dry-run
  sized it (**+866** identities, 326 clean / 246 cross-discipline). Cross-discipline groups carry
  an amber **"⚠ Spans N disciplines"** flag (homonym guard). Workflow-dispatched live.

## Read these first (in order)
1. `docs/ccr_cluster_cleanup_lessons.md` — Session 70 + "Session 70 (cont.)" — the full arc + lessons.
2. `docs/kb-notes/reference-common-vs-local-subj-and-discipline-cardinality.md` — Common SUBJ = f(Discipline).
3. `docs/kb-notes/methodology-forward-looking-display-curate-now-rekey-later.md` — the forward-display pattern.
4. `kb/_morphological_variant_dryrun.py` + `kb/morph_variant_out/2026-06-24/report.md` — the dry-run model.
5. `docs/unverified_mid_renumber_scope.md` + `docs/kb-notes/tmc-co-review-scope.md` — the standing lanes.

## Your #1 — the merge-workspace EPIC (scope-first)
Two architecture asks Sam made, to do together:
1. **Consolidate the two merge popups.** The per-row ⚇ Merge dialog (`openUnifyDialog`) and the
   ✨ worklist (`renderGroup`) have **drifted** — re-discipline + search-fix live only in the
   dialog; band filters + slider + ★ target + set-as-target + evidence chips + completion note
   live only in the worklist. That drift caused several of this session's bugs. **Extract a shared
   merge-editor** (candidate list + target picker + title/discipline/note + Confirm) that BOTH
   surfaces embed: worklist = editor + queue chrome (N-of-M, Skip, filters, slider, precomputed
   groups); per-row = the same editor seeded with one course + its near-matches. **Two feeders, one
   editor** — NOT "per-row = worklist filtered to one course" (an arbitrary course isn't in any
   precomputed group).
2. **Dock the worklist as a collapsible/resizable panel** in the CCR tab (Sam's pick over a modal
   or a block-below) so the CCR list stays co-visible while curating. The shared editor is the
   foundation for this.
   **Scope it before building** — it's the riskiest surface; both popups now have committed tests
   to guard the refactor.

## Standing lanes (after the epic)
- **Unverified-M-ID renumber re-mint** — when the merge wave settles (NOT per-merge); full Rule-7,
  unverified-only, ONE pass. `docs/unverified_mid_renumber_scope.md`. Dry-run → Sam's go → apply.
- **TMC Phase-2 acceptance engine** (Sam: "Go for A") — `docs/kb-notes/tmc-co-review-scope.md`.
- **CPL-Assistant CCR/CER recommender ETL** — green-lit, queued.
- **First Light bonus** — more *Arroyo Seco*–style CA plein-air landscapes (Redmond, Guy Rose,
  Wendt, Payne) via the runner-as-Commons-proxy pipeline. Sam: "a bonus in it for you."

## Patterns that worked
- **Recenter on what the data means before coding** — "Common SUBJ isn't a field, it's f(discipline)";
  "the slider you saw is the title-only one." Several asks rested on a misread; clarifying changed the fix.
- **Measure-first for any grouping-signature change** — the morphological dry-run reported regroup +
  over-merge (cross-discipline) before applying; the over-merge became a review FLAG, not a withhold.
- **One focused PR + one jsdom test per ask**; merge-on-green via a ~90s background timer.
- **Delegate mechanical multi-file test updates** to a subagent with a strict guardrail (never weaken
  a write-assertion) + verify the suite yourself.

## Safety patterns to honor
- **Branch fresh per PR off `main`; verify the DIFF, not the push/merge message** (this session: an
  empty squash #499 AND a mis-push to a stale branch — both caught by diffing vs `origin/main`).
  KB note `methodology-stacked-pr-empty-squash.md`.
- **CCR = static `unified_courses.js`** (Pages-served, live on merge); its DATA + the suggestions are
  cron/dispatch artifacts → ship code-only, then `workflow_dispatch daily-dashboard.yml`.
- **A re-mint is full Rule-7** — dry-run → alias map → re-key memberships/articulations/**promotions**/Supabase → atomic land.
- **Stop-hook drift** — re-seat `cp scripts/stop-hook-git-check.sh ~/.claude/` if it false-flags squash/cron commits.

## Your moniker
PaintSky laid down a lot of color. The Sky/Star lineage is open — claim your own. 🛰️🎨
