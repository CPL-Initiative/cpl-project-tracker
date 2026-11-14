# The Honors pairs: `honors_of` rows and base-plus-H mints, dry run (S653)

Written by `kb/_honors_of_s653_dryrun.py` at 2026-11-14T18:40:04Z. Nothing was applied. Design: `docs/reference/honors_of_design.md`. Every pair, with its counts and holds, is in `plan.json` beside this file.

## The count, reproduced

`measure_honors` (kb/_reclustering_s648_dryrun.py), on the committed members file (generated 2026-11-14 13:44): **525 pairs** (1135 Honors courses apart from their base). On the live-equivalent fold (the overlay without the two rows #3304 deleted): **527 pairs**; the difference is `HUMA M10ME` with `HUMA M1110`, `LIBR M10CJ` with `LIBR M1040`.

## The field holds the pair apart, simulated

Two exports of today's kb: *live* (the overlay as it stands since #3304's delete) and *field* (the two `automerge-v1@bot` merges kept, `honors_of` added on HUMA M10ME and LIBR M10CJ). Differences by file:

- `unified_courses_index.js`: 49,806 keys live, 49,806 with the field; 0 differ.
- `unified_courses_data.js`: 16,395 keys live, 16,395 with the field; 1 differ: `committed_curation`.
- `unified_courses_standalone.js`: 33,424 keys live, 33,424 with the field; 2 differ: `rows/HUMA M10ME`, `rows/LIBR M10CJ`.
- `unified_courses_members.js`: 49,565 keys live, 49,565 with the field; 0 differ.
- `unified_courses_details.js`: 46,264 keys live, 46,264 with the field; 0 differ.
- `unified_courses_member_desc.js`: 46,234 keys live, 46,234 with the field; 0 differ.
- `unified_courses_suggestions.js`: 14 keys live, 14 with the field; 0 differ.

## Two signals, and the self-recall measures

A pair gets a row only where two derivations that share no code both find it: the matcher (`kb/_reclustering_s648_dryrun.py` `measure_honors`) and the second derivation (`kb/_honors_pairs_second.py`, from course numbers and titles directly). A pair one alone finds is held and says which. `kb/_honors_matcher_recall.py` measures each against hand labels (31 real pairs, 1 not real; identity pairs on unified_courses_members.js (local courses); a pair is (Honors identity, base identity) at one college; right, wrong and missed are against the hand labels in kb/_honors_matcher_recall.py):

- the matcher: 527 pairs; right 29, wrong 0, missed 2, held out 1; 498 found carry no label; missed `COUN M10UB` with `BUSI M1381`, `PHS 103` with `SOCI M10AA`
- the second derivation: 553 pairs; right 31, wrong 1, missed 0, held out 0; 521 found carry no label
- both (the rows): 527 pairs; right 29, wrong 0, missed 2, held out 1; 498 found carry no label; missed `COUN M10UB` with `BUSI M1381`, `PHS 103` with `SOCI M10AA`
- the course-title test (`one_course`), 24 labeled title pairs: right 22, wrong 2 (English Composition / College Composition; Hist of the Americas / Histology of the Americas)
- the lump test (`lump_reasons`), 18 labeled bases: right 18, wrong 0

## The plan

- pairs: 553
- by action: {'row and mint': 267, 'held': 116, 'none': 88, 'row only (official base)': 78, 'row, fold after the mint': 4}
- by systems: {'M-ID Honors, M-ID base': 372, 'M-ID Honors, C-ID base': 91, 'CCN-ID Honors, C-ID base': 23, 'C-ID Honors, CCN-ID base': 22, 'CCN-ID Honors, CCN-ID base': 22, 'C-ID Honors, C-ID base': 10, 'C-ID Honors, M-ID base': 8, 'CCN-ID Honors, M-ID base': 3, 'M-ID Honors, CCN-ID base': 2}
- by signals (a row needs both): {'the matcher and the second derivation': 527, 'the second derivation': 26}; M-ID Honors side only: {'the matcher and the second derivation': 463, 'the second derivation': 2}
- rows to write (no hold): 349, of which mints (base plus H): 267, folds after the mint: 4; step 1 writes 2 of them and step 2 the rest
- held pairs by first reason: {'the base holds more than one course': 45, 'the Honors id holds two Honors courses': 23, "the Honors M-ID's courses name 2 base identities": 22, 'the base holds two parts or periods of one subject': 13, 'the CCN Honors record <id> already pairs with a course in <id>': 7, "the Honors M-ID's courses name 3 base identities": 3, 'found by the second derivation alone': 2, "the Honors M-ID's courses name 4 base identities": 1}
- holds by reason (a pair can carry several): {'the base holds more than one course': 45, 'the Honors id holds two Honors courses': 41, "the Honors M-ID's courses name 2 base identities": 40, 'the base holds two parts or periods of one subject': 22, "the Honors M-ID's courses name 3 base identities": 12, "the Honors M-ID's courses name 4 base identities": 12, 'the CCN Honors record <id> already pairs with a course in <id>': 8, 'the fold would join distinct Honors courses': 4, 'found by the second derivation alone': 2, 'the CCN record <id> already holds Honors courses beside <id>': 2}
- person merges into a planned id (overlay entries (kb/coci_curation.json, the live-equivalent fold) whose merge_into names an id of a planned row and whose reviewed_by is not a bot): 28; pairs a person's merge joins: 0. Only a join holds a pair (Rule 10); the rest proceed.
- the rows' digest: md5 `7d733405d750a50bb359e1bea7665ed7` over the step-2 rows, `course_id>value` joined by `|` in C order; the migration refuses unless what it inserts has the same digest

