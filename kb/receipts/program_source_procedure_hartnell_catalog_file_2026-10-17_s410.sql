-- S410 SkyYucca, 2026-10-17: Hartnell College's procedure record (v1 -> v2) gains a catalog step naming its
-- whole-catalog PDF. The Coursedog catalog page fetches the file by script from the vendor's public bucket and
-- links none (page read 39077713662: pdf-reports/catalogs/Kh0H2wSLmm8kmYgkuvWr answers with the file's address;
-- the program search reads catalogId Kh0H2wSLmm8kmYgkuvWr effective 2026-08-24). Since #2213 a PDF step may name
-- its file. Hosts and the read step merge onto the row's own record; nothing of v1 is retyped.
-- Through program_source_procedure_set, expecting the md5 of v1.
-- Applied 2026-10-18 by execute_sql: v 2, md5 1c120419c0aae33b458cf417dde2fac8 (was 500dfb4cc189f825f1d060e29ce28473).
-- Rollback: program_source_registry_history holds the prior record.

select public.program_source_procedure_set(p.college,
  p.procedure
    || jsonb_build_object(
         'v', (p.procedure->>'v')::int + 1,
         'catalog', jsonb_build_object(
           'why', 'The catalog page (hartnell.catalog.prod.coursedog.com) fetches its whole-catalog PDF by script from Coursedog''s public bucket and links none; page read 39077713662 printed the vendor call that names the file. The file prints each program''s lists with unspaced codes (ABT90) and its total; units come from COCI. Generated 2026-08-21 for the catalog in effect 2026-08-24.',
           'start', 'https://hartnell.catalog.prod.coursedog.com/',
           'file', 'https://coursedog-pdfs-public-prod.s3.us-east-2.amazonaws.com/hartnell_colleague/catalog/6cd77c15-b59c-4c31-a31a-792bcda015b0-hartnell_colleague-catalog-1787336752847.pdf',
           'format', 'pdf',
           'timeout_s', 900,
           'catalog_year', '2026-2027'),
         'hosts', coalesce(p.procedure->'hosts', '[]'::jsonb) || jsonb_build_array(
           jsonb_build_object('host', 'hartnell.catalog.prod.coursedog.com', 'access', 'open', 'platform', 'coursedog',
             'note', 'The college''s Coursedog catalog. Its scripts read programs from app.coursedog.com (program search, 100 programs) and the whole-catalog PDF from pdf-reports/catalogs/<catalogId> (page read 39077713662).'),
           jsonb_build_object('host', 'coursedog-pdfs-public-prod.s3.us-east-2.amazonaws.com', 'access', 'open', 'platform', 'coursedog',
             'note', 'Coursedog''s public bucket for generated catalog PDFs. Hartnell''s 427-page 2026-2027 catalog, generated 2026-08-21.')),
         'steps', coalesce(p.procedure->'steps', '[]'::jsonb) || jsonb_build_array(
           jsonb_build_object('run', '39077713662', 'date', '2026-10-17', 'plan', 'a network page read of the catalog front page (S409)',
             'found', 'The program search (catalogId Kh0H2wSLmm8kmYgkuvWr) and the whole-catalog PDF''s address on the vendor''s public bucket.'))),
  'S410 SkyYucca, 2026-10-17 (a catalog step naming the Coursedog PDF; page read 39077713662)',
  md5(p.procedure::text))
from public.program_source_registry p
where (p.college, md5(p.procedure::text)) in (('Hartnell College', '500dfb4cc189f825f1d060e29ce28473'));
