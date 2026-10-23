-- S456 SkyYarrow, 2026-10-23: Open Asks Sheet 117 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). Sheet 116 was published without updating the record, so the
-- versions list keeps Sheet 115 as the prior entry.
-- Sheet 117: https://claude.ai/artifact/UkzrGukGumwJxrdyDGgb5Y (three cards: a standing rule for the older-build program
-- records each wave leaves behind; Hartnell's Local GE at 23 and Cal-GETC 34 on a local degree whose own tab names it,
-- both proceeded on the recommendation, reply to reverse).
-- Rule 10: one guarded UPDATE. It applies only from version '115' as read, and only if nobody has edited the row since
-- the read (updated_at as read); rows_updated = 0 means Sam or a session edited it since: re-read and retry.
-- BEFORE (read live by S456 through the Supabase MCP, 2026-10-23 14:29Z): version '115',
--   url https://claude.ai/artifact/QTC1MKB7AbWBMQtL9iPba9, file_name 2026-10-22-open-asks-115.html,
--   extent '3 cards (sheet 115)', made_by 'Each sheet by the session that built it: sheets 46 to 115 by S341 SkyTerrace
--   through S450 SkyMariposa, sheet 49 by the library side session', updated_by 'S450 SkyMariposa',
--   updated_at 2026-10-22 23:05:27.297866+00, status null, versions 35 entries with Sheet 115 first and Current.
-- ROLLBACK: set those values back where slug = 'open-asks-sheets', drop the first entry of versions and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
-- A good result is one row: version 117, extent '3 cards (sheet 117)', n_versions 36.
update public.cpl_library
set version = '117',
    url = 'https://claude.ai/artifact/UkzrGukGumwJxrdyDGgb5Y',
    file_name = '2026-10-23-open-asks-117.html',
    extent = '3 cards (sheet 117)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 117 by S341 SkyTerrace through S456 SkyYarrow, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 117', 'date', '2026-10-23', 'status', 'Current', 'url', 'https://claude.ai/artifact/UkzrGukGumwJxrdyDGgb5Y'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S456 SkyYarrow'
where slug = 'open-asks-sheets'
  and version = '115'
  and updated_at = '2026-10-22 23:05:27.297866+00'
returning version, extent, updated_by, jsonb_array_length(versions) as n_versions;
