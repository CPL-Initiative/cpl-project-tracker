---
title: CCR merge-workspace epic — lessons (Session 71)
date: 2026-06-24
tags: [ccr, merge-workspace, refactor, shared-editor, unified-courses, lessons, session-71]
obsidian-folder: cpl-project-tracker
artifacts:
  - unified_courses.js                     # buildMergeEditor (init scope) + its two feeders
  - docs/ccr_merge_workspace_epic_scope.md # the scope this executes
  - tests/uc_merge_editor_shared.test.js   # PR-1 seam guard
  - tests/uc_merge_dialog_shared_editor.test.js  # PR-2b in-row + re-discipline guard
related:
  - "[[docs/ccr_merge_workspace_epic_scope]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
  - "[[docs/session_71_handoff]]"
---

# CCR merge-workspace epic — lessons

The Session-70 handoff's #1 was an **epic**: the CCR had **two** merge popups — the per-row ⚇
Merge dialog (`openUnifyDialog`) and the ✨ Suggested-merges worklist (`renderGroup`) — that had
**drifted** (features added to one, not the other), causing several Session-70 bugs. Sam asked to
(1) consolidate them into **one shared editor** and (2) **dock the worklist** as a panel. This doc
is the workstream scratchpad; the plan of record is
[`ccr_merge_workspace_epic_scope.md`](ccr_merge_workspace_epic_scope.md).

## What shipped this checkpoint (Session 71)

| PR | What | State |
|---|---|---|
| **#511** | **Scope** — divergence table, two-feeders design, docked-panel design, 4-PR ladder | merged |
| **#512** | **PR-1** — extract `buildMergeEditor(container, opts)`; the **worklist** embeds it (parity) | merged |
| **#513** | **PR-2a** — hoist the editor to `init` scope with a `deps` contract (worklist parity) | merged |
| **#514** | **PR-2b** — the **per-row ⚇ dialog** adopts the shared editor (in-row ★ model) | merged |
| **#516** | **PR-3** — dock the ✨ worklist as a **right-hand collapsible/resizable panel** | merged |

After #514 there is **one merge editor, two feeders**: the worklist (precomputed groups) and the
per-row dialog (`findCandidates` seed). Sam's locked decisions: **in-row ★ target** model
everywhere (no dropdown), **right-hand dock** for PR-3, **per-row stays a modal**.

## The design that worked — two feeders, one editor

`buildMergeEditor(container, opts)` owns ONE merge decision (candidate list, title, discipline +
forward Common SUBJ, completion note, ★ target / set-as-target, ➕ keyword-gather, ⌕ override
search, Confirm). It appends directly to `container` so the DOM is byte-identical to the
pre-extraction worklist — which made the 13 `uc_worklist_*` tests the parity guard at every step.

