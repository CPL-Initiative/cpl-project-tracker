-- SkyFlipFlop (Library side session), 2026-11-05: the CPL Initiative overview's Library record.
-- Sam, in session: "build the standalone CPL Initiative overview and add the link to the ell visual and all other
-- visuals. This is a doc we'll want updated periodically", then "publish the overview". The page is
-- library/cpl-initiative-overview/ (this PR) and its own source: revise it on its card. Listed in the public library.
-- INSERT only, ON CONFLICT (slug) DO NOTHING, cohort added_by 'library-skyflipflop@bot'.
-- ROLLBACK: kb/migrations/2026-11-05_library_cpl_initiative_overview_rollback.sql
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, extent, file_type, status, seen_by,
  home, url, made_by, rebuild_from, versions, added_by, updated_by, public_listed, public_summary, public_topics,
  listed_at, listed_by, knowledge)
values ('cpl-initiative-overview', 'The CPL Initiative', 'visual', 'A standing overview, kept current', '2026-11-05', '1',
  'One page on the Chancellor''s Office Credit for Prior Learning Initiative: the statewide figures from the MAP dashboard (live on the public copy), how credit reaches a student, the Initiative in law (SB 135, Education Code Article 9), people, platform and policy, the work under way with the other projects, and where to go next. Every public Library page''s header links it.',
  'One page', 'html', 'approved', 'public', 'web',
  'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-initiative-overview/',
  'SkyFlipFlop (Library side session), 2026-11-05',
  'The page is its own source: revise it on its card. The public copy is library/cpl-initiative-overview/index.html (cpl-project-tracker); Draft 1 is CPLBrain/04-projects/cpl-initiative/initiative-overview/20261105_CPL_Initiative_Overview.html.',
  '[{"url": "https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-initiative-overview/", "date": "2026-11-05", "label": "Version 1", "status": "Current: in the public library''s look, published at Sam''s word (\"publish the overview\"). Checked: npm run a11y, light and dark."}]'::jsonb,
  'library-skyflipflop@bot', 'library-skyflipflop@bot', true,
  'The Chancellor''s Office Credit for Prior Learning Initiative in one page: statewide figures, how credit reaches a student, the Initiative in law, the work under way and where to go next.',
  array['CPL Initiative', 'overview', 'MAP platform', 'Vision 2030'], now(), 'Sam', false)
on conflict (slug) do nothing
returning id, slug;
