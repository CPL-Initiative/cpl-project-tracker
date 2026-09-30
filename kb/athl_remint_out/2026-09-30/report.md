# Card 9 re-mint: Grossmont's four to ATHL - dry run 2026-09-30

The ruling: Sam, 2026-09-29 (open-asks sheet 4, card 9, "Move them to ATHL"): Grossmont's four KINE titles move to ATHL. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).

## Validation

- **V0_pinned_four**: pass
- **P0_not_applied**: pass
- **V2_new_ids_unique_and_free**: pass
- **V3_codes_and_bands**: pass

## Moves (4 to ATHL)

| Old id | New id | How | Title | Moved from on 2026-09-29 |
|---|---|---|---|---|
| KINE M12OI | ATHL M11FQ | gap-filled | Adv Techniques & Strategies of Baseball | ETHS M10BI |
| KINE M12OJ | ATHL M11FR | gap-filled | Adv Techniques & Strategies of Football | ETHS M10BK |
| KINE M12OK | ATHL M11FS | gap-filled | Adv Techniques & Strategies-Water Polo | ETHS M10BN |
| KINE M12OL | ATHL M11FT | gap-filled | Adv Techniques & Strategies of Softball | ETHS M10BO |

## After the apply

1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run `python3 kb/_post_apply_chain.py`.
2. Re-key SkyView's hand-built layout: `python3 kb/_athl_four_remint.py --rekey-skyview --receipt kb/athl_remint_out/2026-09-30/alias_map.json`, then rebuild the payloads the lints check.
3. After the merge, before the next cron's curation sync: dispatch `supabase-rekey.yml` with `alias_map_path=kb/athl_remint_out/2026-09-30/alias_map.json`.
4. Read the live kb_curation rows back: none on an old id.
