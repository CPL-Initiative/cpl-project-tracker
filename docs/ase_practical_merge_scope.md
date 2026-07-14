---
title: "ASE '(with Practical Assessment)' credential merge — pilot scope"
date: 2026-07-14
tags: [scope, credential-merge, ase, automotive, cer, doctrine, starrunner]
artifacts:
  - .claude/skills/exhibit-canonicalization/SKILL.md
  - kb/_cred_rename_dryrun.py
  - .github/workflows/cred-rename-apply.yml
related:
  - "[[methodology-confirmed-merge-via-decision-row]]"
  - "[[cpl_pathways_lessons]]"
---

# ASE "(with Practical Assessment)" credential merge — pilot scope

First-of-its-kind CER **credential merge** (as opposed to the CCR's M-ID *course*
convergence). Motivated by the CPL Pathways adoption-pool count reading inflated
for Automotive (TOP 0948, 87 credentials). StarRunner, 2026-07-14; ratified by
Sam ("Yes to all. Great adjustments!").

## The finding (why the count was high)

Classifying all 87 automotive credentials showed the count is **mostly
legitimate**, not junk-redundant:

| Layer | Count | Verdict |
|---|---|---|
| ASE single certs (A1–A9, L1–L4, G1…) | 16 | keep — distinct per Rule 8b |
| ASE bundles (A2+A3, Master…) | 11 | keep — multi-competency |
| Local Cx course-content titles | 24 | keep — a local course-Cx ≠ the ASE cert (different CPL basis) |
| `(with Practical Assessment)` variants | 10 | **MERGE** → base cert |
| `Automative *` typos / mis-issuers | ~8 | hygiene follow-up (held) |

## Doctrine ratified (now Rule 8c in the canonicalization skill)

1. Mechanism / assessment-method qualifiers (`(with Practical Assessment)`, …)
   **collapse** into the base credential (Rule 2 on a suffix).
2. Industry certification vs local course-Cx is a **split, not a merge** — the
   CPL basis is the splitting axis (refines Rule 4). This is why the automotive
   count legitimately stays large.
3. Narrower competency (`Brake Inspection`) does **not** fold into the broader
   cert (`ASE A5 — Brakes`).
4. Typos / mis-issuers (`Automative *`) get a **per-row hygiene pass**, not a
   competency fold — **held** as a follow-up (needs per-row ASE-vs-local
   judgment; deliberately not bundled into this pilot).

Doctrine note recorded in Supabase `merge_doctrine_notes`
(lane `title`, stance `merge_partial`, reviewer `ase-practical-merge@bot`).

## What was applied (this pilot)

The **10** `ASE X (with Practical Assessment)` → `ASE X` merges:

`A1 Engine Repair` · `A2 Automatic Transmission/Transaxle` ·
`A3 Manual Drive Train and Axles` · `A4 Suspension and Steering` ·
`A5 Brakes` · `A6 Electrical/Electronic Systems` ·
`A7 Heating and Air Conditioning` · `A8 Engine Performance` ·
`G1 Auto Maintenance and Light Repair` · `L1 Advanced Engine Performance Specialist`.

- **Staged** as `kb_curation` `_CREDENTIAL_REVIEW::<variant>` rows —
  `unified_title_override` + `unified_title_merge_confirm` = the base cert,
  reviewer `ase-practical-merge@bot`, INSERT-only `ON CONFLICT DO NOTHING`
  (Rule 9 fresh read + pending-merge cross-check: **0 overlap** with the 14
  pending Carpenters/Medical/Spanish merges).
- **Verified** via `kb/_cred_rename_dryrun.py`: all 10 classify as confirmed
  merges, `apply_safe=true`, 0 collisions.
- **Applied** via the `cred-rename-apply.yml` workflow (manual dispatch), which
  folded the records + re-keyed and migrated the Supabase rows. The dispatch
  also flushed the rest of the curator queue then pending (103 clean renames +
  13 other confirmed merges — Sam: "flush away").

Merges are **not swap-reversible** (dedupe drops records) — the frozen
`alias_map.json` under `kb/cred_rename_out/<date>/` + git history are the
rollback basis.

## Follow-up (open)

- **`Automative *` typo/mis-issuer cluster** (~8 rows, issuer wrongly = ASE on
  local `Auto NNN Completion` Cx exhibits): per-row hygiene — fix spelling +
  correct issuer to CCC, keep the local-Cx identity. Each needs a quick
  ASE-cert-vs-local-course read before staging.
- **Generalize Rule 8c-1** beyond automotive: any `(with Practical Assessment)`
  / assessment-method suffix in other families is now a fold candidate.
