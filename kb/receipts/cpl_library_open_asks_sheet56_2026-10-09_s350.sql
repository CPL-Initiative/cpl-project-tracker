-- S350 SkyTide, 2026-10-09: Open Asks Sheet 56 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). One guarded statement; it applies only from version 55.
-- Handed to Sam to paste: apply_migration times out on cpl_library and on no other table (five times through S349).
-- Paste it in the SQL editor; read back version 56, 29 versions, Sheet 56 first and Current.
-- Before-values (read live 2026-10-09 ~02:20Z): version 55, url https://claude.ai/artifact/FfCtXWkFBdSBX4BGcitj5o,
-- file_name 2026-10-09-open-asks-55.html, extent '1 card (sheet 55)', made_by 'S341 SkyTerrace (sheets 46-48); the
-- library side session (sheet 49); S345 SkyLantern (sheet 50); S346 SkyCairn (sheet 51); S347 SkyTrellis (sheet 52);
-- S348 SkyMeadow (sheets 53-54); S349 SkyHarbor (sheet 55); each earlier sheet by the session that built it',
-- updated_by 'S349 SkyHarbor', versions 28 entries with Sheet 55 first and Current.
-- Rollback: set those values back where slug = 'open-asks-sheets', drop the first entry of versions, and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
update public.cpl_library
set version = '56',
    url = 'https://claude.ai/artifact/By4Q1M7KVPzaMkRaJkb48m',
    file_name = '2026-10-09-open-asks-56.html',
    extent = '1 card (sheet 56)',
    made_by = 'S341 SkyTerrace (sheets 46-48); the library side session (sheet 49); S345 SkyLantern (sheet 50); S346 SkyCairn (sheet 51); S347 SkyTrellis (sheet 52); S348 SkyMeadow (sheets 53-54); S349 SkyHarbor (sheet 55); S350 SkyTide (sheet 56); each earlier sheet by the session that built it',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 56', 'date', '2026-10-09', 'status', 'Current', 'url', 'https://claude.ai/artifact/By4Q1M7KVPzaMkRaJkb48m'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S350 SkyTide'
where slug = 'open-asks-sheets'
  and version = '55'
  and url = 'https://claude.ai/artifact/FfCtXWkFBdSBX4BGcitj5o'
  and versions->0->>'label' = 'Sheet 55';
