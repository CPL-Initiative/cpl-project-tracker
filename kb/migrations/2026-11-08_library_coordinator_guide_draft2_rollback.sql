-- Rollback for 2026-11-08_library_coordinator_guide_draft2.sql (S605 SkySextans): restore the record's before-values.
update public.cpl_library set version = 'Draft 1',
  refresh_note = 'can you add the Request Adopt buttons to any courses or exhibits possible? These are the links to the MAP dash exhibit card that matches the course or exhibit on the visual, so the user can click quickly to the correct MAP Request Quick Adopt button.',
  regen = '{"publish":"show","requested_at":"2026-11-05T12:36:52.714Z","requested_by":"Sam"}'::jsonb,
  versions = '[{"url":"https://drive.google.com/drive/folders/1a9-zbN9oc0G8I2GdV3y6VGOUDZA4X8Dn","date":"2026-10-21","label":"Chaffey draft","status":"Superseded"},{"url":"https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1","date":"2026-10-25","label":"Draft 1","status":"Current"}]'::jsonb,
  updated_by = 'Sam', updated_at = '2026-11-05 12:36:53.20323+00'
where slug = 'cpl-coordinator-getting-started-guide' and updated_by = 'library-s605@bot' and version = 'Draft 2';
