-- S466 SkyYerbaSanta, 2026-10-24: Open Asks Sheet 123 becomes the open-asks series record's current version (Sam's sheet 47 card 5:
-- one record per series, each new sheet a version). The record read 122 (S460's receipt, run 40051278289).
-- Rule 10: one guarded UPDATE, applying only from version '122' as read and only if nobody edited the row since the read
-- (updated_at as read); rows_updated = 0 means Sam or a session edited it since: re-read and retry.
-- BEFORE (read live through the Supabase MCP, 2026-10-24 ~12:58Z): version '122', url https://claude.ai/artifact/PKRBW9ucqKtikxhRtevHrj,
--   file_name '2026-10-24-open-asks-122.html', extent '1 card (sheet 122)', made_by 'Each sheet by the session that built it: sheets 46 to 122
--   by S341 SkyTerrace through S460 SkyFremontia, sheet 49 by the library side session', updated_by 'S460 SkyFremontia',
--   updated_at 2026-10-24 01:49:55.91663+00, versions 41 entries with Sheet 122 first and Current.
-- ROLLBACK: set those values back where slug = 'open-asks-sheets', drop the first entry of versions and set status 'Current' on the new
-- first; cpl_library_history_trg files the prior row either way.
-- A good result is one row: version 123, extent '2 cards (sheet 123)', n_versions 42.
update public.cpl_library
set version = '123',
    url = 'https://claude.ai/artifact/4bedPAUhXKfLSEScLbEpX3',
    file_name = '2026-10-24-open-asks-123.html',
    extent = '2 cards (sheet 123)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 123 by S341 SkyTerrace through S466 SkyYerbaSanta, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 123', 'date', '2026-10-24', 'status', 'Current', 'url', 'https://claude.ai/artifact/4bedPAUhXKfLSEScLbEpX3'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S466 SkyYerbaSanta'
where slug = 'open-asks-sheets'
  and version = '122'
  and updated_at = '2026-10-24 01:49:55.91663+00'
returning version, extent, updated_by, jsonb_array_length(versions) as n_versions;
