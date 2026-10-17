-- S407 SkyMesquite, 2026-10-17: Los Angeles Mission College's procedure record v3. The v2 the row holds (S346's
-- program-map record) is kept whole; v3 adds the catalog step to the 2026-2027 PDF the schedules-and-catalog page
-- links, the page read, a nuance and the open question. The merge runs in SQL on the row's own record.
-- Through program_source_procedure_set, expecting the row's md5 4deb1dbacf10de0dfc08b7222eb8704f.
-- Rollback: program_source_registry_history holds the prior record.

select public.program_source_procedure_set('Los Angeles Mission College',
  p.procedure || jsonb_build_object('v', 3, 'catalog', x.a->'catalog',
    'steps', (p.procedure->'steps') || (x.a->'steps'),
    'open',  (p.procedure->'open')  || (x.a->'open'),
    'nuances', (p.procedure->'nuances') || (x.a->'nuances')),
  'S407 SkyMesquite, 2026-10-17 (catalog sweep, the PDF reader; page read 39053259803)',
  '4deb1dbacf10de0dfc08b7222eb8704f')
from public.program_source_registry p,
  (select $add${"catalog": {"start": "https://www.lamc.edu/academics/calendar-schedules/schedules-catalog", "follow": "2026/2027 Catalog | PDF", "format": "pdf", "timeout_s": 900, "why": "The schedules-and-catalog page links the whole 2026-2027 catalog as one PDF under the words 2026/2027 Catalog | PDF (page read 39053259803). The registry's catalog_url is that page; the PDF step reads the file it links."}, "steps": [{"run": "39053259803", "date": "2026-10-17", "plan": "kb/college_reads/lamc_catalog_address.json", "found": "The 2026-2027 catalog is one PDF (sites/lamc.edu/files/2026-08/LAMC-Catalog-2026-2027.pdf); the page also links each term's schedule as a PDF.", "loads": 1, "reached": 1}], "open": [{"question": "Every program's requirements as the 2026-2027 PDF prints them", "next": "A capture-only read (extract=0), then extraction under the $40 go."}], "nuances": ["The registry files the format as pdf_by_section; the 2026-2027 catalog is a single PDF. The page links schedules as PDFs too, so the step names the catalog link's words."]}$add$::jsonb a) x
where p.college = 'Los Angeles Mission College';
