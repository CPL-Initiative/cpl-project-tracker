# ESL fold spot-check

_Generated 2026-08-24 · read-only · scope `all` · source `kb/esl_package_out/2026-08-24/esl_apply_plan.json`_

**All 1990 folds** from the 2026-08-24 ESL packaging pass, each re-checked against the catalog DESCRIPTIONS of its member courses — evidence the fold classifier never read, because it only ever looked at the identity's modal title.

**230 of them carry description evidence that disagrees with the band the fold assigned.** 1217 carry no level assertion either way, and there is nothing to review on those.

| Category | Rows | What it means |
|---|---:|---|
| `contradicts` | 187 | An explicit band phrase in the member description says a different level. **Work these first.** |
| `conflict` | 8 | Members assert different bands — needs a human. |
| `weak-contradicts` | 35 | Only a strand adjective ("advanced writing") — may describe the topic, not the cohort. |
| `level-in-purpose-bucket` | 45 | The description names a level, but the row sits in a PURPOSE carve-out (Enrichment/Civic/Vocational). Re-pointing it would strip the carve-out, so it is reported, never proposed. |
| `prereq-only` | 6 | A level appears only in a prerequisite clause — evidence the course sits ABOVE it, never a proposal. |
| `confirms` | 492 | Description agrees with the assigned band. Accept. |
| `no-signal` | 1217 | No level assertion anywhere. The fold's own signal stands by doctrine. |

Proposed re-levels: **95 → Advanced**, **5 → Beginning**, **122 → Intermediate**

## ⭐ Which fold signal actually held up

How often each signal disagrees with the college's own catalog description. ⚠️ The rate is over rows a description can **check** — `unchecked` rows assert nothing either way and are excluded, not counted as agreement.

| Signal / confidence | Disagrees | Agrees | Unchecked | Wrong rate |
|---|---:|---:|---:|---:|
| `combo/medium` | 2 | 0 | 3 | **100.0%** |
| `default-beginning/medium` | 102 | 31 | 384 | **76.7%** |
| `numeric/medium` | 94 | 97 | 241 | **49.2%** |
| `combo/high` | 1 | 7 | 24 | **12.5%** |
| `word/high` | 23 | 345 | 455 | **6.2%** |

### Why the numeric lane fails: ladders are different LENGTHS

The mis-fires are **directional, not random** — 85 under-claim, 9 over-claim. The ratified pinning (1-2 Beginning / 3-4 Intermediate / 5+ Advanced) assumes every college runs a ladder of the same length. A college with a **1-3** ladder has `2` as its MIDDLE rung, so "Listening and Speaking 2" is *intermediate* in its own catalog while the pinning reads it as Beginning.

⚠️ **The 9 over-claims are the ones to look at first**, even though the 85 under-claims are far more numerous. Under-claiming is the direction the doctrine deliberately chose (award at the entry band rather than over-claim); over-claiming is the direction it exists to prevent.

## The repair is available today

Every row here is a `merge_into` owned by `package-esl-s187@bot`, so a re-level is an UPDATE of that row's target — one level survivor for another (Advanced `ESOL M1141` · Beginning `ESOL M9168` · Intermediate `ESOL M9256`). It needs none of the three missing verbs (un-merge, relabel-island, re-home-inside-a-merged-identity).

## What was rejected

local course NUMBER ladder — a college runs parallel numbering schemes (credit vs noncredit mirrors) and off-ladder labs carry numbers too, so nearest-anchor placement is not an ordinal. 325 rows would have been proposed on it.

## Head of the queue

### `ESOL M1248` — ESL Skills Development Lab — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Evergreen Valley College · ESL 372L — ESL Skills Development Lab  
  _“for high-intermediate ESL learner”_; _“high-intermediate ESL”_
- Evergreen Valley College · ESL 572L — ESL Skills Development Lab   
  _“for high-intermediate ESL learner”_; _“high-intermediate ESL”_

### `ESOL M1027` — Listening and Speaking 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Contra Costa College · ESL 126 — Listening/Speaking II  
  _“for intermediate ESL student”_; _“intermediate ESL”_
- Contra Costa College · ESL 826N — Listening/Speaking II  
  _“for intermediate ESL student”_; _“intermediate ESL”_

### `ESOL M1026` — Grammar 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Contra Costa College · ESL 166 — Grammar II  
  _“intermediate level ESL”_
- Contra Costa College · ESL 866N — Grammar II  
  _“for intermediate ESL student”_; _“intermediate ESL”_

### `ESOL M1028` — Reading and Writing 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- College of Alameda · ESOL 252B — Reading and Writing 2  
  _“intermediate-level ESL”_
- Evergreen Valley College · ESL 511 — Reading and Writing 2  
  _“at the low-intermediate level”_
- Laney College · ESOL 252A — Reading and Writing 2  
  _“intermediate-level ESL”_
- Laney College · ESOL 252B — Reading and Writing 2  
  _“intermediate-level ESL”_

### `ESLN M9013` — English as a Second Language - 3 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Copper Mountain College · AE 308 — English as a Second Language III  
  _“advanced grammar”_
- Los Angeles Harbor College · ESL NC 063CE — ENGLISH AS A SECOND LANGUAGE III  
  _“at the advanced level”_
- Los Angeles Southwest College · ESL NC 009CE — ENGLISH AS A SECOND LANGUAGE - III    
  _“at the low-intermediate level”_
- West Los Angeles College · ESL NC 063CE — ENGLISH AS A SECOND LANGUAGE III  
  _“at the advanced level”_

### `ESOL M1211` — College ESL 5: Writing and Grammar — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- East Los Angeles College · E.S.L. 005A — College ESL V: Writing and Grammar  
  _“at the high-intermediate level”_; _“at the high intermediate level”_
- East Los Angeles College · ESL NC 151CE — College ESL V: Writing and Grammar  
  _“at the high-intermediate level”_; _“at the high intermediate level”_
- Los Angeles City College · E.S.L. 005A — COLLEGE ESL V: WRITING AND GRAMMAR  
  _“at the high-intermediate level”_
- Los Angeles Harbor College · ESL NC 095CE — COLLEGE ESL V: WRITING AND GRAMMAR  
  _“high-intermediate ESL”_
- Los Angeles Harbor College · E.S.L. 005A — College ESL V: Writing and Grammar  
  _“high-intermediate ESL”_
- Los Angeles Pierce College · E.S.L. 005A — College ESL V: Writing and Grammar  
  _“high-intermediate ESL”_; _“high-intermediate writing”_
