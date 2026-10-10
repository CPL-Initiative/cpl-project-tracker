-- S359 (SkyMoss), 2026-10-10: Long Beach City College's catalog address, read from the college's own page.
--
-- Why: Long Beach City is the next college for the Phase 2 read (Sam, Open Asks Sheet 59 card 1: after
-- RCCD). The census (run census-20261004T152831Z-s3of4) stopped at https://www.lbcc.edu/college-catalog,
-- the college's page ABOUT its catalog. College page read run 38092181470 (plan
-- kb/college_reads/lbcc_catalog_address.json) loaded that page: "Click to Check Out This Year's Catalog!"
-- links https://lbcc-public.courseleaf.com/, and the page lists 2025-2026 among the archived catalogs
-- (https://lbcc-public.courseleaf.com/archive/2025-2026/), so the current catalog is 2026-2027. The guessed
-- catalog.lbcc.edu does not resolve. Cerritos's row holds the same CourseLeaf form
-- (https://cerritos-public.courseleaf.com/).
--
-- What a correction does: program_source_census_apply() keeps a corrected row's values from then on,
-- files each later reading in census_evidence.census_values, and sets census_disagrees when the two
-- differ. Without corrected_by, Sunday's apply (2026-10-11 10:29 UTC) would write the old address back.
--
-- Applied 2026-10-10 22:44:36Z as migration program_source_registry_lbcc_catalog_2026_10_10_s359 (execute_sql's
-- guard routes data writes away from it; S345's registry receipt took the same route). Read back: one row,
-- catalog_url https://lbcc-public.courseleaf.com/, 2026-2027, corrected; the history table filed the prior row.
--
-- Rollback: the registry's trigger files the prior row in program_source_registry_history. To undo,
-- restore Long Beach City's row from the history entry this update wrote and set corrected_by,
-- corrected_at and correction_note back to null.

update public.program_source_registry set
  catalog_url     = 'https://lbcc-public.courseleaf.com/',
  catalog_year    = '2026-2027',
  corrected_by    = 'SkyMoss S359 session, from the college''s own catalog page',
  corrected_at    = now(),
  correction_note = 'www.lbcc.edu/college-catalog links "This Year''s Catalog" to lbcc-public.courseleaf.com and lists 2025-2026 as archived (college page read run 38092181470).'
where college = 'Long Beach City College'
  and catalog_url = 'https://www.lbcc.edu/college-catalog'
  and corrected_by is null;

-- Read back: one row, corrected.
select college, catalog_url, catalog_year, catalog_platform, corrected_by, corrected_at
from public.program_source_registry where college = 'Long Beach City College';
