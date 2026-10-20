# Sheet 104 re-mint (sheet104-forestry-stragglers): forestry to ENVR, wine to AGPR - dry run 2026-10-20

The ruling: S432 on Sam's Sheet 104 "move-ten" (2026-10-20), proceeded on the recommendation: the two forestry identities merged into ENVR M1069 that the sitting never named follow their parent to ENVR. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).

## Validation

- **V0_pinned_set**: pass
- **P0_not_applied**: pass
- **V2_new_ids_unique_and_free**: pass
- **V3_codes_and_bands**: pass

## Moves (2: ENVR 2)

| Old id | New id | How | Title | Merged into | Discipline before (source) | Discipline after | TOP |
|---|---|---|---|---|---|---|---|
| AGRI M10SY | ENVR M10SY | kept number | Forest Surveying | ENVR M1069 | Agriculture (top_division) | Forestry/Natural Resources | 0114.00 |
| AGRI M1104 | ENVR M1104 | kept number | Introduction to Forest Operations | ENVR M1069 | Agriculture (none) | Forestry/Natural Resources | 0114.00 |

## Not moved

The four ENVR courses on the same subjects (ENVR M1009, M10CM, M10DI, M1025) stay; after this window they go to the merge worklist.

## After the apply

1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run `python3 kb/_post_apply_chain.py`.
2. Re-key SkyView's hand-built layout: `python3 kb/_forestry_wine_remint.py --rekey-skyview --receipt kb/forestry_wine_remint_out/2026-10-20-stragglers/alias_map.json`, then rebuild the payloads the lints check.
3. After the merge, before the next cron's curation sync: dispatch `supabase-rekey.yml` with `alias_map_path=kb/forestry_wine_remint_out/2026-10-20-stragglers/alias_map.json`.
4. Read the live kb_curation rows back: none on an old id.
