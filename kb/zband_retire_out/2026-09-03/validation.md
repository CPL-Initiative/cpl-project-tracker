# Z-band retirement — APPLY validation receipt

- applied: `2026-09-03T20:19:27Z`
- aliases: **4,271** (materialized 4,053)
- P1 plan fidelity: recomputed == frozen ✓
- P3 curation freshness: fresh read matches the committed overlay (30694 entries)

## Ripple

| what | count |
|---|---:|
| crosswalk_refs | 254 |
| curation_keys | 4,053 |
| curation_pointers | 10,704 |
| legacy_anchors | 218 |
| materialized | 4,053 |

## Apply gates

- ✅ Z1 no Z-shaped key or merge_into pointer remains in the overlay
- ✅ Z2 overlay count conserved and keys are the exact permutation
- ✅ Z3 catalog grows by exactly the retired identities
- ✅ Z4 every materialized record: key == course_id, M shape, stamp, title, members
- ✅ Z5 memberships untouched
- ✅ Z6 pre-existing catalog rows byte-identical
- ✅ Z7 common_courses conserved: legacy keys moved, blocked ones kept, records stamped
- ✅ Z8 crosswalk course_id multiset mapped exactly
- ✅ Z9 minted/singleton key spaces disjoint
- ✅ Z10 every M/Z-shaped merge_into target resolves to a live key
- ✅ Z11 the Z counters are retired

## Allocator validation (recomputed at apply)

- ✅ V1_every_z_aliased_and_blocked_anchors_listed
- ✅ V2_new_ids_unique
- ✅ V3_new_ids_disjoint_from_every_existing_key
- ✅ V4_alias_invertible
- ✅ V5_m_shape
- ✅ V6_no_overflow
- ✅ V7_z_refs_only_in_curation
