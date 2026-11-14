# The Honors pairs: `honors_of` rows and base-plus-H mints, dry run (S653)

Written by `kb/_honors_of_s653_dryrun.py` at 2026-11-14T18:09:21Z. Nothing was applied. Design: `docs/reference/honors_of_design.md`. Every pair, with its counts and holds, is in `plan.json` beside this file.

## The count, reproduced

`measure_honors` (kb/_reclustering_s648_dryrun.py), on the committed members file (generated 2026-11-14 13:44): **521 pairs** (1131 Honors courses apart from their base). On the live-equivalent fold (the overlay without the two rows #3304 deleted): **523 pairs**; the difference is `HUMA M10ME` with `HUMA M1110`, `LIBR M10CJ` with `LIBR M1040`.

## The field holds the pair apart, simulated

Two exports of today's kb: *live* (the overlay as it stands since #3304's delete) and *field* (the two `automerge-v1@bot` merges kept, `honors_of` added on HUMA M10ME and LIBR M10CJ). Differences by file:

- `unified_courses_index.js`: 49,806 keys live, 49,806 with the field; 0 differ.
- `unified_courses_data.js`: 16,395 keys live, 16,395 with the field; 1 differ: `committed_curation`.
- `unified_courses_standalone.js`: 33,424 keys live, 33,424 with the field; 2 differ: `rows/HUMA M10ME`, `rows/LIBR M10CJ`.
- `unified_courses_members.js`: 49,565 keys live, 49,565 with the field; 0 differ.
- `unified_courses_details.js`: 46,264 keys live, 46,264 with the field; 0 differ.
- `unified_courses_member_desc.js`: 46,234 keys live, 46,234 with the field; 0 differ.
- `unified_courses_suggestions.js`: 14 keys live, 14 with the field; 0 differ.

## The matcher's recall

`kb/_honors_matcher_recall.py` derives the pairs a second way and sets them against `measure_honors`, on the live-equivalent members file (identity pairs on unified_courses_members.js (local courses); a pair is (Honors identity, base identity) at one college): right 523, wrong 0, missed 0 of 423 code-path pairs with an M-ID Honors side. Before this branch's fix, on the committed members file: 508 pairs, right 507, wrong 1, missed 14. Labeled and held out: `COUN M10UC` with `IDST M1144` (uncertain: Mt. SAC COUN 7H 'Planning for Transfer Success - Honors' beside COUN 7 'Introduction to the Transfer Process'; the titles share one word, and the title gate holds such a pair out by design).

## The plan

- pairs: 523
- by action: {'row and mint': 305, 'row only (official base)': 81, 'held': 69, 'none': 64, 'row, fold after the mint': 4}
- by systems: {'M-ID Honors, M-ID base': 367, 'M-ID Honors, C-ID base': 90, 'CCN-ID Honors, CCN-ID base': 22, 'C-ID Honors, CCN-ID base': 21, 'C-ID Honors, C-ID base': 8, 'C-ID Honors, M-ID base': 7, 'CCN-ID Honors, M-ID base': 3, 'CCN-ID Honors, C-ID base': 3, 'M-ID Honors, CCN-ID base': 2}
- rows to write (no hold): 390, of which mints (base plus H): 305, folds after the mint: 4; step 1 writes 2 of them and step 2 the rest
- held pairs by first reason: {"the Honors M-ID's courses name 2 base identities": 38, "the Honors M-ID's courses name 3 base identities": 12, "the Honors M-ID's courses name 4 base identities": 12, 'the fold would join distinct Honors courses': 4, 'the CCN Honors record <id> already pairs with a course in <id>': 3}
- holds by reason (a pair can carry several): {"the Honors M-ID's courses name 2 base identities": 38, "the Honors M-ID's courses name 3 base identities": 12, "the Honors M-ID's courses name 4 base identities": 12, 'the fold would join distinct Honors courses': 4, 'the CCN Honors record <id> already pairs with a course in <id>': 3, 'the CCN record <id> already holds Honors courses beside <id>': 2}
- person merges into a planned id (overlay entries (kb/coci_curation.json, the live-equivalent fold) whose merge_into names an id of a planned row and whose reviewed_by is not a bot): 45; pairs a person's merge joins: 0. Only a join holds a pair (Rule 10); the rest proceed.
- the rows' digest: md5 `20d4fab9316392f96b1f48039acdba98` over the step-2 rows, `course_id>value` joined by `|` in C order; the migration refuses unless what it inserts has the same digest

**The fan-in order.** One H id per base (decision 3). The Honors M-ID with the most local courses takes it at the mint, by a one-to-one alias map. Each other single-base Honors M-ID on that base keeps its own `honors_of` row under its own id and merges into the H id after the mint, its own change. The mint never moves two ids onto one key, so no `(course_id, field)` slot is written twice. A follower whose Honors titles name a different course from the lead's is held: the fold would join distinct courses.

