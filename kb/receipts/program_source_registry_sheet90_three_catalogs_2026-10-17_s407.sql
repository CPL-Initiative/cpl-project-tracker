-- S407 (SkyMesquite), 2026-10-17: three registry rows corrected to the catalogs the colleges' own pages name.
--
-- Why: Sam, Open Asks Sheet 90 card 1 (carried from Sheet 89 card 1), 17:54:13Z: "correct" (his own call, the
-- sheet's proposal). Page reads on the runner (S405: 39032643761 Grossmont and Cañada, 39035702276 Ohlone) found each
-- college's catalog: Grossmont's catalog page links catalog.gcccd.edu/grossmont/, the district CourseLeaf host Cuyamaca
-- already reads for 2026-2027; Ohlone's 2026-2027 catalog page (ohlone.edu/catalog/20262027) offers the catalog as PDF
-- chapters, and chapter 7, the curriculum guides (catalog pages 62-161), holds every program; Cañada's online catalog
-- catalog.canadacollege.edu/current/ refuses the reader in robots.txt. Precedent: Sheet 88 card 1
-- (program_source_registry_sheet88_five_catalogs_2026-10-17_s405.sql).
--
-- BEFORE (read 2026-10-17 ~18:01Z through execute_sql; corrected_by null on all three):
--   Grossmont College | https://www.grossmont.edu/academics/catalog/_resources/assets/images/2026-2027-catalog-cover-600x743.jpg
--     | 2026-2027 | custom_html | unknown | unknown | ok | row md5 d366241122445b4ddf6bf0277188c611
--   Ohlone College    | https://www.ohlone.edu/catalog | catalog_year null | custom_html | unknown | unknown | ok
--     | row md5 7fb14939c94d702de38c7fcbc4d4eb70
--   Cañada College    | https://canadacollege.edu/catalogschedule/ | catalog_year null | custom_html | unknown | unknown | ok
--     | row md5 edecda87b01f113cb3f31560f6882973
--
-- After: Grossmont reads as CourseLeaf; Ohlone reads chapter 7 as one PDF (is_pdf_catalog() takes it whole); Cañada's
-- row records the refusal, and the reader never reads a refused host another way (a hand-filed copy is the way in,
-- Sam's ruling 2 of 2026-10-17). A later census reading of a corrected row lands in census_evidence.census_values.
--
-- Rollback: the registry's trigger files each prior row in program_source_registry_history. To undo, restore the
-- three rows from those entries (or the BEFORE values above) and set corrected_by, corrected_at and correction_note
-- back to null (and Cañada's access_status to ok, access_notes to null).

update public.program_source_registry r set
  catalog_url      = v.url,
  catalog_year     = v.year,
  catalog_platform = v.platform,
  catalog_format   = v.format,
  best_method      = v.method,
  access_status    = v.access,
  access_notes     = coalesce(v.access_note, r.access_notes),
  corrected_by     = 'Sam (open-asks sheet 90 card 1), applied by S407 SkyMesquite',
  corrected_at     = now(),
  correction_note  = v.note
from (values
  ('Grossmont College', 'https://www.grossmont.edu/academics/catalog/_resources/assets/images/2026-2027-catalog-cover-600x743.jpg',
   'https://catalog.gcccd.edu/grossmont/', '2026-2027', 'courseleaf', 'html_per_program', 'platform_reader', 'ok', null,
   'The college''s catalog page links the district CourseLeaf host catalog.gcccd.edu/grossmont/; the census filed the catalog''s cover image (S405 page read 39032643761).'),
  ('Ohlone College', 'https://www.ohlone.edu/catalog',
   'https://www.ohlone.edu/sites/default/files/group/Catalog/20262027/chapter_7-curriculum_guides.pdf', '2026-2027', 'pdf', 'single_pdf', 'pdf_extraction', 'ok', null,
   'The 2026-2027 catalog page offers the catalog as PDF chapters; chapter 7, the curriculum guides (pages 62-161), holds every program (S405 page read 39035702276).'),
  ('Cañada College', 'https://canadacollege.edu/catalogschedule/',
   'https://catalog.canadacollege.edu/current/', null, 'custom_html', 'html_per_program', 'unknown', 'robots_disallow',
   'The online catalog catalog.canadacollege.edu/current/ refuses the reader in robots.txt (S405 page read 39032643761); a hand-filed copy is the way in (Sam''s ruling 2, 2026-10-17).',
   'The college''s schedule-and-catalog page links its online catalog, which refuses the reader in robots.txt; the census filed the schedule page (S405 page read 39032643761).')
) as v(college, was_url, url, year, platform, format, method, access, access_note, note)
where r.college = v.college and r.catalog_url = v.was_url and r.corrected_by is null
returning r.college, r.catalog_url, r.catalog_year, r.catalog_platform, r.catalog_format, r.access_status;
