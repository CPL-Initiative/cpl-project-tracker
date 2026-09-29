# Prefix fold — APPLY validation receipt

- applied: `2026-09-04T01:57:31Z`
- scope: `all`
- ruling: Sam, 2026-09-04: "Yes to all recommendations" — the seven items of the prefix fold sheet as proposed (1, 2, 5, 7 fold; 3 held; 4 no fold; 6 the span stays); kb/prefix_fold_rulings_2026-09-04.json
- aliases: **278**
- P1 plan fidelity: recomputed == frozen ✓
- P3 curation freshness: fresh read matches the committed overlay (30694 entries, newest 2026-08-24 18:27:59.093726+00)
- fold-verify must read `re_key` **7** after the land (7 held + 0 outside the scope)

## Ripple

| what | count |
|---|---:|
| articulations | 54 |
| curation_keys | 278 |
| curation_pointers | 404 |
| identities | 0 |
| identities_ghosts_dropped | 8 |
| identities_ghosts_healed | 0 |
| member_ids | 1 |
| member_lists | 1 |
| memberships | 113 |
| minted | 245 |
| singletons | 33 |

## Apply gates

- ✅ G1 counts conserved across the five files
- ✅ G2 untouched rows byte-identical
- ✅ G3 key == course_id everywhere
- ✅ G4 keysets are the exact permutation
- ✅ G5 articulation course_id multiset mapped exactly
- ✅ G6 overlay keys + pointers mapped, every M target resolves
- ✅ G7 stamps: every moved catalog row carries its old id
- ✅ G8 minted/singleton key spaces disjoint
- ✅ G9 subject_4letter == prefix on every moved row
- ✅ G10 discipline unchanged on every moved row
- ✅ G11 member lists re-keyed exactly, none left on an old id
- ✅ G12 identities: no old key remains; every landed ghost healed or dropped
- ✅ G13 no old id left on any keyed surface

## Allocator validation (recomputed at apply)

- ✅ V1_conservation
- ✅ V2_new_ids_unique
- ✅ V3_new_ids_disjoint_from_untouched
- ✅ V4_discipline_unchanged
- ✅ V5_alias_invertible
- ✅ V6_all_new_subj4_four_letters
- ✅ V7_no_overflow
- ✅ V9_no_swap_cycles
- ✅ V8_parity_with_fold_verify