**The fan-in order.** One H id per base (decision 3). The Honors M-ID with the most local courses takes it at the mint, by a one-to-one alias map. Each other single-base Honors M-ID on that base keeps its own `honors_of` row under its own id and merges into the H id after the mint, its own change. The mint never moves two ids onto one key, so no `(course_id, field)` slot is written twice. A follower whose Honors titles name a different course from the lead's is held: the fold would join distinct courses.

Measures: *local courses* = rows in `unified_courses_members.js`; *folded identities* = the row's `members` in `unified_courses_data.js` or `unified_courses_standalone.js`.

### Held pairs, by first reason

- **the base holds more than one course** (45): `ANTH M10JV` with `ANTH M1102`, `ARTS M10NC` with `ARTS M1074`, `ARTS M10PL` with `THTR M1269`, `ASTR M1034` with `ASTR M1038`, `ASTR M10CO` with `ASTR M1002`, `BIOL M10IT` with `BIOL M1127`, `BIOL M10UX` with `BIOL M1167`, `BIOL M1311` with `BIOL M1288`, `ECON M1029` with `ECON M1026`, `ECON M10BX` with `ECON M1026`, `ENGL M1053` with `ENGL M1113`, `ENGL M1053` with `ETHS M1060`, `ENGL M1053` with `ETHS M1065`, `ENGL M11BL` with `ENGL M1258`, `ENGL M11BM` with `ENGL M1258`, `ENGL M11BN` with `ENGL M1258`, `ENGL M11EX` with `ENGL M1369`, `ENGL M1282` with `ENGL M1298`, `ENGL M1408` with `ENGL M1107`, `ENGL M1433` with `ENGL M1140`, `ENGL M1439` with `ENGL M1312`, `ENGL M1440` with `ENGL M1290`, `ENGL M1441` with `ENGL M1140`, `ETHS M1012` with `HIST M1042`, `ETHS M10HG` with `ETHS M1166`, `ETHS M10TG` with `ETHS M1285`, `ETHS M1177` with `ETHN M1028`, `ETHS M1266` with `ETHS M1213`, `ETHS M1266` with `ETHS M1218`, `ETHS M1278` with `ENGL M1336`, `FA M10AA` with `ARTS M1129`, `FTVE M10NK` with `COMP M1085`, `FTVM M10AT` with `BRDC M1062`, `HIST M10HN` with `HIST M1096`, `HIST M10NY` with `HIST M1107`, `HIST M10NZ` with `HIST M1108`, `HIST M10UK` with `HIST M1172`, `HIST M1231` with `HIST M1112`, `HLTH M10AS` with `ARTS M1006`, `IDST M10RQ` with `COUN M1155`, `LIBR M1034` with `LIBR M1010`, `PHIL M1124` with `PHIL M1029`, `PHSC M1029` with `GEOL M1057`, `PHYS M10EV` with `CHEM M1044`, `SOCS M1039` with `SOCS M1040`
- **the Honors id holds two Honors courses** (23): `ANTH M1116` with `ANTH M10DB`, `ANTH M1116` with `ANTH M1100`, `ANTH M1116` with `ANTH M1101`, `ARTS M1570` with `ARTS M1083`, `ARTS M1570` with `ARTS M1583`, `BIOL M1311` with `BIOL M1201`, `BIOL M1317` with `BIOL M1318`, `COMM M1112` with `COMM M1060`, `COMM M1112` with `COMM M10IB`, `ENGL M1408` with `ENGL M1122`, `ENGL M1408` with `ENGL M1263`, `ENGL M1433` with `ENGL M1266`, `ENGL M1433` with `ENGL M1357`, `ETHS M1012` with `ETHS M1011`, `ETHS M1012` with `HIST M10AJ`, `HIST M1197` with `HIST M1198`, `HUMA M1084` with `PHIL M1003`, `HUMA M1084` with `PHIL M1095`, `LIBR M1034` with `LIBR M1011`, `PHIL M1124` with `HUMA M1034`, `PHIL M1124` with `HUMA M1110`, `PHIL M1124` with `PHIL M10HJ`, `PHSC M1029` with `PHSC M1015`
- **the Honors M-ID's courses name 2 base identities** (22): `ANTH M1015` with `ETHS M10JD`, `ANTH M1015` with `ETHS M1117`, `ASTR M1034` with `ASTR M1032`, `CHEM M1052` with `CHEM 120 S`, `CHEM M1052` with `CHEM M1054`, `ENGL M1269` with `ENGL M11CK`, `ENGL M1269` with `ENGL M1272`, `ENGL M1285` with `ENGL M1330`, `ENGL M1285` with `ENGL M1366`, `ENGL M1379` with `ENGL 130`, `ENGL M1379` with `ENGL 135`, `ENGL M1439` with `HUMA M1098`, `HIST M1059` with `HIST M10JB`, `HIST M1059` with `POLS M10AG`, `MATH M1038` with `MATH 151`, `MATH M1038` with `MATH M1036`, `MATH M1330` with `MATH 250`, `MATH M1330` with `MATH M10FF`, `PHIL M1043` with `PHIL 110`, `PHIL M1043` with `PHIL M1048`, `SOCS M1067` with `HUMA M10DM`, `SOCS M1067` with `SOCS M10DJ`
- **the base holds two parts or periods of one subject** (13): `ARTH M10CZ` with `ARTH M1027`, `ARTS M10LJ` with `ARTS M1566`, `ENGL M1053` with `ETHS M1090`, `HIST M1090` with `HIST M1101`, `HIST M10AV` with `HIST M1196`, `HIST M10WP` with `ETHS M1260`, `HIST M1197` with `HIST M1199`, `HIST M1200` with `HIST M1201`, `MUSI M10BT` with `MUSI M1002`, `MUSI M10CE` with `MUSI M1002`, `SLNA M1022` with `SLNA M1028`, `SLNA M1023` with `SLNA M1033`, `SLNA M1097` with `SLNA M1036`
- **the CCN Honors record <id> already pairs with a course in <id>** (7): `ARTC M10AH` with `ARTH 120`, `ARTS M10QA` with `ARTH 120`, `ASTR M1010` with `ASTR M1012`, `ENGL M11EU` with `ENGL 120`, `HIST M10UO` with `HIST C1001`, `HIST M10UP` with `HIST C1001`, `HUMA M1052` with `COMM 130`
- **the Honors M-ID's courses name 3 base identities** (3): `BIOL M1095` with `BIOL 140`, `BIOL M1095` with `BIOL 190`, `BIOL M1095` with `BIOL M1094`
- **found by the second derivation alone** (2): `COUN M10UB` with `BUSI M1381`, `COUN M10UC` with `IDST M1144`
- **the Honors M-ID's courses name 4 base identities** (1): `ETHS M1012` with `HIST 130`

