# Sheet 104 re-mint: forestry to ENVR, wine to AGPR - dry run 2026-10-20

The ruling: Sam, 2026-10-20 (Open Asks Sheet 104, 03:31-03:32Z, "move-ten" and "agpr"): the ten forestry courses the Sheet 103 sitting set aside re-key from AGRI to ENVR (Forestry/Natural Resources) and the four wine courses to AGPR (Agricultural Production), each record's discipline following its code. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).

## Validation

- **V0_pinned_set**: pass
- **P0_not_applied**: pass
- **V2_new_ids_unique_and_free**: pass
- **V3_codes_and_bands**: pass

## Moves (14: AGPR 4, ENVR 10)

| Old id | New id | How | Title | Merged into | Discipline before (source) | Discipline after | TOP |
|---|---|---|---|---|---|---|---|
| AGRI M1064 | ENVR M1064 | kept number | Wildland Trees and Shrubs (Dendrology) |  | Agriculture (subject_map) | Forestry/Natural Resources | 0401.00 |
| AGRI M1069 | ENVR M1069 | kept number | Forest Ecology |  | Agriculture (none) | Forestry/Natural Resources | 0114.00 |
| AGRI M10AX | ENVR M10EO | gap-filled | Advanced Forest Ecology and Management | AGRI M1069 | Agriculture (top_division) | Forestry/Natural Resources | 0114.00 |
| AGRI M10FP | AGPR M10FP | kept number | Beginning Wine Sensory Analysis |  | Agriculture (top_division) | Agricultural Production | 0112.00 |
| AGRI M10IL | ENVR M10IL | kept number | Applied Forest Inventory and Management |  | Agriculture (top_division) | Forestry/Natural Resources | 0114.00 |
| AGRI M10IZ | ENVR M10IZ | kept number | Forest Management and Assessment | AGRI M1069 | Agriculture (top_division) | Forestry/Natural Resources | 0114.00 |
| AGRI M10KI | ENVR M10KI | kept number | Beginning Forestry |  | Agriculture (none) | Forestry/Natural Resources | 0114.00 |
| AGRI M10OP | ENVR M10OP | kept number | Silviculture and Fire Ecology |  | Agriculture (none) | Forestry/Natural Resources | 0115.00 |
| AGRI M10OQ | ENVR M10OQ | kept number | Forest Ecology and Management | AGRI M1069 | Agriculture (top_division) | Forestry/Natural Resources | 0114.00 |
| AGRI M10SX | ENVR M10SX | kept number | Forest Protection and Health | AGRI M1103 | Agriculture (none) | Forestry/Natural Resources | 0115.00 |
| AGRI M1103 | ENVR M1103 | kept number | Forest Health and Protection |  | Agriculture (top_division) | Forestry/Natural Resources | 0114.00 |
| AGRI M1106 | AGPR M1106 | kept number | Wines of France |  | Agriculture (top_division) | Agricultural Production | 0112.00 |
| AGRI M1113 | AGPR M1113 | kept number | Wine Service and Hospitality |  | Agriculture (top_division) | Agricultural Production | 0112.00 |
| AGRI M1119 | AGPR M1119 | kept number | Wines of Italy |  | Agriculture (top_division) | Agricultural Production | 0112.00 |

**2 new ids take a slot an earlier re-mint vacated**: AGPR M10FP, ENVR M10EO. The chain resolves a stored id through the maps of its own era.

## Not moved

The four ENVR courses on the same subjects (ENVR M1009, M10CM, M10DI, M1025) stay; after this window they go to the merge worklist.

## After the apply

1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run `python3 kb/_post_apply_chain.py`.
2. Re-key SkyView's hand-built layout: `python3 kb/_forestry_wine_remint.py --rekey-skyview --receipt kb/forestry_wine_remint_out/2026-10-20/alias_map.json`, then rebuild the payloads the lints check.
3. After the merge, before the next cron's curation sync: dispatch `supabase-rekey.yml` with `alias_map_path=kb/forestry_wine_remint_out/2026-10-20/alias_map.json`.
4. Read the live kb_curation rows back: none on an old id.
