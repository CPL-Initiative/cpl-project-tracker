-- cpl_memory rows for SkyPuffin (S712), 2026-11-23. Applied with execute_sql.
-- ROLLBACK: delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where author = 'SkyPuffin (S712)');
--           delete from public.cpl_memory where author = 'SkyPuffin (S712)';
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
