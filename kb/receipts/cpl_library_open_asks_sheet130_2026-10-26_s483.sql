-- S483 (SkyCoyoteMint), 2026-10-26. Open Asks Sheet 130 (https://claude.ai/artifact/4UnUdMkMRwqCVkS6bF47aD, one card:
-- whether cpl-chat deploys with the raised library page cap) joins the series record open-asks-sheets.
-- Rule 10: one guarded UPDATE from the before-values written by this session's Sheet 129 receipt (run 40264078101) and read
-- back at 03:28Z: version 129, updated_by S483 SkyCoyoteMint, versions[0] Sheet 129 Current (48 entries).
-- rows_updated = 0 means someone edited the row since: re-read and retry.
-- ROLLBACK: update public.cpl_library set version = '129', url = 'https://claude.ai/artifact/PkU8ut6YUpy6CixkUU84j8',
--   made_by = 'Each sheet by the session that built it: sheets 46 to 129 by S341 SkyTerrace through S483 SkyCoyoteMint, sheet 49 by the library side session',
--   versions = jsonb_set(versions - 0, '{0,status}', '"Current"') where slug = 'open-asks-sheets';
-- A good result is version 130 with 49 versions.
update public.cpl_library l
set version = '130',
    url = 'https://claude.ai/artifact/4UnUdMkMRwqCVkS6bF47aD',
    made_by = 'Each sheet by the session that built it: sheets 46 to 130 by S341 SkyTerrace through S483 SkyCoyoteMint, sheet 49 by the library side session',
    versions = '[{"url":"https://claude.ai/artifact/4UnUdMkMRwqCVkS6bF47aD","date":"2026-10-26","label":"Sheet 130","status":"Current"}]'::jsonb
               || jsonb_set(l.versions, '{0,status}', '"Earlier"'),
    updated_by = 'S483 SkyCoyoteMint'
where l.slug = 'open-asks-sheets'
  and l.version = '129'
  and l.updated_by = 'S483 SkyCoyoteMint'
returning l.slug, l.version, jsonb_array_length(l.versions) as versions;
