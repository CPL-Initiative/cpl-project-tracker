# Harvest gap census

Written by `kb/_harvest_gap_census.py` (2026-11-13, committed files only). Every active program without a passing record, each with one cause and one lever. Counts are a snapshot; rerun `harvest-gap-census.yml` for today's.

Universe 21574 · passing 14645 · without a passing record 6929.

## By cause

| Cause | Programs |
|---|---:|
| parked college | 358 |
| no closed list in the Program Course File | 1726 |
| page not found | 1174 |
| page found, never extracted | 29 |
| extracted, places none of its courses | 903 |
| extracted, no score (an error) | 5 |
| filed record fails, live state unknown | 2734 |

## Top levers

| # | Lever | Where | Programs | Free or paid | Estimate |
|---:|---|---|---:|---|---:|
| 1 | check the Program Course File for its courses (needs the live read) | statewide | 1726 | free |  |
| 2 | reconcile steps give the general education pattern its units | statewide | 254 | free |  |
| 3 | a scorer reading for a noncredit total in hours | statewide | 243 | free |  |
| 4 | a session takes the parked college back up under its decision | Glendale Community College | 196 | free |  |
| 5 | the college's reconcile steps, on the catalog's own words | College of the Desert | 131 | free |  |
| 6 | the college's reconcile steps, on the catalog's own words | Mt. San Antonio College | 108 | free |  |
| 7 | a reader change finds the program's page (a free page read first) | College of the Canyons | 104 | free |  |
| 8 | the college's reconcile steps, on the catalog's own words | Santa Barbara City College | 101 | free |  |
| 9 | a session takes the parked college back up under its decision | Los Angeles Valley College | 82 | free |  |
| 10 | a session takes the parked college back up under its decision | Los Medanos College | 59 | free |  |
| 11 | the college's reconcile steps, on the catalog's own words | East Los Angeles College | 55 | free |  |
| 12 | a reader change hands it its own page, then extraction | City College of San Francisco | 53 | paid | $3.60 |
| 13 | a reader change finds the program's page (a free page read first) | Palomar College | 49 | free |  |
| 14 | the college's reconcile steps, on the catalog's own words | Shasta College | 47 | free |  |
| 15 | a reader change hands it its own page, then extraction | Santa Rosa Junior College | 45 | paid | $3.78 |
| 16 | the college's reconcile steps, on the catalog's own words | Ventura College | 44 | free |  |
| 17 | the college's reconcile steps, on the catalog's own words | Santa Monica College | 42 | free |  |
| 18 | the college's reconcile steps, on the catalog's own words | Los Angeles Trade Technical College | 41 | free |  |
| 19 | the college's reconcile steps, on the catalog's own words | Grossmont College | 39 | free |  |
| 20 | the college's reconcile steps, on the catalog's own words | San Diego College of Continuing Education | 39 | free |  |
| 21 | the college's reconcile steps, on the catalog's own words | College of the Canyons | 38 | free |  |
| 22 | a reader change finds the program's page (a free page read first) | Mt. San Jacinto College | 36 | free |  |
| 23 | the college's reconcile steps, on the catalog's own words | Saddleback College | 36 | free |  |
| 24 | a reader change hands it its own page, then extraction | College of the Desert | 35 | paid | $2.78 |
| 25 | a reader change hands it its own page, then extraction | Cosumnes River College | 35 | paid | $3.06 |

## Next wave: one college per catalog host

| College | Host | Programs a read would gain | Estimate | Read before |
|---|---|---:|---:|---|
| City College of San Francisco | ccsf.edu | 53 | $3.60 | yes |
| Santa Rosa Junior College | catalog.santarosa.edu | 51 | $4.28 | yes |
| College of the Desert | collegeofthedesert.edu | 35 | $2.78 | yes |
| Cosumnes River College | crc.losrios.edu | 35 | $3.06 | yes |
| American River College | arc.losrios.edu | 33 | $2.69 | yes |
| Southwestern College | catalog.swccd.edu | 30 | $1.88 | yes |
| Fresno City College | fresno.curriqunet.com | 26 | $1.55 | yes |
| Mendocino College | mendocino.edu | 25 | $1.57 | yes |
| San Bernardino Valley College | catalog.valleycollege.edu | 25 | $1.71 | yes |
| Sacramento City College | scc.losrios.edu | 22 | $2.00 | yes |
| De Anza College | deanza.elumenapp.com | 21 | $1.63 | yes |
| Los Angeles Pierce College | lapc.edu | 21 | $1.63 | yes |
| Shasta College | scmainweb.s3.us-west-1.amazonaws.com | 21 | $1.88 | yes |
| Long Beach City College | lbcc-public.courseleaf.com | 19 | $0.99 | yes |
| San Diego College of Continuing Education | sdccd.edu | 19 | $0.86 | yes |
| Solano Community College | solano.edu | 18 | $1.46 | yes |
| Foothill College | catalog.foothill.edu | 17 | $1.36 | yes |
| MiraCosta College | catalog.miracosta.edu | 17 | $1.43 | yes |
| Barstow Community College | barstow.edu | 15 | $0.99 | yes |
| Clovis Community College | cloviscollege.edu | 15 | $1.09 | yes |