- Los Angeles Trade Technical College · E.S.L. 005A — College ESL V: Writing and Grammar  
  _“high-intermediate writing”_
- Los Angeles Valley College · E.S.L. 005A — COLLEGE ESL V: WRITING AND GRAMMAR  
  _“at the high-intermediate level”_; _“at the high intermediate level”_

### `ESOL M1217` — College ESL 5: Listening and Speaking — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- East Los Angeles College · E.S.L. 005C — College ESL V: Listening and Speaking  
  _“high-intermediate speaking”_
- East Los Angeles College · ESL NC 153CE — College ESL V: Listening and Speaking  
  _“high-intermediate speaking”_
- Los Angeles City College · E.S.L. 005C — COLLEGE ESL V: LISTENING AND SPEAKING  
  _“at the high-intermediate level”_
- Los Angeles Harbor College · ESL 005C — COLLEGE ESL V: LISTENING AND SPEAKING  
  _“high-intermediate ESL”_
- Los Angeles Mission College · E.S.L. 005C — COLLEGE ESL V: LISTENING AND SPEAKING  
  _“low-advanced listening”_
- Los Angeles Pierce College · E.S.L. 005C — College ESL V: Listening and Speaking  
  _“high-intermediate ESL”_
- Los Angeles Valley College · E.S.L. 005C — COLLEGE ESL V: LISTENING AND SPEAKING  
  _“high-intermediate-level course”_

### `ESOL M9124` — American English Pronunciation — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Barstow Community College · ESL 107 — Pronunciation of American English  
  _“advanced ESL”_
- Barstow Community College · ESL 157 — Pronunciation of American English  
  _“advanced ESL”_

### `ESLN M9017` — English as a Second Language 5 — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Los Angeles Pierce College · ESL NC 016CE — English as a Second Language - V  
  _“low-intermediate ESL”_
- West Los Angeles College · ESL NC ESLNC — English as a Second Language V  
  _“This is a high-intermediate course”_

### `ESOL M1220` — College ESL 5: Reading and Vocabulary — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Los Angeles City College · E.S.L. 005B — COLLEGE ESL V: READING AND VOCABULARY  
  _“at the high-intermediate level”_

### `ESOL M1293` — Introduction to the Essay — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- De Anza College · ESL 273 — Introduction to the Essay  
  _“This advanced course”_
- De Anza College · ESL 473 — Introduction to the Essay  
  _“This advanced course”_
- San Jose City College · English Second Language (ESL) 312 — Introduction to the Essay  
  _“high-intermediate writing”_
- San Jose City College · English as a Second Language (ESL) 512 — Introduction to the Essay  
  _“high-intermediate writing”_

### `ESLN M9015` — English as a Second Language - 4 — folded **Intermediate**, description says **Beginning** (`ESOL M9168`)
_fold signal: `numeric` (medium confidence)_
- Los Angeles Pierce College · ESL NC 015CE — English as a Second Language - IV  
  _“high-beginning ESL”_

### `ESOL M1082` — Academic Listening and Speaking 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- San Diego City College · ELAC 23 — Academic Listening and Speaking I  
  _“at the intermediate level”_
- San Diego Mesa College · ELAC 23 — Academic Listening and Speaking I  
  _“at the intermediate level”_
- San Diego Miramar College · ELAC 23 — Academic Listening and Speaking I  
  _“at the intermediate level”_

### `ESOL M1094` — Academic Listening and Speaking — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Chabot College · ESL 111B — Academic Listening and Speaking  
  _“at the High-Intermediate Level”_; _“advanced ESL”_
- Sierra College · ESL 0025L — Academic Listening and Speaking  
  _“advanced-level English”_
- Sierra College · ESL 0840L — Academic Listening and Speaking  
  _“advanced-level English”_

### `ESOL M9086` — Accent Reduction — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Long Beach City College · ESL 615 — Accent Reduction  
  _“course for intermediate”_
- Long Beach City College · ESL 815 — Accent Reduction  
  _“course for intermediate”_

### `ESLN M9012` — English as a Second Language - Speech 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- West Los Angeles College · ESL NC 024CE — English as a Second Languageâ€“Speech II  
  _“intermediate ESL”_

### `ESOL M1084` — Academic Reading and Writing 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Ventura College · ENGM V01R — Academic Reading and Writing I  
  _“intermediate ESL”_

### `ESOL M1086` — Academic Reading and Writing 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Ventura College · ENGM V02R — Academic Reading and Writing II  
  _“high-intermediate ESL”_

### `ESOL M1087` — Academic Reading and Writing 3 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Ventura College · ENGM V03R — Academic Reading and Writing III  
  _“advanced ESL”_

### `ESOL M1169` — Basic Writing Skills — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `word` (high confidence)_
- Bakersfield College · EMLS B60 — Basic Writing Skills  
  _“at the advanced level”_
- Bakersfield College · EMLS B60NC — Basic Writing Skills  
  _“at the advanced level”_

### `ESOL M1230` — Introduction to English Literacy and Communication — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- San Diego City College · ELAC 15 — Introduction to English Literacy and Communication  
  _“at the low-intermediate level”_
- San Diego Mesa College · ELAC 15 — Introduction to English Literacy and Communication  
  _“at the low-intermediate level”_
- San Diego Miramar College · ELAC 15 — Introduction to English Literacy and Communication  
  _“at the low-intermediate level”_

### `ESOL M1275` — English for Special Purposes — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Laney College · ESOL 290 — English for Special Purposes  
  _“Intermediate-level English”_
- Laney College · ESOL 590 — English for Special Purposes  
  _“Intermediate-level English”_
- Merritt College · ESOL 590 — English for Special Purposes  
  _“Intermediate-level English”_

### `ESOL M1301` — Integrated Reading, Writing, and Grammar 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- San Diego City College · ELAC 25 — Integrated Reading, Writing, and Grammar I  
  _“at the intermediate level”_
- San Diego Mesa College · ELAC 25 — Integrated Reading, Writing, and Grammar I  
  _“at the intermediate level”_
- San Diego Miramar College · ELAC 25 — Integrated Reading, Writing, and Grammar I  
  _“at the intermediate level”_

### `ESOL M1302` — Integrated Reading, Writing and Grammar 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- San Diego City College · ELAC 35 — Integrated Reading, Writing and Grammar II  
  _“at the high-intermediate level”_
- San Diego Mesa College · ELAC 35 — Integrated Reading, Writing and Grammar II  
  _“at the high-intermediate level”_
