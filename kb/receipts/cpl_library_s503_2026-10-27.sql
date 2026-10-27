-- S503 SkyElderberry, 2026-10-27: the Library's series record moves to Open Asks Sheet 137
-- (one guarded UPDATE, read live at 21:33Z). Sheets 135 and 136 were answered without moving it.
-- BEFORE: url https://claude.ai/artifact/9GPuiZ5F4dvjCrinyJFr5q, version '134', updated_at 2026-10-27 01:13:18.037556+00.
-- ROLLBACK: update public.cpl_library set url = 'https://claude.ai/artifact/9GPuiZ5F4dvjCrinyJFr5q', version = '134'
--   where slug = 'open-asks-sheets';
update public.cpl_library
set url = 'https://claude.ai/artifact/QU1p7BHMsajjJsW8ty3FK1', version = '137'
where slug = 'open-asks-sheets' and version = '134' and url = 'https://claude.ai/artifact/9GPuiZ5F4dvjCrinyJFr5q';
select slug || ' v' || version, url from public.cpl_library where slug = 'open-asks-sheets';