The two feeders differ only in **seed + chrome**, expressed as small `opts`:
- `members`, `preTitle`, `extraActions`, `onConfirm(result)` — the seed contract.
- `preCheckedIds` — which rows start checked (worklist: the §10 ★; per-row: `[seed.id]`).
- `allowRediscipline` — per-row keeps re-discipline-on-merge (#503); worklist stays inherited/RO.
- `dismissLabel` — honest copy ("Cancel" vs "Keep as-is / Skip").
- `deps: { byId, rowPassesCcr }` — the only two `openSuggestions`-locals the editor needed once
  hoisted to `init` scope; everything else (`cleanTitle`, `targetMemberOf`, `courseBands`,
  `DISC_COMMON_SUBJ`, `loadIndex/Details`, `_ucIndex`) was already reachable there.

**Lesson:** parameterize *behavior the feeders genuinely differ on* (4 small opts), don't fork the
component. Each opt has a default that reproduces the worklist exactly, so adopting the editor in
the per-row dialog regressed nothing and the worklist stayed byte-identical.

## Lessons / gotchas

- **Relocate large blocks with a deterministic script, not by hand.** PR-1 moved ~450 lines and
  PR-2a moved ~430; both were done with a Python splice (extract → substitute → dedent → re-insert,
  with `assert` guards on every transform) then verified by `node -c` + the full suite. Hand-copying
  450 lines is where transcription bugs live. Scripts in `scratchpad/` (splice.py, hoist.py,
  rewrite_unify.py) — kept for provenance.
- **The seed's `k` must be the §10 axis (id_system), not the display `kind`.** The move surfaced a
  latent bug: `openUnifyDialog` seeded the member with `k = seed.kind` (= "Course"), which isn't in
  `TPRI`, so `targetMemberOf` ranked an M-ID **seed below every M-ID candidate** and silently
  retargeted the merge to a near-match. Fix: `k = seed.kind === "Stand-Alone" ? "Stand-Alone" :
  (seed.id_system || seed.kind)`. **Lesson:** when a member object crosses from one surface's
  convention to another, the precedence-bearing field must use the shared convention — a unit test
  that asserts *which id wins* (not just "a merge happened") catches it.
- **The official firewall lives in `doConsolidate`, not the dialog.** `doConsolidate` already gates
  title/discipline/note writes on `!tgtOfficial`, so the shared editor can pass `discSel.value`
  unconditionally and re-discipline only needs to *enable the picker* for a non-official survivor.
  The old per-row `discOut = official ? "" : …` was redundant defense. **Lesson:** find where an
  invariant is actually enforced before re-implementing it in a new caller.
- **Split the risky PR.** PR-2 was split into 2a (pure hoist, parity) + 2b (the per-row rewire +
  test rewrites). 2a is trivially reviewable; 2b isolates the user-visible change. The hoist's diff
  looks huge (~430 add/del) but is a move — verified by the unchanged suite.
- **Default-reversal cost = the test suite.** Adopting the shared editor changed the per-row DOM
  (dropdown → in-row ★, `[data-id]` → `.uc-cand-cb`, "Merge N into X" → "✓ Confirm merge"). Three
  per-row tests were rewritten to the new DOM; their *behavioral* assertions (merge_into routing,
  official firewall, impact value, Verify stamp) were preserved verbatim — only the selectors moved.

### PR-3 — the dock (#516)

The worklist's centered drag-to-move **modal** became a **right-hand docked panel**: `position:fixed`
at `right:0`, full height; the page **reflows** (`body padding-right`) so the CCR table stays
co-visible rather than being overlaid. A left-edge grip resizes the width (360–900px); a » button
collapses it to a thin vertical **rail** that re-expands on click; ✕ closes + clears the reflow.
Width + collapsed persist in `localStorage` (`cplWorklistDock.v1`); a re-open drops any prior dock so
the reflow never stacks. **Only the shell changed** — the shared editor + queue chrome (N-of-M,
Skip/Keep, slider, band/CCR filters) are untouched. The per-row ⚇ dialog **stays a modal** (Sam's pick).
**Lesson:** swapping a modal shell for a dock means re-pointing the tests that asserted modal mechanics —
`uc_worklist_chrome` (drag-to-move → collapse/resize/close + reflow) and `uc_keep_asis` (backdrop-click
→ ✕). The 12 other `uc_worklist_*` tests, which only inspect the rendered content, passed unchanged.

## State + next

- **Done — the epic is COMPLETE.** One shared editor, two feeders (worklist + per-row dialog), and the
  worklist docked right. All merged (#511 scope · #512 PR-1 · #513 PR-2a · #514 PR-2b · #515 lessons ·
  #516 PR-3), 77/77 green. The drift that caused the Session-70 bugs is structurally gone: any future
  merge-UX change lands once, in `buildMergeEditor`, and both surfaces get it.
- **PR-4 (optional, deferred):** live CCR↔worklist re-filter — the docked panel re-filters as the CCR
  table filters change (today the CCR carry-over is snapshotted at open). Build only if Sam asks.
- **Beyond the epic** (standing lanes, unchanged): the unverified-M-ID renumber re-mint (after the merge
  wave settles), the TMC Phase-2 acceptance engine, the CPL-Assistant CCR/CER recommender ETL.
