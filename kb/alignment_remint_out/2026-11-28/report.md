# The common-subject alignment re-mint (S749): APPLIED 2026-11-28

The rulings: r-full-remint-for-new-joins-sam-2026-11-28; r-remint-dryrun-defaults-sam-2026-11-28 (Sam via COBIx, 2026-11-28). The dry run is kb/remint_dryrun/s749_report.md; this apply reproduces its plan row for row (P1).

## Gates

- **P1_matches_the_dry_run**: pass
- **P1_dry_run_gates_pass**: pass
- **P1_every_move_answered**: pass
- **V1_conservation**: pass
- **V3_discipline_follows_route**: pass
- **V4_articulations**: pass
- **V5_nothing_left_on_an_old_id**: pass
- **P2_no_identity_dropped**: pass
- **P3_aern_alone**: pass
- **P4_person_rows_only_the_ok_list**: pass

## Moves: 346 M-IDs

| Scope | Ids |
|---|---|
| aero | 9 |
| nutr-fold | 320 |
| phtc | 4 |
| pubr | 1 |
| tour | 12 |

## Counts

```
{
 "courses": 60,
 "singletons": 286,
 "articulations": 7,
 "identities": 6,
 "pointers": 57,
 "curation_keys": 84
}
```

## Person-curated rows that changed (Sam's OK list)

- filing:_SUBJ_DISC::NF
- filing:_SUBJ_DISC::NUTR
- filing:_SUBJ_DISC::NUTRI
- filing:_SUBJ_DISC::NUTRTN
- seed:Dietetics/Nutritional Science

## Beside the re-key

- The NUTR fold: Dietetics/Nutritional Science left kb/discipline_canonical_subj4.json (it stood at position 70) and is an alias of Nutritional Science/Dietetics in kb/discipline_aliases.json.
- Aeronautics: AERO -> AERN through kb/_apply_minted_codes_s749.py (receipt kb/receipts/minted_codes_s749_aern.json).
- The pick kb/subject_title_hunt/20261128_common_picks_slate2.csv:68: `Fresno City College,AEROST,credit,AERO,97,COBI,M-ID AERO` -> `Fresno City College,AEROST,credit,MILS,97,COBI,M-ID MILS (the nine Air Force ROTC M-IDs moved from AERO in the S749 re-mint)`

## kb_curation: 101 rows

Every row is an @bot cohort's in the committed overlay. Migration: `kb/migrations/2026-11-28_s749_remint_kb_curation_{preread,apply,rollback}.sql`; before and after per row: `kb_curation_rows.json`. The conductor runs the pre-read, then the apply after a second read; it is not in kb/migrations/.apply.

## Rollback

1. `git revert` of the land, which takes the receipt out of ALIAS_MAPS with everything the chain rebuilt.
2. Or, before the chain runs, `python3 kb/_alignment_remint_apply.py --rollback`: every byte the apply step wrote.
3. kb_curation: `kb/migrations/2026-11-28_s749_remint_kb_curation_rollback.sql`, in the same cron window.
