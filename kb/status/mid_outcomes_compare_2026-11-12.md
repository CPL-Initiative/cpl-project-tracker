# MID re-clustering, Step 1: outcomes and objectives against the M-IDs (2026-11-12)

Issue #2962, COBIx's operational brief of 2026-11-12, Sam's go relayed by COBIx ("yes, let's roll!", cpl_memory sam-mid-reclustering-step-1-go-2026-11-12). A no-write comparison: nothing here changes an M-ID, a table or a generated file. Built by `kb/_mid_outcomes_compare.py`; every M-ID's result is in the JSON beside this file.

Source of the outcomes text: the committed reads under `kb/course_outcomes/` (13 hosts, 17349 rows). Membership: `unified_courses_members.js` (generated 2026-11-12 11:51), descriptions `unified_courses_member_desc.js`, titles `unified_courses_index.js`, exhibit reach `kb/exhibits_review.json`.

## Inventory

Course outcomes live in one table, `course_outcomes` on Supabase, and every row in it is loaded from a read committed under `kb/course_outcomes/<host>/` (the load receipts in `kb/receipts/course_outcomes_*.json` add up to the same rows, an older Orange Coast read aside). No program learning outcomes (PLOs) have been harvested: the table holds two kinds, `slo` and `objective`. Descriptions come from COCI through `unified_courses_member_desc.js` for every M-ID member.

| Source | Rows | Courses | Colleges |
|---|---|---|---|
| SLOs | 14366 | 14321 | 18 |
| Course objectives | 2983 | 2983 | 4 |
| PLOs | 0 | 0 | 0 |
| Descriptions (COCI) | one per member | 66619 members in the M-IDs read here | statewide |

Of 14326 courses with outcomes text, 13557 match a member of an M-ID (college and code). 6976 M-IDs hold at least one member with text; 1857 hold two or more (the scope of this pass), and 1249 of those are same-college suites, two or more members from one college. That is 3.7% of the 49561 M-IDs.

## Method

Each course's outcome and objective statements become word stems, with the lead-ins and generic verbs removed and each stem weighted by how rare it is across all harvested courses; two courses agree when the cosine of their weighted stems reaches 0.30. Inside an M-ID the agreeing courses form groups, and more than one group is a proposed split only when the descriptions or the titles also disagree.

Thresholds: agree at 0.30; strong confirmation at a mean of 0.50 with a second signal; merge candidate at 0.55 across two M-IDs of one Common SUBJ; descriptions agree at 0.30; titles agree at a stem overlap of 0.50. A course with fewer than 12 stems after stripping is thin and treated as having no text; 771 statements printed word for word by 4 or more courses were dropped as outline boilerplate.

Where the data is strong, the method agrees with the M-IDs: 5574 pairs of same-titled courses at two colleges inside one M-ID score a median of 0.267, and 42% of them reach the agree line. 367 sampled pairs of differently titled courses in different M-IDs of one Common SUBJ score a median of 0.043, and 2% of them reach it (95th percentile 0.233).

Confidence uses Sam's three match levels (Open Asks Sheet 181, 2026-11-11): strong, partial and limited. A split the outcomes alone propose is limited, a flag for a person, since an SLO never overrides on its own. A member with no text joins no group and is never the reason for a split. TOP and units are shown and read by nothing.

