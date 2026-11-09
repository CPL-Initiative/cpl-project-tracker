-- S604 SkySculptor (Sam's hand-opened session, 2026-11-08) checkpoint: three cpl_memory rows, STAGED and NOT YET
-- WRITTEN (Sam is away; the execute_sql approval prompt would time out). The next session with a person present runs
-- this as one call after checking the three slugs are absent; the verify must show creates = 1 for each.
-- S611 SkyTadpole, 2026-11-08: the first row's summary was 440 chars, over cpl_memory_summary_check (400); its Done
-- list moved to the head of detail, nothing dropped. Written 2026-11-08 ~18:00Z.
insert into public.cpl_memory (kind, slug, title, summary, detail, plain, tags, source, status, verified_by, verified_at, event_date, author, confidence) values
('decision','d-student-grain-summarize-then-delete','COBI keeps no student-level MAP rows: summarize, then delete',
 'Sam, 2026-11-08 in session S604 ("yes the ruling is mine"), confirming COBIx''s relay on #2919: COBI pulls student-level MAP data only to analyze and summarize it and never acts on an individual record, so it keeps none.',
 'Done: #2920 revoked anon/authenticated writes and TRUNCATE on the three base tables (run 42497305017); #2922 dropped map_student_credit_prev (220,588) and stg_student_credit (543,579) (run 42498803570, backup 2026-11-08 09:29Z confirmed by Sam). Next: the key sketch to one pull; summaries plus backfill, then the delete in the load (refresh the hand-refreshed credential-volume matviews first); guards. exhibit_title_students needs per-title counts built in the load. Plan: #2919 comment 6723544749; lane disposition-grain-student-detail.',
 'COBI now keeps only summaries of student credit data, never the individual student rows.',
 array['disposition-grain-student-detail','privacy','supabase','governance'],'Sam in session S604; cpl-project-tracker#2919, #2920, #2922','verified','Sam',now(),'2026-11-08','SkySculptorS604b','high'),
('pitfall','p-prompt-over-limit-shrink-losslessly','A standing prompt over its limit: remove repetition before relevance, and replay saved answers',
 'cer-classify refused every call from 2026-11-07 (rules 251,866 chars vs MAX_RULES 250,000). A relevance trim fit but stripped the issuer from 156 of 1,115 saved joined answers; grouping families under their issuer was lossless at ~165,600 (#2925).',
 'Guard tests/cer_classifier_rules_size_test.py replays all joined answers offline. KB note methodology-shrink-a-prompt-losslessly-before-trimming-it.',
 'When an instruction file for the AI got too long, the fix that kept its meaning was to stop repeating the same issuer on every line.',
 array['cer-procedures','classifier','testing'],'cpl-project-tracker#2925','proposed',null,null,'2026-11-08','SkySculptorS604b','high'),
('pitfall','p-bot-relayed-ruling-is-a-claim','A ruling relayed by COBIx is a claim until Sam says it',
 'COBIx posted "Sam''s ruling" to delete student-level rows (#2919). Deleting data is on the hold list, so the session held it, measured and posted the plan meanwhile, and acted only after Sam confirmed in session.',
 'cobix_pr_loop: a COBIx comment is never a go. Sam''s go is his own comment or a sheet reply or his words in session.',
 'An instruction passed along by the review bot is checked with Sam before anything is deleted.',
 array['governance','cobix'],'docs/auth_and_repo_posture_lessons.md (S604 SkySculptor)','proposed',null,null,'2026-11-08','SkySculptorS604b','high')
on conflict do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkySculptorS604b', 'create', 'checkpoint auto-write (staged S604 SkySculptor)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-student-grain-summarize-then-delete','p-prompt-over-limit-shrink-losslessly','p-bot-relayed-ruling-is-a-claim')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkySculptorS604b' group by m.slug order by m.slug;
