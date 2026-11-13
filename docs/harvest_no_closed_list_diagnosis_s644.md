---
title: Program requirements harvest — why 1,604 active programs have no closed list (S644)
date: 2026-11-13
tags: [reference, program-requirements, harvest, diagnosis]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
related:
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/harvest_wave3_diagnoses_s639]]"
---

# Why 1,604 active programs have no closed list

The gap census (`kb/_harvest_gap_census.py`, live run 2026-11-13 00:24Z) found 1,604 of the 6,758 active programs
without a passing record carry the cause *no closed list in the Program Course File*. The college reader keeps them,
marks them, and never reads them. This note says why the file holds no list for each. Every count below comes from
`python3 kb/_harvest_no_closed_list_diagnosis.py --census <the live census JSON>`, which writes
`kb/status/harvest_no_closed_list.json` (one reason per program). Guard: `tests/harvest_no_closed_list_diagnosis_test.py`.

## Where the closed list comes from

| Step | File or job | Date |
|---|---|---|
| Program Course File | `kb/reference/coci_program_course_file.csv.gz`, a CO bulk export, 401,163 rows, 121 college codes | 2026-07-16 |
| Program list | `tmc/source_data/coci_program_export_2026-06-17.csv` (`coci_college_programs`) | 2026-06-17 |
| Join | `chatbox/build_program_courses.py`: MIS college code to college name by two agreeing signals, then (college, control number); keeps a row when the program and the course are Active, Approved or Active - Teachout Only | on push |
| Load | `coci-offerings-sync.yml` writes `coci_program_courses` | on push |
| Read | `kb/_program_requirements_college.py` `college_programs`: every row for the college by name, grouped by control number | each capture |

`program-course-fetch.yml` is the unfinished fallback scraper (the Data Mart's DevExpress controls are not driven yet),
its cron is commented out, and it writes `coci_program_course_file.csv` and `coci_program_file.csv`, which no builder
reads: the build reads the `.csv.gz` and the program export glob.

## The join drops nothing

Rebuilt from the committed files, the payload gives 0 of the 1,604 a row, matching the live table the census read.
No control number matches after stripping leading zeros, none sits only under another college's code, and no program
has a kept row for a kept course that the build discards.

| Reason (one per program) | Programs |
|---|---:|
| The control number appears nowhere in the file, in any status | 1,274 |
| Every course the program lists is Inactive or Deleted | 269 |
| The file holds only a pending revision (Submitted, Review) | 36 |
| The file marks the program Inactive (retired after the June program list) | 25 |
| Only under another college's code | 0 |
| A kept row the build drops (a join bug) | 0 |

Of the 269, 13 have every retired course kept again at the college under the same subject and number (a new control
number), 40 some, 216 none.

## Who they are

| Award | Programs | | Approval date in the program list | Programs |
|---|---:|---|---|---:|
| Local degree (A.A., A.S.) | 746 | | Jan 1 before 2010 (the legacy load's placeholder) | 650 |
| Certificate, 18 units or more | 375 | | No date | 457 |
| Noncredit program | 155 | | 2010 to 2019 | 383 |
| Certificate, 30 to under 60 units | 99 | | 2020 to 2025 | 109 |
| Award blank | 83 | | 2026 | 5 |
| Transfer degree (ADT) | 63 | | | |
| Certificate, 16 to under 30 units | 49 | | | |
| Certificate, 12 to under 18 units | 16 | | | |
| Certificate, 8 to under 16 units | 16 | | | |
| Baccalaureate | 2 | | | |

Credit 1,449, noncredit 155. Noncredit programs take a different reason: 146 of the 155 list only retired courses
(Los Angeles Southwest 26). The 1,274 absent programs are mostly local degrees and large certificates. 101 colleges
hold them; East Los Angeles 87, Skyline 86, Sierra 65, Marin 61, El Camino 54, Cañada 52, Pasadena 48, Allan Hancock
47, San Francisco 46, Mt. San Antonio 41.

**They are older than the file, not newer.** Among every Active program whose control number the file names, 9.3%
(1,753 of 18,878) carry the pre-2010 Jan 1 placeholder; among those it never names, 50.4% (707 of 1,404). The file's
highest control number (46691) is above the program list's (46587). A fresh Program Course File would add only the
lists colleges have entered since July for programs COCI loaded without one.

## Another closed universe

Every one of the 1,604 sits at a college whose courses are in the COCI course list (`coci_course_list.xlsx`), and
1,358 (1,234 of the absent) state major or certificate units in the program list.

## What the reader would do today

All 1,604 are filed with method `no_closed_list` and no source: the capture never looked for their pages, so the
committed captures cannot say whether a page exists.