- San Diego Miramar College · ELAC 35 — Integrated Reading, Writing and Grammar II  
  _“at the high-intermediate level”_

### `ESOL M1303` — Integrated Reading, Writing, and Grammar 3 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- San Diego City College · ELAC 145 — Integrated Reading, Writing, and Grammar III  
  _“at the advanced level”_
- San Diego Mesa College · ELAC 145 — Integrated Reading, Writing, and Grammar III  
  _“at the advanced level”_
- San Diego Miramar College · ELAC 145 — Integrated Reading, Writing, and Grammar III  
  _“at the advanced level”_

### `ESOL M1333` — Pronunciation 2 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Monterey Peninsula College · ENSL 429 — Pronunciation II  
  _“advanced ESL”_
- Monterey Peninsula College · ENSL 329 — Pronunciation II  
  _“advanced ESL”_

### `ESOL M9020` — Grammar for Writers 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- San Jose City College · English as a Second Language (ESL) 541 — Grammar for Writers 1  
  _“at the intermediate level”_

### `ESOL M9041` — Grammar for Writers 2 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Evergreen Valley College · ESL 396 — Grammar for Writers 2  
  _“advanced ESL”_
- Evergreen Valley College · ESL 596 — Grammar for Writers 2  
  _“advanced ESL”_
- San Jose City College · English as a Second Language (ESL) 542 — Grammar for Writers 2  
  _“at the low-advanced level”_

### `ESOL M9171` — ESL for Healthcare Careers — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Santiago Canyon College · ESL 800 — ESL for Healthcare Careers  
  _“advanced-level ESL”_

### `ESLN M9014` — English as a Second Language - Introductory — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Los Angeles City College · ESL NC 110CE — English as a Second Language - Introductory  
  _“low-intermediate ESL”_
- West Los Angeles College · ESL NC 110CE — English as a Second Language - Introductory  
  _“low-intermediate ESL”_

### `ESOL M1025` — ESL Reading 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Imperial Valley College · ESL 24 — ESL Reading 2  
  _“high-intermediate ESL”_

### `ESOL M1040` — Vocabulary 3 — folded **Intermediate**, description says **Beginning** (`ESOL M9168`)
_fold signal: `numeric` (medium confidence)_
- Imperial Valley College · ESL 62 — Vocabulary 3  
  _“at the high beginning level”_

### `ESOL M1041` — Grammar, Reading, and Writing 3A — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Coastline Community College · ESL C035 — Grammar, Reading, and Writing 3A  
  _“for intermediate student”_; _“course for intermediate”_
- Coastline Community College · ESL C035N — Grammar, Reading, and Writing 3A  
  _“for intermediate student”_; _“course for intermediate”_

### `ESOL M1047` — Integrated ESL Skills, Level 5 — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Yuba College · ESL 555 — Integrated ESL Skills, Level 5  
  _“at the high-intermediate level”_

### `ESOL M1050` — Integrated ESL Skills, Level 6 — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Yuba College · ESL 265 — Integrated ESL Skills, Level 6  
  _“at the high-intermediate level”_
- Yuba College · ESL 565 — Integrated ESL Skills, Level 6  
  _“at the high-intermediate level”_

### `ESOL M1052` — Accelerated Academic English for Nonnative Speakers 2 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Woodland Community College · ESOL 560 — Accelerated Academic English for Nonnative Speakers II  
  _“at the low-advanced level”_
- Woodland Community College · ESOL 260 — Accelerated Academic English for Nonnative Speakers II  
  _“at the low-advanced level”_

### `ESOL M1061` — Bridge to Academic Oral Communication — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Barstow Community College · ESL 136 — Bridge to Academic Oral Communication  
  _“high-advanced ESL”_
- Barstow Community College · ESL 186 — Bridge to Academic Oral Communication  
  _“high-advanced ESL”_

### `ESOL M1151` — ESL Reading for College - American Literature — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Saddleback College · ESL 355 — ESL READING FOR COLLEGE - AMERICAN LITERATURE  
  _“advanced ESL”_
- Saddleback College · ESL 355NC — ESL READING FOR COLLEGE: AMERICAN LITERATURE  
  _“advanced ESL”_

### `ESOL M1161` — Pronunciation B — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Contra Costa College · ESL 835BN — Pronunciation B  
  _“advanced-level ESL”_
- Contra Costa College · ESL 135B — Pronunciation B  
  _“advanced-level ESL”_

### `ESOL M1191` — Bridge to College Reading and Writing — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Barstow Community College · ESL 138 — Bridge to College Reading and Writing  
  _“high-advanced ESL”_
- Barstow Community College · ESL 188 — Bridge to College Reading and Writing  
  _“high-advanced ESL”_

### `ESOL M1201` — ESL for Child Development: Domains 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Mission College · ESL 960EC — ESL for Child Development: Domains I  
  _“This high intermediate course”_
- Mission College · NCE 960EC — ESL for Child Development: Domains I  
  _“This high intermediate course”_

### `ESOL M1202` — ESL for Child Development: Domains 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Mission College · ESL 965EC — ESL for Child Development: Domains II  
  _“This high intermediate course”_
- Mission College · NCE 965EC — ESL for Child Development: Domains II  
  _“This high intermediate course”_

### `ESOL M1203` — ESL for Child Development: Factors — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Mission College · ESL 955EC — ESL for Child Development: Factors  
  _“This intermediate course”_
- Mission College · NCE 955EC — ESL for Child Development: Factors  
  _“This intermediate course”_

### `ESOL M1222` — ESL for College and Work — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Coalinga College · ESL 210 — ESL for College and Work  
  _“low-intermediate level ESL”_; _“This low-intermediate level”_
- Coalinga College · NC 210 — ESL for College and Work  
  _“low-intermediate level ESL”_

### `ESOL M1232` — Fundamentals of ESL Oral Communication — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Barstow Community College · ESL 156 — Fundamentals of ESL Oral Communication  
  _“intermediate ESL”_

### `ESOL M1240` — Grammar and Composition — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Bakersfield College · EMLS B70 — Grammar and Composition  
  _“at the high-intermediate level”_
- Bakersfield College · EMLS B70NC — Grammar and Composition  
  _“at the high-intermediate level”_

### `ESOL M1249` — Listening and Speaking Skills Development — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- San Jose City College · English as a Second Language (ESL) 324 — Listening and Speaking Skills Development  
  _“at the intermediate level”_