Blind spots. Word overlap misses a paraphrase: two colleges can teach the same course in different words and read as a weak pair, which is why a split needs a second signal. Shared vocabulary can join different levels of one subject (Spanish 1 and Spanish 2 use the same words), so a confirmation does not prove a level is right. District outlines printed once for several colleges (RCCD, SDCCD's shared text) agree by construction; those pairs are marked and do not make a confirmation strong. Thin outlines (one or two statements) are set aside, not judged. Objectives exist for four colleges only, so most courses are read on SLOs alone.

## Counts by class and confidence (the 1857 M-IDs in scope)

| Class | Strong | Partial | Limited | All |
|---|---|---|---|---|
| Confirmed | 221 | 193 | 143 | 557 |
| Split | 19 | 292 | 449 | 760 |
| Merge candidate | 63 | 158 | 0 | 221 |
| Not enough text | 0 | 0 | 0 | 319 |

A Merge candidate here is an M-ID whose outcomes otherwise confirm it and whose courses also agree, at partial or strong, with a course in another M-ID of the same Common SUBJ. A Not enough text M-ID in scope holds two members with outcomes text, one or both too thin to judge.

Outliers. 2652 single-member M-IDs carry outcomes text; the outcomes place 322 of them beside a course in another M-ID of the same Common SUBJ at partial or strong, and leave 2330 alone.

## AGAB M1002, Agricultural Ambassadors

AGAB M1002 resolves to itself through `kb/alias_chain.py` (no map applied since 2026-11-08). Its 3 members are all Merced College: AGAB 31A Agricultural Ambassadors - Introduction, Merced College; AGAB 31C Agricultural Ambassadors - Public Relations, Merced College; AGAB 31B Agricultural Ambassadors - Recruitment, Merced College. Units 2, TOP 0112.00.

Class: Not enough text. fewer than two members print enough outcome text (0 of 3); a missing SLO counts against no one.

Merced's course outlines have not been harvested, so no outcome or objective is on file for any of the three. Read on descriptions alone, at limited confidence (the lower rung COBIx's brief allows), the description cosines are AGAB 31A and AGAB 31C 0.91; AGAB 31A and AGAB 31B 0.93; AGAB 31C and AGAB 31B 0.92 against the 0.30 agree line. The titles share the stem *Agricultural Ambassadors* and each names a different specialization. What the harvest needs: Merced's outline platform read for these three courses (one college, three outlines), the SLOs and objectives filed under `kb/course_outcomes/merced/`, then this script rerun.

> AGAB 31A (Merced College): "The purpose of this course is to introduce students to the Agricultural Ambassador program. Ambassadors promote agricultural awareness and educational opportunities in agriculture at Merced College and beyond. Students will learn the role of Ambassadors, develop their communication  and leadership s"

> AGAB 31C (Merced College): "The purpose of this course is to focus on the public relations role of the Agricultural Ambassadors as they promote agricultural awareness and educational opportunities in agriculture at Merced College and beyond. Students will learn the fundamentals of public relations, communication and leadership"

> AGAB 31B (Merced College): "The purpose of this course is to focus the recruitment role of the Agricultural Ambassadors as they promote agricultural awareness and _x000D_
educational opportunities in agriculture at Merced College and beyond. Students will learn the fundamentals of effective presentations, conduct  tours, plan "

## Six disagreements for Sam to rule on

### 1. MATH 130, Finite Mathematics: proposed split (strong)

69 members, 58 colleges, units 3 to 5. outcomes, descriptions and titles all say the groups teach different things, and one college files courses in more than one group.

Group A, proposed title *Finite Mathematics* (Cabrillo College, Columbia College, Modesto Junior College, Shasta College):
- Cabrillo College (MATH 13 Finite Mathematics): "Demonstrate competency in performing matrix calculations and utilize matrices for applied problem solving."
- Cabrillo College (MATH 13 Finite Mathematics): "Analyze a financial problems and evaluate using formulas."
- Columbia College (MATH 12 Finite Mathematics): "calculate precisely and interpret results accurately, solving mathematical finance problems"
- Columbia College (MATH 12 Finite Mathematics): "communicate effectively, using appropriate terminology to discuss applications of linear programming and finance problems."
- Modesto Junior College (MATH 130 Finite Mathematics): "Effectively communicate, using appropriate mathematical notation, processes and strategies in solving level appropriate problems including set theory, probability and counting techniques, matrices and linear systems, and applications."
- Modesto Junior College (MATH 130 Finite Mathematics): "Analyze and solve level appropriate problems including set theory, probability and counting techniques, matrices and linear systems, and applications."

Group B, proposed title *Quantitative Analysis* (Cabrillo College):
- Cabrillo College (CHEM 5 Quantitative Analysis): "Define the analytical problem, select a suitable method or technique, obtain a representative sample, prepare the sample for analysis, perform any necessary chemical separations, perform the measurement, calculate the results and submit reports."
- Cabrillo College (CHEM 5 Quantitative Analysis): "Solve analytical chemical problems, including stoichiometric calculations, gravimetric, volumetric, instrumental, separations and kinetic analysis."

