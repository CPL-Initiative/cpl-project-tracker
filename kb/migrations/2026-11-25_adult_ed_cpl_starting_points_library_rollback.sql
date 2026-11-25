-- Rollback for 2026-11-25_adult_ed_cpl_starting_points_library.sql: remove the record and the rows it added, if untouched.
delete from public.cpl_library where slug = 'adult-ed-cpl-starting-points'
  and added_by = 'library-adulted-2026-11-25@bot' and updated_by = 'library-adulted-2026-11-25@bot';
delete from public.cpl_memory where author = 'Claude (adult ed side job, 2026-11-25)' and slug in (
  'd-adult-ed-program-joins-credential-by-name-2026-11-25','d-quick-adopt-exhibit-credits-the-credential-2026-11-25',
  'd-could-adopt-reads-prescriptive-2026-11-25','r-get-credit-at-sam-2026-11-25',
  'r-public-tools-take-the-catalog-look-sam-2026-11-25','f-ca-map-initiative-college-in-public-exhibits-2026-11-25');
