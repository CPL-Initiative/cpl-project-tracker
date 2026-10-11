-- S360 SkyLichen, 2026-10-11: Open Asks Sheet 61 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). Sheet 60's one card is answered and carried out (#1968);
-- sheet 61 carries the harvest lane's two new asks (Long Beach City's extraction; Riverside City 39120).
-- One guarded statement; it applies only from 60.
-- APPLIED 2026-10-11 01:18:25Z by S360 through apply_migration (cpl_library_open_asks_sheet61_2026_10_11_s360).
-- Read back: version 61, 34 versions, Sheet 61 first and Current, Sheet 60 Earlier, extent '2 cards (sheet 61)'.
-- Before-values (read live by S360, 2026-10-11 ~01:20Z): version 60, url https://claude.ai/artifact/7asFQExdaXFHRmEMnCxiM2,
-- file_name 2026-10-10-open-asks-60.html, extent '1 card (sheet 60)', made_by 'Each sheet by the session that built it:
-- sheets 46 to 60 by S341 SkyTerrace through S357 SkyCanopy, sheet 49 by the library side session', updated_by
-- 'S357 SkyCanopy', updated_at 2026-10-10 19:40:44Z, versions 33 entries with Sheet 60 first and Current.
-- Rollback: set those values back where slug = 'open-asks-sheets', drop the first entry of versions, and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
update public.cpl_library
set version = '61',
    url = 'https://claude.ai/artifact/F45i4HkCA1X9iZbqZriUeB',
    file_name = '2026-10-11-open-asks-61.html',
    extent = '2 cards (sheet 61)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 61 by S341 SkyTerrace through S360 SkyLichen, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 61', 'date', '2026-10-11', 'status', 'Current', 'url', 'https://claude.ai/artifact/F45i4HkCA1X9iZbqZriUeB'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S360 SkyLichen'
where slug = 'open-asks-sheets'
  and version = '60'
  and url = 'https://claude.ai/artifact/7asFQExdaXFHRmEMnCxiM2'
  and versions->0->>'label' = 'Sheet 60';
