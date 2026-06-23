---
title: Session 71 handoff — you are Session 71
created: 2026-06-23
tags: [handoff, session-71, ccr, tmc, re-mint, curation]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_70_handoff]]"
  - "[[docs/unverified_mid_renumber_scope]]"
  - "[[docs/kb-notes/reference-ccr-curation-sync-and-live-merge]]"
  - "[[docs/kb-notes/tmc-co-review-scope]]"
---

# You are Session 71

Session 70 was **PaintSky** (the Sky/Star lineage took a brush — Sam named it after Arroyo
Seco landed in the almanac). A short, focused CCR-curation session: **one PR (#500)**, three
tested features, plus an empty-squash recovery. 🎨

## What shipped this session (PR #500, on `main` — verified)

- **Pending-merges tracking panel** (the Session-69 #1 priority, now CLOSED). The
  `⟳ N edits awaiting daily sync` badge is now a click-through **📋 Review merges (N)** panel:
  this session's merges listed as **target ← absorbed members**, with **per-member Undo** and
  **per-group Undo**. All client-side off the `kb_curation` overlay; no pipeline change.
- **Mint → Common SUBJ preview.** In the ✨ Suggested-merges popup, picking a discipline for a
  group that will **mint a new identity** (`UC-CUR`/`Z`, no native id) previews the Common SUBJ
  it lands under — *"will mint under Common SUBJ **PHOT**"* — via `DISC_COMMON_SUBJ`
  (`discipline_canonical_subj4.json`).
- **Reviewer-gated `DELETE` policy on `kb_curation`** (`is_allowed_reviewer()`, applied to the
  **live DB** + committed to `kb/supabase_curation_setup.sql`) so Undo can retract a row.
- **Re-landed PR #499** — it had **silently squash-merged EMPTY** (a stacked-PR artifact). #500
  re-added its content (the Local/Common SUBJ label sweep + the discipline-cardinality KB note +
  its test). New KB note: `methodology-stacked-pr-empty-squash.md`.
- Tests: `tests/uc_pending_merges_panel.test.js`, `tests/uc_worklist_mint_preview.test.js`,
  `tests/uc_common_local_subj_labels.test.js`.

## Read these first (in order)
1. `docs/ccr_cluster_cleanup_lessons.md` (Session 70 section) — the panel + the empty-squash recovery.
2. `docs/kb-notes/reference-ccr-curation-sync-and-live-merge.md` — the merge-durability model (why the panel is visibility+undo, not a regen).
3. `docs/kb-notes/reference-common-vs-local-subj-and-discipline-cardinality.md` — Common SUBJ vs Local SUBJ, the one-discipline→one-SUBJ4 invariant.
4. `docs/unverified_mid_renumber_scope.md` — the re-mint, **when the merge wave settles**.
5. `docs/kb-notes/tmc-co-review-scope.md` — the TMC Phase-2 acceptance engine (still queued).

## Standing lanes (priority order)
- **Unverified-M-ID renumber re-mint** — BUILD **when the merge wave settles** (NOT per-merge).
  Close the gaps + re-sort contiguous `001,002…` by title within each (canonical SUBJ4, band).
  Full Rule-7, unverified-only (verified numbers frozen), ONE pass. Mirror the UC-CUR→Z pair:
  dry-run first → alias map → re-key memberships/articulations/**promotions**/Supabase → atomic
  land; **Sam's go before apply**. Scope + grounded re-key chain ready (#494).
- **TMC Phase-2 acceptance engine** (Sam: "Go for A!") — per-slot verdict in `tmc_builder.js`
  consuming `slot.flexible` + `t.flexibility` (#479): C-ID match = ✓ · flexible = ⚠ accept-with-
  ASSIST · specific C-ID filled by a non-match = faculty-review · unfilled = ○; + structural
  checklist (major ≥18 sem · ≤60 · select-counts) + a "Ready / N issues" banner. Demo Allan
  Hancock vs San Diego City. jsdom test. Scope: `docs/kb-notes/tmc-co-review-scope.md`.
- **COR-upload layer** — build once Sam has CO sample docs (apply `tmc/supabase_tmc_submission_docs.sql`
  + a private Storage bucket; per-course upload affordance). Scope #491.
- **CCR data lane** — the morphological-variant pass (Med Assisting/Assistant; lemmatize/stem the
  title token before `_sug_sig`) + the title-lane pass-2 dry-run. Both **measure-first, own PRs,
  Sam's go before any apply + Supabase re-key**.
- **CPL-Assistant CCR/CER recommender ETL** — green-lit, queued
  (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`).

## Bonus flagged by Sam (worth doing when you have a beat)
Grow First Light's gallery with **more *Arroyo Seco, Pasadena*–style** works — California plein-
air / impressionism (Granville Redmond, Guy Rose, William Wendt, Edgar Payne, Franz Bischoff…),
all verified PD. Use the established **runner-as-Commons-proxy** pipeline (the sandbox can't
reach Wikimedia): `tools/first_light_selection.json` → `tools/source_first_light_art.mjs` →
`tools/build_first_light_manifest.mjs` → the `first-light-art.yml` workflow verifies liveness.
Sourcing rules: `docs/kb-notes/reference-public-domain-art-sourcing.md`. Sam said "there will be
a bonus in it for you" 😄.

## Patterns that worked (steal these)
- **Verify the artifact, not the status.** #499 reported "merged" ✓ and landed nothing. Always
  `git fetch origin main && git diff --stat origin/main~1 origin/main` + grep a marker after a
  squash-merge. This is now a KB note (`methodology-stacked-pr-empty-squash.md`).
- **Branch fresh per independent PR off `main`** — don't stack a 2nd PR on a branch whose 1st PR
  is still open; the 2nd squash can compute empty. (CLAUDE.md sibling-branch policy.)
- **The live merge is durable on click** (Supabase write + `replayLiveMerges` re-applies across
  reloads; `passes()` folds `_mergedAway` live). Per-click full regen is infeasible — add
  **visibility + undo**, let the cron/dispatch publish downstream aggregates.
- **One focused PR + one committed jsdom test per feature**, merge-on-green (clean OR unstable)
  via a ~110s background timer that re-invokes on the secret-scan event.

## Safety patterns to honor
- **Merge-on-green** (clean OR unstable) for your own engineering PRs; let TruffleHog finish, then squash.
- **CCR = static `unified_courses.js`** (NOT pipeline-regenerated); its DATA is `unified_courses_data.js` (regenerated daily — in the cron `git add` list).
- **A re-mint is a full Rule-7** — dry-run → alias map → re-key memberships/articulations/**promotions** (never skip `kb/_rekey_promotions.py`)/Supabase → atomic land in one cron window.
- **Supabase `kb_curation` is live + shared** — only the curation tables are in scope; no destructive migrations without sign-off. (The new DELETE policy is reviewer-gated.)
- **Stop-hook drift:** the container reverts `~/.claude/stop-hook-git-check.sh` to a pre-fix
  version → it false-flags GitHub squash-merge + cron commits on `main` (DO NOT amend, Rule 5).
  Re-seat with `cp scripts/stop-hook-git-check.sh ~/.claude/` when it nags.

## Your moniker
PaintSky picked up a brush. The Sky/Star lineage is wide open — claim your own. 🛰️🎨
