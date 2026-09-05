# Identities map re-key — dry run 2026-09-05

status: DRY-RUN 2026-09-05 — nothing applied

- entries: **2,346** · ghosts: **1,425** · after: **2,290**
- re-key: **1,369** (titles agree on 1,217) · drop, collision: **44** · drop, converged: **9** · drop, dead: **3**
- hops through the chain: {1: 395, 2: 737, 3: 273, 4: 15, 5: 2}

## Validation

- ✅ V1_every_ghost_dispositioned
- ✅ V2_rekey_targets_live_and_unique
- ✅ V3_rekey_targets_have_no_entry
- ✅ V4_post_state_all_live

## The sheet for Sam (reply by number)

1. Re-key 1,369 entries onto the live id the alias chain names (proposed: yes).
2. Drop 3 entries no map names again (proposed: yes — nothing can display them).
3. Drop 44 ghosts whose live id already carries an entry (proposed: keep the live entry).
4. On 9 convergences, keep the ghost whose title agrees with the catalog (proposed: yes; basis recorded per target).
5. 152 re-keyed entries carry a title that differs from the catalog's (normalization variants; the catalog overrides display — proposed: no action).

## Title differences (sample)

| ghost | live id | map title | catalog title |
|---|---|---|---|
| `PLNT M10AE` | `AGPS M10FG` | Landscape Installation and Maintenance I | Landscape Installation and Maintenance 1 |
| `ARC M1002` | `ARCH M1039` | Architectural Drawing I | Architectural Drawing 1 |
| `ARC M10AL` | `ARCH M10IC` | Strength of Architectural Materials I | Strength of Architectural Materials 1 |
| `ART M1456` | `ARTS M1135` | Survey of Art History I | Survey of Art History 1 |
| `ART M1189` | `ARTS M1367` | Drawing I | Drawing 1 |
| `AT M1018` | `AUTO M1190` | Engine Performance II | Engine Performance 2 |
| `AT M1017` | `AUTO M1198` | Engine Performance I | Engine Performance |
| `AVIM M10BC` | `AVIA M10KV` | General Aviation Maintenance Technology Practices I | General Aviation Maintenance Technology Practices 1 |
| `AVIM M10BE` | `AVIA M10KW` | General Aviation Technology Theory I | General Aviation Technology Theory 1 |
| `AVIM M10BD` | `AVIA M10LA` | General Aviation Maintenance Technology Practices II | General Aviation Maintenance Technology Practices 2 |
| `AVIM M10BF` | `AVIA M10LB` | General Aviation Technology Theory II | General Aviation Technology Theory 2 |
| `AVIM M10BL` | `AVIA M10NZ` | Reciprocating Engines II | Reciprocating Engines 2 |
| `ACCT M1098` | `BUSI M1024` | Small Business Accounting | Accounting for Small Business |
| `BUAC M1002` | `BUSI M1063` | Tax Accounting I - Individuals | Tax Accounting 1 - Individuals |
| `ACCT M10FX` | `BUSI M10DF` | Tax Accounting II - Business Entities | Tax Accounting 2 - Business Entities |
| `CRP M1043` | `CARP M1031` | Gang Forms/Columns | Gang Forms and Columns |
| `CRP M1073` | `CARP M1055` | Transit Level/Laser | Transit Level and Laser |
| `CARP M10FJ` | `CNST M10AY` | Welding VI: FCAW 4G Certification | Welding 6: FCAW 4G Certification |
| `CARP M10FG` | `CNST M10CN` | Welding III: Advanced SMAW | Welding 3: Advanced SMAW |
| `CARP M10FH` | `CNST M10PE` | Welding III FCAW | Welding 3 FCAW |
| `CARP M10FI` | `CNST M10PF` | Welding IV FCAW Pipe | Welding 4 FCAW Pipe |
| `CARP M10FF` | `CNST M10QK` | Welding I: Introduction to SMAW | Welding 1: Introduction to SMAW |
| `HS M10AZ` | `COUN M10TD` | FIELD INSTRUCTION AND SEMINAR II | Field Instruction and Seminar 2 |
| `HUMS M10AS` | `COUN M10UE` | Social Work and Human Services Seminar I | Social Work and Human Services Seminar 1 |
| `SOSC M1005` | `COUN M1122` | Field Studies & Seminar I | Field Studies & Seminar 1 |

## Apply procedure

1. Sam replies by number; record the ruling as data.
2. `python3 kb/_identities_rekey_dryrun.py --receipt <this dir> --ruling "<who, when: what>" --apply` (P0 · P1 · G1-G5); commit in one cron window; the daily run regenerates the artifacts.
3. This receipt is NOT registered in ALIAS_MAPS (it re-keys a side table, it mints nothing).
