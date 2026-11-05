# The Subjects List recode (subjects-list-2026-11-04): dry run 2026-11-05

The ruling: Sam, 2026-11-04 21:25Z to 2026-11-05 00:10Z (the Common Subjects List, `_CANON_SUBJ4::` saves with a note each): eleven disciplines take a new Common SUBJ. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md): a prefix re-key that keeps the number.

## Validation

- **V0_the_plan_matches_seed_and_picks**: pass
- **P0_not_applied**: pass
- **V2_new_ids_unique_and_free**: pass
- **V3_codes**: pass
- **V6_no_curation_left_on_an_old_code**: pass
- **V7_only_M_ids**: pass

## Moves: 2389 ids, 360 gap-filled, 2028 kept number, 1 returned home

| Discipline | From | To | Ids | Catalog | Singletons | Off-discipline |
|---|---|---|---|---|---|---|
| Artificial Intelligence | CSAI | CSIS | 44 | 10 | 34 | 0 |
| Broadcasting Technology | BCST | BRDC | 338 | 58 | 280 | 2 |
| Building Codes and Regulations | CNSR | CBIT | 71 | 17 | 54 | 0 |
| Cabinet Making | CNSC | WWKC | 60 | 7 | 53 | 1 |
| Diesel Mechanics | AUTD | DIES | 213 | 51 | 162 | 0 |
| Environmental Technologies | ESCI | ENVS | 613 | 110 | 503 | 0 |
| Furniture Making | CSTF | WWKF | 139 | 22 | 117 | 0 |
| Graphic Arts | GRAF | GFCD | 303 | 78 | 225 | 1 |
| Legal Assisting | PLGL | PARA | 276 | 66 | 210 | 0 |
| Licensed Vocational Nursing | NRSV | VNRS | 126 | 21 | 105 | 0 |
| Media Production | FTVE | FMED | 206 | 36 | 170 | 0 |

## Off-discipline rows that move with their namespace (strays before and after)

| Old id | New id | Title | Discipline |
|---|---|---|---|
| BCST M1003 | BRDC M1061 | Media Literacy | None |
| BCST M10AH | BRDC M10KT | Interconnected Audio Systems | None |
| CNSC M1004 | WWKC M1004 | Hand and Power Tool Application | Carpentry |
| GRAF M1051 | GFCD M1051 | Virtual Production L | None |

## Not on their own number (361)

A gap-fill means an earlier re-mint once used the slot; the chain resolves an id stored then to the row that held it, so the slot stays free.

