# MID re-clustering, Step 1: outcomes and objectives against the M-IDs (2026-11-12)

Issue #2962, COBIx's operational brief of 2026-11-12, Sam's go relayed by COBIx ("yes, let's roll!", cpl_memory sam-mid-reclustering-step-1-go-2026-11-12). A no-write comparison: nothing here changes an M-ID, a table or a generated file. Built by `kb/_mid_outcomes_compare.py`; every M-ID's result is in the JSON beside this file.

Source of the outcomes text: the committed reads under `kb/course_outcomes/` (source: files; 13 hosts, 17349 rows). Membership: `unified_courses_members.js` (generated 2026-11-12 11:51), descriptions `unified_courses_member_desc.js`, titles `unified_courses_index.js`, exhibit reach `unified_courses_aligned.js` and `kb/exhibits_review.json`, districts `kb/college_identity/2026-11-10/crosswalk.json`, subjects `kb/reference/subject_discipline_map.json`.

This report replaces the first run of this date (#3165, `41eeb44a`). COBIx read it and gave four findings (#2962, comment 6829696579), taken as given: the district guard now covers splits and merges, every case carries its exhibit reach, the cases for Sam are chosen by that reach, and a structural check reads subject codes. The first run's six cases stay below as examples, re-rated.

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

Thresholds: agree at 0.30; strong confirmation at a mean of 0.50 with a second signal; merge candidate at 0.55 across two M-IDs of one Common SUBJ; descriptions agree at 0.30; titles agree at a stem overlap of 0.50, and a strong merge of two titles that each name something the other lacks needs descriptions at 0.50. A course with fewer than 12 stems after stripping is thin and treated as having no text; 771 statements printed word for word by 4 or more courses were dropped as outline boilerplate.

Where the data is strong, the method agrees with the M-IDs: 5237 pairs of same-titled courses at two colleges inside one M-ID score a median of 0.261, and 40% of them reach the agree line. 385 sampled pairs of differently titled courses in different M-IDs of one Common SUBJ score a median of 0.041, and 3% of them reach it (95th percentile 0.233).

Confidence uses Sam's three match levels (Open Asks Sheet 181, 2026-11-11): strong, partial and limited. A split the outcomes alone propose is limited, a flag for a person, since an SLO never overrides on its own. A member with no text joins no group and is never the reason for a split. TOP and units are shown and read by nothing.

Blind spots. Word overlap misses a paraphrase: two colleges can teach the same course in different words and read as a weak pair, which is why a split needs a second signal. Shared vocabulary can join different levels of one subject (Spanish 1 and Spanish 2 use the same words), so a confirmation does not prove a level is right. Thin outlines (one or two statements) are set aside, not judged. Objectives exist for four colleges only, so most courses are read on SLOs alone.

One district is one voice. District outlines printed once for several colleges (RCCD, SDCCD, LACCD) agree by construction, so a pair of colleges inside one district counts as one voice everywhere: it never makes a confirmation strong or partial, a merge pair inside one district is limited, and a split is strong only when a group holds outlines from two or more districts. The district is the committed college identity crosswalk's (`kb/_college_identity_latest.py`); a college it does not name is its own voice. The calibration above counts only same-titled pairs from two districts.

## Counts by class and confidence (the 1857 M-IDs in scope)

| Class | Strong | Partial | Limited | All | First run (no district guard) |
|---|---|---|---|---|---|
| Confirmed | 33 | 215 | 430 | 678 | 557 (221 strong) |
| Split | 6 | 305 | 449 | 760 | 760 (19 strong) |
| Merge candidate | 17 | 54 | 0 | 71 | 221 (63 strong) |
| Not enough text | 0 | 0 | 0 | 348 | 319 |

What moved, and why: the district guard. A confirmation or a merge that rested on one district's shared outline is one voice now, so strong confirmations and merge candidates fall the most; an M-ID that had been a merge candidate only through such a pair returns to its own class. The guard changes a split's level, never whether its groups disagree, so the split count is unchanged; its strong splits fall where every group sat inside one district. A second correction moves the merges too: the first run read a title's level word alone, so *Elementary Spanish II* and *Spanish: Beginning I* read as one level and could pair; the level reader now reads the word and the numeral, and a lecture never pairs with its laboratory.

A Merge candidate here is an M-ID whose outcomes otherwise confirm it and whose courses also agree, at partial or strong, with a course in another M-ID of the same Common SUBJ. A Not enough text M-ID in scope holds two members with outcomes text, one or both too thin to judge.

Outliers. 2652 single-member M-IDs carry outcomes text; the outcomes place 30 of them beside a course in another M-ID of the same Common SUBJ at partial or strong, and leave 2622 alone.

## AGAB M1002, Agricultural Ambassadors

AGAB M1002 resolves to itself through `kb/alias_chain.py` (the maps applied after its era, 2026-11-08's anchor re-key the last). Its title in the index is *Agricultural Ambassadors - Public Relations*. Its 3 members, from Merced College: AGAB 31A Agricultural Ambassadors - Introduction, Merced College; AGAB 31C Agricultural Ambassadors - Public Relations, Merced College; AGAB 31B Agricultural Ambassadors - Recruitment, Merced College. Units 2, TOP 0112.00.

Class: Not enough text. fewer than two members print enough outcome text (0 of 3); a missing SLO counts against no one.

Merced's course outlines have not been harvested, so no outcome or objective is on file for any of the three. Read on descriptions alone, at limited confidence (the lower rung COBIx's brief allows), the description cosines are AGAB 31A and AGAB 31C 0.91; AGAB 31A and AGAB 31B 0.93; AGAB 31C and AGAB 31B 0.92 against the 0.30 agree line. The titles share the stem *Agricultural Ambassadors* and each names a different specialization. What the harvest needs: Merced's outline platform read for these three courses (one college, three outlines), the SLOs and objectives filed under `kb/course_outcomes/merced/`, then this script rerun.

> AGAB 31A (Merced College): "The purpose of this course is to introduce students to the Agricultural Ambassador program. Ambassadors promote agricultural awareness and educational opportunities in agriculture at Merced College and beyond. Students will learn the role of Ambassadors, develop their communication  and leadership s"

> AGAB 31C (Merced College): "The purpose of this course is to focus on the public relations role of the Agricultural Ambassadors as they promote agricultural awareness and educational opportunities in agriculture at Merced College and beyond. Students will learn the fundamentals of public relations, communication and leadership"

> AGAB 31B (Merced College): "The purpose of this course is to focus the recruitment role of the Agricultural Ambassadors as they promote agricultural awareness and _x000D_
educational opportunities in agriculture at Merced College and beyond. Students will learn the fundamentals of effective presentations, conduct  tours, plan "

## Cases for Sam, by exhibit reach

Sam's rule of 2026-11-12, relayed by COBIx (6829696579 point 2): order a batch by student blast radius, how many students or members of the public a correct call would help. The cases below come from the strong and partial splits and merges, ordered by exhibit reach first and strength second. Reach is the credit-by-exam credentials whose title comes from the M-ID, since a split or a rename retitles them; certifications keep their official names (Sam, 2026-11-12) and are shown, never counted (the two columns agreed on #3111, 6827702046). Of the 1857 M-IDs in scope, 199 carry credit-by-exam reach and 143 carry certifications; 24 strong or partial splits and 37 strong or partial merge pairs reach any credit-by-exam credential.

Potential-CPL blast radius. The repo holds no committed per-M-ID measure of the students or members of the public a call would reach: `prototype/ccr_cpl.json` and `unified_courses_aligned.js` count credentials and colleges, structural counts only, and students per title (`exhibit_title_students`) are a reviewer-only read in Supabase. So this report shows no such column and orders by credit-by-exam reach, the nearest committed measure; the earning colleges behind each credential are shown beside it.

| # | Case | Level | Credit-by-exam credentials | Earning colleges | Certifications (not counted) |
|---|---|---|---|---|---|
| 1 | AJ 160 split | partial | 3 | 9 | 1 |
| 2 | FIRE 130 X and FIRE M1274 merge | strong | 2 | 7 | 13 |
| 3 | REAL M1038 and REAL M1040 merge | partial | 2 | 7 | 8 |
| 4 | MATH M1036 and MATH M1044 merge | partial | 2 | 5 | 0 |
| 5 | MUS 130 split | partial | 2 | 3 | 0 |
| 6 | BUSI M1228 split | partial | 2 | 2 | 0 |

### 1. AJ 160, Community and the Justice System: proposed split (partial)

99 members, 95 colleges, units 0 to 4. outcomes and the descriptions say the groups differ; the titles do not.

Group A, proposed title *Community Relations* (Cabrillo College, Contra Costa College, Cuesta College, Las Positas College, Mission College, Moreno Valley College, Norco College, Riverside City College, Santa Ana College, Shasta College; 8 districts):
- Cabrillo College (CJ 5 Community and the Justice System): "Analyze the impact of racism on the criminal justice system."
- Cabrillo College (CJ 5 Community and the Justice System): "Identify, anticipate and pose problems relative to policing in a multicultural society."
- Contra Costa College (ADJUS 223 Community and the Justice System): "Students will analyze the history and evolution of multiculturalism in the U.S. and evaluate the challenges presented by a multicultural society."
- Contra Costa College (ADJUS 223 Community and the Justice System): "Students will identify and analyze social justice issues in local communities, specifically those affecting immigrants."
- Cuesta College (CJ 224 Community, Diversity And The Justice System): "Describe history and evolution of multiculturalism."
- Cuesta College (CJ 224 Community, Diversity And The Justice System): "Identify, assess and challenge biased based assumptions and behaviors within the criminal justice system."

Group B, proposed title *Community Relations And Special Issues In Criminal Justice* (Golden West College; 1 district):
- Golden West College (CJ G137 Community Relations And Special Issues In Criminal Justice): "Explore tactical communication/verbal persuasion concepts as they relate to: effective listening skills, techniques and strategies helpful in de-escalating crisis situations, diffusing conflict, and obtaining voluntary compliance in situations involving violent/combative/uncooperative persons."
- Golden West College (CJ G137 Community Relations And Special Issues In Criminal Justice): "List the difference between society’s cultural stereotyping and law enforcement profiling."

Group C, proposed title *Community Relations* (Modesto Junior College; 1 district):
- Modesto Junior College (ADJU 205 Community Relations): "Recognize why effective police-media relationships are important for the success of community policing partnerships."
- Modesto Junior College (ADJU 205 Community Relations): "Explain police-citizen partnerships and how this relationship directly affects the causation and prevention of crime."

No text, left where they are: AJ 105 Community Relations, Allan Hancock College; ADMJ 302 Community Relations: Multicultural Issues, American River College; AJ 201 Modern Policing in Society, Antelope Valley College; CRIM B5 Community Relations, Bakersfield College; ADJU 5 Community Relations of the Justice System, Barstow Community College; AJ 14 Community Oriented Policing, Butte College and 80 more.

Student test: someone who completed *Community Relations* would not be repeating *Community Relations And Special Issues In Criminal Justice*; their outcomes score at most 0.251 against each other, below the 0.30 agree line, and their descriptions score at most 0.14.

Exhibit reach: AJ 160: 3 credit-by-exam credentials titled from it (9 earning colleges), *Community and the Justice System*; *Community Relations*; *Community and Human Relations*; 1 certification, not counted, since a certification keeps its official name.

### 2. FIRE 130 X and FIRE M1274: proposed merge (strong)

FIRE 130 X, *Building Construction for Fire Protection* (23 members) and FIRE M1274, *Building Construction for Fire Protection* (28 members), one Common SUBJ. The closest pair across two districts: FST 6 Building Construction for Fire Protection, Las Positas College and FIPT 104 Building Construction for Fire Protection, San Diego Miramar College, outcomes 0.87, descriptions 0.64, titles 1.00; 4 course pairs reach the merge line.

- Las Positas College (FST 6 Building Construction for Fire Protection): "Analyze the hazards and tactical considerations associated with the various types of building construction."
- Las Positas College (FST 6 Building Construction for Fire Protection): "Explain the different loads and stresses that are placed on a building and their interrelationships."
- Las Positas College (FST 6 Building Construction for Fire Protection): "Identify major types of building construction."
- San Diego Miramar College (FIPT 104 Building Construction for Fire Protection): "Identify major types of building construction."
- San Diego Miramar College (FIPT 104 Building Construction for Fire Protection): "Identify the indicators of potential structural failure as they relate to firefighter safety."
- San Diego Miramar College (FIPT 104 Building Construction for Fire Protection): "Analyze the hazards and tactical considerations associated with the various types of building construction."

Student test: someone who completed FST 6 Building Construction for Fire Protection, Las Positas College would be repeating much of FIPT 104 Building Construction for Fire Protection, San Diego Miramar College; the two outlines name the same outcomes in close to the same words.

Exhibit reach: FIRE 130 X: 1 credit-by-exam credential titled from it (1 earning college), *Building Construction for Fire Protection*; 5 certifications, not counted, since a certification keeps its official name. FIRE M1274: 1 credit-by-exam credential titled from it (6 earning colleges), *Building Construction for Fire Protection*; 8 certifications, not counted, since a certification keeps its official name.

### 3. REAL M1038 and REAL M1040: proposed merge (partial)

REAL M1038, *Real Estate Practice* (52 members) and REAL M1040, *Real Estate Principles* (70 members), one Common SUBJ. The closest pair across two districts: RLE 81 Real Estate Practice, Riverside City College and RLES 380 Real Estate Principles, Modesto Junior College, outcomes 0.67, descriptions 0.36, titles 0.50; 5 course pairs reach the merge line.

- Riverside City College (RLE 81 Real Estate Practice): "Explain the laws and procedures that apply to the daily operations of California residential real estate brokerage."
- Riverside City College (RLE 81 Real Estate Practice): "Demonstrate the ability to analyze and resolve the procedural and ethical problems that arise in residential real estate brokerages."
- Riverside City College (RLE 81 Real Estate Practice): "Discuss real estate marketing and sales techniques."
- Modesto Junior College (RLES 380 Real Estate Principles): "Identify and define real estate terminology utilized in industry."
- Modesto Junior College (RLES 380 Real Estate Principles): "Explain laws and procedures that apply to the sale of California residential real estate."
- Modesto Junior College (RLES 380 Real Estate Principles): "Identify and assess ethical issues related to the real estate environment."

Student test: the two outlines name the same outcomes in close to the same words, so someone who completed RLE 81 Real Estate Practice, Riverside City College may be repeating much of RLES 380 Real Estate Principles, Modesto Junior College. The two titles each name something the other lacks (*Real Estate Practice*, *Real Estate Principles*), so before a merge a person checks whether a student takes both, as two required courses or two steps of one sequence; word overlap cannot tell.

Exhibit reach: REAL M1038: 1 credit-by-exam credential titled from it (1 earning college), *Real Estate Practice*; 4 certifications, not counted, since a certification keeps its official name. REAL M1040: 1 credit-by-exam credential titled from it (6 earning colleges), *Real Estate Principles*; 4 certifications, not counted, since a certification keeps its official name.

### 4. MATH M1036 and MATH M1044: proposed merge (partial)

MATH M1036, *College Algebra* (44 members) and MATH M1044, *College and Matrix Algebra* (3 members), one Common SUBJ. The closest pair across two districts: MATH G115 College Algebra, Golden West College and MATH 116 College and Matrix Algebra, San Diego Miramar College, outcomes 0.57, descriptions 0.27, titles 0.67; 2 course pairs reach the merge line.

- Golden West College (MATH G115 College Algebra): "List the potential rational zeros of a polynomial function, and find all zeros of a polynomial function without a graphing calculator."
- Golden West College (MATH G115 College Algebra): "Solve equations containing rational expressions."
- Golden West College (MATH G115 College Algebra): "Solve logarithmic and exponential equations."
- San Diego Miramar College (MATH 116 College and Matrix Algebra): "Analyze and graph polynomial, absolute value, piecewise-defined, rational, exponential and logarithmic functions, including finding zeros and determining domains and ranges."
- San Diego Miramar College (MATH 116 College and Matrix Algebra): "Solve applications problems that can be modeled by polynomial, absolute value, piecewise, rational, exponential or logarithmic functions."
- San Diego Miramar College (MATH 116 College and Matrix Algebra): "Solve applications problems that can be modeled by systems of linear equations or inequalities or non-linear equations or inequalities, using various techniques, including matrices and determinants."

Student test: someone who completed MATH G115 College Algebra, Golden West College would be repeating much of MATH 116 College and Matrix Algebra, San Diego Miramar College; the two outlines name the same outcomes in close to the same words.

Exhibit reach: MATH M1036: 1 credit-by-exam credential titled from it (2 earning colleges), *College Algebra*; 0 certifications, not counted, since a certification keeps its official name. MATH M1044: 1 credit-by-exam credential titled from it (3 earning colleges), *College and Matrix Algebra*; 0 certifications, not counted, since a certification keeps its official name; 1 more credit-by-exam credential reaches it under another title, not counted (*Basic Refrigeration & AC Lab*).

### 5. MUS 130, Music Theory II: proposed split (partial)

90 members, 88 colleges, units 3 to 5. outcomes and the descriptions say the groups differ; the titles do not.

Group A, proposed title *Music Theory and Musicianship II* (Cabrillo College, Columbia College, Contra Costa College, Cuesta College, Golden West College, Las Positas College, Modesto Junior College, Moreno Valley College, Norco College, Orange Coast College, Riverside City College, Santa Ana College, Shasta College; 9 districts):
- Cabrillo College (MUS 2 Comprehensive Music Theory II): "Demonstrate an understanding of basic form and harmony, including secondary dominants, modulation, cadences and non-harmonic tones."
- Cabrillo College (MUS 2 Comprehensive Music Theory II): "Compose music demonstrating characteristic techniques of Baroque and Classical musical styles."
- Columbia College (MUSIC 20B Elementary Music Theory): "Demonstrate a knowledge of musical notation including the grand staff, movable C-clefs, major and minor key signatures, and increasingly complex rhythmic structures."
- Columbia College (MUSIC 20B Elementary Music Theory): "Calculate precisely and interpret results in musical analysis using all major and minor scales, all intervals (including compound intervals and intervallic inversions), all diatonic triads and 7th/9th/11th/13th chords, and their corresponding Roman numerals/lead sheet symbols."
- Cuesta College (MUS 204A Music Theory Ii): "Write and identify any 7th chord in root position and inversion."
- Cuesta College (MUS 204A Music Theory Ii): "Using non-dominant 7th chords, secondary/applied chords, diatonic and modulating sequences, and modulation to closely-related keys: Realize a figured bass; harmonize a given melody."

Group B, proposed title *Music Theory II* (San Diego Mesa College; 1 district):
- San Diego Mesa College (MUSI 148B Music Theory II): "Students will develop Critical Thinking skills by demonstrating Recognition & realization of figured bass, and subsequent ability to critically analyze realized music via Roman numeral analysis and lead sheet chord symbols."
- San Diego Mesa College (MUSI 148B Music Theory II): "Students will develop Communication skills by recognizing and describing melodic elements and building chords."

No text, left where they are: MUS 151 Music Theory II, Antelope Valley College; MUSC B4A Elementary Theory, Bakersfield College; MUS 82 Theory and Musicianship II, Butte College; MUS 181 Music Theory/Musicianship II, Cerritos College; MUSIC 6 Music Theory and Musicianship II, Chaffey College; MUSE 104 Harmony II, Citrus College and 70 more.

Student test: someone who completed *Music Theory and Musicianship II* would not be repeating *Music Theory II*; their outcomes score at most 0.266 against each other, below the 0.30 agree line, and their descriptions score at most 0.25.

Exhibit reach: MUS 130: 2 credit-by-exam credentials titled from it (3 earning colleges), *AP Music Theory*; *Music Theory 2*; 0 certifications, not counted, since a certification keeps its official name.

### 6. BUSI M1228, International Documentation and Supply Chain Management: proposed split (partial)

24 members, 21 colleges, units 0 to 3. outcomes, descriptions and titles say the groups differ, but each college sits in one group, so different wording of one course is not ruled out.

Group A, proposed title *Global Supply Chain and Logistics* (Santa Ana College; 1 district):
- Santa Ana College (BUS 115 Global Supply Chain and Logistics): "Use and apply the current Incoterms."
- Santa Ana College (BUS 115 Global Supply Chain and Logistics): "Demonstrate the ability to calculate costs related to global shipping and logistics."

Group B, proposed title *Introduction to Supply Chain Management* (Modesto Junior College; 1 district):
- Modesto Junior College (LOGST 202 Introduction to Supply Chain Management): "Write problem-solving reports to effectively present supply chain factual data, analyses, and recommendations."
- Modesto Junior College (LOGST 202 Introduction to Supply Chain Management): "Examine, analyze and apply basic concepts and processes of Supply Chain Management in order to address hypothetical or real world supply chain issues."

No text, left where they are: BSAD B49C Supply Chain Management, Bakersfield College; BUSMGT 13 Supply Chain Management, Chaffey College; BUS 114 Supply Chain Management, College of Alameda; BUS M72 Supply Chain Management, Moorpark College; BUSM 53 Supply Chain Management, Mt. San Antonio College; VOC BM53 Supply Chain Management, Mt. San Antonio College and 16 more.

Student test: someone who completed *Global Supply Chain and Logistics* would not be repeating *Introduction to Supply Chain Management*; their outcomes score at most 0.019 against each other, below the 0.30 agree line, and their descriptions score at most 0.06.

Exhibit reach: BUSI M1228: 2 credit-by-exam credentials titled from it (2 earning colleges), *Supply Chain and Logistics*; *Supply Chain Management*; 0 certifications, not counted, since a certification keeps its official name.

## Two cases re-rated by the district guard

ITIS 140, *Introduction to Systems Analysis and Design*: the first run called it a strong split. Group A was Norco College CIS 2 and Riverside City College CIS 2, word for word one RCCD outline, set against Riverside City's own CSC 20, so every member with text sits in one district. Its class now: Split, partial. Outcomes, descriptions and titles say the groups differ and one college files courses in more than one group, but every group sits inside one district, so this is one district's catalog, and word overlap cannot tell a different course from a paraphrase.

BIOL M1094 and BIOL M1095, *General Biology* and *General Biology Honors*: the first run's 1.00 was Moreno Valley BIO 1 against Norco BIO 1H, one RCCD text. All 9 course pairs that reach the merge line sit inside one district, so the merge is limited now. What the pair shows is that RCCD writes its Honors course with its base course's outcomes; it does not show that the M-IDs should merge statewide.

## The candidate rules and their four examples

The first run's four clean cases stay as examples of two candidate rules, re-rated under the district guard. They hold.

Rule 1, a course from another subject inside an M-ID splits out. MATH 130 holds Cabrillo CHEM 5 and PH 101 holds Modesto GEOG 106. The rule is structural and the outcomes only confirm it, so it runs below as its own check on subject codes, with no outcome text needed.

Rule 2, an Honors section merges with its base course: a policy call for Sam. For a student it fits, since the outcomes match and nothing is repeated. C-ID and some articulation keep Honors separate, so the question for Sam is which he means: one M-ID for the base course and its Honors section, or two M-IDs with a declared equivalence between them. AGAS M1136 and M1140 is the merge example (Shasta and Cuesta, two districts); BIOL M1094 and M1095 is the Honors pair, limited until a second district's outlines say the same.

### Example: MATH 130, Finite Mathematics: proposed split (strong)

69 members, 58 colleges, units 3 to 5. outcomes, descriptions and titles all say the groups teach different things, one college files courses in more than one group, and a group holds outlines from two or more districts.

Group A, proposed title *Finite Mathematics* (Cabrillo College, Columbia College, Modesto Junior College, Shasta College; 3 districts):
- Cabrillo College (MATH 13 Finite Mathematics): "Demonstrate competency in performing matrix calculations and utilize matrices for applied problem solving."
- Cabrillo College (MATH 13 Finite Mathematics): "Analyze a financial problems and evaluate using formulas."
- Columbia College (MATH 12 Finite Mathematics): "calculate precisely and interpret results accurately, solving mathematical finance problems"
- Columbia College (MATH 12 Finite Mathematics): "communicate effectively, using appropriate terminology to discuss applications of linear programming and finance problems."
- Modesto Junior College (MATH 130 Finite Mathematics): "Effectively communicate, using appropriate mathematical notation, processes and strategies in solving level appropriate problems including set theory, probability and counting techniques, matrices and linear systems, and applications."
- Modesto Junior College (MATH 130 Finite Mathematics): "Analyze and solve level appropriate problems including set theory, probability and counting techniques, matrices and linear systems, and applications."

Group B, proposed title *Quantitative Analysis* (Cabrillo College; 1 district):
- Cabrillo College (CHEM 5 Quantitative Analysis): "Define the analytical problem, select a suitable method or technique, obtain a representative sample, prepare the sample for analysis, perform any necessary chemical separations, perform the measurement, calculate the results and submit reports."
- Cabrillo College (CHEM 5 Quantitative Analysis): "Solve analytical chemical problems, including stoichiometric calculations, gravimetric, volumetric, instrumental, separations and kinetic analysis."

No text, left where they are: MATH 124 Finite Math, Antelope Valley College; MATH B23 Finite Mathematics, Bakersfield College; MATH 12 Mathematics for Business Decisions (Finite Mathematics), Butte College; MATH 125 Elementary Finite Mathematics, Cañada College; MATH 115 Finite Mathematics, Cerritos College; MATH C130 Finite Mathematics, Cerro Coso Community College and 58 more.

Student test: someone who completed *Finite Mathematics* would not be repeating *Quantitative Analysis*; their outcomes score at most 0.171 against each other, below the 0.30 agree line, and their descriptions score at most 0.04.

Exhibit reach: MATH 130: 1 credit-by-exam credential titled from it (1 earning college), *Finite Mathematics*; 0 certifications, not counted, since a certification keeps its official name.

### Example: PH 101, Introduction to Public Health: proposed split (strong)

32 members, 29 colleges, units 3. outcomes, descriptions and titles all say the groups teach different things, one college files courses in more than one group, and a group holds outlines from two or more districts.

Group A, proposed title *Introduction to Public Health* (Cabrillo College, Columbia College, Cuesta College, Modesto Junior College, Orange Coast College, Riverside City College; 5 districts):
- Cabrillo College (HS 50 Introduction to Public Health): "Synthesize current research data and course content to make recommendations to address public health issues and health inequities."
- Cabrillo College (HS 50 Introduction to Public Health): "Analyze behavioral, social, and cultural factors that impact individual and population health and health disparities over the life course."
- Columbia College (HLTH 1 Introduction to Public Health): "Integrate into the community served by effectively evaluating and applying the determinants of health and illness of a culture and population within the public health realm using appropriate public health research methods and theory."
- Columbia College (HLTH 1 Introduction to Public Health): "Demonstrate knowledge of the roles of people, professions and agencies who undertake work in promoting public health and explain how these roles contribute to population health outcomes through evidence-based practice and preventative care."
- Cuesta College (PHS 210 Introduction To Public Health Science): "Define important foundational concepts in community/public health."
- Cuesta College (PHS 210 Introduction To Public Health Science): "Identify different public health disciplines, professions and organizations, and explain how each contributes to the field of public health."

Group B, proposed title *Geography of Health* (Modesto Junior College; 1 district):
- Modesto Junior College (GEOG 106 Geography of Health): "Identify and describe the global distribution of an infectious disease."
- Modesto Junior College (GEOG 106 Geography of Health): "Propose solutions to a community health issue."

No text, left where they are: ALH 3 Introduction to Public Health, Butte College; HED 102 Introduction to Public Health, Cerritos College; HO 102 Introduction to Public Health, Cerritos College; BIOS 18 Introduction to Public Health, Chabot College; HLTH 18 Introduction to Public Health, Chabot College; HS 40 Introduction to Public Health, Coalinga College and 19 more.

Student test: someone who completed *Introduction to Public Health* would not be repeating *Geography of Health*; their outcomes score at most 0.221 against each other, below the 0.30 agree line, and their descriptions score at most 0.28.

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

Group A, proposed title *Records Management* (Riverside City College, Shasta College; 2 districts):
- Riverside City College (CAT 62 Records Management): "Apply records information management filing, storage, and retrieval methods to physical records."
- Riverside City College (CAT 62 Records Management): "Apply records information management filing, storage, and retrieval methods to electronic records."
- Shasta College (BSOT 166 Records Management): "Explain the criteria by which records are created, stored, retrieved, retained, and disposed of."
- Shasta College (BSOT 166 Records Management): "Identify the procedures for the operation and control of manual and automated filing."

Group B, proposed title *Electronic Medical Records* (Shasta College; 1 district):
- Shasta College (BSOT 150 Electronic Medical Records): "Apply the principles of health insurance as they relate to health and accident insurance contracts."
- Shasta College (BSOT 150 Electronic Medical Records): "Effectively use insurance and patient billing software."

No text, left where they are: CBOT 302 Records Management, Allan Hancock College; BCIS 51 Records Management, Butte College; BT 6 Records Management, Fresno City College; BUS 18 Records Management, Lassen College; CAT 62 Records Management, Moreno Valley College; CBTE 205 Records Management, San Diego City College and 25 more.

Student test: someone who completed *Records Management* would not be repeating *Electronic Medical Records*; their outcomes score at most 0.099 against each other, below the 0.30 agree line, and their descriptions score at most 0.13.

Exhibit reach: BSOT M1209: 0 credit-by-exam credentials titled from it (0 earning colleges); 0 certifications, not counted, since a certification keeps its official name.

The likely call is a rename plus a split, not a split alone. The M-ID's index title is *Introduction to Electronic Health Records*, but most of its members, and the members with text, are *Records Management*. Rename the M-ID to the title its members carry, and split Shasta BSOT 150 *Electronic Medical Records* out.

## Structural check: a member from another subject

A member whose subject code names a different discipline from the rest of its M-ID, read from subject codes alone, with no outcome text (COBIx, 6829696579 point 3). A subject reads as a discipline only through `kb/reference/subject_discipline_map.json`, which leaves ambiguous codes null; TOP is never read (CLAUDE.md Rule 7). A member is flagged when at least three members map, one discipline holds more than half of them, the member's own discipline holds a quarter or less, and its title does not agree with the M-ID's title (an *Introduction to Public Health* filed under ALH is a prefix, not another course). The map is a staging draft and a cross-listed course (an ETHN literature course beside ENGL) is the discipline cross-listing lane's case, so each flag is a candidate for a person.

321 M-IDs hold 921 flagged members. 181 of those M-IDs are in this report's outcomes scope, where the outcomes class them: Confirmed partial 27, Confirmed limited 10, Split strong 2, Split partial 43, Split limited 82, Not enough text 17.

| M-ID | Title | Members | Discipline of the rest | Flagged members |
|---|---|---|---|---|
| MATH 130 | Finite Mathematics | 69 | Mathematics | BUS 119 Quantitative Methods, College of the Sequoias (Business); BUS 39 Quantitative Analysis, Lemoore College (Business); BUS 014A Mathematical Analysis for Business-Finite, Pasadena City College (Business); CHEM 5 Quantitative Analysis, Cabrillo College (Chemistry) and 3 more |
| PH 101 | Introduction to Public Health | 32 | Health | GEOG 106 Geography of Health, Modesto Junior College (Geography) |
| ESOL M9168 | Beginning ESL | 1785 | English as a Second Language | ENGL 71 Spelling I, College of Marin (English); ESL NC 006CE English as a Second Language - 0, Los Angeles Pierce College (English as a Second Language (ESL): Noncredit); ESL NC 006CE English As A Second Language - 0, Los Angeles Southwest College (English as a Second Language (ESL): Noncredit); ESL NC 006CE English as a Second Language - 0, Los Angeles Trade Technical College (English as a Second Language (ESL): Noncredit) and 111 more |
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
| ESOL M1141 | Advanced ESL | 472 | English as a Second Language | READ 78 Advanced Reading, Crafton Hills College (Reading); ESL NC 161CE College ESL VI: Writing and Grammar, East Los Angeles College (English as a Second Language (ESL): Noncredit); ESL NC 096CE College Esl Vi: Writing And Grammar, Los Angeles Harbor College (English as a Second Language (ESL): Noncredit); ESL NC 161CE College ESL VI: Writing and Grammar, Los Angeles Trade Technical College (English as a Second Language (ESL): Noncredit) and 3 more |
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

Sam, relayed by COBIx, 2026-11-12: "the 3 hours leadership is a gold mine on the surface waiting for its day." 485 M-IDs carry Leadership or Supervision in their title; 54 of them hold a member with outcomes text and 15 hold two or more. The military side, the JST 3-hour Leadership recommendation, is in no committed file this script reads: MAP's ACE recommendation rows live in Supabase (`map_college_cr_unit`, `source_code` ACE, per `docs/military_cr_reference_scope.md`), which the anon key is not known to read. This section stays on the committed data in every run, live or not, and nothing is widened for it; which of these M-IDs those recommendations land on is a read for a later pass.

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

What a good call needs: outlines from the colleges that hold most of these courses and have none on file, first College of the Canyons (32 courses), De Anza College (30 courses), Allan Hancock College (23 courses), Fresno City College (23 courses), East Los Angeles College (22 courses), Monterey Peninsula College (21 courses). Each is one college's outline read from the separate $40 SLO, PLO and objective pot, which is not this worker's to run. De Anza's SLO trial (#3145) is already in flight, so its courses may arrive without a new read; Merced (for AGAB M1002) and Canyons are the next two (COBIx, 6829696579 point 4). With the outlines in, the supervision courses can be compared with each other and, once the ACE rows are read, beside the JST recommendation's own description. MAP's ACE rows are public recommendations, not student data, so a one-time, read-only committed export of the Leadership and Supervision rows would let the next pass set them beside these M-IDs without widening the anon key; if that needs a key the runner lacks, it is a one-line ask for Sam.

## Partial or whole

This report reads the committed reads under `kb/course_outcomes/` (source: files; 13 hosts, 17349 rows). The committed reads hold every row the load receipts record, so this pass covers the outcomes the table held at the last load (18 colleges). A dispatch of `mid-outcomes-compare.yml` reads the table itself and rewrites this report, which matters once a load lands that was not filed here first.

