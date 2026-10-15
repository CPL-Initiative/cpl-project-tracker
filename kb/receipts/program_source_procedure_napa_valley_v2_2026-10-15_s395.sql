-- S395 SkyHawthorn, 2026-10-15: Napa Valley College's procedure record v2. S346's v1 (the refused program
-- mapper, its probe step and open question, the answers, nuances and workaround) is kept whole;
-- v2 adds the CourseLeaf catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of v1 is retyped.
-- Through program_source_procedure_set, expecting v1's md5 604e70cc5c844ff5ac1b592b93dd69d3; the history trigger files v1.
-- Rollback: program_source_registry_history holds v1.
-- Additions written by kb/_program_source_procedure_v1.py.

select public.program_source_procedure_set('Napa Valley College',
  p.procedure || jsonb_build_object('v', 2,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S395 SkyHawthorn, 2026-10-15 (the catalog sweep: read 38748853261, load 38755975139, display 38761398479)',
  '604e70cc5c844ff5ac1b592b93dd69d3')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "catalog.napavalley.edu", "access": "open", "platform": "courseleaf", "note": "Napa Valley College's CourseLeaf catalog (2026-2027). sitemap.xml lists 265 addresses, 173 of them program pages."}], "steps": [{"run": "38748853261", "date": "2026-10-15", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "173 pages in 188 loads (15 min). 98 of 111 programs with a course list found a page (98 by sitemap page); 98 extracted with function v10 for $6.36; 83 pass the machine checks."}, {"run": "38755975139", "date": "2026-10-15", "plan": "program-requirements-college.yml, load", "found": "94 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_napa_valley_38755975139.json); 4 place none of their listed courses and stay out."}, {"run": "38761398479", "date": "2026-10-15", "plan": "program-requirements-college.yml, display", "found": "Display build 515c9d71e086 applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "15 of 98 records fail the arithmetic check, 4 the coverage check, 0 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "5 programs with a course list found no page; 8 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "4 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'Napa Valley College';
