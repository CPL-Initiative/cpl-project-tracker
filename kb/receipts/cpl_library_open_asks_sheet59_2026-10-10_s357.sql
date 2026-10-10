-- S357 SkyCanopy, 2026-10-10: Open Asks Sheet 59 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). Sheet 58's card 1 premise moved before any reply (the read now
-- lists curriQunet catalogs, #1961), so sheet 59 asks both cards again. One guarded statement; it applies only from 58.
-- APPLIED 2026-10-10 by S357 through apply_migration (cpl_library_open_asks_sheet59_s357), on the first try. Read back:
-- version 59, 32 versions, Sheet 59 first and Current, Sheet 58 Earlier, made_by 136 characters.
-- Before-values (read live 2026-10-10 ~19:40Z): version 58, url https://claude.ai/artifact/FQRfjZmPUz3BTprr3X9tid,
-- file_name 2026-10-10-open-asks-58.html, extent '2 cards (sheet 58)', made_by 'Each sheet by the session that built it:
-- sheets 46 to 58 by S341 SkyTerrace through S357 SkyCanopy, sheet 49 by the library side session', updated_by
-- 'S357 SkyCanopy', versions 31 entries with Sheet 58 first and Current.
-- Rollback: set those values back where slug = 'open-asks-sheets', drop the first entry of versions, and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
update public.cpl_library
set version = '59',
    url = 'https://claude.ai/artifact/5TquL7JV4vEQcGfsxx5V62',
    file_name = '2026-10-10-open-asks-59.html',
    extent = '2 cards (sheet 59)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 59 by S341 SkyTerrace through S357 SkyCanopy, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 59', 'date', '2026-10-10', 'status', 'Current', 'url', 'https://claude.ai/artifact/5TquL7JV4vEQcGfsxx5V62'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S357 SkyCanopy'
where slug = 'open-asks-sheets'
  and version = '58'
  and url = 'https://claude.ai/artifact/FQRfjZmPUz3BTprr3X9tid'
  and versions->0->>'label' = 'Sheet 58';
