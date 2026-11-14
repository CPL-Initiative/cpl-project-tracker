-- cpl_memory rows for SkyOriole (S649), the final refresh, 2026-11-14. Two statements, clearly separated.
-- Every summary at most 400 characters (the table's check), measured by script when this file was written:
--   statement 1 (RUN): 374, 246, 269; the longest is 374.
--   statement 2 (RUN 03:07Z 2026-11-14): 355, 348, 350, 297, 351, 315, 276; the longest is 355.
-- Each statement: INSERT ... ON CONFLICT (slug) DO NOTHING (a replay is harmless), then the cpl_memory_log append, then the verify.
-- ROLLBACK (by slug; never by author), for either statement's slugs:
--   delete from cpl_memory_log where memory_id in (select id from cpl_memory where slug in (<the slugs>));
--   delete from cpl_memory where slug in (<the slugs>);
-- No row is superseded.

-- ===========================================================================================================
-- STATEMENT 1 -- RUN by the S649 conductor: sam-sheet-195-answers-2026-11-14 at about 01:22Z 2026-11-14;
-- sam-three-colleges-rules-first-2026-11-13 and sam-noncredit-total-hours-2026-11-13 at about 02:58Z 2026-11-14.
-- Recorded here after the fact, in the words the conductor reported; the live rows are the record. Do not rerun
-- (ON CONFLICT makes a replay harmless).
-- ===========================================================================================================
insert into cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('sam-sheet-195-answers-2026-11-14','decision','Sam answered Open Asks Sheet 195: every card as recommended','Sam, Open Asks Sheet 195, Complete pressed 01:18Z 2026-11-14, his own calls, no notes: card 1 as proposed; card 2 "Take every recommendation" (Honors: M-IDs only; keep AJ 160, MUS 130 and REAL; MATH M1044 after the MAP team settles it); card 3 "Remove the row" (BUSI M10XW); card 4 "Fix both, remove the Water Treatment row"; card 5 "Close it, keep Sheet 82" (#3250 closed).',array['commons','cer-procedures','program-requirements-harvest','decision-sheet','decision'],'verified','Sam, Open Asks Sheet 195 (artifact replies store)','Sam Lee',now(),'SkyOriole (S649)',date '2026-11-14'),
('sam-three-colleges-rules-first-2026-11-13','decision','Sam: work the rules on Los Medanos, Monterey Peninsula and LA Valley first','Sam, 5:51 PM PT 2026-11-13, relayed by COBIx on #3111 (comment 6869724112), verbatim: "Ok, we could take those 3 and work the rules on them as a priority." The three: Los Medanos, Monterey Peninsula, Los Angeles Valley. The harvest lane''s NEXT 1.',array['program-requirements-harvest','decision'],'verified','Sam, relayed by COBIx on #3111 (comment 6869724112)','Sam Lee',now(),'SkyOriole (S649)',date '2026-11-13'),
('sam-noncredit-total-hours-2026-11-13','decision','Sam: the checker reads Total Hours for noncredit wherever the page prints it','Sam, 5:54 PM PT 2026-11-13, relayed by COBIx on #3111 (comment 6869751713), verbatim: "Yes, let the checker read Total Hours for noncredit wherever the page prints it." One of the three passing-function changes that go out as one dry run, one migration and one rescore.',array['program-requirements-harvest','noncredit','decision'],'verified','Sam, relayed by COBIx on #3111 (comment 6869751713)','Sam Lee',now(),'SkyOriole (S649)',date '2026-11-13')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyOriole (S649)', 'create', 'S649 conductor, Sam''s words (recorded in the final-refresh receipt)', to_jsonb(m)
from public.cpl_memory m where m.slug in
  ('sam-sheet-195-answers-2026-11-14','sam-three-colleges-rules-first-2026-11-13','sam-noncredit-total-hours-2026-11-13')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, length(m.summary) as summary_chars, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug in
  ('sam-sheet-195-answers-2026-11-14','sam-three-colleges-rules-first-2026-11-13','sam-noncredit-total-hours-2026-11-13')
group by m.slug, m.summary order by m.slug;

-- ===========================================================================================================
-- STATEMENT 2 -- RUN 03:07Z 2026-11-14 by the S649 conductor (7 inserted, 7 logged, longest 355; tag re-clustering as the table spells it; the log append stored slug and summary). The conductor's decisions and one pitfall since the checkpoint (status proposed,
-- for Sam to revise on the next sheet's card 1). Run through the Supabase MCP, then mark this header RUN with the time.
-- ===========================================================================================================
insert into cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-busi-split-delete-applied-s649','decision','The BUSI M1228 split applied as one guarded delete of the bot row','The S649 conductor, on Sam''s Sheet 195 card 3: #3274 (a7af46ee) deleted the bot row BUSI M10XW merge_into BUSI M1228 (automerge-titlelane-v1@bot) through supabase-migrate.yml run 43542044321; the receipt holds the row whole and the rollback re-inserts it. Live reads before and after matched (0 rows after). Daily run bb25d373: BUSI M1228 lost one member.',array['commons','reclustering','decision'],'proposed','S649 final refresh; docs/session_650_handoff.md and the lane files',null,null,'SkyOriole (S649)',date '2026-11-14'),
('d-cvma-three-rows-applied-s649','decision','The three CVMA rows applied in one guarded migration; credentials.json copies inside card 4','The S649 conductor, on Sam''s Sheet 195 card 4: #3275 (b27d7aab) ran kb/migrations/2026-11-14_s649_cvma_three_rows.sql (run 43542969094): two value-only UPDATEs, one DELETE, before-values in the receipt, rollback restores all three. The three kb/credentials.json copies edited in the same PR were taken as inside card 4, since the nightly only adds.',array['cer-procedures','issuers','decision'],'proposed','S649 final refresh; docs/session_650_handoff.md and the lane files',null,null,'SkyOriole (S649)',date '2026-11-14'),
('d-honors-mids-stopped-for-design-s649','decision','Honors M-IDs stopped for design; nothing written','The S649 conductor, on Sam''s Sheet 195 card 2: the Honors step writes nothing yet. HUMA M10ME and LIBR M10CJ are automerge-v1@bot rows whose delete his answer did not cover (a card on the next sheet); IDST M1120 needs a true mint; numbering, equivalence direction, the honors_of field, the 508 pairs and the MATH M1044 contact are open design points.',array['commons','reclustering','honors','decision'],'proposed','S649 final refresh; docs/session_650_handoff.md and the lane files',null,null,'SkyOriole (S649)',date '2026-11-14'),
('d-rccd-objectives-loaded-s649','decision','Riverside district course objectives loaded: 2,536 rows','The S649 conductor, #3265: load run 43546799435 (02:38Z 2026-11-14) inserted 2,536 objective rows (Moreno Valley 640, Norco 754, Riverside City 1,142), kept 0, no SLO row touched; receipt kb/receipts/course_outcomes_rccd_43546799435.json. Live reads before (0) and after matched. Next host: sdccd.',array['program-requirements-harvest','course-outcomes','decision'],'proposed','S649 final refresh; docs/session_650_handoff.md and the lane files',null,null,'SkyOriole (S649)',date '2026-11-14'),
('d-specialist-pilot-counterproposal-s649','decision','Specialists per district: a pilot, RCCD then LACCD then Citrus','The S649 conductor on #3237 (comment 6870604909): pilot accepted, RCCD first, LACCD, then Citrus, after three real district profiles; claims enforced by CI from a committed file; reconcile config split per college and one owner of generated files before any parallel run; the pilot measures session tokens per newly passing program before a 14-day go.',array['program-requirements-harvest','conductor','decision'],'proposed','S649 final refresh; docs/session_650_handoff.md and the lane files',null,null,'SkyOriole (S649)',date '2026-11-14'),
('d-one-rescore-for-three-rules-s649','decision','One dry run, one migration, one rescore for three passing-function changes','The S649 conductor on #3111 and #3229: noncredit Total Hours, the own-list rule and COBIx''s GE-pattern completion-certificate rule (89 programs, 47 colleges; accepted with three amendments) change the passing function together: one dry run by college, posted on #3111 before any rescore, one migration, one rescore.',array['program-requirements-harvest','decision'],'proposed','S649 final refresh; docs/session_650_handoff.md and the lane files',null,null,'SkyOriole (S649)',date '2026-11-14'),
('p-back-to-back-merges-stale-status-s649','pitfall','Back-to-back merges leave a generated status file stale','S649: merging two PRs back to back left kb/status/commons_data.json stale on main twice (after #3262, and on #3265 once new read files landed). A PR that adds a builder''s inputs rebuilds its output, and the second of two merges re-runs its test on the new main before merging.',array['commons','ci','pitfall'],'proposed','S649 final refresh; docs/session_650_handoff.md and the lane files',null,null,'SkyOriole (S649)',date '2026-11-14')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyOriole (S649)', 'create', 'S649 final refresh (2026-11-14)', to_jsonb(m)
from public.cpl_memory m where m.slug in
  ('d-busi-split-delete-applied-s649','d-cvma-three-rows-applied-s649','d-honors-mids-stopped-for-design-s649','d-rccd-objectives-loaded-s649','d-specialist-pilot-counterproposal-s649','d-one-rescore-for-three-rules-s649','p-back-to-back-merges-stale-status-s649')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, length(m.summary) as summary_chars, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug in
  ('d-busi-split-delete-applied-s649','d-cvma-three-rows-applied-s649','d-honors-mids-stopped-for-design-s649','d-rccd-objectives-loaded-s649','d-specialist-pilot-counterproposal-s649','d-one-rescore-for-three-rules-s649','p-back-to-back-merges-stale-status-s649')
group by m.slug, m.summary order by m.slug;
