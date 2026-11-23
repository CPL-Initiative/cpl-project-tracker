# MID re-clustering, Step 1: outcomes and objectives against the M-IDs (2026-11-23)

Issue #2962, COBIx's operational brief of 2026-11-12, Sam's go relayed by COBIx ("yes, let's roll!", cpl_memory sam-mid-reclustering-step-1-go-2026-11-12). A no-write comparison: nothing here changes an M-ID, a table or a generated file. Built by `kb/_mid_outcomes_compare.py`; every M-ID's result is in the JSON beside this file.

Source of the outcomes text: the committed reads under `kb/course_outcomes/` (source: files; 27 hosts, 49404 rows). Membership: `unified_courses_members.js` (generated 2026-11-23 06:20), descriptions `unified_courses_member_desc.js`, titles `unified_courses_index.js`, exhibit reach `unified_courses_aligned.js` and `kb/exhibits_review.json`, districts `kb/college_identity/2026-11-10/crosswalk.json`, subjects `kb/reference/subject_discipline_map.json`.

This report replaces the first run of this date (#3165, `41eeb44a`). COBIx read it and gave four findings (#2962, comment 6829696579), taken as given: the district guard now covers splits and merges, every case carries its exhibit reach, the cases for Sam are chosen by that reach, and a structural check reads subject codes. The first run's six cases stay below as examples, re-rated.

## Inventory

Course outcomes live in one table, `course_outcomes` on Supabase, and every row in it is loaded from a read committed under `kb/course_outcomes/<host>/` (the load receipts in `kb/receipts/course_outcomes_*.json` add up to the same rows, an older Orange Coast read aside). No program learning outcomes (PLOs) have been harvested: the table holds two kinds, `slo` and `objective`. Descriptions come from COCI through `unified_courses_member_desc.js` for every M-ID member.

| Source | Rows | Courses | Colleges |
|---|---|---|---|
| SLOs | 28949 | 28870 | 39 |
| Course objectives | 20455 | 20443 | 29 |
| PLOs | 0 | 0 | 0 |
| Descriptions (COCI) | one per member | 81013 members in the M-IDs read here | statewide |

Of 29326 courses with outcomes text, 27759 match a member of an M-ID (college and code). 12891 M-IDs hold at least one member with text; 3544 hold two or more (the scope of this pass), and 2181 of those are same-college suites, two or more members from one college. That is 7.2% of the 49564 M-IDs.

## Method

Each course's outcome and objective statements become word stems, with the lead-ins and generic verbs removed and each stem weighted by how rare it is across all harvested courses; two courses agree when the cosine of their weighted stems reaches 0.30. Inside an M-ID the agreeing courses form groups, and more than one group is a proposed split only when the descriptions or the titles also disagree.

Thresholds: agree at 0.30; strong confirmation at a mean of 0.50 with a second signal; merge candidate at 0.55 across two M-IDs of one Common SUBJ; descriptions agree at 0.30; titles agree at a stem overlap of 0.50, and a strong merge of two titles that each name something the other lacks needs descriptions at 0.50. A course with fewer than 12 stems after stripping is thin and treated as having no text; 3427 statements printed word for word by 4 or more courses were dropped as outline boilerplate.

Where the data is strong, the method agrees with the M-IDs: 30566 pairs of same-titled courses at two colleges inside one M-ID score a median of 0.293, and 48% of them reach the agree line. 801 sampled pairs of differently titled courses in different M-IDs of one Common SUBJ score a median of 0.053, and 2% of them reach it (95th percentile 0.221).

Confidence uses Sam's three match levels (Open Asks Sheet 181, 2026-11-11): strong, partial and limited. A split the outcomes alone propose is limited, a flag for a person, since an SLO never overrides on its own. A member with no text joins no group and is never the reason for a split. TOP and units are shown and read by nothing.

Blind spots. Word overlap misses a paraphrase: two colleges can teach the same course in different words and read as a weak pair, which is why a split needs a second signal. Shared vocabulary can join different levels of one subject (Spanish 1 and Spanish 2 use the same words), so a confirmation does not prove a level is right. Thin outlines (one or two statements) are set aside, not judged. Objectives exist for four colleges only, so most courses are read on SLOs alone.

One district is one voice. District outlines printed once for several colleges (RCCD, SDCCD, LACCD) agree by construction, so a pair of colleges inside one district counts as one voice everywhere: it never makes a confirmation strong or partial, a merge pair inside one district is limited, and a split is strong only when a group holds outlines from two or more districts. The district is the committed college identity crosswalk's (`kb/_college_identity_latest.py`); a college it does not name is its own voice. The calibration above counts only same-titled pairs from two districts.

## Counts by class and confidence (the 3544 M-IDs in scope)

| Class | Strong | Partial | Limited | All | First run (no district guard) |
|---|---|---|---|---|---|
| Confirmed | 100 | 546 | 924 | 1570 | 557 (221 strong) |
| Split | 18 | 800 | 719 | 1537 | 760 (19 strong) |
| Merge candidate | 62 | 220 | 0 | 282 | 221 (63 strong) |
| Not enough text | 0 | 0 | 0 | 155 | 319 |

What moved, and why: the district guard. A confirmation or a merge that rested on one district's shared outline is one voice now, so strong confirmations and merge candidates fall the most; an M-ID that had been a merge candidate only through such a pair returns to its own class. The guard changes a split's level, never whether its groups disagree, so the split count is unchanged; its strong splits fall where every group sat inside one district. A second correction moves the merges too: the first run read a title's level word alone, so *Elementary Spanish II* and *Spanish: Beginning I* read as one level and could pair; the level reader now reads the word and the numeral, and a lecture never pairs with its laboratory.

A Merge candidate here is an M-ID whose outcomes otherwise confirm it and whose courses also agree, at partial or strong, with a course in another M-ID of the same Common SUBJ. A Not enough text M-ID in scope holds two members with outcomes text, one or both too thin to judge.

Outliers. 6008 single-member M-IDs carry outcomes text; the outcomes place 174 of them beside a course in another M-ID of the same Common SUBJ at partial or strong, and leave 5834 alone.

## AGAB M1002, Agricultural Ambassadors

AGAB M1002 resolves to itself through `kb/alias_chain.py` (the maps applied after its era, 2026-11-08's anchor re-key the last). Its title in the index is *Agricultural Ambassadors - Public Relations*. Its 3 members, from Merced College: AGAB 31A Agricultural Ambassadors - Introduction, Merced College; AGAB 31C Agricultural Ambassadors - Public Relations, Merced College; AGAB 31B Agricultural Ambassadors - Recruitment, Merced College. Units 2, TOP 0112.00.

Class: Not enough text. fewer than two members print enough outcome text (0 of 3); a missing SLO counts against no one.

Merced's course outlines have not been harvested, so no outcome or objective is on file for any of the three. Read on descriptions alone, at limited confidence (the lower rung COBIx's brief allows), the description cosines are AGAB 31A and AGAB 31C 0.91; AGAB 31A and AGAB 31B 0.93; AGAB 31C and AGAB 31B 0.92 against the 0.30 agree line. The titles share the stem *Agricultural Ambassadors* and each names a different specialization. What the harvest needs: Merced's outline platform read for these three courses (one college, three outlines), the SLOs and objectives filed under `kb/course_outcomes/merced/`, then this script rerun.

> AGAB 31A (Merced College): "The purpose of this course is to introduce students to the Agricultural Ambassador program. Ambassadors promote agricultural awareness and educational opportunities in agriculture at Merced College and beyond. Students will learn the role of Ambassadors, develop their communication  and leadership s"

> AGAB 31C (Merced College): "The purpose of this course is to focus on the public relations role of the Agricultural Ambassadors as they promote agricultural awareness and educational opportunities in agriculture at Merced College and beyond. Students will learn the fundamentals of public relations, communication and leadership"

> AGAB 31B (Merced College): "The purpose of this course is to focus the recruitment role of the Agricultural Ambassadors as they promote agricultural awareness and _x000D_
educational opportunities in agriculture at Merced College and beyond. Students will learn the fundamentals of effective presentations, conduct  tours, plan "

## Cases for Sam, by exhibit reach

Sam's rule of 2026-11-12, relayed by COBIx (6829696579 point 2): order a batch by student blast radius, how many students or members of the public a correct call would help. The cases below come from the strong and partial splits and merges, ordered by exhibit reach first and strength second. Reach is the credit-by-exam credentials whose title comes from the M-ID, since a split or a rename retitles them; certifications keep their official names (Sam, 2026-11-12) and are shown, never counted (the two columns agreed on #3111, 6827702046). Of the 3544 M-IDs in scope, 230 carry credit-by-exam reach and 192 carry certifications; 31 strong or partial splits and 141 strong or partial merge pairs reach any credit-by-exam credential.

Potential-CPL blast radius. The repo holds no committed per-M-ID measure of the students or members of the public a call would reach: `prototype/ccr_cpl.json` and `unified_courses_aligned.js` count credentials and colleges, structural counts only, and students per title (`exhibit_title_students`) are a reviewer-only read in Supabase. So this report shows no such column and orders by credit-by-exam reach, the nearest committed measure; the earning colleges behind each credential are shown beside it.

| # | Case | Level | Credit-by-exam credentials | Earning colleges | Certifications (not counted) |
|---|---|---|---|---|---|
| 1 | AJ 110 split | partial | 4 | 6 | 2 |
| 2 | COMP 112 and COMP 122 merge | strong | 4 | 4 | 0 |
| 3 | MATH 210 and MATH 211 merge | strong | 3 | 4 | 0 |
| 4 | REAL M1038 and REAL M1040 merge | partial | 2 | 7 | 8 |
| 5 | FIRE 140 X and FIRE M1268 merge | strong | 2 | 6 | 14 |
| 6 | MUS 110 and MUS 120 merge | partial | 2 | 4 | 0 |

### 1. AJ 110, Introduction to Criminal Justice: proposed split (partial)

116 members, 102 colleges, units 3 to 4. outcomes, descriptions and titles say the groups differ, but each college sits in one group, so different wording of one course is not ruled out.

Group A, proposed title *Introduction to Administration of Justice* (Allan Hancock College, Cabrillo College, Chabot College, City College of San Francisco, Coastline Community College, College of the Redwoods, Cuesta College, Diablo Valley College, Feather River College, Golden West College, Irvine Valley College, Las Positas College, Los Medanos College, Merritt College, Modesto Junior College, Moreno Valley College, Norco College, Palomar College, Rio Hondo College, Riverside City College, Saddleback College, San Diego City College, San Diego Miramar College, Santa Ana College, Santiago Canyon College, Shasta College; 18 districts):
- Allan Hancock College (AJ 101 Introduction to Criminal Justice): "Demonstrate an understanding of criminological theories used to explain crime and criminality;"
- Allan Hancock College (AJ 101 Introduction to Criminal Justice): "Understand the history, development, and structure, and function of American police, courts, and corrections;"
- Cabrillo College (CJ 1 Introduction to Criminal Justice): "Analyze and explain the historical development of the criminal justice system and its components."
- Cabrillo College (CJ 1 Introduction to Criminal Justice): "Explain the interrelationship of the various subsystems within the justice system"
- Chabot College (ADMJ 50 Introduction to the Administration of Justice): "demonstrate an understanding the history, development, structure, and function of American police, courts, and corrections;"
- Chabot College (ADMJ 50 Introduction to the Administration of Justice): "demonstrate an understanding of the theoretical explanations for crime and criminal behavior;"

Group B, proposed title *Introduction to Addiction Counseling* (Mt. San Antonio College; 1 district):
- Mt. San Antonio College (AD 1 Introduction to Addiction Counseling): "Students will be able to Identify and describe the different psychoactive substances used in America ."
- Mt. San Antonio College (AD 1 Introduction to Addiction Counseling): "Students will be able to describe the impact of substance abuse on the community, family, and individual. (MO)"

No text, left where they are: ADMJ 300 Introduction to Administration of Justice, American River College; AJ 101 Introduction to Administration of Justice, Antelope Valley College; CRIM B1 Introduction to Criminal Justice, Bakersfield College; ADJU 1 Introduction to the Administration of Justice, Barstow Community College; AJ 2 Administration of Justice, Butte College; AJ 101 Introduction to Administration of Justice, Cerritos College and 78 more.

Student test: someone who completed *Introduction to Administration of Justice* would not be repeating *Introduction to Addiction Counseling*; their outcomes score at most 0.197 against each other, below the 0.30 agree line, and their descriptions score at most 0.05.

Exhibit reach: AJ 110: 4 credit-by-exam credentials titled from it (6 earning colleges), *Introduction to Administration of Justice*; *Administration of Justice*; *Introduction to the Criminal Justice System*; 2 certifications, not counted, since a certification keeps its official name.

### 2. COMP 112 and COMP 122: proposed merge (strong)

COMP 112, *Introduction to Programming Concepts and Methodologies* (66 members) and COMP 122, *Programming Concepts and Methodology I* (184 members), one Common SUBJ. The closest pair across two districts: CSCI 1007 Programming I, College of the Siskiyous and CIT 127 Python Programming I, Rio Hondo College, outcomes 0.56, descriptions 0.35, titles 0.50; 9 course pairs reach the merge line.

- College of the Siskiyous (CSCI 1007 Programming I): "Apply reasoning skills to analyze computer-solvable problems"
- College of the Siskiyous (CSCI 1007 Programming I): "Design, implement, test, and debug a program that uses basic computation, simple I/O, standard conditional and iterative structures, and the definition of functions;"
- College of the Siskiyous (CSCI 1007 Programming I): "Use an object oriented programming approach to design code"
- Rio Hondo College (CIT 127 Python Programming I): "Design, implement, test, and debug a program that uses each of the following fundamental programming constructs: basic computation, simple I/O, standard conditional and iterative structures, and the definition of functions."
- Rio Hondo College (CIT 127 Python Programming I): "Use pseudocode or a programming language to implement, test, and debug algorithms for solving simple problems"
- Rio Hondo College (CIT 127 Python Programming I): "Demonstrate proficiency in the use of a programming language to solve complex problems in a secure and robust manner."

Student test: someone who completed CSCI 1007 Programming I, College of the Siskiyous would be repeating much of CIT 127 Python Programming I, Rio Hondo College; the two outlines name the same outcomes in close to the same words.

Exhibit reach: COMP 112: 1 credit-by-exam credential titled from it (1 earning college), *Python Programming Fundamentals*; 0 certifications, not counted, since a certification keeps its official name. COMP 122: 3 credit-by-exam credentials titled from it (3 earning colleges), *C++ Programming*; *Programming Concepts and Methodology 1*; *Programming Concepts and Methodology 1 (C++)*; 0 certifications, not counted, since a certification keeps its official name.

### 3. MATH 210 and MATH 211: proposed merge (strong)

MATH 210, *Single Variable Calculus I Early Transcendentals* (101 members) and MATH 211, *Single Variable Calculus I Late Transcendentals* (27 members), one Common SUBJ. The closest pair across two districts: MATH 003A Calculus I, College of Alameda and MATH 1 Calculus I, Las Positas College, outcomes 0.59, descriptions 0.42, titles 1.00; 3 course pairs reach the merge line.

- College of Alameda (MATH 003A Calculus I): "Diagram and compute limits of functions"
- College of Alameda (MATH 003A Calculus I): "Prove and determine whether functions are continuous"
- College of Alameda (MATH 003A Calculus I): "Compute the derivative of a function as a limit"
- Las Positas College (MATH 1 Calculus I): "Evaluate the limit of a function at a real number;"
- Las Positas College (MATH 1 Calculus I): "Determine whether a function is continuous at a point or an interval;"
- Las Positas College (MATH 1 Calculus I): "Find and interpret average and instantaneous rates of change;"

Student test: someone who completed MATH 003A Calculus I, College of Alameda would be repeating much of MATH 1 Calculus I, Las Positas College; the two outlines name the same outcomes in close to the same words.

Exhibit reach: MATH 210: 1 credit-by-exam credential titled from it (1 earning college), *Single Variable Calculus 1 Early Transcendentals*; 0 certifications, not counted, since a certification keeps its official name. MATH 211: 2 credit-by-exam credentials titled from it (3 earning colleges), *AP Calculus AB*; *Single Variable Calculus 1 Early Transcendentals*; 0 certifications, not counted, since a certification keeps its official name.

### 4. REAL M1038 and REAL M1040: proposed merge (partial)

REAL M1038, *Real Estate Practice* (52 members) and REAL M1040, *Real Estate Principles* (70 members), one Common SUBJ. The closest pair across two districts: RLES 381 Real Estate Practice, Modesto Junior College and RLE 80 Real Estate Principles, Moreno Valley College, outcomes 0.58, descriptions 0.39, titles 0.50; 4 course pairs reach the merge line.

- Modesto Junior College (RLES 381 Real Estate Practice): "Describe common practices employed in a residential real estate transaction."
- Modesto Junior College (RLES 381 Real Estate Practice): "Explain real estate marketing and sales techniques as it applies to listing real property."
- Modesto Junior College (RLES 381 Real Estate Practice): "Analyze ethical and procedural problems that arise in residential real estate sales transactions including implicit bias and fair housing laws."
- Moreno Valley College (RLE 80 Real Estate Principles): "Describe the business of real estate."
- Moreno Valley College (RLE 80 Real Estate Principles): "Define and discuss real property, personal property and business ownership of real estate."
- Moreno Valley College (RLE 80 Real Estate Principles): "Demonstrate an understanding of the law of agency and contracts"

Student test: the two outlines name the same outcomes in close to the same words, so someone who completed RLES 381 Real Estate Practice, Modesto Junior College may be repeating much of RLE 80 Real Estate Principles, Moreno Valley College. The two titles each name something the other lacks (*Real Estate Practice*, *Real Estate Principles*), so before a merge a person checks whether a student takes both, as two required courses or two steps of one sequence; word overlap cannot tell.

Exhibit reach: REAL M1038: 1 credit-by-exam credential titled from it (1 earning college), *Real Estate Practice*; 4 certifications, not counted, since a certification keeps its official name. REAL M1040: 1 credit-by-exam credential titled from it (6 earning colleges), *Real Estate Principles*; 4 certifications, not counted, since a certification keeps its official name.

### 5. FIRE 140 X and FIRE M1268: proposed merge (strong)

FIRE 140 X, *Fire Behavior and Combustion* (22 members) and FIRE M1268, *Fire Behavior and Combustion* (35 members), one Common SUBJ. The closest pair across two districts: FST 3 Fire Behavior and Combustion, Las Positas College and FIPT 105 Fire Behavior and Combustion, San Diego Miramar College, outcomes 0.81, descriptions 0.84, titles 1.00; 10 course pairs reach the merge line.

- Las Positas College (FST 3 Fire Behavior and Combustion): "Identify the fundamental theories of fire behavior and combustion"
- Las Positas College (FST 3 Fire Behavior and Combustion): "Differentiate the various types of extinguishing agents, methods and techniques to the theory of fire extinguishment base on development of the flame plume"
- Las Positas College (FST 3 Fire Behavior and Combustion): "Define and use basic terms and concepts associated with the chemistry and dynamics of fire"
- San Diego Miramar College (FIPT 105 Fire Behavior and Combustion): "Differentiate between the basic laws of matter and energy"
- San Diego Miramar College (FIPT 105 Fire Behavior and Combustion): "Use terminology, definitions, and terms associated with basic fire chemistry"
- San Diego Miramar College (FIPT 105 Fire Behavior and Combustion): "Identify basic chemical symbols used in chemical formula writing"

Student test: someone who completed FST 3 Fire Behavior and Combustion, Las Positas College would be repeating much of FIPT 105 Fire Behavior and Combustion, San Diego Miramar College; the two outlines name the same outcomes in close to the same words.

Exhibit reach: FIRE 140 X: 1 credit-by-exam credential titled from it (1 earning college), *Fire Behavior and Combustion*; 6 certifications, not counted, since a certification keeps its official name. FIRE M1268: 1 credit-by-exam credential titled from it (5 earning colleges), *Fire Behavior and Combustion*; 8 certifications, not counted, since a certification keeps its official name.

### 6. MUS 110 and MUS 120: proposed merge (partial)

MUS 110, *Music Fundamentals* (74 members) and MUS 120, *Music Theory I* (90 members), one Common SUBJ. The closest pair across two districts: MUS 1 The Basics Of Music, Saddleback College and MUS 111 Music Theory and Musicianship I, Santa Ana College, outcomes 0.60, descriptions 0.38, titles 0.25; 9 course pairs reach the merge line.

- Saddleback College (MUS 1 The Basics Of Music): "Identify and write all major and minor key signatures."
- Saddleback College (MUS 1 The Basics Of Music): "Identify and write all major and minor scales."
- Saddleback College (MUS 1 The Basics Of Music): "Differentiate between major, minor, augmented and diminished intervals."
- Santa Ana College (MUS 111 Music Theory and Musicianship I): "Identify and write pitches in treble, bass, alto, and tenor clefs using note names and MIDI octave designations."
- Santa Ana College (MUS 111 Music Theory and Musicianship I): "Write, read, and perform rhythms in simple and complex meters that include beat, division of the beat, subdivision of the beat, and triplets."
- Santa Ana College (MUS 111 Music Theory and Musicianship I): "Write and identify major, natural minor, harmonic minor and melodic minor scale patterns, as well as key signatures, and analyze excerpts based on these structures."

Student test: the two outlines name the same outcomes in close to the same words, so someone who completed MUS 1 The Basics Of Music, Saddleback College may be repeating much of MUS 111 Music Theory and Musicianship I, Santa Ana College. The two titles each name something the other lacks (*The Basics Of Music*, *Music Theory and Musicianship I*), so before a merge a person checks whether a student takes both, as two required courses or two steps of one sequence; word overlap cannot tell.

Exhibit reach: MUS 110: 1 credit-by-exam credential titled from it (1 earning college), *Music Fundamentals*; 0 certifications, not counted, since a certification keeps its official name. MUS 120: 1 credit-by-exam credential titled from it (3 earning colleges), *Music Theory 1*; 0 certifications, not counted, since a certification keeps its official name.

## Two cases re-rated by the district guard

ITIS 140, *Introduction to Systems Analysis and Design*: the first run called it a strong split. Group A was Norco College CIS 2 and Riverside City College CIS 2, word for word one RCCD outline, set against Riverside City's own CSC 20, so every member with text sits in one district. Its class now: Split, limited. Only the outcomes say the groups differ: a flag for a person, never a split on its own.

BIOL M1094 and BIOL M1095, *General Biology* and *General Biology Honors*: the first run's 1.00 was Moreno Valley BIO 1 against Norco BIO 1H, one RCCD text. All 9 course pairs that reach the merge line sit inside one district, so the merge is limited now. What the pair shows is that RCCD writes its Honors course with its base course's outcomes; it does not show that the M-IDs should merge statewide.

## The candidate rules and their four examples

The first run's four clean cases stay as examples of two candidate rules, re-rated under the district guard. They hold.

Rule 1, a course from another subject inside an M-ID splits out. MATH 130 holds Cabrillo CHEM 5 and PH 101 holds Modesto GEOG 106. The rule is structural and the outcomes only confirm it, so it runs below as its own check on subject codes, with no outcome text needed.

Rule 2, an Honors section merges with its base course: a policy call for Sam. For a student it fits, since the outcomes match and nothing is repeated. C-ID and some articulation keep Honors separate, so the question for Sam is which he means: one M-ID for the base course and its Honors section, or two M-IDs with a declared equivalence between them. AGAS M1136 and M1140 is the merge example (Shasta and Cuesta, two districts); BIOL M1094 and M1095 is the Honors pair, limited until a second district's outlines say the same.

### Example: MATH 130, Finite Mathematics: proposed split (strong)

69 members, 58 colleges, units 3 to 5. outcomes, descriptions and titles all say the groups teach different things, one college files courses in more than one group, and a group holds outlines from two or more districts.

Group A, proposed title *Finite Mathematics* (Cabrillo College, Chabot College, Coastline Community College, College of the Siskiyous, Columbia College, Diablo Valley College, Feather River College, Las Positas College, Modesto Junior College, Shasta College; 8 districts):
- Cabrillo College (MATH 13 Finite Mathematics): "Demonstrate competency in performing matrix calculations and utilize matrices for applied problem solving."
- Cabrillo College (MATH 13 Finite Mathematics): "Analyze a financial problems and evaluate using formulas."
- Chabot College (MTH 33 Finite Mathematics): "interpret graphs of linear equations;"
- Chabot College (MTH 33 Finite Mathematics): "identify the three types of solutions of a linear system;"
- Chabot College (MTH 33S Finite Mathematics with Support): "interpret graphs of linear equations;"
- Chabot College (MTH 33S Finite Mathematics with Support): "identify the three types of solutions of a linear system;"

Group B, proposed title *Quantitative Analysis* (Cabrillo College; 1 district):
- Cabrillo College (CHEM 5 Quantitative Analysis): "Define the analytical problem, select a suitable method or technique, obtain a representative sample, prepare the sample for analysis, perform any necessary chemical separations, perform the measurement, calculate the results and submit reports."
- Cabrillo College (CHEM 5 Quantitative Analysis): "Solve analytical chemical problems, including stoichiometric calculations, gravimetric, volumetric, instrumental, separations and kinetic analysis."

No text, left where they are: MATH 124 Finite Math, Antelope Valley College; MATH B23 Finite Mathematics, Bakersfield College; MATH 12 Mathematics for Business Decisions (Finite Mathematics), Butte College; MATH 125 Elementary Finite Mathematics, Cañada College; MATH 115 Finite Mathematics, Cerritos College; MATH C130 Finite Mathematics, Cerro Coso Community College and 51 more.

Student test: someone who completed *Finite Mathematics* would not be repeating *Quantitative Analysis*; their outcomes score at most 0.134 against each other, below the 0.30 agree line, and their descriptions score at most 0.04.

Exhibit reach: MATH 130: 1 credit-by-exam credential titled from it (1 earning college), *Finite Mathematics*; 0 certifications, not counted, since a certification keeps its official name.

### Example: PH 101, Introduction to Public Health: proposed split (strong)

32 members, 29 colleges, units 3. outcomes, descriptions and titles all say the groups teach different things, one college files courses in more than one group, and a group holds outlines from two or more districts.

Group A, proposed title *Introduction to Public Health* (Cabrillo College, Chabot College, Coastline Community College, Columbia College, Cuesta College, Irvine Valley College, Las Positas College, Modesto Junior College, Orange Coast College, Riverside City College, Saddleback College; 7 districts):
- Cabrillo College (HS 50 Introduction to Public Health): "Synthesize current research data and course content to make recommendations to address public health issues and health inequities."
- Cabrillo College (HS 50 Introduction to Public Health): "Analyze behavioral, social, and cultural factors that impact individual and population health and health disparities over the life course."
- Chabot College (BIOS 18 Introduction to Public Health): "distinguish the difference between personal and public health and provide examples of each;"
- Chabot College (BIOS 18 Introduction to Public Health): "explain how public health programs differ from and serve as a compliment to traditional medical care. Include an analysis of the organization, financing and delivery of various medical and population-based services in the United States healthcare system;"
- Chabot College (HLTH 18 Introduction to Public Health): "distinguish the difference between personal and public health and provide examples of each;"
- Chabot College (HLTH 18 Introduction to Public Health): "explain how public health programs differ from and serve as a compliment to traditional medical care. Include an analysis of the organization, financing and delivery of various medical and population-based services in the United States healthcare system;"

Group B, proposed title *Geography of Health* (Modesto Junior College; 1 district):
- Modesto Junior College (GEOG 106 Geography of Health): "Identify and describe the global distribution of an infectious disease."
- Modesto Junior College (GEOG 106 Geography of Health): "Propose solutions to a community health issue."

No text, left where they are: ALH 3 Introduction to Public Health, Butte College; HED 102 Introduction to Public Health, Cerritos College; HO 102 Introduction to Public Health, Cerritos College; HS 40 Introduction to Public Health, Coalinga College; PHSC 1 Public and Community Health, College of the Sequoias; HEALTH 101 Introduction to Public Health, East Los Angeles College and 13 more.

Student test: someone who completed *Introduction to Public Health* would not be repeating *Geography of Health*; their outcomes score at most 0.258 against each other, below the 0.30 agree line, and their descriptions score at most 0.28.

Exhibit reach: PH 101: 0 credit-by-exam credentials titled from it (0 earning colleges); 0 certifications, not counted, since a certification keeps its official name.

### Example: AGAS M1136 and AGAS M1140: proposed merge (strong)

AGAS M1136, *Small Ruminant Health and Management* (5 members) and AGAS M1140, *Small Ruminant Science* (3 members), one Common SUBJ. The closest pair across two districts: AGAS 316 Small Ruminant Production, Shasta College and AGAS 211 Small Ruminant Science, Cuesta College, outcomes 0.93, descriptions 0.86, titles 0.50; 2 course pairs reach the merge line.

- Shasta College (AGAS 316 Small Ruminant Production): "Provide an overview of the sheep and goat industries, including historical and economic perspectives."
- Shasta College (AGAS 316 Small Ruminant Production): "Describe the factors influencing the development of the sheep and goat industries."
- Shasta College (AGAS 316 Small Ruminant Production): "Identify common breeds of sheep and goats, and list their respective economically important strengths."
- Cuesta College (AGAS 211 Small Ruminant Science): "Provide an overview of the sheep and goat industries, including historical and economic perspectives."
- Cuesta College (AGAS 211 Small Ruminant Science): "Describe the factors influencing the development of the sheep and goat industries."
- Cuesta College (AGAS 211 Small Ruminant Science): "Identify common breeds of sheep and goats and list their respective economically important strengths."

Student test: the two outlines name the same outcomes in close to the same words, so someone who completed AGAS 316 Small Ruminant Production, Shasta College may be repeating much of AGAS 211 Small Ruminant Science, Cuesta College. The two titles each name something the other lacks (*Small Ruminant Production*, *Small Ruminant Science*), so before a merge a person checks whether a student takes both, as two required courses or two steps of one sequence; word overlap cannot tell.

Exhibit reach: AGAS M1136: 0 credit-by-exam credentials titled from it (0 earning colleges); 0 certifications, not counted, since a certification keeps its official name. AGAS M1140: 0 credit-by-exam credentials titled from it (0 earning colleges); 0 certifications, not counted, since a certification keeps its official name.

### Example: BSOT M1209, Introduction to Electronic Health Records: proposed split (strong)

34 members, 32 colleges, units 0 to 3. outcomes, descriptions and titles all say the groups teach different things, one college files courses in more than one group, and a group holds outlines from two or more districts.

Group A, proposed title *Records Management* (Allan Hancock College, Riverside City College, Shasta College; 3 districts):
- Allan Hancock College (CBOT 302 Records Management): "assemble files accurately according to the rules for alphabetic filing and cross-references."
- Allan Hancock College (CBOT 302 Records Management): "differentiate and properly sequence names associated with geographic, numeric and subject filing."
- Riverside City College (CAT 62 Records Management): "Create, maintain, and dispose of paper and electronic records."
- Riverside City College (CAT 62 Records Management): "Identify different records media in the workplace."
- Shasta College (BSOT 166 Records Management): "Explain the criteria by which records are created, stored, retrieved, retained, and disposed of."
- Shasta College (BSOT 166 Records Management): "Identify the procedures for the operation and control of manual and automated filing."

Group B, proposed title *Electronic Medical Records* (Shasta College; 1 district):
- Shasta College (BSOT 150 Electronic Medical Records): "Apply the principles of health insurance as they relate to health and accident insurance contracts."
- Shasta College (BSOT 150 Electronic Medical Records): "Effectively use insurance and patient billing software."

No text, left where they are: BCIS 51 Records Management, Butte College; BT 6 Records Management, Fresno City College; BUS 18 Records Management, Lassen College; CAT 62 Records Management, Moreno Valley College; CBTE 205 Records Management, San Diego City College; OFTECH 33 Records Management, Santa Monica College and 24 more.

Student test: someone who completed *Records Management* would not be repeating *Electronic Medical Records*; their outcomes score at most 0.116 against each other, below the 0.30 agree line, and their descriptions score at most 0.14.

Exhibit reach: BSOT M1209: 0 credit-by-exam credentials titled from it (0 earning colleges); 0 certifications, not counted, since a certification keeps its official name.

The likely call is a rename plus a split, not a split alone. The M-ID's index title is *Introduction to Electronic Health Records*, but most of its members, and the members with text, are *Records Management*. Rename the M-ID to the title its members carry, and split Shasta BSOT 150 *Electronic Medical Records* out.

## Structural check: a member from another subject

A member whose subject code names a different discipline from the rest of its M-ID, read from subject codes alone, with no outcome text (COBIx, 6829696579 point 3). A subject reads as a discipline only through `kb/reference/subject_discipline_map.json`, which leaves ambiguous codes null; TOP is never read (CLAUDE.md Rule 7). A member is flagged when at least three members map, one discipline holds more than half of them, the member's own discipline holds a quarter or less, and its title does not agree with the M-ID's title (an *Introduction to Public Health* filed under ALH is a prefix, not another course). The map is a staging draft and a cross-listed course (an ETHN literature course beside ENGL) is the discipline cross-listing lane's case, so each flag is a candidate for a person.

321 M-IDs hold 921 flagged members. 241 of those M-IDs are in this report's outcomes scope, where the outcomes class them: Confirmed strong 4, Confirmed partial 47, Confirmed limited 21, Split strong 6, Split partial 61, Split limited 95, Not enough text 7.

| M-ID | Title | Members | Discipline of the rest | Flagged members |
|---|---|---|---|---|
| MATH 130 | Finite Mathematics | 69 | Mathematics | BUS 119 Quantitative Methods, College of the Sequoias (Business); BUS 39 Quantitative Analysis, Lemoore College (Business); BUS 014A Mathematical Analysis for Business-Finite, Pasadena City College (Business); CHEM 5 Quantitative Analysis, Cabrillo College (Chemistry) and 3 more |
| PH 101 | Introduction to Public Health | 32 | Health | GEOG 106 Geography of Health, Modesto Junior College (Geography) |
| ESOL M9168 | Beginning ESL | 1786 | English as a Second Language | ENGL 71 Spelling I, College of Marin (English); ESL NC 006CE English as a Second Language - 0, Los Angeles Pierce College (English as a Second Language (ESL): Noncredit); ESL NC 006CE English As A Second Language - 0, Los Angeles Southwest College (English as a Second Language (ESL): Noncredit); ESL NC 006CE English as a Second Language - 0, Los Angeles Trade Technical College (English as a Second Language (ESL): Noncredit) and 111 more |
| MUS 180 | Major Ensemble | 850 | Music | MUSC 173 Jazz Ensemble B (Beginning), Antelope Valley College (Commercial Music); MUSC 273 Jazz Ensemble A (Advanced), Antelope Valley College (Commercial Music); MUSC 221 Studio Laboratory Band IV, Citrus College (Commercial Music); MUSC 223 Jazz Ensemble IV, Citrus College (Commercial Music) and 44 more |
| THTR 191 | Rehearsal and Performance in Production | 361 | Theater Arts | DRAM 11 Youth Outreach Theatre, Butte College (Drama/Theater Arts); DRAM 246 Rehearsal and Performance of a Modern Comedy, College of Marin (Drama/Theater Arts); DRAM 247 Rehearsal and Performance of a Period Play, College of Marin (Drama/Theater Arts); DRAM 248 Rehearsal and Performance of a Play for Young Audiences, College of Marin (Drama/Theater Arts) and 40 more |
| ESOL M9256 | Intermediate ESL | 964 | English as a Second Language | ESL NC 051CE Intermediate Conversation, East Los Angeles College (English as a Second Language (ESL): Noncredit); ESL NC 051CE Intermediate Conversation, Los Angeles Pierce College (English as a Second Language (ESL): Noncredit); ESL NC 051CE Intermediate Conversation, Los Angeles Southwest College (English as a Second Language (ESL): Noncredit); ESL NC 051CE Intermediate Conversation, Los Angeles Trade Technical College (English as a Second Language (ESL): Noncredit) and 29 more |
| THTR 192 | Technical Theatre in Production | 261 | Theater Arts | DRAM 164 Production Crew, College of Marin (Drama/Theater Arts); DRAM 252B Seminar and Fieldwork Experience, College of Marin (Drama/Theater Arts); DRAMA 201 Technical Theater Laboratory, Diablo Valley College (Drama/Theater Arts); THTR 184 Technical Theatre in New Works, Devised, and Experimental Production, Glendale Community College (Drama/Theater Arts) and 26 more |
| NUTR 110 | Introduction to Nutrition Science | 121 | Dietetics/Nutritional Science | BIOL 310 Nutrition, Cañada College (Biological Sciences); KIN 201 Nutrition for Health, Fitness, and Wellness, Cerritos College (Kinesiology); BIOL 310 Nutrition, College of San Mateo (Biological Sciences); KINE 1011 Nutrition, College of the Siskiyous (Kinesiology) and 20 more |
| ARTH 100 | Understanding Art | 114 | Art | ARTH 300 Art Appreciation, American River College (Art History); ARTH 1 Introduction to Art, Chabot College (Art History); ARTH 1 Art Appreciation, College of the Sequoias (Art History); ARTH 300 Art Appreciation, Cosumnes River College (Art History) and 16 more |
| CDEV 100 | Child Growth and Development | 161 | Child Development/Early Childhood Education | PSYC 010G Child Development (The Early Years), De Anza College (Psychology); PSYC 7 Developmental Psychology-Childhood And Adolescence, Irvine Valley College (Psychology); PSYC 31 Child Development: Conception Through Adolescence, Lassen College (Psychology); PSYC 21 Developmental Psychology: The Child, Pasadena City College (Psychology) and 12 more |
| SOCI 150 | Introduction to Race and Ethnicity | 158 | Sociology | ETHN 210 Race and Ethnic Relations in the U.S, Cerritos College (Chicano Studies); HIST 19 History of Ethnic Relations in the United States, Chaffey College (History); ETHS 141H Race, Ethnicity and Diversity-Honors, Crafton Hills College (Ethnic Studies); ETHS 101HC Honors American Ethnic Studies, Cypress College (Ethnic Studies) and 12 more |
| FTVE 105 | Introduction to Media Aesthetics and Cinematic Arts | 63 | Film and Media Studies | HUM 32 Film Appreciation, Coalinga College (Humanities); ENGL 237 Introduction To Film Studies, Cuesta College (English); HUM 3 Introduction to Cinematic Arts, Film and Television, Gavilan College (Humanities); PHOTO 501 Media Aesthetics And Design For Film And Digital Media, Los Angeles City College (Photography) and 12 more |
| SOCI 160 | Introduction to Crime | 65 | Sociology | AJ 206 Criminology, Antelope Valley College (Administration of Justice); AOJ 29 Criminology, Coalinga College (Administration of Justice); AJ 113 Crime and Violence in America, Evergreen Valley College (Administration of Justice); ADJ 51 Criminology, Hartnell College (Administration of Justice) and 10 more |
| ESOL M9023 | Vocational ESL | 213 | English as a Second Language | ESL NC 011CE Vocational English as a Second Language, Los Angeles Southwest College (English as a Second Language (ESL): Noncredit); ESL NC 010CE Vocational English As A Second Language, Los Angeles Trade Technical College (English as a Second Language (ESL): Noncredit); ESL NC 360CE Vesl: English For Special Uses, Los Angeles City College (English as a Second Language (ESL): Noncredit); ESL NC 360CE Vesl: English For Special Uses, Los Angeles Harbor College (English as a Second Language (ESL): Noncredit) and 7 more |
| BUS 140 | Business Information Systems, Computer Information Systems | 85 | Computer Information Systems | CSCI 1001 Introduction to Computer Science, College of the Siskiyous (Computer Science); CAOT 35 Concepts In Information Systems, East Los Angeles College (Office Technologies); BUS 17 Computer Uses For Business, Los Angeles City College (Business); BUS 21 Introduction to Business Computing, Mission College (Business) and 7 more |
| ITIS 130 | Introduction to Programming Concepts and Methodologies | 63 | Computer Information Systems | CS 111 Programming in Visual Basic, Los Angeles Harbor College (Computer Science); CS 111 Programming in Visual Basic, Los Angeles Pierce College (Computer Science); CS 111 Programming in Visual Basic, Los Angeles Trade Technical College (Computer Science); CS 111 Introduction to Computer Science I: Java, MiraCosta College (Computer Science) and 5 more |
| ESOL M1141 | Advanced ESL | 473 | English as a Second Language | READ 78 Advanced Reading, Crafton Hills College (Reading); ESL NC 161CE College ESL VI: Writing and Grammar, East Los Angeles College (English as a Second Language (ESL): Noncredit); ESL NC 096CE College Esl Vi: Writing And Grammar, Los Angeles Harbor College (English as a Second Language (ESL): Noncredit); ESL NC 161CE College ESL VI: Writing and Grammar, Los Angeles Trade Technical College (English as a Second Language (ESL): Noncredit) and 3 more |
| MUS 185 | Specialized Ensemble | 144 | Music | MUSC 124A Jazz Improvisation, Antelope Valley College (Commercial Music); MUSC 220A Popular Music Ensemble (Test Flight), Antelope Valley College (Commercial Music); MUSC 126 Guitar Ensemble, Victor Valley College (Commercial Music); MUSC 139 Studio Band, Victor Valley College (Commercial Music) and 3 more |
| PSY 180 | Introduction to Lifespan Psychology | 129 | Psychology | ECE 14 Lifespan Development, Clovis Community College (Child Development/Early Childhood Education); ECE 1999 Human Development, College of the Siskiyous (Child Development/Early Childhood Education); AH 3 The Person in the Life Cycle, Gavilan College (Health); ECE 14 Lifespan Development, Reedley College (Child Development/Early Childhood Education) and 3 more |
| ITIS 150 | Computer Network Fundamentals | 97 | Computer Information Systems | CSCI 240 Networking Essentials, Modesto Junior College (Computer Science); CS 56 Networking Essentials, San Joaquin Delta College (Computer Science); ELEC 142 Networking Academy Fundamentals (Cisco Certification Preparation), Southwestern College (Electricity); CS 152 Data Communications, Ohlone College (Computer Science) and 3 more |
| KINE M1402 | Introduction to Care/Prevention of Activity/Sports-Related Injuries | 46 | Kinesiology | ES/T 251 Advanced Prevention And Care Of Athletic Injuries, Southwestern College (Physical Education); PE 274 Assessment and Management of Athletic Injuries, El Camino College (Physical Education); ATH 104 Care and Prevention of Athletic Injuries, Allan Hancock College (Physical Education); PE 272 Care and Prevention of Athletic Injuries, Compton College (Physical Education) and 3 more |
| ANTH M1081 | Native American and Indigenous Peoples of the United States | 22 | Anthropology | HIST 121 Indigenous Peoples of California, Mt. San Jacinto College (History); AIS 106 Indigenous Peoples of North America, Imperial Valley College (Native American/American Indian Studies); AIS 108 Indigenous Peoples of the Southwest, Imperial Valley College (Native American/American Indian Studies); ETHN 101 Latin American and Indigenous Peoples History and Culture, College of San Mateo (Chicano Studies) and 3 more |
| SOCI 130 | Introduction to Marriage and Family | 116 | Sociology | PSYC 354 The Psychology of Family Life and Intimate Relationships in a Diverse Society, American River College (Psychology); PSY 140 Family and Intimate Relationships, College of Marin (Psychology); PSYCH 96 Marriage, Family and Intimate Relationships, Evergreen Valley College (Psychology); PSYC 131 Marriage and Intimate Relationships, Glendale Community College (Psychology) and 2 more |
| PH 100 | Personal Health and Wellness | 65 | Health | KIN 171H Health and Wellness in Society- Honors, Citrus College (Kinesiology); BIO 35 Health Science, Moreno Valley College (Biological Sciences); BIO 35 Health Science, Norco College (Biological Sciences); BIO 35 Health Science, Riverside City College (Biological Sciences) and 2 more |
| MUS 160 | Applied Music | 362 | Music | MUSC 009A Individual Instruction I, Pasadena City College (Commercial Music); MUSC 009B Individual Instruction II (Classical), Pasadena City College (Commercial Music); MUSC 009C Individual Instruction III (Classical), Pasadena City College (Commercial Music); MUSC 009D Individual Instruction II (Jazz/Commercial), Pasadena City College (Commercial Music) and 1 more |

Every flagged M-ID and member is in the JSON beside this file (`structural`).

## Impact track, first batch: Leadership and supervision

Sam, relayed by COBIx, 2026-11-12: "the 3 hours leadership is a gold mine on the surface waiting for its day." 486 M-IDs carry Leadership or Supervision in their title; 105 of them hold a member with outcomes text and 26 hold two or more. The military side, the JST 3-hour Leadership recommendation, is in no committed file this script reads: MAP's ACE recommendation rows live in Supabase (`map_college_cr_unit`, `source_code` ACE, per `docs/military_cr_reference_scope.md`), which the anon key is not known to read. This section stays on the committed data in every run, live or not, and nothing is widened for it; which of these M-IDs those recommendations land on is a read for a later pass.

| M-ID | Title | Members | Colleges | With text | Class | Colleges without outlines on file |
|---|---|---|---|---|---|---|
| LSKL M9004 | Supervised Tutoring | 90 | 80 | 0 | Not enough text | Ohlone College, Contra Costa College, Feather River College, Fullerton College and 76 more |
| CDEV M1024 | Adult Supervision and Mentoring in Early Learning and Education Programs | 43 | 42 | 9 | Confirmed (partial) | Santiago Canyon College, East Los Angeles College, Los Angeles City College, Los Angeles Harbor College and 26 more |
| CDEV M1011 | Administration 2: Personnel and Leadership in Early Childhood Education | 34 | 34 | 5 | Confirmed (partial) | American River College, Barstow Community College, Cerro Coso Community College, Clovis Community College and 22 more |
| ADS 130 X | Group Process and Group Leadership | 16 | 16 | 5 | Split (partial) | Antelope Valley College, Cerro Coso Community College, College of San Mateo, College of the Desert and 7 more |
| CRIM M1135 | Control and Supervision in Corrections | 15 | 14 | 4 | Confirmed (partial) | Lassen College, Barstow Community College, Citrus College, Clovis Community College and 6 more |
| FCSH M1004 | Adult Mentoring and Supervision | 15 | 15 | 2 | Split (limited) | Las Positas College, American River College, Cosumnes River College, Folsom Lake College and 7 more |
| MGMT M1017 | Elements of Supervision | 15 | 15 | 5 | Split (partial) | East Los Angeles College, Los Angeles City College, Los Angeles Harbor College, Los Angeles Pierce College and 6 more |
| BUSI M1384 | Leadership in Action: Organizational Learning | 14 | 12 | 4 | Split (partial) | Monterey Peninsula College, American River College, Allan Hancock College, Cerritos College and 4 more |
| FIRE 251 X | Ethical Leadership | 11 | 9 | 1 | Not enough text | College of the Canyons, Oxnard College, Santa Rosa Junior College, Sierra College and 5 more |
| IDST M1072 | Civic Responsibility and Leadership | 11 | 2 | 0 | Not enough text | De Anza College, Fresno City College |
| FIRE M1151 | S-339 Division/Group Supervisor- ALL RISK | 10 | 8 | 1 | Not enough text | College of the Canyons, Bakersfield College, Santa Ana College, Allan Hancock College and 4 more |
| CDEV M1027 | Adult Supervision: The Mentor Teacher | 9 | 9 | 1 | Not enough text | College of the Desert, Victor Valley College, College of the Canyons, Crafton Hills College and 4 more |
| MGMT M1025 | Human Relations (Developing Supervisory Leadership) | 9 | 9 | 4 | Split (partial) | College of the Siskiyous, Palo Verde College, San Bernardino Valley College, Solano Community College and 1 more |
| BUSI M1381 | Leadership | 8 | 8 | 0 | Not enough text | Bakersfield College, Cerro Coso Community College, College of the Desert, Cypress College and 3 more |
| CDEV M1012 | Administration and Supervision of Early Childhood Programs 1 | 8 | 8 | 0 | Not enough text | East Los Angeles College, Los Angeles City College, Los Angeles Harbor College, Los Angeles Pierce College and 4 more |
| FIRE M1092 | Followership to Leadership (L-280) | 8 | 6 | 0 | Not enough text | College of the Canyons, Reedley College, Allan Hancock College, Lassen College and 1 more |
| HUMA M1070 | Editorial Leadership Literary Magazine, National Edition | 8 | 1 | 0 | Not enough text | De Anza College |
| COMM M1056 | Leadership and Communication | 7 | 7 | 1 | Not enough text | Bakersfield College, Reedley College, Ohlone College, College of the Canyons and 2 more |
| FCSH M1003 | Admin 2: Personnel and Leadership in Early Childhood Education | 7 | 7 | 3 | Split (partial) | Cerro Coso Community College, Woodland Community College, Butte College, Monterey Peninsula College |
| FIRE M1317 | Ethical Leadership for Fire and Emergency Services Instructors | 7 | 6 | 0 | Not enough text | Crafton Hills College, Moreno Valley College, Las Positas College, Gavilan College and 2 more |
| CRIM M1202 | Leadership Development | 6 | 6 | 0 | Not enough text | Allan Hancock College, American River College, College of the Redwoods, College of the Sequoias and 2 more |
| IDST M1110 | Student Leadership in Higher Education | 6 | 6 | 0 | Not enough text | De Anza College, Gavilan College, Santa Monica College, Hartnell College and 2 more |
| BUSI M1386 | Supervision and Leadership | 5 | 5 | 1 | Not enough text | Fresno City College, Santa Ana College, Long Beach City College, Southwestern College |
| BUSI M1516 | Leading and Supervising Teams | 5 | 5 | 2 | Confirmed (strong) | Butte College, Allan Hancock College, College of San Mateo |
| CDEV M1016 | Administration 2: Personnel and Leadership in ECE | 5 | 5 | 1 | Not enough text | Ohlone College, Moorpark College, Taft College |

What a good call needs: outlines from the colleges that hold most of these courses and have none on file, first College of the Canyons (33 courses), De Anza College (30 courses), Fresno City College (24 courses), East Los Angeles College (23 courses), Monterey Peninsula College (21 courses), Bakersfield College (20 courses). Each is one college's outline read from the separate $40 SLO, PLO and objective pot, which is not this worker's to run. De Anza's SLO trial (#3145) is already in flight, so its courses may arrive without a new read; Merced (for AGAB M1002) and Canyons are the next two (COBIx, 6829696579 point 4). With the outlines in, the supervision courses can be compared with each other and, once the ACE rows are read, beside the JST recommendation's own description. MAP's ACE rows are public recommendations, not student data, so a one-time, read-only committed export of the Leadership and Supervision rows would let the next pass set them beside these M-IDs without widening the anon key; if that needs a key the runner lacks, it is a one-line ask for Sam.

## Partial or whole

This report reads the committed reads under `kb/course_outcomes/` (source: files; 27 hosts, 49404 rows). The committed reads hold every row the load receipts record, so this pass covers the outcomes the table held at the last load (18 colleges). A dispatch of `mid-outcomes-compare.yml` reads the table itself and rewrites this report, which matters once a load lands that was not filed here first.

