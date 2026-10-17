-- S405 (SkyCholla), 2026-10-17: five registry rows corrected to the catalogs the colleges' own pages name.
--
-- Why: Sam, Open Asks Sheet 88 card 1, 12:37:55Z: "Correct them" (his own call; the sheet's Complete at 12:49:53Z).
-- The census (2026-10-11) filed each college under a platform its catalog does not use, from the text of a page
-- about the catalog. S402's page reads (38997632871, 38998089408, 39001293722) found the 2026-2027 catalog each
-- college's own catalog page names; handoff 403 item 2 holds the addresses. Precedent: S371's Mesa correction
-- (program_source_registry_mesa_catalog_2026-10-12_s371.sql, applied as a migration on Sheet 69).
--
-- BEFORE (read 2026-10-17 ~12:55Z through execute_sql; corrected_by null on all five):
--   Copper Mountain College (12)                     | https://www.cmccd.edu/academic-catalogs/
--     | catalog_year null | curriqunet | html_per_program | platform_reader
--   San Diego College of Continuing Education (119)  | https://www.sdccd.edu/students/college-catalogs/index.aspx
--     | catalog_year null | curriqunet | html_per_program | platform_reader
--   Porterville College (92)                         | https://www.portervillecollege.edu/programs-and-classes/academics/catalog.html
--     | 2026-2027 | elumen | html_per_program | platform_reader
--   Solano Community College (109)                   | https://www.solano.edu/administrative-offices/academic-affairs/course-catalog.php
--     | catalog_year null | elumen | html_per_program | platform_reader
--   West Valley College (116)                        | https://www.westvalley.edu/catalog/index.html
--     | catalog_year null | elumen | html_per_program | platform_reader
--
-- After: the four PDFs read as the PDF wave's rows do (pdf / single_pdf / pdf_extraction, so is_pdf_catalog()
-- takes them whole); West Valley reads as the own-HTML colleges do (custom_html, the generic sitemap road, #2194).
-- What a correction does: program_source_census_apply() keeps a corrected row's values from then on and files a
-- later census reading in census_evidence.census_values, with census_disagrees when the two differ.
--
-- Rollback: the registry's trigger files each prior row in program_source_registry_history. To undo, restore the
-- five rows from those entries (or the BEFORE values above) and set corrected_by, corrected_at and
-- correction_note back to null.

update public.program_source_registry r set
  catalog_url      = v.url,
  catalog_year     = '2026-2027',
  catalog_platform = v.platform,
  catalog_format   = v.format,
  best_method      = v.method,
  corrected_by     = 'Sam (open-asks sheet 88 card 1), applied by S405 SkyCholla',
  corrected_at     = now(),
  correction_note  = v.note
from (values
  ('Copper Mountain College',
   'https://www.cmccd.edu/wp-content/uploads/2026/09/Final-26-27-Catalog-09.03.26r1.pdf',
   'pdf', 'single_pdf', 'pdf_extraction', 'curriqunet',
   'The college''s catalog page names the 2026-2027 catalog as a PDF; its curriQunet host serves course outlines (S402 page reads).'),
  ('San Diego College of Continuing Education',
   'https://www.sdccd.edu/docs/ISPT/instsrv/Catalogs/MetaFiles/2026_2027/CECatalog2026-2027.pdf',
   'pdf', 'single_pdf', 'pdf_extraction', 'curriqunet',
   'The district''s catalog page names the Continuing Education 2026-2027 catalog as a PDF; the district curriQunet host lists City, Mesa and Miramar only (S402 page reads).'),
  ('Porterville College',
   'https://www.portervillecollege.edu/_resources/assets/pdfs/Academics/Catalog/Porterville_College_2026-2027_Catalog_FINAL_JUNE_1_2026.pdf',
   'pdf', 'single_pdf', 'pdf_extraction', 'elumen',
   'The college''s catalog page names the 2026-2027 catalog as a PDF with two addenda; its eLumen catalog stops at 2021-2022 (S402 page reads).'),
  ('Solano Community College',
   'https://www.solano.edu/administrative-offices/academic-affairs/files/docs/archived-catalogs/pdf-catalogs/SolanoCatalog%2026-27%205.16.26.pdf',
   'pdf', 'single_pdf', 'pdf_extraction', 'elumen',
   'The college''s catalog page names the 2026-2027 catalog as a PDF; its eLumen host serves course outlines (S402 page reads).'),
  ('West Valley College',
   'https://www.westvalley.edu/catalog/',
   'custom_html', 'html_per_program', 'unknown', 'elumen',
   'The college prints its own HTML catalog at westvalley.edu/catalog, with a PDF copy; its eLumen host serves course outlines (S402 page reads).')
) as v(college, url, platform, format, method, was_platform, note)
where r.college = v.college
  and r.catalog_platform = v.was_platform
  and r.corrected_by is null;

-- Read back: five rows, corrected.
select college, catalog_url, catalog_year, catalog_platform, catalog_format, best_method, corrected_by, corrected_at
from public.program_source_registry
where college in ('Copper Mountain College', 'San Diego College of Continuing Education', 'Porterville College',
                  'Solano Community College', 'West Valley College')
order by college;
