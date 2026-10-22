-- S450 SkyMariposa, 2026-10-22: Open Asks Sheet 115 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). Sheets 62 to 114 were published without updating the record,
-- so the versions list keeps Sheet 61 as the prior entry rather than inventing fifty-three entries nobody filed.
-- Sheet 115: https://claude.ai/artifact/QTC1MKB7AbWBMQtL9iPba9 (three cards: the 25 older-build program records and Victor
-- Valley's two; Scenario 4's two noncredit-gate calls, proceeded on the recommendation, reply to reverse).
-- Rule 10: one guarded UPDATE. It applies only from version '61' as read, and only if nobody has edited the row since the
-- read (updated_at as read); rows_updated = 0 means Sam or a session edited it since: re-read and retry.
-- BEFORE (read live by S450 through the Supabase MCP, 2026-10-22 ~23:05Z): version '61',
--   url https://claude.ai/artifact/F45i4HkCA1X9iZbqZriUeB, file_name 2026-10-11-open-asks-61.html,
--   extent '2 cards (sheet 61)', made_by 'Each sheet by the session that built it: sheets 46 to 61 by S341 SkyTerrace
--   through S360 SkyLichen, sheet 49 by the library side session', updated_by 'Sam',
--   updated_at 2026-10-20 22:21:20.730028+00, status null, versions 34 entries with Sheet 61 first and Current
--   (url F45i4HkCA1X9iZbqZriUeB, date 2026-10-11) and Sheet 60 second and Earlier (url 7asFQExdaXFHRmEMnCxiM2).
-- ROLLBACK: set those values back where slug = 'open-asks-sheets', drop the first entry of versions and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
-- A good result is one row: version 115, extent '3 cards (sheet 115)', n_versions 35.
update public.cpl_library
set version = '115',
    url = 'https://claude.ai/artifact/QTC1MKB7AbWBMQtL9iPba9',
    file_name = '2026-10-22-open-asks-115.html',
    extent = '3 cards (sheet 115)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 115 by S341 SkyTerrace through S450 SkyMariposa, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 115', 'date', '2026-10-22', 'status', 'Current', 'url', 'https://claude.ai/artifact/QTC1MKB7AbWBMQtL9iPba9'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S450 SkyMariposa'
where slug = 'open-asks-sheets'
  and version = '61'
  and updated_at = '2026-10-20 22:21:20.730028+00'
returning version, extent, updated_by, jsonb_array_length(versions) as n_versions;
