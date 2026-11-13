# Harvest gap census

Written by `kb/_harvest_gap_census.py` (2026-11-13 18:04Z, live). Every active program without a passing record, each with one cause and one lever. Counts are a snapshot; rerun `harvest-gap-census.yml` for today's.

Universe 20282 · passing 14531 · without a passing record 5751.

Of the passing, 53 counts as passing on the tab; the scorer's own test fails (listed in the JSON, not counted as gaps).

Read by the harvest but outside the universe: Active - Teachout Only 630, Approved 1423.

## By cause

| Cause | Programs |
|---|---:|
| parked college | 284 |
| no closed list in the Program Course File | 1699 |
| page not found | 988 |
| page found, never extracted | 14 |
| extracted, places none of its courses | 737 |
| extracted, no score (an error) | 5 |
| live, coverage fails | 225 |
| live, a course added | 2 |
| live, units unequal | 1230 |
| live, units incomplete | 567 |

## Top levers

| # | Lever | Where | Programs | Free or paid | Estimate |
|---:|---|---|---:|---|---:|
| 1 | the Program Course File lists no course for it: program-course-fetch.yml, or none exists | statewide | 1699 | free |  |
| 2 | reconcile steps give the general education pattern its units | statewide | 221 | free |  |
| 3 | a session takes the parked college back up under its decision | Glendale Community College | 183 | free |  |
| 4 | a scorer reading for a noncredit total in hours | statewide | 118 | free |  |
| 5 | a reader change finds the program's page (a free page read first) | College of the Canyons | 101 | free |  |
| 6 | a session takes the parked college back up under its decision | Los Medanos College | 59 | free |  |
| 7 | a reader change hands it its own page, then extraction | City College of San Francisco | 51 | paid | $3.47 |
| 8 | a reader change hands it its own page, then extraction | Santa Rosa Junior College | 44 | paid | $3.69 |
| 9 | the pipeline's reconcile steps for the college, on the catalog's own words | Ventura College | 42 | free |  |
| 10 | the pipeline's reconcile steps for the college, on the catalog's own words | Santa Monica College | 41 | free |  |
| 11 | the pipeline's reconcile steps for the college, on the catalog's own words | College of the Canyons | 38 | free |  |
| 12 | the pipeline's reconcile steps for the college, on the catalog's own words | Shasta College | 37 | free |  |
| 13 | the pipeline's reconcile steps for the college, on the catalog's own words | City College of San Francisco | 35 | free |  |
| 14 | a reader change finds the program's page (a free page read first) | Ohlone College | 33 | free |  |
| 15 | the pipeline's reconcile steps for the college, on the catalog's own words | Cuyamaca College | 32 | free |  |
| 16 | a reader change hands it its own page, then extraction | American River College | 31 | paid | $2.52 |
| 17 | a reader change finds the program's page (a free page read first) | San Joaquin Delta College | 30 | free |  |
| 18 | the pipeline's reconcile steps for the college, on the catalog's own words | Clovis Community College | 30 | free |  |
| 19 | the pipeline's reconcile steps for the college, on the catalog's own words | Santa Rosa Junior College | 30 | free |  |
| 20 | a reader change hands it its own page, then extraction | Cosumnes River College | 29 | paid | $2.53 |
| 21 | the pipeline's reconcile steps for the college, on the catalog's own words | Cabrillo College | 29 | free |  |
| 22 | the pipeline's reconcile steps for the college, on the catalog's own words | Fullerton College | 29 | free |  |
| 23 | a reader change hands it its own page, then extraction | Southwestern College | 28 | paid | $1.75 |
| 24 | the pipeline's reconcile steps for the college, on the catalog's own words | College of the Sequoias | 28 | free |  |
| 25 | a reader change hands it its own page, then extraction | Fresno City College | 26 | paid | $1.55 |

## Next wave: one college per catalog host

| College | Host | Programs a read would gain | Estimate | Read before |
|---|---|---:|---:|---|
| City College of San Francisco | ccsf.edu | 51 | $3.47 | yes |
| Santa Rosa Junior College | catalog.santarosa.edu | 49 | $4.11 | yes |
| American River College | arc.losrios.edu | 31 | $2.52 | yes |
| Cosumnes River College | crc.losrios.edu | 29 | $2.53 | yes |
| Southwestern College | catalog.swccd.edu | 28 | $1.75 | yes |
| Fresno City College | fresno.curriqunet.com | 26 | $1.55 | yes |
| College of the Desert | catalog.collegeofthedesert.edu | 23 | $1.83 | yes |
| Sacramento City College | scc.losrios.edu | 22 | $2.00 | yes |
| San Bernardino Valley College | catalog.valleycollege.edu | 22 | $1.51 | yes |
| Los Angeles Pierce College | lapc.edu | 21 | $1.63 | yes |
| Mendocino College | mendocino.edu | 19 | $1.19 | yes |
| Foothill College | catalog.foothill.edu | 17 | $1.36 | yes |
| San Diego College of Continuing Education | sdccd.edu | 16 | $0.73 | yes |
| Shasta College | scmainweb.s3.us-west-1.amazonaws.com | 16 | $1.44 | yes |
| Clovis Community College | cloviscollege.edu | 14 | $1.01 | yes |
| Santa Monica College | catalog.smc.edu | 14 | $1.19 | yes |
| West Los Angeles College | wlac.edu | 14 | $0.98 | yes |
| Barstow Community College | barstow.edu | 13 | $0.86 | yes |
| Orange Coast College | catalog.cccd.edu | 13 | $0.92 | yes |
| Cerro Coso Community College | cerrocoso.edu | 11 | $0.82 | yes |