### `ESOL M1261` — English Fluency and Vocabulary 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Contra Costa College · ESL 146 — English Fluency and Vocabulary II  
  _“at the low-intermediate level”_
- Contra Costa College · ESL 846N — English Fluency and Vocabulary II  
  _“at the low-intermediate level”_

### `ESOL M1266` — English Skills for Success 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Monterey Peninsula College · ENSL 436 — English Skills for Success II  
  _“at the low-intermediate level”_
- Monterey Peninsula College · ENSL 336 — English Skills for Success II  
  _“at the low-intermediate level”_

### `ESOL M1277` — Fundamentals of ESL Grammar — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Barstow Community College · ESL 150 — Fundamentals of ESL Grammar  
  _“intermediate ESL”_

### `ESOL M1278` — Fundamentals of ESL Reading and Writing — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Barstow Community College · ESL 108 — Fundamentals of ESL Reading and Writing  
  _“intermediate ESL”_
- Barstow Community College · ESL 158 — Fundamentals of ESL Reading and Writing  
  _“intermediate ESL”_

### `ESOL M1282` — Introductory Integrated ESL Skills: Reading, Writing, and Grammar — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Solano Community College · ESL 334 — Introductory Integrated ESL Skills: Reading, Writing, and Grammar  
  _“low-intermediate-level ESL”_
- Solano Community College · ESL 534 — Introductory Integrated ESL Skills: Reading, Writing, and Grammar  
  _“low-intermediate-level ESL”_

### `ESOL M1332` — Listening and Speaking 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Glendale Community College · ESL 125 — Listening and Speaking II  
  _“at the low-intermediate level”_

### `ESOL M1334` — Writing 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Contra Costa College · ESL 186 — Writing II  
  _“for intermediate ESL student”_; _“intermediate ESL”_
- Contra Costa College · ESL 886N — Writing II  
  _“for intermediate ESL student”_; _“intermediate ESL”_

### `ESOL M9032` — Fundamentals of English Grammar 2 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Long Beach City College · ESL 810B — Fundamentals of English Grammar 2  
  _“for high-intermediate ESL student”_; _“high-intermediate ESL”_
- Long Beach City College · ESL 610B — Fundamentals of English Grammar 2  
  _“for advanced ESL student”_; _“for advanced ESL student”_

### `ESOL M9045` — Computer Literacy Skills Level 3 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Victor Valley College · ESL 012A — Computer Literacy Skills Level 3  
  _“at the intermediate level”_
- Victor Valley College · ESL 9302 — Computer Literacy Skills Level 3  
  _“at the intermediate level”_

### `ESOL M9053` — Computer Literacy Level 4 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Victor Valley College · ESL 9402 — Computer Literacy Level 4  
  _“intermediate ESL”_

### `ESOL M9074` — Accelerated Academic English for Nonnative Speakers 3 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Woodland Community College · ESOL 570 — Accelerated Academic English for Nonnative Speakers III  
  _“at the advanced level”_
- Woodland Community College · ESOL 70 — Accelerated Academic English for Nonnative Speakers III  
  _“at the advanced level”_

### `ESOL M9080` — ESL for Academic Success: Listening and Speaking 2 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- North Orange Continuing Education · ESLA 1067 — ESL for Academic Success: Listening and Speaking II  
  _“advanced level ESL”_
- North Orange Continuing Education Credit · ESLA 1067 — ESL for Academic Success: Listening and Speaking II  
  _“advanced level ESL”_

### `ESOL M9081` — ESL for Academic Success: Reading and Writing 2 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- North Orange Continuing Education · ESLA 1065 — ESL for Academic Success: Reading and Writing II  
  _“advanced level ESL”_
- North Orange Continuing Education Credit · ESLA 1065 — ESL for Academic Success: Reading and Writing II  
  _“advanced level ESL”_

### `ESOL M9082` — Academic Reading and Writing for ESL — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Palo Verde College · ABE 54 — Academic Reading and Writing for ESL  
  _“at the advanced ESL level”_; _“advanced ESL”_
- Palo Verde College · ESL 40 — Academic Reading and Writing for ESL  
  _“at the advanced ESL level”_; _“advanced ESL”_

### `ESOL M9085` — Read/Write for Academic Sucess — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- North Orange Continuing Education · ESLA 1045 — Read/Write for Academic Sucess  
  _“Advanced level student”_
- North Orange Continuing Education Credit · ESLA 1045 — Read/Write for Academic Sucess  
  _“Advanced level student”_

### `ESOL M9088` — ESL for Film and TV Acting — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- North Orange Continuing Education · ESLA 354 — ESL for Film and TV Acting  
  _“Advanced level student”_
- North Orange Continuing Education Credit · ESLA 354 — ESL for Film and TV Acting  
  _“Advanced level student”_

### `ESOL M9174` — ESL for Childhood Educators 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Compton College · ESL 05A — ESL for Childhood Educators I  
  _“intermediate-level ESL”_

### `ESOL M9175` — ESL for Childhood Educators 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Compton College · ESL 05B — ESL for Childhood Educators II  
  _“intermediate-level ESL”_
- El Camino College · NESL 505B — ESL for Childhood Educators II  
  _“intermediate-level ESL”_

### `ESOL M9188` — ESL College Success Skills: Reading and Writing — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- North Orange Continuing Education · ESLA 1073 — ESL College Success Skills: Reading and Writing  
  _“advanced level ESL”_
- North Orange Continuing Education Credit · ESLA 1073 — ESL College Success Skills: Reading and Writing  
  _“advanced level ESL”_

### `ESOL M9198` — ESL: Conversation — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Lake Tahoe Community College · ESL 572A — ESL: Conversation  
  _“at the intermediate level”_

### `ESOL M9222` — ESL for Healthcare 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Compton College · ESL 04A — ESL for Healthcare I  
  _“for intermediate ESL learner”_; _“intermediate ESL”_
- El Camino College · NESL 504A — ESL for Healthcare I  
  _“for intermediate ESL learner”_; _“intermediate ESL”_

### `ESOL M9223` — ESL for Healthcare 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Compton College · ESL 04B — ESL for Healthcare II  
  _“intermediate ESL”_
- El Camino College · NESL 504B — ESL for Healthcare II  
  _“intermediate ESL”_

### `ESOL M9228` — Integrated ESL Skills Level 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Palo Verde College · ABE 52 — Integrated ESL Skills Level II  
  _“intermediate level English”_
- Palo Verde College · ESL 20 — Integrated ESL Skills Level II  
  _“intermediate level English”_

