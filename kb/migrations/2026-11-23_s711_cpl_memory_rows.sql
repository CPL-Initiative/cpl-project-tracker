-- cpl_memory rows for SkyRazorbill (S711), 2026-11-23. Applied with execute_sql.
-- ROLLBACK: delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where author = 'SkyRazorbill (S711)');
--           delete from public.cpl_memory where author = 'SkyRazorbill (S711)';
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-course-move-settles-first-s711','decision','A person''s course move settles that course first at the re-mint gate','S711, Sam''s to revise: the sync reads the Subjects panel''s course moves (course_subject_decision, CRS:<college>|<code>|<number>) into subject_decisions.json courses; kb/_mid_readiness.py settles the moved course alone to the move''s code, ahead of its code''s save, a filing and the map; the nightly mint never reads one. 0 moves saved at 00:30Z. Guard tests/subject_course_moves_test.py.',array['commons','subjects','remint','mid-readiness'],'proposed','session','SkyRazorbill (S711)',now(),'SkyRazorbill (S711)','2026-11-23')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyRazorbill (S711)', 'create', 'S711 (2026-11-23)', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyRazorbill (S711)'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select slug, status, length(summary) from public.cpl_memory where author = 'SkyRazorbill (S711)' order by slug;
