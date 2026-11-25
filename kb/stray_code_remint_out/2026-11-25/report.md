# The stray-code re-mint, High and Medium: dry run 2026-11-25

The ruling: Sam, 2026-11-25 (r-no-mid-on-a-stray-code-sam-2026-11-25): "i should have never minted those 88 codes and left the courses in a holding pen"; the stray codes go back to Needs an M-ID once their local subjects carry a common subject. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md, docs/reference/mid_lifecycle.md). Nothing is applied.

**DECIDED (S733, 2026-11-25): retire each in-scope M-ID; its courses return to Needs an M-ID under the common subject the rescore proposes for their local subject. No id is re-keyed, so the receipt is a retire list and kb/alias_chain.py ALIAS_MAPS takes no new map.**

Why: the ruling's own words send the courses back to Needs an M-ID. A re-key would keep clusters a machine drew on a code with no discipline, under a Common SUBJ number no step checked; on the pile each course meets its closest M-ID under its common subject (kb/coci_closest_mid.json) and the pile mint. The Courses List counts a course with no M-ID, C-ID or CCN as Needs an M-ID, so a retired id's courses land there after the next daily build with no other step. A retired id has no successor: kb/alias_chain.py leaves a stored copy unchanged and it reads dead, which is true, so the receipt is a retire list (retire.json) and ALIAS_MAPS takes no map.

## What moves

Of the 251 M-IDs on the 88 stray codes that hold any, 89 retire, 45 are held, and 117 have no course on the 62 in-scope local subjects and stay for a later pass. The 89 retiring M-IDs hold 98 local courses.

The Courses List's Needs an M-ID reads **1,819** today and would read **1,916** after the apply and the next daily build (+97). On a stray identity code reads 247 courses today and 149 after. 1 of the retiring ids' courses keep another identity (a C-ID, a CCN, another M-ID) or are kept, not counted, so they do not join the pile.

Measured by kb/_stray_code_remint.py from unified_courses_members.js, coci_lookup_data.js and kb/coci_not_applicable.json (rebuilt with kb/_build_not_applicable.py for the after count).

| Common subject | M-IDs retiring | Local courses returning under it |
|---|---|---|
| ARTS | 29 | 29 |
| AVIA | 4 | 4 |
| BUSI | 1 | 1 |
| COSM | 5 | 4 |
| DANC | 1 | 1 |
| FTVE | 8 | 14 |
| FTVE+HUMA | 2 | 0 |
| HUMA | 1 | 3 |
| INDD | 2 | 2 |
| LIBR | 5 | 6 |
| OLAD | 12 | 13 |
| PHOT | 15 | 17 |
| VOCE | 2 | 2 |
| WEXP | 2 | 2 |

An M-ID counted under two subjects joined by + holds courses on two in-scope local subjects whose proposed common subjects differ; each course returns under its own, so its courses count in those rows. One course can sit in two retiring M-IDs, so a row can show fewer courses than M-IDs.

**13 local subjects carry the rescore's proposal and no filing yet**; the ruling says the re-mint waits until local subjects carry a common subject, so the apply files these first or holds their ids: Allan Hancock College OLDR (OLAD); College of the Canyons NC.VOC (VOCE); College of the Redwoods WORK (WEXP); Contra Costa College LIBST (LIBR); De Anza College PHTG (PHOT); Diablo Valley College IDSGN (INDD); Foothill College HUMN (HUMA); Las Positas College HUMN (HUMA); Los Angeles Pierce College LIB SCI (LIBR); Los Angeles Pierce College OLD ADL (OLAD); Los Angeles Southwest College LIB SCI (LIBR); West Los Angeles College LIB SCI (LIBR); Yuba College LIBSC (LIBR).

## Held (45)

- 24: merged into an M-ID that stays, so its courses already have an M-ID
- 10: mixed scope: courses on an in-scope local subject and on one outside it
- 9: an honors or merge pointer joins it to an M-ID that stays
- 2: MAP articulations name it

A merged M-ID whose target stays is a shell: the List shows its courses under the target, so retiring it would send nothing to Needs an M-ID and would drop the merge. Its fit is an alias to the target, a re-key this dry run does not make.

