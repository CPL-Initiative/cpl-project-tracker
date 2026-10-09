-- S349 SkyHarbor, 2026-10-09: Open Asks Sheet 55 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). It supersedes the S348 receipt
-- (cpl_library_open_asks_sheet54_2026-10-08_s348.sql), which was handed to Sam to paste and had not landed when this
-- was written (read live 2026-10-09 ~00:50Z: version 50). Two guarded statements; exactly one applies:
--   from version 50 (the S348 paste never ran): Sheets 55, 54, 53, 52, 51 join the versions list above Sheet 50;
--   from version 54 (it ran): Sheet 55 joins above Sheet 54.
-- NOT YET APPLIED: apply_migration timed out once (~00:52Z) with nothing written (read back: version 50), as S348's
-- three attempts did. Paste it in the SQL editor; read back version 55 and Sheet 55 first in versions.
-- Before-values (read live 2026-10-09 ~00:50Z): version 50, url https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr,
-- file_name 2026-10-08-open-asks-50.html, extent '5 cards (sheet 50)', made_by 'S341 SkyTerrace (sheets 46-48); the
-- library side session (sheet 49); S345 SkyLantern (sheet 50); each earlier sheet by the session that built it',
-- updated_by 'S345 SkyLantern (pasted by Sam)', versions 23 entries with Sheet 50 first and Current. (From 54, the
-- before-values are those the S348 receipt writes.)
-- Rollback: set those values back where slug = 'open-asks-sheets', and drop the entries this added from the front of
-- versions (five from 50, one from 54), then status 'Current' on the new first; cpl_library_history_trg files the
-- prior row either way.
update public.cpl_library
set version = '55',
    url = 'https://claude.ai/artifact/FfCtXWkFBdSBX4BGcitj5o',
    file_name = '2026-10-09-open-asks-55.html',
    extent = '1 card (sheet 55)',
    made_by = 'S341 SkyTerrace (sheets 46-48); the library side session (sheet 49); S345 SkyLantern (sheet 50); S346 SkyCairn (sheet 51); S347 SkyTrellis (sheet 52); S348 SkyMeadow (sheets 53-54); S349 SkyHarbor (sheet 55); each earlier sheet by the session that built it',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 55', 'date', '2026-10-09', 'status', 'Current', 'url', 'https://claude.ai/artifact/FfCtXWkFBdSBX4BGcitj5o'),
                 jsonb_build_object('label', 'Sheet 54', 'date', '2026-10-08', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/JpXCBoBehgWFPAT6vwW7xA'),
                 jsonb_build_object('label', 'Sheet 53', 'date', '2026-10-08', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/5r25uuCYHyKoJLFc18jcFz'),
                 jsonb_build_object('label', 'Sheet 52', 'date', '2026-10-08', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/1S8zkqqF9QdzqwLJSaGB1A'),
                 jsonb_build_object('label', 'Sheet 51', 'date', '2026-10-08', 'status', 'Earlier', 'url', 'https://claude.ai/artifact/AYuPisSF5Tc4rmftgCYvb2'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S349 SkyHarbor'
where slug = 'open-asks-sheets'
  and version = '50'
  and url = 'https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr'
  and versions->0->>'label' = 'Sheet 50';

update public.cpl_library
set version = '55',
    url = 'https://claude.ai/artifact/FfCtXWkFBdSBX4BGcitj5o',
    file_name = '2026-10-09-open-asks-55.html',
    extent = '1 card (sheet 55)',
    made_by = 'S341 SkyTerrace (sheets 46-48); the library side session (sheet 49); S345 SkyLantern (sheet 50); S346 SkyCairn (sheet 51); S347 SkyTrellis (sheet 52); S348 SkyMeadow (sheets 53-54); S349 SkyHarbor (sheet 55); each earlier sheet by the session that built it',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 55', 'date', '2026-10-09', 'status', 'Current', 'url', 'https://claude.ai/artifact/FfCtXWkFBdSBX4BGcitj5o'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S349 SkyHarbor'
where slug = 'open-asks-sheets'
  and version = '54'
  and url = 'https://claude.ai/artifact/JpXCBoBehgWFPAT6vwW7xA'
  and versions->0->>'label' = 'Sheet 54';
