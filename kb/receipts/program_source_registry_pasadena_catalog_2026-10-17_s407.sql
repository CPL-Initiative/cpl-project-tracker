-- S407 (SkyMesquite), 2026-10-17: Pasadena City College's registry row corrected to the catalog its own page names.
-- NOT YET APPLIED: a row changes only through a correction Sam approves (S371's Mesa, Sheet 69; Sheet 88), and the
-- repo's Supabase guard holds an UPDATE for a person. It goes to Sam on Open Asks Sheet 91.
--
-- Why: the census filed Pasadena as PDFs by section at its catalog-schedule-calendar page. That page's PDF links stop
-- at 2020-2021 (page read 39009644813); its "2026-2027 Catalog" link is https://curriculum.pasadena.edu/ (page read
-- 39053259803), titled "Catalog Home | Pasadena City College Academic Catalog", "2026-2027 Catalog and Announcement
-- of Courses", with programs under /academic-programs/<department>/<program>/ and earlier years under
-- /archive/<year>/ (39053672566). Its sitemap.xml answers 200, and a program page prints CourseLeaf's course list
-- (Code, Title, Units, Total Units) and links pasadena-next.courseleaf.com (39054890579). The CourseLeaf reader walks
-- that shape (Cerritos, Fullerton, Southwestern and others).
--
-- BEFORE (read 2026-10-17 ~17:05Z through execute_sql; corrected_by null, md5 2f7fca0da2b95bf34e722fd2af969f51):
--   Pasadena City College | https://pasadena.edu/academics/catalog-schedule-calendar.php | catalog_year null
--     | custom_html | pdf_by_section | best_method pdf_extraction | access_status ok
--
-- Rollback: the registry's trigger files the prior row in program_source_registry_history. To undo, restore the row
-- from that entry (or the BEFORE values above) and set corrected_by, corrected_at and correction_note back to null.

update public.program_source_registry r set
  catalog_url      = 'https://curriculum.pasadena.edu/',
  catalog_year     = '2026-2027',
  catalog_platform = 'courseleaf',
  catalog_format   = 'html_per_program',
  best_method      = 'platform_reader',
  corrected_by     = 'Sam (open-asks sheet 91), applied by S407 SkyMesquite',
  corrected_at     = now(),
  correction_note  = 'The college''s catalog page names the 2026-2027 catalog on its CourseLeaf host curriculum.pasadena.edu; the page the census filed links PDFs through 2020-2021 only (S407 page reads 39053259803, 39053672566, 39054890579).'
where r.college = 'Pasadena City College'
  and r.catalog_url = 'https://pasadena.edu/academics/catalog-schedule-calendar.php'
  and r.corrected_by is null
returning r.college, r.catalog_url, r.catalog_year, r.catalog_platform, r.catalog_format;
