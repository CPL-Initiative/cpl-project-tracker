-- S407 SkyMesquite, 2026-10-17: Folsom Lake College's procedure record v3. The record the row holds is kept whole;
-- v3 adds the custom_html catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of it is retyped.
-- Through program_source_procedure_set, expecting the row's md5 d0346aaa793d0a4a0cb026a7a84cfc15; the history trigger files it.
-- Rollback: program_source_registry_history holds the prior record.
-- Additions written by kb/_program_source_procedure_v1.py --merge.

select public.program_source_procedure_set('Folsom Lake College',
  p.procedure || jsonb_build_object('v', 3,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S407 SkyMesquite, 2026-10-17 (the catalog sweep: read 39046850071, load 39047539254, display 39052136437)',
  'd0346aaa793d0a4a0cb026a7a84cfc15')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "flc.losrios.edu", "access": "open", "platform": "pdf", "note": "Folsom Lake College's 2026-2027 catalog, as one PDF. Read from the copy Sam filed on the catalog-files release (the hand-filed step, #2199), its sha256 pinned on the first fetch; the college's host refuses the reader. The Los Rios hosts answer the reader 404."}], "steps": [{"run": "39046850071", "date": "2026-10-17", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "the PDF's 500 pages in 1 load, by pypdf (1 min). 107 of 108 programs with a course list found a page (107 by their run of PDF pages); 107 extracted with function v10 for $9.43; 83 pass the machine checks."}, {"run": "39047539254", "date": "2026-10-17", "plan": "program-requirements-college.yml, load", "found": "104 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_folsom_lake_39047539254.json); 3 place none of their listed courses and stay out."}, {"run": "39052136437", "date": "2026-10-17", "plan": "program-requirements-college.yml, display", "found": "Display build fec9782a4dbc applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "23 of 107 records fail the arithmetic check, 3 the coverage check, 0 the invented-course check and 1 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "1 programs with a course list found no page; 0 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "3 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'Folsom Lake College';
