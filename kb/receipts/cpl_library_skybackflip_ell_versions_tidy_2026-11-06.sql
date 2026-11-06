-- SkyBackflip (Library side session), 2026-11-06 03:40:51Z: the Library handoff's open item 3, "Tidy the ELL IET record:
-- versions still marks Versions 3 and 4 Current." On ELL IET CPL Starting Points (915ff7d5-80ce-45ad-bb95-d75510318ee0),
-- the leading "Current: " of versions[2] (Version 3) became "Replaced by v4: " and of versions[3] (Version 4) became
-- "Replaced by v5: ", the form Versions 1 and 2 already use. The rest of each status, and Version 5, are unchanged.
-- Guarded on updated_at 2026-11-05 22:38:31.655907+00, the two labels, and both statuses starting "Current: ".
-- Before-values: both statuses started "Current: "; updated_by 'library-publish@bot'.
update cpl_library set versions = jsonb_set(jsonb_set(versions,
  '{2,status}', to_jsonb(regexp_replace(versions->2->>'status', '^Current: ', 'Replaced by v4: '))),
  '{3,status}', to_jsonb(regexp_replace(versions->3->>'status', '^Current: ', 'Replaced by v5: '))),
  updated_by = 'library-skybackflip@bot'
where slug='ell-iet-cpl-starting-points' and updated_at='2026-11-05 22:38:31.655907+00'
  and versions->2->>'label'='Version 3' and versions->3->>'label'='Version 4'
  and versions->2->>'status' like 'Current: %' and versions->3->>'status' like 'Current: %';
-- Result: one row, updated_at 2026-11-06 03:40:51.241937+00.
-- ROLLBACK:
-- update cpl_library set versions = jsonb_set(jsonb_set(versions,
--   '{2,status}', to_jsonb(regexp_replace(versions->2->>'status', '^Replaced by v4: ', 'Current: '))),
--   '{3,status}', to_jsonb(regexp_replace(versions->3->>'status', '^Replaced by v5: ', 'Current: '))),
--   updated_by = 'library-publish@bot'
-- where slug='ell-iet-cpl-starting-points' and updated_at='2026-11-06 03:40:51.241937+00';
