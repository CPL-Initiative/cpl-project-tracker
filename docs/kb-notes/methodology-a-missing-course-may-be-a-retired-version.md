---
title: A course missing from a program's state list may be on it in a retired version
created: 2026-10-11
updated: 2026-10-11
tags: [methodology, coci, program-requirements-harvest]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[program_requirements_harvest_lessons]]"
artifacts:
  - kb/reference/coci_program_course_file.csv.gz
  - chatbox/build_program_courses.py
  - kb/_build_roep_display.py
---

# A course missing from a program's state list may be on it in a retired version

When a college catalog prints a course for a program and the state's Program Course File seems not to list it, look
in the Program Course File under every status before calling it a catalog addition.

**The case (S359, Sam's Mt. San Antonio sample, 2026-10-11).** Five courses the catalog printed for five programs
(EMS 80, AGAG 1, KIN 24, CISP 71, ID 12) were each in the Program Course File on the same program, with status
**Inactive** and an older course control number. COCI's course list carried a newer, active version of each: the
paramedic program pointed at EMS 80 CCC000584685 (Inactive) while the current EMS 80 is CCC000616276. The college had
revised the course and never moved the program to the new version.

**Why a reading misses it.** The harvest's copy of the file keeps Active, Approved and Teachout rows only
(`KEEP_STATUS` in `chatbox/build_program_courses.py`), so the retired version never reaches the comparison, and the
catalog's course reads as one the state's file lacks. The raw export (`kb/reference/coci_program_course_file.csv.gz`)
keeps every status: Active, Inactive, Approved, Deleted, Draft, Revision, Teachout.

**What to show.** The course's COCI status on the program, the control number the program points at, and the current
version's control number, as a chip the college can act on (Sam: *"list them with a chip noting the Coci status so the
college can follow up if needed. Make this a rule for all such courses."*). The follow-up belongs to the college:
point the program at the current course in COCI.
