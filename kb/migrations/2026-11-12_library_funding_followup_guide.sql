-- 2026-11-12, asked in session from the MAP account ("I think Malone is the one driving this session"): "create a step
-- by step guide with screenshots on how to use the funding-followup dashboard ... as simple as possible".
-- The guide is a Claude artifact, so it gets a Library record (CPLBrain CLAUDE.md, Sam, 2026-10-20). A draft for the team:
-- nothing public is listed. INSERT only; the cohort is added_by. Source and the capture script that redraws the
-- screenshots on sample data: CPLBrain/04-projects/cpl-initiative/funding-follow-up-guide/.
-- ROLLBACK: kb/migrations/2026-11-12_library_funding_followup_guide_rollback.sql
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, file_type, status, seen_by, home, url,
  made_by, rebuild_from, note, versions, added_by, updated_by, project)
values ('funding-follow-up-dashboard-guide', 'Funding Follow-up Dashboard Guide', 'visual',
  'A how-to for the MAP team and reviewers who work the Funding Follow-up Dashboard', '2026-11-12', '1',
  'Step by step, with screenshots on sample data: sign in, read the summary, and what to do for each stage a college can be in, with the funding rule that applies at each step.',
  'html', 'draft', 'team', 'web', 'https://claude.ai/artifact/XqJpfTdCWPhAkGFLA3gsBq',
  'Claude, in session with the MAP team',
  'CPLBrain/04-projects/cpl-initiative/funding-follow-up-guide/: node capture.js redraws the screenshots from the live code on sample data; the .html is the page.',
  'Screenshots use invented colleges and people. Redraw them after the dashboard changes.',
  '[{"url":"https://claude.ai/artifact/XqJpfTdCWPhAkGFLA3gsBq","date":"2026-11-12","label":"1","status":"Current"}]'::jsonb,
  'library-fundguide-2026-11-12@bot', 'library-fundguide-2026-11-12@bot', 'CPL Funding')
on conflict (slug) do nothing;
