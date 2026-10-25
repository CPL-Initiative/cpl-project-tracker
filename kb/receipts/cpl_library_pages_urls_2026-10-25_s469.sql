-- S469 SkyLemonadeBerry, 2026-10-25: Sam's pick, ~02:00Z, "GitHub Pages now" (cpl_memory
-- sam-public-pieces-on-github-pages-2026-10-25), answering his ask of ~23:25Z 2026-10-24: "the url that shows for the
-- public library visuals has a claude url. Any way we can use an alias for all public surfaces--with cplinitiative?"
-- The two public pieces made as Claude artifacts now have copies on the tracker's GitHub Pages, written by
-- scripts/library_page.py (library/<slug>/index.html), and their records link there. The claude.ai pages stay the
-- editable originals and stay named in each record's versions (Version 1); only url, rebuild_from and updated_by change.
-- APPLY ONLY ONCE BOTH PAGES ANSWER 200 on GitHub Pages, so no visitor follows a link to a 404.
-- Rule 10: two guarded UPDATEs from the before-values read live at ~02:40Z 2026-10-25:
--   ell-iet-cpl-starting-points  url https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe, updated_by Sam,
--     updated_at 2026-10-24 13:44:18.334105+00, rebuild_from "CPLBrain/04-projects/cpl-initiative/ell-iet/make_brief.py,
--     then CPLBrain/04-projects/cpl-initiative/agency-visual/build.py on briefs/20261023_ELL_IET_CPL_Starting_Points.json"
--   dsp-credit-starting-points   url https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE, updated_by library-made-for-s459@bot,
--     updated_at 2026-10-23 22:14:22.319777+00, rebuild_from
--     "CPLBrain/04-projects/cpl-initiative/dsp-training/20261020_DSP_Credit_Starting_Points.html"
-- rows_updated = 0 for a slug means someone edited that row since: re-read and retry.
-- ROLLBACK (cpl_library_history_trg files the prior row either way):
--   update public.cpl_library set url = 'https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe', updated_by = 'Sam',
--     rebuild_from = 'CPLBrain/04-projects/cpl-initiative/ell-iet/make_brief.py, then CPLBrain/04-projects/cpl-initiative/agency-visual/build.py on briefs/20261023_ELL_IET_CPL_Starting_Points.json'
--     where slug = 'ell-iet-cpl-starting-points';
--   update public.cpl_library set url = 'https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE', updated_by = 'library-made-for-s459@bot',
--     rebuild_from = 'CPLBrain/04-projects/cpl-initiative/dsp-training/20261020_DSP_Credit_Starting_Points.html'
--     where slug = 'dsp-credit-starting-points';
-- A good result is two rows, each url at https://cpl-initiative.github.io/cpl-project-tracker/library/<slug>/.
update public.cpl_library l
set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/ell-iet-cpl-starting-points/',
    rebuild_from = l.rebuild_from || '; the public page: python3 scripts/library_page.py ell-iet-cpl-starting-points <the built HTML> (cpl-project-tracker)',
    updated_by = 'library-pages-s469@bot'
where l.slug = 'ell-iet-cpl-starting-points'
  and l.url = 'https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe'
  and l.updated_at = '2026-10-24 13:44:18.334105+00'
returning l.slug, l.url, l.public_listed;
update public.cpl_library l
set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/dsp-credit-starting-points/',
    rebuild_from = l.rebuild_from || '; the public page: python3 scripts/library_page.py dsp-credit-starting-points <that file> (cpl-project-tracker)',
    updated_by = 'library-pages-s469@bot'
where l.slug = 'dsp-credit-starting-points'
  and l.url = 'https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE'
  and l.updated_at = '2026-10-23 22:14:22.319777+00'
returning l.slug, l.url, l.public_listed;
