-- Rollback for 2026-11-03_library_ell_iet_v3_draft.sql: the row's before-values, read 2026-11-03 ~07:00Z.
update public.cpl_library
set regen = '{"publish": "show", "requested_at": "2026-11-02T21:20:29.029Z", "requested_by": "Sam"}'::jsonb,
    versions = '[{"url": "https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe", "date": "2026-10-23", "label": "Version 1", "status": "Replaced by v2"}, {"url": "https://claude.ai/artifact/Skw4HTtnQUPkQBUYYGFwtw", "date": "2026-10-26", "label": "Version 2", "status": "Current"}]'::jsonb,
    updated_by = 'Sam'
where slug = 'ell-iet-cpl-starting-points' and updated_by = 'library-s557@bot';
