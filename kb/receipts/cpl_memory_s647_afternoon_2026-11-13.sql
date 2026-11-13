-- NOT YET RUN: this session's Supabase connector was down from about 12:40Z, so no row below exists in the table yet. Run it whole, after cpl_memory_s647_sheet_shape_2026-11-13.sql.
-- cpl_memory rows for SkyPipit (S647), the afternoon (14:30Z to 16:20Z 2026-11-13), the second Rule 9 checkpoint's step 10, prepared by the documents worker.
-- INSERT ... ON CONFLICT (slug) DO NOTHING, then the cpl_memory_log append, then the verify (one call, three statements).
-- Six rows: four conductor decisions (proposed, for Sam to revise on Open Asks Sheet 192 cards 1 to 4) and two of Sam's
-- words in session (verified, his words verbatim). Every summary at most 400 characters.
-- ROLLBACK (by slug; the author also owns the morning's rows, so never delete by author):
-- delete from cpl_memory_log where memory_id in (select id from cpl_memory where slug in
--   ('d-commons-data-coming-next-s647','d-live-counts-controls-s647','d-student-boundary-wording-s647',
--    'd-exhibits-course-title-gate-s647','sam-live-counts-environment-2026-11-13','sam-complete-data-dash-2026-11-13'));
-- delete from cpl_memory where slug in (same list);
insert into cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-commons-data-coming-next-s647','decision','The Commons data dashboard lists features with no source under Coming next','The S647 conductor, #3236 (1b630eeb): a feature with no source yet is listed under one Coming next section, naming the source each waits on (the College view, internal with no share link; AI workers; the JST funnel; SIS tiles; per-college PPM; descriptions; MIS and COE; planned datasets). No empty panel ships. Said to Sam in session; he did not object.',array['commons','decision'],'proposed','S647, PR 3236',null,null,'SkyPipit (S647)',date '2026-11-13'),
('d-live-counts-controls-s647','decision','The live-counts export: class-only errors, a key scrub, floors, one logged override','The S647 conductor, #3232 (d87d21db): the live-counts job runs in the live-counts environment on main only, read-only. It records an error class, never exception text; strips the key and refuses one holding whitespace; no output may hold a 20-character run of the key; floors (90% of colleges, Active 85-125% of the last block); accept_active_shift never waives a floor.',array['commons','governance','decision'],'proposed','S647, PR 3232; workflow run 43456843640',null,null,'SkyPipit (S647)',date '2026-11-13'),
('d-student-boundary-wording-s647','decision','The data dictionary states the student boundary: student records stay in MAP; COBI keeps counts','The S647 conductor, #3232: a review found the dictionary''s first privacy sentence false. It now reads "Student records stay in MAP; COBI keeps counts." and states the boundary: pseudonymous rows pass through the runner and sit in reviewer-gated map_student_credit until the summarize-then-delete plan retires it; both privacy ADRs named.',array['commons','privacy','decision'],'proposed','S647, PR 3232; docs/reference/data_dictionary.md',null,null,'SkyPipit (S647)',date '2026-11-13'),
('d-exhibits-course-title-gate-s647','decision','Exhibits proposals: a course title only for credit by exam and noncredit, an official name only for industry certifications','The S647 conductor, #3233 (d2d51532): a proposal left with a course code takes the credential its course names only on the industry-certification path, and the local course title only for credit by exam and noncredit. 11 of 170 proposals changed. The 26 Las Positas Industry Training Evidence cards wait for Sam''s ruling.',array['cer-procedures','exhibits','decision'],'proposed','S647, PR 3233; issues 3223, 3228',null,null,'SkyPipit (S647)',date '2026-11-13'),
('sam-live-counts-environment-2026-11-13','decision','Sam: created the live-counts environment; the repository secret still exists','Sam, in session, verbatim: "environment done...see cobix comments"; "new environment is live-counts"; asked about the secret: "that''s the name I gave it. if you want me to change it, let me know. it''s still a repo secret too". The environment (main only) holds SUPABASE_SERVICE_KEY; the repository copy stays until the other keyed workflows move.',array['governance','commons','decision'],'verified','Sam, in session S647, 2026-11-13','Sam Lee',now(),'SkyPipit (S647)',date '2026-11-13'),
('sam-complete-data-dash-2026-11-13','decision','Sam: complete the college data collection dashboard','Sam, in session at about 14:30Z, verbatim: "looks like we have more room in t his session, can we complete the college data collection dash?" His go for the Commons data dashboard''s slices after the first; slice 2 (#3231), the data (#3232) and slice 3 (#3236) merged under it. About 14:35Z he added: "and the fixes to the commons exhibits cobix commented on".',array['commons','decision'],'verified','Sam, in session S647, 2026-11-13','Sam Lee',now(),'SkyPipit (S647)',date '2026-11-13')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyPipit (S647)', 'create', 'checkpoint auto-write (S647 afternoon, 2026-11-13)', to_jsonb(m)
from public.cpl_memory m where m.slug in
  ('d-commons-data-coming-next-s647','d-live-counts-controls-s647','d-student-boundary-wording-s647',
   'd-exhibits-course-title-gate-s647','sam-live-counts-environment-2026-11-13','sam-complete-data-dash-2026-11-13')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug in
  ('d-commons-data-coming-next-s647','d-live-counts-controls-s647','d-student-boundary-wording-s647',
   'd-exhibits-course-title-gate-s647','sam-live-counts-environment-2026-11-13','sam-complete-data-dash-2026-11-13')
group by m.slug order by m.slug;
