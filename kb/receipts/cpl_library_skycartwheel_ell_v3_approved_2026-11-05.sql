-- SkyCartwheel (Library side session), 2026-11-05 ~15:35Z: ELL IET CPL Starting Points Version 3 to Approved.
-- Sam, relayed verbatim by SkyComet (S578 session): "set Version 3 to Approved". Version 3 is the public copy since
-- library-publish run 42048922546 (14:51Z, commit 2806f47d).
-- Before-values (read live at 15:35Z): status = 'draft', version = '3', regen = null,
--   updated_by = 'library-publish@bot', updated_at = 2026-11-05 14:51:43.016346+00. cpl_library_history files the prior row.
update public.cpl_library
set status = 'approved', updated_by = 'Sam (relayed by SkyComet; written by library-skycartwheel@bot)'
where id = '915ff7d5-80ce-45ad-bb95-d75510318ee0' and status = 'draft' and version = '3'
  and updated_at = '2026-11-05 14:51:43.016346+00'
returning slug, status, version, updated_by, updated_at;
-- ROLLBACK (guarded on this write):
--   update public.cpl_library set status = 'draft', updated_by = 'library-publish@bot'
--   where id = '915ff7d5-80ce-45ad-bb95-d75510318ee0' and status = 'approved'
--     and updated_by = 'Sam (relayed by SkyComet; written by library-skycartwheel@bot)';
-- Applied 2026-11-05 15:35:26Z via the Supabase MCP; read back: status approved, version 3.
