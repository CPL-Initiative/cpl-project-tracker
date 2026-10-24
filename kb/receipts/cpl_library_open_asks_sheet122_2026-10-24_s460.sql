-- S460 SkyFremontia, 2026-10-24: Open Asks Sheet 122 becomes the open-asks series record's current version (Sam's sheet 47 card 5:
-- one record per series, each new sheet a version). The record read 121 (S459's receipt, run 40026872611).
-- Rule 10: one guarded UPDATE, applying only from version '121' as read and only if nobody edited the row since the read
-- (updated_at as read); rows_updated = 0 means Sam or a session edited it since: re-read and retry.
-- BEFORE (read live through the Supabase MCP, 2026-10-24 ~01:40Z): version '121', url https://claude.ai/artifact/NsRnyxTJ3pZmHBWk2qSoLN,
--   file_name '2026-10-23-open-asks-121.html', extent '3 cards (sheet 121)', made_by 'Each sheet by the session that built it: sheets 46 to 121
--   by S341 SkyTerrace through S459 SkyBuckeye, sheet 49 by the library side session', updated_by 'S459 SkyBuckeye',
--   updated_at 2026-10-23 21:31:16.07488+00, versions 40 entries with Sheet 121 first and Current.
-- ROLLBACK: set those values back where slug = 'open-asks-sheets', drop the first entry of versions and set status 'Current' on the new
-- first; cpl_library_history_trg files the prior row either way.
-- A good result is one row: version 122, extent '1 card (sheet 122)', n_versions 41.
update public.cpl_library
set version = '122',
    url = 'https://claude.ai/artifact/PKRBW9ucqKtikxhRtevHrj',
    file_name = '2026-10-24-open-asks-122.html',
    extent = '1 card (sheet 122)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 122 by S341 SkyTerrace through S460 SkyFremontia, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 122', 'date', '2026-10-24', 'status', 'Current', 'url', 'https://claude.ai/artifact/PKRBW9ucqKtikxhRtevHrj'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S460 SkyFremontia'
where slug = 'open-asks-sheets'
  and version = '121'
  and updated_at = '2026-10-23 21:31:16.07488+00'
returning version, extent, updated_by, jsonb_array_length(versions) as n_versions;
