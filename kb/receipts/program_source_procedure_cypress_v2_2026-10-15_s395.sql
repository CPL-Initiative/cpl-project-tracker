-- S395 SkyHawthorn, 2026-10-15: Cypress College's procedure record v2. S346's v1 (the refused program
-- mapper, its probe step and open question, the answers, nuances and workaround) is kept whole;
-- v2 adds the CourseLeaf catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of v1 is retyped.
-- Through program_source_procedure_set, expecting v1's md5 527fc4b10a934c46251f3c87aa99775f; the history trigger files v1.
-- Rollback: program_source_registry_history holds v1.
-- Additions written by kb/_program_source_procedure_v1.py.
-- Applied 2026-10-15 ~15:50Z through execute_sql, after display build 515c9d71e086's apply (run 38761398479): was_md5 527fc4b10a934c46251f3c87aa99775f, md5 0e4476987b9c29a16e8b0e6fa4e9f557.

select public.program_source_procedure_set('Cypress College',
  p.procedure || jsonb_build_object('v', 2,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S395 SkyHawthorn, 2026-10-15 (the catalog sweep: read 38748866826, load 38755991293, display 38761398479)',
  '527fc4b10a934c46251f3c87aa99775f')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "catalog.nocccd.edu", "access": "open", "platform": "courseleaf", "note": "Cypress College's CourseLeaf catalog (2026-2027). sitemap.xml lists 1347 addresses, 376 of them program pages under /cypress-college/. Codes end in a spaced campus letter (AJ 160 C); the readers take it as the code's suffix since #2144."}], "steps": [{"run": "38748866826", "date": "2026-10-15", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "376 pages in 390 loads (32 min). 260 of 282 programs with a course list found a page (260 by sitemap page); 260 extracted with function v10 for $17.18; 224 pass the machine checks."}, {"run": "38755991293", "date": "2026-10-15", "plan": "program-requirements-college.yml, load", "found": "251 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_cypress_38755991293.json); 9 place none of their listed courses and stay out."}, {"run": "38761398479", "date": "2026-10-15", "plan": "program-requirements-college.yml, display", "found": "Display build 515c9d71e086 applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "36 of 260 records fail the arithmetic check, 9 the coverage check, 0 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "16 programs with a course list found no page; 6 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "9 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'Cypress College';
