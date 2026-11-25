# The stray-code re-mint, confidence 90 or more: APPLIED 2026-11-25

The ruling: Sam, 2026-11-25 (r-no-mid-on-a-stray-code-sam-2026-11-25): "i should have never minted those 88 codes and left the courses in a holding pen"; the stray codes go back to Needs an M-ID once their local subjects carry a common subject. The dry run: kb/stray_code_remint_out/2026-11-25/retire.json (reviewed; Sam: "merge the dry run and keep rolling").

**DECIDED (S733, 2026-11-25): retire each in-scope M-ID; its courses return to Needs an M-ID under the common subject the rescore proposes for their local subject. No id is re-keyed, so the receipt is a retire list and kb/alias_chain.py ALIAS_MAPS takes no new map.**

**DECIDED (S733 conductor): an in-scope local subject that carries only the rescore's proposal, with no common subject filed, keeps its ids held at the apply until its common subject is filed; the ruling retires an id once its local subject carries a common subject, and a proposal is not a filing.**

**DECIDED (S733 conductor): an id held as merged into an M-ID that stays takes an alias to its merge target at the apply (fate a, a map registered in kb/alias_chain.py ALIAS_MAPS), since its courses already sit under a common-subject M-ID and have no Needs an M-ID to return to.**

**DECIDED (S733 worker, under DECIDED_MERGED): an aliased shell leaves the identity file and its course joins its target's memberships, the join excel_to_dashboard.py makes for a C-ID hold (CID_HOLDS), so the course stays under the M-ID the List shows it under today; the shell's own bot rows go with it.**

60 M-IDs retire, 20 merged shells take an alias to their merge target, and 35 are held at the apply; the dry run's other 25 holds stand. The Courses List's Needs an M-ID reads 1,819 today and 1,881 after the next daily build (+62).

## Gates

- V0_pinned_set: pass
- V1_confidence_in_scope: pass
- V2_every_retired_id_on_a_stray_code: pass
- V3_no_retired_id_has_an_out_of_scope_course: pass
- P1_matches_receipt: pass
- P3_fresh_read: pass
- G1_nothing_left_on_a_retired_or_aliased_id: pass
- G2_conservation: pass
- G3_each_shell_course_joins_its_target: pass
- G4_held_ids_untouched: pass
- G5_every_other_entry_untouched: pass
- G6_no_articulation_names_one: pass

## Retired (60)

| M-ID | Title | Common subject |
|---|---|---|
| ARTB M10AA | Basic Studio Arts | ARTS |
| ARTC M10AA | Contemporary Illustration | ARTS |
| ARTC M10AD | Digital Drawing for Commercial Art | ARTS |
| ARTC M10AE | Dynamic Sketching | ARTS |
| ARTG M10AQ | Shop Practices for Art Careers and Exhibitions | ARTS |
| ARTG M10AT | Writing for Arts Careers | ARTS |
| ARTI M10AA | Concept Sketching | ARTS |
| ARTI M10AB | Digital 3D Design and Animation | ARTS |
| ARTI M10AC | Digital 3D Design and Modeling | ARTS |
| ARTI M10AD | Digital 3D Design and Sculpture | ARTS |
| ARTI M10AF | Illustration 2, Digital Techniques | ARTS |
| ARTN M1004 | Digital Prepress | ARTS |
| ARTN M10AG | Comic Book Development and Structure | ARTS |
| BSAD M10AS | Principles of Organizational Communication | BUSI |
| CGRA M10AE | Film Theory | ARTS |
| CTVR M10AL | History and Appreciation of Television Broadcasting | FTVE |
| DANS M10AC | Barre Fitness | DANC |
| DESI M10AA | Art Studio Prog | ARTS |
| DGME M1001 | Radio and Podcast Production Lab 2 | ARTS |
| DGME M10AH | Radio and Podcast Production Lab | ARTS |
| DGME M10AI | Radio and Podcast Production Lab 2 | ARTS |
| DSGN M10AF | Digital Media 1 | ARTS |
| ESTI M1001 | Esthetics Intermediate Concepts Ll | COSM |
| ESTI M10AF | Esthetics Fundamentals Ll | COSM |
| ESTI M10AG | Esthetics Intermediate Concepts L | COSM |
| ESTI M10AH | Esthetics Intermediate Concepts Ll | COSM |
| ESTI M10AI | Esthetics Spa Workshop | COSM |
| FLTE M10AF | Drone Inspections | AVIA |
| FLTE M10AG | Experimental Offering in Flight Technology | AVIA |
| FLTE M10AH | First Person View (FPV) | AVIA |
| FLTE M10AX | Topics in Aeronautics, Flight Technology | AVIA |
| FTMA M10AD | Directors and Genres | FTVE |
| FTVM M10AD | American Independent Film | FTVE |
| FTVM M10AF | Beyond Hollywood: Gender, Race and Sex in Movies | FTVE |
| FTVM M10AS | Honors Beyond Hollywood: Gender, Race and Sex in Movies | FTVE |
| MMDI M90AA | Design Studio Practice | ARTS |
| PHTO M10AD | Black and White Photo Lab 1 | PHOT |
| PHTO M10AG | Color Photo Lab 1 | PHOT |
| PHTO M10AH | Color Photo Lab 2 | PHOT |
| PHTO M10AI | Digital Photo Lab 1 | PHOT |
| PHTO M10AJ | Digital Photo Lab 2 | PHOT |
| PHTO M10AL | Individual Projects B | PHOT |
| PHTO M10AR | Introduction to Lighting | PHOT |
| PHTO M10AU | Materials and Processes Lab | PHOT |
| PHTO M10AX | Portraiture on Location | PHOT |
| PHTO M90AA | Digital Photo Editing and Post-Processing | PHOT |
| PHTO M90AB | Digital Photos and the Computer | PHOT |
| PHTO M90AD | Phonetography | PHOT |
| SGNG M10AA | Advance Computer & Design | ARTS |
| SGNG M10AC | Exterior Display Signs | ARTS |
| SGNG M10AE | Individual Lettering | ARTS |
| SGNG M10AF | Sign Design and Layout | ARTS |
| SGNG M10AG | Sign Installation and Fabrication | ARTS |
| SGNG M10AI | Silk Screen Processing 1 | ARTS |
| SGNG M10AJ | Window Signs | ARTS |
| TAFI M1002 | Diversity in American Film | FTVE |
| TAFI M1006 | History of Film: 1880's Through 1950's | FTVE |
| TAFI M10AH | From Stage to Screen: Production Design and Art Direction | FTVE |
| VISC M10AI | Digital Prepress 2 | ARTS |
| VISC M10AL | Flash Motion Graphics (Beginning Level) | ARTS |