Measures: *local courses* = rows in `unified_courses_members.js`; *folded identities* = the row's `members` in `unified_courses_data.js` or `unified_courses_standalone.js`.

### Held pairs, by first reason

- **the Honors M-ID's courses name 2 base identities** (38): `ANTH M1015` with `ETHS M10JD`, `ANTH M1015` with `ETHS M1117`, `ARTS M1570` with `ARTS M1083`, `ARTS M1570` with `ARTS M1583`, `ASTR M1034` with `ASTR M1032`, `ASTR M1034` with `ASTR M1038`, `BIOL M1311` with `BIOL M1201`, `BIOL M1311` with `BIOL M1288`, `CHEM M1052` with `CHEM 120 S`, `CHEM M1052` with `CHEM M1054`, `COMM M1112` with `COMM M1060`, `COMM M1112` with `COMM M10IB`, `ENGL M1269` with `ENGL M11CK`, `ENGL M1269` with `ENGL M1272`, `ENGL M1285` with `ENGL M1330`, `ENGL M1285` with `ENGL M1366`, `ENGL M1379` with `ENGL 130`, `ENGL M1379` with `ENGL 135`, `ENGL M1439` with `ENGL M1312`, `ENGL M1439` with `HUMA M1098`, `ETHS M1266` with `ETHS M1213`, `ETHS M1266` with `ETHS M1218`, `HIST M1059` with `HIST M10JB`, `HIST M1059` with `POLS M10AG`, `HIST M1197` with `HIST M1198`, `HIST M1197` with `HIST M1199`, `LIBR M1034` with `LIBR M1010`, `LIBR M1034` with `LIBR M1011`, `MATH M1038` with `MATH 151`, `MATH M1038` with `MATH M1036`, `MATH M1330` with `MATH 250`, `MATH M1330` with `MATH M10FF`, `PHIL M1043` with `PHIL 110`, `PHIL M1043` with `PHIL M1048`, `PHSC M1029` with `GEOL M1057`, `PHSC M1029` with `PHSC M1015`, `SOCS M1067` with `HUMA M10DM`, `SOCS M1067` with `SOCS M10DJ`
- **the Honors M-ID's courses name 3 base identities** (12): `ANTH M1116` with `ANTH M10DB`, `ANTH M1116` with `ANTH M1100`, `ANTH M1116` with `ANTH M1101`, `BIOL M1095` with `BIOL 140`, `BIOL M1095` with `BIOL 190`, `BIOL M1095` with `BIOL M1094`, `ENGL M1408` with `ENGL M1107`, `ENGL M1408` with `ENGL M1122`, `ENGL M1408` with `ENGL M1263`, `ENGL M1433` with `ENGL M1140`, `ENGL M1433` with `ENGL M1266`, `ENGL M1433` with `ENGL M1357`
- **the Honors M-ID's courses name 4 base identities** (12): `ENGL M1053` with `ENGL M1113`, `ENGL M1053` with `ETHS M1060`, `ENGL M1053` with `ETHS M1065`, `ENGL M1053` with `ETHS M1090`, `ETHS M1012` with `ETHS M1011`, `ETHS M1012` with `HIST 130`, `ETHS M1012` with `HIST M1042`, `ETHS M1012` with `HIST M10AJ`, `PHIL M1124` with `HUMA M1034`, `PHIL M1124` with `HUMA M1110`, `PHIL M1124` with `PHIL M1029`, `PHIL M1124` with `PHIL M10HJ`
- **the fold would join distinct Honors courses** (4): `ECON M10BX` with `ECON M1026`, `ENGL M11BM` with `ENGL M1258`, `ENGL M11BN` with `ENGL M1258`, `MUSI M10CE` with `MUSI M1002`
- **the CCN Honors record <id> already pairs with a course in <id>** (3): `ASTR M1010` with `ASTR M1012`, `HIST M10UO` with `HIST C1001`, `HIST M10UP` with `HIST C1001`

### Two examples per class

- **held: the CCN Honors record <id> already pairs with a course in <id>** (3):
  - `ASTR M1010` (2 local courses, 2 folded identities) with base `ASTR M1012` (17 local courses, 17 folded identities); proposed `ASTR M1012H`; courses [['Mt. San Antonio College', 'ASTR 5H', 'ASTR 5'], ['Orange Coast College', 'ASTR A100H', 'ASTR A100']]
  - `HIST M10UO` (1 local courses, 1 folded identities) with base `HIST C1001` (85 local courses, 85 folded identities); proposed `None`; courses [['Mt. San Antonio College', 'HIST 1H', 'HIST 1']]