| Old id | New id | How |
|---|---|---|
| AUTD M1001 | DIES M1043 | gap-filled |
| AUTD M1002 | DIES M1044 | gap-filled |
| AUTD M1003 | DIES M1045 | gap-filled |
| AUTD M1004 | DIES M1046 | gap-filled |
| AUTD M1005 | DIES M1047 | gap-filled |
| AUTD M1006 | DIES M1048 | gap-filled |
| AUTD M10AA | DIES M10FZ | gap-filled |
| AUTD M10AB | DIES M10GA | gap-filled |
| AUTD M10AC | DIES M10GB | gap-filled |
| AUTD M10AD | DIES M10GC | gap-filled |
| AUTD M10AE | DIES M10GD | gap-filled |
| AUTD M10AF | DIES M10GE | gap-filled |
| AUTD M10AG | DIES M10GF | gap-filled |
| AUTD M10AH | DIES M10GG | gap-filled |
| AUTD M10AI | DIES M10GH | gap-filled |
| AUTD M10AJ | DIES M10GI | gap-filled |
| AUTD M10AK | DIES M10GJ | gap-filled |
| AUTD M10AL | DIES M10GK | gap-filled |
| AUTD M10AM | DIES M10GM | gap-filled |
| AUTD M10AN | DIES M10GN | gap-filled |
| AUTD M10AO | DIES M10GO | gap-filled |
| AUTD M10AP | DIES M10GP | gap-filled |
| AUTD M10AQ | DIES M10GQ | gap-filled |
| AUTD M10AR | DIES M10GR | gap-filled |
| AUTD M10AS | DIES M10GS | gap-filled |
| AUTD M10AT | DIES M10GT | gap-filled |
| AUTD M10AU | DIES M10GU | gap-filled |
| AUTD M10AV | DIES M10GV | gap-filled |
| AUTD M10AW | DIES M10GW | gap-filled |
| AUTD M10AX | DIES M10GX | gap-filled |
| AUTD M10AY | DIES M10GY | gap-filled |
| AUTD M10AZ | DIES M10GZ | gap-filled |
| AUTD M10BA | DIES M10HA | gap-filled |
| AUTD M10BB | DIES M10HB | gap-filled |
| AUTD M10BC | DIES M10HC | gap-filled |
| AUTD M10BD | DIES M10HD | gap-filled |
| AUTD M10BE | DIES M10HE | gap-filled |
| AUTD M10BF | DIES M10HF | gap-filled |
| AUTD M10BG | DIES M10HG | gap-filled |
| AUTD M10BH | DIES M10HH | gap-filled |
| AUTD M10BI | DIES M10HI | gap-filled |
| AUTD M10BJ | DIES M10HJ | gap-filled |
| AUTD M10BK | DIES M10HK | gap-filled |
| AUTD M10BL | DIES M10HL | gap-filled |
| AUTD M10BM | DIES M10HM | gap-filled |
| AUTD M10BN | DIES M10HN | gap-filled |
| AUTD M10BO | DIES M10HO | gap-filled |
| AUTD M10BP | DIES M10HP | gap-filled |
| AUTD M10BQ | DIES M10HQ | gap-filled |
| AUTD M10BR | DIES M10HR | gap-filled |
| AUTD M10BS | DIES M10HS | gap-filled |
| AUTD M10BT | DIES M10HT | gap-filled |
| AUTD M10BU | DIES M10HU | gap-filled |
| AUTD M10BV | DIES M10HV | gap-filled |
| AUTD M10BW | DIES M10HW | gap-filled |
| AUTD M10BX | DIES M10HX | gap-filled |
| AUTD M10BY | DIES M10HY | gap-filled |
| AUTD M10BZ | DIES M10HZ | gap-filled |
| AUTD M10CA | DIES M10IA | gap-filled |
| AUTD M10CB | DIES M10IB | gap-filled |
| AUTD M10CC | DIES M10IC | gap-filled |
| AUTD M10CD | DIES M10ID | gap-filled |
| AUTD M10CE | DIES M10IE | gap-filled |
| AUTD M10CF | DIES M10IF | gap-filled |
| AUTD M10CG | DIES M10IG | gap-filled |
| AUTD M10CH | DIES M10IH | gap-filled |
| AUTD M9001 | DIES M9007 | gap-filled |
| AUTD M9002 | DIES M9002 | returned home |
| BCST M1001 | BRDC M1059 | gap-filled |
| BCST M1002 | BRDC M1060 | gap-filled |
| BCST M1003 | BRDC M1061 | gap-filled |
| BCST M1004 | BRDC M1062 | gap-filled |
| BCST M10AA | BRDC M10KM | gap-filled |
| BCST M10AB | BRDC M10KN | gap-filled |
| BCST M10AC | BRDC M10KO | gap-filled |
| BCST M10AD | BRDC M10KP | gap-filled |
| BCST M10AE | BRDC M10KQ | gap-filled |
| BCST M10AF | BRDC M10KR | gap-filled |
| BCST M10AG | BRDC M10KS | gap-filled |
| BCST M10AH | BRDC M10KT | gap-filled |
| BCST M10AI | BRDC M10KU | gap-filled |
| BCST M10AJ | BRDC M10KV | gap-filled |
| BCST M10AK | BRDC M10KW | gap-filled |
| BCST M10AL | BRDC M10KX | gap-filled |
| BCST M10AM | BRDC M10KY | gap-filled |
| BCST M10AN | BRDC M10KZ | gap-filled |
| BCST M10AO | BRDC M10LA | gap-filled |
| BCST M10AP | BRDC M10LB | gap-filled |
| BCST M10AQ | BRDC M10LC | gap-filled |
| BCST M10AR | BRDC M10LD | gap-filled |
| BCST M10AS | BRDC M10LE | gap-filled |
| BCST M10AT | BRDC M10LF | gap-filled |
| BCST M10AU | BRDC M10LG | gap-filled |
| BCST M10AV | BRDC M10LH | gap-filled |
| BCST M10AW | BRDC M10LI | gap-filled |
| BCST M10AX | BRDC M10LJ | gap-filled |
| BCST M10AY | BRDC M10LK | gap-filled |
| BCST M10AZ | BRDC M10LL | gap-filled |
| BCST M10BA | BRDC M10LM | gap-filled |
| BCST M10BB | BRDC M10LN | gap-filled |
| BCST M10BC | BRDC M10LO | gap-filled |
| BCST M10BD | BRDC M10LP | gap-filled |
| BCST M10BE | BRDC M10LQ | gap-filled |
| BCST M10BF | BRDC M10LR | gap-filled |
| BCST M10BG | BRDC M10LS | gap-filled |
| BCST M10BH | BRDC M10LT | gap-filled |
| BCST M10BI | BRDC M10LU | gap-filled |
| BCST M10BJ | BRDC M10LV | gap-filled |
| BCST M10BK | BRDC M10LW | gap-filled |
| BCST M10BL | BRDC M10LX | gap-filled |
| BCST M10BM | BRDC M10LY | gap-filled |
| BCST M10BN | BRDC M10LZ | gap-filled |
| BCST M10BO | BRDC M10MA | gap-filled |
| BCST M10BP | BRDC M10MB | gap-filled |
| BCST M10BQ | BRDC M10MC | gap-filled |
| BCST M10BR | BRDC M10MD | gap-filled |
| BCST M10BS | BRDC M10ME | gap-filled |
| CSAI M1001 | CSIS M1488 | gap-filled |
| CSAI M1002 | CSIS M1489 | gap-filled |
| CSAI M1003 | CSIS M1490 | gap-filled |
| CSAI M1004 | CSIS M1491 | gap-filled |
| CSAI M1005 | CSIS M1492 | gap-filled |
| CSAI M1006 | CSIS M1493 | gap-filled |
| CSAI M1007 | CSIS M1494 | gap-filled |
| CSAI M1008 | CSIS M1495 | gap-filled |
| CSAI M1009 | CSIS M1496 | gap-filled |
| CSAI M10AA | CSIS M12NA | gap-filled |
| CSAI M10AB | CSIS M12NB | gap-filled |
| CSAI M10AC | CSIS M12NC | gap-filled |
| CSAI M10AD | CSIS M12ND | gap-filled |
| CSAI M10AE | CSIS M12NE | gap-filled |
| CSAI M10AF | CSIS M12NF | gap-filled |
| CSAI M10AG | CSIS M12NG | gap-filled |
| CSAI M10AH | CSIS M12NH | gap-filled |
| CSAI M10AI | CSIS M12NI | gap-filled |
| CSAI M10AJ | CSIS M12NJ | gap-filled |
| CSAI M10AK | CSIS M12NK | gap-filled |
| CSAI M10AL | CSIS M12NL | gap-filled |
| CSAI M10AM | CSIS M12NM | gap-filled |
| CSAI M10AN | CSIS M12NN | gap-filled |
| CSAI M10AO | CSIS M12NO | gap-filled |
| CSAI M10AP | CSIS M12NP | gap-filled |
| CSAI M10AQ | CSIS M12NQ | gap-filled |
| CSAI M10AR | CSIS M12NR | gap-filled |
| CSAI M10AS | CSIS M12NS | gap-filled |
| CSAI M10AT | CSIS M12NT | gap-filled |
| CSAI M10AU | CSIS M12NU | gap-filled |
| CSAI M10AV | CSIS M12NV | gap-filled |
| CSAI M10AW | CSIS M12NW | gap-filled |
| CSAI M10AX | CSIS M12NX | gap-filled |
| CSAI M10AY | CSIS M12NY | gap-filled |
| CSAI M10AZ | CSIS M12NZ | gap-filled |
| CSAI M10BA | CSIS M12OA | gap-filled |
| CSAI M10BB | CSIS M12OB | gap-filled |
| CSAI M10BC | CSIS M12OC | gap-filled |
| CSAI M10BD | CSIS M12OD | gap-filled |
| CSAI M9001 | CSIS M9049 | gap-filled |
| CSAI M90AA | CSIS M90IZ | gap-filled |
| CSAI M90AB | CSIS M90JA | gap-filled |
| CSAI M90AC | CSIS M90JB | gap-filled |
| CSAI M90AD | CSIS M90JC | gap-filled |
| ESCI M1001 | ENVS M1108 | gap-filled |
| ESCI M1002 | ENVS M1109 | gap-filled |
| ESCI M1003 | ENVS M1110 | gap-filled |
| ESCI M1004 | ENVS M1111 | gap-filled |
| ESCI M1005 | ENVS M1112 | gap-filled |
| ESCI M1006 | ENVS M1113 | gap-filled |
| ESCI M1007 | ENVS M1114 | gap-filled |
| ESCI M1008 | ENVS M1115 | gap-filled |
| ESCI M1009 | ENVS M1116 | gap-filled |
| ESCI M1010 | ENVS M1117 | gap-filled |
| ESCI M10AA | ENVS M10RE | gap-filled |
| ESCI M10AB | ENVS M10RF | gap-filled |
| ESCI M10AC | ENVS M10RG | gap-filled |
| ESCI M10AD | ENVS M10RH | gap-filled |
| ESCI M10AE | ENVS M10RI | gap-filled |
| ESCI M10AF | ENVS M10RJ | gap-filled |
| ESCI M10AG | ENVS M10RK | gap-filled |
| ESCI M10AH | ENVS M10RL | gap-filled |
| ESCI M10AI | ENVS M10RM | gap-filled |
| ESCI M10AJ | ENVS M10RN | gap-filled |
| ESCI M10AK | ENVS M10RO | gap-filled |
| ESCI M10AL | ENVS M10RP | gap-filled |
| ESCI M10AM | ENVS M10RQ | gap-filled |
| ESCI M10AN | ENVS M10RR | gap-filled |
| ESCI M10AO | ENVS M10RS | gap-filled |
| ESCI M10AP | ENVS M10RT | gap-filled |
| ESCI M10AQ | ENVS M10RU | gap-filled |
| ESCI M10AR | ENVS M10RV | gap-filled |
| ESCI M10AS | ENVS M10RW | gap-filled |
| ESCI M10AT | ENVS M10RX | gap-filled |
| ESCI M10AU | ENVS M10RY | gap-filled |
| ESCI M10AV | ENVS M10RZ | gap-filled |
| ESCI M10AW | ENVS M10SA | gap-filled |
| ESCI M10AX | ENVS M10SB | gap-filled |
| ESCI M10AY | ENVS M10SC | gap-filled |
| ESCI M10AZ | ENVS M10SD | gap-filled |
| ESCI M10BA | ENVS M10SE | gap-filled |
| ESCI M10BB | ENVS M10SF | gap-filled |
| ESCI M10BC | ENVS M10SG | gap-filled |
| … | 161 more in plan.json | |

