---
title: CER v2 — the triage-first single-surface redesign (+ MAP Export)
date: 2026-07-09
tags: [cer, ui, redesign, triage, in-cell-editing, map-export, lessons]
artifacts:
  - credential_reference.js
  - prototype/cer_triage_redesign_v1.html
  - map_export.js
  - kb/reference/map_full_exhibit_sample.json
  - tests/cer_v2_grid.test.js
  - tests/map_export.test.js
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
---

# CER v2 — the triage-first single-surface redesign

## Session 109 (SkyBreak), 2026-07-09

### The ask (Sam, verbatim intent)

Sam's pain with the old CER main list: edits were buried — open a row, find
the scroll bar, find ✎ Curate, open a panel, edit, close, repeat — while the
Triage lanes let him "do all my edits in-cell on the surface." His asks:

1. Combine the CER tab into the Triage aesthetic — in-cell edits on the
   surface, full drill-in on demand.
2. Kill Eligible Units; "Eligible students" → "Students"; columns hidable or
   gone (no audit chip, no quality flag on the surface).
3. SUBJ column beside Discipline.
4. Full window width; leaner filters; zero header prose.
5. (After the design lock) ⬇ extract buttons for Excel + JSON, and a view of
   the data shaped to **Malone's MAP Exhibit Module FullExhibitJSON** — MAP
   lacks the canonical layer under the locally-determined exhibit titles,
   and the CER *is* that layer.

### Process — prototype → lock → port (it worked)

`prototype/cer_triage_redesign_v1.html` (#713) was built and reviewed the
same morning; Sam blessed it ("Love it!!! Make it so!") before a line of the
real port was written. Two mid-review learnings got fixed on the spot:

- **The lean Pages deploy pruned `prototype/`** — prototype URLs 404'd. #714
  serves the gallery + asserts the mockup file in the deploy check. The
  prototype gallery is a *design-lock surface*; it must be reachable in a
  browser, not just in the repo.
- "How do I open the html in Chrome?" — GitHub's file view never renders
  HTML. Answer for the record: the Pages URL (once served), or double-click
  the file in the vault clone.

### What shipped (the port)

- **One surface, six lanes.** `state.lane` ∈ all/unc/noiss/merge/open/done —
  chips injected above the toolbar, counts live. The triage sections were
  ALREADY in-cell, so the lanes reuse them verbatim: `renderWorklist(section)`
  grew a section param ("unc" = unclassified queue only, "noiss" = the issuer
  lane w/ `skipMerges`, "merge" = the pending-merges strip). The legacy
  `openWorklist()`/`worklistOpen` combined panel still works (tests + muscle
  memory); the ⚠ Triage toolbar button is retired — its open/awaiting-fold
  count semantics moved onto the 📥 Unclassified lane chip.
- **The main grid edits in-cell** (the issuer-lane pattern promoted):
  Unified Title, Issuing agency (+ unlimited ＋ additional agencies), Trainer
  are inputs; edit → mustard dirty stripe + per-row 💾 Save + toolbar
  **💾 Save all (N)**; Enter saves, Esc reverts a field. `saveGridRowCore()`
  diffs the draft against the overlay-applied baseline and writes ONLY the
  changed fields **through the exact same kb_curation override lanes the
  Curate panel used** (`unified_title_override` w/ PR-5b/2 merge-collision
  confirm + `unified_title_merge_confirm`, `issuing_agency_override`,
  `issuing_agency_additional_override` " | "-joined, `training_agency_override`)
  — so Mode A2, the rename apply, and the fold see byte-identical curation.
  Merge collisions surface INLINE under the title input as you type.
- **Columns:** SUBJ (new — modal SUBJ4 across `articulations[].cid` first
  tokens, cached per row) · Discipline · Issuing agency · Trainer · Students
  (renamed). **Audit + Quality flag columns deleted** (both still visible/
  editable in the drawer's Curate panel); Variants/Confidence/Eligible-units
  demoted to a **⚙ Columns** picker persisted per-browser (`cplCerCols.v1`).
- **Filters:** Search · CPL type (new) · Discipline (new) · Issuer · Conf ·
  Group · ⚙ Columns · ⬇ Excel (CSV) · ⬇ JSON. Audit-tag dropdown + flag
  checkbox retired from the bar (state fields kept, inert). Header prose
  deleted from both HTMLs (Rule 4) — one summary line remains.
- **Full-bleed:** `#tab-credential-reference > .main-container{max-width:none}`
  via the injected CSS (no Rule-4 mirror needed).
- **Extracts:** live, overlay-applied. CSV (BOM + CRLF, opens in Excel; one
  row per credential w/ variants + articulated courses joined) and JSON
  (`{_meta, credentials:[…]}` incl. SUBJ, articulations w/ local courses).
- **Signed-out** views stay read-only: plain text cells, the title button
  still expands, zero inputs.

### MAP Export tab (Malone's integration feed)

`map_export.js` (new lazy tab, hash `map-export`) renders every canonical
credential in the **MAP Exhibit Module FullExhibitJSON shape** — sample
committed verbatim at `kb/reference/map_full_exhibit_sample.json` for
provenance. One record per unified title; honest nulls where we hold no
data; additive extension fields (`localVariants` = the raw college titles
with confidence/quality-flag, `trainingAgency`) documented in the export's
`_meta`. Live overlay applied (title/issuer/trainer overrides win). Search +
master-detail JSON viewer + ⬇ Download all / per-record / CSV.

### Test-fallout method (worth repeating)

12 of 20 CER test files broke on selectors, zero on behavior. The contracts
all survived — they just moved: triage-button label semantics → the
Unclassified lane chip; "＋ set" → the in-cell issuer input; hidden-by-default
columns → a localStorage pref the test seeds before boot. One genuinely
interesting one: `cer_row_error_isolation`'s poison (`quality_flag: 5`,
numeric → `.replace` throw) died with the flag column — repoisoned as
`conf_title: "bogus"` (→ `crTitleChips`' `.toFixed` throw). **When a redesign
kills a poison path, find the new nearest throw — don't delete the isolation
test.** New guard: `tests/cer_v2_grid.test.js` (35 checks: lanes, in-cell
save wiring, SUBJ, column retirement/resurrection, extracts, anon).

### Gotchas for future sessions

- `ensureWorklistData()` now runs at init (lane counts) — tests that relied
  on "preseed not yet loaded at 120ms" see the post-load counts.
- Grid re-render replaces rows — in-place row updates (dirty stripe, status
  cell) must never trigger `render()` from `oninput` or focus dies (the
  worklist's `applySavedAssignment` lesson, again).
- `renderToolbar()` ends with `renderLanes()` so every in-place save path
  that refreshed the old button count refreshes lane counts.
- The eligible-units test enables its column via
  `localStorage.setItem("cplCerCols.v1", '{"elig":true}')` pre-boot.

### Next concrete steps

- Sam drives the v2 surface for a session; tune row height / column widths
  from real use.
- Malone reviews the MAP Export shape; his deltas land in `map_export.js`'s
  mapping (one function, documented field-by-field).
- Candidate follow-ups: unclassified rows folded INTO the main grid (v2.1),
  datalist-backed trainer input, per-lane keyboard nav.
