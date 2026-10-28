-- S506 (SkyCloudberry), 2026-10-28, checkpoint: Sam's reason for noncredit's 15 percent portion.
-- INSERT-only under author/actor memory-s506c-2026-10-28. ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s506c-2026-10-28';
--   delete from public.cpl_memory where author = 'memory-s506c-2026-10-28';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
values ('sam-funding-nc-portion-reason-2026-10-28', 'decision',
 'Sam: why noncredit''s portion of the funding is 15 percent',
 'Sam, 2026-10-28 (S506): "we bumped the % to NC because it is generally strained for resources locally, and there is great opportunity for expansion of CPL." Measured beside it: noncredit is 6.0 percent of combined FTES (70,831 of 1,179,339), about 7 percent unset after the base award and cap; the published scenario sets 15 percent (his 2026-10-14 call), weighting noncredit FTES about 2.8 to 1.',
 'Asked for the FAQ answer "How was the funding divided between credit and noncredit?" (Open Asks Sheet 138). He also confirmed P1 and P2 at 50/50 of the credit share; the carve-out reads $9,759,692 ($8,959,692 CPL Projects & Innovation plus $800,000 for the two CO posts), leaving $25,240,308 to institutions.',
 null, array['implementation-funding','funding-public'], 'verified', 'Sam, in session S506, 2026-10-28', 'Sam', now(), '2026-10-28', 'memory-s506c-2026-10-28', array['sam-funding-tab-asks-s506-2026-10-28'])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s506c-2026-10-28', 'create', 'S506: ' || m.slug, to_jsonb(m)
from public.cpl_memory m where m.author = 'memory-s506c-2026-10-28'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s506c-2026-10-28');
select slug, status from public.cpl_memory where author = 'memory-s506c-2026-10-28';
