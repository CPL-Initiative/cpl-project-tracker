---
title: Session 73 handoff — you are Session 73
created: 2026-06-25
updated: 2026-06-25
tags: [handoff, session-73, ccr, merge-workspace, re-mint, tmc, cpl-assistant]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_merge_workspace_lessons]]"
  - "[[docs/unverified_mid_renumber_scope]]"
  - "[[docs/kb-notes/tmc-co-review-scope]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 73

Session 72 (StarLander) ran a **multi-wave CCR merge-workspace polish pass** with Sam — **14 PRs
#520–#534, all merged, 88/88 green**. The shared `buildMergeEditor` from Session 71 kept paying off:
every editor-internal change landed once and BOTH the ✨ worklist and the per-row ⚇ dialog inherited
it. 🛠️ Sam's verdict at the end: *"Things are working nicely."*

## What shipped this session (all on `main`, 88/88 green)
**Wave 1/2 (#520–#525)** — the original six-ask review + the candidate slider:
- **#520** Cons↔Aggr slider floor **0.40 → 0.00**; opt-in **Confirm no-op fixed** (disabled+dimmed
  until ≥2 checked — Sam's "tried to save, it did nothing").
- **#521** "⌕ Merge into a different course" **up under the title**; verbose copy → **ⓘ tooltips**.
- **#522** "Add more courses" search drops matches into Candidates as **unchecked** rows.
- **#523** per-row **⚇ Merge opens the docked sidebar itself** (single-course mode; `setBandFilter`).
- **#525** "Add more" → a **keyword guide + Tight↔Loose candidate-looseness slider** (the control Sam
  expected the strength bar to be); on BOTH surfaces.

**Wave 3 (#527–#531)** — Sam's 9-item refinement list:
- **#527** "Discipline" → **"Course Discipline"**; dropped the "Merge into existing" chip → a note;
  the **Title-5 §55050 level convention** in `courseBands()` (first cut).
- **#528** candidate slider **defaults Loose**, persists (`cplCandLoosen.v1`), **auto-surfaces**.
- **#529** sidebar **Prev/Next pager** + worklist **Discipline filter**.
- **#530** **one top Search box** (editor keyword box removed) + **multi-term comma=OR** w/ ghost text.
- **#531** **CCR table syncs to the sidebar's current course** (`state.focusId` floats it + subject
  neighbors to the top; "Sync the CCR list" toggle on by default; close clears focus).