## Readings

1. **Media Production leaves the fan-in.** Sam's 2026-09-03 ruling (item 13) put Media Production on FTVE beside Film and Media Studies; his FMED pick ends that pair. Film keeps FTVE; the seed drops `fan_in_with` from both entries. C-ID's code for these courses is FTVE, so FMED is a CSR code beside it; his note names FTVE, which records the divergence for the scan.
2. **CSIS changes hands.** Computer Information Systems held CSIS until the 2026-09-03 recode moved it to ITIS; Artificial Intelligence now takes it. `kb/alias_chain.py` resolves a stored id by its era, so an old CSIS id still lands on ITIS, and the allocator keeps every slot CIS once held free. A reader that skips the chain would put a CIS course on an AI code.
3. **Codes the June fold retired come back** (DIES, ENVS, PARA, VNRS, BRDC): their old slots stay free, which is why those disciplines gap-fill.

## Fresh read at write time

```sql
select json_object_agg(substr(c.course_id,15), json_build_object('code', c.value, 'note', n.value,
  'by', n.reviewer_email, 'at', n.reviewed_at)) from kb_curation c left join kb_curation n
  on n.course_id = c.course_id and n.field = 'canonical_subj4_notes'
where c.course_id like '\_CANON\_SUBJ4::%' and c.field = 'canonical_subj4';
```

## After the apply

1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit; run `python3 kb/_post_apply_chain.py`, then `--finish-seed`.
2. `python3 kb/_subjects_list_recode.py --rekey-skyview --rekey-generated --receipt kb/subjects_list_recode_out/2026-11-05/alias_map.json`, then rebuild `ccr_cpl.json`, `ccr_sky.json`, the blast radius and the dependency map.
3. After the merge, before the next cron's curation sync: dispatch `supabase-rekey.yml` with `alias_map_path=kb/subjects_list_recode_out/2026-11-05/alias_map.json`, read the live rows back (none on an old id), then dispatch `daily-dashboard.yml`.
