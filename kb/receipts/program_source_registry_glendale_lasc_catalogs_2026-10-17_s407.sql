-- S407 SkyMesquite, 2026-10-17: Glendale's and Los Angeles Southwest's registry rows to the catalog files their own
-- catalog pages link, applied through supabase-migrate.yml.
--
-- Why: Open Asks Sheet 91 cards 5 and 6, carried out as proposed on Sam's go (~18:10Z: "No need to ask me for approval
-- on all these items as I am trusting your procedures as we build this huge draft"; cpl_memory
-- sam-trust-procedures-no-per-item-approval-2026-10-17).
--   Glendale: its catalog page says "2026-2027 Catalog Coming Soon" (a new online catalog, "Check back in Fall") and
--   offers the 2025-2026 catalog and its addendum as the current program requirements (page read 39009644813). Read as
--   a year-behind catalog labeled 2025-2026, as De Anza's was; the census already lists the addendum (addenda id 81).
--   Read again when the 2026-2027 online catalog posts.
--   LA Southwest: its catalog page links "2026-27 Catalog Draft 08.27.2026" (no words on the link), beside the 2025-2026
--   catalog and a main link that still opens 2024-2025 (page read 39009644813). Read as 2026-2027; the correction note
--   says the file is a draft, to be read again when the final posts.
--
-- BEFORE (read 2026-10-17 ~17:05Z through execute_sql; corrected_by null on both):
--   Glendale Community College   | https://www.glendale.edu/academics/catalogs/index.html | catalog_year null
--     | custom_html | pdf_by_section | pdf_extraction | ok
--   Los Angeles Southwest College | https://www.lasc.edu/academic-resources/catalog | catalog_year null
--     | custom_html | pdf_by_section | pdf_extraction | ok
--
-- Rollback: the registry's trigger files each prior row in program_source_registry_history. To undo, restore the two
-- rows from those entries (or the BEFORE values above) and set corrected_by, corrected_at and correction_note to null.

update public.program_source_registry r set
  catalog_url      = v.url,
  catalog_year     = v.year,
  catalog_platform = 'pdf',
  catalog_format   = 'single_pdf',
  best_method      = 'pdf_extraction',
  corrected_by     = 'Sam (open-asks sheet 91 cards 5 and 6, as proposed; his go of 2026-10-17), applied by S407 SkyMesquite through supabase-migrate',
  corrected_at     = now(),
  correction_note  = v.note
from (values
  ('Glendale Community College', 'https://www.glendale.edu/academics/catalogs/index.html',
   'https://www.glendale.edu/academics/catalogs/_documents/2025-2026-gcc-catalog.pdf', '2025-2026',
   'The catalog page says the 2026-2027 catalog is coming soon and offers the 2025-2026 catalog and its addendum as the current program requirements; read as a year-behind catalog (De Anza precedent) until the online catalog posts (S407 page read 39009644813).'),
  ('Los Angeles Southwest College', 'https://www.lasc.edu/academic-resources/catalog',
   'https://www.lasc.edu/sites/lasc.edu/files/2026-08/2026-27%20Catalog%20Draft%2008.27.2026.pdf', '2026-2027',
   'DRAFT: the catalog page links the 2026-2027 catalog as a draft dated 2026-08-27; read as 2026-2027 and read again when the final posts (S407 page read 39009644813).')
) as v(college, was_url, url, year, note)
where r.college = v.college and r.catalog_url = v.was_url and r.corrected_by is null;

-- Read-back: the two rows after the update.
select college, catalog_url, catalog_year, catalog_platform, catalog_format, best_method, corrected_by is not null as corrected
from public.program_source_registry where college in ('Glendale Community College', 'Los Angeles Southwest College') order by college;
