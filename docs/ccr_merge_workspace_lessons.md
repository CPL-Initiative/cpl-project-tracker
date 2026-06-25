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
| **#518** | **PR-4** — **live CCR↔worklist re-filter** (signature-keyed; survives post-merge renders) | merged |

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

- **Done — the epic is COMPLETE, all four ladder steps + the optional PR-4.** One shared editor, two
  feeders (worklist + per-row dialog), the worklist docked right, and the dock now re-filters live with
  the CCR table. All merged (#511 scope · #512 PR-1 · #513 PR-2a · #514 PR-2b · #515 lessons · #516 PR-3 ·
  #518 PR-4), 78/78 green. The drift that caused the Session-70 bugs is structurally gone: any future
  merge-UX change lands once, in `buildMergeEditor`, and both surfaces get it.

### PR-4 — live CCR↔worklist re-filter (#518)

`render()` is the single funnel for every CCR filter change, so an open dock subscribes to it: it
assigns a `worklistRefilter` that `render()` calls at its end (nulled on close). The trick is the
**signature key** — `worklistRefilter` resets the queue only when a *carried CCR field* changes (a
`ccrSig()` of discipline/subject/source/credit/audit/… ). That one idea solves three problems at once:
a **post-merge `render()`** (filters unchanged → sig unchanged) doesn't clobber the Confirm's `i++`
advance; **typing in the CCR search box** (`state.q`, deliberately not in the sig) doesn't reset the
queue; and with the **carry-over checkbox off** the dock is independent. **Lesson:** when a global
event (`render()`) fires for many reasons, gate the reaction on a *content signature* of just the
inputs you care about — far cleaner than threading a "why did this fire" flag through every caller.

- **Beyond the epic** (standing lanes): the unverified-M-ID renumber re-mint (after the merge wave
  settles), the TMC Phase-2 acceptance engine, the CPL-Assistant CCR/CER recommender ETL.

---

## Session 72 (StarLander) — the post-consolidation polish pass (2026-06-24/25)

Session 71 consolidated the two merge popups into one shared `buildMergeEditor`. Session 72 was
Sam's hands-on review of that workspace — **six asks, all shipped + merged across 5 PRs.** Because
the editor is now shared, every editor-internal change landed once and BOTH surfaces (the ✨ worklist
and the per-row ⚇ dialog) inherited it — exactly the payoff the consolidation was for.

| PR | Item | What |
|---|---|---|
| **#520** | slider + **#3** | Aggressiveness slider floor **0.40 → 0.00** at full-right (deeper aggressive reveal). Opt-in **Confirm no-op fixed**: it was silently `alert()`-ing "check at least two" with only the ★ pre-checked → now **disabled+dimmed until ≥2 checked** (≥1 for an override target), re-enables live; stale 2-member help text corrected. |
| **#521** | **#4 + #5** | "⌕ Merge into a different course" **moved up under the title** (`insertBefore(ovWrap, titleIn.nextSibling)`). Verbose gray paragraphs → compact **ⓘ hover tooltips** (`infoIcon()`); the dynamic discipline note stays visible (it's live state, not static copy). |
| **#522** | **#2** | The collapsible "➕ Add more by keyword" panel → an **always-visible "Add more courses" search** whose matches drop straight into the Candidates list as **unchecked** rows (tick to merge / ignore). Unchecked search rows clear on query change; checked ones persist. |
| **#523** | **#1** | Per-row **⚇ Merge opens the docked sidebar** (Sam: "open the sidebar itself"), not a modal — same dock shell, same shared editor. **Single-course mode** drops the queue chrome (no N-of-M / Skip-Keep / slider) and keeps a **band row that filters the candidate pool** via a new `setBandFilter` API the editor returns. |

### Lessons / gotchas

- **A "did nothing" bug is often a silent guard, not a crash.** Sam's #3 ("tried to save, it did
  nothing") reproduced as the opt-in model leaving only the ★ checked → Confirm hit the ≥2 `alert`.
  The fix is to make the dead-end *visible* (disable the button) rather than chase a phantom crash.
  The first `refreshTarget()` runs before `go` exists (hoisted `var`, `undefined`), so the disabled
  state needs a **second `refreshTarget()` after the button is created** — easy to miss.
- **Relocating explanatory copy into `[title]` tooltips breaks `textContent` assertions.** Five test
  assertions across `uc_worklist_chrome` + `uc_worklist_target_badge` read the copy from
  `body.textContent`; moving it to `infoIcon` titles meant pointing them at `[title]` attributes.
  Keep the phrase **verbatim** in the title so only the *lookup location* changes (watch sentence-case
  — "Each row…" vs the old "each row…" needed an `/i` flag).
- **The per-row dock was low-risk because the per-row tests were DOM-position-agnostic.** They locate
  the editor via document-wide `querySelectorAll` (Proposed title / candidates / Confirm), not via the
  modal overlay — so swapping the modal container for a dock shell passed them **unchanged**. Grep the
  consumers for container-specific assumptions *before* assuming a container swap is expensive.
- **Filter candidate rows by hiding, never by rebuilding.** The band filter in single-course mode
  hides non-matching rows (`row.style.display`) via the returned `setBandFilter` — rebuilding the
  editor would wipe the curator's checkboxes + typed title.
- **The Edit tool chokes on the Unicode in this file's comments** (emoji ✨⚇➕⌕★, em-dashes). When a
  large `old_string` won't match, split into small **plain-ASCII** anchors and match the unique tail
  (the per-row dock block ends the function; the worklist's calls `renderGroup()` — that's the
  disambiguator).
- **Dock-shell duplication is acceptable; editor duplication is not.** The per-row dock replicates the
  worklist's ~40-line shell (a future consolidation target), but the load-bearing merge UX stays in
  the one `buildMergeEditor`. Sharing `DOCK_KEY` means the per-row dock opens at the worklist's width
  (nice) — but force `collapsed = false` so a clicked Merge never appears as just a rail.

### #525 — "Add more" → keyword guide + Tight↔Loose candidate slider

Sam's follow-up after #523: *"the way it adds more is the function I expected the strength bar to
do — consolidate, keyword as guide; rely on title (and description if available)."* He chose to
apply it to **both** surfaces. The editor's "Add more courses" search became one control: a
**Tight↔Loose slider** that surfaces more *similar* candidates (loosen → lower the title-Jaccard
threshold → more unchecked rows), a **keyword box** that guides it (explicit substring search, not
similarity-gated), and a **lazy description blend** (`scoreEn` = `max(titleJac, 0.85·descJac)`;
the ~34MB detail file is fetched only on a *deep* loosen — `pos ≥ 50` — cached, then re-ranked; if
already loaded from an ⓘ toggle the blend kicks in immediately). **Lessons:**
- **No feeder changes needed** — `refTitle` defaults to `opts.preTitle` and `refId` derives from
  `targetMemberOf(members)`, so both the per-row dock and the worklist groups inherited it for free.
- **Pre-tokenize the index once** (`ensureIdxTok`) — re-tokenizing 70k titles per slider tick is the
  obvious perf trap; cache `{en, tok}` and reuse, debounce the slider (160ms) + keyword (220ms).
- **Eagerly seed `refDescSet` when `_ucDetails` is already present** — the lazy `loadDetails().then`
  path only runs once, so without the eager check a pre-loaded detail file would never blend.
- **Two range sliders now coexist in the worklist** (queue Cons↔Aggr in the header + candidate
  Tight↔Loose in the editor). The per-row-dock test had to stop asserting "no range slider" and
  instead assert no *Cons↔Aggr* (queue) slider while the *Tight↔Loose* candidate slider IS present.

### State + next (as of #525)
- **All six S72 items + the #525 follow-up DONE + merged.** Possible next polish: the two dock shells
  (worklist + per-row) could fold into a `buildDock()` helper; watch whether the worklist's two
  sliders read as one too many in real use (Sam to eyeball).
- Standing lanes unchanged: unverified-M-ID renumber re-mint, TMC Phase-2 acceptance engine,
  CPL-Assistant CCR/CER recommender ETL.

### Wave 3 (#527–#531) + Wave 4 (#532) — Sam's 9-item refinement list (2026-06-25)

After more hands-on use Sam sent nine refinements. Shipped one-concern-per-PR off fresh branches:

| PR | Items | What |
|---|---|---|
| **#527** | #6 + #8 + #9 | "Discipline" → **"Course Discipline"** label + note; dropped the redundant "Merge into existing" chip → a section note; the **Title-5 §55050 level convention** (first cut, labels Level 1/2/3). |
| **#528** | #4 | The candidate Tight↔Loose slider now **defaults near-full Loose**, **persists** per-browser (`cplCandLoosen.v1`), and **auto-surfaces** the looser candidate set on open (no drag needed). |
| **#529** | #1 + #2 | Sidebar **Prev/Next pager** at the bottom (`nextPassing(from,dir)` walks the filtered queue); a **Discipline filter** in the worklist (`discSel` from `discCount`, `groupMatchesDisc` in `groupPasses`). |
| **#530** | #5 + #7 | **Eliminated the editor's own keyword box** — one **top Search box** is the single keyword source; made it **multi-term (comma = OR)** with ghost text ("digital, imag"). |
| **#531** | #3 | **CCR table syncs to the sidebar's current course** — `state.focusId` floats that course + its subject neighbors to the top of the CCR list (still scrollable), focused row highlighted; a "Sync the CCR list" toggle (on by default); closing the worklist clears the focus. |
| **#532** | Wave 4 | Sam reversed the label call: **keep Beg/Int/Adv** (the L1/L2/L3 from #527 reverted). Internal keys stay `beg/int/adv`, `courseBands()` logic untouched — pure label revert. |

**Lessons:**
- **Default-Loose + auto-surface broke "group starts with N members" assumptions.** #528 made the
  editor open with extra candidates already surfaced, so two tests that counted the initial member
  list failed. Fix: pin `localStorage.setItem("cplCandLoosen.v1","0")` (Tight) in the keyword-gather
  test, and make any keyword-path fixture title *dissimilar* from the seed so the auto-surface doesn't
  pre-pull it. When a default changes, grep the tests for "starts with"/exact-count assertions first.
- **A bare-number level is a HINT, never a lock.** "Spanish 3" is Int in a six-part ladder, Adv in a
  three-part one — one title can't reveal sequence length. `courseBands()` reads **explicit
  ranges (1-2/3-4/5-6) and words/Roman ordinals reliably, a bare single digit only as a hint**, and
  bare numbers are matched **as whole single-digit tokens** so `CS6`/`2D`/`Math 56` (a course
  *number*) don't misread. The convention is **authoritative by curation**; the classifier is the
  assist. Full convention: [`docs/kb-notes/reference-course-level-convention.md`](kb-notes/reference-course-level-convention.md).
- **Labels are cheap to flip; classification logic is not — keep them decoupled.** The Beg/Int/Adv ⇄
  L1/L2/L3 round-trip (#527 → #532) touched only three display sites + tooltips + the doc, because the
  classifier returns stable internal keys (`beg/int/adv`) and the UI maps them at render. A label A/B
  is a one-line dictionary swap when the data layer never learns the label.
- **`sed`-reverting quoted strings misses regexes.** The Wave-4 revert `sed`'d `"L1"→"Beg"` etc. in
  the tests but left a test helper's `/^L[123]$/` regex (unquoted) pointing at the old labels → a
  silent FAIL. After a bulk find-replace, **run the suite** — don't trust the grep that only checked
  the quoted forms.
- **`focusId` sort floats without losing adjacency.** #531's CCR-sync sorts the focused course +
  same-subject neighbors to the top rather than *filtering* to them, so the curator can still scroll
  to true adjacents — a "float, don't filter" pattern that keeps context while answering "where is the
  course I'm merging in the big list?".

### State + next (as of #532 — Session 72 close)
- **All 13 PRs (#520–#532) merged; 87/87 green.** The merge workspace is the most-iterated surface in
  the CCR now — one shared `buildMergeEditor`, two feeders, a docked panel on both, a candidate
  looseness slider, the §55050 level filter, CCR-table sync, and a multi-term search.
- **Possible next polish (unchanged):** fold the two dock shells into a `buildDock()` helper; eyeball
  whether the worklist's two sliders (queue Cons↔Aggr + per-merge Tight↔Loose) read as one too many.
- Standing lanes unchanged: unverified-M-ID renumber re-mint, TMC Phase-2 acceptance engine,
  CPL-Assistant CCR/CER recommender ETL.