No text, left where they are: MATH 124 Finite Math, Antelope Valley College; MATH B23 Finite Mathematics, Bakersfield College; MATH 12 Mathematics for Business Decisions (Finite Mathematics), Butte College; MATH 125 Elementary Finite Mathematics, Cañada College; MATH 115 Finite Mathematics, Cerritos College; MATH C130 Finite Mathematics, Cerro Coso Community College.

Student test: someone who completed *Finite Mathematics* would not be repeating *Quantitative Analysis*; their outcomes score at most 0.171 against each other, below the 0.30 agree line, and their descriptions score at most 0.04.

Exhibit reach: no Exhibit Reference title takes its canonical title from this M-ID.

### 2. BSOT M1209, Introduction to Electronic Health Records: proposed split (strong)

34 members, 32 colleges, units 0 to 3. outcomes, descriptions and titles all say the groups teach different things, and one college files courses in more than one group.

Group A, proposed title *Records Management* (Riverside City College, Shasta College):
- Riverside City College (CAT 62 Records Management): "Apply records information management filing, storage, and retrieval methods to physical records."
- Riverside City College (CAT 62 Records Management): "Apply records information management filing, storage, and retrieval methods to electronic records."
- Shasta College (BSOT 166 Records Management): "Explain the criteria by which records are created, stored, retrieved, retained, and disposed of."
- Shasta College (BSOT 166 Records Management): "Identify the procedures for the operation and control of manual and automated filing."

Group B, proposed title *Electronic Medical Records* (Shasta College):
- Shasta College (BSOT 150 Electronic Medical Records): "Apply the principles of health insurance as they relate to health and accident insurance contracts."
- Shasta College (BSOT 150 Electronic Medical Records): "Effectively use insurance and patient billing software."

No text, left where they are: CBOT 302 Records Management, Allan Hancock College; BCIS 51 Records Management, Butte College; BT 6 Records Management, Fresno City College; BUS 18 Records Management, Lassen College; CAT 62 Records Management, Moreno Valley College; CBTE 205 Records Management, San Diego City College.

Student test: someone who completed *Records Management* would not be repeating *Electronic Medical Records*; their outcomes score at most 0.099 against each other, below the 0.30 agree line, and their descriptions score at most 0.13.

Exhibit reach: no Exhibit Reference title takes its canonical title from this M-ID.

### 3. ITIS 140, Introduction to Systems Analysis and Design: proposed split (strong)

31 members, 30 colleges, units 1 to 4. outcomes, descriptions and titles all say the groups teach different things, and one college files courses in more than one group.

Group A, proposed title *Fundamentals of Systems Analysis* (Norco College, Riverside City College):
- Norco College (CIS 2 Fundamentals of Systems Analysis): "Identify business needs that can be addressed using information technology-based solutions. Model and implement information technology-based solutions through formal project management methods."
- Norco College (CIS 2 Fundamentals of Systems Analysis): "Demonstrate effective communication with clear and concise documentation for technical specifications, and various organizational stakeholders."
- Riverside City College (CIS 2 Fundamentals of Systems Analysis): "Identify business needs that can be addressed using information technology-based solutions. Model and implement information technology-based solutions through formal project management methods."
- Riverside City College (CIS 2 Fundamentals of Systems Analysis): "Demonstrate effective communication with clear and concise documentation for technical specifications, and various organizational stakeholders."

Group B, proposed title *Systems Analysis and Design* (Riverside City College):
- Riverside City College (CSC 20 Systems Analysis and Design): "Demonstrate an understanding of System Architecture, Implementation, Operations, Support and Security."
- Riverside City College (CSC 20 Systems Analysis and Design): "Create cost benefit analysis using various tools available to compare alternative Developmental methodologies."

No text, left where they are: COMP B22 Introduction to Systems Analysis and Design, Bakersfield College; IT C259 Introduction to Systems Analysis and Design, Cerro Coso Community College; CIM 40 Introduction to Systems Analysis and Design, Irvine Valley College; CIS 62 Introduction to Systems Analysis and Design, Laney College; CTIS 8 Introduction to Smart Systems Analysis and Design, Merced College; CIS 62 Introduction to Systems Analysis and Design, Merritt College.

