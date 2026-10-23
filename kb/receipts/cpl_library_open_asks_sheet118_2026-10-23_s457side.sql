-- The side session beside S457, 2026-10-23: Open Asks Sheet 118 becomes the open-asks series record's current version
-- (Sam's sheet 47 card 5: one record per series, each new sheet a version).
-- Sheet 118: https://claude.ai/artifact/D3uYDvJ3MigHaM8CgpKWse (eight cards: Sheet 117's three carried at the same
-- positions; then from the communications register, the $150,000 to $400,000 range in the CEO email under the sunshine
-- rule, one writer module for the twelve surfaces that draft prose, the JST-figures sentence, the salutation default,
-- and the May 2026 budget-support curator's future).
-- Rule 10: one guarded UPDATE. It applies only from version '117' as read, and only if nobody has edited the row since
-- the read (updated_at as read); rows_updated = 0 means Sam or a session edited it since: re-read and retry.
-- BEFORE (read live through the Supabase MCP, 2026-10-23 18:03Z): version '117',
--   url https://claude.ai/artifact/UkzrGukGumwJxrdyDGgb5Y, file_name 2026-10-23-open-asks-117.html,
--   extent '3 cards (sheet 117)', made_by 'Each sheet by the session that built it: sheets 46 to 117 by S341 SkyTerrace
--   through S456 SkyYarrow, sheet 49 by the library side session', updated_by 'S456 SkyYarrow',
--   updated_at 2026-10-23 14:38:42.587651+00, status null, versions 36 entries with Sheet 117 first and Current.
-- ROLLBACK: set those values back where slug = 'open-asks-sheets', drop the first entry of versions and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
-- A good result is one row: version 118, extent '8 cards (sheet 118)', n_versions 37.
update public.cpl_library
set version = '118',
    url = 'https://claude.ai/artifact/D3uYDvJ3MigHaM8CgpKWse',
    file_name = '2026-10-23-open-asks-118.html',
    extent = '8 cards (sheet 118)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 118 by S341 SkyTerrace through the side session beside S457, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 118', 'date', '2026-10-23', 'status', 'Current', 'url', 'https://claude.ai/artifact/D3uYDvJ3MigHaM8CgpKWse'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'the side session beside S457'
where slug = 'open-asks-sheets'
  and version = '117'
  and updated_at = '2026-10-23 14:38:42.587651+00'
returning version, extent, updated_by, jsonb_array_length(versions) as n_versions;
