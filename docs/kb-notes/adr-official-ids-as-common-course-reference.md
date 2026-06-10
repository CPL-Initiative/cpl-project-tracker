---
title: ADR — Official C-ID/CCN ids are the common course reference; M-IDs only where none exists
created: 2026-06-10
updated: 2026-06-10
tags: [adr, c-id, ccn, m-id, merge, curation, identifier-precedence, honors]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-within-credential-identity-consolidation]]"
artifacts:
  - excel_to_dashboard.py (worklist anchor inclusion; _target_identity + _member_v descriptor-catalog resolution; anchor credit fill)
  - unified_courses.js (anchor ⚇ Merge pill; official-id default target; official-target write-skips; worklist precedence pick)
  - kb/_row_audit.py (anchor catalogs in the merge_into_orphan valid-target set)
---

# ADR — Official ids are the common course reference

> **Decision (Sam, 2026-06-10).** *"We only want to mint an M-ID if there is
> not an aligned C-ID or CCN. When there is, we rely on the C-ID or CCN as the
> common course reference."* Variant M-IDs **merge INTO** the official id; the
> M-ID disappears as a separate listing. Identifier precedence everywhere:
> **CCN > C-ID > M-ID** (§10).

## What this changed (all shipped 2026-06-10, PRs #341/#342)

1. **Worklist**: locked C-ID/CCN anchor rows join their title-signature groups
   as the canonical target, ranked first; Confirm merges the M-IDs into them.
2. **Merge dialog**: official anchors carry their own ⚇ Merge pill; the
   "Merge into" selector defaults to the official id when one is among the
   chosen (beating the seed row).
3. **Writes**: an official target gets ONLY `merge_into` pointers from its
   members — never `unified_title`/`discipline` curations (its record is
   authoritative). Its discipline on the merged row falls back to the
   member-unanimous aggregate.
4. **The full descriptor catalog is a target authority**: any of the 495
   C-IDs is a valid `merge_into` target even with no pre-existing CCR row
   (`_member_v`/`_target_identity` resolve `kb/reference/cid_descriptors.json`;
   the auditor's orphan rule accepts the same set). First use: the
   heritage-speaker folds into SPAN 220/230, which had no rows.

## The honors rule (researched, settled)

- **C-ID**: NO honors tier exists — 0 of 495 descriptors are H-suffixed, and
  no college has ever entered an H-suffixed `CIDNumber` in COCI. Honors
  variants bundle into the same descriptor **by C-ID's own design**
  (many-to-one, minimum-content); the honors members visible under e.g.
  SPAN 100 are the colleges' own official mappings. Do NOT invent `… 100H`
  C-IDs.
- **CCN**: honors ARE separate official listings (the `H` speciality
  identifier; 23 of 58 today) and the pipeline keeps them fully distinct —
  exact-string member joins (`ENGL C1000` ≠ `ENGL C1000H`).
- **M-ID land**: our fold keys treat "Honors" as a distinguishing token, so
  machine merges never bundle honors; honors M-IDs stay their own rows unless
  a curator decides otherwise.

## Why merge-into-official is safe

- C-IDs/CCNs are never re-keyed (external authorities, verbatim — Rule 7).
- The merge writes nothing on the official record; rollback = delete the
  members' `merge_into` rows.
- A merged official row renders **Generated until explicitly verified**
  (merge ≠ verify; the Verify affordance stamps `validated_at/_by`).

## See also
- `docs/ccr_cluster_cleanup_lessons.md` — Session 39 (the live-curation loop)
- `docs/kb-notes/methodology-within-credential-identity-consolidation.md` —
  the fold keys that keep honors/levels apart