### `ESOL M9240` — ESL for Medical Terminology — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Compton College · ESL 8 — ESL for Medical Terminology  
  _“high-intermediate ESL”_
- El Camino College · NESL 8 — ESL for Medical Terminology  
  _“high-intermediate ESL”_

### `ESLN M90AA` — ESL NC 3 Part 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Los Angeles Southwest College · ESL NC 106CE — ESL NC 3 Part 1  
  _“low-intermediate level ESL”_

### `ESLN M90AB` — ESL NC 4 Part 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Los Angeles Southwest College · ESL NC 108CE — ESL NC 4 Part 1  
  _“high-intermediate level ESL”_

### `ESLN M90AJ` — ESL NC 3 Part 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Los Angeles Southwest College · ESL NC 107CE — ESL NC 3 Part 2  
  _“low-intermediate level ESL”_

### `ESLN M90AK` — ESL NC 4 Part 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Los Angeles Southwest College · ESL NC 109CE — ESL NC 4 Part 2  
  _“high-intermediate level ESL”_

### `ESLN M90BJ` — ESL Reading and Vocabulary 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Los Angeles Southwest College · ESL NC 025CE — ESL READING AND VOCABULARY II  
  _“for high-intermediate ESL student”_; _“high-intermediate ESL”_

### `ESOL M10AI` — Advanced Academic Reading & Writing 1 — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Orange Coast College · ESL A052 — Advanced Academic Reading & Writing 1  
  _“for high-intermediate student”_; _“intermediate grammar”_

### `ESOL M10AK` — Academic Listening and Speaking 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Santiago Canyon College · ACE 94 — Academic Listening and Speaking 1  
  _“Intermediate level student”_

### `ESOL M10BD` — ESL Reading 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Imperial Valley College · ESL 23 — ESL Reading 1  
  _“intermediate level ESL”_

### `ESOL M10BI` — Verb Review 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Imperial Valley College · ESL 31 — Verb Review 1  
  _“Low Intermediate ESL”_

### `ESOL M10BJ` — Reading and Writing Skills for ECE-123 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Diablo Valley College · ESL 111 — Reading and Writing Skills for ECE-123  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M10BK` — Reading and Writing Skills for ECE-124 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Diablo Valley College · ESL 110 — Reading and Writing Skills for ECE-124  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M10BL` — Reading and Writing Skills for ECE-125 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Diablo Valley College · ESL 112 — Reading and Writing Skills for ECE-125  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M10BM` — Reading and Writing Skills for ECE-130 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Diablo Valley College · ESL 113 — Reading and Writing Skills for ECE-130  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M10CL` — Grammar Level 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Santa Barbara City College · ESL 50 — Grammar Level 2  
  _“intermediate-level student”_

### `ESOL M10CM` — Grammar, Reading, and Writing 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Orange Coast College · ESL A022 — Grammar, Reading, and Writing 2  
  _“for low-intermediate student”_

### `ESOL M10DF` — ESL Reading 3 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Imperial Valley College · ESL 25 — ESL Reading 3  
  _“advanced ESL”_

### `ESOL M10DS` — Listening and Speaking Skills 3A — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Coastline Community College · ESL C049 — Listening and Speaking Skills 3A  
  _“for intermediate student”_; _“course for intermediate”_

### `ESOL M10DU` — Grammar, Reading, and Writing 3B — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Coastline Community College · ESL C039 — Grammar, Reading, and Writing 3B  
  _“for high-intermediate student”_; _“course for high-intermediate”_

### `ESOL M10DW` — Listening and Speaking Skills 3B — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Coastline Community College · ESL C052 — Listening and Speaking Skills 3B  
  _“for high-intermediate student”_; _“course for high-intermediate”_

### `ESOL M10EH` — Listening and Speaking Skills 4 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Coastline Community College · ESL C056 — Listening and Speaking Skills 4  
  _“course for advanced”_

### `ESOL M10EJ` — Writing Skills 4 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Allan Hancock College · ESL 541 — Writing Skills 4  
  _“advanced-level course”_

### `ESOL M10EP` — ESL Core Course Level 5 — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Golden West College · ESL G051 — ESL Core Course Level 5  
  _“high intermediate ESL”_

### `ESOL M10FD` — Verb Review 8 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Imperial Valley College · ESL 38 — Verb Review 8  
  _“Advanced ESL”_

### `ESOL M10FM` — Academic English Grammar and Editing B — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Santa Barbara City College · ESL 136B — Academic English Grammar and Editing B  
  _“advanced ESL”_

### `ESOL M10FP` — Bridge to Academic Success: Grammar for Editing — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Barstow Community College · ESL 130 — Bridge to Academic Success: Grammar for Editing  
  _“high-advanced ESL”_

### `ESOL M10GA` — High Intermediate Academic English — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `word` (high confidence)_
- Pasadena City College · ESL 4 — High Intermediate Academic English  
  _“Advanced ESL”_

### `ESOL M10GC` — Introduction to Academic English — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Grossmont College · ESL 98 — Introduction to Academic English  
  _“at the intermediate level”_

### `ESOL M10GK` — Academic and Professional ESL 4 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Contra Costa College · ESL 152 — Academic and Professional ESL IV  
  _“at the lowadvanced level”_

### `ESOL M10GY` — Rhetoric for Academic Success — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Grossmont College · ESL 105 — Rhetoric for Academic Success  
  _“at the advanced level”_

### `ESOL M10HH` — Accent Modification — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Mission College · ESL 970AM — Accent Modification  
  _“Advanced ESL”_

### `ESOL M10HJ` — Edit Adv Grammar/Syntax — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Cerritos College · ESL 35 — EDIT ADV GRAMMAR/SYNTAX  
  _“advanced ESL”_

### `ESOL M10HN` — Low Adv ESL: Words 3 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- College of Marin · ESL 76 — Low Adv ESL:  Words III  
  _“Low Advanced ESL”_

### `ESOL M10JS` — Advanced ESL Reading — folded **Advanced**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Cypress College · ESL 066 C — Advanced ESL Reading  
  _“high-intermediate ESL”_

### `ESOL M10KW` — Sounds and Rhythms of American English — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Grossmont College · ESL 098P — Sounds and Rhythms of American English  
  _“intermediate-level course”_

### `ESOL M10MY` — ESL for Child Development: Introduction — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Mission College · ESL 950EC — ESL for Child Development: Introduction  
  _“This intermediate course”_

