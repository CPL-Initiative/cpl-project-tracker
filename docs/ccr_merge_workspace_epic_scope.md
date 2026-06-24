---
title: CCR merge-workspace epic — consolidate the two merge popups + dock the worklist
date: 2026-06-24
kb-status: published
type: scope
tags: [ccr, merge-workspace, refactor, unified-courses, worklist, shared-editor, docked-panel, epic]
artifacts:
  - unified_courses.js                      # the whole surface — both popups live here
  # the two feeders (today, divergent):
  - unified_courses.js#openUnifyDialog       # per-row ⚇ Merge dialog (ad-hoc seed)  ~L831
  - unified_courses.js#openSuggestions       # ✨ worklist (precomputed groups)       ~L1306
  - unified_courses.js#doConsolidate         # shared commit path (already unified)   ~L1128
  - unified_courses.js#applyMergeLocal       # shared in-page mutation                ~L1027
  # the safety net (committed tests that guard the refactor):
  - tests/uc_merge_search_add.test.js
  - tests/uc_merge_target.test.js
  - tests/uc_official_anchor_target.test.js
  - tests/uc_redistribute_discipline_merge.test.js
  - tests/uc_worklist_*.test.js              # 13 worklist tests
related:
  - docs/ccr_cluster_cleanup_lessons.md
  - docs/session_71_handoff.md
  - docs/kb-notes/reference-common-vs-local-subj-and-discipline-cardinality.md
  - docs/kb-notes/methodology-forward-looking-display-curate-now-rekey-later.md
  - docs/kb-notes/reference-ccr-curation-sync-and-live-merge.md
---

# CCR merge-workspace epic — scope

**Scope-only. No build in this PR.** This captures the two architecture asks Sam made at
the close of Session 70, an authoritative current-state inventory of the two merge surfaces
(the source of this session's drift bugs), the shared-editor design, the docked-panel design,
and a phased PR ladder that keeps each step behind the committed test suite.

It is the riskiest CCR surface — every curator merge flows through one of these two popups —
so the gate before any code is: *does the shared interface cover every feature both surfaces
have today, with a test pinning each, and a phasing that never lands a half-migrated state?*

## The two asks (Sam, Session 70 close)

1. **Consolidate the two merge popups into ONE shared merge-editor.** The per-row ⚇ Merge
   dialog (`openUnifyDialog`) and the ✨ worklist group renderer (`renderGroup`, inside
   `openSuggestions`) have **drifted** — features added to one were not added to the other.
   That drift directly caused several Session-70 bugs (the search-add no-op #504 was fixed in
   the dialog while the worklist's `addCandidateRow` already had its own variant; re-discipline
   #503 landed only in the dialog; the band filters / slider / ★-target / set-as-target /
   evidence chips / completion-note live only in the worklist). **Extract a shared merge-editor**
   that BOTH surfaces embed.
2. **Dock the worklist as a collapsible/resizable panel** in the CCR tab (Sam's pick over a
   modal or a block-below), so the CCR list stays co-visible while curating. The shared editor
   is the foundation for this.

Sam's framing of the architecture (handoff, verbatim): *"Two feeders, one editor — NOT 'per-row
= worklist filtered to one course' (an arbitrary course isn't in any precomputed group)."*

## Why now — the drift is a recurring bug source

The two surfaces solve the same problem (pick a survivor + members → `doConsolidate`) but were
built months apart and never share their UI layer. The commit/mutation layer below them IS
already shared (`doConsolidate` → `applyMergeLocal`), which is why the *data* never drifts —
only the *editor chrome* does. Concretely, features that exist on only ONE side today:

