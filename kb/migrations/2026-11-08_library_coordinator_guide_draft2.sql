-- S605 SkySextans (CPL Queue routine, 2026-11-08): the Coordinator Guide's Revise request (Sam, 2026-11-05 12:36Z,
-- "can you add the Request Adopt buttons to any courses or exhibits possible?") is done: Draft 2 republished at the
-- same artifact (version 1794125894-480b). This marks the request done: Draft 2 added to versions, Draft 1 Superseded,
-- refresh_note emptied, regen set to null. Rule 10 a2: the before-values are below, and the rollback restores them.
-- Applied by supabase-migrate.yml (an unattended firing's execute_sql write waits on an approval prompt).
-- ROLLBACK: kb/migrations/2026-11-08_library_coordinator_guide_draft2_rollback.sql

-- BEFORE (read 2026-11-08 ~08:40Z):
--   version      = 'Draft 1'
--   refresh_note = 'can you add the Request Adopt buttons to any courses or exhibits possible? These are the links to the MAP dash exhibit card that matches the course or exhibit on the visual, so the user can click quickly to the correct MAP Request Quick Adopt button.'
--   regen        = {"publish":"show","requested_at":"2026-11-05T12:36:52.714Z","requested_by":"Sam"}
--   versions     = [{"url":"https://drive.google.com/drive/folders/1a9-zbN9oc0G8I2GdV3y6VGOUDZA4X8Dn","date":"2026-10-21","label":"Chaffey draft","status":"Superseded"},{"url":"https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1","date":"2026-10-25","label":"Draft 1","status":"Current"}]
--   updated_by   = 'Sam', updated_at = '2026-11-05 12:36:53.20323+00'

update public.cpl_library set
  version = 'Draft 2',
  refresh_note = null,
  regen = null,
  versions = '[{"url":"https://drive.google.com/drive/folders/1a9-zbN9oc0G8I2GdV3y6VGOUDZA4X8Dn","date":"2026-10-21","label":"Chaffey draft","status":"Superseded"},{"url":"https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1","date":"2026-10-25","label":"Draft 1","status":"Superseded"},{"url":"https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1","date":"2026-11-08","label":"Draft 2","status":"Current","note":"Request Quick Adopt links for Basic Military Training and the seven statewide credit recommendations the most colleges have adopted (MAP exhibit cards, ?Exhibit=<id>&View=Military|Non-Military; IDs verified against MAP''s API), and the Credential Catalog in Resources. Remediated: links in table cells 24px tall; axe at 390 and 1440px, light and dark, no findings beyond the fragment''s lang, which the artifact wrapper sets."}]'::jsonb,
  updated_by = 'library-s605@bot',
  updated_at = now()
where slug = 'cpl-coordinator-getting-started-guide'
  and regen->>'requested_at' = '2026-11-05T12:36:52.714Z';