### `ESOL M10OA` — ESL Introduction to College Reading and Writing — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- City College of San Francisco · ESL 186 — ESL Introduction to College Reading and Writing  
  _“at the low-advanced level”_

### `ESOL M10OO` — Intermediate College Reading & Writing — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `word` (high confidence)_
- College of the Canyons · ESL 90 — Intermediate College Reading & Writing  
  _“at the low advanced level”_

### `ESOL M10PC` — Essential Grammar for Written and Spoken Communication — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Grossmont College · ESL 098G — Essential Grammar for Written and Spoken Communication  
  _“at the intermediate level”_

### `ESOL M10QS` — Developing Language Skills for ESL Students — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Foothill College · ESLL 228 — DEVELOPING LANGUAGE SKILLS FOR ESL STUDENTS  
  _“course for intermediate”_

### `ESOL M10RT` — English as a Second Language Support — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Palomar College · ESL 95 — ENGLISH AS A SECOND LANGUAGE SUPPORT  
  _“advanced ESL”_

### `ESOL M10TM` — Public Speaking for Esl — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Victor Valley College · ESL 45 — Public Speaking for Esl  
  _“at the advanced level”_

### `ESOL M10TZ` — Reading and Writing Fundamentals — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Oxnard College · ESL R076 — Reading and Writing Fundamentals  
  _“low-advanced ESL”_

### `ESOL M10VS` — Integrated Listening/Speaking 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Gavilan College · ESL 538 — Integrated Listening/Speaking II  
  _“low intermediate ESL”_

### `ESOL M10VT` — Integrated Reading/Writing 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Gavilan College · ESL 537 — Integrated Reading/Writing II  
  _“low-intermediate ESL”_

### `ESOL M10WK` — Reading and Writing Intermediate Level — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `word` (high confidence)_
- Coalinga College · ESL 135 — Reading and Writing Intermediate Level  
  _“advanced ESL”_

### `ESOL M10WP` — Low-Intermediate Reading & Writing Skills — folded **Intermediate**, description says **Beginning** (`ESOL M9168`)
_fold signal: `word` (high confidence)_
- Citrus College · ESL 003A — Low-Intermediate Reading & Writing Skills  
  _“course for high beginning”_

### `ESOL M10WZ` — Writing for Multilingual Students 4 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- College of San Mateo · ESL 828 — Writing for Multilingual Students IV  
  _“This low-advanced course”_

### `ESOL M90AK` — Advanced Beginning ESL 1 — folded **Intermediate**, description says **Beginning** (`ESOL M9168`)
_fold signal: `combo` (medium confidence)_
- Imperial Valley College · ESL 890 — Advanced Beginning ESL 1  
  _“at the high-beginning level”_

### `ESOL M90BP` — ESL for Careers in Early Childhood Education 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- West Valley College · NCEL 120 — ESL for Careers In Early Childhood Education 1  
  _“intermediate level ESL”_

### `ESOL M90BQ` — ESL for Careers in Healthcare 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- West Valley College · NCEL 130 — ESL for Careers in Healthcare 1  
  _“for intermediate ESL learner”_; _“intermediate ESL”_

### `ESOL M90CE` — Fundamentals of English Grammar 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Long Beach City College · ESL 610A — Fundamentals of English Grammar 1  
  _“intermediate ESL”_

### `ESOL M90CT` — ESLN - Pronunciation & Vocabulary 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- College of the Desert · ESLN 390A — ESLN - Pronunciation & Vocabulary 1  
  _“low-intermediate level student”_

### `ESOL M90DC` — Reading and Writing Skills for ECE-123 - Noncredit — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Diablo Valley College · ESL 111NC — Reading and Writing Skills for ECE-123 - Noncredit  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M90DD` — Reading and Writing Skills for ECE-124 - Noncredit — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Diablo Valley College · ESL 110NC — Reading and Writing Skills for ECE-124 - Noncredit  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M90DE` — Reading and Writing Skills for ECE-125 - Noncredit — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Diablo Valley College · ESL 112NC — Reading and Writing Skills for ECE-125 - Noncredit  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M90DF` — Reading and Writing Skills for ECE-130 - Noncredit — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Diablo Valley College · ESL 113NC — Reading and Writing Skills for ECE-130 - Noncredit  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M90DQ` — Advanced Beginning ESL 2 — folded **Intermediate**, description says **Beginning** (`ESOL M9168`)
_fold signal: `combo` (medium confidence)_
- Imperial Valley College · ESL 891 — Advanced Beginning ESL 2  
  _“at the high-beginning level”_

### `ESOL M90FW` — Reading and Writing Skills - Noncredit Level 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Oxnard College · ESL R801B — Reading and Writing Skills - Noncredit Level 2  
  _“This is a low-intermediate level”_

### `ESOL M90FX` — Reading and Vocabulary- Level 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Compton College · ESL 22B — Reading and Vocabulary- Level 2  
  _“intermediate level course”_

### `ESOL M90GA` — Integrated English Skills 2A — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Coastline Community College · ELL C040N — Integrated English Skills 2A  
  _“course for low-intermediate”_

### `ESOL M90GI` — Speaking and Listening 2B — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Coastline Community College · ESL C043N — Speaking and Listening 2B  
  _“intermediate-level English”_; _“course for intermediate”_

### `ESOL M90HR` — Listening/Speaking Skills 3A — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Coastline Community College · ESL C049N — Listening/Speaking Skills 3A  
  _“for intermediate student”_; _“course for intermediate”_

### `ESOL M90ID` — ESL Grammar 4 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Antelope Valley College · ESL 943 — ESL Grammar 4  
  _“advanced level ESL”_

### `ESOL M90IJ` — Reading and Writing Skills - Noncredit Level 4 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Oxnard College · ESL R803B — Reading and Writing Skills - Noncredit Level 4  
  _“low-advanced ESL”_

### `ESOL M90JX` — Academic Skills for College Success for ESL Students — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Santa Barbara City College · ESLN NC028 — Academic Skills for College Success for ESL Students  
  _“advanced level student”_

### `ESOL M90JZ` — ESL Grammar for Academic Writing and Editing — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Barstow Community College · ESL 180 — ESL Grammar for Academic Writing and Editing  
  _“high-advanced ESL”_

### `ESOL M90KS` — Academic Reading and Writing 1 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Ventura College · ENGM N101R — Academic Reading and Writing I (Noncredit)  
  _“intermediate ESL”_

