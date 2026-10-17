-- S402 SkyToyon, 2026-10-16: Contra Costa College's procedure record v2. The record the row holds is kept whole;
-- v2 adds the eLumen catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of it is retyped.
-- Through program_source_procedure_set, expecting the row's md5 ea5f3277a796a8444f8517e3d3529580; the history trigger files it.
-- Rollback: program_source_registry_history holds the prior record.
-- Additions written by kb/_program_source_procedure_v1.py --merge.
-- Applied 2026-10-17 ~03:2xZ through execute_sql, after display build d4ac5009f5aa's apply (run 38984134036): was_md5 ea5f3277a796a8444f8517e3d3529580, md5 5d1f74bef90634272828a92dda6bf493.

select public.program_source_procedure_set('Contra Costa College',
  p.procedure || jsonb_build_object('v', 2,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S402 SkyToyon, 2026-10-16 (the catalog sweep: read 38979730323, load 38982462613, display 38984134036)',
  'ea5f3277a796a8444f8517e3d3529580')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "ccc.elumenapp.com", "access": "open", "platform": "elumen", "note": "Contra Costa College's eLumen catalog (2026-2027)."}], "steps": [{"run": "38979730323", "date": "2026-10-16", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "135 pages in 189 loads (13 min). 97 of 105 programs with a course list found a page (97 from the catalog's own menu); 97 extracted with function v10 for $6.44; 57 pass the machine checks."}, {"run": "38982462613", "date": "2026-10-16", "plan": "program-requirements-college.yml, load", "found": "88 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_contra_costa_38982462613.json); 9 place none of their listed courses and stay out."}, {"run": "38984134036", "date": "2026-10-16", "plan": "program-requirements-college.yml, display", "found": "Display build d4ac5009f5aa applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "40 of 97 records fail the arithmetic check, 9 the coverage check, 0 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "3 programs with a course list found no page; 5 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "9 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'Contra Costa College';
