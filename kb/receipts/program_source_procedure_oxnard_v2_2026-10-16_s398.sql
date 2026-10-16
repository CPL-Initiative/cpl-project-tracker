-- S398 SkyLinden, 2026-10-16: Oxnard College's procedure record v2. The record the row holds is kept whole;
-- v2 adds the CourseLeaf catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of it is retyped.
-- Through program_source_procedure_set, expecting the row's md5 ba96a501ea464eb53f378a8c86cfe2b1; the history trigger files it.
-- Rollback: program_source_registry_history holds the prior record.
-- Additions written by kb/_program_source_procedure_v1.py --merge.
-- Applied 2026-10-16 ~14:20Z through execute_sql, after display build 66b50c86891e's apply (run 38909267523): was_md5 ba96a501ea464eb53f378a8c86cfe2b1, md5 f66688340b4cef925f2ba31c71f72db9.

select public.program_source_procedure_set('Oxnard College',
  p.procedure || jsonb_build_object('v', 2,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S398 SkyLinden, 2026-10-16 (the catalog sweep: read 38842203500, load 38847268056, display 38909267523)',
  'ba96a501ea464eb53f378a8c86cfe2b1')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "catalog.vcccd.edu", "access": "open", "platform": "courseleaf", "note": "Oxnard College's CourseLeaf catalog (2026-2027). sitemap.xml lists 1147 addresses, 241 of them program pages under /oxnard/."}], "steps": [{"run": "38842203500", "date": "2026-10-16", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "243 pages in 269 loads (24 min). 94 of 132 programs with a course list found a page (2 by link search, 92 by sitemap page); 94 extracted with function v10 for $8.73; 37 pass the machine checks."}, {"run": "38847268056", "date": "2026-10-16", "plan": "program-requirements-college.yml, load", "found": "64 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_oxnard_38847268056.json); 30 place none of their listed courses and stay out."}, {"run": "38909267523", "date": "2026-10-16", "plan": "program-requirements-college.yml, display", "found": "Display build 66b50c86891e applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "56 of 94 records fail the arithmetic check, 31 the coverage check, 1 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "7 programs with a course list found no page; 31 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "30 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'Oxnard College';