### `ESOL M90KU` — Academic Reading and Writing 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Ventura College · ENGM N102R — Academic Reading and Writing II (Noncredit)  
  _“high-intermediate ESL”_

### `ESOL M90KW` — Academic Reading and Writing 3 — folded **Intermediate**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- Ventura College · ENGM N103R — Academic Reading and Writing III (Noncredit)  
  _“advanced ESL”_

### `ESOL M90LN` — Administrative Medical Assisting & ESL Success and Support Course — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Glendale Community College · ESL 70 — Administrative Medical Assisting & ESL Success and Support Course  
  _“high-intermediate ESL”_

### `ESOL M90OT` — ESL for Child Care: Ages and Stages — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Mission College · NCE 940EC — ESL for Child Care: Ages and Stages  
  _“low-intermediate level course”_; _“This low-intermediate level”_

### `ESOL M90OU` — ESL Language Learning with AI — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- City College of San Francisco · ESLN 6604 — ESL Language Learning with AI  
  _“intermediate-level English”_

### `ESOL M90OV` — ESL for I-BEST: English for Personal Care Aides — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- North Orange Continuing Education · ESLA 1304 — ESL for I-BEST: English for Personal Care Aides  
  _“advanced ESL”_

### `ESOL M90PK` — Introduction to American Public Education for ESL Students — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Moreno Valley College · ESL 804 — Introduction to American Public Education for ESL Students  
  _“advanced ESL”_

### `ESOL M90PN` — ESL and American Humor and Slang — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- North Orange Continuing Education · ESLA 1101 — ESL and American Humor and Slang  
  _“advanced ESL”_

### `ESOL M90PP` — ESL and American Literature — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- North Orange Continuing Education · ESLA 1103 — ESL and American Literature  
  _“advanced level English”_; _“this advanced level”_

### `ESOL M90PQ` — ESL for Anatomy and Physiology 1 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- El Camino College · ESL 09A — ESL for Anatomy and Physiology I  
  _“advanced ESL”_

### `ESOL M90PR` — ESL for Anatomy and Physiology 2 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- El Camino College · ESL 09B — ESL for Anatomy and Physiology II  
  _“advanced ESL”_

### `ESOL M90QB` — ESL for I-BEST: English for Office Assistants — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- North Orange Continuing Education · ESLA 1302 — ESL for I-BEST: English for Office Assistants  
  _“advanced ESL”_

### `ESOL M90QR` — Summer Bridge B — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- College of Marin · ESLN SBB — Summer Bridge B  
  _“for low intermediate ESL student”_; _“low intermediate ESL”_

### `ESOL M90RL` — ESL - Grammar and Vocabulary Review B — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Mt. San Antonio College · ESL GVRB — ESL - Grammar and Vocabulary Review B  
  _“intermediate level ESL”_

### `ESOL M90RQ` — ESL Job Search B — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- City College of San Francisco · ESLN 6606 — ESL Job Search B  
  _“intermediate-level English”_

### `ESOL M90RU` — ESL - Speaking B — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Mt. San Antonio College · ESL SPKB — ESL - Speaking B  
  _“Intermediate level English”_

### `ESOL M90UK` — Beginning ESL for Customer Service - Noncredit — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Diablo Valley College · ESL 032NC — Beginning ESL for Customer Service - Noncredit  
  _“low-intermediate ESL”_

### `ESOL M90WY` — ESL for I-BEST: English for Starting a Business — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- North Orange Continuing Education · ESLA 1306 — ESL for I-BEST: English for Starting a Business  
  _“advanced ESL”_

### `ESOL M90XC` — Bridge to College ESL Listening & Speaking — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Foothill College · NCEL 403A — BRIDGE TO COLLEGE ESL LISTENING & SPEAKING  
  _“at the advanced ESL level”_; _“advanced ESL”_

### `ESOL M90XP` — Introduction to English C — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Allan Hancock College · NESL 7005 — Introduction to English C  
  _“This is a low-intermediate course”_; _“low-intermediate listening”_

### `ESOL M90XQ` — ESL - Grammar and Vocabulary Review C — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Mt. San Antonio College · ESL GVRC — ESL - Grammar and Vocabulary Review C  
  _“advanced level ESL”_

### `ESOL M90XT` — ESL - Speaking C — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Mt. San Antonio College · ESL SPKC — ESL - Speaking C  
  _“Advanced level English”_

### `ESOL M90XV` — Intro to English C2 (Low Int) — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Allan Hancock College · NESL 7006 — Intro to English C2 (Low Int)  
  _“This is a low-intermediate course”_; _“low-intermediate listening”_

### `ESOL M90YE` — Listening and Speaking for Health Care Workers — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Pasadena City College · ESLV 4003 — Listening and Speaking for Health Care Workers  
  _“for advanced ESL student”_; _“advanced ESL”_

### `ESOL M90YU` — U.S. Cultural Traditions and Social Change — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Pasadena City College · ESLN 1125 — U.S. Cultural Traditions and Social Change  
  _“advanced ESL”_

### `ESOL M90YV` — English for Child Development: Introduction — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Mission College · NCE 950EC — English for Child Development: Introduction  
  _“This intermediate course”_

### `ESOL M91AB` — ESL College Success Skills: Listening and Speaking — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- North Orange Continuing Education Credit · ESLA 1071 — ESL College Success Skills: Listening and Speaking  
  _“advanced level ESL”_

### `ESOL M91AE` — Pathway to College Success for ESL Students — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Santa Barbara City College · ESLN NC027 — Pathway to College Success for ESL Students  
  _“advanced level student”_

### `ESOL M91AF` — ESL: College Readiness - Reading and Writing — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Citrus College · NC 330 — ESL: College Readiness - Reading and Writing  
  _“at the high intermediate level”_

### `ESOL M91BN` — Social Communication — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- City College of San Francisco · ESLV 3819 — Social Communication  
  _“intermediate ESL”_

### `ESOL M91CQ` — ESL: Introduction to Computers — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Lake Tahoe Community College · ESL 582A — ESL: Introduction to Computers  
  _“intermediate level ESL”_

### `ESOL M91DT` — Conversation and Pronunciation — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Chaffey College · ESL 607 — Conversation and Pronunciation  
  _“intermediate ESL”_

### `ESOL M91DV` — Grammar and Writing 3 Mirrored Course — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Glendale Community College · ESL 33 — Grammar and Writing III Mirrored Course  
  _“at the intermediate level”_

