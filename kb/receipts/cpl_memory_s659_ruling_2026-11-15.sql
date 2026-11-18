-- S659, after the checkpoint: Sam's ruling on a program and its Cal-GETC 2.0 version. RUN about 15:45Z.
-- ROLLBACK: delete from cpl_memory_log where actor='SkyWhimbrel (S659)' and memory_id in (select id from cpl_memory where slug in ('d-both-versions-by-catalog-year-sam-2026-11-15','riverside-plain-2-0-siblings-kept-s659')) and action in ('create','supersede') and note in ('Sam''s ruling in S659','answered by d-both-versions-by-catalog-year-sam-2026-11-15'); delete from cpl_memory where slug='d-both-versions-by-catalog-year-sam-2026-11-15'; update cpl_memory set status='proposed' where slug='riverside-plain-2-0-siblings-kept-s659';
insert into cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-both-versions-by-catalog-year-sam-2026-11-15','decision','A program and its Cal-GETC 2.0 version are both kept, each with its catalog year','Sam, 2026-11-15, in S659: "the 2.0 is for the new calgetc version that took effect this fall. students still have catalog rights to the original version in previous catalog years... both need to be in our collection with catalog years associated to them." So 32692 Mathematics reads its own page from a prior catalog year, 46237 Mathematics 2.0 from 2026-2027; never one list for both.',array['program-requirements','catalog-year','decision'],'verified','Sam, in session S659 (2026-11-15)','Sam','2026-11-15T15:45:00Z','SkyWhimbrel (S659)',date '2026-11-15')
on conflict (slug) do nothing;
update cpl_memory set status='superseded' where slug='riverside-plain-2-0-siblings-kept-s659' and status='proposed';
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyWhimbrel (S659)', case when slug like 'd-both%' then 'create' else 'supersede' end,
  case when slug like 'd-both%' then 'Sam''s ruling in S659' else 'answered by d-both-versions-by-catalog-year-sam-2026-11-15' end, to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-both-versions-by-catalog-year-sam-2026-11-15','riverside-plain-2-0-siblings-kept-s659');
-- The ruling also replaces d-glendale-tab-control-number-s648's clause "a tab stays shared only for 2.0 successors"; that row
-- stays (its control-number owner rule stands), and the lane names the replaced clause. cpl_memory_log takes no annotate action.
