-- S348 SkyMeadow, 2026-10-08: Open Asks Sheet 54 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). Sheets 51 (S346), 52 (S347) and 53 (S348, answered at
-- 22:44Z) were published without a Library step; they join the versions list beneath 54, so the series lists every
-- sheet.
-- Guarded UPDATE: it applies only while the row still reads version 50 at sheet 50's link.
-- NOT YET APPLIED: apply_migration timed out three times (~22:55-23:05Z, written for sheet 53) with nothing written
-- (read back: version 50); the sheet 49 receipt timed out four times the same way and went in by paste. Paste it in
-- the SQL editor; read back version 54 and Sheet 54 first in versions.
-- Before-values (read live 2026-10-08 ~22:55Z): version 50, url https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr,
-- file_name 2026-10-08-open-asks-50.html, extent '5 cards (sheet 50)', made_by 'S341 SkyTerrace (sheets 46-48); the
-- library side session (sheet 49); S345 SkyLantern (sheet 50); each earlier sheet by the session that built it',
-- updated_by 'S345 SkyLantern (pasted by Sam)', versions 23 entries with Sheet 50 first and Current.
-- Rollback: set those values back where slug = 'open-asks-sheets', and drop the first four versions entries
-- (versions - 0 - 0 - 0 - 0, then status 'Current' on the new first); cpl_library_history_trg files the prior row.
update public.cpl_library
set version = '54',
    url = 'https://claude.ai/artifact/JpXCBoBehgWFPAT6vwW7xA',
    file_name = '2026-10-08-open-asks-54.html',
    extent = '1 card (sheet 54)',
    made_by = 'S341 SkyTerrace (sheets 46-48); the library side session (sheet 49); S345 SkyLantern (sheet 50); S346 SkyCairn (sheet 51); S347 SkyTrellis (sheet 52); S348 SkyMeadow (sheets 53-54); each earlier sheet by the session that built it',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 54', 'date', '2026-10-08', 'status', 'Current', 'url', 'https://claude.ai/artifact/JpXCBoBehgWFPAT6vwW7xA'),
                 jsonb_build_object('label', 'Sheet 53', 'date', '2026-10-08', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/5r25uuCYHyKoJLFc18jcFz'),
                 jsonb_build_object('label', 'Sheet 52', 'date', '2026-10-08', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/1S8zkqqF9QdzqwLJSaGB1A'),
                 jsonb_build_object('label', 'Sheet 51', 'date', '2026-10-08', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/AYuPisSF5Tc4rmftgCYvb2'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S348 SkyMeadow'
where slug = 'open-asks-sheets'
  and version = '50'
  and url = 'https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr'
  and versions->0->>'label' = 'Sheet 50';