### `ESOL M91DW` — Grammar and Writing 4 Mirrored Course — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Glendale Community College · ESL 41 — Grammar and Writing IV Mirrored Course  
  _“at the high intermediate level”_

### `ESOL M91EO` — Introduction to English D — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Allan Hancock College · NESL 7007 — Introduction to English D  
  _“This is a high-intermediate course”_; _“high-intermediate listening”_

### `ESOL M91EP` — Intro to English D2 (Hi Int) — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Allan Hancock College · NESL 7008 — Intro to English D2 (Hi Int)  
  _“This is a high-intermediate course”_; _“high-intermediate listening”_

### `ESOL M91FA` — Introduction to Education Practices and Related Service Providers in Special Education — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Moreno Valley College · ESL 805 — Introduction to Education Practices and Related Service Providers in Special Education  
  _“advanced ESL”_

### `ESOL M91GA` — English for Food Service — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- Mission College · NCE 940FD — English for Food Service  
  _“low-intermediate level ESL”_

### `ESOL M91GX` — English for Reading and Writing 2 — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `numeric` (medium confidence)_
- College of the Redwoods · ESL 221 — English for Reading and Writing II  
  _“advanced ESL”_

### `ESOL M91IC` — English for Reading and Writing — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- College of the Redwoods · ESL 220 — English for Reading and Writing  
  _“high-intermediate ESL”_; _“course for low-intermediate”_

### `ESOL M91II` — Expanding Foundations in ESL — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `word` (high confidence)_
- Barstow Community College · ESL 192 — Expanding Foundations in ESL  
  _“intermediate ESL”_

### `ESOL M91KW` — ESL Job Search A — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- City College of San Francisco · ESLN 6605 — ESL Job Search A  
  _“intermediate-level English”_

### `ESOL M91LH` — ESL Through Reading Literature — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- Santa Barbara City College · ESLN NC022 — ESL Through Reading Literature  
  _“advanced level student”_

### `ESOL M91LK` — ESL for Memoir Writing — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- North Orange Continuing Education · ESLA 272 — ESL for Memoir Writing  
  _“advanced level English”_; _“this advanced level”_

### `ESOL M91LN` — ESL and Newsletter Writing — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- North Orange Continuing Education · ESLA 270 — ESL and Newsletter Writing  
  _“advanced level English”_; _“this advanced level”_

### `ESOL M91LR` — ESL for Radiologic Technology — folded **Beginning**, description says **Advanced** (`ESOL M1141`)
_fold signal: `default-beginning` (medium confidence)_
- El Camino College · ESL 10 — ESL for Radiologic Technology  
  _“advanced ESL”_

### `ESOL M91LV` — ESL Speaking in Social and Work Settings — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `default-beginning` (medium confidence)_
- City College of San Francisco · ESLN 6507 — ESL Speaking in Social and Work Settings  
  _“intermediate-level English”_

### `ESOL M91MY` — NC Integrated Listening/Speaking 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Gavilan College · ESL 738 — NC Integrated Listening/Speaking II  
  _“intermediate ESL”_

### `ESOL M91MZ` — NC Integrated Reading/Writing 2 — folded **Beginning**, description says **Intermediate** (`ESOL M9256`)
_fold signal: `numeric` (medium confidence)_
- Gavilan College · ESL 737 — NC Integrated Reading/Writing II  
  _“low-intermediate ESL”_

### `ESLN M9003` — Writing Summaries and Paragraphs: Academic Bridge — folded **Beginning**, members disagree; **needs a human**
_fold signal: `default-beginning` (medium confidence)_
- East Los Angeles College · ESL NC 054CE — Writing Summaries and Paragraphs: Academic Bridge  
  _“at the low intermediate level”_
- Los Angeles Southwest College · ESL NC 054CE — WRITING SUMMARIES AND PARAGRAPHS: ACADEMIC BRIDGE  
  _“advanced ESL”_

### `ESLN M9004` — Reading and Vocabulary: Academic Bridge — folded **Beginning**, members disagree; **needs a human**
_fold signal: `default-beginning` (medium confidence)_
- East Los Angeles College · ESL NC 055CE — Reading and Vocabulary: Academic Bridge  
  _“at the low intermediate level”_
- Los Angeles Southwest College · ESL NC 055CE — READING AND VOCABULARY: ACADEMIC BRIDGE  
  _“advanced ESL”_

### `ESOL M1308` — Grammar and Writing 4 — folded **Intermediate**, members disagree; **needs a human**
_fold signal: `numeric` (medium confidence)_
- CaÃ±ada College · ESL 924 — Grammar and Writing IV  
  _“at the advanced level”_
- Los Angeles Southwest College · ESL NC 052CE — GRAMMAR AND WRITING IV  
  _“at the high-intermediate level”_

### `ESOL M9117` — Speaking and Listening Skills-High Intermediate to Advanced — folded **Advanced**, members disagree; **needs a human**
_fold signal: `combo` (high confidence)_
- Coastline Community College · ESL C083N — Speaking and Listening Skills-High Intermediate to Advanced  
  _“advanced-level ESL”_; _“course for high-intermediate”_
- Coastline Community College · ELL C083N — Speaking and Listening Skills-High Intermediate to Advanced  
  _“advanced-level English”_; _“course for high-intermediate”_

### `ESOL M10MH` — Bridge to College Success - Grammar, Reading, and Writing — folded **Beginning**, members disagree; **needs a human**
_fold signal: `default-beginning` (medium confidence)_
- Victor Valley College · ESL 49B — Bridge to College Success - Grammar, Reading, and Writing  
  _“at the advanced level”_; _“high intermediate ESL”_

### `ESOL M91GO` — English for Listening, Speaking, and Pronunciation 1 — folded **Beginning**, members disagree; **needs a human**
_fold signal: `numeric` (medium confidence)_
- College of the Redwoods · ESL 230 — English for Listening, Speaking, and Pronunciation I  
  _“intermediate ESL”_; _“course for beginning”_

### `ESOL M91GU` — English for Listening, Speaking, and Pronunciation 2 — folded **Beginning**, members disagree; **needs a human**
_fold signal: `numeric` (medium confidence)_
- College of the Redwoods · ESL 231 — English for Listening, Speaking, and Pronunciation II  
  _“advanced ESL”_; _“course for intermediate”_

### `ESOL M91IB` — Popular English — folded **Beginning**, members disagree; **needs a human**
_fold signal: `default-beginning` (medium confidence)_
- College of the Redwoods · ESL 225 — Popular English  
  _“advanced ESL”_; _“course for intermediate”_
