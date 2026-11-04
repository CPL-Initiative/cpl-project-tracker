-- 2026-11-03, Ashley's session (OpenClassrooms Medical Assistant crosswalk). CLAUDE.md (CPLBrain): a Claude
-- artifact made to share gets a Library record, without being asked (Sam, 2026-10-20).
-- Rule 10: INSERT-only, cohort added_by 'library-oc-ma@bot'; skips if the slug exists.
-- ROLLBACK: delete from public.cpl_library where slug = 'openclassrooms-medical-assistant-crosswalk'
--           and added_by = 'library-oc-ma@bot';
-- The workbook (20261103_OpenClassrooms_Medical_Assistant_CPL_Crosswalk.xlsx) goes to the SharePoint Drafts
-- folder by hand; file its link with the tab's File it.
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, status, seen_by, home, url,
  file_type, made_by, rebuild_from, versions, added_by, updated_by, for_kind, for_category, for_name, project)
select 'openclassrooms-medical-assistant-crosswalk', 'OpenClassrooms Medical Assistant CPL Crosswalk', 'document',
  'Partner crosswalk for OpenClassrooms (Ashley, 2026-11-03)', '2026-11-03', '1',
  'Where OpenClassrooms Medical Assistant Registered Apprenticeship (RAPIDS 1085CB) apprentices could earn CPL across the California Community Colleges: existing MAP approvals and potential course alignments, by region and college. Interactive page; an Excel workbook carries the same rows.',
  'draft', 'team', 'web', 'https://claude.ai/artifact/YEgNe1aZU7kdQb8RWig2G2', 'html',
  'Ashley''s session of 2026-11-03, from the OpenClassrooms Appendix A and degree-path syllabus, MAP, COCI and MIS Fall 2025',
  'cpl-project-tracker: python3 kb/_build_oc_medical_assistant_crosswalk.py; kb/_write_oc_medical_assistant_workbook.py; kb/_write_oc_medical_assistant_html.py',
  '[{"url":"https://claude.ai/artifact/YEgNe1aZU7kdQb8RWig2G2","date":"2026-11-03","label":"Version 1","status":"Current"}]'::jsonb,
  'library-oc-ma@bot', 'library-oc-ma@bot', 'other', 'Industry partner', 'OpenClassrooms', 'OpenClassrooms partner crosswalks'
where not exists (select 1 from public.cpl_library where slug = 'openclassrooms-medical-assistant-crosswalk')
returning slug, status;
