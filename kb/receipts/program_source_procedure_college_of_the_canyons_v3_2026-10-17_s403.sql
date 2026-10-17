-- S403 SkyYarrow, 2026-10-17: College of the Canyons's procedure record v3. The record the row holds is kept whole;
-- v3 adds the single-PDF catalog host, the catalog sweep's read, load and display runs, and what
-- the read left open. The merge runs in SQL on the row's own record, so nothing of it is retyped.
-- Through program_source_procedure_set, expecting the row's md5 b0af7d151bd6f199173ef97abfed6dcb; the history trigger files it.
-- Rollback: program_source_registry_history holds the prior record.
-- Additions written by kb/_program_source_procedure_v1.py --merge.

select public.program_source_procedure_set('College of the Canyons',
  p.procedure || jsonb_build_object('v', 3,
    'hosts', (p.procedure->'hosts') || (x.a->'hosts'),
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open')),
  'S403 SkyYarrow, 2026-10-17 (the catalog sweep: read 39006378829, load 39007624888, display 39011116868)',
  'b0af7d151bd6f199173ef97abfed6dcb')
from public.program_source_registry p,
  (select $add${"hosts": [{"host": "www.canyons.edu", "access": "open", "platform": "pdf", "note": "College of the Canyons's single-PDF catalog (2026-2027)."}], "steps": [{"run": "39006378829", "date": "2026-10-17", "plan": "program-requirements-college.yml, read with extraction (the catalog sweep; Sam's standing go of 2026-10-14, up to $40 a college)", "found": "the PDF's 432 pages in 1 load, by pypdf (2 min). 160 of 264 programs with a course list found a page (160 by their run of PDF pages); 160 extracted with function v10 for $13.55; 104 pass the machine checks."}, {"run": "39007624888", "date": "2026-10-17", "plan": "program-requirements-college.yml, load", "found": "148 records inserted unchecked (receipt kb/receipts/program_requirement_records_college_college_of_the_canyons_39007624888.json); 12 place none of their listed courses and stay out."}, {"run": "39011116868", "date": "2026-10-17", "plan": "program-requirements-college.yml, display", "found": "Display build 7f4744e8e4ae applied from main; the applied record beside the receipt is the rollback."}], "open": [{"question": "43 of 160 records fail the arithmetic check, 34 the coverage check, 23 the invented-course check and 0 the outcomes check.", "next": "Measure the Major only and degree-figure gaps per page layout, then write this catalog's reconcile steps (kb/program_requirements_reconcile.json) before any record is confirmed."}, {"question": "104 programs with a course list found no page; 0 lost their page to a program it names more fully.", "next": "Read two of them against the catalog's own program index before a re-read."}, {"question": "12 records place none of their listed courses and stay out of the load.", "next": "Read two of their pages for the codes they print before a re-read."}]}$add$::jsonb a) x
where p.college = 'College of the Canyons';
