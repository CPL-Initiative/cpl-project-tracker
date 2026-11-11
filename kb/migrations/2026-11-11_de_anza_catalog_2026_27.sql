-- STAGED, NOT APPLIED (2026-11-11 12:10Z). The session's permission check refused the push that would have applied
-- this, so it waits on Sam's word (CLAUDE.md, the hold list: a permission-check denial). kb/migrations/.apply does
-- not name this file. With it goes retiring kb/hand_filed_catalogs/de_anza.json, or the reader keeps the PDF.
--
-- S636 SkyAntennae, 2026-11-11. De Anza College's catalog row moves from the hand-filed 2025-2026 PDF to the
-- college's own 2026-2027 catalog on eLumen.
--
-- The row is a person's correction (Sam's go of 2026-10-17, applied by S407): read the 2025-2026 PDF as a
-- year-behind catalog "until the district lets the reader in" (kb/hand_filed_catalogs/de_anza.json). That
-- condition is met. COBIx found the 2026-2027 catalog at deanza.elumenapp.com (#3096), and college page read
-- 43013608134 verified it from a runner: status 200 for the reader, "2026-2027 De Anza College Catalog" on every
-- page, and daweb2.deanza.edu/catalog/ redirecting to it. Sam, in session 2026-11-11, on COBIx's De Anza
-- solution: "let me know if you have or can implement it"; then "good". This correction says so in corrected_by;
-- the history trigger files the row as it stood, so 2026-11-11_de_anza_catalog_2026_27_rollback.sql restores it.
update public.program_source_registry
   set catalog_url      = 'https://deanza.elumenapp.com/catalog/2026-2027/home',
       catalog_platform = 'elumen',
       catalog_year     = '2026-2027',
       catalog_format   = 'html_per_program',
       access_status    = 'ok',
       corrected_by     = 'S636 SkyAntennae through supabase-migrate, on COBIx''s find (#3096) and Sam''s word in session 2026-11-11; supersedes the 2026-10-17 correction (Sam''s go, applied by S407), whose condition "until the district lets the reader in" is met',
       corrected_at     = now()
 where college = 'De Anza College'
   and catalog_url = 'https://www.deanza.edu/catalog/documents/dac_catalog_2025-2026.pdf';
