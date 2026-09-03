---
title: Z-band retirement — DRY-RUN (items 20 and 21 of 2026-09-03)
date: 2026-09-03
session: 224 (SkyTune)
status: APPLIED 2026-09-03T20:19:27Z — see validation.md; the readings were ruled yes to all on 2026-09-03 (materialized, card 12)
tags: [remint, dry-run, z-scheme, m-id, identity, rule-7]
artifacts:
  - kb/zband_retire_out/2026-09-03/alias_map.json
  - kb/zband_retire_out/2026-09-03/capacity.json
  - kb/zband_retire_out/2026-09-03/duplicates.json
  - kb/zband_retire_out/2026-09-03/supabase_ops.sql
related:
  - kb/csr_authority_codes_rulings_2026-09-03.json
  - docs/uc_cur_zscheme_remint_scope.md
  - docs/coursecontrolnumber_remint.md
---

# Z-band retirement — DRY-RUN

## TL;DR

- **4,053** Z identities become M identities in their own (SUBJ4, band) buckets (credit 3,584, noncredit 469); **10,704** `merge_into` pointers re-point with them. Their lineage becomes the row attribute `origin: machine cluster` (item 20).
- **218** legacy `M-ID SUBJ ###` anchors from kb/common_courses.json become `SUBJ M####` (11 corroborated, digits) or `SUBJ M##XX` (207 single-college, letters) under their discipline's canonical code; **254** kb/course_crosswalk.json references re-point (item 21).
- Computed AFTER the authority recode (kb/authority_recode_out/2026-09-03).
- Validation: **7/7** gates pass; 3 legacy anchors wait for a discipline the seed knows (listed below).
- Why gap-fill: 3,836 of the Z numbers are already M numbers in the same bucket, and a merged-away member keeps its id forever, so the collision surface is every catalog key. The receipt is the rollback handle (read right-to-left).

## Gates

| gate | pass | detail |
|---|---|---|
| V1_every_z_aliased_and_blocked_anchors_listed | ✅ | {"moves": 4271, "aliased": 4271, "blocked_anchors": 3} |
| V2_new_ids_unique | ✅ | {"duplicates": []} |
| V3_new_ids_disjoint_from_every_existing_key | ✅ | {"collisions": []} |
| V4_alias_invertible | ✅ | {} |
| V5_m_shape | ✅ | {"bad": []} |
| V6_no_overflow | ✅ | {"overflow": []} |
| V7_z_refs_only_in_curation | ✅ | {"note": "0 Z references in the catalog, memberships, articulations, promotions (measured 2026-09-03)"} |

## ⭐ Capacity — the finding

The corroborated M numbers run 001–999 per subject and band, and every id ever minted stays reserved. The buckets this fold fills most:

| bucket | used before | added | free after |
|---|---|---|---|
| KINE M1 | 797 | 199 | **3** |
| ARTS M1 | 505 | 157 | **339** |
| MUSI M1 | 548 | 120 | **352** |
| ITIS M1 | 481 | 163 | **366** |
| BUSI M1 | 440 | 85 | **477** |
| DANC M1 | 394 | 126 | **486** |
| FIRE M1 | 390 | 88 | **521** |
| ATHL M1 | 365 | 88 | **546** |

A bucket under ten free numbers has no room for the next corroborated mint. The apply must carry a rule for the day a bucket fills — the natural one is a continuation band digit for credit (`M2###`, the band being non-semantic today by §10) — **a reading for Sam** before Kinesiology credit reaches its ceiling.

## Item 21 — the legacy anchors

218 anchors, reviewed by Sam on 2026-05-20 as the curated common-course draft; 130 of them share a title and discipline with an identity already in the catalog (duplicates.json) — after the fold they are a curator's merge worklist, and the fold itself does not merge anything.

Not folded — the anchor's discipline is not in the seed, so it has no canonical code yet (a curator gives it one of the 146 MQ disciplines, then the next run folds it):

- `M-ID HOSP 100` · 'Travel Services'
- `M-ID HOSP 102` · 'Hotel and Motel Services'
- `M-ID HOSP 104` · 'Travel Services'

## The design question the apply must settle (NEEDS SAM)

After the re-key these identities are M-ids that live ONLY in the curation overlay — the same place the Z ids live today. Two ways to carry them:

1. **Stay curation-only, recognized by shape.** The CCR tab and the export already read a row-less `SUBJ M####` merge target as an M-ID; `origin: machine cluster` rides on the curation row. Smallest change; the identity still has no catalog record.
2. **Materialize into the minted catalog.** Write each one as a real M-ID record (title, discipline, members) so the generator, the auditor and SkyView carry it like any other. The honest end state of "everything that isn't a CID or CCN is a MID", and a bigger apply.

The dry run plans the ids either way; say which, or the apply defaults to 1 and files 2.

## Apply procedure (not run here)

1. The authority recode applies first (its own pull request), then this planner is re-run with --after-recode against the fresh state and its alias map asserted equal to this receipt.
2. Git side: kb/coci_curation.json keys + merge_into pointers; kb/common_courses.json keys (+ an `origin` field); kb/course_crosswalk.json course_id values; retire kb/uc_cur_zseq.json.
3. Same window: Supabase kb_curation re-key from the receipt (supabase-rekey.yml with a generic verify — today's verify counts UC-CUR rows only), then kb/_post_apply_chain.py.
4. Code that knows the Z shape changes with it (grep `Z_ID_RE`, `[MZ]`, `Z\\d{4}`):

- kb/_row_audit.py Z_ID_RE + id_in_scheme + the merge_into / cluster rules (Z becomes M)
- unified_courses.js: the `/\sZ\d{4}\b/` recognition in applyMergeLocal and the `[MZ]` band regex
- excel_to_dashboard.py: `_target_identity` and the Unified id_system for row-less targets (origin attribute)
- kb/_auto_merge_worklist.py + the client mint: new machine clusters mint M ids from a counter, never Z
- kb/_rekey_kb_curation_supabase.py: verify by the alias map's old keys, not `UC-CUR-*`
- kb/_build_ccr_universe.py `s` mapping and prototype/ccr_universe.js SYS: the fourth system retires
- tests/uc_zscheme_recognition.test.js, tests/uc_cur_zscheme_dryrun_test.py: pin the new shape
- kb/_rekey_promotions.py ALIAS_MAPS: register the apply receipt (0 promotions refs today, kept for the era chain)
