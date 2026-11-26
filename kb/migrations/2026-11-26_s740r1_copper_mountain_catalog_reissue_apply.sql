-- S740R1 lane 1 (reads): Copper Mountain College's registry row moves from the 2026-2027 catalog PDF's first
-- address (.../2026/09/Final-26-27-Catalog-09.03.26r1.pdf, which answers 404 since the college reissued the file) to
-- the reissue of 2026-11-18 (.../2026/11/Final-26-27-Catalog-11.18.26r1.pdf). One row, one column and its three
-- correction fields. Receipt: kb/receipts/program_source_registry_copper_mountain_catalog_reissue_2026-11-26_s740r1.json.
--
-- The row is a person's correction: Sam, Open Asks Sheet 88 card 1 (2026-10-17, "Correct them"), applied by S405
-- (kb/receipts/program_source_registry_sheet88_five_catalogs_2026-10-17_s405.sql), which set the catalog the
-- college's own page names. The college has since reissued that same 2026-2027 catalog at a new address; this write
-- keeps Sam's correction (the year, the platform, the format and the method stay as he set them) and moves its
-- address, and corrected_by says so. corrected_by stays set, so program_source_census_apply keeps the row.
--
-- Guarded UPDATE: only where the row still names the first address, the year, the platform and the format. It
-- aborts, writing nothing, unless it matches exactly one row. It returns the row's before-values, which the
-- migration receipt files (the rollback's second source; the history trigger files the whole prior row).
with b as (
select r.catalog_url, r.corrected_by, r.corrected_at, r.correction_note, r.updated_at
  from public.program_source_registry r
 where r.college = 'Copper Mountain College'),
u as (
update public.program_source_registry r
   set catalog_url     = 'https://www.cmccd.edu/wp-content/uploads/2026/11/Final-26-27-Catalog-11.18.26r1.pdf',
       corrected_by    = 'S740 SkySkimmer (the CPL Queue routine) through supabase-migrate, plan s740r1: the address of Sam''s correction (open-asks sheet 88 card 1, applied by S405 SkyCholla) moved to the college''s reissue of the same 2026-2027 catalog; the year, platform, format and method stay as he set them',
       corrected_at    = now(),
       correction_note = 'The college reissued its 2026-2027 catalog PDF on 2026-11-18 at .../2026/11/Final-26-27-Catalog-11.18.26r1.pdf; the first address (.../2026/09/Final-26-27-Catalog-09.03.26r1.pdf) answers 404 (college page read 45781997815; the reissue read whole by 45783372680, both 2026-11-26). Before: the college''s catalog page names the 2026-2027 catalog as a PDF; its curriQunet host serves course outlines (S402 page reads).'
 where r.college = 'Copper Mountain College'
   and r.catalog_url = 'https://www.cmccd.edu/wp-content/uploads/2026/09/Final-26-27-Catalog-09.03.26r1.pdf'
   and r.catalog_year = '2026-2027'
   and r.catalog_platform = 'pdf'
   and r.catalog_format = 'single_pdf'
returning r.college),
s as (select count(*) as n from u)
select case when s.n = 1
            then json_build_object('returned', s.n,
                                   'before', (select json_build_object('catalog_url', b.catalog_url,
                                                                       'corrected_by', b.corrected_by,
                                                                       'corrected_at', b.corrected_at,
                                                                       'correction_note', b.correction_note,
                                                                       'updated_at', b.updated_at) from b))
            else ('s740r1 registry guard: the UPDATE matched ' || s.n || ' rows, the plan names 1')::int::text::json end as returned
  from s;
