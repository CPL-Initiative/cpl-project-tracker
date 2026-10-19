# Sheet 99 card 3 re-mint: Agricultural Business takes AGAB - dry run 2026-10-19

The ruling: Sam, 2026-10-19 (Open Asks Sheet 99 card 3, "agab"): Agricultural Business and Related Services takes AGAB; its identity AUTB M1006 is re-keyed under the playbook. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).

## Validation

- **V0_pinned_one**: pass
- **P0_not_applied**: pass
- **V2_new_ids_unique_and_free**: pass
- **V3_codes_and_bands**: pass

## Moves (1 to AGAB)

| Old id | New id | How | Title | Discipline before | TOP |
|---|---|---|---|---|---|
| AUTB M1006 | AGAB M1006 | kept number | Supervision and Management in Agriculture | Auto Body Technology | 0112.00 |

## Not moved: AUTB M1071 Import Body Customizing

Sam's 2026-07-13 curation row sets its discipline to Agricultural Business and Related Services too, while its title, its TOP (0949.00 Automotive Collision Repair) and its two members (Auto Body Technology at Cerritos, Automotive Technology at Victor Valley) read auto body. A human-sourced row is never superseded by a session's inference (Rule 8): it is a card for Sam. Until he answers, the Reference view lists Agricultural Business with one row off its code (AUTB), which is true.

## After the apply

1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run `python3 kb/_post_apply_chain.py`.
2. Re-key SkyView's hand-built layout: `python3 kb/_agab_one_remint.py --rekey-skyview --receipt kb/agab_remint_out/2026-10-19/alias_map.json`, then rebuild the payloads the lints check.
3. The pick: the insert-only receipt kb/receipts/csr_agab_pick_2026-10-19_s427.sql through supabase-migrate.yml (kb/migrations/.apply), and the seed entry edited to match.
4. After the merge, before the next cron's curation sync: dispatch `supabase-rekey.yml` with `alias_map_path=kb/agab_remint_out/2026-10-19/alias_map.json`.
5. Read the live kb_curation rows back: none on an old id; the pick under csr-s427@bot.
