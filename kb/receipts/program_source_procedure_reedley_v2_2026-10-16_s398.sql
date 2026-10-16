-- S398 SkyLinden, 2026-10-16: Reedley College's procedure record v2. The record the row holds is kept whole;
-- v2 adds the curriQunet catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of it is retyped.
-- Through program_source_procedure_set, expecting the row's md5 41cf27c54b8b939100fadc17518b6022; the history trigger files it.
-- Rollback: program_source_registry_history holds the prior record.
-- Additions written by kb/_program_source_procedure_v1.py --merge.
-- Applied 2026-10-16 ~14:20Z through execute_sql, after display build 66b50c86891e's apply (run 38909267523): was_md5 41cf27c54b8b939100fadc17518b6022, md5 9b604cf23b5b072fe7633027e0c870f0.

select public.program_source_procedure_set('Reedley College',
  p.procedure || jsonb_build_object('v', 2,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S398 SkyLinden, 2026-10-16 (the catalog sweep: read 38843477136, load 38847270389, display 38909267523)',
  '41cf27c54b8b939100fadc17518b6022')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "reedley.curriqunet.com", "access": "open", "platform": "curriqunet", "note": "Reedley College's curriQunet catalog (2026-2027). Its curriQunet index held 40 entries in 2 sections, so 36 of 200 programs with a course list found a page."}], "steps": [{"run": "38843477136", "date": "2026-10-16", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "40 pages in 130 loads (10 min). 36 of 200 programs with a course list found a page (36 from the catalog's own index); 36 extracted with function v10 for $2.18; 29 pass the machine checks."}, {"run": "38847270389", "date": "2026-10-16", "plan": "program-requirements-college.yml, load", "found": "36 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_reedley_38847270389.json)."}, {"run": "38909267523", "date": "2026-10-16", "plan": "program-requirements-college.yml, display", "found": "Display build 66b50c86891e applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "6 of 36 records fail the arithmetic check, 1 the coverage check, 1 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "130 programs with a course list found no page; 34 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}]}$add$::jsonb a) x
where p.college = 'Reedley College';