| Capability | Per-row dialog (`openUnifyDialog`) | Worklist group (`renderGroup`) |
|---|---|---|
| Candidate list w/ checkboxes, opt-in | ✅ `addRow` | ✅ `addCandidateRow` |
| Seed/target starts checked | ✅ (seed row, disabled cb) | ✅ (`defTgtId` only) |
| "Add more by search" (⚇ index) | ✅ `srch` (fixed #504) | ✅ `gatherSearch` (➕ keyword) |
| Title field (editable) | ✅ `titleIn` | ✅ `titleIn` + `bestTitle()` proposal |
| Discipline picker | ✅ `discSel` (+ re-discipline #503) | ✅ `discSel` (+ modal pre-select) |
| **Forward-looking Common SUBJ preview** | ✅ `syncTargetUi` note | ✅ `mintHint` / `discNote` |
| **Re-discipline an existing non-official target** | ✅ (#503) | ⚠️ inherited read-only (no re-discipline) |
| Target/"Merge into" selector | ✅ `identSel` (dropdown) | ✅ ★ in-row + `manualTarget` "set as target" |
| **Override → a DIFFERENT off-group course** | ⚠️ via search-add only | ✅ `overrideTarget` (⌕ panel, dedicated) |
| **Completion note** | ❌ | ✅ `noteIn` |
| **Level/format band chips + filter** | ❌ | ✅ `courseBands` chips |
| **COCI evidence / kinship chips** | ❌ | ✅ `m.ev` / `m.tm` |
| **Cross-discipline "⚠ Spans N" flag** | ❌ | ✅ (Session 70) |
| **Per-row ⓘ description toggle** | ❌ | ✅ `descBox` |
| Official C-ID/CCN firewall (no rename/re-disc) | ✅ `tgtOfficial` | ✅ `ovOfficial` checks |
| **Queue chrome** (N-of-M, Skip, Keep-as-is, slider, CCR carry-over, drag bar) | ❌ (single shot) | ✅ |

The asymmetry is the bug surface: a curator who learns the worklist's affordances expects them
in the per-row dialog and vice-versa. Unifying the editor is the durable fix.

## The shared merge-editor — design

**Principle: two feeders, one editor.** Factor a single `MergeEditor` component (a function that
builds + returns a DOM subtree + a small controller object) that owns everything *inside* a single
merge decision. The two callers differ only in **how they seed it** and **what chrome wraps it**.

### What the shared editor owns (the union of both surfaces, today)
- **Candidate list**: rows with opt-in checkboxes; per-row chips (band, evidence 🧾, kinship ⚠,
  Stand-Alone, ➕ added); per-row ⓘ description toggle; per-row "☆ set as target".
- **Target resolution**: §10 precedence pick (CCN > C-ID > M-ID > Unified) over the *checked* set,
  a curator-pinned `manualTarget`, and an off-group `overrideTarget` (⌕ search any identity). The
  ★ badge + green row highlight follow the live winner.
- **Title field**: editable, pre-filled (`bestTitle` for groups, seed title for ad-hoc), firewalled
  read-only for an official anchor target.
- **Discipline + forward-looking Common SUBJ**: picker enabled for a mint OR a re-discipline of a
  non-official target; disabled+inherited for an official anchor; live "→ Common SUBJ PHOT" preview
  via `DISC_COMMON_SUBJ`. (Resolves the one true gap above: the per-row dialog has re-discipline,
  the worklist does not — the shared editor gets it once.)
- **Completion note**: optional, written on the survivor; skipped on a firewalled official target.
- **"Add more by search"**: the ⚇ index, honoring the CCR filter carry-over (`rowPassesCcr`).
- **Confirm**: assembles `chosen` + title + disc + target + note → `doConsolidate(...)`. Exactly
  the call both surfaces already make; the editor centralizes how the args are built.

### The seed contract (the only thing the two feeders supply differently)
```
MergeEditor({
  seedMembers: [ {id, t, s, k, u, g?, d?, ev?, tm?, x?}, … ],  // candidate rows
  preTitle:    "proposed unified title",                       // editable default
  preDisc:     "Discipline" | "",                              // pre-selected
  preNote:     "",                                             // completion note default
  flags:       { isSingleton, sameCollege, crossDiscipline, kind },  // banners
  onConfirm:   (args) => void,   // worklist advances queue; per-row closes overlay
  onCancel:    () => void,
})
```
- **Worklist feeder**: maps one precomputed `g.members` → `seedMembers`, `preTitle = bestTitle(g)`,
  `preDisc = modalDisc`, flags from `g._kind` / `g.same_college` / cross-disc detection. The editor
  is embedded in the queue chrome (badge, N-of-M, Skip/Keep-as-is, slider, band/CCR filters).
- **Per-row feeder**: `findCandidates(seed)` → `seedMembers` (exact + near, all unchecked but the
  seed), `preTitle = seed.title`, `preDisc = seed.disc`. No queue chrome — Cancel/Confirm only.

### What stays OUTSIDE the editor (caller-owned chrome)
- Worklist: the drag-handle title bar, N-of-M counter, Skip / Keep-as-is (persistent dismissal),
  the Conservative↔Aggressive slider, band filters, CCR carry-over checkbox, section badges +
  per-lane explanatory copy. These iterate *across* groups; the editor is *within* one group.
- Per-row: the modal overlay + Cancel button.

This boundary is the key design call: **the editor is one merge decision; the chrome is how you
navigate between decisions.** Drawing it here (not "per-row = worklist-of-one") is exactly Sam's
"two feeders" instruction — an ad-hoc seed has no precomputed group, no lane, no score.

## The docked panel — design

Once the editor is shared, replace the worklist *modal* with a **docked, collapsible, resizable
panel** in the CCR tab so the table stays co-visible.

- **Placement**: a right-hand (or bottom) dock within `#tab-unified-courses`, toggled by the
  existing ✨ Suggested-merges button. Collapses to a thin rail; drag-resize the split.
- **Co-visibility win**: the curator filters the CCR table and watches the worklist follow (the
  CCR carry-over already exists — `groupMatchesCcr` — it just becomes *live* instead of snapshotted
  at popup-open).
- **State**: panel open/collapsed + size in `localStorage` (per-browser, like `kpi_reorder` /
  `cplKpiOrder.v1`). No auth, no server.
- **Per-row dialog stays a modal** — it's a one-shot from a table row, not a sustained workspace.
- **Risk**: docking changes layout/scroll for the whole CCR tab. Keep it **opt-in** (closed by
  default; opening it is the existing button) and ensure the table reflows, not overlaps.

## Phased PR ladder (each step green behind the suite)

The refactor must never land half-migrated. Order it so behavior is **identical** until the final
swap, with tests pinning equivalence at each step:

- **PR-1 — Extract `MergeEditor`, adopt in the WORKLIST only.** Pull `renderGroup`'s inner editor
  (candidate list → Confirm) into the shared component; the worklist embeds it. Per-row dialog
  untouched. All 13 `uc_worklist_*` tests must stay green unchanged (behavior parity). This is the
  big, risky extraction — do it where the feature set is richest so nothing is lost.
- **PR-2 — Adopt `MergeEditor` in the per-row dialog.** Replace `openUnifyDialog`'s inner body
  with the shared editor seeded from `findCandidates`. The per-row dialog *gains* completion-note,
  band chips, ⓘ toggle, evidence chips (where applicable), and the ⌕-override panel for free — and
  loses nothing. Update `uc_merge_*` tests; add an equivalence test (same seed → same `doConsolidate`
  args as before).
- **PR-3 — Dock the worklist panel.** Swap the worklist modal shell for the collapsible/resizable
  dock; the embedded `MergeEditor` and queue chrome are unchanged. New test:
  `uc_worklist_docked_panel.test.js` (toggle, collapse, persisted size, table co-visible). Per-row
  stays a modal.
- **PR-4 (optional) — Live CCR↔worklist sync.** Make the docked panel re-filter as the CCR table
  filters change (today the carry-over is snapshotted at open). Only if Sam wants it after PR-3.

Each PR: one focused change, jsdom-tested, merge-on-green per the standing rules. **No artifact
churn** — `unified_courses.js` is a static Pages-served asset (live on merge); the suggestions
DATA is a cron/dispatch artifact and is untouched by this UI refactor.

## Risks + mitigations

- **R1 — Feature loss during extraction.** *Mitigation:* the divergence table above is the
  checklist; the 13 worklist + 4 merge tests are the executable guard; PR-1 keeps every worklist
  test byte-identical (parity, not new behavior).
- **R2 — Subtle state-coupling.** `renderGroup` closes over `groups`/`i`/`dismissed`/`byId` etc.
  *Mitigation:* the editor takes an explicit `seedMembers`/callbacks contract — no reaching into
  queue state; the queue chrome stays in `openSuggestions`.
- **R3 — Official-anchor firewall regressions.** Both surfaces firewall C-ID/CCN differently
  (`tgtOfficial` vs `ovOfficial`). *Mitigation:* the shared editor has ONE firewall predicate;
  `uc_official_anchor_target.test.js` + `uc_redistribute_discipline_merge.test.js` pin it.
- **R4 — Docked layout breaks the CCR table.** *Mitigation:* opt-in, closed-by-default, reflow
  (not overlay); ship PR-3 separately so a layout problem can't block the editor consolidation.
- **R5 — Big single PR.** *Mitigation:* the ladder splits the extraction (PR-1) from the per-row
  adoption (PR-2) from the dock (PR-3); each is independently reviewable + revertable.

## The safety net (already committed)

`tests/` carries the guards this refactor leans on — verified green at 75/75 on `main` at the
start of Session 71: `uc_merge_search_add`, `uc_merge_target`, `uc_official_anchor_target`,
`uc_redistribute_discipline_merge`, plus the 13 `uc_worklist_*` (aggressiveness, chrome,
cross_discipline_flag, keyword_gather, level_filters, looseness_slider, mint_preview, note_rename,
override_target, polish, search, target_and_filters, target_badge). Before PR-1, add any missing
parity assertion so every editor feature in the divergence table has a test.

## Open decisions for Sam (before PR-1)

1. **Dock side** — right-hand split vs bottom drawer for the worklist panel? (Recommend right-hand;
   the CCR table is wide but the worklist content is tall.)
2. **Per-row dialog after consolidation** — keep it a modal (recommended) or also dockable?
3. **Ladder depth** — ship PR-4 (live CCR↔worklist re-filter) or leave the carry-over snapshotted
   at open (today's behavior)?

Default if no answer: right-hand dock, per-row stays modal, PR-4 deferred. None of these block
PR-1 (the editor extraction is identical regardless).