### Two examples per class

- **held: found by the second derivation alone** (2):
  - `COUN M10UB` (1 local courses, 1 folded identities) with base `BUSI M1381` (8 local courses, 8 folded identities); proposed `BUSI M1381H`; courses []
  - `COUN M10UC` (1 local courses, 1 folded identities) with base `IDST M1144` (5 local courses, 5 folded identities); proposed `IDST M1144H`; courses []
- **held: the CCN Honors record <id> already pairs with a course in <id>** (7):
  - `ARTC M10AH` (1 local courses, 1 folded identities) with base `ARTH 120` (62 local courses, 62 folded identities); proposed `None`; courses [['Cerro Coso Community College', 'ARTC 106H', 'ART C106']]
  - `ARTS M10QA` (1 local courses, 1 folded identities) with base `ARTH 120` (62 local courses, 62 folded identities); proposed `None`; courses [['Riverside City College', 'ART 2H', 'ART 2']]
- **held: the Honors M-ID's courses name 2 base identities** (22):
  - `ANTH M1015` (2 local courses, 2 folded identities) with base `ETHS M10JD` (1 local courses, 1 folded identities); proposed `ETHS M10JDH`; courses [['Oxnard College', 'ETHS R107H', 'ETHS R107']]
  - `ANTH M1015` (2 local courses, 2 folded identities) with base `ETHS M1117` (44 local courses, 2 folded identities); proposed `ETHS M1117H`; courses [['Oxnard College', 'ANTH R107H', 'ANTH R107']]
