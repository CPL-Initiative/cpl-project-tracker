-- Library side session, 2026-10-08: Open Asks Sheet 49 joins the open-asks series record as its current version
-- (Sam's sheet 47 card 5: one record per series, each new sheet a version). Guarded UPDATE: it applies only while the
-- row still reads version 48 at sheet 48's link. Before-values: version 48, url https://claude.ai/artifact/FWGJ2uNEGB1RrhMPrFsaCJ,
-- file_name 2026-10-07-open-asks-48.html, extent 2 cards (sheet 48), made_by as below without the sheet 49 clause,
-- updated_by null, versions with Sheet 48 first and Current (21 entries); cpl_library_history_trg also files the prior row.
-- Rollback: set those values back where slug = 'open-asks-sheets' and version = '49', with versions = the history row's.
update public.cpl_library
set version = '49',
    url = 'https://claude.ai/artifact/6uMT8LrZgMZBit3Gs8wHBL',
    file_name = '2026-10-08-open-asks-49.html',
    extent = '3 cards (sheet 49)',
    made_by = 'S341 SkyTerrace (sheets 46-48); the library side session (sheet 49); each earlier sheet by the session that built it',
    versions = jsonb_build_array(jsonb_build_object('label', 'Sheet 49', 'date', '2026-10-08', 'status', 'Current',
                                                    'url', 'https://claude.ai/artifact/6uMT8LrZgMZBit3Gs8wHBL'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'library-side-2026-10-08@bot'
where slug = 'open-asks-sheets'
  and version = '48'
  and url = 'https://claude.ai/artifact/FWGJ2uNEGB1RrhMPrFsaCJ'
  and versions->0->>'label' = 'Sheet 48';
