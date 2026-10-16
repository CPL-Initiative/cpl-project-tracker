-- S400 SkyBirch, 2026-10-16: Madera College's procedure record v2. The record the row holds is kept whole;
-- v2 adds the curriQunet catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of it is retyped.
-- Through program_source_procedure_set, expecting the row's md5 3f4746511ff602ed3fbf4712f47d5473; the history trigger files it.
-- Rollback: program_source_registry_history holds the prior record.
-- Additions written by kb/_program_source_procedure_v1.py --merge.
-- Applied 2026-10-16 ~20:39Z through execute_sql, after display build 9c74da80bad7's apply (run 38948259433): was_md5 3f4746511ff602ed3fbf4712f47d5473, md5 4dcf254ea0161c68a390263dd2b37717.

select public.program_source_procedure_set('Madera College',
  p.procedure || jsonb_build_object('v', 2,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S400 SkyBirch, 2026-10-16 (the catalog sweep: read 38935148408, load 38941353675, display 38948259433)',
  '3f4746511ff602ed3fbf4712f47d5473')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "madera.curriqunet.com", "access": "open", "platform": "curriqunet", "note": "Madera College's curriQunet catalog (2026-2027)."}], "steps": [{"run": "38935148408", "date": "2026-10-16", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "114 pages in 189 loads (15 min). 106 of 111 programs with a course list found a page (106 from the catalog's own index); 106 extracted with function v10 for $6.89; 81 pass the machine checks."}, {"run": "38941353675", "date": "2026-10-16", "plan": "program-requirements-college.yml, load", "found": "98 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_madera_38941353675.json); 8 place none of their listed courses and stay out."}, {"run": "38948259433", "date": "2026-10-16", "plan": "program-requirements-college.yml, display", "found": "Display build 9c74da80bad7 applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "23 of 106 records fail the arithmetic check, 13 the coverage check, 4 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "4 programs with a course list found no page; 1 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "8 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'Madera College';
