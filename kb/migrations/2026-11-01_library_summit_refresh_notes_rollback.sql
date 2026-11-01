-- Rollback for 2026-11-01_library_summit_refresh_notes.sql: the two rows' before-values, read 2026-11-01 ~13:55Z.
update public.cpl_library
set refresh_note = 'students served and the funding figures, the week of the summit, then re-render both cuts',
    updated_by = null
where slug = 'noncredit-summit-in-motion' and updated_by = 'library-s539side@bot' and refresh_note is null;
update public.cpl_library
set refresh_note = 'students served from live_metrics.json, and the funding figures if the config md5 is no longer 764fd264, if the summit is more than a week after Oct. 6',
    updated_by = 'Sam'
where slug = 'noncredit-summit-cpl-slides' and updated_by = 'library-s539side@bot' and refresh_note is null;
