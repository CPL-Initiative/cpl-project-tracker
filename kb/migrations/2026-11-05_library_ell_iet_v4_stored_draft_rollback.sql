-- Rollback for 2026-11-05_library_ell_iet_v4_stored_draft.sql (SkyRoundoff): restore the record's before-values and drop
-- the stored Version 4 draft. Guarded on the forward write still being the live state (no Replace since).
update public.cpl_library
set regen = '{"publish": "show", "draft_id": "b1925d33-55e6-4de2-9499-ffae8b15aa31", "ready_at": "2026-11-05T15:44:08.080Z", "draft_url": null, "drafted_by": "Sam", "drafted_with": "library-revise-draft", "requested_at": "2026-11-05T15:42:20.042Z", "requested_by": "Sam"}'::jsonb,
    rebuild_from = $S$CPLBrain/04-projects/cpl-initiative/ell-iet/make_brief.py --tracker <cpl-project-tracker>, then CPLBrain/04-projects/cpl-initiative/agency-visual/build.py briefs/20261023_ELL_IET_CPL_Starting_Points_2.json -o 20261023_ELL_IET_CPL_Starting_Points_2.html (Version 2; Version 1's brief and page sit beside it); the public page: python3 scripts/library_page.py ell-iet-cpl-starting-points <the built HTML> (cpl-project-tracker)$S$,
    versions = (select coalesce(jsonb_agg(v), '[]'::jsonb) from jsonb_array_elements(versions) v where v->>'label' <> 'Version 4'),
    updated_by = 'Sam'
where slug = 'ell-iet-cpl-starting-points' and updated_by = 'library-skyroundoff@bot' and regen->>'drafted_by' = 'SkyRoundoff (session)';
delete from public.cpl_library_drafts
where slug = 'ell-iet-cpl-starting-points' and made_by = 'SkyRoundoff (session), stored by library-skyroundoff@bot' and published_at is null;
