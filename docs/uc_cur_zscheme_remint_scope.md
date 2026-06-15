---
title: UC-CUR → Z-scheme re-mint — scope
date: 2026-06-15
session: 55 (data lane)
status: scope — dry-run NOT yet built (Rule 7: scope before build)
tags: [remint, uc-cur, z-scheme, identity, rule-7, scope]
artifacts:
  - kb/coci_curation.json (the re-key surface)
  - kb/_auto_merge_worklist.py (UC-CUR-AUTO mint site)
  - unified_courses.js (mint + recognition sites)
  - excel_to_dashboard.py (_target_identity recognition)
  - kb/_row_audit.py (UC-CUR recognition sites)
related:
  - docs/coursecontrolnumber_remint.md (the canonical re-mint playbook)
  - docs/kb-notes/methodology-alias-map-resolution-semantics.md
  - CLAUDE.md Rule 7 (re-mint discipline) + §11 lifecycle (uc_cur_ripe_for_promotion)
---

# UC-CUR → Z-scheme re-mint — scope

**Decision (Sam, 2026-06-15):** rename the synthetic `UC-CUR-*` unified-course
ids to a **`SUBJ Z<band><seq>`** scheme (e.g. `BIOL Z9001`) — **full re-key of
all existing ids**, not future-mints-only. This is a Rule-7 re-mint: dry-run
first, alias map committed, fresh-read at write-time, atomic land in one cron
window. **No code has been changed yet** — this doc is the "scope before build."

## Why a Z-scheme

`UC-CUR-AUTO01C890D03` is long, opaque, and gives no signal that the row is a
curator/auto **mint that still needs faculty attention** (it has no official id;
it's a candidate for promotion to a real M-ID/C-ID — see §11
`uc_cur_ripe_for_promotion`). The Z-scheme:

- **Leads with `Z`** in the Course-Type-Identifier position, exactly paralleling
  CCN's `C` and our minted `M` (§10). **`Z` = curator-minted Unified course,
  needs attention.** Unmistakably ours, can't collide with a CCN `C####` or a
  minted `M####`.
- **`SUBJ`** = the 4-letter SUBJ4 (modal/canonical subject of the merged members;
  use the same canonical-SUBJ4 source the M-ID fold used,
  `kb/discipline_canonical_subj4.json`, when the members carry a discipline;
  else the members' modal `subject_4letter`).
- **`<band>`** = credit band like the M-IDs: `9` noncredit / `1` credit (from
  `credit_status`). Honest with data we hold (§10 "banding basis = credit_status").
- **`<seq:03d>`** = stable, deterministic, **persisted** sequence per `(SUBJ4,
  band)`, assigned by sorting the cohort by normalized title (same discipline as
  the M-ID minting — codes must not churn each regen).

`id_system` STAYS **`Unified`** (these are curator mints, not corroborated
M-IDs). The Z-format is the pre-promotion identity; promotion to a real M-ID/C-ID
still follows the lifecycle.

## Re-key surface (measured 2026-06-15)

| Thing | Count | Action |
|---|---|---|
| Distinct `UC-CUR-*` targets | **4,053** (all `UC-CUR-AUTO*`) | → new `SUBJ Z<band><seq>` |
| Self-keyed curation rows (`course_id` == a UC-CUR id) | **4,053** (each: `unified_title` + `reviewed_by` + `reviewed_at`) | re-key `course_id` |
| Member `merge_into` pointers → a UC-CUR id | **10,682** | re-key the `value` |
| Articulations (`coci_articulations.json`) referencing UC-CUR | **0** | none |
| `kb/promotions.json` referencing UC-CUR | **0** | none |

So the entire re-key is **inside `kb_curation` / `kb/coci_curation.json`** (~14.7k
rows) — no articulation or promotions re-key. That's a meaningfully smaller blast
radius than the M-ID re-mints.

## Code touch points (scheme recognition / mint)

1. `unified_courses.js`
   - mint: `"UC-CUR-" + Date.now()…` (manual curator mint, ~line 992) and
     `"UC-CUR-EXT" + …` (member re-home, ~1125) → Z-format mint.
   - recognition: `/^UC-CUR-/` in `applyMergeLocal` (~908) → also match `Z`-ids.
   - The override picker (#436) and `_target_identity` mirror need the same regex.
2. `kb/_auto_merge_worklist.py` — `"UC-CUR-AUTO" + md5(sig)[:8]` (~line 199) →
   Z-format with a deterministic per-`(SUBJ4,band)` counter (persisted).
3. `excel_to_dashboard.py` — `_target_identity()` (~6715) UC-CUR recognition.
4. `kb/_row_audit.py` — UC-CUR recognition (~265, 1095, 1173) for
   `cluster_id_off_scheme` / `uc_cur_ripe_for_promotion`. The Z-ids are
   ON-scheme, so `cluster_id_off_scheme` should NOT fire on them post-re-mint —
   re-tune the off-scheme test to flag only NON-Z synthetic ids.

A **shared recognition helper** (one regex, `^…\sZ\d` or `/^UC-CUR-/`) used by
all sites avoids drift — add it once.

## Sequencing note — the auto-mint vs the persisted counter

Today `UC-CUR-AUTO` ids are content-addressed (`md5(sig)`), so they're stable
without a counter. The Z-scheme's banded `<seq>` needs a **persisted per-(SUBJ4,
band) counter** (a new `kb/uc_cur_zseq.json` or a column in the singletons file),
or the daily auto-merge would re-number on every run. Two options:
- **(A)** keep content-addressing but render it as `SUBJ Z<band><hash6>` —
  deterministic, no counter, but not a clean sequence.
- **(B)** persist a counter (matches the M-ID minting; cleaner numbers, but the
  apply must write the counter state atomically).
**Recommend (B)** to honor "MID number format," with the counter seeded from the
re-key's deterministic title-sort assignment.

## Rule-7 dry-run plan (the build, NOT yet done)

1. `kb/_uc_cur_zscheme_dryrun.py` — read the 4,053 targets + their members,
   derive `(SUBJ4, band)` per target (modal member subject + credit band), assign
   `Z<band><seq:03d>` by normalized-title sort, emit:
   - `kb/uc_cur_zscheme_out/<date>/alias_map.json` (old UC-CUR → new Z),
   - a collision check (no two targets get the same Z; Z never collides with an
     existing M-ID/CCN — different CTI letter guarantees it),
   - `report.md` with counts + samples + the per-(SUBJ4,band) histogram.
2. Present the dry-run to Sam. **Do NOT apply** without sign-off (restamp the
   receipt `_status` on apply).
3. Apply (`kb/_uc_cur_zscheme_apply.py`): fresh-read `kb_curation`, re-key the
   4,053 `course_id` rows + 10,682 `merge_into` values, write the persisted
   counter, V5-validate against the alias map, atomic land in one cron window.
4. Ship the code recognition/mint changes in the SAME window so new mints use Z
   and the auditor reads Z as on-scheme.

## Guardrails

- Bands never cross. C-IDs/CCNs verbatim (only the synthetic Unified tier gets Z).
- The alias map is the rollback handle (delete-by-cohort like the auto-merge).
- Z is a MAP surrogate, **not** a CCN/CID claim — document loudly (same as M).
