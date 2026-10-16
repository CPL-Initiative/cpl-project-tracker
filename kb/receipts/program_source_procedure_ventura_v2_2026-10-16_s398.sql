-- S398 SkyLinden, 2026-10-16: Ventura College's procedure record v2. The record the row holds is kept whole;
-- v2 adds the CourseLeaf catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of it is retyped.
-- Through program_source_procedure_set, expecting the row's md5 97e2ef7500f08a09588f6f2b2feda77a; the history trigger files it.
-- Rollback: program_source_registry_history holds the prior record.
-- Additions written by kb/_program_source_procedure_v1.py --merge.
-- Applied 2026-10-16 ~14:20Z through execute_sql, after display build 66b50c86891e's apply (run 38909267523): was_md5 97e2ef7500f08a09588f6f2b2feda77a, md5 d0f9291299a509b4f35c475e8e1ca7c4.

select public.program_source_procedure_set('Ventura College',
  p.procedure || jsonb_build_object('v', 2,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S398 SkyLinden, 2026-10-16 (the catalog sweep: read 38756014587, load 38842159685, display 38909267523)',
  '97e2ef7500f08a09588f6f2b2feda77a')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "catalog.vcccd.edu", "access": "open", "platform": "courseleaf", "note": "Ventura College's CourseLeaf catalog (2026-2027). sitemap.xml lists 1147 addresses, 295 of them program pages under /ventura/."}], "steps": [{"run": "38756014587", "date": "2026-10-15", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "295 pages in 329 loads (29 min). 131 of 178 programs with a course list found a page (3 by link search, 128 by sitemap page); 131 extracted with function v10 for $11.16; 55 pass the machine checks."}, {"run": "38842159685", "date": "2026-10-16", "plan": "program-requirements-college.yml, load", "found": "101 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_ventura_38842159685.json); 30 place none of their listed courses and stay out."}, {"run": "38909267523", "date": "2026-10-16", "plan": "program-requirements-college.yml, display", "found": "Display build 66b50c86891e applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "76 of 131 records fail the arithmetic check, 31 the coverage check, 1 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "8 programs with a course list found no page; 39 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "30 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'Ventura College';
