-- Rollback of 2026-11-05_library_ell_iet_v3_stored_draft.sql (SkyCartwheel): restore regen to its before-values and drop
-- the stored draft, guarded on this cohort's stamp so a later request or publish stays untouched.
with gone as (
  delete from public.cpl_library_drafts
  where slug = 'ell-iet-cpl-starting-points' and made_by = 'S557 SkySculptor (session), stored by library-skycartwheel@bot'
    and published_at is null
  returning id
)
update public.cpl_library
set regen = '{"publish":"show","ready_at":"2026-11-03T06:21:50Z","draft_url":"https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3","requested_at":"2026-11-02T21:20:29.029Z","requested_by":"Sam"}'::jsonb,
    updated_by = 'library-s557@bot'
where slug = 'ell-iet-cpl-starting-points' and updated_by = 'library-skycartwheel@bot'
  and regen->>'draft_id' in (select id::text from gone);
