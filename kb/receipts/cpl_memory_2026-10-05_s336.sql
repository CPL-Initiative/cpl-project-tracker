-- S336 (SkyCourier), checkpoint 2026-10-05: sheet 42 carried out, the first two program maps, a signed-off session lets go.
-- Rollback: supersede each row by slug under actor 'SkyCourier-s336-rollback'.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-sheet42-rulings-2026-10-05', 'Sam, sheet 42: outcomes go, display build go, drafts on My College now', 'decision',
 'Sam, open-asks sheet 42 (2026-10-05 20:58-20:59Z, each his own call): card 1 go (outcomes on the 20 live program records), card 2 go (cpl-chat deploy, then display build 1cb75672ba6c with Miramar''s two drafts), card 3 "Show them now" (My College lists each college''s drafts now, marked for review), over the proposed "once sent".',
 'All three carried out the same evening: S335 applied the outcomes receipt (20 of 20 after); cpl-chat deployed 21:21Z; S336 applied migration program_requirement_records_display_1cb75672ba6c_s336 after a fresh guard read (20 of 20 match); #1878 built the My College section. Sheet 44 carries the one open ask.',
 'Sam approved putting outcomes and the new drafts live, and asked that colleges see their drafts on My College now.',
 array['decision-sheet','program-requirements-harvest','my-college','roep-display'], array['program_requirement_records','college_briefing.js'],
 'Sam, open-asks sheet 42 replies store (2026-10-05)', 'SkyCourier-s336', '2026-10-05', 'verified', 'Sam', now()),
('sam-two-sessions-one-queue-2026-10-05', 'Sam: two sessions worked one queue; coordinate, and keep him out of the way of the automation', 'decision',
 'Sam, about 21:17Z on 2026-10-05, in S335: "Looks like we have 2 sessions working on same thing—sorry—thought I closed one and started next. Please coordinate—probably due to my new routine that started this morning. I need to stay out of the way of the automation". Fix: #1879.',
 'The fix (#1879): a session lets go of its wakes in the turn that gives its sign-off line, and every session agrees one writer at start. S335 signed off at 20:23Z still holding a PR subscription, a check-in and two sheet watches; Sam opened S336 by hand at 20:25Z (the routine did not start it). His Complete on sheet 42 woke both. Guarded receipts kept the duplicate write a no-op; the sessions settled one writer by message at 21:12Z. Rule: docs/reference/scheduled_sessions.md, "A signed-off session lets go"; KB note methodology-an-idle-session-still-holds-wakes; vault braindump 2026-10-05-2117.',
 'Sam should never have to close a session himself: a finished session lets go of everything that could wake it.',
 array['scheduled-sessions','governance-team-enablement','sessions'], array['docs/reference/scheduled_sessions.md','CLAUDE.md'],
 'Sam, in session S335, relayed verbatim by S335 to S336 (2026-10-05)', 'SkyCourier-s336', '2026-10-05', 'verified', 'Sam', now()),
('credential-watch-first-run-did-nothing-2026-10-05', 'The industry credential watch routine''s first run had no repository and no issuer sites, so it did nothing', 'pitfall',
 'Routine trig_019tTcardPfntFz6ctWU9Jg1 fired 2026-10-05 12:51Z and ended in 2.5 minutes with no branch: no repository attached and no add_repo (no CPLBrain, no push), and the issuer sites answered the proxy''s 403. No skills were harvested; kb/reference/industry_credential_skills.json does not exist.',
 'The fix is two settings only Sam can change: the routine''s repositories and the environment''s allowed domains (open-asks sheet 44 card 1, with the host list). Alternative: a runner reads the issuer pages and a session writes the skills from the job log. The harvest''s outcomes comparison waits on the skills file.',
 'The weekly credential watch could not reach anything it needed; Sam has to give it repositories and website access.',
 array['credential-registry','partner-crosswalks','routines','program-requirements-harvest'], array['kb/reference/industry_credential_skills.json','docs/reference/credential_watch_agent.md'],
 'routine last_run + session cse_015d71sBqhSk5uwgQQoemZxt transcript, read by S336', 'SkyCourier-s336', '2026-10-05', 'proposed', null, null),
('ivc-smc-program-maps-read-2026-10-05', 'Irvine Valley and Santa Monica publish readable term-by-term maps; the first two sequence records are built', 'milestone',
 'Run 37372136739 read Irvine Valley''s All Program Maps and Santa Monica''s Program Maps; kb/_program_map_parse.py builds sequence records for Santa Monica Barbering A.S. 43767 (24 of 25 listed courses; every COSM course in year one carries CPL via the Barbering License exhibit) and Irvine Valley Art A.A. 10265 (core named, four list slots; ART 85 in Semester 3).',
 'Irvine Valley prints every map whole on seven pages (tab-separated tables per term); Santa Monica gives about 150 programs a pathway page. Repo only (#1876, kb/program_requirements_pilot/sequences/). Acceptance: two terms or more and no course in the program''s subjects off the state list; coverage reported, never gating. Next: harvest records for the two programs beyond Sam''s checked 20, then By term on CPL Pathways.',
 'Two colleges publish course-by-semester maps the harvest can read; Santa Monica''s barbering map shows a licensed barber''s first year as credit already held.',
 array['program-requirements-harvest','sequences','irvine-valley','santa-monica'], array['kb/_program_map_parse.py','cpl_pathways.js'],
 'PR #1876; docs/program_requirements_harvest_lessons.md S336', 'SkyCourier-s336', '2026-10-05', 'proposed', null, null),
('sierra-smoke-7c-cna-lvn-precedent-variance-2026-10-05', 'Sierra''s smoke 7c (the Chaffey NURVN 414 CNA-to-LVN precedent) passes and misses on the same deployed version', 'pitfall',
 'cpl-chat smoke run 37376149996 on main passed 7c at 21:29Z; run 37376468222 on a PR push three minutes later, same deployed function, missed it: Sierra said no college had articulated CNA credit against an LVN course. 92 other assertions passed.',
 'A wording assertion is a sample of one. Look at how the Chaffey precedent reaches Sierra''s context for the Orange County CNA question before treating 7c as stable.',
 'Sierra sometimes forgets that Chaffey already gives CNA holders credit toward LVN courses.',
 array['sierra','smoke','cpl-chat'], array['chatbox/supabase/functions/cpl-chat/index.ts'],
 'smoke runs 37376149996 and 37376468222', 'SkyCourier-s336', '2026-10-05', 'proposed', null, null)
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyCourier-s336', 'create', 'checkpoint auto-write (S336)', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyCourier-s336'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, m.status, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkyCourier-s336' group by m.slug, m.status order by m.slug;
