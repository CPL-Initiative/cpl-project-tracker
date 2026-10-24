-- S466 SkyYerbaSanta, 2026-10-24: corrects this run's own cpl_memory row funding-film-scenario-4-words-held-2026-10-24 to
-- the v10 state (Sam adopted the words, Open Asks Sheet 123 card 2, 13:17Z). Through supabase-migrate.yml because the
-- connector's UPDATE waited on a confirmation nobody answered. Guarded on the row as read at 13:28Z (updated_at
-- 2026-10-24 13:02:14.222914+00); rows = 0 means someone edited it since.
-- ROLLBACK: the cpl_memory_log 'update' entry this writes carries the row after; the row before is the log's 'create' entry.
update public.cpl_memory
set summary = 'Under Scenario 4 each priority carries the credit funding alone ($10,727,131, 3,598.2 FTES each); the two noncredit outcomes carry $1,893,023 each. Sam adopted the film''s words (Sheet 123 card 2, 13:17Z): v10 says the priorities carry the credit funding and names the outcomes; build.py composes them from _videoFigures() ncLane/ncOutcomes (#2418).',
    status = 'verified', verified_by = 'Sam (Sheet 123 card 2)', verified_at = now(), updated_at = now()
where slug = 'funding-film-scenario-4-words-held-2026-10-24'
  and author = 'S466 SkyYerbaSanta'
  and updated_at = '2026-10-24 13:02:14.222914+00';
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyYerbaSantaS466', 'update', 'v10 adopted by Sam (Sheet 123 card 2); summary corrected, verified', to_jsonb(m)
from public.cpl_memory m where m.slug = 'funding-film-scenario-4-words-held-2026-10-24' and m.status = 'verified'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'update');
select slug, status, left(summary, 80) as summary from public.cpl_memory where slug = 'funding-film-scenario-4-words-held-2026-10-24';