Student test: someone who completed *Fundamentals of Systems Analysis* would not be repeating *Systems Analysis and Design*; their outcomes score at most 0.186 against each other, below the 0.30 agree line, and their descriptions score at most 0.09.

Exhibit reach: no Exhibit Reference title takes its canonical title from this M-ID.

### 4. PH 101, Introduction to Public Health: proposed split (strong)

32 members, 29 colleges, units 3. outcomes, descriptions and titles all say the groups teach different things, and one college files courses in more than one group.

Group A, proposed title *Introduction to Public Health* (Cabrillo College, Columbia College, Cuesta College, Modesto Junior College, Orange Coast College, Riverside City College):
- Cabrillo College (HS 50 Introduction to Public Health): "Synthesize current research data and course content to make recommendations to address public health issues and health inequities."
- Cabrillo College (HS 50 Introduction to Public Health): "Analyze behavioral, social, and cultural factors that impact individual and population health and health disparities over the life course."
- Columbia College (HLTH 1 Introduction to Public Health): "Integrate into the community served by effectively evaluating and applying the determinants of health and illness of a culture and population within the public health realm using appropriate public health research methods and theory."
- Columbia College (HLTH 1 Introduction to Public Health): "Demonstrate knowledge of the roles of people, professions and agencies who undertake work in promoting public health and explain how these roles contribute to population health outcomes through evidence-based practice and preventative care."
- Cuesta College (PHS 210 Introduction To Public Health Science): "Define important foundational concepts in community/public health."
- Cuesta College (PHS 210 Introduction To Public Health Science): "Identify different public health disciplines, professions and organizations, and explain how each contributes to the field of public health."

Group B, proposed title *Geography of Health* (Modesto Junior College):
- Modesto Junior College (GEOG 106 Geography of Health): "Identify and describe the global distribution of an infectious disease."
- Modesto Junior College (GEOG 106 Geography of Health): "Propose solutions to a community health issue."

No text, left where they are: ALH 3 Introduction to Public Health, Butte College; HED 102 Introduction to Public Health, Cerritos College; HO 102 Introduction to Public Health, Cerritos College; BIOS 18 Introduction to Public Health, Chabot College; HLTH 18 Introduction to Public Health, Chabot College; HS 40 Introduction to Public Health, Coalinga College.

Student test: someone who completed *Introduction to Public Health* would not be repeating *Geography of Health*; their outcomes score at most 0.221 against each other, below the 0.30 agree line, and their descriptions score at most 0.28.

Exhibit reach: no Exhibit Reference title takes its canonical title from this M-ID.

### 5. BIOL M1094 and BIOL M1095: proposed merge (strong)

BIOL M1094, *General Biology* (28 members) and BIOL M1095, *General Biology Honors* (9 members), one Common SUBJ. The closest pair: BIO 1 General Biology, Moreno Valley College and BIO 1H Honors General Biology, Norco College, outcomes 1.00, descriptions 0.30, titles 0.67; 9 course pairs reach the merge line.

- Moreno Valley College (BIO 1 General Biology): "Demonstrate scientific literacy by distinguishing between evidence-based scientific data vs. non-evidence based information/inferences."
- Moreno Valley College (BIO 1 General Biology): "Describe the evolution of biological diversity from the cellular to the biome level."
- Moreno Valley College (BIO 1 General Biology): "Explain biological strategies for obtaining and utilizing energy."
- Norco College (BIO 1H Honors General Biology): "Demonstrate scientific literacy by distinguishing between evidence-based scientific data vs. non-evidence based information/inferences."
- Norco College (BIO 1H Honors General Biology): "Describe the evolution of biological diversity from the cellular to the biome level."
- Norco College (BIO 1H Honors General Biology): "Explain biological strategies for obtaining and utilizing energy."

Student test: someone who completed BIO 1 General Biology, Moreno Valley College would be repeating much of BIO 1H Honors General Biology, Norco College; the two outlines name the same outcomes in close to the same words.

