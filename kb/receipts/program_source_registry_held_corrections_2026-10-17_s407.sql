-- S407 SkyMesquite, 2026-10-17: the registry corrections held for a person, applied through supabase-migrate.yml.
-- Sam, ~18:10Z in chat: "I thought we already set it up so that you could paste the query code in supabase ... No need to
-- ask me for approval on all these items as I am trusting your procedures as we build this huge draft". The repo's
-- Supabase guard holds a session's UPDATE; the runner path is the one he set up on 2026-10-13 (Sheet 74).
-- Four statements, each its committed receipt's own UPDATE with its guard (the row still holds the census's or
-- Sheets 25-26's address, and the expected corrected_by), then one read-back. The history trigger files every prior
-- row in program_source_registry_history, which is the rollback; each receipt names its BEFORE values.

-- program_source_registry_cuesta_catalog_2026-10-17_s406.sql
update public.program_source_registry r set
  catalog_url      = 'https://cuesta.curriqunet.com/catalog/iq/29951',
  catalog_year     = '2026-2027',
  catalog_platform = 'curriqunet',
  catalog_format   = 'html_per_program',
  best_method      = 'platform_reader',
  corrected_by     = 'Sam (open-asks sheet 91; his go of 2026-10-17: "No need to ask me for approval on all these items"), applied by S407 SkyMesquite through supabase-migrate',
  corrected_at     = now(),
  correction_note  = 'The college''s catalog page names the 2026-2027 catalog on its curriQunet host; the class-search page the census filed lists no program requirements (S406 page reads 39046661339, 39046881195, 39047849634).'
where r.college = 'Cuesta College'
  and r.catalog_url = 'https://www.cuesta.edu/become-student/findclasses/index.html'
  and r.corrected_by is null;

-- program_source_registry_hand_filed_six_catalogs_2026-10-17_s406.sql
update public.program_source_registry r set
  catalog_url      = v.url,
  catalog_year     = v.year,
  catalog_platform = 'pdf',
  catalog_format   = 'single_pdf',
  corrected_by     = 'Sam (open-asks sheet 91; his go of 2026-10-17: "No need to ask me for approval on all these items"), applied by S407 SkyMesquite through supabase-migrate',
  corrected_at     = now(),
  correction_note  = v.note
from (values
  ('American River College', 'https://arc.losrios.edu/2026-2027-official-catalog',
   'https://arc.losrios.edu/catalog/compiled-catalog/arc-catalog-26-27.pdf', '2026-2027',
   'Los Rios publishes one compiled PDF of each catalog; the host answers the reader 404, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/american_river.json).'),
  ('City College of San Francisco', 'https://www.ccsf.edu/catalog',
   'https://www.ccsf.edu/sites/default/files/2026/document/ccsf-catalog-2026-27.pdf', '2026-2027',
   'CCSF publishes the 2026-2027 catalog as one compiled PDF; the host serves the reader a Cloudflare challenge, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/city_of_san_francisco.json).'),
  ('Cosumnes River College', 'https://www.crc.losrios.edu/catalog',
   'https://crc.losrios.edu/catalog/compiled-catalog/crc-catalog-26-27.pdf', '2026-2027',
   'Los Rios publishes one compiled PDF of each catalog; the host answers the reader 404, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/cosumnes_river.json).'),
  ('De Anza College', 'https://www.deanza.edu/catalog/',
   'https://www.deanza.edu/catalog/documents/dac_catalog_2025-2026.pdf', '2025-2026',
   'De Anza publishes its 2026-2027 catalog only as HTML behind a Cloudflare challenge; the 2025-2026 PDF and its spring 2026 addendum are read as a year-behind catalog (Palo Verde precedent) from the copies Sam filed (kb/hand_filed_catalogs/de_anza.json).'),
  ('Folsom Lake College', 'https://flc.losrios.edu/2026-2027-official-catalog',
   'https://flc.losrios.edu/catalog/compiled-catalog/flc-catalog-26-27.pdf', '2026-2027',
   'Los Rios publishes one compiled PDF of each catalog; the host answers the reader 404, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/folsom_lake.json).'),
  ('Sacramento City College', 'https://scc.losrios.edu/2026-2027-official-catalog',
   'https://scc.losrios.edu/catalog/compiled-catalog/scc-catalog-26-27.pdf', '2026-2027',
   'Los Rios publishes one compiled PDF of each catalog; the host answers the reader 404, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/sacramento_city.json).')
) as v(college, was_url, url, year, note)
where r.college = v.college
  and r.catalog_url = v.was_url
  and r.corrected_by = 'Sam (open-asks sheets 25 and 26)';

-- program_source_registry_sheet90_three_catalogs_2026-10-17_s407.sql
update public.program_source_registry r set
  catalog_url      = v.url,
  catalog_year     = v.year,
  catalog_platform = v.platform,
  catalog_format   = v.format,
  best_method      = v.method,
  access_status    = v.access,
  access_notes     = coalesce(v.access_note, r.access_notes),
  corrected_by     = 'Sam (open-asks sheet 91; his go of 2026-10-17: "No need to ask me for approval on all these items"), applied by S407 SkyMesquite through supabase-migrate',
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
where r.college = v.college and r.catalog_url = v.was_url and r.corrected_by is null;

-- program_source_registry_pasadena_catalog_2026-10-17_s407.sql
update public.program_source_registry r set
  catalog_url      = 'https://curriculum.pasadena.edu/',
  catalog_year     = '2026-2027',
  catalog_platform = 'courseleaf',
  catalog_format   = 'html_per_program',
  best_method      = 'platform_reader',
  corrected_by     = 'Sam (open-asks sheet 91; his go of 2026-10-17: "No need to ask me for approval on all these items"), applied by S407 SkyMesquite through supabase-migrate',
  corrected_at     = now(),
  correction_note  = 'The college''s catalog page names the 2026-2027 catalog on its CourseLeaf host curriculum.pasadena.edu; the page the census filed links PDFs through 2020-2021 only (S407 page reads 39053259803, 39053672566, 39054890579).'
where r.college = 'Pasadena City College'
  and r.catalog_url = 'https://pasadena.edu/academics/catalog-schedule-calendar.php'
  and r.corrected_by is null;

-- Read-back: the eleven rows as they stand after the four updates (the receipt keeps this result).
select college, catalog_url, catalog_year, catalog_platform, catalog_format, best_method, access_status, corrected_by is not null as corrected,
       left(md5(concat_ws('|', catalog_platform, catalog_url, catalog_year, census_run_id, sequence_access, sequence_checked_run, sequence_host, sequence_note, sequence_source, sequence_url)),8) md5_10
from public.program_source_registry where college in ('Cuesta College', 'American River College', 'City College of San Francisco', 'Cosumnes River College', 'De Anza College', 'Folsom Lake College', 'Sacramento City College', 'Grossmont College', 'Ohlone College', 'Cañada College', 'Pasadena City College') order by college;
