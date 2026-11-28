# Harvest gap census

Written by `kb/_harvest_gap_census.py` (2026-11-28 17:12Z, live). Every active program without a passing record, each with one cause and one lever. Counts are a snapshot; rerun `harvest-gap-census.yml` for today's.

Universe 20282 · passing 15704 · without a passing record 3882.

Of the passing, 54 counts as passing on the tab; the scorer's own test fails (listed in the JSON, not counted as gaps).

Collected with a named gap, out of the gap: 696 (catalog_figures_differ 23, degree_electives_not_printed 4, degree_summary_ge_none 16, degree_within_map_range 4, double_count_noted 2, entry_path_range 1, figure_within_variable_units 16, ge_figures_other_pattern 1, ge_units_not_read 137, heading_not_in_text 5, hours_total_differs 13, hours_total_not_read 32, hours_within_printed_range 7, lists_not_closed 46, lists_past_their_figure 19, nested_award_not_read 4, no_hours_read 54, no_own_page_total 1, no_units_read 23, noted_figures_differ 63, noted_no_total 18, noted_section_cut_off 26, noted_total_cut_off 2, noted_unit_floor 4, one_option_of_shared_page 6, option_lists_read_apart 11, pair_read_as_alternatives 17, pool_figure_not_read 24, prerequisites_counted 7, repeat_read_once 12, required_list_outside_total 5, section_cut_off 20, total_differs 28, total_not_printed 9, unit_line_not_read 14, units_within_printed_range 14, waived_course_counted 8).

Read by the harvest but outside the universe: Active - Teachout Only 630, Approved 1423.

Named gap, 136 programs: "General-education pattern certificate. It has no fixed course list by design."

Named gap, 4 programs: "The state lists this program twice. The other listing has the course list."

Of those without a passing record, 78 are named as a gap in their college's own file, with no live row (extraction_error 2, found_not_extracted 8, places_none 68): no further read is owed.

## By cause

| Cause | Programs |
|---|---:|
| parked college | 94 |
| no closed list in the Program Course File | 1747 |
| page not found | 1095 |
| page found, never extracted | 11 |
| extracted, places none of its courses | 122 |
| extracted, not loaded | 1 |
| extracted, no score (an error) | 3 |
| live, coverage fails | 101 |
| live, a course added | 2 |
| live, units unequal | 500 |
| live, units incomplete | 206 |

## Top levers

| # | Lever | Where | Programs | Free or paid | Estimate |
|---:|---|---|---:|---|---:|
| 1 | the Program Course File lists no course for it: program-course-fetch.yml, or none exists | statewide | 1747 | free |  |
| 2 | a session takes the parked college back up under its decision | Los Medanos College | 59 | free |  |
| 3 | a reader change finds the program's page (a free page read first) | City College of San Francisco | 52 | free |  |
| 4 | a team session writes a correction rule that gives the general education pattern its units, then rescores the saved record | statewide | 51 | free |  |
| 5 | a scorer reading for a noncredit total in hours | statewide | 43 | free |  |
| 6 | a reader change finds the program's page (a free page read first) | Ohlone College | 34 | free |  |
| 7 | a reader change finds the program's page (a free page read first) | Mt. San Antonio College | 28 | free |  |
| 8 | a reader change finds the program's page (a free page read first) | Santa Barbara City College | 28 | free |  |
| 9 | a reader change finds the program's page (a free page read first) | Orange Coast College | 27 | free |  |
| 10 | a reader change finds the program's page (a free page read first) | Fresno City College | 26 | free |  |
| 11 | a reader change finds the program's page (a free page read first) | Victor Valley College | 26 | free |  |
| 12 | a reader change finds the program's page (a free page read first) | Saddleback College | 25 | free |  |
| 13 | a reader change finds the program's page (a free page read first) | Diablo Valley College | 24 | free |  |
| 14 | a reader change finds the program's page (a free page read first) | Mt. San Jacinto College | 24 | free |  |
| 15 | a reader change finds the program's page (a free page read first) | San Joaquin Delta College | 24 | free |  |
| 16 | a reader change finds the program's page (a free page read first) | Southwestern College | 24 | free |  |
| 17 | a reader change hands it its own page, then extraction | College of the Desert | 23 | paid | $1.83 |
| 18 | a reader change finds the program's page (a free page read first) | Allan Hancock College | 23 | free |  |
| 19 | a reader change finds the program's page (a free page read first) | West Los Angeles College | 23 | free |  |
| 20 | a reader change finds the program's page (a free page read first) | Foothill College | 21 | free |  |
| 21 | a reader change finds the program's page (a free page read first) | Los Angeles Trade Technical College | 20 | free |  |
| 22 | a reader change finds the program's page (a free page read first) | Sierra College | 20 | free |  |
| 23 | a reader change finds the program's page (a free page read first) | Laney College | 19 | free |  |
| 24 | a reader change finds the program's page (a free page read first) | North Orange Continuing Education | 19 | free |  |
| 25 | a reader change finds the program's page (a free page read first) | Santa Rosa Junior College | 19 | free |  |

## Next wave: one college per catalog host

| College | Host | Programs a read would gain | Estimate | Read before |
|---|---|---:|---:|---|
| College of the Desert | catalog.collegeofthedesert.edu | 23 | $1.83 | yes |
| Golden West College | catalog.cccd.edu | 6 | $0.39 | yes |
| Shasta College | scmainweb.s3.us-west-1.amazonaws.com | 3 | $0.28 | yes |
| College of the Canyons | canyons.edu | 2 | $0.15 | yes |
| Cypress College | catalog.nocccd.edu | 2 | $0.13 | yes |
| Long Beach City College | lbcc-public.courseleaf.com | 2 | $0.10 | yes |
| Southwestern College | catalog.swccd.edu | 2 | $0.13 | yes |
| Cerritos College | cerritos-public.courseleaf.com | 1 | $0.06 | yes |
| Clovis Community College | cloviscollege.edu | 1 | $0.08 | yes |
| Cuyamaca College | catalog.gcccd.edu | 1 | $0.07 | yes |
| Gavilan College | gavilan.curriqunet.com | 1 | $0.07 | yes |
| Los Angeles Mission College | lamc.edu | 1 | $0.07 | yes |
| Los Angeles Trade Technical College | lattc.edu | 1 | $0.08 | yes |
| Mission College | mission.elumenapp.com | 1 | $0.07 | yes |
| Modesto Junior College | mjc.elumenapp.com | 1 | $0.06 | yes |
| Pasadena City College | curriculum.pasadena.edu | 1 | $0.07 | yes |
| Reedley College | reedley.curriqunet.com | 1 | $0.06 | yes |
| San Diego Mesa College | sdccd.curriqunet.com | 1 | $0.09 | yes |
| San Jose City College | catalog.sjcc.edu | 1 | $0.08 | yes |
| Santa Monica College | catalog.smc.edu | 1 | $0.09 | yes |
