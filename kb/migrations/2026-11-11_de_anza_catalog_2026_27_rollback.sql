-- Rollback of 2026-11-11_de_anza_catalog_2026_27.sql (S636): De Anza's catalog row as it stood before, read live
-- at 12:05Z 2026-11-11. Restore kb/hand_filed_catalogs/de_anza.json from retired/de_anza_2025-2026.json with it.
update public.program_source_registry
   set catalog_url      = 'https://www.deanza.edu/catalog/documents/dac_catalog_2025-2026.pdf',
       catalog_platform = 'pdf',
       catalog_year     = '2025-2026',
       catalog_format   = 'single_pdf',
       access_status    = 'blocked',
       corrected_by     = 'Sam (open-asks sheet 91; his go of 2026-10-17: "No need to ask me for approval on all these items"), applied by S407 SkyMesquite through supabase-migrate',
       corrected_at     = '2026-10-17 18:12:26.308913+00'
 where college = 'De Anza College'
   and catalog_url = 'https://deanza.elumenapp.com/catalog/2026-2027/home';
