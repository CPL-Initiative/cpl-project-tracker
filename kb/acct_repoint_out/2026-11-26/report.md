# The Accounting re-point (acct-repoint-s736): dry run 2026-11-26

BUSI identities whose courses sit on an accounting local code (ACCT, ACCTG, ACC, ACTG) move to Accounting's common subject ACCT, under the playbook (docs/coursecontrolnumber_remint.md): a keep-number prefix re-key with gap-fills. Nothing is applied; there is no --apply.

## Headline

- **Ids that move:** 372 (133 catalog, 239 singletons) in 226 families; 165 gap-filled, 201 kept number, 6 returned home.
- **Courses behind them:** 907 member courses, 737 of them on an accounting code; the other 170 sit on business codes inside families whose majority is accounting, and move with their identity (units and codes never split one).
- **Shells on another prefix that follow a BUSI target:** BSOT M10IH.
- **Scope of the count:** 837 courses on the four codes sit in the minted layer (memberships and singletons). kb/status/statewide_subject_codes.json counts every COCI course on them (the lane's 1,012); the rest carry no M-ID yet and take ACCT at their first mint once the map and the filings change.
- **Held (person-settled):** 1 family, 1 ids.
- **Flagged, staying:** 29 families, 83 accounting courses among them.
- **Homonyms:** 1 of 81 college codes.

## Validation (the plan)

- **P0_not_applied**: pass
- **V1_new_ids_unique_and_free**: pass
- **V2_codes**: pass
- **V3_no_vacated_slot**: pass
- **V4_held_and_flagged_never_move**: pass
- **V5_families_whole**: pass
- **V6_honors_with_base**: pass
- **V7_only_M_ids**: pass

## Apply gates (open by design in a dry run)

- **G1_statewide_filings**: OPEN. a person filed these codes under Business on the Local subjects List; the apply waits for the re-filing under Accounting (or a logged reopen on new source evidence)
  - `_SUBJ_DISC::ACC`: Business (a reviewer, 2026-11-24T12:46:40.)
  - `_SUBJ_DISC::ACCT`: Business (a reviewer, 2026-11-24T12:46:39.)
  - `_SUBJ_DISC::ACCTG`: Business (a reviewer, 2026-11-24T12:46:39.)
  - `_SUBJ_DISC::ACTG`: Business (a reviewer, 2026-11-24T12:46:40.)
- **G2_fresh_read**: OPEN. the apply reads kb_curation for every moved id at write time

## Held: a person set it

| Family | Ids | Title | Why | Curator's value |
|---|---|---|---|---|
| BSOT 127 X | BUSI M1077 |  | a person merged BUSI M1077 into BSOT 127 X, which does not move | `{"BUSI M1077": {"merge_into": "BSOT 127 X", "by": "map@rccd.edu"}}` |

## Flagged: accounting courses that stay where they are

| Family | Ids | Title | Accounting courses | Confidence | Why |
|---|---|---|---|---|---|
| WEXP M1001 | 1 | Work Experience Education | 31 of 2190 | 1 | the family's record sits on WEXP (Work Experience Instructors), not BUSI |
| BUSI M1019 | 10 | Introduction to Accounting: Bookkeeping Concepts | 11 of 25 | 66 | accounting courses are 11 of 25 (under half) |
| BUSI M1143 | 2 | Bookkeeping | 5 of 11 | 67 | accounting courses are 5 of 11 (under half) |
| BUSI M1054 | 1 | General Accounting | 3 of 7 | 66 | accounting courses are 3 of 7 (under half) |
| BUSI M1308 | 1 | Personal Finance | 3 of 50 | 4 | the title reads as another subject |
| SOCS M1051 | 1 | Personal Financial Planning | 3 of 10 | 18 | the family's record sits on SOCS (Social Science), not BUSI |
| VOCE M1002 | 8 | Introduction to Spreadsheets - Using MS Excel | 3 of 18 | 10 | the family's record sits on VOCE (Vocational), not BUSI |
| BUSI M1101 | 4 | Enrolled Agent – Individual Taxation | 2 of 5 | 64 | accounting courses are 2 of 5 (under half) |
| BUSI M1377 | 9 | Computer Keyboarding: 10 Key | 2 of 11 | 11 | the title reads as another subject |
| BUSI M10SY | 1 | Business Financial Planning Using Excel | 1 of 1 | 60 | the title reads as another subject |
| BUSI M1106 | 1 | Data Analytics and Design (Alteryx) | 1 of 2 | 30 | the title reads as another subject |
| BUSI M1115 | 1 | Data Analytics Fundamentals | 1 of 3 | 20 | the title reads as another subject |
| BUSI M11EJ | 1 | Education and Financial Pathways for Justice-Impacted Students | 1 of 1 | 60 | the title reads as another subject |
| BUSI M11JJ | 1 | Manage Finances W/Quicken | 1 of 1 | 60 | the title reads as another subject |
| BUSI M11OG | 1 | Introduction to Quicken | 1 of 1 | 60 | the title reads as another subject |
| BUSI M11OM | 1 | Personal Investing | 1 of 1 | 60 | the title reads as another subject |
| BUSI M1202 | 2 | Mathematics for Business | 1 of 46 | 21 | accounting courses are 1 of 46 (under half) |
| BUSI M1224 | 1 | Spreadsheets 3 - Certification | 1 of 2 | 30 | the title reads as another subject |
| BUSI M1295 | 1 | Spreadsheet - MS Excel | 1 of 2 | 30 | the title reads as another subject |
| BUSI M1299 | 4 | Computerized Bookkeeping and Accounting 2 | 1 of 3 | 60 | accounting courses are 1 of 3 (under half) |
| BUSI M1310 | 1 | Individual Financial Planning | 1 of 2 | 30 | the title reads as another subject |
| BUSI M1311 | 1 | Introduction to Financial Planning | 1 of 2 | 30 | the title reads as another subject |
| BUSI M1335 | 1 | Spreadsheets 1 | 1 of 3 | 20 | the title reads as another subject |
| BUSI M1341 | 1 | Spreadsheets 2 | 1 of 3 | 20 | the title reads as another subject |
| BUSI M1396 | 5 | Principles of Money Management for Success | 1 of 12 | 5 | the title reads as another subject |
| BUSI M1455 | 5 | Computer Accounting for Small Businesses | 1 of 4 | 55 | accounting courses are 1 of 4 (under half) |
| BUSI M9170 | 4 | Not for Profit Recordkeeping and Compliance Noncredit | 1 of 3 | 40 | accounting courses are 1 of 3 (under half) |
| ITIS M1295 | 8 | Data Analytics and Visualization (Tableau) | 1 of 16 | 4 | the family's record sits on ITIS (Computer Information Systems), not BUSI |
| REAL M1052 | 7 | Real Estate Exchanges and Exchange Taxation | 1 of 6 | 50 | the family's record sits on REAL (Real Estate), not BUSI |

## Homonyms (a college's accounting code that names another subject)

| College and code | Courses | Read as accounting | Titles |
|---|---|---|---|
| Copper Mountain College|ACC | 4 | 0 | ACCESS (DSPS) Computer Keyboarding; ACCESS (DSPS) Computer Skills and Academic Support Lab; Introduction to Learning Disabilities; Strategies for College Success |

These courses never count toward a family's accounting share. The subject map edit below would call them Accounting statewide, so the apply first files a college-keyed subject decision for each.

## Moves by family (largest first)

| Family | Ids | Courses | Accounting | Confidence | New id of the family's record |
|---|---|---|---|---|---|
| BUSI M1082 | 10 | 55 | 45 | 89 | ACCT M1179 |
| BUSI M1032 | 7 | 46 | 33 | 83 | ACCT M1137 |
| BUSI M1079 | 1 | 37 | 24 | 79 | ACCT M1176 |
| BUSI M1046 | 1 | 31 | 21 | 81 | ACCT M1150 |
| BUSI M1001 | 2 | 28 | 24 | 91 | ACCT M1110 |
| BUSI M1027 | 1 | 27 | 21 | 87 | ACCT M1134 |
| BUSI M1038 | 1 | 23 | 20 | 92 | ACCT M1142 |
| BUSI M1088 | 9 | 23 | 18 | 87 | ACCT M1184 |
| BUSI M1128 | 1 | 22 | 19 | 92 | ACCT M1128 |
| BUSI M1069 | 1 | 20 | 16 | 88 | ACCT M1167 |
| BUSI M1215 | 9 | 19 | 17 | 94 | ACCT M1215 |
| BUSI M1434 | 9 | 18 | 12 | 80 | ACCT M1434 |
| BUSI M1439 | 1 | 18 | 9 | 70 | ACCT M1439 |
| BUSI M1301 | 10 | 16 | 11 | 81 | ACCT M1301 |
| BUSI M1056 | 8 | 14 | 11 | 87 | ACCT M1155 |
| BUSI M1057 | 10 | 14 | 11 | 87 | ACCT M1156 |
| BUSI M1076 | 1 | 14 | 8 | 74 | ACCT M1174 |
| BUSI M1024 | 1 | 13 | 8 | 77 | ACCT M1127 |
| BUSI M1068 | 1 | 13 | 12 | 95 | ACCT M1165 |
| BUSI M1340 | 8 | 12 | 7 | 75 | ACCT M1340 |
| BUSI M1343 | 8 | 12 | 12 | 100 | ACCT M1343 |
| BUSI M1037 | 5 | 11 | 6 | 73 | ACCT M1141 |
| BUSI M1344 | 8 | 10 | 10 | 100 | ACCT M1344 |
| BUSI M1006 | 1 | 9 | 9 | 100 | ACCT M1115 |
| BUSI M1075 | 2 | 9 | 9 | 100 | ACCT M1173 |
| BUSI M1041 | 1 | 8 | 6 | 85 | ACCT M1146 |
| BUSI M1044 | 1 | 8 | 8 | 100 | ACCT M1148 |
| BUSI M1074 | 1 | 8 | 6 | 85 | ACCT M1172 |
| BUSI M1111 | 3 | 7 | 7 | 100 | ACCT M1111 |
| BUSI M1255 | 5 | 7 | 5 | 83 | ACCT M1255 |
| BUSI M1013 | 1 | 6 | 3 | 70 | ACCT M1121 |
| BUSI M1129 | 3 | 6 | 4 | 80 | ACCT M1129 |
| BUSI M1294 | 3 | 6 | 6 | 100 | ACCT M1294 |
| BUSI M1008 | 1 | 5 | 4 | 88 | ACCT M1117 |
| BUSI M1011 | 4 | 5 | 5 | 100 | ACCT M1120 |
| BUSI M1017 | 1 | 5 | 3 | 76 | ACCT M1123 |
| BUSI M1026 | 1 | 5 | 4 | 88 | ACCT M1133 |
| BUSI M1051 | 2 | 5 | 4 | 88 | ACCT M1051 |
| BUSI M1066 | 1 | 5 | 5 | 100 | ACCT M1163 |
| BUSI M1342 | 1 | 5 | 5 | 100 | ACCT M1342 |
| BUSI M9083 | 1 | 5 | 3 | 76 | ACCT M9083 |
| BUSI M9154 | 1 | 5 | 3 | 76 | ACCT M9154 |
| BUSI M1009 | 1 | 4 | 2 | 70 | ACCT M1118 |
| BUSI M1010 | 1 | 4 | 3 | 85 | ACCT M1119 |
| BUSI M1073 | 1 | 4 | 3 | 85 | ACCT M1171 |
| BUSI M1087 | 1 | 4 | 4 | 100 | ACCT M1183 |
| BUSI M1131 | 1 | 4 | 4 | 100 | ACCT M1131 |
| BUSI M1144 | 3 | 4 | 4 | 100 | ACCT M1144 |
| BUSI M1219 | 1 | 4 | 3 | 85 | ACCT M1219 |
| BUSI M1220 | 1 | 4 | 4 | 100 | ACCT M1220 |
| BUSI M1257 | 1 | 4 | 4 | 100 | ACCT M1257 |
| BUSI M1315 | 2 | 4 | 2 | 70 | ACCT M1315 |
| BUSI M9011 | 1 | 4 | 2 | 70 | ACCT M9011 |
| BUSI M9017 | 1 | 4 | 2 | 70 | ACCT M9017 |
| BUSI M1004 | 1 | 3 | 3 | 100 | ACCT M1113 |
| BUSI M1016 | 1 | 3 | 3 | 100 | ACCT M1122 |
| BUSI M1025 | 1 | 3 | 3 | 100 | ACCT M1132 |
| BUSI M1040 | 1 | 3 | 3 | 100 | ACCT M1145 |
| BUSI M1049 | 1 | 3 | 2 | 80 | ACCT M1049 |
| BUSI M1065 | 1 | 3 | 3 | 100 | ACCT M1162 |
| ... | 166 more families in plan.json | | | | |

## The edits the apply makes in its commit

```json
{
 "kb/discipline_canonical_subj4.json": {
  "disciplines.Business.cid_subject_codes": {
   "before": [
    "BUS",
    "ACCT",
    "BSOT"
   ],
   "after": [
    "BUS",
    "BSOT"
   ]
  },
  "disciplines.Business.local_subject_variants": {
   "before": {
    "ACCT": 494,
    "ACCTG": 146,
    "ACC": 56,
    "ACTG": 97
   },
   "after": "dropped by kb/_seed_canonical_subj4.py (the chain's csr-seed step) once the ids move"
  },
  "disciplines.Accounting.canonical_subj4": {
   "before": "ACCT",
   "after": "ACCT"
  },
  "disciplines.Accounting.total_mids": {
   "before": 0,
   "after": "rebuilt by csr-seed (133 catalog ids move)"
  },
  "disciplines.Accounting._notes": {
   "before": "Assigned at Confident (97%): C-ID's own prefix for the discipline. C-ID's ACCT descriptors (ACCT 110, 120); ACCT is the local code at 50 colleges and ACCTG at 18. No M-ID is minted under it yet.",
   "after": "drop 'No M-ID is minted under it yet'; name this re-point and its receipt"
  }
 },
 "kb/reference/subject_discipline_map.json": {
  "map.ACCT": {
   "before": "Business",
   "after": "Accounting"
  },
  "map.ACCTG": {
   "before": "Business",
   "after": "Accounting"
  },
  "map.ACC": {
   "before": "Business",
   "after": "Accounting"
  },
  "map.ACTG": {
   "before": null,
   "after": "Accounting"
  },
  "map.ACCOUNT": {
   "before": "Business",
   "after": "Accounting"
  },
  "map.ACCTNG": {
   "before": "Business",
   "after": "Accounting"
  }
 }
}
```

## Blast radius

- kb_curation: 206 rows keyed by a moved id, 146 `merge_into` pointers naming one (both re-keyed by supabase-rekey.yml).
- Articulations: 21 records on moved ids, 21 exhibits, 21 carrying credit recommendations.

- `kb/promotions.json`: 14 tokens, 14 ids
- `kb/crnc_mirrors.json`: 19 tokens, 19 ids
- `kb/coci_articulations.json`: 36 tokens, 15 ids
- `kb/cid_articulation_joins.json`: 85 tokens, 15 ids
- `kb/coci_inactive_cards.json`: 15 tokens, 15 ids
- `unified_courses_data.js`: 277 tokens, 255 ids
- `unified_courses_standalone.js`: 116 tokens, 116 ids
- `coci_lookup_data.js`: 906 tokens, 355 ids
- `credential_reference_data.js`: 19 tokens, 15 ids
- `prototype/ccr_universe.json`: 376 tokens, 211 ids
- `prototype/ccr_universe_members.json`: 211 tokens, 211 ids
- `prototype/ccr_remint_blast.json`: 81 tokens, 81 ids

## What the apply needs (the template's chain, plus this run's own)

1. Clear G1: the four `_SUBJ_DISC::` filings re-filed under Accounting on the Local subjects List, or the reopen logged on new source evidence. File a college-keyed decision for each homonym first.
2. Freeze this receipt; the apply reproduces it (P1) after a fresh read of kb_curation for every moved id (P3) and a re-check of pending `unified_title_merge_confirm` targets (Rule 10).
3. Apply the kb (memberships, courses, singletons, articulations, curation mirror) with `_acct_repoint_from` stamps, and the two edits above, in one commit.
4. Register `kb/acct_repoint_out/2026-11-26/alias_map.json` in kb/alias_chain.py ALIAS_MAPS in the same commit, then `python3 kb/_post_apply_chain.py` (promotions, crnc mirrors, csr-seed, authority, audit, fold-verify).
5. Re-key SkyView's layout and the generated files token for token (the recode's `--rekey-skyview --rekey-generated` shape), rebuild ccr_cpl.json, ccr_sky.json and the blast radius; the dependency map rebuilds on main.
6. Rebuild kb/statewide_subject_codes.json and kb/local_subject_recommendations.json, which read the map: the statewide calls then read ACCT for these codes.
7. After the merge, in one cron window: supabase-rekey.yml with the receipt, a read-back (no row on an old id), then daily-dashboard.yml.

## Follow-ons (not in this run)

- BUAC, BUSAC and ACCTGFS read as accounting and stay out of scope; their courses count as non-accounting members here.
- LING, HOSP, the religion codes (RLST, RELS, RELG), MCOM and AERO take the same planner shape.
