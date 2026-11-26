# Harvest gap census

Written by `kb/_harvest_gap_census.py` (2026-11-26 12:06Z, live). Every active program without a passing record, each with one cause and one lever. Counts are a snapshot; rerun `harvest-gap-census.yml` for today's.

Universe 20282 · passing 15610 · without a passing record 4082.

Of the passing, 54 counts as passing on the tab; the scorer's own test fails (listed in the JSON, not counted as gaps).

Collected with a named gap, out of the gap: 590 (catalog_figures_differ 20, degree_electives_not_printed 3, degree_summary_ge_none 14, degree_within_map_range 4, double_count_noted 2, entry_path_range 1, figure_within_variable_units 14, ge_figures_other_pattern 1, ge_units_not_read 132, heading_not_in_text 6, hours_total_differs 11, hours_total_not_read 32, hours_within_printed_range 7, lists_not_closed 36, lists_past_their_figure 18, nested_award_not_read 4, no_hours_read 51, no_own_page_total 1, no_units_read 23, noted_figures_differ 43, noted_no_total 16, noted_section_cut_off 22, noted_total_cut_off 2, noted_unit_floor 2, one_option_of_shared_page 6, option_lists_read_apart 11, pair_read_as_alternatives 12, pool_figure_not_read 22, prerequisites_counted 6, repeat_read_once 11, required_list_outside_total 1, section_cut_off 20, total_differs 12, total_not_printed 7, unit_line_not_read 12, waived_course_counted 5).

Read by the harvest but outside the universe: Active - Teachout Only 630, Approved 1423.

Named gap, 136 programs: "General-education pattern certificate. It has no fixed course list by design."

Named gap, 4 programs: "The state lists this program twice. The other listing has the course list."

## By cause

| Cause | Programs |
|---|---:|
| parked college | 94 |
| no closed list in the Program Course File | 1747 |
| page not found | 1097 |
| page found, never extracted | 10 |
| extracted, places none of its courses | 130 |
| extracted, not loaded | 1 |
| extracted, no score (an error) | 4 |
| live, coverage fails | 140 |
| live, a course added | 3 |
| live, units unequal | 622 |
| live, units incomplete | 234 |

## Top levers

| # | Lever | Where | Programs | Free or paid | Estimate |
|---:|---|---|---:|---|---:|
| 1 | the Program Course File lists no course for it: program-course-fetch.yml, or none exists | statewide | 1747 | free |  |
| 2 | a session takes the parked college back up under its decision | Los Medanos College | 59 | free |  |
| 3 | a team session writes a correction rule that gives the general education pattern its units, then rescores the saved record | statewide | 54 | free |  |
| 4 | a reader change finds the program's page (a free page read first) | City College of San Francisco | 52 | free |  |
| 5 | a scorer reading for a noncredit total in hours | statewide | 49 | free |  |
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
| Saddleback College | saddleback.curriqunet.com | 7 | $0.56 | yes |
| Coastline Community College | catalog.cccd.edu | 6 | $0.33 | yes |
| El Camino College | catalog.elcamino.edu | 4 | $0.26 | yes |
| Los Angeles Southwest College | lasc.edu | 4 | $0.26 | yes |
| MiraCosta College | catalog.miracosta.edu | 4 | $0.34 | yes |
| North Orange Continuing Education | catalog.nocccd.edu | 4 | $0.18 | yes |
| Sacramento City College | scc.losrios.edu | 4 | $0.36 | yes |
| Shasta College | scmainweb.s3.us-west-1.amazonaws.com | 4 | $0.38 | yes |
| Cosumnes River College | crc.losrios.edu | 3 | $0.26 | yes |
| Napa Valley College | catalog.napavalley.edu | 3 | $0.19 | yes |
| Santiago Canyon College | sccollege.edu | 3 | $0.22 | yes |
| Allan Hancock College | hancockcollege.curriqunet.com | 2 | $0.16 | yes |
| Citrus College | catalog.citruscollege.edu | 2 | $0.13 | yes |
| College of the Canyons | canyons.edu | 2 | $0.15 | yes |
| College of the Redwoods | redwoods.elumenapp.com | 2 | $0.15 | yes |
| Copper Mountain College | cmccd.edu | 2 | $0.16 | yes |
| East Los Angeles College | elac.edu | 2 | $0.16 | yes |
| Long Beach City College | lbcc-public.courseleaf.com | 2 | $0.10 | yes |
| Los Angeles Harbor College | lahc.edu | 2 | $0.16 | yes |