- **held: the Honors M-ID's courses name 3 base identities** (3):
  - `BIOL M1095` (9 local courses, 2 folded identities) with base `BIOL 140` (41 local courses, 41 folded identities); proposed `None`; courses [['Glendale Community College', 'BIOL 102H', 'BIOL 102']]
  - `BIOL M1095` (9 local courses, 2 folded identities) with base `BIOL 190` (69 local courses, 69 folded identities); proposed `None`; courses [['Glendale Community College', 'BIOL 101H', 'BIOL 101']]
- **held: the Honors M-ID's courses name 4 base identities** (1):
  - `ETHS M1012` (7 local courses, 6 folded identities) with base `HIST 130` (118 local courses, 118 folded identities); proposed `None`; courses [['Long Beach City College', 'HIST 27AH', 'HIST 27A']]
- **held: the Honors id holds two Honors courses** (23):
  - `ANTH M1116` (3 local courses, 4 folded identities) with base `ANTH M10DB` (1 local courses, 1 folded identities); proposed `ANTH M10DBH`; courses [['Oxnard College', 'ANTH R111H', 'ANTH R111']]
  - `ANTH M1116` (3 local courses, 4 folded identities) with base `ANTH M1100` (3 local courses, 2 folded identities); proposed `ANTH M1100H`; courses [['Foothill College', 'ANTH 005H', 'ANTH 5']]
- **held: the base holds more than one course** (45):
  - `ANTH M10JV` (1 local courses, 1 folded identities) with base `ANTH M1102` (15 local courses, 6 folded identities); proposed `ANTH M1102H`; courses [['Mt. San Jacinto College', 'ANTH 104H', 'ANTH 104']]
  - `ARTS M10NC` (1 local courses, 1 folded identities) with base `ARTS M1074` (8 local courses, 5 folded identities); proposed `ARTS M1074H`; courses [['Citrus College', 'ART 206H', 'ART 206']]
- **held: the base holds two parts or periods of one subject** (13):
  - `ARTH M10CZ` (1 local courses, 1 folded identities) with base `ARTH M1027` (9 local courses, 6 folded identities); proposed `ARTH M1027H`; courses [['Sacramento City College', 'ARTH 486', 'ARTH 306']]
  - `ARTS M10LJ` (1 local courses, 1 folded identities) with base `ARTS M1566` (2 local courses, 3 folded identities); proposed `ARTS M1566H`; courses [['Foothill College', 'ART 02BH', 'ART 002B']]
- **none** (88):
  - `ANTH 110` (131 local courses, 131 folded identities) with base `ANTH C1001` (22 local courses, 22 folded identities); proposed `None`; courses [['Mt. San Jacinto College', 'ANTH C1001H', 'ANTH C1001'], ['Orange Coast College', 'ANTH C1001H', 'ANTH C1001']]
  - `ANTH C1001H` (6 local courses, 6 folded identities) with base `ANTH 110` (131 local courses, 131 folded identities); proposed `None`; courses []
- **row and mint** (267):
  - `ANTH M1005` (2 local courses, 2 folded identities) with base `ANTH M1006` (4 local courses, 4 folded identities); proposed `ANTH M1006H`; courses [['Fullerton College', 'ANTH 209HF', 'ANTH 209 F'], ['Oxnard College', 'SPAN R236H', 'SPAN R236']]
  - `ANTH M10AK` (1 local courses, 1 folded identities) with base `ANTH M10AL` (1 local courses, 1 folded identities); proposed `ANTH M10ALH`; courses [['Foothill College', 'ANTH 006H', 'ANTH 6']]
- **row only (official base)** (78):
  - `ARTH M10DA` (1 local courses, 1 folded identities) with base `ARTH 150` (56 local courses, 56 folded identities); proposed `None`; courses [['Sacramento City College', 'ARTH 488', 'ARTH 310']]
  - `ARTS M10KT` (1 local courses, 1 folded identities) with base `ARTS 210` (242 local courses, 242 folded identities); proposed `None`; courses [['San Joaquin Delta College', 'ART 9H', 'ART 9']]
- **row, fold after the mint** (4):
  - `ENGL M11FG` (1 local courses, 1 folded identities) with base `ENGL M1353` (41 local courses, 41 folded identities); proposed `ENGL M1353H`; courses [['Rio Hondo College', 'LIT 130H', 'LIT 130']]
  - `ETHS M10IR` (1 local courses, 1 folded identities) with base `ETHA M1002` (7 local courses, 3 folded identities); proposed `ETHA M1002H`; courses [['Mt. San Jacinto College', 'ETHS 240H', 'ETHS 240']]

## What a person does

Nothing here is applied. The conductor runs the live reads in the design (`docs/reference/honors_of_design.md`, *Live reads*) before any migration; the migrations under `kb/migrations/2026-11-14_s653_honors_of_*` are drafted and not listed in `kb/migrations/.apply`.
