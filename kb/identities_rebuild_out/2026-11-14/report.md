# Identities map rebuild — dry run 2026-11-14

status: DRY-RUN 2026-11-14, nothing applied

Rule: the 1b entry rule (kb/_remint_apply_articulations.py) on the current catalog, for every articulated M-ID; C-ID/CCN entries pass through; M-ID entries no record names are held for a ruling. Not recomputed: the records' adoption_leverage, adoption_leverage_count, over_merged and identity_confidence. Not covered: a merge member with no articulation record gets no entry, so its college never reaches its target's potential list.

## Entries

- articulated ids: 2,319; entries now: 2,290
- fill 651 · refresh 578 · same 915 · C-ID/CCN kept 172
- refresh, why: title differs only by numerals, case or punctuation 266; metadata only 153; title differs in substance 126; offering differs from the membership 33
- C-ID/CCN record ids with no entry: 2 (AG-AB 108 108, AG-PS 128 128 L); the literal NULL course_id: 1; M-ID record ids in no catalog: 0
- orphan M-ID entries held: 625 (orphan_worklist.json); C-ID/CCN entries with no record, kept: 0
- entries after --apply: 2,941; with --drop-orphans: 2,316

## Public figures (the generator's own functions on the planned map)

- over_merged flips on refresh: false to true 9; true to false 10; fills born over-merged: 33
- Fact Sheet "Could adopt" total: 114 to 115
- by sector: Fire Technology 45 to 44; Kinesiology/Health 40 to 49
- statewide_prescriptive.js credentials that change: 22

## Rows (the export on the current map and on the planned map)

- in-browser rows (unified_courses_data.js): 513 of 16,386 change; gain adopters 381, lose adopters 0, gain potential 342, lose potential 95 (every lost college became an adopter 15; a college left a stale offering 80)
- export rows (exports/unified_courses.xlsx): 817 of 75,724 change; gain adopters 651, lose adopters 0, gain potential 384, lose potential 101 (every lost college became an adopter 0; a college left a stale offering 101)
- a row loses potential colleges when a member's earning colleges join its adopters, or when a refreshed entry's stale offering gives way to the membership
- export rows are matched by kind and id, never by position: the export writes them in catalog order and builds each row's lists from that id alone, so the rebuild cannot move a row, and no export row can lose a college to its adopters (only a refreshed offering removes one)
- the held orphan entries: 371 in-browser rows show 2,327 potential colleges from entries that describe other courses; 331 of those rows carry no articulation at all

## Merge targets

- targets with an articulated member: 453
- reached by a member that had no entry: 153
- whose adopter or potential count changes: 192
- FIRE 130 X: adopters 5 to 16, potential 6 to 32

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

## Apply and undo

1. `python3 kb/_identities_rebuild.py --apply --expect-plan <this dir>/plan.json` writes the fills and
   refreshes, keeps the orphans, and writes `apply_receipt.json` here with every key's before-value.
   It aborts when the fill, refresh or orphan sets differ from this plan.
2. Commit kb/coci_articulations.json and the receipt in one cron window; the daily run rebuilds the lists.
   It also aborts when an entry's content moved since this plan (plan.json carries a hash of each).
   The receipt is written pending, then the map, then marked applied; a run interrupted between
   them is settled by the next --apply or --undo from the map's own bytes.
3. Undo: `python3 kb/_identities_rebuild.py --undo <this dir>/apply_receipt.json`, or revert the commit.
4. `--drop-orphans --ruling "<who, when: what>"` also drops the orphans, after this worklist.