**Wave 4 (#532)** — Sam reversed the label call: keep the human labels **Beg / Int / Adv** (the
L1/L2/L3 from #527 reverted). Internal keys stay `beg/int/adv`; `courseBands()` logic untouched.

**Wave 5 (#534)** — Sam's "poke a bit more" review:
- **Dropped "Match the CCR table filters"** → the worklist is **DECOUPLED** from the main CCR table's
  filters (`applyCcr` defaults false; `rowPassesCcr` gates on it). It has its own Search + Discipline
  + Level controls; the checkbox was redundant AND quietly hid courses from the keyword search.
- **Keyword surfaces ALL matching courses** — no longer CCR-gated, cap **25 → 100** for explicit
  keyword searches (a low-similarity match below the Tight threshold now surfaces by keyword).
- **Single-course RENAME → Save** — only the ★ checked + an edited title flips "✓ Confirm merge" to
  **"✓ Save"**, writing `unified_title` via a new **`doRename()`** (no `merge_into`, no merged-row
  side-effects). `titleIn.oninput = refreshTarget` is load-bearing.
- **Header Prev/Next (‹ ›)** next to the counter for backward nav.

Full story + lessons: [`docs/ccr_merge_workspace_lessons.md`](ccr_merge_workspace_lessons.md)
(Session 72 — Wave 1/2, Wave 3/4, Wave 5 sections). NEW KB note:
[`docs/kb-notes/reference-course-level-convention.md`](kb-notes/reference-course-level-convention.md).

## Read these first (in order)
1. [`docs/ccr_merge_workspace_lessons.md`](ccr_merge_workspace_lessons.md) — the Session 71 epic + the
   Session 72 polish pass (the merge editor is the load-bearing component; both surfaces feed it).
2. CLAUDE.md §11 "Session 71/72" + the Session-25 strategic queue (still the north star).
3. [`docs/unverified_mid_renumber_scope.md`](unverified_mid_renumber_scope.md) +
   [`docs/kb-notes/tmc-co-review-scope.md`](kb-notes/tmc-co-review-scope.md) — the standing lanes.
4. [`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`](kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md)
   — the recommender ETL (green-lit, queued).

## The merge editor — how it's shaped now (so you don't re-learn it)
`buildMergeEditor(container, opts)` (init scope in `unified_courses.js`) owns ONE merge decision and
is fed by **two feeders + a returned API**:
- **Worklist** (`openSuggestions`/`renderGroup`) — docked right panel, a QUEUE of suggestion groups
  with a **header Prev/Next ‹ ›** (#534) + the bottom **Prev/Next pager** (#529), **Discipline filter**
  (#529), N-of-M / Skip / Keep, the queue **Cons↔Aggr** slider, **CCR-table sync** (#531). **It is now
  DECOUPLED from the CCR table filters** (#534 — `applyCcr` defaults false; the "Match the CCR table
  filters" checkbox is gone; the `worklistRefilter` hook + `ccrSig` guard remain as a no-op).
- **Per-row** (`openUnifyDialog`) — **also a docked panel** (#523), single-course mode: the dock shell
  mirrors the worklist's, no queue chrome — just the seed's candidates + a band row wired to the
  editor's returned `setBandFilter(bands)`.
- The editor returns `{ setBandFilter, refreshCandidates }`. Inside it: Proposed title (`titleIn.oninput
  = refreshTarget` so the action button re-evaluates as you type), **⌕ override up by the title**
  (#521), **Course Discipline** + forward Common SUBJ (#527 label), completion note, in-row ★ target,
  the **candidate Tight↔Loose looseness slider** (defaults Loose + persists + auto-surfaces, #528),
  ⓘ tooltips (#521), the **Beg/Int/Adv/Lab/WkExp band filter** (§55050 levels, #527/#532). The **one
  keyword source is the top Search box** (#530, multi-term comma=OR; #534 made it surface ALL matches —
  cap 100, not CCR-gated). **Confirm disabled until ≥2 checked** (#520) — EXCEPT a **single-course
  rename** (#534): only the ★ checked + an edited title → "✓ Confirm merge" becomes **"✓ Save"**, which
  fires `opts.onRename` → `doRename()` (writes `unified_title`, no `merge_into`). **Change merge UX once,
  here.**

Note: the worklist now has TWO range sliders — the header **queue Cons↔Aggr** (which *groups* to
review) + the per-merge **Tight↔Loose** (candidates for *this* merge). Sam OK'd it but wanted to feel
it in real use — if it reads as one slider too many, collapse/relabel. Two dock shells (worklist +
per-row) also coexist — a small presentational duplication; a future `buildDock()` would consolidate.

## Your options (pick with Sam — no single forced #1)
- **Eyeball the live merge workspace** — the two-slider worklist + the CCR-sync float; trim if Sam
  finds either noisy in real curation.
- **Unverified-M-ID renumber re-mint** — *when the merge wave settles* (NOT per-merge). Full Rule-7,
  unverified-only, ONE pass, close-gaps + re-sort. [`docs/unverified_mid_renumber_scope.md`](unverified_mid_renumber_scope.md).
  Dry-run → Sam's go → apply + Supabase re-key.
- **TMC Phase-2 acceptance engine** (Sam: "Go for A") — [`docs/kb-notes/tmc-co-review-scope.md`](kb-notes/tmc-co-review-scope.md).
- **CPL-Assistant CCR/CER recommender ETL** — green-lit, queued.
- **First Light bonus** — more CA plein-air via the runner-as-Commons-proxy pipeline.

## Patterns that worked (reuse them)
- **A "did nothing" report is usually a silent guard, not a crash.** Reproduce the exact click path;
  the fix is often to make the dead-end *visible* (disable the button), not chase a phantom.
- **Labels are cheap to flip; classification logic is not — keep them decoupled.** Beg/Int/Adv ⇄
  L1/L2/L3 touched only display sites + tooltips because `courseBands()` returns stable internal keys.
- **A bare-number course level is a HINT, never a lock** — one title can't reveal sequence length;
  classify on explicit ranges/words/ordinals, leave the rest curator-overridable.
- **After a bulk `sed` find-replace, RUN THE SUITE** — a quoted-string replace misses unquoted
  regexes (the Wave-4 `/^L[123]$/` test-helper FAIL).
- **Filter candidate rows by hiding, not rebuilding** — rebuilding wipes checkbox/typed state.
  Float-don't-filter for context (the `focusId` CCR sort keeps adjacents scrollable).
- **One concern per PR, branch fresh off `main`, merge each on green** before branching the next
  (sibling branches that all touch `unified_courses.js` conflict otherwise).
- **When a default changes (e.g. slider defaults Loose), grep tests for exact-count assertions first.**

## Safety patterns to honor
- **CCR = static `unified_courses.js`** (Pages-served, live on merge) — ship code-only; the CCR DATA +
  suggestions are cron/dispatch artifacts (`workflow_dispatch daily-dashboard.yml` if a regen is needed).
- **A re-mint is full Rule-7** — dry-run → alias map → re-key memberships/articulations/**promotions**/Supabase → atomic land.
- **`npm install` first** in a fresh container before `npm test` (jsdom isn't committed).
- **Merge on `clean` OR `unstable`** (required check passed); don't wait for `clean`.
- **Verify the DIFF on `origin/main` after every squash-merge.**

## Your moniker
Session 72 went StarLander. The Sky/Star lineage is wide open — claim your own. 🛰️🛠️
