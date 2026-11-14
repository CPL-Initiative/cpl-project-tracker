# Identities map rebuild — dry run 2026-11-14

status: DRY-RUN 2026-11-14, nothing applied

- articulated ids: 2,319; entries now: 2,290
- fill 651 · refresh 578 · same 915 · C-ID/CCN kept 172 · no catalog record 3
- orphan M-ID entries held: 625 (orphan_worklist.json); C-ID/CCN entries with no record, kept: 0
- refresh, why: metadata only 276; title differs (the entry describes another course) 264; offering differs from the membership 38
- over_merged flips on refresh: 19
- entries after --apply: 2,941; with --drop-orphans: 2,316

## Merge targets

- targets with an articulated member: 453
- reached by a member that had no entry: 153
- whose adopter or potential count changes: 192

| target | members without entry before | adopted | potential |
|---|---|---|---|
| `CNST M1107` | CNST M10BQ, CNST M10BV, CNST M10DQ, CNST M10GX | 0 to 1 | 0 to 0 |
| `AUTO M1061` | AUTO M10NU, AUTO M10NX, AUTO M10OA | 0 to 3 | 6 to 6 |
| `FIRE M1034` | FIRE M1057, FIRE M10FO, FIRE M10FP | 2 to 7 | 10 to 10 |
| `FIRE M1135` | FIRE M10LR, FIRE M10LW, FIRE M10LX | 4 to 7 | 8 to 10 |
| `REAL M1012` | REAL M1011, REAL M10BS, REAL M10BX | 9 to 9 | 18 to 35 |
| `SPAN 100` | SPAN M1036, SPAN M1068, SPAN M1074 | 14 to 19 | 40 to 91 |
| `AUTO M1139` | AUTO M11HR, AUTO M11HT | 1 to 3 | 0 to 0 |
| `AUTO M1200` | AUTO M1187, AUTO M11LG | 0 to 2 | 0 to 0 |
| `AVIA M1069` | AVIA M10DZ, INDT M10HU | 1 to 2 | 0 to 0 |
| `CNST M1111` | CNST M10DK, CNST M10NN | 0 to 1 | 0 to 0 |
| `CNST M1114` | CNST M10EL, CNST M10FJ | 0 to 1 | 0 to 0 |
| `CNST M1116` | CNST M10KJ, CNST M10KK | 0 to 1 | 0 to 0 |
| `CNST M1124` | CNST M10CJ, CNST M10NQ | 0 to 1 | 0 to 0 |
| `COSM M1086` | COSM M10BP, COSM M10JJ | 0 to 1 | 0 to 0 |
| `COSM M1101` | COSM M10AZ, COSM M10BG | 0 to 1 | 0 to 0 |
| `DIES M1027` | AUTO M10NL, AUTO M10SP | 1 to 3 | 0 to 0 |
| `OSHA M1013` | OSHA M10BC, OSHA M10BO | 0 to 1 | 0 to 0 |
| `SPAN 110` | SPAN M1048, SPAN M1075 | 11 to 14 | 65 to 80 |
| `SPAN 220` | SPAN M1085, SPAN M1092 | 1 to 3 | 38 to 60 |
| `SPAN M1042` | SPAN M10AJ, SPAN M10AK | 0 to 1 | 0 to 0 |
| `WELD M1150` | WELD M10IS, WELD M10IT | 0 to 1 | 0 to 0 |
| `WELD M1165` | CNST M10ND, CNST M10NF | 0 to 1 | 0 to 0 |
| `ARAB M1008` | ARAB M1010 | 0 to 1 | 1 to 0 |
| `ARCH M1147` | ARCH M10LH | 0 to 1 | 0 to 0 |
| `ARCH M1174` | ARCH M10MV | 0 to 1 | 0 to 0 |
| `ARTH M1521` | ARTH M10AI | 0 to 1 | 0 to 0 |
| `ARTS M1382` | PHOT M1113 | 0 to 1 | 0 to 9 |
| `ASTR M1002` | ASTR M1041 | 0 to 1 | 0 to 14 |
| `AUTB M1011` | AUTB M10CT | 0 to 1 | 0 to 0 |
| `AUTB M1038` | INDT M10JN | 0 to 1 | 0 to 0 |

## Apply

1. `python3 kb/_identities_rebuild.py --apply` writes the fills and refreshes and keeps the orphans;
   `--drop-orphans --ruling "<who, when: what>"` also drops them, after this worklist.
2. Commit kb/coci_articulations.json in one cron window; the daily run rebuilds the lists.
3. `python3 kb/_identities_rebuild.py --check` then exits 0.
