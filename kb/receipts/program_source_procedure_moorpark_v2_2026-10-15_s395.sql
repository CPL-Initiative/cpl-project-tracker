-- S395 SkyHawthorn, 2026-10-15: Moorpark College's procedure record v2. S346's v1 (the refused program
-- mapper, its probe step and open question, the answers, nuances and workaround) is kept whole;
-- v2 adds the CourseLeaf catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of v1 is retyped.
-- Through program_source_procedure_set, expecting v1's md5 a5679f2dc5a07afe05cc495efcd9292e; the history trigger files v1.
-- Rollback: program_source_registry_history holds v1.
-- Additions written by kb/_program_source_procedure_v1.py.
-- Applied 2026-10-15 ~15:50Z through execute_sql, after display build 515c9d71e086's apply (run 38761398479): was_md5 a5679f2dc5a07afe05cc495efcd9292e, md5 a102aa8e0042bc274368404f5267b2b0.

select public.program_source_procedure_set('Moorpark College',
  p.procedure || jsonb_build_object('v', 2,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S395 SkyHawthorn, 2026-10-15 (the catalog sweep: read 38748862351, load 38755986436, display 38761398479)',
  'a5679f2dc5a07afe05cc495efcd9292e')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "catalog.vcccd.edu", "access": "open", "platform": "courseleaf", "note": "Moorpark College's CourseLeaf catalog (2026-2027). sitemap.xml lists 1147 addresses, 260 of them program pages under /moorpark/."}], "steps": [{"run": "38748862351", "date": "2026-10-15", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "260 pages in 294 loads (28 min). 99 of 145 programs with a course list found a page (6 by link search, 93 by sitemap page); 99 extracted with function v10 for $8.14; 31 pass the machine checks."}, {"run": "38755986436", "date": "2026-10-15", "plan": "program-requirements-college.yml, load", "found": "54 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_moorpark_38755986436.json); 45 place none of their listed courses and stay out."}, {"run": "38761398479", "date": "2026-10-15", "plan": "program-requirements-college.yml, display", "found": "Display build 515c9d71e086 applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "67 of 99 records fail the arithmetic check, 46 the coverage check, 1 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "7 programs with a course list found no page; 39 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "45 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'Moorpark College';
