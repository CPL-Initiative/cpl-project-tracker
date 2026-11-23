-- cpl_memory rows for SkyPuffin (S712), 2026-11-23. Applied with execute_sql.
-- ROLLBACK: delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where author = 'SkyPuffin (S712)');
--           delete from public.cpl_memory where author = 'SkyPuffin (S712)';
--           update public.cpl_memory set status = 'proposed' where slug = 'd-readiness-map-is-not-settled-s709';
--           (its status before this run; the log row with action 'supersede' by SkyPuffin (S712) records it)
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-outline-hunt-handover-in-place-s712','decision','Each outline to find by hand opens its own hand-over pane','S712, Sam''s to revise: on #collect/slos each of the 50 courses opens its hand-over pane at #collect/slos/outline/<college>-<code> (the course_outlines box, Previous and Next, a save steps on), and its row shows the public counts of what was handed over. Dropping into a session stays open. Guard tests/commons_outline_hunt.test.js.',array['commons','course-outcomes','outline-hunt','hand-over'],'proposed','session','SkyPuffin (S712)',now(),'SkyPuffin (S712)','2026-11-23')
on conflict (slug) do nothing;
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('f-unread-aed-members-mostly-noncredit-s712','fact','Statewide filings would release little of the AED scope''s unread-college members','S712: of 2,373 AED-scope members at colleges with no filed catalog, 1,414 are noncredit (N 643, E 771) and 925 credit, 653 of those ESL in two M-IDs; 34 are not in the state list. Readiness needs a college''s catalog file to know a member''s band, so a statewide filing reaches no unread college today; changing that alone would settle few M-IDs.',array['commons','subjects','remint','mid-readiness'],'proposed','session','SkyPuffin (S712)',now(),'SkyPuffin (S712)','2026-11-23')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyPuffin (S712)', 'create', 'S712 (2026-11-23)', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyPuffin (S712)'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select slug, status, length(summary) from public.cpl_memory where author = 'SkyPuffin (S712)' order by slug;

-- Applied 2026-11-23 ~10:30Z: Sam's two rulings of the session, and the S709 decision they supersede.
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('r-confidence-not-person-settled-sam-2026-11-23','decision','Settled means confident enough; a person is one way to raise confidence, never the milestone','Sam, 2026-11-23 (S712): "let''s eliminate any expectation that any of this needs to be settled by a person in order to be considered settled or done. Let''s work based on levels of confidence. sometimes a person will be needed to boost the confidence, other times, the data will be enough... settled by a person is no longer a milestone:)--it''s been a millstone to me rather than a milestone"',array['commons','subjects','remint','mid-readiness','confidence'],'verified','Sam in session, 2026-11-23 (S712)','Sam',now(),'SkyPuffin (S712)','2026-11-23'),
('r-statewide-codes-every-college-sam-2026-11-23','decision','One statewide list of local subject codes, every college, a call and a confidence for each','Sam, 2026-11-23 (S712): "what''s settled-3019 unique list with the colleges that uses (knowing this will always to making changes as colleges adjust)"; "all colleges count"; the one-college codes "don''t need to wait"; "always provide a recommendation based on your best available data and always provide a confidence score, even if it''s 5%". Built as kb/_statewide_subject_codes.py.',array['commons','subjects','confidence'],'verified','Sam in session, 2026-11-23 (S712)','Sam',now(),'SkyPuffin (S712)','2026-11-23')
on conflict (slug) do nothing;
update public.cpl_memory set status='superseded' where slug='d-readiness-map-is-not-settled-s709' and status <> 'superseded';
-- (the cpl_memory_log rows: create for the two rulings, supersede for the S709 row, actor SkyPuffin (S712))
