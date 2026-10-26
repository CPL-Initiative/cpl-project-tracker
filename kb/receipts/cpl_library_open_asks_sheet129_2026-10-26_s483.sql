-- S483 (SkyCoyoteMint), 2026-10-26. The open-asks series record (Library slug open-asks-sheets) read version 123: Sheets
-- 124 to 128 were published without its update. This brings it to Sheet 129 (https://claude.ai/artifact/PkU8ut6YUpy6CixkUU84j8,
-- three cards: 128's two carried, and DSP Credit Starting Points Version 2 for the public copy), adding 124 to 129 to the
-- versions, newest first, Sheet 123 moving to Earlier. Links from the vault's decision_sheets.md.
-- Rule 10: one guarded UPDATE from the before-values read live at ~04:00Z 2026-10-26:
--   version 123, url https://claude.ai/artifact/4bedPAUhXKfLSEScLbEpX3, updated_by S466 SkyYerbaSanta,
--   updated_at 2026-10-24 13:01:30.659598+00, made_by 'Each sheet by the session that built it: sheets 46 to 123 by S341
--   SkyTerrace through S466 SkyYerbaSanta, sheet 49 by the library side session', versions[0] Sheet 123 Current (42 entries).
-- rows_updated = 0 means someone edited the row since: re-read and retry.
-- ROLLBACK (cpl_library_history_trg files the prior row either way):
--   update public.cpl_library set version = '123', url = 'https://claude.ai/artifact/4bedPAUhXKfLSEScLbEpX3',
--     made_by = 'Each sheet by the session that built it: sheets 46 to 123 by S341 SkyTerrace through S466 SkyYerbaSanta, sheet 49 by the library side session',
--     versions = jsonb_set(versions - 0 - 0 - 0 - 0 - 0 - 0, '{0,status}', '"Current"'), updated_by = 'S466 SkyYerbaSanta'
--   where slug = 'open-asks-sheets';
-- A good result is version 129 with 48 versions.
update public.cpl_library l
set version = '129',
    url = 'https://claude.ai/artifact/PkU8ut6YUpy6CixkUU84j8',
    made_by = 'Each sheet by the session that built it: sheets 46 to 129 by S341 SkyTerrace through S483 SkyCoyoteMint, sheet 49 by the library side session',
    versions = '[{"url":"https://claude.ai/artifact/PkU8ut6YUpy6CixkUU84j8","date":"2026-10-26","label":"Sheet 129","status":"Current"},
                 {"url":"https://claude.ai/artifact/Autcr5Dvvdb4u9Ef1JeWbq","date":"2026-10-26","label":"Sheet 128","status":"Earlier"},
                 {"url":"https://claude.ai/artifact/VfX9JnaA5j3ESubzHKYc3A","date":"2026-10-25","label":"Sheet 127","status":"Earlier"},
                 {"url":"https://claude.ai/artifact/DhHtadX92wE5LxmAWrB2z5","date":"2026-10-24","label":"Sheet 126","status":"Earlier"},
                 {"url":"https://claude.ai/artifact/5zqA3S25eECWH9NALZRamE","date":"2026-10-24","label":"Sheet 125","status":"Earlier"},
                 {"url":"https://claude.ai/artifact/U5EKwPSiNhUgY8QX75XDsG","date":"2026-10-24","label":"Sheet 124","status":"Earlier"}]'::jsonb
               || jsonb_set(l.versions, '{0,status}', '"Earlier"'),
    updated_by = 'S483 SkyCoyoteMint'
where l.slug = 'open-asks-sheets'
  and l.version = '123'
  and l.updated_at = '2026-10-24 13:01:30.659598+00'
returning l.slug, l.version, jsonb_array_length(l.versions) as versions;