Exhibit reach: BIOL M1094 no Exhibit Reference title takes its canonical title from this M-ID; BIOL M1095 no Exhibit Reference title takes its canonical title from this M-ID.

### 6. AGAS M1136 and AGAS M1140: proposed merge (strong)

AGAS M1136, *Small Ruminant Health and Management* (5 members) and AGAS M1140, *Small Ruminant Science* (3 members), one Common SUBJ. The closest pair: AGAS 316 Small Ruminant Production, Shasta College and AGAS 211 Small Ruminant Science, Cuesta College, outcomes 0.93, descriptions 0.86, titles 0.50; 2 course pairs reach the merge line.

- Shasta College (AGAS 316 Small Ruminant Production): "Provide an overview of the sheep and goat industries, including historical and economic perspectives."
- Shasta College (AGAS 316 Small Ruminant Production): "Describe the factors influencing the development of the sheep and goat industries."
- Shasta College (AGAS 316 Small Ruminant Production): "Identify common breeds of sheep and goats, and list their respective economically important strengths."
- Cuesta College (AGAS 211 Small Ruminant Science): "Provide an overview of the sheep and goat industries, including historical and economic perspectives."
- Cuesta College (AGAS 211 Small Ruminant Science): "Describe the factors influencing the development of the sheep and goat industries."
- Cuesta College (AGAS 211 Small Ruminant Science): "Identify common breeds of sheep and goats and list their respective economically important strengths."

Student test: someone who completed AGAS 316 Small Ruminant Production, Shasta College would be repeating much of AGAS 211 Small Ruminant Science, Cuesta College; the two outlines name the same outcomes in close to the same words.

Exhibit reach: AGAS M1136 no Exhibit Reference title takes its canonical title from this M-ID; AGAS M1140 no Exhibit Reference title takes its canonical title from this M-ID.

## Impact track, first batch: Leadership and supervision

Sam, relayed by COBIx, 2026-11-12: "the 3 hours leadership is a gold mine on the surface waiting for its day." 485 M-IDs carry Leadership or Supervision in their title; 54 of them hold a member with outcomes text and 15 hold two or more. The military side, the JST 3-hour Leadership recommendation, is in no committed file this script reads: MAP's ACE recommendation rows live in Supabase (`map_college_cr_unit`, `source_code` ACE, per `docs/military_cr_reference_scope.md`), so which of these M-IDs those recommendations land on is a read for a later pass.