| M-ID | Title | Why held |
|---|---|---|
| ARTG M10AA | Art and Culture - Galleries, Museums, and Their Communities | merged into ARTS M1577, which stays: its courses already count there |
| ARTG M10AB | Art Galleries and Museums - Professional Practices | merged into ARTS M1577, which stays: its courses already count there |
| ARTG M10AH | Intermediate Exhibition Production | merged into ARTH M1039, which stays: its courses already count there |
| ARTG M10AL | Page Layout and Typography | merged into MART M1004, which stays: its courses already count there |
| ARTI M10AE | Illustration 1 - Rendering Techniques | merged into ARTS M1407, which stays: its courses already count there |
| ATXX M1001 | Introduction Flight Attendant Training | AT M10DL, which stays, points at it (merge_into) |
| ATXX M1002 | Introduction to Travel Careers | AT M10AO, which stays, points at it (merge_into) |
| BUST M10AZ | MS Publisher Comprehensive | MAP articulations name it (1 in kb/coci_articulations.json) |
| CMPE M10AO | Remote Pilot (Drone) FAA Certification Prep | MAP articulations name it (1 in kb/coci_articulations.json) |
| CMRT M1001 | Commercial Layout and Design | mixed scope: courses on Porterville College CMRT (in) and Porterville College CMRTP (out) |
| CTVR M10AE | Cinematic Storytelling | merged into BRDC M1045, which stays: its courses already count there |
| DBAX M1001 | Beginning Radio Station Operations | DBA M10AC, which stays, points at it (merge_into) |
| ESTI M10AE | Esthetics Fundamentals 1 | merged into COSM M1003, which stays: its courses already count there |
| FLTE M1002 | Photogrammetry | mixed scope: courses on Sacramento City College FLTEC (in) and Sacramento City College SURVY (out) |
| FLTE M10AE | Commercial Pilot-Helicopter Flight Techniques | merged into AVIA M1051, which stays: its courses already count there |
| FTMA M10AO | Introduction to Documentary Studies | merged into FTVE M1067, which stays: its courses already count there |
| FTVM M10AJ | Documentary Film Aesthetics | merged into BRDC M1062, which stays: its courses already count there |
| FTVM M10AT | Honors Documentary Film Aesthetics | the honors twin of BRDC M1062, which stays |
| FTVM M10AU | Honors Film Genres | the honors twin of FTVE M1074, which stays |
| HOSM M9003 | Customer Care: Airline/Travel | mixed scope: courses on Cypress College ATC (in) and North Orange Continuing Education HOSM, North Orange Continuing Education Credit HOSM (out) |
| HUMN M1002 | Honors Introduction to Popular Culture | the honors twin of COMM M1067, which stays |
| HUMN M1005 | Video Games & Popular Culture | MUSI M10RW, which stays, points at it (merge_into) |
| HUMN M10BG | Trauma & the Arts | SOCS M10CQ, which stays, points at it (honors_of) |
| INFO M1003 | Researching in the Digital Age | mixed scope: courses on Golden West College LIBR (in) and Santa Ana College INFO, Santiago Canyon College INFO (out) |
| LIBS M1002 | Information and Computer Literacy | mixed scope: courses on Fresno City College LITEC (in) and Madera College LIBSKL, Reedley College LIBSKL (out) |
| LIBS M1004 | Information Literacy and Research Skills | mixed scope: courses on Diablo Valley College LT, San Diego City College LIBS, San Diego Mesa College LIBS, San Diego Miramar College LIBS (in) and Sierra College SKDV (out) |
| LIBS M10AG | Library and Information Research Skills | merged into LIBR M1019, which stays: its courses already count there |
| MART M1004 | Digital Page Layout | mixed scope: courses on CaÃ±ada College MART, Los Angeles Trade Technical College VISCOM, Monterey Peninsula College ARTG (in) and Palomar College GCIP, Palomar College GCMW (out) |
| NCTH M9001 | Business of Acting | mixed scope: courses on Las Positas College THEA (in) and College of the Canyons NC.THTR (out) |
| OLDR M90AA | Art: Botanical Illustration | merged into OLAD M9047, which stays: its courses already count there |
| OLDR M90AD | Botanical Illustration | merged into OLAD M9047, which stays: its courses already count there |
| OLDR M90AO | Painting with Pastels | merged into ARTS M9036, which stays: its courses already count there |
| PHTO M10AB | Art of Video for Photographers | merged into PHOT M1111, which stays: its courses already count there |
| PHTO M10AE | Black and White Photo Lab 2 | merged into PHOT M1121, which stays: its courses already count there |
| PHTO M10AK | Individual Projects A | merged into MACH M1046, which stays: its courses already count there |
| PHTO M10AM | Intermediate Video for Photographers | merged into PHOT M1111, which stays: its courses already count there |
| PHTO M10AQ | Introduction to Drone Piloting and Imaging | merged into PHOT M1134, which stays: its courses already count there |
| PHTO M10AT | Introduction to View Camera | merged into PHOT M1133, which stays: its courses already count there |
| SGNG M10AB | Computer Techniques for Screen Printing | merged into ARTS M1456, which stays: its courses already count there |
| SGNG M10AD | Fundamentals of Mural Painting | merged into ARTS M1488, which stays: its courses already count there |
| SGNG M10AH | Silk Screen 2 | merged into ARTS M1661, which stays: its courses already count there |
| TAFI M1007 | History of Film: 1950's to Present | FTVE M10AT, which stays, points at it (merge_into) |
| TAFI M10AI | Honors Introduction to Film | merged into FTVE M1078, which stays: its courses already count there |
| TOUR M1002 | Travel Destinations: Europe, Africa, and the Middle East | mixed scope: courses on Cypress College ATC (in) and Saddleback College TOUR, Southwestern College T&T (out) |
| TOUR M1003 | Destinations- Americas and Europe | mixed scope: courses on Cypress College ATC (in) and Saddleback College TOUR (out) |

