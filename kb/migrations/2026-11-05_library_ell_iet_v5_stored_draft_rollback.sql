-- Rollback for 2026-11-05_library_ell_iet_v5_stored_draft.sql (SkyFlipFlop): restore the record's before-values and drop
-- the stored Version 5 draft. Guarded on the forward write still being the live state (no Replace since).
update public.cpl_library
set regen = '{"publish": "show", "draft_id": "22d6f5de-3d3b-4cf9-896f-2f4a6fa4d676", "ready_at": "2026-11-05T18:30:45.887Z", "draft_url": null, "drafted_by": "Sam", "drafted_with": "library-revise-draft", "requested_at": "2026-11-05T18:30:18.271Z", "requested_by": "Sam"}'::jsonb,
    rebuild_from = $S$CPLBrain/04-projects/cpl-initiative/ell-iet/make_tabs.py 20261023_ELL_IET_CPL_Starting_Points_3.html -o 20261023_ELL_IET_CPL_Starting_Points_4.html (Version 4, from Version 3, the page S557 built; make_brief.py and ../agency-visual/build.py made Versions 1 and 2 beside it); the public page: python3 scripts/library_page.py ell-iet-cpl-starting-points <the built HTML> (cpl-project-tracker)$S$,
    versions = (select coalesce(jsonb_agg(v), '[]'::jsonb) from jsonb_array_elements(versions) v where v->>'label' <> 'Version 5'),
    updated_by = 'Sam'
where slug = 'ell-iet-cpl-starting-points' and updated_by = 'library-skyflipflop@bot' and regen->>'drafted_by' = 'SkyFlipFlop (session)';
delete from public.cpl_library_drafts
where slug = 'ell-iet-cpl-starting-points' and made_by = 'SkyFlipFlop (session), stored by library-skyflipflop@bot' and published_at is null;
