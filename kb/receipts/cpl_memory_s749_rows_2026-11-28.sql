-- cpl_memory rows for SkyGannet (S749), Sam's plain session of 2026-11-28, 12:01Z to about 17:30Z, a full checkpoint.
-- DRAFTED by the checkpoint-docs worker, NOT applied: the conductor runs it as one execute_sql call.
-- Sam's seven rulings, the four decisions and the two pitfalls of this run are already in cpl_memory (handoff 752 names
-- each slug), so this receipt adds only the run's milestone. INSERT ... ON CONFLICT (slug) DO NOTHING, status proposed,
-- author 'SkyGannet (S749)'; its summary is 400 characters or fewer.
-- ROLLBACK (removes the row and its log row):
--   delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where author = 'SkyGannet (S749)' and slug in ('m-subjects-alignment-s749'));
--   delete from public.cpl_memory where author = 'SkyGannet (S749)' and slug in ('m-subjects-alignment-s749');

insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('m-subjects-alignment-s749','milestone','S749: Sam''s Nov 28 subject alignment filed, COBI''s picks, the CIP taxonomy, the re-mint dry run','S749 (Sam''s session, 2026-11-28): #3947 titles and Sam''s 103 folds, untitled 1,032 to 137; #3948 the September 2026 CIP Taxonomy, 5 codes change category; #3949 COBI''s picks filer; #3952 Sam''s alignment, 56 codes, 1,662 of 1,663 picks; #3955 the re-mint dry run, 346 M-IDs. The apply is #3958, not yet run. 12 kb_curation rows filed, cohort sam-rulings-s749@bot.',array['common-subjects-reference','commons','remint','cip','milestone'],'proposed','docs/session_752_handoff.md',null,null,'SkyGannet (S749)','2026-11-28')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyGannet (S749)', 'create', 'S749 (2026-11-28)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('m-subjects-alignment-s749')
  and m.author = 'SkyGannet (S749)'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select slug, kind, status, length(summary) as summary_len from public.cpl_memory
where slug in ('m-subjects-alignment-s749')
  and author = 'SkyGannet (S749)'
order by slug;
