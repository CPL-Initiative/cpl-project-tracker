-- Library side session, 2026-11-09: ELL Healthcare Pathways CPL Starting Points filed on its record (Requested to Draft).
--
-- Sam, 2026-11-09, in session: "pasting the prompt it created here hoping you can do it and post it to the library."
-- The page: https://claude.ai/artifact/LsKburF2qd1zfunirfj77T, built from CPLBrain/04-projects/cpl-initiative/ell-healthcare-pathways/. This is the card's File it
-- (url, home, status draft, made_on) plus what the session knows about the piece, and the documents the request
-- should have carried: the summary Sam attached (the Library saved the record with no document) and the visual to adapt.
-- Guarded on the live row read 2026-11-09 22:15Z: status 'requested', url null.
-- Before-values (cpl_library c534881f-f19c-43c7-9add-d3fa06ba18a7): url null; home 'not_filed'; status 'requested';
--   made_on, made_by, summary, extent, file_name, file_type, version, rebuild_from, note, project, updated_by all null;
--   versions '[]'; sources '[]'. cpl_library_history files the prior row too.
-- ROLLBACK: update public.cpl_library set url=null, home='not_filed', status='requested', made_on=null, made_by=null,
--   summary=null, extent=null, file_name=null, file_type=null, version=null, rebuild_from=null, note=null, project=null,
--   updated_by=null, versions='[]'::jsonb, sources='[]'::jsonb
--   where slug='ell-healthcare-pathways-cpl-starting-points-mw9tepdk' and updated_by='library-hp-s623@bot';
update public.cpl_library set
  url = 'https://claude.ai/artifact/LsKburF2qd1zfunirfj77T', home = 'web', status = 'draft', made_on = '2026-11-09', version = '1',
  made_by = 'Library side session, 2026-11-09', updated_by = 'library-hp-s623@bot',
  project = 'ELL Healthcare Pathways CPL', extent = 'One page', file_type = 'html',
  file_name = '20261109_ELL_Healthcare_Pathways_CPL_Starting_Points.html',
  summary = $HP$A card per ELL Healthcare Pathways Round Three consortium (20 consortia, $60,229,029, July 2026 through June 2029), ordered by fit and shown by region: where a consortium's completers could turn healthcare training into community college credit, read from the MAP platform and COCI.$HP$,
  note = $HP$Adapted from ELL IET CPL Starting Points Version 5. Sources: the Rounds 2 and 3 summary Sam attached, the Chancellor's Office memo WED 26-42, MAP's adoption view (generated 2026-11-09), the COCI course list and program inventory, MAP's College Contacts (read 2026-11-09). Pathways are documented for 7 of the 20 consortia; the other cards read all eight priority occupations. Each consortium's project lead is not in the award memo, so the cards name the college side only.$HP$,
  rebuild_from = $HP$CPLBrain/04-projects/cpl-initiative/ell-healthcare-pathways/make_brief.py --tracker <cpl-project-tracker>; then ../agency-visual/build.py briefs/20261109_ELL_Healthcare_Pathways_CPL_Starting_Points.json -o 20261109_ELL_Healthcare_Pathways_CPL_Starting_Points.html; then make_tabs.py on that file; then ../public-header/apply.py$HP$,
  versions = $HP$[{"url": "https://claude.ai/artifact/LsKburF2qd1zfunirfj77T", "date": "2026-11-09", "label": "Version 1", "status": "Draft", "filed_at": "2026-11-09T22:30:00Z"}]$HP$::jsonb,
  sources = $HP$[{"title": "ELL HP Grant Rounds 2-3 Summary FINAL (the background Sam attached; the file is in the vault, CPLBrain/04-projects/cpl-initiative/ell-healthcare-pathways/)", "url": null, "text": null, "added_by": "Sam", "added_on": "2026-11-09"}, {"title": "ELL IET CPL Starting Points (the visual to adapt)", "url": "https://cpl-initiative.github.io/cpl-project-tracker/library/ell-iet-cpl-starting-points/", "text": null, "added_by": "Sam", "added_on": "2026-11-09"}, {"title": "Chancellor's Office memo WED 26-42, Round Three Notice of Intent to Award (May 19, 2026)", "url": "https://www.cccco.edu/-/media/CCCCO-Website/docs/memo/wed-26-42-ell-healthcare-pathways-round-three-intent-to-award-a11y.pdf", "text": null, "added_by": "library-hp-s623@bot", "added_on": "2026-11-09"}]$HP$::jsonb
where slug = 'ell-healthcare-pathways-cpl-starting-points-mw9tepdk' and status = 'requested' and url is null
returning slug, status, url, home, made_on, updated_at;
-- RESULT (run through the Supabase MCP tools, 2026-11-09 22:23:33Z): one row returned,
--   slug ell-healthcare-pathways-cpl-starting-points-mw9tepdk, status draft, home web, made_on 2026-11-09,
--   url https://claude.ai/artifact/LsKburF2qd1zfunirfj77T. This file is the receipt; it is not queued in kb/migrations/.apply.

-- SECOND UPDATE (2026-11-09 22:49:56Z, through the Supabase MCP tools, after Pages served the copy): the record's
-- link moved to the git address (Sam, in session: a git url rather than a claude.ai url).
-- Guarded on url = 'https://claude.ai/artifact/LsKburF2qd1zfunirfj77T' and status = 'draft'; one row returned.
-- Before-values: url and versions[0].url the claude.ai link above; versions[0].status 'Draft', filed_at
--   2026-11-09T22:30:00Z; rebuild_from without its last clause ("; the public page: ...").
-- ROLLBACK: set url and versions back to the values the first update wrote (above), and cut the last clause of rebuild_from.
update public.cpl_library set
  url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/ell-healthcare-pathways-cpl-starting-points/',
  home = 'web', updated_by = 'library-hp-s623@bot',
  versions = '[{"url": "https://cpl-initiative.github.io/cpl-project-tracker/library/ell-healthcare-pathways-cpl-starting-points/", "date": "2026-11-09", "label": "Version 1", "status": "Draft. The editable original is https://claude.ai/artifact/LsKburF2qd1zfunirfj77T", "filed_at": "2026-11-09T22:50:00Z"}]'::jsonb,
  rebuild_from = rebuild_from || '; the public page: python3 scripts/library_page.py ell-healthcare-pathways-cpl-starting-points <the built HTML> (cpl-project-tracker)'
where slug = 'ell-healthcare-pathways-cpl-starting-points-mw9tepdk' and url = 'https://claude.ai/artifact/LsKburF2qd1zfunirfj77T' and status = 'draft';