| M-ID | Title | Members | Colleges | With text | Class | Colleges without outlines on file |
|---|---|---|---|---|---|---|
| CDEV M1024 | Adult Supervision and Mentoring in Early Learning and Education Programs | 43 | 42 | 8 | Confirmed (partial) | Santiago Canyon College, East Los Angeles College, Los Angeles City College, Los Angeles Harbor College and 29 more |
| CDEV M1011 | Administration 2: Personnel and Leadership in Early Childhood Education | 34 | 34 | 4 | Confirmed (partial) | American River College, Barstow Community College, Cerro Coso Community College, Chabot College and 26 more |
| ADS 130 X | Group Process and Group Leadership | 16 | 16 | 2 | Split (partial) | Antelope Valley College, Cerro Coso Community College, College of San Mateo, College of the Desert and 9 more |
| CRIM M1135 | Control and Supervision in Corrections | 15 | 14 | 3 | Confirmed (limited) | Lassen College, Barstow Community College, Citrus College, Clovis Community College and 7 more |
| FCSH M1004 | Adult Mentoring and Supervision | 15 | 15 | 1 | Not enough text | Chabot College, Las Positas College, American River College, Cosumnes River College and 10 more |
| MGMT M1017 | Elements of Supervision | 15 | 15 | 4 | Split (partial) | East Los Angeles College, Los Angeles City College, Los Angeles Harbor College, Los Angeles Pierce College and 7 more |
| BUSI M1384 | Leadership in Action: Organizational Learning | 14 | 12 | 2 | Split (limited) | Monterey Peninsula College, American River College, Allan Hancock College, Cerritos College and 6 more |
| FIRE 251 X | Ethical Leadership | 11 | 9 | 0 | Not enough text | Palomar College, College of the Canyons, Oxnard College, Santa Rosa Junior College and 5 more |
| IDST M1072 | Civic Responsibility and Leadership | 11 | 2 | 0 | Not enough text | De Anza College, Fresno City College |
| FIRE M1151 | S-339 Division/Group Supervisor- ALL RISK | 10 | 8 | 0 | Not enough text | College of the Canyons, Bakersfield College, Santa Ana College, Allan Hancock College and 4 more |
| CDEV M1027 | Adult Supervision: The Mentor Teacher | 9 | 9 | 0 | Not enough text | College of the Desert, Victor Valley College, College of the Canyons, Crafton Hills College and 5 more |
| MGMT M1025 | Human Relations (Developing Supervisory Leadership) | 9 | 9 | 3 | Confirmed (limited) | College of the Siskiyous, Palo Verde College, Saddleback College, San Bernardino Valley College and 2 more |
| BUSI M1381 | Leadership | 8 | 8 | 0 | Not enough text | Bakersfield College, Cerro Coso Community College, College of the Desert, Cypress College and 3 more |
| CDEV M1012 | Administration and Supervision of Early Childhood Programs 1 | 8 | 8 | 0 | Not enough text | East Los Angeles College, Los Angeles City College, Los Angeles Harbor College, Los Angeles Pierce College and 4 more |
| FIRE M1092 | Followership to Leadership (L-280) | 8 | 6 | 0 | Not enough text | College of the Canyons, Reedley College, Allan Hancock College, Lassen College and 2 more |
| HUMA M1070 | Editorial Leadership Literary Magazine, National Edition | 8 | 1 | 0 | Not enough text | De Anza College |
| COMM M1056 | Leadership and Communication | 7 | 7 | 1 | Not enough text | Bakersfield College, Reedley College, Ohlone College, College of the Canyons and 2 more |
| FCSH M1003 | Admin 2: Personnel and Leadership in Early Childhood Education | 7 | 7 | 1 | Not enough text | Allan Hancock College, Cerro Coso Community College, Woodland Community College, Butte College and 2 more |
| FIRE M1317 | Ethical Leadership for Fire and Emergency Services Instructors | 7 | 6 | 0 | Not enough text | Crafton Hills College, Moreno Valley College, Las Positas College, Gavilan College and 2 more |
| CRIM M1202 | Leadership Development | 6 | 6 | 0 | Not enough text | Allan Hancock College, American River College, College of the Redwoods, College of the Sequoias and 2 more |
| IDST M1110 | Student Leadership in Higher Education | 6 | 6 | 0 | Not enough text | De Anza College, Gavilan College, Santa Monica College, Hartnell College and 2 more |
| BUSI M1386 | Supervision and Leadership | 5 | 5 | 1 | Not enough text | Fresno City College, Santa Ana College, Long Beach City College, Southwestern College |
| BUSI M1516 | Leading and Supervising Teams | 5 | 5 | 0 | Not enough text | Butte College, Los Medanos College, Allan Hancock College, Chabot College and 1 more |
| CDEV M1016 | Administration 2: Personnel and Leadership in ECE | 5 | 5 | 0 | Not enough text | Diablo Valley College, Ohlone College, Riverside City College, Moorpark College and 1 more |
| COUN M1126 | Group Process and Leadership | 5 | 5 | 0 | Not enough text | Diablo Valley College, Palomar College, Mendocino College, Saddleback College |

What a good call needs: outlines from the colleges that hold most of these courses and have none on file, first College of the Canyons (32 courses), De Anza College (30 courses), Allan Hancock College (23 courses), Fresno City College (23 courses), East Los Angeles College (22 courses), Monterey Peninsula College (21 courses). Each is one college's outline read inside the $40 pot, which is not this worker's to run. With the outlines in, the supervision courses can be compared with each other and, once the ACE rows are read, beside the JST recommendation's own description.

## Partial or whole

This report reads the committed reads under `kb/course_outcomes/` (13 hosts, 17349 rows). The committed reads hold every row the load receipts record, so this pass covers the outcomes the table held at the last load (18 colleges). A dispatch of `mid-outcomes-compare.yml` reads the table itself and rewrites this report, which matters once a load lands that was not filed here first.

