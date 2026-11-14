# The Honors pairs: `honors_of` rows and base-plus-H mints, dry run (S653)

Written by `kb/_honors_of_s653_dryrun.py` at 2026-11-14T17:22:06Z. Nothing was applied. Design: `docs/reference/honors_of_design.md`. Every pair, with its counts and holds, is in `plan.json` beside this file.

## The count, reproduced

`measure_honors` (kb/_reclustering_s648_dryrun.py), on the committed members file (generated 2026-11-14 13:44): **508 pairs** (1118 Honors courses apart from their base). On the live-equivalent fold (the overlay without the two rows #3304 deleted): **510 pairs**; the difference is `HUMA M10ME` with `HUMA M1110`, `LIBR M10CJ` with `LIBR M1040`.

## The field holds the pair apart, simulated

Two exports of today's kb: *live* (the overlay as it stands since #3304's delete) and *field* (the two `automerge-v1@bot` merges kept, `honors_of` added on HUMA M10ME and LIBR M10CJ). Differences by file:

- `unified_courses_index.js`: 49,806 keys live, 49,806 with the field; 0 differ.
- `unified_courses_data.js`: 16,395 keys live, 16,395 with the field; 1 differ: `committed_curation`.
- `unified_courses_standalone.js`: 33,424 keys live, 33,424 with the field; 2 differ: `rows/HUMA M10ME`, `rows/LIBR M10CJ`.
- `unified_courses_members.js`: 49,565 keys live, 49,565 with the field; 0 differ.
- `unified_courses_details.js`: 46,264 keys live, 46,264 with the field; 0 differ.
- `unified_courses_member_desc.js`: 46,234 keys live, 46,234 with the field; 0 differ.
- `unified_courses_suggestions.js`: 14 keys live, 14 with the field; 0 differ.

## The plan

- pairs: 510
- by action: {'row and mint': 301, 'row only (official base)': 80, 'none': 65, 'held': 56, 'row and fold into the H id': 8}
- by systems: {'M-ID Honors, M-ID base': 354, 'M-ID Honors, C-ID base': 90, 'CCN-ID Honors, CCN-ID base': 22, 'C-ID Honors, CCN-ID base': 21, 'C-ID Honors, C-ID base': 9, 'C-ID Honors, M-ID base': 7, 'CCN-ID Honors, M-ID base': 3, 'CCN-ID Honors, C-ID base': 3, 'M-ID Honors, CCN-ID base': 1}
- rows to write (no hold): 389, of which mints (base plus H): 301
- holds by reason (a pair can carry several): {"the Honors M-ID's courses name 2 base identities": 32, "the Honors M-ID's courses name 4 base identities": 12, "the Honors M-ID's courses name 3 base identities": 9, "kb/promotions.json names the base among the Honors id's official targets": 3, 'the CCN record <id> already holds Honors courses beside <id>': 1}

Measures: *local courses* = rows in `unified_courses_members.js`; *folded identities* = the row's `members` in `unified_courses_data.js` or `unified_courses_standalone.js`.

### Two examples per class

- **held: kb/promotions.json names the base among the Honors id's official targets** (2):
  - `CHEM M1053` (2 local courses, 2 folded identities) with base `CHEM 120 S` (124 local courses, 124 folded identities); proposed `None`; courses [['Irvine Valley College', 'CHEM 1BH', 'CHEM 1B'], ['Mission College', 'CHM 001BH', 'CHM 001B']]
  - `SPAN M1073` (3 local courses, 3 folded identities) with base `SPAN 100` (159 local courses, 159 folded identities); proposed `None`; courses [['El Camino College', 'SPAN 1H', 'SPAN 1'], ['Southwestern College', 'SPAN 101H', 'SPAN 101']]
- **held: the CCN record <id> already holds Honors courses beside <id>** (1):
  - `HIST M10UP` (1 local courses, 1 folded identities) with base `HIST C1001` (85 local courses, 85 folded identities); proposed `None`; courses [['Moorpark College', 'HIST M25H', 'HIST M25']]
