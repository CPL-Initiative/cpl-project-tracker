-- S371 (SkyMaple), 2026-10-12: San Diego Mesa College's catalog, on the district's curriQunet host.
--
-- STATUS: NOT APPLIED. The execute_sql guard held this data write (2026-10-12); it waits on Sam's go
-- for how it is applied. Until then Mesa's row still reads custom_html and its read would stop.
--
-- Why: Sam, 2026-10-12, in chat: "go ahead with Miramar and Mesa extraction". The census (checked
-- 2026-10-11 16:34Z) stopped at Mesa's page ABOUT its catalog and filed it as custom_html, so the
-- Phase 2 read (kb/_program_requirements_college.py capture()) would stop before reading a program:
-- it enumerates only CourseLeaf and curriQunet. The district host's own catalog list names Mesa's
-- catalog: S369's read of _getCatalogs (runs 38203841691, 38204183571; kb/college_reads/
-- sdcity_curriqunet_outline.json) lists City 2026-2027 as catalog 69, Mesa 70 and Miramar 71. San Diego
-- City's row (read, loaded and displayed, #2034) and Miramar's row hold the same host in the alias form,
-- and cq_catalog_from_list takes the one catalog whose title's words all appear in the college's name,
-- in the registry's year, when the start page names no id.
--
-- BEFORE (read 2026-10-12 at write time through execute_sql):
--   San Diego Mesa College | 97 | https://www.sdmesa.edu/student-support/evaluations/catalog-course-information.shtml
--   | catalog_year null | custom_html | unknown | best_method unknown | access ok | corrected_by null
--
-- What a correction does: program_source_census_apply() keeps a corrected row's values from then on,
-- files each later reading in census_evidence.census_values, and sets census_disagrees when the two
-- differ. Without corrected_by, the next census apply would write the old address back.
--
-- Rollback: the registry's trigger files the prior row in program_source_registry_history. To undo,
-- restore Mesa's row from the history entry this update wrote (or the BEFORE values above) and set
-- corrected_by, corrected_at and correction_note back to null.

update public.program_source_registry set
  catalog_url      = 'https://sdccd.curriqunet.com/catalog/alias/mesa26-27',
  catalog_year     = '2026-2027',
  catalog_platform = 'curriqunet',
  catalog_format   = 'html_per_program',
  best_method      = 'platform_reader',
  corrected_by     = 'SkyMaple S371 session, from the SDCCD curriQunet host''s own catalog list',
  corrected_at     = now(),
  correction_note  = 'sdccd.curriqunet.com _getCatalogs names Mesa 2026-2027 as catalog 70 beside City 69 and Miramar 71 (S369 reads 38203841691, 38204183571); the census had filed the college''s page about its catalog.'
where college = 'San Diego Mesa College'
  and catalog_platform = 'custom_html'
  and corrected_by is null;

-- Read back: one row, corrected.
select college, catalog_url, catalog_year, catalog_platform, best_method, corrected_by, corrected_at
from public.program_source_registry where college = 'San Diego Mesa College';
