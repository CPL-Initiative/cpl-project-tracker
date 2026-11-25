# Local subject titles to find

`20261125_local_subject_codes_without_titles.csv` lists every college and local subject code in the state course list
whose printed subject title (the catalog's heading) is not yet collected: one row per college and code, with one
sample course number and title. Sam asked for it on 2026-11-25 so COBIx can find the titles by web search. A
title decides the code's common subject far better than the letters do (one code can mean two subjects at two
colleges: Glendale's AT is Flight Attendant).

Fill `local_subject_title` with the heading as the catalog prints it. Leave every other column as it stands.

`recommended_title`, `title_confidence`, `title_level` and `title_why` are a starting guess, never an answer: the Subjects
recommender (`kb/_build_local_subject_recommendations.py`) run for every college. Its sources (the same code at other
colleges or in the district, the courses that share an M-ID, C-ID or CCN with a titled code) were measured against the
1,496 titles already collected, each left out of its own vote; the confidence is that measured share. High is 90% or
better, Medium 60% or better. Course joins can mislead (Diablo Valley's FTVE reads Law): confirm against the catalog.

Tiers, in order of the work each unblocks:

1. The code carries courses on one of the 88 stray M-ID codes, which wait to go back to the holding pen
   (`r-no-mid-on-a-stray-code-sam-2026-11-25`).
2. The code has courses under Needs an M-ID, and its common subject is below 0.9 confidence.
3. The code has courses under Needs an M-ID, and its common subject is already confident.
4. The common subject is below 0.9 confidence; its courses already have M-IDs, which the title would check.
5. The rest.

Sources: `coci_lookup_data.js` (the state list), `unified_courses_members.js` and `kb/coci_not_applicable.json` (the
List's own Needs an M-ID test, 1,819 courses), `kb/status/local_subject_titles.json` (the 19 colleges read so far)
and `kb/status/statewide_subject_codes.json` (the common subject and its confidence). Built in session S730.
