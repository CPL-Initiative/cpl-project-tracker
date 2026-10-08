-- S345 SkyLantern, 2026-10-08: Open Asks Sheet 50 becomes the open-asks series record's current version, with sheet 49
-- listed before it (Sam's sheet 47 card 5: one record per series, each new sheet a version). It replaces
-- kb/receipts/cpl_library_open_asks_sheet49_2026-10-08.sql, which never applied: apply_migration timed out on it four
-- times (the library side session twice, S344, S345 at 17:2xZ) while a registry migration applied first try.
-- Guarded UPDATE: it applies only while the row still reads version 48 at sheet 48's link.
-- Before-values: version 48, url https://claude.ai/artifact/FWGJ2uNEGB1RrhMPrFsaCJ, file_name 2026-10-07-open-asks-48.html,
-- extent '2 cards (sheet 48)', updated_by null, versions with Sheet 48 first and Current (21 entries).
-- Rollback: set those values back where slug = 'open-asks-sheets'; cpl_library_history_trg files the prior row.
update public.cpl_library
set version = '50',
    url = 'https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr',
    file_name = '2026-10-08-open-asks-50.html',
    extent = '5 cards (sheet 50)',
    made_by = 'S341 SkyTerrace (sheets 46-48); the library side session (sheet 49); S345 SkyLantern (sheet 50); each earlier sheet by the session that built it',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 50', 'date', '2026-10-08', 'status', 'Current', 'url', 'https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr'),
                 jsonb_build_object('label', 'Sheet 49', 'date', '2026-10-08', 'status', 'Earlier',
                                    'url', 'https://claude.ai/artifact/6uMT8LrZgMZBit3Gs8wHBL'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S345 SkyLantern (pasted by Sam)'
where slug = 'open-asks-sheets'
  and version = '48'
  and url = 'https://claude.ai/artifact/FWGJ2uNEGB1RrhMPrFsaCJ'
  and versions->0->>'label' = 'Sheet 48';
