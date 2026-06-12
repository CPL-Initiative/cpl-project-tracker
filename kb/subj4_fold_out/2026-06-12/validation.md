# SUBJ4 fold — APPLY validation receipt

- applied: `2026-06-12T18:11:26Z`
- aliases: **71037** (moves: **48820**)

## Per-file mutation counts

| file | rows moved |
|---|---:|
| `kb/coci_minted_courses.json` | 12803 |
| `kb/coci_minted_singletons.json` | 36017 |
| `kb/coci_minted_memberships.json` | 12803 |
| `kb/coci_articulations.json` | 3232 |
| `kb/coci_curation.json` | 108 keys + 39 merge_into values |

## Apply gates

- ✅ G1 counts conserved across all five files
- ✅ G2 untouched rows byte-identical
- ✅ G3 key == course_id everywhere
- ✅ G4 keysets are the exact permutation
- ✅ G5 articulation course_id multiset mapped exactly
- ✅ G6 overlay keys+pointers mapped, all M-ID targets live
- ✅ G7 stamps: every moved row carries its pre-fold id
- ✅ G8 minted/singleton key spaces disjoint

## Allocator validation (recomputed at apply)

- ✅ all_new_subj4_are_4letter
- ✅ one_subj4_per_discipline
- ✅ new_course_ids_unique
- ✅ new_id_disjoint_from_untouched
- ✅ no_seq_overflow