## Aliased to the merge target (20)

| Shell | Target |
|---|---|
| ARTG M10AA | ARTS M1577 |
| ARTG M10AB | ARTS M1577 |
| ARTG M10AH | ARTH M1039 |
| ARTG M10AL | MART M1004 |
| ARTI M10AE | ARTS M1407 |
| CTVR M10AE | BRDC M1045 |
| ESTI M10AE | COSM M1003 |
| FLTE M10AE | AVIA M1051 |
| FTMA M10AO | FTVE M1067 |
| FTVM M10AJ | BRDC M1062 |
| PHTO M10AB | PHOT M1111 |
| PHTO M10AE | PHOT M1121 |
| PHTO M10AK | MACH M1046 |
| PHTO M10AM | PHOT M1111 |
| PHTO M10AQ | PHOT M1134 |
| PHTO M10AT | PHOT M1133 |
| SGNG M10AB | ARTS M1456 |
| SGNG M10AD | ARTS M1488 |
| SGNG M10AH | ARTS M1661 |
| TAFI M10AI | FTVE M1078 |

## Held at the apply (35)

| M-ID | Why |
|---|---|
| ARTX M90AB | a course on San Diego College of Continuing Education ARTX, which carries only the rescore's proposal (DECIDED_UNFILED) |
| EPHO M9001 | a course on Saddleback College EPHO, which carries only the rescore's proposal (DECIDED_UNFILED) |
| EPHO M90AD | a course on Saddleback College EPHO, which carries only the rescore's proposal (DECIDED_UNFILED) |
| EPHO M90AF | a course on Saddleback College EPHO, which carries only the rescore's proposal (DECIDED_UNFILED) |
| HUMN M1003 | a course on Foothill College HUMN, which carries only the rescore's proposal (DECIDED_UNFILED) |
| HUMN M1004 | a course on Foothill College HUMN, which carries only the rescore's proposal (DECIDED_UNFILED) |
| HUMN M10AK | a course on Las Positas College HUMN, which carries only the rescore's proposal (DECIDED_UNFILED) |
| IDSG M10AB | a course on Diablo Valley College IDSGN, which carries only the rescore's proposal (DECIDED_UNFILED) |
| IDSG M10AE | a course on Diablo Valley College IDSGN, which carries only the rescore's proposal (DECIDED_UNFILED) |
| LIBS M1006 | a course on Los Angeles Southwest College LIB SCI, which carries only the rescore's proposal (DECIDED_UNFILED) |
| LIBS M10AB | a course on Yuba College LIBSC, which carries only the rescore's proposal (DECIDED_UNFILED) |
| LIBS M10AE | a course on West Los Angeles College LIB SCI, which carries only the rescore's proposal (DECIDED_UNFILED) |
| LIBS M10AF | a course on Los Angeles Pierce College LIB SCI, which carries only the rescore's proposal (DECIDED_UNFILED) |
| NCVO M90AA | a course on College of the Canyons NC.VOC, which carries only the rescore's proposal (DECIDED_UNFILED) |
| NCVO M90AD | a course on College of the Canyons NC.VOC, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDA M90AF | a course on Los Angeles Pierce College OLD ADL, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDA M90AI | a course on Los Angeles Pierce College OLD ADL, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDA M90AJ | a course on Los Angeles Pierce College OLD ADL, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M9002 | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AA | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AB | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AD | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AF | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AG | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AJ | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AO | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AQ | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AR | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AS | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| OLDR M90AU | a course on Allan Hancock College OLDR, which carries only the rescore's proposal (DECIDED_UNFILED) |
| PHTG M1002 | a course on De Anza College PHTG, which carries only the rescore's proposal (DECIDED_UNFILED) |
| PHTG M1003 | a course on De Anza College PHTG, which carries only the rescore's proposal (DECIDED_UNFILED) |
| PHTG M10AA | a course on De Anza College PHTG, which carries only the rescore's proposal (DECIDED_UNFILED) |
| WORK M90AN | a course on College of the Redwoods WORK, which carries only the rescore's proposal (DECIDED_UNFILED) |
| WORK M90AO | a course on College of the Redwoods WORK, which carries only the rescore's proposal (DECIDED_UNFILED) |

## Next

1. kb/alias_chain.py ALIAS_MAPS registers alias_map.json; kb/_post_apply_chain.py runs (both in this commit).
2. The conductor runs ../fresh_read.sql, saves the value as live.json, and runs `python3 kb/_stray_code_remint.py --supabase-plan --receipt kb/stray_code_remint_out/2026-11-25/applied/retire_applied.json --fresh-read live.json`; it refuses on a person's row or drift (then `--rollback`), else rewrites kb_curation_delete.json/.sql and kb_curation_restore.sql from the live row images.
3. After the merge, before the next cron: kb_curation_delete.sql, then dispatch the daily build.
