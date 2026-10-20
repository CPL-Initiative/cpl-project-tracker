# Foreign Languages strays (fl-strays-s435) - dry run 2026-10-20

Sam, 2026-10-20 (Open Asks Sheet 107 card 2, 13:08Z, his own call, "rekey-twelve"; proposed on Sheet 106 by S435): the twelve Foreign Languages identities on stray codes re-key to their language's code under the umbrella (docs/fl_subj4_remint_scope.md), the discipline unchanged. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).

## Validation

- **V0_pinned_set**: pass
- **P0_not_applied**: pass
- **V2_new_ids_unique_and_free**: pass
- **V3_codes_and_bands**: pass
- **V6_new_codes_unused**: pass

## Moves (12)

| Old id | New id | How | Title | Language | Merged into | TOP |
|---|---|---|---|---|---|---|
| ARAM M10AA | FLAM M10AA | kept number | Aramaic 1 | Aramaic (new) |  | 1101.00 |
| ARAM M10AB | FLAM M10AB | kept number | Aramaic 2 | Aramaic (new) |  | 1101.00 |
| ARAM M10AC | FLAM M10AC | kept number | Aramaic 3 | Aramaic (new) |  | 1101.00 |
| FILI M1001 | FLTA M1006 | gap-filled | Elementary Filipino (Tagalog) | Filipino (Tagalog) |  | 1117.10 |
| GREE M1001 | FLGR M1001 | kept number | Elementary Modern Standard Greek | Greek |  | 1110.00 |
| HIER M10AA | FLEG M10AA | kept number | Egypt Hieroglyphs 1 | Egyptian hieroglyphs (new) |  | 1199.00 |
| HUPA M10AA | FLHU M10AA | kept number | Elementary Hupa 1A | Hupa (new) |  | 1199.00 |
| HUPA M10AB | FLHU M10AB | kept number | Elementary Hupa 1B | Hupa (new) |  | 1199.00 |
| JAPA M1001 | JAPN M1041 | gap-filled | Continuation of Beginning Kanji for Reading and Writing | Japanese |  | 1108.00 |
| KHME M1001 | FLKH M1001 | kept number | Khmer for Heritage Speakers | Khmer (new) |  | 1117.00 |
| LING M10AF | FLNG M11LR | gap-filled | Honors Linguistics 1 | no one language: the residual |  | 1199.00 |
| TURK M10AA | FLTU M10AA | kept number | Elementary Turkish 1 | Turkish (new) |  | 1199.00 |

New umbrella codes: FLAM (Aramaic), FLEG (Egyptian Hieroglyphs), FLHU (Hupa), FLKH (Khmer), FLTU (Turkish).

## After the apply

1. Add the new codes to Foreign Languages' `umbrella_codes` (kb/discipline_canonical_subj4.json) and to kb/foreign_language_subj4.json.
2. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run `python3 kb/_post_apply_chain.py`.
3. `python3 kb/_fl_stray_remint.py --rekey-skyview --receipt kb/fl_stray_remint_out/2026-10-20/alias_map.json`, then rebuild the payloads.
4. After the merge: dispatch `supabase-rekey.yml` with `alias_map_path=kb/fl_stray_remint_out/2026-10-20/alias_map.json`; read kb_curation back.
