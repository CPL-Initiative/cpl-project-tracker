# Harvest gap census

Written by `kb/_harvest_gap_census.py` (2026-11-23 15:53Z, live). Every active program without a passing record, each with one cause and one lever. Counts are a snapshot; rerun `harvest-gap-census.yml` for today's.

Universe 20282 · passing 15454 · without a passing record 4508.

Of the passing, 54 counts as passing on the tab; the scorer's own test fails (listed in the JSON, not counted as gaps).

Collected with a named gap, out of the gap: 320 (catalog_figures_differ 20, ge_units_not_read 131, hours_total_differs 11, hours_total_not_read 32, hours_within_printed_range 7, lists_past_their_figure 17, no_hours_read 51, no_units_read 22, section_cut_off 10, total_differs 12, total_not_printed 7).

Read by the harvest but outside the universe: Active - Teachout Only 630, Approved 1423.

Named gap, 136 programs: "General-education pattern certificate. It has no fixed course list by design."

Named gap, 4 programs: "The state lists this program twice. The other listing has the course list."

## By cause

| Cause | Programs |
|---|---:|
| parked college | 94 |
| no closed list in the Program Course File | 1747 |
| page not found | 1097 |
| page found, never extracted | 19 |
| extracted, places none of its courses | 196 |
| extracted, not loaded | 1 |
| extracted, no score (an error) | 4 |
| live, coverage fails | 156 |
| live, a course added | 3 |
| live, units unequal | 903 |
| live, units incomplete | 288 |

## Top levers

| # | Lever | Where | Programs | Free or paid | Estimate |
|---:|---|---|---:|---|---:|
| 1 | the Program Course File lists no course for it: program-course-fetch.yml, or none exists | statewide | 1747 | free |  |
| 2 | a session takes the parked college back up under its decision | Los Medanos College | 59 | free |  |
| 3 | a team session writes a correction rule that gives the general education pattern its units, then rescores the saved record | statewide | 55 | free |  |
| 4 | a reader change finds the program's page (a free page read first) | City College of San Francisco | 52 | free |  |
| 5 | a scorer reading for a noncredit total in hours | statewide | 49 | free |  |
| 6 | a reader change finds the program's page (a free page read first) | Ohlone College | 34 | free |  |
| 7 | a reader change finds the program's page (a free page read first) | Mt. San Antonio College | 28 | free |  |
| 8 | a reader change finds the program's page (a free page read first) | Santa Barbara City College | 28 | free |  |
| 9 | a reader change finds the program's page (a free page read first) | Orange Coast College | 27 | free |  |
| 10 | a reader change finds the program's page (a free page read first) | Fresno City College | 26 | free |  |
| 11 | a reader change finds the program's page (a free page read first) | Victor Valley College | 26 | free |  |
| 12 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | Santa Monica College | 26 | free |  |
| 13 | a reader change finds the program's page (a free page read first) | Saddleback College | 25 | free |  |
| 14 | a reader change finds the program's page (a free page read first) | Diablo Valley College | 24 | free |  |
| 15 | a reader change finds the program's page (a free page read first) | Mt. San Jacinto College | 24 | free |  |
| 16 | a reader change finds the program's page (a free page read first) | San Joaquin Delta College | 24 | free |  |
| 17 | a reader change finds the program's page (a free page read first) | Southwestern College | 24 | free |  |
| 18 | a reader change hands it its own page, then extraction | College of the Desert | 23 | paid | $1.83 |
| 19 | a reader change finds the program's page (a free page read first) | Allan Hancock College | 23 | free |  |
| 20 | a reader change finds the program's page (a free page read first) | West Los Angeles College | 23 | free |  |
| 21 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | College of the Sequoias | 22 | free |  |
| 22 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | Contra Costa College | 22 | free |  |
| 23 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | El Camino College | 22 | free |  |
| 24 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | Ventura College | 22 | free |  |
| 25 | a reader change finds the program's page (a free page read first) | Foothill College | 21 | free |  |

## Next wave: one college per catalog host

| College | Host | Programs a read would gain | Estimate | Read before |
|---|---|---:|---:|---|
| College of the Desert | catalog.collegeofthedesert.edu | 23 | $1.83 | yes |
| San Bernardino Valley College | catalog.valleycollege.edu | 16 | $1.10 | yes |
| Antelope Valley College | avc.elumenapp.com | 10 | $0.73 | yes |
| Los Angeles Southwest College | lasc.edu | 9 | $0.58 | yes |
| Orange Coast College | catalog.cccd.edu | 8 | $0.58 | yes |
| Saddleback College | saddleback.curriqunet.com | 7 | $0.56 | yes |
| Mendocino College | mendocino.edu | 6 | $0.38 | yes |
| Santiago Canyon College | sccollege.edu | 6 | $0.43 | yes |
| American River College | arc.losrios.edu | 5 | $0.41 | yes |
| College of the Redwoods | redwoods.elumenapp.com | 5 | $0.37 | yes |
| MiraCosta College | catalog.miracosta.edu | 5 | $0.43 | yes |
| El Camino College | catalog.elcamino.edu | 4 | $0.26 | yes |
| North Orange Continuing Education | catalog.nocccd.edu | 4 | $0.18 | yes |
| Sacramento City College | scc.losrios.edu | 4 | $0.36 | yes |
| Shasta College | scmainweb.s3.us-west-1.amazonaws.com | 4 | $0.38 | yes |
| Allan Hancock College | hancockcollege.curriqunet.com | 3 | $0.24 | yes |
| College of the Canyons | canyons.edu | 3 | $0.23 | yes |
| Cosumnes River College | crc.losrios.edu | 3 | $0.26 | yes |
| East Los Angeles College | elac.edu | 3 | $0.23 | yes |
| Moorpark College | catalog.vcccd.edu | 3 | $0.22 | yes |
