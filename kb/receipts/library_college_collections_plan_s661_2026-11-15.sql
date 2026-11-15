-- S661 SkyKnot: the College Collections Plan's Library record (Sam, in session: "Make a Visual for the Moonshot plan
-- and add it to the Library and call it 'College Collections Plan'"). INSERT-only under cohort
-- library-ccplan-s661@bot (Rule 10). Not publicly listed: listing a piece publicly is the program lead's call.
-- ROLLBACK: delete from cpl_library where slug='college-collections-plan' and added_by='library-ccplan-s661@bot';
insert into cpl_library (slug,title,kind,occasion,made_on,summary,file_type,status,seen_by,home,url,made_by,rebuild_from,added_by,project,sources) values
('college-collections-plan','College Collections Plan','visual',
 'The plan behind the College Collections ETA; the full clock opens it in a new tab',
 date '2026-11-15',
 'The CPL Commons strategic plan (the v2 agreed final on #3111, November 11, 2026) on one page: the sentence, the four parts, the top line, the three phases of the college collections, the ASE first slice and its order, the Phase 1 exit gate, the scorecard and what we build.',
 'html','draft','team','web',
 'https://cpl-initiative.github.io/cpl-project-tracker/library/college-collections-plan/',
 'Claude, in session with the MAP team',
 'CPLBrain/04-projects/cpl-initiative/college-collections-plan/college-collections-plan.html: python3 scripts/library_page.py college-collections-plan <that file>, then public-header/apply.py --tracker-logos ../../sierra/ on the copy.',
 'library-ccplan-s661@bot','CPL Commons',
 '[{"title":"v2 agreed final, #3111","url":"https://github.com/CPL-Initiative/cpl-project-tracker/issues/3111#issuecomment-6808952144"},{"title":"ETA clock brief, #3360","url":"https://github.com/CPL-Initiative/cpl-project-tracker/issues/3360"}]'::jsonb)
on conflict (slug) do nothing;
