---
title: "Session 111 handoff — carpentry folds await Sam's ✓, the identities-map producer fix, COCI Lookup polish"
date: 2026-07-09
tags: [handoff, session-111, cer, coci-lookup, identities-map, carpentry]
artifacts:
  - kb/carp_fill_out/2026-07-09/
  - coci_lookup.js
  - kb/_build_coci_lookup.py
  - excel_to_dashboard.py
related:
  - "[[cer_v2_redesign_lessons]]"
  - "[[methodology-rekey-derived-identity-maps]]"
superseded: true
superseded_by: session_132_handoff.md
---

You are **Session 111**. Session 110 closed the carpentry pass live alongside
Sam (he supplied the decisive MAP export mid-session) and shipped two builds.
Read `docs/cer_v2_redesign_lessons.md` (S110 section) first.

## What shipped in Session 110

1. **Carpentry queue CLOSED (receipts `kb/carp_fill_out/2026-07-09/`).**
   - 126 × `subj_override=CARP` + 126 × `discipline_override=Carpentry`
     (cohorts `carp-subj-s110@bot` / `carp-disc-s110@bot`): the 12
     zero-articulation queue rows, 104 CNST-deriving CTCNC family rows
     (Sam's screenshot call), 10 blank trade-program rows (flagged in the
     receipt — spot-review Drywall Applicator et al.).
   - 18 × `unified_title_override` (cohort `carp-title-s110@bot`) derived
     from Sam's MAP "Collaborative Exhibits" export (committed in the receipt
     dir; rule: Credit Recommendation minus the "N hours in " prefix). The 3
     Riggings (019/312/608) are all just "Rigging" in MAP — trade-band lanes
     (0xx carpenter · 3xx scaffold · 6xx), fold-vs-keep is Sam's ✓.
   - Still ambiguous (NOT written): CARP 707/710/713 + CTCNC Work Experience
     (two distinct credit recs each in MAP).
2. **The identities-map find** (Sam: "where does CARP 1203 come from?"):
   `kb/coci_articulations.json` → `identities` was never re-keyed by the
   2026-06-12 fold (slot reuse) — 681/693 catalog-shared keys described the
   PRE-fold occupant. Generator-side fix in `export_credential_reference()`
   (minted catalogs replace identities on overlap). KB note:
   `docs/kb-notes/methodology-rekey-derived-identity-maps.md`.
3. **CER SUBJ filter** (datalist beside Discipline, override-aware) +
   **COCI Lookup tab** (`#coci-lookup`: 141,738 rows, M-ID/C-ID/CCN chips,
   sortable/filterable/drag-resizable, desc shards, ⬇ CSV; builder
   `kb/_build_coci_lookup.py`; Reference & Curation nav group). Suite 152.

## ── Trail Crew 🥾 (LANDED after this handoff was first written) ──

Sam commissioned + named the CER canon audit; it ran end-to-end (S110 close):
`kb/_trail_crew.py` (method) → `kb/_trail_crew_magic.workflow.js` (magic — 15
adjudicators + 13 merge skeptics) → `kb/_trail_crew_assemble.py` →
`kb/trail_crew_out/2026-07-10/` (findings/adjudicated/staged_fixes/report).
Lanes awaiting Sam: 105 clean renames (fire-ready) · 18 merge candidates ·
7 issuer canon picks · 7 judgment calls. FIRING is Sam-authorized only — the
standing bulk-write pattern (fresh read, INSERT-only, cohort, receipt); issuer
canon fixes are guarded UPDATEs of curator-authored rows (per-cluster nod).
Playbook + scaling strategy: `docs/kb-notes/playbook-trail-crew-method-magic-audit.md`.

**Sam's sequencing call (2026-07-10): CSR pass FIRST** ("they are used to mint
MIDs… the CSR, CCR, CER constitute the heart of our ability to scale CPL
statewide then nationwide") — ~148 curator-reviewed entries, the key-generating
layer; include the official-CCN-subject collision check (`ccn_courses.json`
carries real ENGL/PSYC/STAT codes — our synthetic SUBJ4s must not
semantically squat on official subjects). Then the CCR mountain in
leverage-ordered waves (articulated identities first). SUBJ4 re-keys stage
evidence only — applies are Rule-7 re-mints.

## ── Priority queue ──

1. **Watch the carpentry folds land.** The 18 renames + collision folds ride
   the next PR-5b rename apply; the merge-confirm collisions (Rigging ×3,
   Blueprint Reading-Residential ×3, 017/310/315/704 existing-key) sit in the
   CER **⇒ Merge confirms lane awaiting Sam's per-row ✓**. After his pass +
   the apply, re-verify the family reads clean (SUBJ CARP · Carpentry · real
   titles) and close the receipt with a validation note.
2. **Producer-side identities fix.** Add the `identities`-map rebuild (or
   alias-map re-key) to `kb/_post_apply_chain.py` so the NEXT fold can't
   recreate the staleness; then the consumer-side preference becomes belt +
   suspenders. Also stale there: `colleges_offering` / `subject_spread` /
   `over_merged` (the last feeds `_build_statewide_prescriptive()`).
3. **COCI Lookup follow-ups (Sam feedback pending):** cross-tab deep-links
   (the tab already consumes `sessionStorage.cpl_coci_focus`) — e.g. a chip
   on CER drawers jumping to the M-ID's COCI rows; maybe a description
   search (needs shard preload); Obsidian vault exclusion for
   `coci_lookup_*.js` (Sam-side Files & Links setting).
4. **Standing lanes:** the 233-row issuer lane (200 prefilled) · 13 Military
   residuals · 5 apprentice review-only rows · CCR Convergence doctrine pass
   (`docs/ccr_convergence_handoff.md`).

## Safety patterns to honor

- Bulk writes: fresh live read → INSERT-only ON CONFLICT DO NOTHING → cohort
  reviewer_email → committed receipt. Sam curates LIVE; his rows always win.
- kb_curation reads MUST be Range-paginated (#718).
- Merge on `unstable`; poll CI via MCP github tools; dispatch
  `daily-dashboard.yml` post-merge for generator changes.
- Sandbox can't reach *.supabase.co / github.io — Supabase via MCP.
- The COCI data files are STATIC (like `tmc_college_courses.js`) — never add
  them to the daily `git add` list; rebuild only on a fresh COCI extract.

Moniker suggestion: **SkyJoiner** — or claim your own.
