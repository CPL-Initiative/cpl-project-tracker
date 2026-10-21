-- Bakersfield side session (session_01T5QwZ9pwxbHeZGwpabCDe8), 2026-10-21, beside S442.
-- Ashley asked for Bakersfield College's CPL opportunity analysis, built like American River's (2026-10-20).
-- Sam, in chat: "make sure the visuals produced for Ashley are integrated on the CPL Pathways tab? Also want
-- them all ported to the Library, where I will make them public so Ashley and Crystal can give links to their
-- college workgroup meeting today."
-- Four Library records: each college's visual (home web, the COBI page) and each workbook (not filed until
-- the .xlsx reaches SharePoint CPLLibrary; File it adds the link). Listing publicly stays Sam's switch.
-- INSERT-only, idempotent on slug, cohort library-cpl-opportunity@bot.
-- Rollback: delete from cpl_library where added_by = 'library-cpl-opportunity@bot';
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, extent, file_type,
  status, seen_by, home, url, file_name, made_by, rebuild_from, note, versions, added_by)
values
 ('cpl-opportunity-american-river-visual', 'American River College: CPL Opportunity Analysis', 'document',
  'CPL college workgroup meeting, 2026-10-21', '2026-10-20', '2',
  'American River College''s COCI programs and courses, its MAP exhibits (AP and IB excluded), and the statewide credit recommendations it could adopt, each with a Could Adopt link to MAP.',
  'One page', 'html', 'draft', 'colleges', 'web',
  'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=American%20River%20College',
  null, 'SkyARC with Ashley (MAP team), 2026-10-20',
  'cpl-project-tracker/college_cpl_workbook.js and cpl-opportunity/index.html (built in the browser from published data)',
  'Live page: it rebuilds from the current data on each visit. Version 1 was a Claude artifact from the first, offline run.',
  '[{"url":"https://claude.ai/artifact/8jafA2Vu1dkFLDgrSFDXvG","date":"2026-10-20","label":"Version 1 (offline run)","status":"Superseded"},{"url":"https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=American%20River%20College","date":"2026-10-20","label":"Version 2 (COBI page)","status":"Current"}]'::jsonb,
  'library-cpl-opportunity@bot'),
 ('cpl-opportunity-bakersfield-visual', 'Bakersfield College: CPL Opportunity Analysis', 'document',
  'CPL college workgroup meeting, 2026-10-21', '2026-10-21', '1',
  'Bakersfield College''s COCI programs and courses, its MAP exhibits (AP and IB excluded), and the statewide credit recommendations it could adopt, each with a Could Adopt link to MAP.',
  'One page', 'html', 'draft', 'colleges', 'web',
  'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Bakersfield%20College',
  null, 'Bakersfield side session with Ashley (MAP team), 2026-10-21',
  'cpl-project-tracker/college_cpl_workbook.js and cpl-opportunity/index.html (built in the browser from published data)',
  'Live page: it rebuilds from the current data on each visit. The workbook adds 46 articulations from MAP''s public landing page that MAP''s articulation export lacks; the page does not show them.',
  '[{"url":"https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Bakersfield%20College","date":"2026-10-21","label":"Version 1","status":"Current"}]'::jsonb,
  'library-cpl-opportunity@bot'),
 ('cpl-opportunity-american-river-workbook', 'American River College: CPL Opportunity Analysis (workbook)', 'spreadsheet',
  'CPL college workgroup meeting, 2026-10-21', '2026-10-20', '2',
  'The five-tab Excel analysis behind the American River visual: programs, courses, existing MAP exhibits, CPL expansion opportunities and statewide CR opportunities, plus About & Sources.',
  'Six tabs', 'xlsx', 'draft', 'colleges', 'not_filed', null,
  '20261020_American_River_College_CPL_Opportunity_Analysis_2.xlsx', 'SkyARC with Ashley (MAP team), 2026-10-20',
  'Download CPL Extract on the American River page (cpl-project-tracker/college_cpl_workbook.js); version 1: CPLBrain/04-projects/cpl-initiative/american-river-cpl-analysis/build_arc_cpl_analysis.py',
  'File it once the .xlsx is in SharePoint CPLLibrary.', '[]'::jsonb, 'library-cpl-opportunity@bot'),
 ('cpl-opportunity-bakersfield-workbook', 'Bakersfield College: CPL Opportunity Analysis (workbook)', 'spreadsheet',
  'CPL college workgroup meeting, 2026-10-21', '2026-10-21', '1',
  'The five-tab Excel analysis for Bakersfield College, built like American River''s, with MAP''s public landing-page articulations added to the existing-exhibits tab.',
  'Six tabs', 'xlsx', 'draft', 'colleges', 'not_filed', null,
  '20261021_Bakersfield_College_CPL_Opportunity_Analysis.xlsx', 'Bakersfield side session with Ashley (MAP team), 2026-10-21',
  'CPLBrain/04-projects/cpl-initiative/bakersfield-cpl-analysis/build_bakersfield_cpl_analysis.js',
  'File it once the .xlsx is in SharePoint CPLLibrary.', '[]'::jsonb, 'library-cpl-opportunity@bot')
on conflict (slug) do nothing;
