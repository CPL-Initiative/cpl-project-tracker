---
title: "CER ⇄ CCR crossover — course-identity integrations for exhibit-title curation"
date: 2026-07-07
kb-status: published
type: methodology
tags: [cer, ccr, rule-5c, course-identity, triage, integrations]
artifacts:
  - kb/_suggest_unclassified.py
  - kb/_preseed_unclassified.py
  - kb/_audit_exhibits.py
  - credential_reference.js
related:
  - "[[cpl-assistant-ccr-cer-recommendation-scope]]"
  - "[[reference-issuing-agency-authority-sources]]"
  - "[[methodology-cer-fold-articulation-ripple-sync]]"
---

# CER ⇄ CCR crossover — how the course-identity layer serves exhibit-title curation

Sam's question (2026-07-07): *"Could you have a think about the crossover with
CCR (when I'm assigning exhibit titles for Cx) and recommend any helpful
integrations?"* This note is the answer of record: what already exists, what
Session 104 shipped, and the ranked queue of what's worth building next.

## The principle

A **Cx / portfolio exhibit's identity IS a course identity** (skill Rule 5c):
its unified title should follow the CCR's identifier precedence —
**CCN title > C-ID descriptor title > (M-ID title once Sam declares the layer
stable) > plain course-content title**. So every Cx assignment the CER curator
makes is secretly a CCR lookup, and every CCR identity improvement (folds,
re-mints, C-ID promotions) should mechanically improve CER titles. The two
reference layers are one system with two doors.

## What already existed (before Session 104)

1. **The Rule 5c suggestion wire** — `kb/_suggest_unclassified.py` (daily cron)
   joins parsed course codes to the COCI universe and emits
   `kb/unclassified_suggestions.json`; the worklist renders 💡 one-click fill
   chips (CCN > C-ID > COS authority > modal course title). Never auto-applied.
2. **`title_anchor` stamping** — the fold stamps `{system, id}` on entries whose
   assigned title matches a CCN/C-ID suggestion, so a future re-key can ripple
   CER titles mechanically.
3. **The M-ID gate** — the suggestion ladder's tier 3 is deliberately OFF
   (`--with-mids`) until the M-ID layer is declared stable.

## What Session 104 shipped

1. **Mechanism-strip before code parsing** (`_suggest_unclassified.py`):
   `'Credit by Exam ACCTG 022 …'`-style titles hid their code behind the
   mechanism phrase, so the leading-code parser never fired. Coverage
   **19 → 39 rows** in one change (reuses the pre-seed lanes' `_CX_*` patterns —
   one definition, no drift).
2. **College-scoped COCI joins.** The exhibit auditor now stamps the
   **originating college(s)** on every unclassified card (the CustomReport
   "College" column — previously dropped), and the suggestion builder prefers
   the `(College, SUBJ, NUM)` join over the globally-ambiguous `(SUBJ, NUM)`
   key. This removes the unanimity-gate misses: the originating college's OWN
   catalog row decides the title/CCN/C-ID, falling back to the global view.
   The same data powers the worklist's **college chips**.
3. **CPL-Type routing in the pre-seed** (`stage_cx_type`): rows whose MAP CPL
   Type is Credit By Exam / Portfolio Review but whose titles carry no
   mechanism phrase (the Mt. SAC batch) now stage as course-content titles +
   CCC issuer.

## Ranked recommendations (not yet built)

1. **Wire `build_coci_index` into the pre-seed cx lanes.** `stage_cx`/
   `stage_cx_type` currently title rows from the leftover raw text (conf 0.75);
   the 💡 chip on the same row may carry a better CCN/C-ID/COCI title. Feeding
   the identity resolution into the staged title (with the college-scoped join)
   would make "Save all pre-filled" save identity-grade titles. Cheap — both
   scripts are in `kb/`, the index builder is importable.
2. **An existing-family dedupe chip via the aligned inverse view.**
   `unified_courses_aligned.js` maps course identity → credentials already
   articulated to it. For a Cx row whose parsed code resolves to an identity
   that ALREADY has an aligned credential, the worklist could warn "this course
   already has credential X" — catching would-be duplicate families before they
   mint. Medium cost (new join in the suggestions builder; consumer chip).
3. **CCR merge-workspace hook for Cx families.** When a CER fold mints a
   course-content family, offer it to the CCR Suggested-merges worklist as a
   candidate member of the matching course identity — the two curation surfaces
   converge on one identity graph. Larger; needs a scope note before building.
4. **M-ID tier unlock.** When Sam declares the M-ID layer stable, flip
   `--with-mids` on in the cron and extend the same tier to `stage_cx*`. Zero
   new code beyond the flag — the plumbing is ready.
5. **Client-side CCR index search in the worklist** (heaviest, optional):
   lazy-load `CPL_UC_INDEX` (3.9 MB) for free-text course lookup beyond parsed
   codes. Only worth it if curators ask for it — the 💡 chips + college chips
   cover the observed need.

## Guardrails

- Never auto-apply: chips fill inputs; the curator's click saves (the standing
  worklist pattern).
- The M-ID tier stays gated until the layer is declared stable (Rule 5c).
- Never emit a suggestion from an `over_merged`-flagged identity.
- Artifact policy: code-only PRs; the cron publishes regenerated JSON.
