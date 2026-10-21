-- Bakersfield side session (session_01T5QwZ9pwxbHeZGwpabCDe8), 2026-10-21, beside S442.
-- Ashley: "Please do the exact same thing for Norco College and provide the excel sheet."
-- Two Library records, as for Bakersfield (cpl_library_cpl_opportunity_2026-10-21.sql): the visual
-- (home web) and the workbook (not filed until the .xlsx reaches SharePoint CPLLibrary).
-- INSERT-only, idempotent on slug, cohort library-cpl-opportunity@bot.
-- Rollback: delete from cpl_library where added_by = 'library-cpl-opportunity@bot' and slug like 'cpl-opportunity-norco-%';
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, extent, file_type,
  status, seen_by, home, url, file_name, made_by, rebuild_from, note, versions, added_by)
values
 ('cpl-opportunity-norco-visual', 'Norco College: CPL Opportunity Analysis', 'document',
  'CPL college workgroup meeting, 2026-10-21', '2026-10-21', '1',
  'Norco College''s COCI programs and courses, its MAP exhibits (AP and IB excluded), and the statewide credit recommendations it could adopt, each with a Could Adopt link to MAP.',
  'One page', 'html', 'draft', 'colleges', 'web',
  'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Norco%20College',
  null, 'Bakersfield side session with Ashley (MAP team), 2026-10-21',
  'cpl-project-tracker/college_cpl_workbook.js and cpl-opportunity/index.html (built in the browser from published data)',
  'Live page: it rebuilds from the current data on each visit.',
  '[{"url":"https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Norco%20College","date":"2026-10-21","label":"Version 1","status":"Current"}]'::jsonb,
  'library-cpl-opportunity@bot'),
 ('cpl-opportunity-norco-workbook', 'Norco College: CPL Opportunity Analysis (workbook)', 'spreadsheet',
  'CPL college workgroup meeting, 2026-10-21', '2026-10-21', '1',
  'The five-tab Excel analysis for Norco College, built like American River''s, Bakersfield''s, Cerritos''s, Foothill''s and Moreno Valley''s.',
  'Six tabs', 'xlsx', 'draft', 'colleges', 'not_filed', null,
  '20261021_Norco_College_CPL_Opportunity_Analysis.xlsx', 'Bakersfield side session with Ashley (MAP team), 2026-10-21',
  'CPLBrain/04-projects/cpl-initiative/norco-cpl-analysis/build_norco_cpl_analysis.js',
  'File it once the .xlsx is in SharePoint CPLLibrary.', '[]'::jsonb, 'library-cpl-opportunity@bot')
on conflict (slug) do nothing;