## Retiring (89)

| M-ID | Title | Common subject | Courses |
|---|---|---|---|
| ARTB M10AA | Basic Studio Arts | ARTS | 1 |
| ARTC M10AA | Contemporary Illustration | ARTS | 1 |
| ARTC M10AD | Digital Drawing for Commercial Art | ARTS | 1 |
| ARTC M10AE | Dynamic Sketching | ARTS | 1 |
| ARTG M10AQ | Shop Practices for Art Careers and Exhibitions | ARTS | 1 |
| ARTG M10AT | Writing for Arts Careers | ARTS | 1 |
| ARTI M10AA | Concept Sketching | ARTS | 1 |
| ARTI M10AB | Digital 3D Design and Animation | ARTS | 1 |
| ARTI M10AC | Digital 3D Design and Modeling | ARTS | 1 |
| ARTI M10AD | Digital 3D Design and Sculpture | ARTS | 1 |
| ARTI M10AF | Illustration 2, Digital Techniques | ARTS | 1 |
| ARTN M1004 | Digital Prepress | ARTS | 2 |
| ARTN M10AG | Comic Book Development and Structure | ARTS | 1 |
| BSAD M10AS | Principles of Organizational Communication | BUSI | 1 |
| CGRA M10AE | Film Theory | ARTS | 1 |
| CTVR M10AL | History and Appreciation of Television Broadcasting | FTVE | 1 |
| DANS M10AC | Barre Fitness | DANC | 1 |
| DESI M10AA | Art Studio Prog | ARTS | 1 |
| DGME M1001 | Radio and Podcast Production Lab 2 | ARTS | 2 |
| DGME M10AH | Radio and Podcast Production Lab | ARTS | 1 |
| DGME M10AI | Radio and Podcast Production Lab 2 | ARTS | 1 |
| DSGN M10AF | Digital Media 1 | ARTS | 1 |
| ESTI M1001 | Esthetics Intermediate Concepts Ll | COSM | 2 |
| ESTI M10AF | Esthetics Fundamentals Ll | COSM | 1 |
| ESTI M10AG | Esthetics Intermediate Concepts L | COSM | 1 |
| ESTI M10AH | Esthetics Intermediate Concepts Ll | COSM | 1 |
| ESTI M10AI | Esthetics Spa Workshop | COSM | 1 |
| FLTE M10AF | Drone Inspections | AVIA | 1 |
| FLTE M10AG | Experimental Offering in Flight Technology | AVIA | 1 |
| FLTE M10AH | First Person View (FPV) | AVIA | 1 |
| FLTE M10AX | Topics in Aeronautics, Flight Technology | AVIA | 1 |
| FTMA M10AD | Directors and Genres | FTVE | 1 |
| FTVM M10AD | American Independent Film | FTVE | 1 |
| FTVM M10AF | Beyond Hollywood: Gender, Race and Sex in Movies | FTVE | 1 |
| FTVM M10AS | Honors Beyond Hollywood: Gender, Race and Sex in Movies | FTVE | 1 |
| HUMN M1003 | Honors Popular Culture & United States History | FTVE+HUMA | 2 |
| HUMN M1004 | Popular Culture & United States History | FTVE+HUMA | 2 |
| HUMN M10AK | Global Cinemas | HUMA | 1 |
| IDSG M10AB | Color Visualization for Product Design | INDD | 1 |
| IDSG M10AE | Introduction to Industrial and Product Design | INDD | 1 |
| LIBS M1006 | Library Research Methods | LIBR | 2 |
| LIBS M10AB | Basic Research Skills | LIBR | 1 |
| LIBS M10AD | Finding Information on Line and in Print | LIBR | 1 |
| LIBS M10AE | Information Literacy:Search Strategies, Tools, and Resources | LIBR | 1 |
| LIBS M10AF | Internet Research Methods | LIBR | 1 |
| MMDI M90AA | Design Studio Practice | ARTS | 1 |
| NCVO M90AA | Advanced Tools in Photoshop | VOCE | 1 |
| NCVO M90AD | Building on Photoshop Basics | VOCE | 1 |
| OLDA M90AF | Life Drawing for Seniors | OLAD | 1 |
| OLDA M90AI | Seeing and Understanding Art | OLAD | 1 |
| OLDA M90AJ | Watercolor Painting for Seniors | OLAD | 1 |
| OLDR M9002 | Painting in Oils and Acrylics | OLAD | 2 |
| OLDR M90AB | Art/Journaling | OLAD | 1 |
| OLDR M90AF | Digital Camera Basics Level 2 | OLAD | 1 |
| OLDR M90AG | Expressions in Colored Pencil | OLAD | 1 |
| OLDR M90AJ | Int. Watercolor Painting | OLAD | 1 |
| OLDR M90AQ | Silk Painting | OLAD | 1 |
| OLDR M90AR | Sketching for Painters | OLAD | 1 |
| OLDR M90AS | The Joy of Drawing | OLAD | 1 |
| OLDR M90AU | Urban Sketching | OLAD | 1 |
| PHTG M1002 | Commercial Lighting 1 | PHOT | 2 |
| PHTG M1003 | Commercial Lighting 2 | PHOT | 2 |
| PHTG M10AA | Exploring Visual Expression | PHOT | 1 |
| PHTO M10AD | Black and White Photo Lab 1 | PHOT | 1 |
| PHTO M10AG | Color Photo Lab 1 | PHOT | 1 |
| PHTO M10AH | Color Photo Lab 2 | PHOT | 1 |
| PHTO M10AI | Digital Photo Lab 1 | PHOT | 1 |
| PHTO M10AJ | Digital Photo Lab 2 | PHOT | 1 |
| PHTO M10AL | Individual Projects B | PHOT | 1 |
| PHTO M10AR | Introduction to Lighting | PHOT | 1 |
| PHTO M10AU | Materials and Processes Lab | PHOT | 1 |
| PHTO M10AX | Portraiture on Location | PHOT | 1 |
| PHTO M90AA | Digital Photo Editing and Post-Processing | PHOT | 1 |
| PHTO M90AB | Digital Photos and the Computer | PHOT | 1 |
| PHTO M90AD | Phonetography | PHOT | 1 |
| SGNG M10AA | Advance Computer & Design | ARTS | 1 |
| SGNG M10AC | Exterior Display Signs | ARTS | 1 |
| SGNG M10AE | Individual Lettering | ARTS | 1 |
| SGNG M10AF | Sign Design and Layout | ARTS | 1 |
| SGNG M10AG | Sign Installation and Fabrication | ARTS | 1 |
| SGNG M10AI | Silk Screen Processing 1 | ARTS | 1 |
| SGNG M10AJ | Window Signs | ARTS | 1 |
| TAFI M1002 | Diversity in American Film | FTVE | 3 |
| TAFI M1006 | History of Film: 1880's Through 1950's | FTVE | 3 |
| TAFI M10AH | From Stage to Screen: Production Design and Art Direction | FTVE | 1 |
| VISC M10AI | Digital Prepress 2 | ARTS | 1 |
| VISC M10AL | Flash Motion Graphics (Beginning Level) | ARTS | 1 |
| WORK M90AN | Custodian: Basic Maintenance | WEXP | 1 |
| WORK M90AO | Custodian Training | WEXP | 1 |

## Validation

- **V0_pinned_set**: pass
- **V1_levels_in_scope**: pass
- **V2_every_retired_id_on_a_stray_code**: pass
- **V3_no_retired_id_has_an_out_of_scope_course**: pass

## The apply (not built)

1. A fresh read of kb_curation for every retiring id and every CN: row pointing at one; any person's row found there holds its id.
2. Remove the ids from kb/coci_minted_courses.json, kb/coci_minted_singletons.json and kb/coci_minted_memberships.json, and their bot-cohort kb_curation rows, with retire.json as the receipt (its records restore them).
3. Dispatch the daily build: unified_courses_members.js, kb/coci_not_applicable.json and kb/csr_out/latest.json rebuild, and the courses read as Needs an M-ID.

Files: kb/stray_code_remint_out/2026-11-25/report.md, kb/stray_code_remint_out/2026-11-25/retire.json.
