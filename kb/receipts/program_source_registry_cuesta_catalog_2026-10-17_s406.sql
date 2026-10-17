-- S406 (SkyIronwood), 2026-10-17: Cuesta College's registry row corrected to the catalog its own page names.
-- NOT YET APPLIED: a row changes only through a correction Sam approves (S371's Mesa, Sheet 69; Sheet 88), and the
-- repo's Supabase guard holds an UPDATE for a person. It goes to Sam on Open Asks Sheet 90.
--
-- Why: the census filed Cuesta as its own HTML at its class-search page. The capture-only read on claude/s405-cuesta
-- found 2 of 198 programs in 89 minutes through the main site's 16,529-page sitemap (run 39032973487). Page reads on
-- the runner: the home page's Catalog link names the class-search page (39046661339), which links the catalog page
-- (/become-student/findclasses/catalog/), whose "2026-2027 Cuesta College Catalog" link is cuesta.curriqunet.com
-- (39046881195). That host answered the reader 200 at /catalog/iq/29951, "Cuesta College Catalog 2026-2027 |
-- Effective August 17, 2026", with an "Associate Degree & Certificate Programs" section (39047849634). The curriQunet
-- reader walks that host shape (Moreno Valley, San Diego City, Butte).
--
-- BEFORE (read 2026-10-17 ~16:10Z through execute_sql; corrected_by null):
--   Cuesta College | https://www.cuesta.edu/become-student/findclasses/index.html | catalog_year null
--     | custom_html | unknown | best_method unknown | access_status ok
--
-- Rollback: the registry's trigger files the prior row in program_source_registry_history. To undo, restore the row
-- from that entry (or the BEFORE values above) and set corrected_by, corrected_at and correction_note back to null.

update public.program_source_registry r set
  catalog_url      = 'https://cuesta.curriqunet.com/catalog/iq/29951',
  catalog_year     = '2026-2027',
  catalog_platform = 'curriqunet',
  catalog_format   = 'html_per_program',
  best_method      = 'platform_reader',
  corrected_by     = 'Sam (open-asks sheet 90), applied by S406 SkyIronwood',
  corrected_at     = now(),
  correction_note  = 'The college''s catalog page names the 2026-2027 catalog on its curriQunet host; the class-search page the census filed lists no program requirements (S406 page reads 39046661339, 39046881195, 39047849634).'
where r.college = 'Cuesta College'
  and r.catalog_url = 'https://www.cuesta.edu/become-student/findclasses/index.html'
  and r.corrected_by is null
returning r.college, r.catalog_url, r.catalog_year, r.catalog_platform, r.catalog_format;
