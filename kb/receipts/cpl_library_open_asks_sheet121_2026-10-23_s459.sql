-- S459 SkyBuckeye, 2026-10-23: Open Asks Sheet 121 becomes the open-asks series record's current version (Sam's sheet 47 card 5:
-- one record per series, each new sheet a version). Sheets 119 (S457) and 120 (S458) are added behind it; the record read 118.
-- Rule 10: one guarded UPDATE, applying only from version '118' as read and only if nobody edited the row since the read
-- (updated_at as read); rows_updated = 0 means Sam or a session edited it since: re-read and retry.
-- BEFORE (read live through the Supabase MCP, 2026-10-23 ~21:20Z): version '118', url https://claude.ai/artifact/D3uYDvJ3MigHaM8CgpKWse,
--   extent '8 cards (sheet 118)', made_by 'Each sheet by the session that built it: sheets 46 to 118 by S341 SkyTerrace through the side
--   session beside S457, sheet 49 by the library side session', updated_by 'the side session beside S457',
--   updated_at 2026-10-23 18:15:50.105838+00, versions 37 entries with Sheet 118 first and Current.
-- ROLLBACK: set those values back where slug = 'open-asks-sheets', drop the first three entries of versions and set status 'Current' on
-- the new first; cpl_library_history_trg files the prior row either way.
-- A good result is one row: version 121, extent '3 cards (sheet 121)', n_versions 40.
update public.cpl_library
set version = '121',
    url = 'https://claude.ai/artifact/NsRnyxTJ3pZmHBWk2qSoLN',
    file_name = '2026-10-23-open-asks-121.html',
    extent = '3 cards (sheet 121)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 121 by S341 SkyTerrace through S459 SkyBuckeye, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 121', 'date', '2026-10-23', 'status', 'Current', 'url', 'https://claude.ai/artifact/NsRnyxTJ3pZmHBWk2qSoLN'),
                 jsonb_build_object('label', 'Sheet 120', 'date', '2026-10-23', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/NWy1GvYEEQgS8oKrYWHpTk'),
                 jsonb_build_object('label', 'Sheet 119', 'date', '2026-10-23', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/HBX4e6H3coWj86Cbc4ivUM'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S459 SkyBuckeye'
where slug = 'open-asks-sheets'
  and version = '118'
  and updated_at = '2026-10-23 18:15:50.105838+00'
returning version, extent, updated_by, jsonb_array_length(versions) as n_versions;
