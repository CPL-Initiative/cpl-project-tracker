# The common-subject alignment re-mint (S749): DRY RUN, 2026-11-28

The ruling (r-full-remint-for-new-joins-sam-2026-11-28; Sam via COBIx, 2026-11-28): re-mint every M-ID whose common code or discipline join changes under the new alignment (#3952), once, in one pass; leave every other M-ID alone. Nothing is applied. The playbook governs the apply (docs/coursecontrolnumber_remint.md): a prefix re-key that keeps the number, the receipt registered in kb/alias_chain.py ALIAS_MAPS, the post-apply chain, one cron window.

**`kb/mid_forwarding.csv` is a DRAFT.** It carries one row per planned move; the apply writes the same rows as its alias_map.json receipt and registers it in ALIAS_MAPS. Until then no reader resolves through it.

## Validation

- **V0_every_alignment_change_is_carried**: pass
- **V1_each_id_one_new_id_unique_and_free**: pass
- **V2_no_old_id_left_on_a_moving_code**: pass
- **V3_only_M_ids**: pass
- **V4_every_planned_id_has_a_forwarding_row**: pass
- **V5_codes_free**: pass
- **V7_person_settled_codes_kept**: pass
- **V6_person_rows_held**: pass

## Totals: 346 M-IDs (323 needs_yes, 23 planned)

| Scope | Reason | Code | Discipline join after | Ids | Catalog | Stand-alone | Kept number | Gap-filled | Status |
|---|---|---|---|---|---|---|---|---|---|
| nutr-fold | NUTR folds into FDNT (Sam, 2026-11-28, group_rulings.txt: NUTR (Dietetics/Nutritional Science) folds into FDNT; NUTR retired as alias) | NUTR -> FDNT | Nutritional Science/Dietetics | 320 | 54 | 266 | 209 | 111 | 320 needs_yes |
| aero | Aeronautics AERO -> AERN (Sam, 2026-11-28, COBIx's minted list #3951; AERO stays a local variant of Aviation) | AERO -> AERN | Aeronautics | 9 | 1 | 8 | 9 | 0 | 9 planned |
| phtc | PHTC left Photographic Technology/ Commercial Photography for CPHT in #3952; a person filed the local code PHTC under Photography (_SUBJ_DISC::PHTC, 2026-11-24) | PHTC -> PHOT | Photography | 4 | 0 | 4 | 0 | 4 | 4 planned |
| pubr | PUBR is no discipline's code; the Nov 28 picks join its local subject (PUB REL) to Public Relations, whose code is PREL (Sam, 2026-11-28: codes no M-ID starts with) | PUBR -> PREL | Public Relations | 1 | 1 | 0 | 1 | 0 | 1 needs_yes |
| tour | TOUR is no discipline's code; the Nov 28 picks join its local subject to Travel Services, whose code is TRVL (Sam, 2026-11-28: codes no M-ID starts with) | TOUR -> TRVL | Travel Services | 12 | 4 | 8 | 12 | 0 | 2 needs_yes, 10 planned |

Seed and picks edits the apply makes beside the re-key (proposed here, not committed):

- nutr-fold: Dietetics/Nutritional Science leaves the seed and becomes an alias of Nutritional Science/Dietetics in kb/discipline_aliases.json; NUTR joins FDNT's local variants.
- aero: Aeronautics canonical_subj4 AERO -> AERN (held by kb/_apply_minted_codes_s749.py for this pass).
- tour: the two TOUR picks move to TRVL, `kb/subject_title_hunt/20261128_common_picks_tail.csv` (Saddleback College TOUR, Southwestern College T&T).
- aero: Fresno City College AEROST's pick (COBI, `M-ID AERO`) follows Aeronautics to AERN; Allan Hancock SPACE's pick already names AERN (Space Technology follows Aeronautics) and applies once AERN exists.
- Codes the ruling asked for where the minted list collided (already the seed's, checked free by V5): Flight Attendant Training **FLTR** (FLTA prefixes 6 Foreign Languages (Filipino) M-IDs; FLTR is Sam's own pick of 2026-11-23 (S717) and no M-ID starts with it); Public Relations **PREL** (PUBR prefixes 1 M-ID with no discipline); Travel Services **TRVL** (TOUR prefixes 12 M-IDs with no discipline).
- Cardiovascular Technology: CVTC -> CVTE landed in #3952; no M-ID carries CVTC or CVTE (V0 measured every prefix).

## Frozen-row conflicts: yes/no for Sam

Each is a person's value that a Nov 28 ruling or the minted list would change. Where Sam's ruling names the change, the plan follows it and the apply refuses those rows until the yes is recorded; where only the minted list proposes it, the person's code stays and nothing moves. Sam's four noncredit codes of 2026-11-22 (HMEN, CTZN, HLSN, DSPN) are frozen (V7).

1. Dietetics/Nutritional Science holds NUTR by map@rccd.edu's curator override (2026-05-23). Fold it as ruled (NUTR -> FDNT)? Example: NUTR M1001 *Advanced Nutrition* -> FDNT M1042. *Yes* or *No*.
2. A person filed the local code NUTR under Dietetics/Nutritional Science (2026-11-24), the discipline the fold retires. Fold it as ruled (NUTR -> FDNT)? Example: NUTR M1001 *Advanced Nutrition* -> FDNT M1042. *Yes* or *No*.
3. A person filed the local code JOUR under Journalism (2026-11-24), and the ids it feeds join Public Relations. Re-mint them as planned (PUBR -> PREL)? Example: PUBR M1001 *Principles of Public Relations* -> PREL M1001. Ids: PUBR M1001. *Yes* or *No*.
4. A person filed the local code ATC under Aviation (2026-11-24), and the ids it feeds join Travel Services. Re-mint them as planned (TOUR -> TRVL)? Example: TOUR M1002 *Travel Destinations: Europe, Africa, and the Middle East* -> TRVL M1002. Ids: TOUR M1002, TOUR M1003. *Yes* or *No*.
5. Flight Attendant Training: COBIx's minted list proposes FLTA; Sam (in session, S717) named FLTR (2026-11-23). The plan keeps FLTR and moves nothing. Keep FLTR? *Yes* or *No*.
6. Home Economics: Noncredit: COBIx's minted list proposes HECN; Sam (in session, S705) named HMEN (2026-11-22). The plan keeps HMEN and moves nothing. Keep HMEN? *Yes* or *No*.

No moving M-ID carries a person's kb_curation row in the committed overlay, and no person points at one; the SELECT below re-reads the live table.

## Surprises

1. **NUTR is 320 M-IDs, not 54**: 54 catalog and 266 stand-alone. FDNT already holds its own ids, so 111 NUTR ids gap-fill rather than keep their number.
2. **AERO is 9 M-IDs, not 1**, and none is aeronautics: all are Fresno City College's Air Force ROTC (local subject AEROST, TOP 1801 Military Studies; *AS100 Heritage and Values*). The seed's own note on Aeronautics says they belong with Military Studies (MILS), where eight Army ROTC ids already sit. The plan follows the ruling's words (AERN); yes/no: send these nine to MILS instead?
3. **PHTC was missed by #3952**: it re-coded Photographic Technology/ Commercial Photography PHTC -> CPHT counting catalog M-IDs only, and 4 stand-alone ids carry PHTC (Antelope Valley, Moorpark). A person filed the local code PHTC under Photography (2026-11-24), and one of the four already merges into PHOT M1041, so they move to PHOT.
4. **TOUR is 12 M-IDs**: 4 catalog and 8 Saddleback stand-alones; two catalog ids came from a local subject ATC (TOUR M1002, M1003).
5. **The alias changes move nothing**: no M-ID's discipline is African American Studies, Asian American Studies or Speech Communication. Ethnic Studies' 754 rows keep ETHS; sorting its African American and Asian American titles into AFAM and ASAM is new classification, not a join change, so it is outside this pass.
6. **301 M-IDs on 117 other stray codes** stay outside the plan: the stray-code lane retires them to Needs an M-ID (r-no-mid-on-a-stray-code-sam-2026-11-25), and the Nov 28 picks now name a common code for many of their local subjects (the table below), which unblocks that lane's held rows.

## Stray codes outside the plan (the stray-code lane's)

| Code | Ids | Nov 28 picks for their local subjects |
|---|---|---|
| AF | 2 | MILS 2 |
| AFXX | 1 | none |
| AIRT | 1 | AVIA 1 |
| APT | 3 | none |
| ARHI | 1 | none |
| ARHS | 1 | ARTH 1 |
| ARLN | 2 | AVIA 2 |
| ART | 3 | none |
| ARTA | 4 | none |
| ARTB | 1 | none |
| ARTC | 1 | none |
| ARTV | 1 | FTVE 1 |
| ARTX | 4 | none |
| ARTZ | 1 | ARTS 1 |
| AT | 5 | none |
| ATC | 17 | HOTL 1 |
| ATXX | 2 | none |
| AVI | 3 | none |
| BAR | 1 | BARB 1 |
| BROA | 1 | none |
| BUST | 1 | none |
| CINA | 2 | FTVE 2 |
| CMPE | 1 | none |
| CMRT | 1 | ARTD 1 |
| CMS | 1 | FMED 1 |
| CMSD | 1 | COMM 1 |
| COSY | 2 | none |
| CRAE | 2 | none |
| DART | 1 | none |
| DBA | 6 | none |
| DBAX | 1 | none |
| DDP | 1 | none |
| DES | 1 | none |
| DESG | 1 | DRAF 1 |
| DESN | 1 | none |
| DMC | 1 | MCOM 1 |
| DMED | 1 | MULT 1 |
| EMER | 1 | none |
| ENGW | 1 | ENGL 1 |
| EPHO | 3 | none |
| ESTH | 2 | COSM 2 |
| ESTI | 1 | none |
| F | 2 | none |
| FA | 2 | ARTS 2 |
| FJMP | 7 | none |
| FL | 1 | FLNG 1 |
| FLTE | 1 | ENGT 1 |
| FMA | 3 | none |
| FMS | 6 | none |
| FMT | 2 | COUN 2 |
| FP | 1 | none |
| FST | 1 | none |
| FTVM | 3 | none |
| GC | 1 | none |
| GCIP | 4 | AVIA 4 |
| GCMW | 2 | MULT 2 |
| GLOB | 1 | SOCS 1 |
| GMD | 2 | none |
| HOSM | 1 | none |
| HTT | 9 | HOTL 9 |
| HUMN | 6 | HUMA 6 |
| HUSV | 1 | none |
| IDNM | 2 | MULT 2 |
| IDSG | 2 | INDD 2 |
| INFO | 6 | LIBR 6 |
| IXD | 10 | MULT 10 |
| JAMS | 8 | JOUR 8 |
| LAC | 1 | none |
| LBRY | 1 | LIBR 1 |
| LIBS | 12 | LIBR 11, LIBT 2, LSKL 1 |
| LIS | 8 | BSKL 1, LIBR 6 |
| LLS | 2 | none |
| LR | 2 | LIBR 2 |
| LRNR | 1 | LIBR 1 |
| LS | 1 | LIBR 1 |
| LT | 1 | LIBR 1, LIBT 1 |
| MAD | 2 | FTVE 2 |
| MART | 1 | none |
| MCTV | 1 | FTVE 1 |
| MEA | 3 | none |
| MEDI | 1 | none |
| MSCM | 1 | none |
| NAL | 1 | ETHS 1 |
| NAVI | 2 | none |
| NC | 7 | COUN 3 |
| NCCO | 3 | none |
| NCID | 2 | none |
| NCPH | 2 | none |
| NCTH | 2 | none |
| NCVO | 2 | none |
| OAD | 1 | none |
| OAP | 1 | none |
| OFFT | 1 | MULT 1 |
| OLDA | 3 | none |
| OLDR | 12 | none |
| PHO | 3 | none |
| PHTG | 3 | PHOT 3 |
| PUB | 1 | none |
| RDIO | 1 | BRDC 1 |
| RTV | 7 | BRDC 1 |
| RTVF | 1 | none |
| SCE | 2 | none |
| SPED | 5 | EDUC 5 |
| TAC | 1 | none |
| TAFI | 1 | none |
| TECC | 3 | ENGL 3 |
| TELE | 2 | TCOM 2 |
| TH | 2 | none |
| TICU | 2 | none |
| TT | 7 | TOUR 7 |
| TV | 2 | none |
| TVR | 3 | BRDC 1 |
| VBUS | 1 | none |
| VCST | 1 | none |
| VFPA | 1 | none |
| WORK | 2 | none |
| YUR | 1 | YURO 1 |

## References: committed files that name a moving M-ID

Exact id tokens (`git grep`), on the working tree the dry run read. Era check: every era-stamped file (kb/promotions.json, kb/crnc_mirrors.json) is current with the chain, so a direct match is the comparison.

| Class | Files | Examples |
|---|---|---|
| historical receipt (never re-keyed) | 52 | docs/visuals/2026-09-03-prefix-fold-worklist.html, kb/automerge_out/2026-06-12/plan.json, kb/automerge_out/2026-06-12/supabase_ops.sql, kb/automerge_out/2026-06-13-titlelane/plan.json, kb/automerge_out/2026-06-13-titlelane/supabase_ops.sql, kb/ccr_out/2026-07-10/wave2_manifest.json … |
| identity (re-keyed by the apply and the post-apply chain) | 7 | kb/coci_articulations.json, kb/coci_curation.json, kb/coci_minted_courses.json, kb/coci_minted_memberships.json, kb/coci_minted_singletons.json, kb/crnc_mirrors.json … |
| SkyView layout (--rekey-skyview) | 2 | prototype/ccr_universe.json, prototype/ccr_universe_members.json |
| generated payload (daily build, or --rekey-generated) | 12 | credential_reference_data.js, prototype/ccr_cpl.json, prototype/ccr_cpl_universe_members.json, prototype/ccr_remint_blast.json, unified_courses_aligned.js, unified_courses_data.js … |
| exhibits / CER / EACR | 5 | kb/cid_articulation_joins.json, kb/cr_reference_worklist.json, kb/exhibit_side_by_side.json, kb/exhibits_review_subjects.json, kb/side_by_side.json |
| CCR cards | 3 | kb/coci_closest_mid.json, kb/coci_inactive_cards.json, kb/coci_retired_cards.json |
| status (kb/status, rebuilt by its builders) | 28 | kb/status/mid_outcomes_compare_2026-11-12.json, kb/status/statewide_code_courses/A.json, kb/status/statewide_code_courses/B.json, kb/status/statewide_code_courses/C.json, kb/status/statewide_code_courses/D.json, kb/status/statewide_code_courses/E.json … |
| test fixture | 3 | tests/csr_trail_rules_test.py, tests/discipline_edge_fill_test.py, tests/zband_retire_apply_test.py |
| other kb file | 2 | kb/discipline_blanks_worklist.json, kb/remint_blast_worklist.json |
| other | 3 | archive/coci_unified_courses_clusters_2026-05-30_pre-dissolution.json, coci_lookup_data.js, excel_to_dashboard.py |

Open PRs touching those files (read 2026-11-28 15:30Z): #3917 (COBIx: kb/status/csr_proposed_codes.json, local_subject_recommendations.json, mq_view.json, statewide_subject_codes.json, statewide_code_courses/*; rebuilt by their builders after the apply) and #3953 (kb/status/commons.json, commons_history.json; counts only, no M-ID). #3951 is #3952's source. #3950, #3926 and #3383 touch none.

## Every M-ID that would change

Status: planned · needs_yes (the yes/no list) · held_person. Discipline before is the row's (a curator's overlay wins); none means it joined only by its code. References: files by class (id: identity, gen: generated, sky: SkyView, cer: exhibits/CER/EACR, ccr: CCR cards, st: status, t: tests, hist: receipts).

| Old id | New id | How | Code | Discipline before -> after | Title | Status | Overlay | References |
|---|---|---|---|---|---|---|---|---|
| AERO M1001 | AERN M1001 | kept number | AERO -> AERN | none -> Aeronautics | AS200 Leadership Laboratory C | planned | unified_title | sky 2, cer 1, gen 5, hist 10, id 2, o 1, st 2, t 2 |
| AERO M10AW | AERN M10AW | kept number | AERO -> AERN | none -> Aeronautics | As100 Heritage and Values | planned | - | sky 2, gen 6, hist 3, id 1, o 2, st 1 |
| AERO M10AX | AERN M10AX | kept number | AERO -> AERN | none -> Aeronautics | AS100 Heritage and Values A | planned | - | sky 2, gen 6, hist 3, id 1, o 2, st 1 |
| AERO M10AY | AERN M10AY | kept number | AERO -> AERN | none -> Aeronautics | AS100 Leadership Laboratory A | planned | - | sky 2, gen 6, hist 3, id 1, o 1, st 2 |
| AERO M10AZ | AERN M10AZ | kept number | AERO -> AERN | none -> Aeronautics | AS100 Leadership Laboratory B | planned | - | sky 2, gen 6, hist 3, id 1, o 1, st 2 |
| AERO M10BA | AERN M10BA | kept number | AERO -> AERN | none -> Aeronautics | AS200 Leadership Laboratory C | planned | merge_into | gen 1, hist 6, id 3, o 1, t 1 |
| AERO M10BB | AERN M10BB | kept number | AERO -> AERN | none -> Aeronautics | AS200 Leadership Laboratory D | planned | merge_into | gen 1, hist 6, id 3, o 1 |
| AERO M10BC | AERN M10BC | kept number | AERO -> AERN | none -> Aeronautics | As200 Team and Leadership Fundamentals | planned | - | sky 2, gen 6, hist 3, id 1, o 2, st 2 |
| AERO M10BD | AERN M10BD | kept number | AERO -> AERN | none -> Aeronautics | AS200 Team and Leadership Fundamentals A | planned | - | sky 2, gen 6, hist 3, id 1, o 2, st 2 |
| NUTR M1001 | FDNT M1042 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Advanced Nutrition | needs_yes | - | ccr 1, sky 2, cer 2, gen 6, hist 7, id 2, o 1, st 2 |
| NUTR M1002 | FDNT M1047 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Applications of Health and Wellness Coaching | needs_yes | - | sky 2, cer 2, gen 5, hist 7, id 3, o 1, st 4 |
| NUTR M1003 | FDNT M1049 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Applied Nutrition | needs_yes | - | sky 2, cer 2, gen 5, hist 7, id 2, o 1, st 3 |
| NUTR M1004 | FDNT M1050 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Plant-Based Nutrition | needs_yes | - | sky 2, cer 2, gen 5, hist 10, id 2, o 1, st 2 |
| NUTR M1005 | FDNT M1051 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Basic Cooking Techniques | needs_yes | - | sky 2, cer 2, gen 5, hist 9, id 3, o 1, st 3 |
| NUTR M1006 | FDNT M1052 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Careers in Dietetics and Food Science | needs_yes | merge_into | gen 2, hist 9, id 3, o 1 |
| NUTR M1007 | FDNT M1053 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Careers in Nutrition and Dietetics | needs_yes | unified_title | sky 2, cer 2, gen 6, hist 12, id 3, o 1, st 5 |
| NUTR M1008 | FDNT M1054 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Careers in Nutrition and Foods | needs_yes | unified_title | sky 2, cer 2, gen 6, hist 10, id 3, o 1, st 3 |
| NUTR M1009 | FDNT M1055 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | ServSafe Certification Exam Prep | needs_yes | - | sky 2, cer 2, gen 5, hist 7, id 3, o 1, st 2 |
| NUTR M1011 | FDNT M1056 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Maternal and Child Nutrition | needs_yes | - | sky 2, cer 2, gen 5, hist 17, id 2, o 1, st 2 |
| NUTR M1012 | FDNT M1057 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Health and Wellness Coaching | needs_yes | - | sky 2, cer 2, gen 6, hist 10, id 3, o 1, st 4 |
| NUTR M1013 | FDNT M1058 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Vegetarian Cuisine | needs_yes | unified_title | sky 2, cer 2, gen 6, hist 12, id 4, o 1, st 6 |
| NUTR M1014 | FDNT M1059 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cultural Foods | needs_yes | unified_title | sky 2, cer 2, gen 6, hist 16, id 3, o 1, st 4 |
| NUTR M1015 | FDNT M1060 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cultural Foods of the World | needs_yes | merge_into | gen 2, hist 11, id 3, o 1 |
| NUTR M1016 | FDNT M1061 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Food and Culture | needs_yes | unified_title | ccr 1, sky 2, cer 2, gen 7, hist 13, id 4, o 1, st 10 |
| NUTR M1017 | FDNT M1062 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Therapeutic Diets | needs_yes | unified_title | sky 2, cer 2, gen 6, hist 10, id 3, o 1, st 3 |
| NUTR M1018 | FDNT M1063 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition and Disease | needs_yes | - | sky 2, cer 2, gen 5, hist 18, id 3, o 1, st 3 |
| NUTR M1019 | FDNT M1064 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Experimental Offering in Nutrition and Foods | needs_yes | merge_into | gen 2, hist 8, id 3, o 1 |
| NUTR M1021 | FDNT M1065 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Fitness and Sport | needs_yes | unified_title | sky 2, cer 2, gen 7, hist 11, id 3, o 1, st 4 |
| NUTR M1022 | FDNT M1066 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Fitness and Sports | needs_yes | merge_into | gen 2, hist 9, id 3, o 1 |
| NUTR M1023 | FDNT M1023 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutritn/Fitness/Perform | needs_yes | - | sky 2, cer 2, gen 5, hist 7, id 2, o 1, st 3 |
| NUTR M1024 | FDNT M1024 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Intro Insti Food Ser | needs_yes | - | ccr 1, sky 2, cer 2, gen 3, hist 7, id 2, o 1, st 1 |
| NUTR M1025 | FDNT M1025 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Principles of Food with Lab | needs_yes | - | ccr 1, cer 1, gen 2, hist 8, id 3, o 1 |
| NUTR M1026 | FDNT M1026 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Food Theory and Preparation | needs_yes | - | sky 2, cer 3, gen 5, hist 7, id 2, o 1, st 2 |
| NUTR M1027 | FDNT M1027 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Food Science | needs_yes | - | ccr 1, gen 2, hist 8, id 3, o 1 |
| NUTR M1028 | FDNT M1028 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | International Foods | needs_yes | - | ccr 1, sky 2, cer 2, gen 3, hist 8, id 3, o 1, st 2 |
| NUTR M1029 | FDNT M1029 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition and Health | needs_yes | - | sky 2, cer 3, gen 6, hist 9, id 2, o 1, st 2 |
| NUTR M1030 | FDNT M1030 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Human Nutrition | needs_yes | - | ccr 1, cer 1, gen 2, hist 10, id 3, o 1 |
| NUTR M1031 | FDNT M1031 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Medical Nutrition Therapy | needs_yes | - | sky 2, cer 2, gen 6, hist 8, id 2, o 1, st 2 |
| NUTR M1032 | FDNT M1032 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Nutrition Science | needs_yes | - | ccr 1, cer 1, gen 2, hist 8, id 4, o 1, st 2 |
| NUTR M1033 | FDNT M1033 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition Issues Throughout Life | needs_yes | unified_title | sky 2, cer 2, gen 6, hist 11, id 3, o 1, st 4 |
| NUTR M1034 | FDNT M1034 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition | needs_yes | - | ccr 1, cer 1, gen 2, hist 8, id 3, o 1, st 2 |
| NUTR M1035 | FDNT M1035 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Physical Performance | needs_yes | - | sky 2, cer 2, gen 5, hist 7, id 2, o 1, st 2 |
| NUTR M1036 | FDNT M1036 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Practical Nutrition | needs_yes | - | ccr 1, sky 2, cer 2, gen 3, hist 6, id 2, o 1, st 1 |
| NUTR M1037 | FDNT M1037 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Women's Nutrition | needs_yes | - | sky 2, cer 2, gen 5, hist 5, id 2, o 1, st 2 |
| NUTR M1038 | FDNT M1038 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sports Nutrition | needs_yes | - | sky 2, cer 2, gen 6, hist 8, id 2, o 1, st 12 |
| NUTR M1039 | FDNT M1039 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Topics in Nutrition | needs_yes | - | sky 2, cer 2, gen 5, hist 7, id 2, o 1, st 1 |
| NUTR M1040 | FDNT M1040 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Rotations in Supervised Practice, Level C | needs_yes | unified_title | ccr 1, sky 2, cer 2, gen 6, hist 11, id 2, st 2 |
| NUTR M1041 | FDNT M1041 | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Clinical Experience in Nutritional Care Management | needs_yes | unified_title | sky 2, cer 2, gen 5, hist 10, id 2, st 2 |
| NUTR M10AA | FDNT M10DP | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | NUTR 7 - Food and Culture | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AB | FDNT M10DQ | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition: Across the Life Span | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AC | FDNT M10DR | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Adults and Aging | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 2 |
| NUTR M10AD | FDNT M10DS | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Advanced Food Preparation | needs_yes | - | ccr 1, sky 2, gen 6, hist 6, id 1, o 1, st 1 |
| NUTR M10AE | FDNT M10DT | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Advanced Medical Nutrition Therapy | needs_yes | - | sky 2, gen 6, hist 6, id 1, o 1, st 2 |
| NUTR M10AF | FDNT M10DU | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Healthy Aging and Longevity | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 2 |
| NUTR M10AG | FDNT M10DV | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Weight Management for Healthy Aging | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 1 |
| NUTR M10AH | FDNT M10DW | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Nursing and Allied Health Professionals | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 2 |
| NUTR M10AI | FDNT M10DX | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition and Health: Personal Applications | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AJ | FDNT M10DY | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sports Nutrition: Fueling the Athlete | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AK | FDNT M10DZ | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition and Athletic Performance | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AL | FDNT M10EA | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Rotations in Supervised Practice, Level B | needs_yes | - | ccr 1, sky 2, gen 6, hist 6, id 1, o 1, st 2 |
| NUTR M10AM | FDNT M10EB | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Baking Basics and Business | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 1 |
| NUTR M10AN | FDNT M10EC | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Plant-Based Food Principles and Preparation | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AO | FDNT M10ED | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Beer and Brewing | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10AP | FDNT M10EE | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Certified Dietary Manager (CDM) Board Exam Review | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 1 |
| NUTR M10AQ | FDNT M10EF | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Rotations in Supervised Practice, Level C | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10AR | FDNT M10EG | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Clinical Experience in Health Care Facilities | needs_yes | - | ccr 1, sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AS | FDNT M10EH | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Clinical Experience in Nutritional Care Management | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10AT | FDNT M10EI | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Management of the Dietary Department in Health Care Facilities | needs_yes | merge_into | gen 1, hist 9, id 2, o 1 |
| NUTR M10AU | FDNT M10EJ | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutritional Care Management | needs_yes | merge_into | gen 1, hist 17, id 3, o 1 |
| NUTR M10AV | FDNT M10EK | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutritional Care | needs_yes | merge_into | gen 1, hist 11, id 3, o 1 |
| NUTR M10AW | FDNT M10EL | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | The Food System and Career Opportunities | needs_yes | merge_into | gen 1, hist 9, id 3, o 1, st 1 |
| NUTR M10AX | FDNT M10EM | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Nutrition and Hospitality Careers | needs_yes | - | ccr 1, sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AY | FDNT M10EN | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Children and Weight Concerns | needs_yes | - | ccr 1, sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10AZ | FDNT M10EO | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Life Cycle Nutrition: Children | needs_yes | merge_into | gen 1, hist 9, id 2, o 1 |
| NUTR M10BA | FDNT M10EP | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Clinical Nutrition | needs_yes | - | sky 2, gen 6, hist 6, id 1, o 1, st 1 |
| NUTR M10BB | FDNT M10EQ | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Nutrition Concepts | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 2 |
| NUTR M10BC | FDNT M10ER | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Weight Control | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10BD | FDNT M10ES | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cooking Cultural Foods | needs_yes | merge_into | gen 1, hist 9, id 2, o 1, st 1 |
| NUTR M10BE | FDNT M10ET | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition in Healthy Cooking | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 2 |
| NUTR M10BF | FDNT M10EU | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutritional Cooking | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 2 |
| NUTR M10BG | FDNT M10EV | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cooking for Singles | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 2 |
| NUTR M10BH | FDNT M10EW | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cooking for Wellness | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 2 |
| NUTR M10BI | FDNT M10EX | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Food and Nutrition: Cross Cultural Perspectives | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10BJ | FDNT M10EY | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Culture and Cuisine of the World | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 1 |
| NUTR M10BK | FDNT M10EZ | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Culinary Professionals | needs_yes | - | sky 2, cer 2, gen 9, hist 14, id 2, o 1, kb 1, st 1 |
| NUTR M10BL | FDNT M10FA | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Honors - Cultural Foods of the World | needs_yes | - | sky 2, gen 5, hist 10, id 1, o 1, st 1 |
| NUTR M10BM | FDNT M10FB | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Food and Culture in the United States | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 2 |
| NUTR M10BN | FDNT M10FC | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Current Topics in Nutrition | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10BO | FDNT M10FD | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | World Food Customs and Nutrition | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10BP | FDNT M10FE | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Life Cycle Nutrition | needs_yes | merge_into | gen 1, hist 9, id 2, o 1 |
| NUTR M10BQ | FDNT M10FF | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Dietary Management | needs_yes | - | ccr 1, sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10BR | FDNT M10FG | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Nutrition, Dietetics and Food Science | needs_yes | merge_into | gen 1, hist 9, id 2, o 1 |
| NUTR M10BS | FDNT M10FH | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to the Dietetics Profession | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10BT | FDNT M10FI | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Survey of Nutrition and Dietetics | needs_yes | merge_into | gen 1, hist 9, id 2, o 1 |
| NUTR M10BU | FDNT M10FJ | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Dieting (Sifting Fact from Fiction) | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10BV | FDNT M10FK | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition, Weight Management, and Eating Disorders | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10BW | FDNT M10FL | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | The Science of Weight Management and Eating Disorders | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1 |
| NUTR M10BX | FDNT M10FM | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Elements of Nutrition | needs_yes | - | ccr 1, cer 1, hist 6, id 1, o 1 |
| NUTR M10BY | FDNT M10FN | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Essentials of Nutrition | needs_yes | - | sky 2, gen 6, hist 6, id 1, o 1, st 1 |
| NUTR M10BZ | FDNT M10FO | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Sport, Exercise, and Health | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10CA | FDNT M10FP | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sports and Exercise Nutrition | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 1 |
| NUTR M10CB | FDNT M10FQ | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Honors Family Nutrition | needs_yes | honors_of | sky 2, gen 5, hist 13, id 2, o 1, st 1 |
| NUTR M10CC | FDNT M10FR | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Family Nutrition | needs_yes | - | sky 2, gen 5, hist 12, id 2, o 1, st 1 |
| NUTR M10CD | FDNT M10FS | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Healthy Lifestyle: Food and Fitness | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10CE | FDNT M10FT | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Issue Food/Nutr/FoodSCI | needs_yes | - | sky 2, gen 3, hist 6, id 1, o 1, st 1 |
| NUTR M10CF | FDNT M10FU | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Intro to Food Service/ Work Organizations | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 2 |
| NUTR M10CG | FDNT M10FV | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Food and Nutrition | needs_yes | - | ccr 1, cer 1, hist 6, id 1, o 1 |
| NUTR M10CH | FDNT M10FW | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Nutrition and Food Professions | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10CI | FDNT M10FX | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Food Selection and Meal Preparation | needs_yes | - | ccr 1, cer 1, hist 6, id 1, o 1, st 1 |
| NUTR M10CJ | FDNT M10FY | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Menu Planning and Food Purchasing | needs_yes | merge_into | gen 1, hist 9, id 2, o 1, st 1 |
| NUTR M10CK | FDNT M10FZ | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sustainable Nutrition and Food Systems | needs_yes | - | sky 2, gen 5, hist 14, id 1, o 1, st 1 |
| NUTR M10CL | FDNT M10GA | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | The Scientific Principles of Food Preparation | needs_yes | - | ccr 1, cer 1, hist 6, id 1, o 1 |
| NUTR M10CM | FDNT M10GB | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Servsafe in Food Production | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10CN | FDNT M10GC | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Food-Production Systems | needs_yes | - | sky 2, gen 5, hist 6, id 1, o 1, st 1 |
| NUTR M10CO | FDNT M10GD | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Foods for Healthy Lifestyles | needs_yes | - | sky 2, cer 2, gen 9, hist 12, id 2, o 1, kb 1, st 2 |
| NUTR M10CP | FDNT M10GE | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Topics in Nutrition and Foods | needs_yes | merge_into | gen 1, hist 11, id 2, o 1 |
| NUTR M10CQ | FDNT M10GF | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Fundamentals of Nutrition | needs_yes | - | ccr 1, cer 1, hist 7, id 2, o 1 |
| NUTR M10CR | FDNT M10GG | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition, Health, and Wellness | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10CS | FDNT M10CS | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition and Healthy Weight | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 2 |
| NUTR M10CT | FDNT M10CT | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Honors Human Nutrition | needs_yes | - | ccr 1, cer 1, hist 6, id 1, o 1 |
| NUTR M10CU | FDNT M10CU | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition Honors | needs_yes | - | ccr 1, cer 1, hist 6, id 1, o 1 |
| NUTR M10CV | FDNT M10CV | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Human Performance and Sports Nutrition | needs_yes | merge_into | gen 1, hist 9, id 2, o 1 |
| NUTR M10CW | FDNT M10CW | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Science of Human Nutrition | needs_yes | - | ccr 1, cer 1, hist 6, id 1, o 1 |
| NUTR M10CX | FDNT M10CX | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Independ Study | needs_yes | - | sky 2, gen 3, hist 6, id 1, o 1, st 1 |
| NUTR M10CY | FDNT M10CY | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to the Nutrition Professions | needs_yes | merge_into | gen 1, hist 9, id 3, o 1 |
| NUTR M10CZ | FDNT M10CZ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Introduction to Nutrition and Trauma | needs_yes | - | sky 2, gen 6, hist 7, id 1, o 1, st 2 |
| NUTR M10DA | FDNT M10DA | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Rotations in Supervised Practice, Level A | needs_yes | merge_into | cer 2, gen 4, hist 15, id 4, o 1, kb 1, st 1 |
| NUTR M10DB | FDNT M10DB | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition and Life | needs_yes | - | ccr 1, cer 1, hist 6, id 1, o 1, st 1 |
| NUTR M10DC | FDNT M10DC | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Lifecycle Nutrition | needs_yes | merge_into | gen 1, hist 9, id 2, o 1 |
| NUTR M10DD | FDNT M10DD | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Vegetarian Lifestyle | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 2 |
| NUTR M10DE | FDNT M10DE | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Personalized Nutrition Planning for Lifetime Wellness | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 2 |
| NUTR M10DF | FDNT M10DF | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition Management | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| NUTR M10DG | FDNT M10DG | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sustainable Meals | needs_yes | - | sky 2, cer 2, gen 9, hist 12, id 2, o 1, kb 1, st 1 |
| NUTR M10DH | FDNT M10DH | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition and Menu Planning | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M10DI | FDNT M10DI | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutri & Metabolism | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| NUTR M10DJ | FDNT M10DJ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition and Metabolism | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| NUTR M10DK | FDNT M10DK | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | IS: Nutrition | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| NUTR M10DL | FDNT M10DL | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Science of Nutrition | needs_yes | - | ccr 1, hist 5, id 2, o 1 |
| NUTR M10DM | FDNT M10DM | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sanitation/Safety | needs_yes | merge_into | gen 1, hist 7, id 2, o 1 |
| NUTR M10DN | FDNT M10DN | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Supervision/Training | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 2 |
| NUTR M10DO | FDNT M10DO | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Supervison and Training Techniques | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 3 |
| NUTR M9001 | FDNT M9027 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Weight Regulation: Biology and Behavior | needs_yes | - | ccr 1, sky 2, cer 2, gen 5, hist 7, id 3, o 1, st 2 |
| NUTR M9002 | FDNT M9028 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Mother and Childhood Nutrition | needs_yes | - | ccr 1, sky 2, cer 2, gen 5, hist 7, id 3, o 1, st 1 |
| NUTR M9003 | FDNT M9029 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chinese Cooking | needs_yes | - | ccr 1, sky 2, cer 2, gen 3, hist 7, id 2, o 1, st 1 |
| NUTR M9004 | FDNT M9030 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Intro to Japanese Cooking | needs_yes | - | ccr 1, sky 2, cer 2, gen 3, hist 5, id 2, o 1, st 1 |
| NUTR M9005 | FDNT M9031 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Quick and Easy Salad Meals | needs_yes | - | ccr 1, sky 2, cer 2, gen 4, hist 6, id 2, o 1, st 1 |
| NUTR M9006 | FDNT M9032 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Holiday Gifts from the Kitchen | needs_yes | - | ccr 1, sky 2, cer 2, gen 3, hist 5, id 2, o 1, st 1 |
| NUTR M9007 | FDNT M9033 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Integrative Nutrition and Wellness | needs_yes | - | ccr 1, sky 2, cer 2, gen 5, hist 5, id 3, o 1, st 2 |
| NUTR M9008 | FDNT M9034 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Dim Sum 1 | needs_yes | unified_title | sky 2, cer 2, gen 3, hist 9, id 2, st 1 |
| NUTR M9009 | FDNT M9035 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Brazilian Cuisine Part 2 | needs_yes | unified_title | sky 2, cer 2, gen 3, hist 9, id 2, st 1 |
| NUTR M9010 | FDNT M9036 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | California Grilling 2 | needs_yes | unified_title | sky 2, cer 2, gen 3, hist 9, id 2, st 1 |
| NUTR M9011 | FDNT M9037 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Easy but Elegant Cooking | needs_yes | unified_title | sky 2, cer 2, gen 3, hist 9, id 2, st 1 |
| NUTR M9012 | FDNT M9038 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Garnishing and Fruit Carving | needs_yes | unified_title | sky 2, cer 2, gen 3, hist 5, id 2, st 1 |
| NUTR M9013 | FDNT M9039 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chef Skills: Tamales and More | needs_yes | unified_title | sky 2, cer 2, gen 3, hist 5, id 2, st 1 |
| NUTR M9014 | FDNT M9040 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Intro to Vietnamese Cooking | needs_yes | unified_title | sky 2, cer 2, gen 3, hist 5, id 2, st 1 |
| NUTR M9015 | FDNT M9041 | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Fresh Salads and Dressings | needs_yes | unified_title | sky 2, cer 2, gen 3, hist 5, id 2, st 1 |
| NUTR M90AA | FDNT M90GR | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | CDM Board Exam Preparation 1 | needs_yes | - | sky 2, gen 6, hist 6, id 1, o 1, st 2 |
| NUTR M90AB | FDNT M90GS | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Valentine Treats (Ages 6-10) | needs_yes | - | sky 2, gen 4, hist 6, id 1, o 1, st 1 |
| NUTR M90AC | FDNT M90GT | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Who's Setting the Table? (6-10 | needs_yes | - | sky 2, gen 3, hist 6, id 1, o 1, st 1 |
| NUTR M90AD | FDNT M90GU | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Espresso 101 | needs_yes | - | sky 2, gen 3, hist 6, id 1, o 1, st 1 |
| NUTR M90AE | FDNT M90GV | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | CDM Board Exam Preparation 2 | needs_yes | - | sky 2, gen 6, hist 6, id 1, o 1, st 2 |
| NUTR M90AF | FDNT M90GW | gap-filled | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | How 2 Make Fab Cheesecakes! | needs_yes | - | sky 2, gen 3, hist 6, id 1, o 1, st 1 |
| NUTR M90AG | FDNT M90AG | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Valentine Treats (Ages 3-5) | needs_yes | - | sky 2, gen 4, hist 4, id 1, o 1, st 1 |
| NUTR M90AH | FDNT M90AH | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Can I Help with Dinner? (3-5) | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AI | FDNT M90AI | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Spring Is Made 4 T, 4U & Frnds | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AJ | FDNT M90AJ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | All About Tarts | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AK | FDNT M90AK | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Fun Make-Ahead Light Dinners | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AL | FDNT M90AL | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Italian Cuisine Al Forno | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AM | FDNT M90AM | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | The Amazing Fish | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AN | FDNT M90AN | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Party Starters - Amuse-Bouche | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AO | FDNT M90AO | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Not Just Any Cookie! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AP | FDNT M90AP | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Salsa Anyone? | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AQ | FDNT M90AQ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Appetizers from Around the Wor | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AR | FDNT M90AR | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Holiday Appetizers | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AS | FDNT M90AS | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | ICS: Party Hors D'oeuvres/Appt | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90AT | FDNT M90AT | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Artisan Breads Workshop | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AU | FDNT M90AU | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sugar Artistry | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AV | FDNT M90AV | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Quick & Healthy Asian Cuisine | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AW | FDNT M90AW | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Asian & Pacific Rim Cuisines | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AX | FDNT M90AX | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Tea in Autumn | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AY | FDNT M90AY | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Let's Bring Back Sunday Dinner | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90AZ | FDNT M90AZ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Tapas Bar | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BA | FDNT M90BA | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cake Decorating-Basic | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90BB | FDNT M90BB | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Basics: Sushi Made Easy | needs_yes | merge_into | gen 1, hist 7, id 2, o 1 |
| NUTR M90BC | FDNT M90BC | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition Basics: Menu Planning | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| NUTR M90BD | FDNT M90BD | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Bean Crocks & Cider Mugs | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BE | FDNT M90BE | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Ice Carving (Beginning) | needs_yes | - | sky 2, gen 4, hist 4, id 1, o 1, st 1 |
| NUTR M90BF | FDNT M90BF | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Beginning Cooking | needs_yes | - | sky 2, gen 4, hist 4, id 1, o 1, st 1 |
| NUTR M90BG | FDNT M90BG | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Best Ever Holiday Meals | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BH | FDNT M90BH | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Biscotti, Breads and More! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BI | FDNT M90BI | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Love at First Bite: Cheesecake | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BJ | FDNT M90BJ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | How to Boil Water | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BK | FDNT M90BK | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Festive Cookie/Candy Bonanza | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BL | FDNT M90BL | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Brazilian Cuisine | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90BM | FDNT M90BM | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Brazilian Cuisine Part 2 | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90BN | FDNT M90BN | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Bread, Bread and More Bread! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BO | FDNT M90BO | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Creative Breadmaking | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BP | FDNT M90BP | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Hearty Soups and Breads | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BQ | FDNT M90BQ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | A Williamsburg Breakfast | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BR | FDNT M90BR | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Breastfeeding and Nutrition Stage 1 | needs_yes | - | sky 2, gen 6, hist 4, id 1, o 1, st 2 |
| NUTR M90BS | FDNT M90BS | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Breastfeeding and Nutrition Stage 2 | needs_yes | - | sky 2, gen 6, hist 4, id 1, o 1, st 2 |
| NUTR M90BT | FDNT M90BT | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Creme Brulee Made Easy | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BU | FDNT M90BU | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Mother's Day Brunch | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BV | FDNT M90BV | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Busy People's Slow Simmer | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BW | FDNT M90BW | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Easy but Elegant Cooking | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90BX | FDNT M90BX | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Simple but Elegant | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90BY | FDNT M90BY | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nothing Is Quite as Good as Ca | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90BZ | FDNT M90BZ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cajun Cookin' | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CA | FDNT M90CA | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | California Grilling | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90CB | FDNT M90CB | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | California Grilling 2 | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90CC | FDNT M90CC | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Can There Ever...chocolate | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CD | FDNT M90CD | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | I Can Make That Special Dish | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CE | FDNT M90CE | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Candlelight Dinner for Two | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CF | FDNT M90CF | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Garnishing and Fruit Carving | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90CG | FDNT M90CG | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Fruit Carving 1 | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90CH | FDNT M90CH | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Fruit & Vegetable Carving | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90CI | FDNT M90CI | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Celebrate French Cuisine | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90CJ | FDNT M90CJ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | ICS: Celebrate Greece | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CK | FDNT M90CK | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Celebrate Vegetables | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CL | FDNT M90CL | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cheesecakes Galore! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CM | FDNT M90CM | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chef Skills: Classic Sauce 1 | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CN | FDNT M90CN | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chef Skills: Tamales and More | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90CO | FDNT M90CO | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chef Skills: Soups On | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CP | FDNT M90CP | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chinese Cooking - Classic | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CQ | FDNT M90CQ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chinese Cooking/Quick | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CR | FDNT M90CR | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chinese Cooking-Vegetarian | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CS | FDNT M90CS | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Regional Chinese Flavors | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CT | FDNT M90CT | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chinese Noodles | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CU | FDNT M90CU | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chocolate Desserts for the Sou | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90CV | FDNT M90CV | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chocolate Lovers Wanted! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CW | FDNT M90CW | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Valentine Chocolate Truffles | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CX | FDNT M90CX | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Chocolates & More Valentine | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90CY | FDNT M90CY | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Healthy Choices from the Garden | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90CZ | FDNT M90CZ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Christmas Goodies and Cookies | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DA | FDNT M90DA | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Creole Christmas Dinner | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DB | FDNT M90DB | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Christmas Gifts & Heirlooms | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DC | FDNT M90DC | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | White Christmas Tea | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DD | FDNT M90DD | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Simply Delicious Cinn Rolls | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DE | FDNT M90DE | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sinful Cinnamon Rolls | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DF | FDNT M90DF | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Come to My Garden Party | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DG | FDNT M90DG | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cooking for Compliments | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DH | FDNT M90DH | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | The Rib Connection | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DI | FDNT M90DI | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | A Taste of French Country Cook | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DJ | FDNT M90DJ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Holiday Cookie Exchange | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DK | FDNT M90DK | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Country Inn Cooking | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DL | FDNT M90DL | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Quilt Country Cooking | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DM | FDNT M90DM | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Great Meals: Crockery Cooking | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DN | FDNT M90DN | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Family Cooking - Desserts | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DO | FDNT M90DO | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cooking Made Easy | needs_yes | merge_into | gen 1, hist 7, id 2, o 1 |
| NUTR M90DP | FDNT M90DP | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Hot & Spicy Thai Cooking | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DQ | FDNT M90DQ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Hungarian Cooking Treasures | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DR | FDNT M90DR | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Southern Immigrant Cooking | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DS | FDNT M90DS | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Intro to Vietnamese Cooking | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90DT | FDNT M90DT | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Italian Cooking from Tuscany | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DU | FDNT M90DU | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition/Cooking for One or Two | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| NUTR M90DV | FDNT M90DV | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cooking for You or Two | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DW | FDNT M90DW | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Cooking/Vim, Vigor & Vitality | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DX | FDNT M90DX | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Mardi Gras Crazy | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DY | FDNT M90DY | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Creative Cuisine | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90DZ | FDNT M90DZ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Crepes | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EA | FDNT M90EA | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Everyday French Cuisine | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90EB | FDNT M90EB | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Low Fat Mexican Cuisine | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EC | FDNT M90EC | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | North Indian Cuisine | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90ED | FDNT M90ED | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | South Indian Cuisine | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90EE | FDNT M90EE | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Intro Vietnamese Cuisine | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90EF | FDNT M90EF | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | The Cuisine of Southern Italy | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EG | FDNT M90EG | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Culinary Hearts Kitchen | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EH | FDNT M90EH | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Scrumptious Hors D'oeuvres | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90EI | FDNT M90EI | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Shrimply Delicious Dining! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EJ | FDNT M90EJ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Delicious Hot Soups Plus! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EK | FDNT M90EK | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Delicious Pastas,pizzas,sauces | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EL | FDNT M90EL | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Lover's Delight | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EM | FDNT M90EM | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sensational Summer Desserts | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EN | FDNT M90EN | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Did Someone Say Tamales? | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EO | FDNT M90EO | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Dim Sum 1 | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90EP | FDNT M90EP | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Dim Sum | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90EQ | FDNT M90EQ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Dinner with a "Lighter" Flair | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90ER | FDNT M90ER | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Wok's for Dinner?! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90ES | FDNT M90ES | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Fresh Salads and Dressings | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90ET | FDNT M90ET | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Salads and Salad Dressings | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90EU | FDNT M90EU | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | It's Never Too Early for Xmas | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EV | FDNT M90EV | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | French Pastry Made Easy | needs_yes | merge_into | gen 1, hist 7, id 2, o 1 |
| NUTR M90EW | FDNT M90EW | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | If I Knew IT Was This Easy... | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EX | FDNT M90EX | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Eat Out in Your Own Kitchen | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EY | FDNT M90EY | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Elegant Tarts and Tartlets | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90EZ | FDNT M90EZ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nutrition for Esports | needs_yes | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| NUTR M90FA | FDNT M90FA | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Exotic Salads | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FB | FDNT M90FB | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Wahoo's Famous Fish Tacos | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FC | FDNT M90FC | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | A Taste of Sante Fe | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FD | FDNT M90FD | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Italian Harvest Festival | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FE | FDNT M90FE | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Nuevo Latino Fiesta | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FF | FDNT M90FF | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Flavors of Mexico | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FG | FDNT M90FG | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Rolled Fondant | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FH | FDNT M90FH | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Mexican Food - from My Kitchen | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FI | FDNT M90FI | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sizzling Fresh Salsas | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FJ | FDNT M90FJ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Game Time | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FK | FDNT M90FK | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sunshine Garden Tea | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FL | FDNT M90FL | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Roasted Garlic/Pasta Sauce | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90FM | FDNT M90FM | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Roasted Garlic & Summer Pizzas | needs_yes | - | sky 2, gen 4, hist 5, id 1, o 1, st 1 |
| NUTR M90FN | FDNT M90FN | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Simply Gourmet 2 | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FO | FDNT M90FO | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Great Soup | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FP | FDNT M90FP | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Grills That Sizzle | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FQ | FDNT M90FQ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Now That's Italian! Guest | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FR | FDNT M90FR | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Paella, Paella (Guest Series) | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FS | FDNT M90FS | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Pasta Pronto for Health of IT! | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FT | FDNT M90FT | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | More Holiday Tamales | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90FU | FDNT M90FU | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Holiday Specialties | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FV | FDNT M90FV | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Holiday Tamales | needs_yes | merge_into | gen 1, hist 7, id 3, o 1 |
| NUTR M90FW | FDNT M90FW | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | How to Master Stocks & Sauces | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FX | FDNT M90FX | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Tamales 2 | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FY | FDNT M90FY | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | A Taste of India | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90FZ | FDNT M90FZ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | International Soups | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GA | FDNT M90GA | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | It's Time for Some Thai | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GB | FDNT M90GB | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | It's Teatime | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GC | FDNT M90GC | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | A Kiss of Quiche | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GD | FDNT M90GD | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sharpen Your Knife Skills | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GE | FDNT M90GE | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Light 'N Lively Suppers | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GF | FDNT M90GF | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | A "Wok" on the Lighter Side | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GG | FDNT M90GG | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | From the Shores of Mexico | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GH | FDNT M90GH | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Pack Your Picnic with Style | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GI | FDNT M90GI | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Sushi Party | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GJ | FDNT M90GJ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Tapas Party | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GK | FDNT M90GK | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Pleasing Pastries | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GL | FDNT M90GL | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Petits for the Season | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GM | FDNT M90GM | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Picnic Under the Stars | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GN | FDNT M90GN | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Springtime Soups and Salads | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GO | FDNT M90GO | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | A Special Tea | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GP | FDNT M90GP | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Summertime Tamales | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| NUTR M90GQ | FDNT M90GQ | kept number | NUTR -> FDNT | Dietetics/Nutritional Science -> Nutritional Science/Dietetics | Taste of Thailand | needs_yes | - | sky 2, gen 3, hist 4, id 1, o 1, st 1 |
| PHTC M10AB | PHOT M10RO | gap-filled | PHTC -> PHOT | none -> Photography | Documentary and Photojournalism | planned | - | sky 2, gen 5, hist 3, id 1, o 1, st 1 |
| PHTC M10AC | PHOT M10RP | gap-filled | PHTC -> PHOT | none -> Photography | Foundations of Cameras & Composition | planned | merge_into | gen 1, hist 6, id 2, o 1 |
| PHTC M10AO | PHOT M10RQ | gap-filled | PHTC -> PHOT | none -> Photography | Studio Lighting 1 | planned | - | sky 2, gen 6, hist 3, id 1, o 1, st 1 |
| PHTC M10AP | PHOT M10RR | gap-filled | PHTC -> PHOT | none -> Photography | Studio Lighting 2 | planned | - | sky 2, gen 6, hist 3, id 1, o 1, st 1 |
| PUBR M1001 | PREL M1001 | kept number | PUBR -> PREL | none -> Public Relations | Principles of Public Relations | needs_yes | - | ccr 1, cer 1, gen 2, hist 5, id 3, o 1, st 4 |
| TOUR M1001 | TRVL M1001 | kept number | TOUR -> TRVL | none -> Travel Services | Advanced Airline Computer Training | planned | unified_title | sky 2, gen 5, hist 8, id 2, kb 1, st 1, t 1 |
| TOUR M1002 | TRVL M1002 | kept number | TOUR -> TRVL | none -> Travel Services | Travel Destinations: Europe, Africa, and the Middle East | needs_yes | unified_title | sky 2, gen 5, hist 10, id 2, kb 1, st 1 |
| TOUR M1003 | TRVL M1003 | kept number | TOUR -> TRVL | none -> Travel Services | Destinations- Americas and Europe | needs_yes | unified_title | sky 2, gen 5, hist 10, id 2, kb 1, st 1 |
| TOUR M1004 | TRVL M1004 | kept number | TOUR -> TRVL | none -> Travel Services | World Destinations and Resorts--Western Hemisphere | planned | unified_title | sky 2, gen 5, hist 8, id 2, kb 1, st 1 |
| TOUR M10AA | TRVL M10AA | kept number | TOUR -> TRVL | none -> Travel Services | Advanced Airline Computer Training | planned | merge_into | gen 1, hist 6, id 3, o 1 |
| TOUR M10AB | TRVL M10AB | kept number | TOUR -> TRVL | none -> Travel Services | Airline Computer Training | planned | merge_into | cer 2, gen 4, hist 12, id 4, o 1, kb 1, st 1 |
| TOUR M10AC | TRVL M10AC | kept number | TOUR -> TRVL | none -> Travel Services | Introduction to the Exciting World of Travel & Tourism | planned | - | sky 2, cer 2, gen 10, hist 11, id 2, o 1, kb 1, st 1 |
| TOUR M10AD | TRVL M10AD | kept number | TOUR -> TRVL | none -> Travel Services | Selling Dreams - the Travel Industry | planned | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| TOUR M10AE | TRVL M10AE | kept number | TOUR -> TRVL | none -> Travel Services | Tours and Cruises | planned | - | sky 2, gen 5, hist 4, id 1, o 1, st 1 |
| TOUR M10AF | TRVL M10AF | kept number | TOUR -> TRVL | none -> Travel Services | World Destinations and Resorts--Western Hemisphere | planned | merge_into | gen 1, hist 6, id 3, o 1 |
| TOUR M10AG | TRVL M10AG | kept number | TOUR -> TRVL | none -> Travel Services | World Destinations-Europe | planned | merge_into | gen 1, hist 6, id 3, o 1 |
| TOUR M10AH | TRVL M10AH | kept number | TOUR -> TRVL | none -> Travel Services | World Destinations-Pacific, Asia, Africa, Middle East | planned | merge_into | gen 1, hist 6, id 3, o 1 |

## The fresh read for the conductor (one SELECT, one JSON value)

The live kb_curation rows on every moving id, every pointer at one (merge_into, honors_of; CN: rows included), the code rows for the disciplines involved, and the count of person rows. The WHERE bounds it, so it needs no Range paging. The apply compares it with the committed overlay (P3).

```sql
select json_build_object(
  'rows', (select coalesce(json_agg(json_build_object('course_id', k.course_id, 'field', k.field, 'value', k.value,
             'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at) order by k.course_id, k.field), '[]'::json)
           from public.kb_curation k
           where split_part(k.course_id, ' ', 1) in ('NUTR', 'AERO', 'PHTC', 'PUBR', 'TOUR')
              or (k.field in ('merge_into', 'honors_of')
                  and split_part(trim(both '"' from k.value::text), ' ', 1) in ('NUTR', 'AERO', 'PHTC', 'PUBR', 'TOUR'))),
  'codes', (select coalesce(json_agg(json_build_object('course_id', k.course_id, 'field', k.field, 'value', k.value,
             'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at) order by k.course_id, k.field), '[]'::json)
            from public.kb_curation k
            where k.course_id in ('_CANON_SUBJ4::Dietetics/Nutritional Science', '_CANON_SUBJ4::Nutritional Science/Dietetics',
                                  '_CANON_SUBJ4::Aeronautics', '_CANON_SUBJ4::Photography',
                                  '_CANON_SUBJ4::Photographic Technology/ Commercial Photography',
                                  '_CANON_SUBJ4::Public Relations', '_CANON_SUBJ4::Travel Services',
                                  '_CANON_SUBJ4::Flight Attendant Training',
                                  '_SUBJ_DISC::NUTR', '_SUBJ_DISC::FDNT', '_SUBJ_DISC::AERO', '_SUBJ_DISC::AERN',
                                  '_SUBJ_DISC::PHTC', '_SUBJ_DISC::PUBR', '_SUBJ_DISC::TOUR', '_SUBJ_DISC::FLTA')),
  'person_rows', (select count(*) from public.kb_curation k
                  where split_part(k.course_id, ' ', 1) in ('NUTR', 'AERO', 'PHTC', 'PUBR', 'TOUR')
                    and k.reviewer_email not like '%@bot' and k.reviewer_email not like '%.bot'),
  'by_prefix', (select json_object_agg(p, n) from (select split_part(course_id, ' ', 1) p, count(*) n
                from public.kb_curation where split_part(course_id, ' ', 1) in ('NUTR', 'AERO', 'PHTC', 'PUBR', 'TOUR')
                group by 1) x)
);
```

## After the review

1. Record Sam's answers to the yes/no list; a *No* drops that scope's rows from the forwarding map.
2. The apply (a follow-up on this branch's planner): recompute, match the reviewed forwarding map (P1), the fresh read (P3), re-key the five identity documents through kb/_eths_remint.py `apply_plan` with stamp `_alignment_remint_from`, make the seed and picks edits above, write the alias_map.json receipt from the forwarding rows and register it in ALIAS_MAPS in the same commit, then kb/_post_apply_chain.py, --rekey-skyview, --rekey-generated.
3. After the merge, before the next cron: supabase-rekey.yml with the receipt, the read-back, daily-dashboard.yml.
4. Rollback: `git revert` of the land, and supabase-rekey.yml with the forwarding map read right to left.
