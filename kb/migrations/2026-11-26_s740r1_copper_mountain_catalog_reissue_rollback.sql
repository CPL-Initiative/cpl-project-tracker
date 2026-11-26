-- S740R1 lane 1 (reads): Copper Mountain College's registry row moves from the 2026-2027 catalog PDF's first
-- address (.../2026/09/Final-26-27-Catalog-09.03.26r1.pdf, which answers 404 since the college reissued the file) to
-- the reissue of 2026-11-18 (.../2026/11/Final-26-27-Catalog-11.18.26r1.pdf). One row, one column and its three
-- correction fields. Receipt: kb/receipts/program_source_registry_copper_mountain_catalog_reissue_2026-11-26_s740r1.json.
--
-- Rollback, NOT applied: the address and the three correction fields back to the row the history trigger filed
-- under this write's corrected_by, only while the row still holds this write's address and corrected_by. It
-- aborts, writing nothing, unless it matches exactly one row. The same four values are in the apply's migration
-- receipt (response.returned.before); S405's were catalog_url .../2026/09/Final-26-27-Catalog-09.03.26r1.pdf,
-- corrected_by 'Sam (open-asks sheet 88 card 1), applied by S405 SkyCholla' and correction_note 'The college''s
-- catalog page names the 2026-2027 catalog as a PDF; its curriQunet host serves course outlines (S402 page reads).'
-- A rolled-back row names an address that answers 404, so a read of the college finds no page until it moves again.
with h as (
select old_row
  from public.program_source_registry_history
 where college = 'Copper Mountain College' and op = 'UPDATE'
   and changed_by like 'S740 SkySkimmer (the CPL Queue routine) through supabase-migrate, plan s740r1:%'
 order by changed_at desc
 limit 1),
u as (
update public.program_source_registry r
   set catalog_url     = h.old_row->>'catalog_url',
       corrected_by    = h.old_row->>'corrected_by',
       corrected_at    = (h.old_row->>'corrected_at')::timestamptz,
       correction_note = h.old_row->>'correction_note'
  from h
 where r.college = 'Copper Mountain College'
   and r.catalog_url = 'https://www.cmccd.edu/wp-content/uploads/2026/11/Final-26-27-Catalog-11.18.26r1.pdf'
   and r.corrected_by like 'S740 SkySkimmer (the CPL Queue routine) through supabase-migrate, plan s740r1:%'
   and h.old_row->>'catalog_url' = 'https://www.cmccd.edu/wp-content/uploads/2026/09/Final-26-27-Catalog-09.03.26r1.pdf'
returning r.college),
s as (select count(*) as n from u)
select case when s.n = 1
            then json_build_object('returned', s.n)
            else ('s740r1 registry rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names 1')::int::text::json end as returned
  from s;
