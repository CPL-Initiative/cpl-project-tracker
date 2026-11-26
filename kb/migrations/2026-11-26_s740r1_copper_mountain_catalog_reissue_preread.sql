-- S740R1 lane 1 (reads): Copper Mountain College's registry row moves from the 2026-2027 catalog PDF's first
-- address (.../2026/09/Final-26-27-Catalog-09.03.26r1.pdf, which answers 404 since the college reissued the file) to
-- the reissue of 2026-11-18 (.../2026/11/Final-26-27-Catalog-11.18.26r1.pdf). One row, one column and its three
-- correction fields. Receipt: kb/receipts/program_source_registry_copper_mountain_catalog_reissue_2026-11-26_s740r1.json.
-- Pre-read, read-only: one SELECT, one JSON value.
-- Expect: rows 1, guard_matches 1, already_after 0, corrected_by 'Sam (open-asks sheet 88 card 1), applied by S405
-- SkyCholla', procedure_catalog_step false. Stop when guard_matches is 0 (someone moved the row) or when
-- procedure_catalog_step is true (the reader then takes the procedure record's file, never this column, and the
-- change belongs in program_source_procedure_set).
select json_build_object(
  'rows', count(*),
  'guard_matches', count(*) filter (where r.catalog_url = 'https://www.cmccd.edu/wp-content/uploads/2026/09/Final-26-27-Catalog-09.03.26r1.pdf'
                                      and r.catalog_year = '2026-2027' and r.catalog_platform = 'pdf'
                                      and r.catalog_format = 'single_pdf'),
  'already_after', count(*) filter (where r.catalog_url = 'https://www.cmccd.edu/wp-content/uploads/2026/11/Final-26-27-Catalog-11.18.26r1.pdf'),
  'catalog_url', max(r.catalog_url),
  'catalog_year', max(r.catalog_year),
  'catalog_platform', max(r.catalog_platform),
  'catalog_format', max(r.catalog_format),
  'best_method', max(r.best_method),
  'access_status', max(r.access_status),
  'corrected_by', max(r.corrected_by),
  'corrected_at', max(r.corrected_at),
  'correction_note', max(r.correction_note),
  'procedure_v', max(r.procedure->>'v'),
  'procedure_catalog_step', coalesce(bool_or(r.procedure ? 'catalog'), false),
  'procedure_md5', max(coalesce(md5(r.procedure::text), 'none')))
  from public.program_source_registry r
 where r.college = 'Copper Mountain College';
