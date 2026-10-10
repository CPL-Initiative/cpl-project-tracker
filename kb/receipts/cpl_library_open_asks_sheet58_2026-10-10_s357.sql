-- S357 SkyCanopy, 2026-10-10: Open Asks Sheet 58 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). One guarded statement; it applies only from version 57.
-- Read it back after: version 58, 31 versions, Sheet 58 first and Current, Sheet 57 Earlier.
-- APPLIED 2026-10-10 by S357 through apply_migration (cpl_library_open_asks_sheet58_s357), on the first try. Read back:
-- version 58, 31 versions, Sheet 58 first and Current, Sheet 57 Earlier, made_by 136 characters.
-- Before-values (read live 2026-10-10 ~18:40Z): version 57, url https://claude.ai/artifact/XGgsHHu54rJmNGeEuT1teL,
-- file_name 2026-10-09-open-asks-57.html, extent '1 card (sheet 57)', made_by 'Each sheet by the session that built it:
-- sheets 46 to 57 by S341 SkyTerrace through S352 SkyMeridian, sheet 49 by the library side session', updated_by
-- 'S352 SkyMeridian', versions 30 entries with Sheet 57 first and Current.
-- Rollback: set those values back where slug = 'open-asks-sheets', drop the first entry of versions, and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
update public.cpl_library
set version = '58',
    url = 'https://claude.ai/artifact/FQRfjZmPUz3BTprr3X9tid',
    file_name = '2026-10-10-open-asks-58.html',
    extent = '2 cards (sheet 58)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 58 by S341 SkyTerrace through S357 SkyCanopy, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 58', 'date', '2026-10-10', 'status', 'Current', 'url', 'https://claude.ai/artifact/FQRfjZmPUz3BTprr3X9tid'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S357 SkyCanopy'
where slug = 'open-asks-sheets'
  and version = '57'
  and url = 'https://claude.ai/artifact/XGgsHHu54rJmNGeEuT1teL'
  and versions->0->>'label' = 'Sheet 57';