- **held: the Honors M-ID's courses name 2 base identities** (32):
  - `ARTS M1570` (3 local courses, 4 folded identities) with base `ARTS M1083` (3 local courses, 3 folded identities); proposed `ARTS M1083H`; courses [['Riverside City College', 'ART 1H', 'ART 1']]
  - `ARTS M1570` (3 local courses, 4 folded identities) with base `ARTS M1583` (2 local courses, 3 folded identities); proposed `ARTS M1583H`; courses [['El Camino College', 'ART 102AH', 'ART 102A']]
- **held: the Honors M-ID's courses name 3 base identities** (9):
  - `ANTH M1116` (3 local courses, 4 folded identities) with base `ANTH M10DB` (1 local courses, 1 folded identities); proposed `ANTH M10DBH`; courses [['Oxnard College', 'ANTH R111H', 'ANTH R111']]
  - `ANTH M1116` (3 local courses, 4 folded identities) with base `ANTH M1100` (3 local courses, 2 folded identities); proposed `ANTH M1100H`; courses [['Foothill College', 'ANTH 005H', 'ANTH 5']]
- **held: the Honors M-ID's courses name 4 base identities** (12):
  - `ENGL M1053` (10 local courses, 5 folded identities) with base `ENGL M1113` (90 local courses, 20 folded identities); proposed `ENGL M1113H`; courses [['Mt. San Jacinto College', 'LIT 260H', 'LIT 260'], ['American River College', 'ENGLT 486', 'ENGLT 330']]
  - `ENGL M1053` (10 local courses, 5 folded identities) with base `ETHS M1060` (55 local courses, 8 folded identities); proposed `ETHS M1060H`; courses [['Fullerton College', 'ETHS 129HF', 'ETHS 129 F']]
- **none** (65):
  - `ANTH 110` (131 local courses, 131 folded identities) with base `ANTH C1001` (22 local courses, 22 folded identities); proposed `None`; courses [['Mt. San Jacinto College', 'ANTH C1001H', 'ANTH C1001'], ['Orange Coast College', 'ANTH C1001H', 'ANTH C1001']]
  - `ANTH C1001H` (6 local courses, 6 folded identities) with base `ANTH C1001` (22 local courses, 22 folded identities); proposed `None`; courses [['Mt. San Jacinto College', 'ANTH C1001H', 'ANTH C1001'], ['Saddleback College', 'ANTH C1001H', 'ANTH C1001']]
- **row and fold into the H id** (8):
  - `ECON M10BX` (1 local courses, 1 folded identities) with base `ECON M1026` (26 local courses, 7 folded identities); proposed `ECON M1026H`; courses [['Foothill College', 'ECON 025H', 'ECON 25']]
  - `ENGL M11BM` (1 local courses, 1 folded identities) with base `ENGL M1258` (38 local courses, 14 folded identities); proposed `ENGL M1258H`; courses [['West Valley College', 'ENGL 049H', 'ENGL 49']]
- **row and mint** (301):
  - `ANTH M1005` (2 local courses, 2 folded identities) with base `ANTH M1006` (4 local courses, 4 folded identities); proposed `ANTH M1006H`; courses [['Fullerton College', 'ANTH 209HF', 'ANTH 209 F'], ['Oxnard College', 'SPAN R236H', 'SPAN R236']]
  - `ANTH M1015` (2 local courses, 2 folded identities) with base `ETHS M1117` (44 local courses, 2 folded identities); proposed `ETHS M1117H`; courses [['Oxnard College', 'ANTH R107H', 'ANTH R107'], ['Oxnard College', 'ETHS R107H', 'ANTH R107']]
- **row only (official base)** (80):
  - `ARTC M10AH` (1 local courses, 1 folded identities) with base `ARTH 120` (62 local courses, 62 folded identities); proposed `None`; courses [['Cerro Coso Community College', 'ARTC 106H', 'ART C106']]
  - `ARTH M10DA` (1 local courses, 1 folded identities) with base `ARTH 150` (56 local courses, 56 folded identities); proposed `None`; courses [['Sacramento City College', 'ARTH 488', 'ARTH 310']]

## What a person does

Nothing here is applied. The conductor runs the live reads in the design (`docs/reference/honors_of_design.md`, *Live reads*) before any migration; the migrations under `kb/migrations/2026-11-14_s653_honors_of_*` are drafted and not listed in `kb/migrations/.apply`.
