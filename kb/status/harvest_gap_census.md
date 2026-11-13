# Harvest gap census

Written by `kb/_harvest_gap_census.py` (2026-11-13 00:24Z, live). Every active program without a passing record, each with one cause and one lever. Counts are a snapshot; rerun `harvest-gap-census.yml` for today's.

Universe 20282 · passing 13524 · without a passing record 6758.

Read by the harvest but outside the universe: Active - Teachout Only 630, Approved 1423.

## By cause

| Cause | Programs |
|---|---:|
| parked college | 322 |
| college never read | 701 |
| no closed list in the Program Course File | 1604 |
| page not found | 940 |
| page found, never extracted | 9 |
| extracted, places none of its courses | 729 |
| extracted, no score (an error) | 5 |
| live, coverage fails | 206 |
| live, a course added | 2 |
| live, units unequal | 1207 |
| live, units incomplete | 610 |
| live, no figure stated | 423 |

## Top levers

| # | Lever | Where | Programs | Free or paid | Estimate |
|---:|---|---|---:|---|---:|
| 1 | the Program Course File lists no course for it: program-course-fetch.yml, or none exists | statewide | 1604 | free |  |
| 2 | a first read of a college never read (capture free, extraction paid) | Diablo Valley College | 260 | paid | $18.25 |
| 3 | a first read of a college never read (capture free, extraction paid) | Santiago Canyon College | 241 | paid | $16.92 |
| 4 | a scorer reading for a noncredit total in hours | statewide | 232 | free |  |
| 5 | reconcile steps give the general education pattern its units | statewide | 217 | free |  |
| 6 | a session takes the parked college back up under its decision | Glendale Community College | 183 | free |  |
| 7 | a first read of a college never read (capture free, extraction paid) | North Orange Continuing Education | 107 | paid | $7.51 |
| 8 | a reader change finds the program's page (a free page read first) | College of the Canyons | 101 | free |  |
| 9 | a first read of a college never read (capture free, extraction paid) | San Jose City College | 93 | paid | $6.53 |
| 10 | the college's reconcile steps, on the catalog's own words | Mt. San Antonio College | 92 | free |  |
| 11 | the college's reconcile steps, on the catalog's own words | Santa Barbara City College | 91 | free |  |
| 12 | the college's reconcile steps, on the catalog's own words | College of the Desert | 69 | free |  |
| 13 | a session takes the parked college back up under its decision | Los Medanos College | 59 | free |  |
| 14 | a session takes the parked college back up under its decision | Los Angeles Valley College | 58 | free |  |
| 15 | the college's reconcile steps, on the catalog's own words | East Los Angeles College | 52 | free |  |
| 16 | a reader change hands it its own page, then extraction | City College of San Francisco | 51 | paid | $3.47 |
| 17 | a reader change hands it its own page, then extraction | Santa Rosa Junior College | 44 | paid | $3.69 |
| 18 | the college's reconcile steps, on the catalog's own words | Shasta College | 44 | free |  |
| 19 | the college's reconcile steps, on the catalog's own words | Ventura College | 43 | free |  |
| 20 | the college's reconcile steps, on the catalog's own words | Santa Monica College | 42 | free |  |
| 21 | the college's reconcile steps, on the catalog's own words | Los Angeles Trade Technical College | 41 | free |  |
| 22 | the college's reconcile steps, on the catalog's own words | Grossmont College | 39 | free |  |
| 23 | the college's reconcile steps, on the catalog's own words | College of the Canyons | 38 | free |  |
| 24 | the college's reconcile steps, on the catalog's own words | San Diego College of Continuing Education | 37 | free |  |
| 25 | the college's reconcile steps, on the catalog's own words | City College of San Francisco | 35 | free |  |

## Next wave: one college per catalog host

| College | Host | Programs a read would gain | Estimate | Read before |
|---|---|---:|---:|---|
| Diablo Valley College | dvc.elumenapp.com | 260 | $18.25 | no |
| Santiago Canyon College | sccollege.edu | 241 | $16.92 | no |
| North Orange Continuing Education | catalog.nocccd.edu | 107 | $7.51 | no |
| San Jose City College | catalog.sjcc.edu | 93 | $6.53 | no |
| City College of San Francisco | ccsf.edu | 51 | $3.47 | yes |
| Santa Rosa Junior College | catalog.santarosa.edu | 49 | $4.11 | yes |
| American River College | arc.losrios.edu | 31 | $2.52 | yes |
| Cosumnes River College | crc.losrios.edu | 29 | $2.53 | yes |
| Southwestern College | catalog.swccd.edu | 28 | $1.75 | yes |
| College of the Desert | catalog.collegeofthedesert.edu | 27 | $2.14 | yes |
| Fresno City College | fresno.curriqunet.com | 26 | $1.55 | yes |
| Sacramento City College | scc.losrios.edu | 22 | $2.00 | yes |
| Los Angeles Pierce College | lapc.edu | 20 | $1.55 | yes |
| Mendocino College | mendocino.edu | 19 | $1.19 | yes |
| San Bernardino Valley College | catalog.valleycollege.edu | 18 | $1.23 | yes |
| Foothill College | catalog.foothill.edu | 17 | $1.36 | yes |
| San Diego College of Continuing Education | sdccd.edu | 16 | $0.73 | yes |
| Shasta College | scmainweb.s3.us-west-1.amazonaws.com | 16 | $1.44 | yes |
| Clovis Community College | cloviscollege.edu | 14 | $1.01 | yes |
| Santa Monica College | catalog.smc.edu | 14 | $1.19 | yes |
