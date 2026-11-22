-- cpl_memory rows for SkyTystie (S705), Sam's plain session of 2026-11-22 (14:10Z on). NOT pointed at by
-- kb/migrations/.apply. Applied by the session with execute_sql.
-- 1 row inserted (a decision of the session's own, proposed); S702's "one press each" decision superseded by it.
-- No person's email and no contact detail.
-- ROLLBACK: kb/migrations/2026-11-22_s705_cpl_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-subjects-one-save-every-college-credit-forms-s705','decision','One Save settles a code''s common subject code at every college, on the credit forms','S705 (#3687, #3655 item 0): signed in, a code''s panel takes one common code and one Save that writes one kb_curation row per college at its credit form''s key (credit, or whole), as the reviewer. A college a person or filing settled keeps it; a noncredit-only code keeps its category forms; one''s own save keeps its title. Supersedes the S702 one-press-each row. Sky''s call, Sam''s to revise.',array['commons','subjects'],'proposed','PR #3687; tests/commons_subjects_every_college.test.js',null,null,'SkyTystie (S705)','2026-11-22')
on conflict (slug) do nothing;
update public.cpl_memory set status = 'superseded'
 where slug = 'd-subjects-several-colleges-one-press-each-s702' and status = 'proposed';
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyTystie (S705)', 'create', 'S705 (2026-11-22)', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyTystie (S705)'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select slug, status from public.cpl_memory where slug in ('d-subjects-one-save-every-college-credit-forms-s705','d-subjects-several-colleges-one-press-each-s702') order by slug;
