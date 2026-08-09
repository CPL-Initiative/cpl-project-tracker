---
title: "Session 110 handoff — carpentry pass 2, the SUBJ filter, and the common-titles follow-ups"
date: 2026-07-09
tags: [handoff, session-110, cer, carpentry, subj-filter, common-titles]
artifacts:
  - credential_reference.js
  - excel_to_dashboard.py
  - kb/carp_title_out/2026-07-09/
  - kb/apprentice_tag_out/2026-07-09/
related:
  - "[[cer_v2_redesign_lessons]]"
  - "[[cobi_lessons]]"
  - "[[exhibit_canonicalization_lessons]]"
superseded: true
superseded_by: session_132_handoff.md
---

You are **Session 110**. Session 109 (SkyBreak) ran long and hot — read this
top to bottom; the FIRST task is mid-flight with Sam's clarifications in hand.

## What shipped in Session 109 (context you'll be asked about)

1. **CER v2 rounds 1–3** (#713–#717): one full-width surface, lane chips,
   in-cell edits (title / issuer / trainer / Discipline / SUBJ), ghosted cream,
   College filter, drag-resizable columns, seal-blue chips, white headers,
   ⬇ CSV/JSON extracts, the 🗺 MAP Export tab for Malone. Full story:
   `docs/cer_v2_redesign_lessons.md`.
2. **Two receipted bulk jobs**: 113 CTCNC "CARP NNN" exhibits renamed to their
   articulated COCI course titles (`kb/carp_title_out/2026-07-09/`, 19 skipped
   with reasons) + 318 apprenticeship exhibits tagged
   `cpl_type_override="Apprenticeship"` (`kb/apprentice_tag_out/2026-07-09/`).
3. **PR-5b rename apply ran TWICE** — the first run exposed a real bug:
   `kb/_apply_credential_review.py` + `kb/_apply_unclassified_triage.py` read
   kb_curation UNPAGINATED and the namespaces crossed PostgREST's 1,000-row
   cap (silent tail-drop; only 50 of 224 renames visible). Fixed in **#718**
   (Range-paginated, the Session-105 pattern). The re-run applied
   **170 renames + 21 merges, 0 failures** (`kb/cred_rename_out/2026-07-09/`).
4. **Common Exhibit Titles re-grain (#719)** — headline card is now
   "Common Exhibit Titles" (~1,649 articulated) with the old group count as an
   "Issuer/type variants" breakdown; Statewide card → CCC common titles (~84);
   NEW kpi_history keys `common_titles`/`ccc_common_titles` (Session-88
   precedent — Trends deltas read "—" until the series accrues); EACR header
   leads with common titles (cards stay issuer/type grain);
   `tests/eacr_common_titles.test.js` guards it. Suite: **150 files green**.

## ── TASK 1 (mid-flight): carpentry pass 2 — Sam's clarified spec ──

Sam's screenshot showed the leftover "Carpenters Apprenticeship — …" rows with
blank SUBJ + blank Discipline. His asks:

1. Resolve the remaining course-numbered CTCNC exhibits from COCI and
   substitute the actual course title.
2. Set SUBJ on the carpentry apprenticeship rows — Sam suggests **"CARP"**,
   and clarified: **SUBJ is OUR synthetic 4-letter SUBJ4 scheme** (the CCR's
   M-ID alignment layer, CID/CCN-style), NOT a COCI local code — so the value
   is a convention choice, not a lookup.
3. Fill the blank Discipline — **"Construction Technology"**.
4. **Add a SUBJ Code filter** next to the Discipline filter in the CER bar.
5. Adjust artifacts/receipts to reflect the logic. He invited questions AND
   pushback.

### Findings already in hand (don't redo)

- COCI probe (`kb/reference/coci_course_list.xlsx`): "CARP" exists as a LOCAL
  subject only at Rio Hondo + Laney (Southwest JATC's southern partners,
  numbering 020H/040A–V/050A–D…). **None of the 19 skipped CTCNC numbers
  (002/005/017/019/101/109/284/310/312/315/605/608/701–713) exist under any
  COCI CARP row.** The CTCNC exhibits articulate to American River's `CARPT`.
  → The **12 no-articulation skips are unresolvable from COCI by number**
  (CARP numbering is CTCNC-internal). Possible salvage: Rio Hondo's CARP
  catalog carries the SAME course content under southern numbering ("Rigging"
  040K, "Basic Roof Framing" 040I, "Moldings and Trim" 040S…) — a
  content/title-match lane could resolve some, verify before writing.
- The 3 "Rigging" duplicates (019/312/608): renaming all three creates ONE
  credential (a fold) — ask Sam fold-vs-differentiate; fold = the
  confirm-merge flow, not plain renames.
- The already-renamed 113 derive SUBJ from their articulations' M-IDs — they
  display **CNST** (the CCR canonical SUBJ4 for Construction Technology from
  the Session-50 fold; drywall/millwright rows derive INDT/DRAF/MACH).

### The SUBJ decision — RESOLVED by Sam (2026-07-09, end of Session 109)

Sam: *"From CCR CARP is Carpentry and CNST is Construction Technology, so
whichever matches COCI best for these is fine."* COCI's local subjects for
this content are literally **CARP** (Rio Hondo + Laney) and **CARPT**
(American River) → **use `subj_override = "CARP"`** on the carpentry
apprenticeship family (a display-layer overlay fill; cohort
`carp-subj-s110@bot`). Verify first whether the CCR actually carries CARP as
a SUBJ4 (check `kb/discipline_canonical_subj4.json` for a Carpentry entry) —
if it does, consider also filling the articulated rows so the family reads
uniformly (they currently derive CNST/INDT); if not, CARP-on-the-CER-only is
what Sam approved, note it in the receipt. REMAINING open question for Sam:
fold the 3 "Rigging" rows (019/312/608) into one credential or keep separate.

### Build list

- **SUBJ filter** (`credential_reference.js`): input/datalist next to
  `#cr-disc-filter` over distinct `subjOf(r)`; `state.subjFilter` +
  `passesFilter` branch. **Check `subjOf(r)` consumes the overlay
  `subj_override`** (the in-cell SUBJ edit writes it; the derived `_subj`
  cache may bypass it) — wire if not. Tests: extend `tests/cer_v2_round3.test.js`
  or new file; keep the 150-file suite green.
- **Discipline fill**: `discipline_override="Construction Technology"` on
  carpentry-family rows where discipline is BLANK ONLY (articulated rows
  derive honestly — some are Industrial Technology; don't override). Receipted
  INSERT-only bulk (cohort `carp-disc-s110@bot`).
- **SUBJ fill** per Sam's pick (cohort `carp-subj-s110@bot`).
- **Titles**: only what the Rio Hondo/Laney content-match honestly supports;
  rest → receipt as unresolvable + Sam's in-cell judgment. Update
  `kb/carp_title_out/` + `docs/cer_v2_redesign_lessons.md`.

## ── Other live threads ──

- **Malone/MAP Export**: schema feedback lands in `map_export.js`'s one
  mapping function.
- **Common-titles deferred layer**: CPL Analytics per-college/discipline
  "Exhibits" columns + Top-50 still count raw ExhibitIDs (college custom
  reports quote them) — re-key only with Sam's nod.
- **CER queues**: 233-row issuer lane (200 prefilled) · 13 Military residuals ·
  5 apprentice review-only rows (BCOA + 4 Fire Service) · the 19 carpentry
  skips. `kb/cpl_todos.json` has the list.
- **Trends**: the two new rows show "—" deltas until history accrues (by
  design — tell Sam if he asks).

## Safety patterns to honor

- Bulk writes: fresh live read, INSERT-only ON CONFLICT DO NOTHING, cohort
  reviewer_email, committed receipt
  (`docs/kb-notes/methodology-live-curation-concurrency.md`). Sam curates LIVE
  beside you — his rows always win.
- kb_curation reads MUST be Range-paginated (#718;
  `docs/kb-notes/methodology-paginate-postgrest-reads.md`).
- kpi_history: never repurpose a key to a new grain — add a key.
- Merge on `unstable`; poll via MCP github tools (never curl); dispatch
  `daily-dashboard.yml` post-merge to publish generator changes.
- Sandbox can't reach *.supabase.co / github.io — Supabase via MCP, smoke via
  runners.

Moniker suggestion: **SkyGrain** — or claim your own.
