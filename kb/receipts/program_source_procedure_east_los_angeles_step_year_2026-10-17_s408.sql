-- S408 SkyAgave, 2026-10-17: East Los Angeles College's catalog step (v1 -> v2) names its file's year, 2026-2027,
-- the words the catalog page prints on the link the step follows ("2026 - 2027"; page read 39009644813, cited in the
-- step's own why). The row names no year, so its 120 loaded records carry none (S403); since #2202 the capture takes a
-- catalog step's year when the row names none. Through program_source_procedure_set, expecting the md5 of v1.
-- Rollback: program_source_registry_history holds the prior record.

select public.program_source_procedure_set(p.college,
  jsonb_set(p.procedure || jsonb_build_object('v', (p.procedure->>'v')::int + 1), '{catalog,catalog_year}', '"2026-2027"'),
  'S408 SkyAgave, 2026-10-17 (the catalog step names its file''s year; page read 39009644813)',
  md5(p.procedure::text))
from public.program_source_registry p
where (p.college, md5(p.procedure::text)) in (('East Los Angeles College', 'ba1495ed2570043f8ee5a6e3e11abf8d'));
