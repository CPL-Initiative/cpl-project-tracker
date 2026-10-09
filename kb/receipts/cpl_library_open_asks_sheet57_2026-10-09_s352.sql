-- S352 SkyMeridian, 2026-10-09: Open Asks Sheet 57 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). One guarded statement; it applies only from version 56.
-- Handed to Sam to paste in the SQL editor: the repo's Supabase guard blocks an update through execute_sql, and
-- apply_migration times out on cpl_library. Read it back after: version 57, 30 versions, Sheet 57 first and Current.
-- First paste failed (Sam, 2026-10-09 ~15:27Z): cpl_library_text_ck caps made_by at 300 characters, and the
-- per-session list had reached 281, so one more name broke it. made_by is now a range that does not grow;
-- the versions list keeps each sheet.
-- Before-values (read live 2026-10-09 ~14:50Z): version 56, url https://claude.ai/artifact/By4Q1M7KVPzaMkRaJkb48m,
-- file_name 2026-10-09-open-asks-56.html, extent '1 card (sheet 56)', made_by 'S341 SkyTerrace (sheets 46-48); the
-- library side session (sheet 49); S345 SkyLantern (sheet 50); S346 SkyCairn (sheet 51); S347 SkyTrellis (sheet 52);
-- S348 SkyMeadow (sheets 53-54); S349 SkyHarbor (sheet 55); S350 SkyTide (sheet 56); each earlier sheet by the session
-- that built it', updated_by 'S350 SkyTide', versions 29 entries with Sheet 56 first and Current.
-- Rollback: set those values back where slug = 'open-asks-sheets', drop the first entry of versions, and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
update public.cpl_library
set version = '57',
    url = 'https://claude.ai/artifact/XGgsHHu54rJmNGeEuT1teL',
    file_name = '2026-10-09-open-asks-57.html',
    extent = '1 card (sheet 57)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 57 by S341 SkyTerrace through S352 SkyMeridian, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 57', 'date', '2026-10-09', 'status', 'Current', 'url', 'https://claude.ai/artifact/XGgsHHu54rJmNGeEuT1teL'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S352 SkyMeridian'
where slug = 'open-asks-sheets'
  and version = '56'
  and url = 'https://claude.ai/artifact/By4Q1M7KVPzaMkRaJkb48m'
  and versions->0->>'label' = 'Sheet 56';
