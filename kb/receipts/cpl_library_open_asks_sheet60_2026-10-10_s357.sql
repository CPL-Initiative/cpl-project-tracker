-- S357 SkyCanopy, 2026-10-10: Open Asks Sheet 60 becomes the open-asks series record's current version (Sam's sheet 47
-- card 5: one record per series, each new sheet a version). Sam answered sheet 59 card 1 in chat ("RCCD go!", ~19:45Z),
-- so sheet 60 carries the one open call left (the eight dropped rows). One guarded statement; it applies only from 59.
-- APPLIED 2026-10-10 ~19:40Z by S357 through apply_migration; S357 wrote no receipt file before its emergency
-- checkpoint, so S358 SkyFern wrote this one from the sheet 59 receipt and the live read below.
-- Read back by S358 (2026-10-10 ~20:20Z): version 60, 33 versions, Sheet 60 first and Current, Sheet 59 Earlier,
-- extent '1 card (sheet 60)', updated_at 2026-10-10 19:40:44Z.
-- Before-values (the sheet 59 receipt's after-values): version 59, url https://claude.ai/artifact/5TquL7JV4vEQcGfsxx5V62,
-- file_name 2026-10-10-open-asks-59.html, extent '2 cards (sheet 59)', made_by 'Each sheet by the session that built it:
-- sheets 46 to 59 by S341 SkyTerrace through S357 SkyCanopy, sheet 49 by the library side session', updated_by
-- 'S357 SkyCanopy', versions 32 entries with Sheet 59 first and Current.
-- Rollback: set those values back where slug = 'open-asks-sheets', drop the first entry of versions, and set status
-- 'Current' on the new first; cpl_library_history_trg files the prior row either way.
update public.cpl_library
set version = '60',
    url = 'https://claude.ai/artifact/7asFQExdaXFHRmEMnCxiM2',
    file_name = '2026-10-10-open-asks-60.html',
    extent = '1 card (sheet 60)',
    made_by = 'Each sheet by the session that built it: sheets 46 to 60 by S341 SkyTerrace through S357 SkyCanopy, sheet 49 by the library side session',
    versions = jsonb_build_array(
                 jsonb_build_object('label', 'Sheet 60', 'date', '2026-10-10', 'status', 'Current', 'url', 'https://claude.ai/artifact/7asFQExdaXFHRmEMnCxiM2'))
               || jsonb_set(versions, '{0,status}', '"Earlier"'),
    updated_by = 'S357 SkyCanopy'
where slug = 'open-asks-sheets'
  and version = '59'
  and url = 'https://claude.ai/artifact/5TquL7JV4vEQcGfsxx5V62'
  and versions->0->>'label' = 'Sheet 59';
