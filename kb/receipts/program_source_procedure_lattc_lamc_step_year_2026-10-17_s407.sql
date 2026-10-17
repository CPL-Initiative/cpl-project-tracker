-- S407 SkyMesquite, 2026-10-17: the catalog steps of Los Angeles Trade Technical College (v1 -> v2) and Los Angeles
-- Mission College (v3 -> v4) name their file's year, 2026-2027, which each catalog page prints beside the link
-- (page read 39053259803). The rows name no year, and the capture now takes a catalog step's year when the row names
-- none (claude/s407-step-year). Through program_source_procedure_set, each expecting the md5 S407's first write left.
-- Rollback: program_source_registry_history holds each prior record.

select public.program_source_procedure_set(p.college,
  jsonb_set(p.procedure || jsonb_build_object('v', (p.procedure->>'v')::int + 1), '{catalog,catalog_year}', '"2026-2027"'),
  'S407 SkyMesquite, 2026-10-17 (the catalog step names its file''s year; page read 39053259803)',
  md5(p.procedure::text))
from public.program_source_registry p
where (p.college, md5(p.procedure::text)) in (('Los Angeles Trade Technical College', 'ad245e80f421c704b8dce8489693fa36'),
                                              ('Los Angeles Mission College', '33e4b05fee1b0bc3a36028c0d2fb346f'));
