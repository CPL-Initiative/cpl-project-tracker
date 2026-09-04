---
title: Land a re-mint by rehearsal and a fresh read, then read the numbers it moves
created: 2026-09-03
updated: 2026-09-04
tags: [methodology, remint, rule-7, rule-10, supabase, curation, ccr, identity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/coursecontrolnumber_remint]]"
  - "[[docs/kb-notes/methodology-a-code-change-is-a-prefix-rekey-not-a-resequence]]"
artifacts:
  - kb/_authority_recode_apply.py
  - kb/_zband_retire_apply.py
  - kb/_apply_curation.py
  - kb/_rekey_kb_curation_supabase.py
---

# Land a re-mint by rehearsal and a fresh read, then read the numbers it moves

**The claim.** A re-mint apply is proved three times before it touches the
tree, and its post-land counts are read as worklists rather than as defects.
Three practices from the 2026-09-03 land of the authority recode and the
Z-band retirement (Sessions 223 and 224).

## 1. Rehearse on a scratch copy of `kb/`

The apply scripts resolve every path from their own directory, so a copy of
`kb/` (and `tests/`) under the scratchpad runs unchanged. Register the receipts
in that copy's `ALIAS_MAPS`, derive a `fresh.json` from the committed overlay,
run each apply with `--apply` there, then the offline post-apply chain
(promotions, csr-seed, authority, audit, fold-verify). On 2026-09-03 the
rehearsal caught that the retirement can only be verified **after** the recode
is applied (the recode frees `AGPR M1003`, which the retirement then takes) and
printed the numbers the real land had to match: 10,296 and 4,271 aliases,
19,568 minted records, no Z key or pointer left. The real run matched them
line for line.

## 2. The fresh read counts the sync's own fields

Rule 10's fresh read at write-time needs no export of thousands of rows. Two
numbers suffice: `count(distinct course_id)` and `max(reviewed_at)` over the
overlay fields, compared with the committed overlay's entry count and newest
`reviewed_at`. The trap is the field list. `kb/_apply_curation.py` folds
**seven** fields (`discipline`, `merge_into`, `unified_title`, `description`,
`cross_listed_disciplines`, `merge_dismissed`, `merge_note`); the June apply's
copy had five. Counted on five, Supabase read 30,688 against the committed
30,694 and looked like six deletions. A prefix drill-down (one, four, eight,
nine characters) named them: `PARN M9003`, `M9004`, `M9015` and three more,
every one a `merge_dismissed`-only entry. Counted on seven, the numbers were
equal. The apply now imports `FIELDS` from the sync module instead of copying
it.

## 3. Read the post-land numbers as worklists

The fold planner's re-key count moved from 148 to 285 and the audit's
`subject_collision_signal` from 0 to 153. Neither is the apply misbehaving:
139 of the materialized records sit on the prefix their machine cluster was
minted under in June (`ITIS`, `HVAC`, `ARTS`, `THTR`) while their members'
discipline now owns a different canonical code (`COMP`, `CNST`, `ARTH`,
`MUSI`). Before the retirement those clusters lived only in the overlay, where
no planner could see them. Materializing them (Sam's card 12) made a latent
inconsistency visible, which is the point of materializing. The next
keep-number prefix re-key is their fix, and the audit tags are its worklist.

A design choice sits underneath: a materialized record carries the members'
aggregate (title, discipline, units, colleges) but **no membership entry of its
own**, so no college course is counted twice; the members keep their records
and their `merge_into` pointers.

## 4. The verify must know the shape of the map

An alias map can CHAIN: one pair's old key is another pair's new key. The
2026-09-03 recode carried `ARME M10AJ → FLNG M10AJ` (a residual Foreign
Languages record on the ARME prefix since June) beside `ARMN M10AJ → ARME M10AJ`
(an Armenian record moving onto the ruled code). The collision surface forbids a
target that already exists, but the same map can vacate one, so old and new
keys are not disjoint. The Supabase re-key applied every pair, then failed its
own verify with "2 old keys left" — the two chained keys, carrying exactly the
rows the map had put there. Two rules follow. Apply a chained map
**vacate-first** (the pair that empties the shared key runs before the pair that
fills it; a swap has no safe order without a temporary key, so abort). Verify
over the old keys that are **not also new keys**, and name the chained ones.
`kb/_rekey_kb_curation_supabase.py` does both since #1455, and
`kb/_prefix_fold_dryrun.py`'s V9 fails only on a swap cycle. Reading the
leftover count also needed the second receipt in hand: after both re-keys, 33
more "old" keys were present on the table — numbers the Z-band retirement had
minted after the recode freed them — and the landed overlay carried the same
keys. A verify is written against the shape of the maps it follows, not
against the assumption that keys move once.

## Where it lives

`kb/_authority_recode_apply.py` and `kb/_zband_retire_apply.py` (P1 fidelity,
P3 freshness, the conservation gates); `kb/authority_recode_out/2026-09-03/`
and `kb/zband_retire_out/2026-09-03/` (the receipts, `validation.md`,
`materialized.json`, `picks_before.json`); `docs/ccr_atlas_lessons.md`
§2026-09-03 for the story.
