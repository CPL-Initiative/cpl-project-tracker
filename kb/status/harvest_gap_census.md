# Harvest gap census

Written by `kb/_harvest_gap_census.py` (2026-11-19 13:19Z, live). Every active program without a passing record, each with one cause and one lever. Counts are a snapshot; rerun `harvest-gap-census.yml` for today's.

Universe 20282 · passing 14986 · without a passing record 5203.

Of the passing, 53 counts as passing on the tab; the scorer's own test fails (listed in the JSON, not counted as gaps).

Collected with a named gap, out of the gap: 93 (catalog_figures_differ 20, no_hours_read 51, no_units_read 22).

Read by the harvest but outside the universe: Active - Teachout Only 630, Approved 1423.

Named gap, 138 programs: "General-education pattern certificate. It has no fixed course list by design."

Named gap, 4 programs: "The state lists this program twice. The other listing has the course list."

## By cause

| Cause | Programs |
|---|---:|
| parked college | 96 |
| no closed list in the Program Course File | 1747 |
| page not found | 1161 |
| page found, never extracted | 13 |
| extracted, places none of its courses | 468 |
| extracted, no score (an error) | 5 |
| live, coverage fails | 203 |
| live, a course added | 4 |
| live, units unequal | 1013 |
| live, units incomplete | 493 |

## Top levers

| # | Lever | Where | Programs | Free or paid | Estimate |
|---:|---|---|---:|---|---:|
| 1 | the Program Course File lists no course for it: program-course-fetch.yml, or none exists | statewide | 1747 | free |  |
| 2 | a team session writes a correction rule that gives the general education pattern its units, then rescores the saved record | statewide | 209 | free |  |
| 3 | a reader change finds the program's page (a free page read first) | College of the Canyons | 101 | free |  |
| 4 | a scorer reading for a noncredit total in hours | statewide | 68 | free |  |
| 5 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | Glendale Community College | 64 | free |  |
| 6 | a reader change finds the program's page (a free page read first) | City College of San Francisco | 60 | free |  |
| 7 | a session takes the parked college back up under its decision | Los Medanos College | 59 | free |  |
| 8 | a reader change finds the program's page (a free page read first) | Santa Rosa Junior College | 41 | free |  |
| 9 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | Santa Monica College | 41 | free |  |
| 10 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | College of the Canyons | 37 | free |  |
| 11 | a reader change finds the program's page (a free page read first) | Ohlone College | 36 | free |  |
| 12 | a reader change hands it its own page, then extraction | American River College | 31 | paid | $2.53 |
| 13 | a reader change finds the program's page (a free page read first) | San Joaquin Delta College | 30 | free |  |
| 14 | a reader change hands it its own page, then extraction | Cosumnes River College | 29 | paid | $2.53 |
| 15 | a reader change hands it its own page, then extraction | Southwestern College | 28 | paid | $1.75 |
| 16 | a reader change finds the program's page (a free page read first) | Santa Barbara City College | 28 | free |  |
| 17 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | City College of San Francisco | 28 | free |  |
| 18 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | Santa Rosa Junior College | 27 | free |  |
| 19 | a reader change hands it its own page, then extraction | Fresno City College | 26 | paid | $1.55 |
| 20 | a reader change finds the program's page (a free page read first) | Victor Valley College | 26 | free |  |
| 21 | a team session writes correction rules from the catalog's own wording, then rescores the saved record | Clovis Community College | 26 | free |  |
| 22 | a reader change finds the program's page (a free page read first) | Diablo Valley College | 25 | free |  |
| 23 | a reader change finds the program's page (a free page read first) | Laney College | 25 | free |  |
| 24 | a reader change finds the program's page (a free page read first) | Mt. San Antonio College | 25 | free |  |
| 25 | a reader change finds the program's page (a free page read first) | Saddleback College | 25 | free |  |

## Next wave: one college per catalog host

| College | Host | Programs a read would gain | Estimate | Read before |
|---|---|---:|---:|---|
| American River College | arc.losrios.edu | 31 | $2.53 | yes |
| Cosumnes River College | crc.losrios.edu | 29 | $2.53 | yes |
| Southwestern College | catalog.swccd.edu | 28 | $1.75 | yes |
| Fresno City College | fresno.curriqunet.com | 26 | $1.55 | yes |
| College of the Desert | catalog.collegeofthedesert.edu | 23 | $1.83 | yes |
| Sacramento City College | scc.losrios.edu | 22 | $2.00 | yes |
| San Bernardino Valley College | catalog.valleycollege.edu | 16 | $1.10 | yes |
| San Diego College of Continuing Education | sdccd.edu | 16 | $0.73 | yes |
| Santa Monica College | catalog.smc.edu | 14 | $1.19 | yes |
| Barstow Community College | barstow.edu | 13 | $0.86 | yes |
| Orange Coast College | catalog.cccd.edu | 13 | $0.92 | yes |
| Cerro Coso Community College | cerrocoso.edu | 11 | $0.82 | yes |
| College of the Canyons | canyons.edu | 11 | $0.93 | yes |
| Los Angeles Harbor College | lahc.edu | 11 | $0.83 | yes |
| Antelope Valley College | avc.elumenapp.com | 10 | $0.73 | yes |
| Los Angeles Southwest College | lasc.edu | 9 | $0.58 | yes |
| Sierra College | catalog.sierracollege.edu | 9 | $0.83 | yes |
| Contra Costa College | ccc.elumenapp.com | 8 | $0.53 | yes |
| Madera College | madera.curriqunet.com | 8 | $0.52 | yes |
| College of the Sequoias | catalog.cos.edu | 7 | $0.49 | yes |