- **held: the Honors M-ID's courses name 2 base identities** (38):
  - `ANTH M1015` (2 local courses, 2 folded identities) with base `ETHS M10JD` (1 local courses, 1 folded identities); proposed `ETHS M10JDH`; courses [['Oxnard College', 'ETHS R107H', 'ETHS R107']]
  - `ANTH M1015` (2 local courses, 2 folded identities) with base `ETHS M1117` (44 local courses, 2 folded identities); proposed `ETHS M1117H`; courses [['Oxnard College', 'ANTH R107H', 'ANTH R107']]
- **held: the Honors M-ID's courses name 3 base identities** (12):
  - `ANTH M1116` (3 local courses, 4 folded identities) with base `ANTH M10DB` (1 local courses, 1 folded identities); proposed `ANTH M10DBH`; courses [['Oxnard College', 'ANTH R111H', 'ANTH R111']]
  - `ANTH M1116` (3 local courses, 4 folded identities) with base `ANTH M1100` (3 local courses, 2 folded identities); proposed `ANTH M1100H`; courses [['Foothill College', 'ANTH 005H', 'ANTH 5']]
- **held: the Honors M-ID's courses name 4 base identities** (12):
  - `ENGL M1053` (10 local courses, 5 folded identities) with base `ENGL M1113` (90 local courses, 20 folded identities); proposed `ENGL M1113H`; courses [['Mt. San Jacinto College', 'LIT 260H', 'LIT 260'], ['American River College', 'ENGLT 486', 'ENGLT 330']]
  - `ENGL M1053` (10 local courses, 5 folded identities) with base `ETHS M1060` (55 local courses, 8 folded identities); proposed `ETHS M1060H`; courses [['Fullerton College', 'ETHS 129HF', 'ETHS 129 F']]
- **held: the fold would join distinct Honors courses** (4):
  - `ECON M10BX` (1 local courses, 1 folded identities) with base `ECON M1026` (26 local courses, 7 folded identities); proposed `ECON M1026H`; courses [['Foothill College', 'ECON 025H', 'ECON 25']]
  - `ENGL M11BM` (1 local courses, 1 folded identities) with base `ENGL M1258` (38 local courses, 14 folded identities); proposed `ENGL M1258H`; courses [['West Valley College', 'ENGL 049H', 'ENGL 49']]
- **none** (64):
  - `ANTH 110` (131 local courses, 131 folded identities) with base `ANTH C1001` (22 local courses, 22 folded identities); proposed `None`; courses [['Mt. San Jacinto College', 'ANTH C1001H', 'ANTH C1001'], ['Orange Coast College', 'ANTH C1001H', 'ANTH C1001']]
  - `ANTH C1001H` (6 local courses, 6 folded identities) with base `ANTH C1001` (22 local courses, 22 folded identities); proposed `None`; courses [['Mt. San Jacinto College', 'ANTH C1001H', 'ANTH C1001'], ['Saddleback College', 'ANTH C1001H', 'ANTH C1001']]
- **row and mint** (305):
  - `ANTH M1005` (2 local courses, 2 folded identities) with base `ANTH M1006` (4 local courses, 4 folded identities); proposed `ANTH M1006H`; courses [['Fullerton College', 'ANTH 209HF', 'ANTH 209 F'], ['Oxnard College', 'SPAN R236H', 'SPAN R236']]
  - `ANTH M10AK` (1 local courses, 1 folded identities) with base `ANTH M10AL` (1 local courses, 1 folded identities); proposed `ANTH M10ALH`; courses [['Foothill College', 'ANTH 006H', 'ANTH 6']]
- **row only (official base)** (81):
  - `ARTC M10AH` (1 local courses, 1 folded identities) with base `ARTH 120` (62 local courses, 62 folded identities); proposed `None`; courses [['Cerro Coso Community College', 'ARTC 106H', 'ART C106']]
  - `ARTH M10DA` (1 local courses, 1 folded identities) with base `ARTH 150` (56 local courses, 56 folded identities); proposed `None`; courses [['Sacramento City College', 'ARTH 488', 'ARTH 310']]
- **row, fold after the mint** (4):
  - `ENGL M11FG` (1 local courses, 1 folded identities) with base `ENGL M1353` (41 local courses, 41 folded identities); proposed `ENGL M1353H`; courses [['Rio Hondo College', 'LIT 130H', 'LIT 130']]
  - `ETHS M10IR` (1 local courses, 1 folded identities) with base `ETHA M1002` (7 local courses, 3 folded identities); proposed `ETHA M1002H`; courses [['Mt. San Jacinto College', 'ETHS 240H', 'ETHS 240']]

## What a person does

Nothing here is applied. The conductor runs the live reads in the design (`docs/reference/honors_of_design.md`, *Live reads*) before any migration; the migrations under `kb/migrations/2026-11-14_s653_honors_of_*` are drafted and not listed in `kb/migrations/.apply`.
