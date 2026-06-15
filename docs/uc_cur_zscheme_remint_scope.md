---
title: UC-CUR → Z-scheme re-mint — scope
date: 2026-06-15
session: 55 (data lane) · dry-run built Session 56 (Star Treader)
status: DRY-RUN BUILT (Session 56) — mechanically ready, 7/7 gates pass; awaiting Sam's sign-off before apply (Rule 7)
tags: [remint, uc-cur, z-scheme, identity, rule-7, scope]
artifacts:
  - kb/_uc_cur_zscheme_dryrun.py (the dry-run planner — compute_plan() shared with the future apply)
  - kb/uc_cur_zscheme_out/2026-06-15/ (the dry-run receipt — alias_map.json + zseq_seed.json + report.md + collisions.json + supabase_ops.sql)
  - tests/uc_cur_zscheme_dryrun_test.py (allocator self-test)
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
**ADOPTED (B)** (Session 56) to honor "MID number format," with the counter
seeded from the re-key's deterministic title-sort assignment (`zseq_seed.json`).
See **Dry-run results** below for the client-mint placeholder mechanism.

## Rule-7 dry-run plan

1. ✅ **BUILT (Session 56).** `kb/_uc_cur_zscheme_dryrun.py` reads the 4,053
   targets + their members, derives `(SUBJ4, band)` per target, assigns
   `Z<band><seq:03d>` by normalized-title sort, and emits the receipt under
   `kb/uc_cur_zscheme_out/2026-06-15/` (alias_map.json + zseq_seed.json +
   collisions.json + supabase_ops.sql + report.md). `compute_plan()` is the
   SHARED pure allocator the apply will import (apply == spec).
2. Present the dry-run to Sam. **Do NOT apply** without sign-off (restamp the
   receipt `_status` on apply).
3. Apply (`kb/_uc_cur_zscheme_apply.py`, NOT yet built): fresh-read `kb_curation`,
   re-key the 4,053 `course_id` rows + 10,682 `merge_into` values, write the
   persisted counter, stamp `_zscheme_from`, V-validate against the alias map,
   atomic land in one cron window.
4. Ship the code recognition/mint changes in the SAME window so new mints use Z
   and the auditor reads Z as on-scheme.

### Dry-run results (2026-06-15, Session 56) — 7/7 gates pass

| metric | value |
|---|---|
| UC-CUR targets → Z-ids | **4,053 → 4,053** (no drops) |
| `merge_into` pointers re-pointed | **10,682** |
| Downstream refs (articulations / promotions) | **0 / 0** (confirmed — re-key stays inside `kb_curation`) |
| (SUBJ4, band) cohorts | **226** · credit (band 1) 3,584 · noncredit (band 9) 469 (**0** mixed) |
| Max cohort size | **199** (`KINE` band 1) → `seq:03d` cap 999, **0** overflow |
| Z-id collisions (vs existing ids / each other) | **0 / 0** |

**SUBJ4 derivation** (new-mint convention — canonical SUBJ4 of the members'
modal discipline, with the umbrella exception): 3,649 `canonical_discipline`,
387 `umbrella_member_s4` (FL/KIN splits preserved — NOT collapsed to FLNG/KINE),
13 `member_s4` (blank/out-of-map discipline), 4 `padded_fallback` (the
genuinely-undisciplined short-code tail — `AFXX`/`ATXX`/`DBAX`, flagged for
curation). Validation: all 4-letter, all unique, all aliased, band-pure,
no overflow, alias invertible (rollback handle).

**Persisted-counter decision — option B ADOPTED.** The apply drops
`zseq_seed.json` in as `kb/uc_cur_zseq.json` (per-(SUBJ4, band) high-water seq);
server-side allocators read+increment it so existing ids never renumber.
Client-side `doConsolidate` keeps minting a transient `UC-CUR-EXT<ts>`
placeholder that the daily generator promotes to a clean Z via the counter — so
the shared recognition helper matches BOTH `^[A-Z]{2,4} Z\d` and `^UC-CUR-`.

## Guardrails

- Bands never cross. C-IDs/CCNs verbatim (only the synthetic Unified tier gets Z).
- The alias map is the rollback handle (delete-by-cohort like the auto-merge).
- Z is a MAP surrogate, **not** a CCN/CID claim — document loudly (same as M).
