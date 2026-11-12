---
title: Program requirements harvest — wave 3 diagnoses (S639 side session)
date: 2026-11-12
tags: [reference, program-requirements, harvest, diagnosis, side-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
related:
  - "[[docs/harvest_side_handoff_s639]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/program_requirements_harvest_lessons]]"
---

# Wave 3 diagnoses: San Bernardino Valley, Grossmont, East Los Angeles

Three read-only diagnoses the S639 side session ran between 01:25Z and 01:55Z on 2026-11-12, carried here from the
session's scratchpad, which does not survive the container. None is started. Nothing below has been written into
`kb/program_requirements_reconcile.json` or `kb/college_reads/`: each plan and step is a draft for the worker who
takes the college.

**Live at 01:20Z 2026-11-12:** San Bernardino Valley 146 of 200 pass, Grossmont 99 of 140, East Los Angeles 92 of 133.
The figures below are the diagnoses' own, counted on each college's filed records under
`kb/program_requirements_college/<slug>/records/`, which can differ from the live rows (each section says how).

**Before any step: two scorer readings, one writer, each measured at every college first** (the method of
`d-hours-meets-top-term-length-s639`: build it, run `main`'s scorer and the branch's on every filed record, and
narrow it to the cause you can state). (1) A noncredit total printed *Total Hours N-M* with no colon and no hours on
any course (San Bernardino Valley's 19; East Los Angeles's noncredit cause is different, see there). (2) The
electives flag honored where a reconcile step filed the catalog's own sentence that prints no word *elective*
(Grossmont 22, East Los Angeles 19). The Grossmont diagnosis names the new field `electives_fill_words`, the East Los
Angeles one `electives_line_printed`: the writer picks one name for both. Each sits beside Sam's narrow `meets` ruling
(Sheet 120 card 1) without changing it, and is recorded as a session decision for Sam to revise.

**The order of work for each college:** the free page reads below (a push adding the plan under `kb/college_reads/`
runs it), the step patterns checked against the read's own words, the scorer reading (if any) merged first, then
`program-requirements-college.yml` with `step=reconcile`, `extract=0`, `college=<the full name>`, then `step=reread`
with `force=<the reconcile run>`. No paid extraction is needed for any live failure at the three colleges.

## San Bernardino Valley College

**Verdict.** Go: three free page reads, then two existing set steps, the existing prefix_aliases key and one narrow new noncredit reading, which together move 33 of 200 (16.5%; 146 to 179 in simulation) with no paid extraction.

**Filed:** 225 records, 79 failing. **Simulated after the fixes:** 179 passing.

**Filed against live.** The folder files 225 records and 79 of them fail. 25 of the failures place none of their listed courses, so the load leaves them out (places_none). 24 of those are coverage-0 records read off the wrong page (04881, 04922, 04926, 09267, 09378, 16966, 22732, 22754, 22756, 22784, 22787, 22792, 22799, 22803, 22806, 22809, 22816, 22818, 22831, 22833, 31858, 32317, 39236, 41789); the 25th is 19002. That leaves 200 records, which matches the live count. Rescoring those 200 in memory gives 146 pass and 54 fail, the same as live. The filed causes match live exactly. 12 degrees read incomplete: the 11 GE records plus 04873. 21 certificates read incomplete: 19 noncredit plus 12198 and 22821. 12 degrees read unequal: 04894, 09255, 16509, 17829, 31886, 31927, 32309, 32595, 35802, 39483, 43049, 44567. 6 certificates read unequal: 12197, 22771, 22776, 22820, 35833, 44013. 5 fail coverage: 31886, 32309, 39404, 40833, 41756. Two of the coverage five are also unequal, so the distinct total is 54. summary.json still says passed_machine_checks 142; that file is older than the records' scores, which give 146.

### Causes

#### 1. Local A.A./A.S. degrees name the 60 and the 'SBVC General Education and Graduation Requirements or Cal-GETC' pattern but carry no GE units (degree check: incomplete)

- **Count:** 11; **expected gain:** 11.
- **Sample control numbers:** 04860, 04869, 04882, 04921, 04934, 09249, 09270, 09328, 09329, 09335, 14523.
- **The catalog's words found:** Quoted by the reading in each record's notes (the page text itself is not filed). Biology 04860: 'To graduate with the A.S degree in Biology, students must complete the following required courses plus the general breadth requirements for the Associate's Degree (minimum total = 60 units).' Real Estate 04869: 'required courses plus the general breadth requirements for the Associate Degree (total = 60 units)'. Pharmacy 09335: 'required courses plus the general education requirements (minimum total = 60 units)'. The pattern as recorded in ge_pattern: 'SBVC General Education and Graduation Requirements or Cal-GETC - California General Education Transfer Curriculum'. Every note says 'no GE units printed'. The SBVC GE total is printed nowhere in the filed files, and neither is Cal-GETC's total in SBVC's own words.
- **Where printed:** kb/program_requirements_college/san_bernardino_valley/records/<cn>.json → record.notes and record.program.ge_pattern. 7 records quote '(minimum total = 60 units)': 04860, 04882, 04921, 09249, 09329, 09335, 14523. 4 quote '(total = 60 units)': 04869, 04934, 09270, 09328. The GE figures need read kb/college_reads/san_bernardino_valley_ge_units.json.
- **Words already filed:** no.
- **Fix:** Two existing 'set' steps, both gated awards 'local'. First, ge_units from SBVC's own GE page plus SBVC's own Cal-GETC page (min = the SBVC pattern's total, max = Cal-GETC's total). Second, degree_total_minimum from the degree pages' '(minimum total = 60 units)' / '(total = 60 units)', with the associate degree requirements page as the authority for calling 60 a floor (the Columbia precedent). No new kind is needed. The figures wait on the free read.

Proposed steps:

```json
[
  {
    "kind": "set",
    "field": "ge_units",
    "value": {
      "min": "<SBVC GE total from read san_bernardino_valley_ge_units>",
      "max": "<Cal-GETC total as SBVC's own Cal-GETC page prints it>"
    },
    "awards": "local",
    "pattern": "SBVC\\s+General\\s+Education\\s+and\\s+Graduation\\s+Requirements\\s+or\\s+Cal-?GETC",
    "source": "<SBVC GE page address the read finds under https://catalog.valleycollege.edu/general-education-graduation-requirements/>",
    "source_words": "<the GE page's own total sentence and the Cal-GETC page's (https://catalog.valleycollege.edu/general-education-graduation-requirements/transfer-information/cal-getc/), from the read's log>"
  },
  {
    "kind": "set",
    "field": "degree_total_minimum",
    "value": true,
    "awards": "local",
    "pattern": "\\((?:minimum\\s+)?total\\s*=\\s*60\\s+units\\)",
    "source": "<SBVC associate degree requirements page address the read finds>",
    "source_words": "<the degree pages' '(minimum total = 60 units)' / '(total = 60 units)' as the capture reads them, and the requirements page's own minimum-of-60 sentence>"
  }
]
```

#### 2. Noncredit certificates print only 'Total Hours N-M'; each course shows 0 in the UNITS column and no hours (arithmetic: incomplete)

- **Count:** 19; **expected gain:** 19.
- **Sample control numbers:** 35699, 35700, 36070, 37788, 38002, 38006, 38013, 38014, 38015, 39191, 39192, 39193, 39194, 40280, 41949, 41950, 41951, 44819, 45878.
- **The catalog's words found:** Quoted by the reading in notes. 35699: "Noncredit certificate counted in hours: 'Total Hours 48-54' recorded as total_units 48-54 (hours)." and 'The course list prints 0 in a UNITS column beside each course; these are credit units, not hours, so per-course hours are recorded as null. The page prints no per-course hours.' All 19 say the same, with their own ranges (e.g. 36070 'Total Hours 108', 38006 'Total Hours 1040-1170'). The exact separator between 'Total Hours' and the figure is not in the filed files.
- **Where printed:** records/<cn>.json → record.notes and record.program.total_units (measure 'hours'). The exact text needs read kb/college_reads/san_bernardino_valley_noncredit_hours.json.
- **Words already filed:** yes.
- **Fix:** No existing step kind covers this. This is a scorer reading. hours_total_only (kb/_program_requirements_score.py, S422) passes a page that prints only a total. But HOURS_LABEL needs a colon ('Total Contact Hours: 288') and compares the low end only. SBVC prints the course list's total line with no colon, and as a range. The fix needs either a narrow new per-college reconcile kind, 'hours_total', setting a flag the scorer reads, or a wider HOURS_LABEL that compares both ends (that change reaches every college and must be re-measured). Either way, keep the guard that a page printing any course hours still fails.

Proposed steps:

```json
[
  {
    "kind": "hours_total",
    "pattern": "Total\\s+Hours[\\s:]*(?P<min>\\d+(?:\\.\\d+)?)(?:\\s*[-\\u2013]\\s*(?P<max>\\d+(?:\\.\\d+)?))?",
    "source_words": "<the course list's total line as read san_bernardino_valley_noncredit_hours prints it, e.g. Job Readiness Skills 35699 'Total Hours 48-54' over a UNITS column of 0>",
    "_new_kind": "only in a record measured in hours whose courses and blocks carry no figure, where both ends equal the record's total_units and the page prints no other hours figure: sets program.hours_total_printed, and the scorer passes it as equal with total_only"
  }
]
```

#### 3. The catalog prints a subject prefix where the state file lists another (ANTH/ANTHRO, SOCI/SOC, CDEV/CD, ARTH/ART), so courses read missing and invented (coverage / invented)

- **Count:** 5; **expected gain:** 3.
- **Sample control numbers:** 39404, 40833, 41756, 31886, 32309.
- **The catalog's words found:** From the reading's notes. 39404: 'The catalog prints ARTH 105, ARTH 107 and ARTH 108 where the closed list has ART 105, ART 107 and ART 108 with identical titles.' 40833: 'ANTH 102/102H matched to ANTHRO 102/102H, SOCI C1000/C1000H to SOCIC1000/SOCIC1000H, SOCI 110/110H to SOC 110/110H, SOCI 141/141H to SOC 141/141H'. 41756: 'CDEV = CD / CDEVC1000, ANTH = ANTHRO, SOCI = SOC'. 32317: 'The catalog now prints course codes with the CDEV subject (e.g., CDEV 108, formerly CD 108)'. 32309: 'ANTH 102/ANTH 102H; matched to closed-list ANTHRO 102/ANTHRO 102H (same title)'.
- **Where printed:** records/39404.json, 40833.json, 41756.json, 32309.json, 32317.json → record.notes; score.coverage.unexplained and score.invented.codes. Titles to confirm with read kb/college_reads/san_bernardino_valley_prefixes.json and the live coci_program_courses titles.
- **Words already filed:** yes.
- **Fix:** The existing prefix_aliases key, which the scorer reads without page text. It never renames a code the state file lists as printed, so ARTH C1100 and SOCI C1000 stay as they are. 31886 and 32309 also fail arithmetic, so the gain is 3. With every alias confirmed, the gain is 3 of 200 (1.5%): under 3% alone, but it costs nothing alongside the other two fixes. with_renumbers also feeds the aliases back into the capture, which may help the held-out CD-coded programs (32317) find their own page. One side effect to check: the ART→ARTH back-map gives every listed ART course a printed 'ARTH' twin; net_hits counts either code.

Proposed steps:

```json
{
  "prefix_aliases": {
    "ANTH": "ANTHRO",
    "SOCI": "SOC",
    "CDEV": "CD",
    "ARTH": "ART"
  }
}
```

#### 4. '&' pair rows printed with one figure for the pair (Music applied, GEOL/OCEAN/PHYSIC/BIOL sequences), read differently on each page (unequal)

- **Count:** 7; **expected gain:** 0.
- **Sample control numbers:** 04894, 35802, 31927, 32595, 17829, 39483, 44567.
- **The catalog's words found:** From notes. 04894: "The applied row prints 'MUS 141X2 & MUS 241X2' with a single '1' beside the pair". 32595: 'OCEAN 101 & OCEAN 111 are printed as a combined pair with 4 units for both together'. 17829: 'The physics sequences block prints a combined total of 8-12'. 39483: 'The catalog prints no units beside the biology sequences'.
- **Where printed:** records/<cn>.json → record.notes
- **Words already filed:** yes.
- **Fix:** No existing kind fits. and_units sets the second course of an '&' row to 0. That helps only an 'all' list where the first course carries the figure. Here the pairs sit inside choose blocks, or both courses carry no units, so and_units would add a 0-unit choice or do nothing. Each record would need its own reading. The cause is heterogeneous and stands as filed under the stopping rule.

#### 5. A 'Complete a minimum of N units' work-experience block over one variable-unit course (FTVM 098 / KIN 098, 0.5-4) leaves the printed range's top unreached (unequal)

- **Count:** 3; **expected gain:** 0.
- **Sample control numbers:** 09255, 16509, 44013.
- **The catalog's words found:** From notes. 44013: 'Work Experience block requires a minimum of 1 unit of KIN 098 (0.5-4 units variable); no block total printed.' The printed totals: 09255 and 16509 'Total Units 30-31'; 44013 '16-19'.
- **Where printed:** records/09255.json, 16509.json, 44013.json → record.notes and record.program.total_units
- **Words already filed:** yes.
- **Fix:** No existing kind reads a choose_units minimum block's top as the course's maximum. A new reading would move 3 of 200 (1.5%), under the 3% stopping rule. These stand as filed.

### Page-read plans

**`kb/college_reads/san_bernardino_valley_ge_units.json`.** It settles SBVC's own GE pattern total and Cal-GETC total, the two ends of the ge_units step, so no figure comes from another college. It also settles whether the catalog calls the 60 a minimum (the degree_total_minimum step) and whether a course may count twice. Finally, it gives the exact words the two step patterns must match. Where the addresses come from: sitemap.xml is the capture's own (capture.json sitemap.url); the Cal-GETC address is record 04922's source_url; the section root is that address's parent path in the catalog's own navigation, and the sitemap read confirms or replaces it; Biology and Real Estate are the source_url values of 04860 and 04869.

```json
{
  "_readme": "San Bernardino Valley College, first read (diagnosis 2026-11-12). Eleven local A.A. and A.S. records name the degree's 60 and 'SBVC General Education and Graduation Requirements or Cal-GETC' with no units for either pattern; seven of them quote '(minimum total = 60 units)' and four '(total = 60 units)' (record notes). This read finds the catalog's general education and associate degree pages in its own site map, prints the section the filed Cal-GETC address sits in and the Cal-GETC page itself (the address record 04922 was extracted from), and prints two degree pages as the capture reads them, so a step's pattern is written on the words the reconcile will search. Asked: the SBVC General Education pattern's total units and any graduation requirement units; Cal-GETC's total as SBVC prints it; whether the catalog calls the associate degree's 60 a minimum; whether it lets a course count for the major and general education both. No model call.",
  "college": "San Bernardino Valley College",
  "questions": {
    "ge_address": "The catalog addresses of the SBVC General Education pattern, the graduation requirements and the associate degree requirements, from the catalog's own site map.",
    "local_ge_units": "What the SBVC General Education and Graduation Requirements page prints: areas, each area's units, and a total.",
    "cal_getc_units": "Whether SBVC's own Cal-GETC page prints a total (34) in its own words.",
    "degree_minimum": "Whether the catalog states the associate degree's 60 units as a minimum, and whether electives make up the rest.",
    "double_count": "Whether the catalog says a course may count toward the major and general education both.",
    "degree_page_words": "The exact words two degree pages print for the 60 and the GE pattern, as the capture reads them."
  },
  "keywords": [
    "https://catalog\\.valleycollege\\.edu/[^<\\s\"]*(?:general-education|graduation|associate-degree|degree-requirements|cal-getc)[^<\\s\"]*",
    "[Gg]eneral [Ee]ducation[^\\n]{0,200}",
    "[Gg]raduation [Rr]equirement[^\\n]{0,200}",
    "[Mm]inimum[^\\n]{0,160}",
    "total\\s*=\\s*60[^\\n]{0,80}",
    "60 (?:semester |degree[- ]applicable )?units[^\\n]{0,160}",
    "[Tt]otal[^\\n]{0,100}",
    "[Dd]ouble[- ]?count[^\\n]{0,160}",
    "[Ee]lective[^\\n]{0,160}",
    "Cal-?GETC[^\\n]{0,160}"
  ],
  "pages": [
    {
      "answers": [
        "ge_address"
      ],
      "url": "https://catalog.valleycollege.edu/sitemap.xml"
    },
    {
      "answers": [
        "local_ge_units",
        "degree_minimum",
        "double_count"
      ],
      "url": "https://catalog.valleycollege.edu/general-education-graduation-requirements/",
      "follow": "General Education|Graduation Requirement|Associate Degree|SBVC General"
    },
    {
      "answers": [
        "cal_getc_units"
      ],
      "url": "https://catalog.valleycollege.edu/general-education-graduation-requirements/transfer-information/cal-getc/"
    },
    {
      "answers": [
        "degree_page_words"
      ],
      "capture_view": true,
      "url": "https://catalog.valleycollege.edu/degree-certificate-program-index/biology/biology-as-degree/"
    },
    {
      "answers": [
        "degree_page_words"
      ],
      "capture_view": true,
      "url": "https://catalog.valleycollege.edu/degree-certificate-program-index/real-estate/real-estate-aa-degree/"
    }
  ]
}
```

**`kb/college_reads/san_bernardino_valley_noncredit_hours.json`.** It settles the exact characters of the total line, which fix the hours_total pattern or the wider HOURS_LABEL. It also settles whether any course prints hours on the page or in its courses tab. If one does, the total-only reading stays closed and the cause needs per-course hours instead. Both addresses are filed source_url values (35699 and 39194).

```json
{
  "_readme": "San Bernardino Valley College, noncredit hours (diagnosis 2026-11-12). All 19 of the college's noncredit records fail as incomplete: each states the page's 'Total Hours N-M' and lists its courses without hours, the course table printing 0 in its UNITS column (record notes, e.g. 35699 'Total Hours 48-54'). The scorer's total-only reading (hours_total_only, S422) reads only a label followed by a colon ('Total Contact Hours: 288') and the low end alone. This read prints two pages as the capture reads them and as plain pages, to see the exact separator and range the course list's total line carries, and whether any course, on the page or its courses tab, prints its own hours (which would keep the total-only reading closed). No model call.",
  "college": "San Bernardino Valley College",
  "questions": {
    "total_line": "The exact characters of the course list's total line ('Total Hours', separator, figure or range) as the capture's text holds it.",
    "course_hours": "Whether any course on the page or its courses tab prints its own hours (lecture, lab, contact hours).",
    "other_figures": "Every other hours or units figure the captured text carries."
  },
  "keywords": [
    "Total Hours[^\\n]{0,40}",
    "[Hh]ours?[^\\n]{0,80}",
    "\\b\\d+(?:\\.\\d+)?(?:\\s*[-\\u2013]\\s*\\d+(?:\\.\\d+)?)?\\s*(?:hours?|hrs?|units?)\\b[^\\n]{0,80}",
    "[Ll]ecture[^\\n]{0,80}",
    "[Ll]ab(?:oratory)?[^\\n]{0,80}",
    "listsum[^<]{0,160}",
    "hourscol[^<]{0,160}"
  ],
  "pages": [
    {
      "answers": [
        "total_line",
        "course_hours",
        "other_figures"
      ],
      "capture_view": true,
      "url": "https://catalog.valleycollege.edu/degree-certificate-program-index/vocational-education/job-readiness-skills-certificate-completion/"
    },
    {
      "answers": [
        "total_line",
        "course_hours",
        "other_figures"
      ],
      "url": "https://catalog.valleycollege.edu/degree-certificate-program-index/vocational-education/job-readiness-skills-certificate-completion/"
    },
    {
      "answers": [
        "total_line",
        "course_hours",
        "other_figures"
      ],
      "capture_view": true,
      "url": "https://catalog.valleycollege.edu/degree-certificate-program-index/water-supply-technology/basic-waterworks-certificate-completion/"
    }
  ]
}
```

**`kb/college_reads/san_bernardino_valley_prefixes.json`.** It settles the catalog's own title and units for each aliased course, to compare with the state file's title under the other prefix (the Delta precedent: same number and title). The read is optional, because the notes already record the match. The addresses are the source_url values of 40833, 41756 and 39404.

```json
{
  "_readme": "San Bernardino Valley College, subject prefixes (diagnosis 2026-11-12). Five transfer-degree records fail coverage or the invented check because the catalog prints ANTH 102, SOCI 110, SOCI 141, SOCI 130, CDEV 111, CDEV 126, CDEV 138, CDEV 160, ARTH 105, ARTH 107 and ARTH 108 where the state's file lists ANTHRO, SOC, CD and ART under the same numbers (record notes on 32309, 40833, 41756, 39404; 32317 notes 'CDEV 108, formerly CD 108'). This read prints each course row's code, title and units on three pages, so each prefix_aliases pair is cited by the title and units both print. No model call.",
  "college": "San Bernardino Valley College",
  "questions": {
    "prefix_titles": "The title and units each page prints beside ANTH 102, SOCI 110, SOCI 141, SOCI 130, CDEV 111, CDEV 126, CDEV 138, CDEV 160, ARTH 105, ARTH 107 and ARTH 108."
  },
  "keywords": [
    "ANTH\\s*102H?[^\\n]{0,100}",
    "SOCI\\s*1(?:10|30|41)H?[^\\n]{0,100}",
    "CDEV\\s*1(?:11|26|38|60)[^\\n]{0,100}",
    "ARTH\\s*10[578][^\\n]{0,100}"
  ],
  "pages": [
    {
      "answers": [
        "prefix_titles"
      ],
      "capture_view": true,
      "url": "https://catalog.valleycollege.edu/degree-certificate-program-index/history/history-aa-t-degree/"
    },
    {
      "answers": [
        "prefix_titles"
      ],
      "capture_view": true,
      "url": "https://catalog.valleycollege.edu/degree-certificate-program-index/child-development/child-adolescent-development-aat-degree/"
    },
    {
      "answers": [
        "prefix_titles"
      ],
      "capture_view": true,
      "url": "https://catalog.valleycollege.edu/degree-certificate-program-index/art/studio-arts-aa-t-degree/"
    }
  ]
}
```

### What needs a scorer reading or a new kind

One, for the 19 noncredit certificates. The scorer's total-only reading (hours_total_only) accepts only 'Hours:' with a colon and checks only the low end. SBVC prints 'Total Hours N-M' with no colon. Recommended: a narrow per-college kind, 'hours_total'. It applies only to a record measured in hours whose courses and blocks carry no figure. It requires both ends of the printed line to equal total_units and no other hours figure on the page. It sets a flag the scorer passes as 'equal' with total_only, which keeps the status string consumers accept, per the S422 rule that a new pass shape is equal plus a flag. The alternative is widening HOURS_LABEL to a tab or space separator plus a range checked at both ends. That reaches every college and would need a cross-college re-measure first. The other two fixes use existing kinds: 'set' for ge_units and degree_total_minimum, and the prefix_aliases key.

### The reconcile entry

kb/program_requirements_reconcile.json has no San Bernardino Valley College entry (18 colleges, this one not among them). The proposed entry has no college-level awards gate, so a later noncredit step is not held out; that was the Redwoods lesson from S636. Each degree step carries awards 'local' instead. Proposed entry: {"San Bernardino Valley College": {"why": "<diagnosis, reads, simulation>", "prefix_aliases": {"ANTH": "ANTHRO", "SOCI": "SOC", "CDEV": "CD", "ARTH": "ART"}, "steps": [the ge_units set, then the degree_total_minimum set, as in the first cause]}}. Drafts are at the side session's scratchpad (not durable), san_bernardino_valley/steps.json, ge.json, nc.json and px.json; nothing was written into the repo.

### Paid extraction

None for the 54 live failures. Every proposed fix is free: three page reads, then step=reconcile (a fresh capture, no model call), then step=reread. The prefix aliases and the noncredit reading are scorer-side, so the reconcile run's rescore path picks them up. The only paid work in sight is outside the live set: the 25 held-out records (24 read off the wrong page, plus 19002) need a capture fix first. Re-extracting them would then cost about $0.07 each at this college's filed rate of $0.0686 a program, roughly $1.70. That is optional and not part of this diagnosis.

### Unknowns

1. The page text is not filed. The college folder holds no source text, and the reconcile reads a fresh capture. Every 'catalog word' here is the reading's quotation in record.notes, not raw page text. Patterns must be checked against the reads before any dispatch.
2. The SBVC GE total and SBVC's own Cal-GETC figure are printed nowhere in the filed files. The ge_units values are placeholders until the read.
3. The local GE page's address: only the Cal-GETC page (from 04922) is filed. The section root in the plan is that address's parent path; the sitemap read confirms or replaces it.
4. Whether '(total = 60 units)' (04869, 04934, 09270, 09328) may take the floor rests on the associate degree requirements page saying 'minimum'. Without the floor, only 4 of the 11 pass (with an SBVC GE minimum of 21 or less) or 3 (24 or more).
5. The noncredit total line's exact separator, and whether any course or the courses tab prints hours, are unknown until the read. If a course prints hours, that cause needs per-course hours, not the total-only reading.
6. How the simulation works and what it cannot see:
   - It rebuilds each closed list from the filed score (placed minus invented, plus missing) with units unknown, because the closed list comes from Supabase coci_program_courses, which was not read.
   - It reproduces 196 of the 200 filed verdicts. 04894, 31927, 38137 and 39519 depend on listed units, so they are pinned at their filed verdict.
   - The text checks (outcomes, careers, the ELECTIVE guard) are carried from the filed score.
   - The GE and floor steps are applied as field changes where the record's notes quote the words, not as regex matches on page text.
   - The noncredit reading was checked by patching HOURS_LABEL in memory and passing a synthetic 'Total Hours<TAB>N-M' line; all 19 read equal with total_only.
7. The prefix aliases rest on the reading's title matches. The live coci_program_courses titles were not read.
8. The 21 records left after the fixes stand as filed:
   - 7 '&' pair readings and 3 variable work-experience blocks (no existing kind; the 3 are under 3%).
   - The 2 automotive certificates whose list reads 'or place into a transfer-level MATH course' at 0-4 units (22771, 22776).
   - Communication Studies 31886 and 43049, where the catalog's 'Three courses' heading disagrees with its own 6 units.
   - Single misreads: 04873, 12197, 12198, 22820, 22821, 32309, 35833.

## Grossmont College

**Verdict.** Go on cause A: one cause, 22 of 41 live failures (15.7%), all resting on the catalog's own sentence 'Complete transferable units as needed to reach 60'. It needs a small scorer change plus a `set` step, simulated at 99 to 121 passing. Park causes B and C (2 and 4 records, each under 3%) unless the free read gives their words at no extra cost. The rest stand as filed.

**Filed:** 144 records, 45 failing. **Simulated after the fixes:** 121 passing.

**Filed against live.** Filed: 144 records, 99 pass, 45 fail (records/*.json, extraction runs 39061728041 for 138 and 39753931343 for 6). summary.json still reads 97 passing because it was written before run 39753931343 re-read 6 records. Live: 140 rows, 99 pass, 41 fail. The 4 records filed but not loaded are the ones that place none of their listed courses, and the load leaves those out: 08767 (A.A., Media Comm Video Production, page university-studies-communication-language-arts-aa), 32017 (AS-T Administration of Justice, assigned to general-education-transfer/), 21402 (English certificate, text cut at 'Certificate o'), 32879 (Photography certificate). Removing them reconciles exactly with the live counts. Degrees incomplete: 29 filed minus 08767 and 32017 = 27. Certificates incomplete: 4 = 21380 and 44098 plus the two noncredit drone programs 43080 and 43081 (the live count puts noncredit programs with certificates). Degrees unequal: 10 = 10.

### Causes

#### 1. A. Transfer degree: the scorer's electives guard. The reading set electives_fill_degree from 'Complete transferable units as needed to reach 60', and the page never uses the word 'elective'

- **Count:** 22; **expected gain:** 22.
- **Sample control numbers:** 30977, 31814, 31963, 32005, 32019, 32186, 32208, 32210, 32220, 32784, 33211, 33212, 33279, 33384, 33614, 35721, 36759, 37519, 38191, 38532, 41417, 43356.
- **The catalog's words found:** 'Units in the major 20-22', 'Plus General Education Requirements (Cal-GETC) 34' and 'Total Units 60', and adds 'Complete transferable units as needed to reach 60.'
- **Where printed:** The reading's own quotations of each ADT page, in records/<cn>.json at record.notes, e.g. 30978 notes[3] (above), 30977 notes[5] and 31814; all 22 notes quote the same sentence. Page addresses are in sources.json source.url, e.g. https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/social-behavioral-sciences/sociology-aat/. The raw page text is not filed: sources.json keeps only text_chars.
- **Words already filed:** yes.
- **Fix:** No existing kind is enough. `set` fills only an empty field, and electives_fill_degree is already true. degree_total_minimum and ge_overlap are read only inside degree_verdict, which degree_check reaches after the guard fails (kb/_program_requirements_score.py line 686). Proposed: an existing `set` step files the catalog's sentence on the record as a new program field `electives_fill_words` (the same pattern as ge_overlap, which a step sets and the scorer reads). The scorer's two electives guards (degree_check line 686 and score()'s certificate guard line 784) then accept a text that holds those words. That is a scorer change of about 3 lines, and it needs a test in tests/program_requirements_pilot_test.py. The other route, a new kind that clears electives_fill_degree, also passes all 22 through Sheet 81 card 2, but it throws away a correct reading. Every record's major already reads equal, and every sum either fits under 60 or runs past it (overlap).

Proposed steps:

```json
{
  "Grossmont College": {
    "why": "Grossmont's 22 failing transfer degrees name Total Units 60 and Cal-GETC 34 and fail only the scorer's electives guard: each page prints 'Complete transferable units as needed to reach 60' (the reading's notes, e.g. Psychology AA-T 30978) and never the word elective. The step files the sentence; the scorer's guard reads it.",
    "awards": "associate",
    "steps": [
      {
        "kind": "set",
        "field": "electives_fill_words",
        "value": "Complete transferable units as needed to reach 60",
        "awards": "transfer",
        "pattern": "Complete\\s+transferable\\s+units\\s+as\\s+needed\\s+to\\s+reach\\s+60\\b",
        "source_words": "Grossmont AA-T and AS-T pages: 'Units in the major 20-22', 'Plus General Education Requirements (Cal-GETC) 34', 'Total Units 60', 'Complete transferable units as needed to reach 60.' (Psychology AA-T 30978; confirm on kb/college_reads/grossmont_degree_words.json)"
      }
    ]
  }
}
```

#### 2. B. Transfer degree 2.0 pages name Cal-GETC with no units

- **Count:** 2; **expected gain:** 2.
- **Sample control numbers:** 46136, 46141.
- **The catalog's words found:** 
- **Where printed:** The reading's notes say the page prints no figure: 46136 notes[1], 'Cal-GETC is named but no GE unit figure is printed'; 46141 notes[0], 'No Cal-GETC unit figure is printed'. The 34 appears on Grossmont's sibling ADT pages ('Plus General Education Requirements (Cal-GETC) 34', 30978 notes[3]) and possibly on https://catalog.gcccd.edu/grossmont/general-education-transfer/ (capture.json page_claimed). Neither has been read for this.
- **Words already filed:** no.
- **Fix:** An existing `set` of ge_units 34 on transfer degrees only, citing Grossmont's own page that prints 34. It also needs cause A's guard fix, because both records carry electives_fill_degree. Simulated with 34 set: 46136 sums 57-58 under 60 and passes; 46141 sums 72 against its printed 65 and passes as overlap. That is 2 records (1.4%), under the 3% rule, so it stands as filed unless the free read supplies the words anyway.

Proposed steps:

```json
{
  "kind": "set",
  "field": "ge_units",
  "value": {
    "min": 34,
    "max": 34
  },
  "awards": "transfer",
  "pattern": "Cal-?GETC",
  "source": "https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/social-behavioral-sciences/psychology-aat/",
  "source_words": "Grossmont Psychology AA-T 30978: 'Plus General Education Requirements (Cal-GETC) 34' (to be quoted from kb/college_reads/grossmont_degree_words.json, or from the general-education-transfer page if it prints the 34)"
}
```

#### 3. C. General Studies / University Studies: one 18-unit total read as two or three area lists of 3

- **Count:** 7; **expected gain:** 4.
- **Sample control numbers:** 19607, 19608, 19609, 19610, 19820, 19822, 19824.
- **The catalog's words found:** 'Choose a minimum of 18 units. Minimum 3 units from Humanities and 3 units from Fine Arts. The remaining units can be taken from either category.' and, on the University Studies pages, 'Complete 60 Transferable Units'
- **Where printed:** records/19607.json record.notes[0] and 19609 notes (rule sentence); 19608, 19822 and 19824 notes[4] ('degree_total of 60 is taken from 'Complete 60 Transferable Units''). The reading quoted these; the raw page text is not filed.
- **Words already filed:** yes.
- **Fix:** Existing kinds cover it: pool_lists with_floors (Hartnell's Liberal Arts 17924 precedent), plus a `set` of degree_total_minimum for the University Studies pages that print 'Complete 60 Transferable Units' over an 18-unit major and Cal-GETC 34 (the same reading Delta and Columbia got). Simulated through kb/_program_requirements_reconcile.reconcile on a text made only of those quoted words: 19607, 19608, 19609 and 19824 read equal and pass. 19610 and 19822 still fail coverage and invented, and 19820's lists are choose_courses with an Electives list that has no figure, so pool_lists does not touch it. That is 4 of 140 live (2.9%), under the 3% rule, so these stand as filed unless a worker bundles them with A.

Proposed steps:

```json
[
  {
    "kind": "pool_lists",
    "field": "blocks",
    "awards": "local",
    "with_floors": true,
    "pattern": "Choose\\s+a\\s+minimum\\s+of\\s+(?P<n>\\d+)\\s+units",
    "block_pattern": "(?:Humanities|Fine Arts|Mathematics|Natural Science|Computer Science|Social Sciences|Behavioral Sciences|Wellness|Self-Development|Activity)$",
    "name": "Choose a minimum of 18 units"
  },
  {
    "kind": "set",
    "field": "degree_total_minimum",
    "value": true,
    "awards": "local",
    "pattern": "Complete\\s+60\\s+Transferable\\s+Units"
  }
]
```

#### 4. D. Major or certificate total not printed (the reading declined to sum)

- **Count:** 4; **expected gain:** 0.
- **Sample control numbers:** 04999, 21380, 08781, 44098.
- **The catalog's words found:** 04999 notes[1]: 'The core list prints 'Total Units 20' ... The Acting emphasis prints 'Total Units 12'. No combined major total (core + emphasis) is printed'; 44098 notes[0]: 'The catalog prints no total units for the certificate'
- **Where printed:** records/04999.json, 21380.json, 08781.json and 44098.json at record.notes
- **Words already filed:** yes.
- **Fix:** None. The ruling is that we do not sum a figure the catalog does not print. These stand as filed.

#### 5. E. Single misreads of a program total (blocks do not sum to the printed major)

- **Count:** 4; **expected gain:** 0.
- **Sample control numbers:** 08760, 30978, 35805, 37453.
- **The catalog's words found:** 
- **Where printed:** records/<cn>.json score.arithmetic.why: 08760 29-32 vs 29-34 ('Or one course in any foreign language' not recorded); 30978 18-21 vs 20-22; 35805 21-24 vs 19-21 (GEOL-110 & GEOL-111 read as two entries in a list without units); 37453 18 vs 18-19
- **Words already filed:** no.
- **Fix:** No shared cause; each is its own misread. and_units does not apply to 35805 because the course before the joined one has no figure. These stand as filed.

#### 6. F. None placed: the capture gave another page or a truncated one (not loaded)

- **Count:** 4; **expected gain:** 0.
- **Sample control numbers:** 08767, 21402, 32017, 32879.
- **The catalog's words found:** 
- **Where printed:** sources.json source.url (32017 points at general-education-transfer/); 21402 notes: text cut at 'Certificate o'
- **Words already filed:** no.
- **Fix:** Not a reconcile matter: page assignment or truncation in the capture. These are not live rows.

#### 7. G. Noncredit drone certificates: 180 hours in the description, 0 units per course

- **Count:** 2; **expected gain:** 0.
- **Sample control numbers:** 43080, 43081.
- **The catalog's words found:** 'provides 180 hours of instruction and hands-on flight training' (43080 notes[0])
- **Where printed:** records/43080.json and 43081.json at record.notes
- **Words already filed:** yes.
- **Fix:** course_hours needs a vendor course-data call, and CourseLeaf has none. hours_total_only needs a 'Total Contact Hours:' label. 2 records, under 3%, so they stand.

### Page-read plans

**`kb/college_reads/grossmont_degree_words.json`.** Checks cause A's pattern (exact words and whitespace in the capture's innerText) and confirms the ADT pages print no 'elective', before the scorer change and the reconcile dispatch. Gives cause B a Grossmont-own source for Cal-GETC's 34 (sibling ADT page or the GE/Transfer page) and the 2.0 pages' exact Cal-GETC words. Checks cause C's two sentences. Every address comes from sources.json source.url or capture.json page_claimed.

```json
{
  "_readme": "Grossmont College, read-only diagnosis 2026-11-12. 22 transfer degrees fail only the scorer's electives guard; the reading's notes quote 'Complete transferable units as needed to reach 60' and the page names no elective. Read as the capture reads (capture_view) so the reconcile pattern is checked against the same innerText: two first-version ADTs, the two 2.0 ADTs that name Cal-GETC with no units, one General Studies and one University Studies page, and the General Education/Transfer page for Cal-GETC's units. One load each, no model call.",
  "college": "Grossmont College",
  "questions": {
    "adt_fill_words": "On an AA-T or AS-T page, the exact words and spacing of the sentence on transferable units to reach 60, the Total Units line, the Cal-GETC line and its figure, and whether 'elective' appears anywhere.",
    "cal_getc_units": "Where Grossmont's catalog prints Cal-GETC's units (34) in its own words: a sibling ADT page or the General Education/Transfer page.",
    "area_total": "On the General Studies and University Studies pages, the exact 'Choose a minimum of 18 units' sentence and the 'Complete 60 Transferable Units' line."
  },
  "keywords": [
    "transferable\\s+units\\s+as\\s+needed",
    "Total\\s+Units",
    "Cal-?GETC",
    "[Ee]lective",
    "Choose\\s+a\\s+minimum\\s+of",
    "Complete\\s+60",
    "\\b34\\b",
    "Units\\s+(?:in|for)\\s+the\\s+major"
  ],
  "pages": [
    {
      "answers": [
        "adt_fill_words",
        "cal_getc_units"
      ],
      "capture_view": true,
      "url": "https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/social-behavioral-sciences/psychology-aat/"
    },
    {
      "answers": [
        "adt_fill_words"
      ],
      "capture_view": true,
      "url": "https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/social-behavioral-sciences/sociology-aat/"
    },
    {
      "answers": [
        "adt_fill_words",
        "cal_getc_units"
      ],
      "capture_view": true,
      "url": "https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/stem/mathematics-2-ast/"
    },
    {
      "answers": [
        "adt_fill_words",
        "cal_getc_units"
      ],
      "capture_view": true,
      "url": "https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/stem/physics-2-ast/"
    },
    {
      "answers": [
        "area_total"
      ],
      "capture_view": true,
      "url": "https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/humanities/general-studies-aa-humanities-fine-arts/"
    },
    {
      "answers": [
        "area_total"
      ],
      "capture_view": true,
      "url": "https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/social-behavioral-sciences/university-studies-social-behavioral-sciences-aa/"
    },
    {
      "answers": [
        "cal_getc_units"
      ],
      "url": "https://catalog.gcccd.edu/grossmont/general-education-transfer/"
    }
  ]
}
```

### What needs a scorer reading or a new kind

No new reconcile kind: an existing `set` files a new program field, electives_fill_words. What is needed is a scorer change in kb/_program_requirements_score.py. The two electives guards (degree_check, line 686, and score()'s certificate guard, line 784) must also accept a text containing the words in prog['electives_fill_words'] (whitespace-normalized match). This works the way ge_overlap does: a reconcile step sets it and the scorer reads it. Add a test to tests/program_requirements_pilot_test.py, and record a cpl_memory decision row, since the change touches the scorer's guard for every college, even though only records carrying the new field are affected. A global 'skip the guard on transfer degrees' was considered and not recommended.

### The reconcile entry

kb/program_requirements_reconcile.json holds no entry for Grossmont College, and none for its sister Cuyamaca. Cuyamaca's 30 transfer degrees mostly read electives_fill_degree false with no degree total, and 24 of them pass against the major alone. That is a different reading of the same district template, and no Cuyamaca figure is cited here.

### Paid extraction

None for the reconcile. Cause A rests on words the reading already quoted, cause B and C need only the free page read, and the rest stand under the rulings. The 4 unloaded none-placed records (08767, 21402, 32017, 32879) would need a capture fix first. Only after that would a re-extraction of about 4 x $0.07 = $0.30 be worth it, and it is not part of this pass.

### Unknowns

The raw page text is not filed in the repo, so every quotation here is the reading's own quotation in record.notes. The reconcile pattern's match against the live innerText (spacing, non-breaking spaces, a trailing period) is unconfirmed until the page read or the reconcile run. How the simulation was done: cause A ran S.degree_check on the filed computed sums with text=None, which skips only the guard, the same way kb/_program_requirements_rescore.py re-reads filed sums. Cause B did the same with ge_units 34 added. Cause C ran R.reconcile on a synthetic text of the quoted sentences, then S.score with an empty closed list. That is exact for choose_units blocks but cannot see coverage, invented or outcomes, so those were taken as filed. Whether a reconcile run rescores all 22 depends on the fresh capture printing each record's own heading (own_heading_kept); the 22 were read from their own ADT pages (sources.json). Results: A gives 121 of 140 live (filed 121 of 144). A+B+C would give 127, but B (2) and C (4) each fall under 3%.

## East Los Angeles College

**Verdict.** Go. One shared cause is the scorer's 'elective' guard on 19 records. It and the double-count overlap (6 more) move about 20 records, roughly 15% of the college, with free page reads, three `set` steps and a one-line scorer read of the new flag. The filed simulation goes from 88 to 109 of 137, or up to 113. The rest stand as filed, and the 4 wrong-page records park.

**Filed:** 137 records, 49 failing. **Simulated after the fixes:** 109 passing.

**Filed against live.** On disk there are 137 filed records: 88 pass and 49 fail. The record files' scores are the source; summary.json's 86 passed is older. Live has 133 rows: 92 pass and 41 fail. Running kb/_program_requirements_rescore.py's rescore() in memory changes no filed failure, so a rescore does not explain the gap. By shape, the filed failures are 25 degrees incomplete (live 23), 12 degrees unequal (live 12, the same), 4 certificates unequal (live 4, the same), 4 more certificates failing on coverage, outcomes or no total, and 4 noncredit or other records. Live has 2 failures outside its three groups. Filed has 8 more failing records and 4 more rows overall. I could not tell which 4 records are missing from the table or which 4 pass live but fail on file. A good guess is the noncredit/other records (35759, 37510, 42017, 44913) and the wrong-page records (39800, 45540), but that needs a Supabase read. The page text is not filed: sources.json keeps only text_chars, and capture.json keeps a roughly 218-character opening per pick. So every catalog phrase below comes from the readings' own quotations in record.notes, and the page-read plans confirm them in the PDF.

### Causes

#### 1. Electives fill the degree, but the catalog says it without the word 'elective', so the scorer's ELECTIVE guard fails the degree check

- **Count:** 19; **expected gain:** 14.
- **Sample control numbers:** 32154, 32170, 32902, 32980, 33382, 35397, 36177, 37923, 37924, 42672, 43632, 44595, 45935, 02430, 08252, 35888, 37956, 41132, 43649.
- **The catalog's words found:** Transfer: 'COMPLETE ADDITIONAL CSU UNITS, IF NEEDED, TO REACH 60 CSU TRANSFERABLE UNITS' (quoted by the readings of 32154, 32980, 33382, 37923, 42672, 45935; 31017 and 35720 quote 'Complete additional CSU units, if needed, to reach 60 CSU transferable units'). Local: 'COMPLETE ADDITIONAL DEGREE-APPLICABLE UNITS, IF NEEDED, TO REACH 60 UNITS.' (43649, 37956; 35309 and 41132 quote 'Complete additional degree applicable units, if needed, to reach 60 units'). These are the readings' quotations, not filed page text.
- **Where printed:** kb/program_requirements_college/east_los_angeles/records/<cn>.json, key record.notes. Source pages are on the ELAC General Catalog 2026-2027 PDF (https://www.elac.edu/sites/elac.edu/files/2026-08/ELAC%20General%20Catalog%202026%202027.pdf), e.g. #page=130, #page=133, #page=167
- **Words already filed:** no.
- **Fix:** No existing step kind fixes this. In _program_requirements_score.degree_check, the guard `electives_fill_degree and text is not None and not ELECTIVE.search(text)` returns 'incomplete' before degree_verdict runs, so degree_total_minimum does not help. No step can clear a flag the reading set. Proposed: an existing `set` step records a new program flag, electives_line_printed, keyed on the catalog's own line. A one-line scorer change then skips the guard where that flag is set (degree_check, and the same guard on the certificate fill path). A broader alternative is to widen ELECTIVE itself to accept 'additional ... units, if needed, to reach'. That would change every LACCD sister at once and need a cross-college rescore. 31017 (Kinesiology AA-T) also hits this guard in its degree sub-check but stays failing on 54-67 against 60. 35888 also fails outcomes and stays.

Proposed steps:

```json
{
  "kind": "set",
  "field": "electives_line_printed",
  "value": true,
  "awards": "associate",
  "pattern": "(?i)COMPLETE\\s+ADDITIONAL\\s+(?:CSU|DEGREE[-\\s]*APPLICABLE)\\s+UNITS,?\\s+(?:IF\\s+NEEDED,?\\s+)?TO\\s+REACH\\s+60\\b"
}
```

#### 2. Local degree whose major plus LACCD GE 27 runs past the printed total; the page says major courses may be double counted (or a high-unit major waives GE Areas 4a and 7)

- **Count:** 8; **expected gain:** 6.
- **Sample control numbers:** 35309, 37965, 37969, 39823, 40042, 46461, 21174, 32193.
- **The catalog's words found:** '6 units of major courses may be double counted in LACCD GE areas 2 and 5' (02456, 40042), '9 units of major courses may be double counted in LACCD General Education Areas 3, 4b, and 5' (35309), '3 units from MUSIC 116, MUSIC 118 or MUSIC 141 may be double counted in LACCD GE Area 3' (37965), '3 units from ART 201 may be double counted in GE Area C' (46461), '3 units from CHEM 101 will be double-counted in LACCD GE Area 5' (37956). Waiver: 'LACCD GE Area 4a (3 units) and Area 7 (3 units) are waived for this high-unit major per AP 4100' (21174, 32193, 37965, 39823). These are the readings' paraphrases or quotations, not filed page text.
- **Where printed:** records/<cn>.json, key record.notes; source pages ELAC PDF #page=197, 198, 199, 219, 257, 277, 289
- **Words already filed:** no.
- **Fix:** The existing `set` kind with field ge_overlap, as at Butte, Redwoods and Hartnell, makes the scorer's overlap branch pass a sum past both ends of the total. It fixes the 6 whose notes name double counting. 21174 (22+17+27=66 against 60) and 32193 (66-66.5 against 60-60.5) quote only the waiver. Their sums with GE at 21 instead of 27 come to exactly 60 and 60-60.5, but no existing kind can lower ge_units the reading already filled. They pass only if their pages also print a double-count sentence (east_los_angeles_high_unit_pages settles 21174). Otherwise they need a new waiver kind or stand as filed. 02456 also prints a double-count note but fails its major total (45 against 48-50), so it stays.

Proposed steps:

```json
{
  "kind": "set",
  "field": "ge_overlap",
  "value": true,
  "awards": "local",
  "pattern": "(?i)\\b(?:may|will)\\s+be\\s+double[-\\s]*counted\\b"
}
```

#### 3. Degree names Cal-GETC and the 60 but no units for Cal-GETC

- **Count:** 4; **expected gain:** 1.
- **Sample control numbers:** 41097, 35720, 43039, 45051.
- **The catalog's words found:** Transfer pages: Cal-GETC '(34 semester/45 quarter units)' in the ADT requirements paragraph. Readings of 31017, 32154, 32170, 33013, 33382, 41231 and 43632 quote it; 41097's reading saw it on p130 ('The ADT intro text states Cal-GETC is 34 semester units as generic ADT language') and left ge_units empty. Local 43039 and 45051 quote only 'Cal-GETC GE Pattern' and no units.
- **Where printed:** records/<cn>.json, key record.notes; ELAC PDF #page=130 (41097), #page=161 (35720), #page=146 (43039), #page=220 (45051)
- **Words already filed:** no.
- **Fix:** For transfer degrees, an existing `set` step fills ge_units 34 on ELAC's own ADT paragraph. 41097 passes once the electives step is also in (30-31 + 34 runs past 60, overlap). 35720 stays even with 34 (59-65 against 60), and its reading saw no '34' in its excerpt. Local 43039 and 45051 need ELAC's own words for a local degree on Cal-GETC (east_los_angeles_ge_front_matter). Even then 45051 (23+34=57, no electives flag) stays unequal and 43039 passes only with the electives step. The cause moves 1 to 2 records, under 3% alone. The transfer step is worth keeping only because it rides with cause 1's read.

Proposed steps:

```json
{
  "kind": "set",
  "field": "ge_units",
  "value": {
    "min": 34,
    "max": 34
  },
  "awards": "transfer",
  "pattern": "\\(\\s*34\\s+semester\\s*/\\s*45\\s+quarter\\s+units\\s*\\)",
  "source": "https://www.elac.edu/sites/elac.edu/files/2026-08/ELAC%20General%20Catalog%202026%202027.pdf#page=130",
  "source_words": "<the ADT paragraph as read east_los_angeles_degree_wording prints it>"
}
```

#### 4. Major or certificate sum unequal to its own printed total, with no shared cause (individual misreads or page breaks)

- **Count:** 8; **expected gain:** 0.
- **Sample control numbers:** 02456, 31017, 33013, 41231, 14869, 21157, 38168, 45602.
- **The catalog's words found:** 
- **Where printed:** records/<cn>.json score.arithmetic (e.g. 45602 sums 27 against 'Total 24' with MUSIC 205 not on the closed list; 38168's notes call a printed '2-3' a likely misprint; 21157's list sits on the previous page; 33013 19-24 against 22-24; 41231 39-45 against 41-45)
- **Words already filed:** no.
- **Fix:** No step kind fits. Each is its own reading problem, and the rule forbids hand edits. These stand as filed.

#### 5. Wrong page captured: the record names no total and places no listed course

- **Count:** 4; **expected gain:** 0.
- **Sample control numbers:** 38332, 39800, 45028, 45540.
- **The catalog's words found:** 
- **Where printed:** records/<cn>.json record.notes (e.g. 45028: 'The supplied text (catalog pages 64-66) does not contain a section for the Cal-GETC Certificate of Achievement'; 45540: page 345 'appears to be the associate degree section, not the B.S. section')
- **Words already filed:** no.
- **Fix:** No reconcile step can fix this. The capture needs the program's right page, then a paid re-extraction of these 4. That is about 3% of 137 and its outcome is unknown, so park it.

#### 6. Noncredit record states no figure while the scorer finds '1.5 HOURS' in its page text

- **Count:** 3; **expected gain:** 0.
- **Sample control numbers:** 35759, 42017, 44913.
- **The catalog's words found:** 
- **Where printed:** records/<cn>.json score.arithmetic.why: 'the record states no figure, but the catalog text names 1.5 HOURS, 1.5 HOURS, 1.5 HOURS, 1.5 HOURS' (PDF #page=393). The readings say the page prints 0 in a UNITS column and no hours.
- **Words already filed:** no.
- **Fix:** Unknown until east_los_angeles_noncredit_hours prints p392-394. No step kind reads course hours from PDF text (course_hours needs a vendor call). If the hours are these programs' own, the fix is a re-extraction. These may not be live rows.

#### 7. Singletons on coverage, invented codes or outcomes

- **Count:** 3; **expected gain:** 0.
- **Sample control numbers:** 38166, 37510, 44624.
- **The catalog's words found:** 
- **Where printed:** records/<cn>.json score
- **Words already filed:** no.
- **Fix:** No step kind fits. These stand as filed.

### Page-read plans

**`kb/college_reads/east_los_angeles_degree_wording.json`.** Causes 1 and 3: the exact wording and line breaks of the transfer and local 'to reach 60' lines the electives step keys on, the ADT paragraph's '(34 semester/45 quarter units)' that the transfer ge_units step quotes as source_words, and one local double-count sentence for cause 2.

```json
{
  "_readme": "East Los Angeles College, diagnosis 2026-11-12 (read-only). 19 of the 49 filed failing records are degrees whose reading set electives_fill_degree and whose score reads 'the record says electives fill the degree total, but the catalog text names no electives': the readings quote the line as 'COMPLETE ADDITIONAL CSU UNITS, IF NEEDED, TO REACH 60 CSU TRANSFERABLE UNITS' (transfer) and 'COMPLETE ADDITIONAL DEGREE-APPLICABLE UNITS, IF NEEDED, TO REACH 60 UNITS' (local), which carry no word 'elective'. This read prints PDF pages 128-133 of the 2026-2027 catalog: Business Administration AS-T 35397, Business Administration 2.0 AS-T 41097 and Computer Science AS-T 45935 (p130) and Paralegal Studies A.A. 43649 (p133), so the steps quote the catalog's own words for the 60-unit line, Cal-GETC's '(34 semester/45 quarter units)' and the double-count note. One load, no model call.",
  "college": "East Los Angeles College",
  "questions": {
    "degree_wording": "The exact words each degree page prints for reaching 60 units, for Cal-GETC's units, and for major courses double counted in LACCD GE."
  },
  "keywords": [
    "ADDITIONAL\\s+(?:CSU|DEGREE)",
    "TO\\s+REACH\\s+60",
    "34\\s+semester",
    "double[-\\s]*count",
    "waive",
    "Cal-GETC"
  ],
  "pages": [
    {
      "answers": [
        "degree_wording"
      ],
      "url": "https://www.elac.edu/sites/elac.edu/files/2026-08/ELAC%20General%20Catalog%202026%202027.pdf"
    }
  ],
  "pdf_span": [
    128,
    133
  ]
}
```

**`kb/college_reads/east_los_angeles_high_unit_pages.json`.** Cause 2: the double-count sentence's exact wording, and whether 21174's page prints one at all or only the AP 4100 waiver. That decides whether 21174 (and 32193 by the same pattern) needs a new waiver kind or stands as filed.

```json
{
  "_readme": "East Los Angeles College, diagnosis 2026-11-12 (read-only). Eight local degrees sum their major and the LACCD GE Plan's 27 past the degree total the page prints (unequal); their readings quote notes such as '6 units of major courses may be double counted in LACCD GE Areas 2 and 5' and 'LACCD GE Area 4a (3 units) and Area 7 (3 units) are waived for this high-unit major per AP 4100'. Engineering Graphics & Design Technology A.S. 21174 (p197-198, 22 + 17 + 27 = 66 against 60) quotes only the waiver. This read prints PDF pages 195-199: 21174, Engineering Technology: Advanced Manufacturing A.S. 40042 (p198) and IT Technician Pathway A.S. 39823 (p199), so a ge_overlap step quotes the catalog's own double-count sentence and the waiver sentence is read as printed. One load, no model call.",
  "college": "East Los Angeles College",
  "questions": {
    "overlap_words": "Whether each page prints that major courses may be double counted in LACCD GE, and how it words the high-unit-major waiver of Areas 4a and 7."
  },
  "keywords": [
    "double[-\\s]*count",
    "waive",
    "high[-\\s]*unit",
    "AP\\s*4100",
    "Total"
  ],
  "pages": [
    {
      "answers": [
        "overlap_words"
      ],
      "url": "https://www.elac.edu/sites/elac.edu/files/2026-08/ELAC%20General%20Catalog%202026%202027.pdf"
    }
  ],
  "pdf_span": [
    195,
    199
  ]
}
```

**`kb/college_reads/east_los_angeles_ge_front_matter.json`.** Cause 3, local half: whether ELAC prints Cal-GETC's 34 for a local degree (43039, 45051). Also gives the catalog-level waiver rule if a waiver kind is ever wanted. Low priority: it moves at most 1 record.

```json
{
  "_readme": "East Los Angeles College, diagnosis 2026-11-12 (read-only). The front matter's associate degree requirements: the units of the LACCD GE Plan and of Cal-GETC as East Los Angeles prints them, the 60 units, and the high-unit-major (AP 4100) waiver of LACCD GE Areas 4a and 7. Two local A.A. degrees (Central American Studies 43039, Japanese 45051) name Cal-GETC and no units, and their pages carry no ADT paragraph to quote; this settles whether the catalog gives a local degree on Cal-GETC its 34 in its own words. PDF pages 1-66 only, before the program pages (General Studies on 64-66). One load, no model call.",
  "college": "East Los Angeles College",
  "questions": {
    "ge_units": "The units of the LACCD GE Plan and Cal-GETC for an associate degree, the 60 units, and the high-unit-major waiver, in the catalog's words."
  },
  "keywords": [
    "LACCD\\s+(?:GE|General\\s+Education)\\s+Plan",
    "Cal-GETC",
    "60\\s+(?:semester\\s+)?units",
    "high[-\\s]*unit",
    "AP\\s*4100",
    "double[-\\s]*count"
  ],
  "pages": [
    {
      "answers": [
        "ge_units"
      ],
      "url": "https://www.elac.edu/sites/elac.edu/files/2026-08/ELAC%20General%20Catalog%202026%202027.pdf"
    }
  ],
  "pdf_span": [
    1,
    66
  ]
}
```

**`kb/college_reads/east_los_angeles_noncredit_hours.json`.** Cause 6: whether the '1.5 HOURS' the scorer sees belongs to the three noncredit certificates (then a re-extraction) or to neighboring text (then they stand). Optional.

```json
{
  "_readme": "East Los Angeles College, diagnosis 2026-11-12 (read-only). Three noncredit records read from PDF page 393 (35759, 42017, 44913) state no figure, and the scorer fails them as 'the record states no figure, but the catalog text names 1.5 HOURS, ...', while each reading says the page prints 0 in a UNITS column and no hours. This read prints PDF pages 392-394 so a session can see whether the hours belong to these certificates' courses or to text beside them. One load, no model call.",
  "college": "East Los Angeles College",
  "questions": {
    "noncredit_hours": "Where page 393 prints 1.5 HOURS, and whether those hours are the noncredit certificates' own course hours."
  },
  "keywords": [
    "HOURS",
    "Certificate\\s+of\\s+Completion",
    "Certificate\\s+of\\s+Competency",
    "UNITS"
  ],
  "pages": [
    {
      "answers": [
        "noncredit_hours"
      ],
      "url": "https://www.elac.edu/sites/elac.edu/files/2026-08/ELAC%20General%20Catalog%202026%202027.pdf"
    }
  ],
  "pdf_span": [
    392,
    394
  ]
}
```

### What needs a scorer reading or a new kind

No new reconcile kind is needed: the existing `set` kind writes the new flag. The scorer does need one new field read. In kb/_program_requirements_score.py degree_check, `if prog.get("electives_fill_degree") and text is not None and not ELECTIVE.search(text):` becomes `... and not prog.get("electives_line_printed"):`. The certificate fill guard in score() (`text is None or ELECTIVE.search(text)`) gets the same change. Add a check in tests/program_requirements_pilot_test.py that the flag passes only alongside electives_fill_degree, and add the field to the score docstring's field list. The alternative is to widen ELECTIVE to `\belectives?\b|additional\s+(?:CSU|degree[-\s]*applicable)\s+(?:transferable\s+)?units,?\s+(?:if\s+needed,?\s+)?to\s+reach`. That reaches every LACCD sister at once and needs a cross-college rescore, which is a bigger call than this college's entry. If 21174 and 32193 print only the AP 4100 waiver, passing them would take a new 'ge_waiver' kind, which lowers ge_units by the waived areas' printed units. Its gain is 2 records (1.5%), below the 3% bar, so I am not proposing it.

### The reconcile entry

kb/program_requirements_reconcile.json has no East Los Angeles College entry. The proposed entry would be {"why": "...", "awards": "associate", "steps": [the transfer ge_units 34 step, the electives_line_printed step, the local ge_overlap step]}, in that order. The college gate is 'associate', and each step carries its own gate (transfer, associate, local). Sister Los Angeles Valley's entry keys on 'Total Minimum Units: 60' and sets ge_units 34 / 27-34 and degree_total_minimum. It does not carry over. ELAC's readings already fill ge_units (LACCD GE Plan 27 on 21 local degrees, Cal-GETC 34 on most ADTs) and record the degree total as 'Total 60'. ELAC's blocking failure is the electives guard, which degree_total_minimum cannot pass because the guard runs before degree_verdict. Any LAVC words would also have to be re-quoted from ELAC's own catalog. I checked the mechanics by running reconcile() in memory on 41097, 43649 and 43039 with stand-in text built from the readings' quotations: the steps set ge_units 34 plus electives_line_printed, then electives_line_printed plus ge_overlap, then electives_line_printed, as intended.

### Paid extraction

No paid extraction is needed for causes 1-3: the reads are free and the steps make no model call. Only the 4 wrong-page records (38332, 39800, 45028, 45540) would need one, after the capture finds their right pages: 4 programs, about $0.24 at $0.06, or about $0.31 at ELAC's filed $0.0784 per program. That is under 3% with an uncertain gain, so park it. The 3 noncredit records would need one only if the noncredit read shows the hours are their own.

### Unknowns

1) The page text is not filed. The simulation (scratchpad sim.py) decides whether each step's pattern matches from the readings' own notes. It cannot see the PDF text, its line breaks or hyphenation, or neighboring programs' text on shared pages. A double-count note from the next program could set ge_overlap on the wrong record: 21174's page 197 is shared with Geo-Spatial. 2) 109 of 137 is the conservative count: the line counts as matching only where a note quotes 'reach 60', for 21 records gained (14 from the electives step, 6 from overlap, 1 from Cal-GETC 34). If every degree whose reading set electives_fill_degree prints the line, the count is 113 of 137, adding 02430, 08252, 32170 and 44595. Two of those would be false passes. 02430 (Architectural Design A.A.) and 08252 (Architectural Technology A.A.) miss a nested certificate's 12- or 22-unit block printed on the previous page, and the electives fill would hide the gap (56-58 against 60-61; 39 against 61). A worker should check them after the reconcile and flag them, since no step can hold them out. 3) Whether 41097's page really prints '(34 semester/45 quarter units)'. Its reading says the ADT text states it, and the degree_wording read settles it. 4) The live/filed gap: which 4 records are not live, and why live has 92 passing against 88 filed. That needs a Supabase read I did not make. 5) The live numbers' categories (23/12/4) leave 2 failures unnamed, and I cannot map them to control numbers. 6) Whether the PDF's #page anchors equal the reader's 1-based pdf_span index. The capture's picks use the same numbers (page 102 prints catalog page 98), so I assumed yes.
