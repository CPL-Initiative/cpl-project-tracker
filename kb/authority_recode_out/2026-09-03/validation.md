# Authority recode — APPLY validation receipt

- applied: `2026-09-03T20:19:16Z`
- aliases: **10,296**
- P1 plan fidelity: recomputed == frozen ✓
- P3 curation freshness: fresh read matches the committed overlay (30694 entries, newest 2026-08-24 18:27:59.093726+00)

## Ripple

| what | count |
|---|---:|
| articulations | 491 |
| curation_keys | 3,832 |
| curation_pointers | 2,842 |
| fl_codes | 12 |
| identities | 13 |
| identities_ghosts_healed | 1 |
| memberships | 2,170 |
| minted | 2,170 |
| seed_codes | 7 |
| seed_umbrellas | 3 |
| singletons | 7,587 |
| zseq_counters | 23 |

## Apply gates

- ✅ G1 counts conserved across the five files
- ✅ G2 untouched rows byte-identical
- ✅ G3 key == course_id everywhere
- ✅ G4 keysets are the exact permutation
- ✅ G5 articulation course_id multiset mapped exactly
- ✅ G6 overlay keys + pointers mapped, every M/Z target resolves
- ✅ G7 stamps: every moved catalog row carries its old id
- ✅ G8 minted/singleton key spaces disjoint
- ✅ G9 subject_4letter == prefix on every moved row
- ✅ G10 discipline unchanged on every moved row

## Allocator validation (recomputed at apply)

- ✅ V1_conservation
- ✅ V2_new_ids_unique
- ✅ V3_new_ids_disjoint_from_untouched
- ✅ V4_discipline_unchanged
- ✅ V5_alias_invertible
- ✅ V6_all_new_subj4_four_letters
- ✅ V7_no_overflow
