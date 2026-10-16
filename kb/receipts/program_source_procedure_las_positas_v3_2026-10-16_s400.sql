-- S400 SkyBirch, 2026-10-16: Las Positas College's procedure record v3. The record the row holds is kept whole;
-- v3 adds the curriQunet catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of it is retyped.
-- Through program_source_procedure_set, expecting the row's md5 cd64d6c0b3002d7eeb0487e59635cbf4; the history trigger files it.
-- Rollback: program_source_registry_history holds the prior record.
-- Additions written by kb/_program_source_procedure_v1.py --merge.
-- Applied 2026-10-16 ~20:39Z through execute_sql, after display build 9c74da80bad7's apply (run 38948259433): was_md5 cd64d6c0b3002d7eeb0487e59635cbf4, md5 f6d7b991f4c091e06645cc24089fd62e.

select public.program_source_procedure_set('Las Positas College',
  p.procedure || jsonb_build_object('v', 3,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S400 SkyBirch, 2026-10-16 (the catalog sweep: read 38935144431, load 38941349599, display 38948259433)',
  'cd64d6c0b3002d7eeb0487e59635cbf4')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "laspositas.curriqunet.com", "access": "open", "platform": "curriqunet", "note": "Las Positas College's curriQunet catalog (2026-2027). The S399 read's index walk met two ECONNRESETs partway, so 20 of 201 programs found a page; a reread is queued."}], "steps": [{"run": "38935144431", "date": "2026-10-16", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "20 pages in 336 loads (25 min). 20 of 201 programs with a course list found a page (20 from the catalog's own index); 20 extracted with function v10 for $1.92; 8 pass the machine checks."}, {"run": "38941349599", "date": "2026-10-16", "plan": "program-requirements-college.yml, load", "found": "20 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_las_positas_38941349599.json)."}, {"run": "38948259433", "date": "2026-10-16", "plan": "program-requirements-college.yml, display", "found": "Display build 9c74da80bad7 applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "12 of 20 records fail the arithmetic check, 0 the coverage check, 0 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "69 programs with a course list found no page; 112 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}]}$add$::jsonb a) x
where p.college = 'Las Positas College';
