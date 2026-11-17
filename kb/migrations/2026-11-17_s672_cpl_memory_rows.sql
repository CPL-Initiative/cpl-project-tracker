-- cpl_memory rows for SkyWren (S672), the CPL Queue routine, 2026-11-17. Applied by supabase-migrate.yml (kb/migrations/.apply),
-- never Execute SQL. INSERT ... ON CONFLICT (slug) DO NOTHING (a replay is harmless). Session decisions land proposed.
-- Also one guarded UPDATE of SkyKinglet's own proposed row d-rccd-pilot-no-blind-force-s671, whose summary said the force
-- "fixed one (31892)": that pass dropped the cluster rule and main's reading was restored (COBIx on #3438), so it fixed none.
-- GUARD: the row changes only while its author is SkyKinglet (S671) and its summary still says "fixed one (31892)".
-- ROLLBACK: kb/migrations/2026-11-17_s672_cpl_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-rccd-repeat-rows-reconcile-steps-s672','decision','A course printed once per enrollment is fixed by a reconcile step per page shape','S672: the record shape carries times and the scorer counts it, so the repeated-course-row lever (p-repeated-course-row-undercounts-s671) is a repeat step in kb/program_requirements_reconcile.json per page shape, never a scorer change. Riverside City: a starred code with "*Course must be taken four times" (Piano 38626), the footnote run into the code cell (Jazz 38627), "Take MUS-39 three times over three semesters" (38628); reconcile 44046016854 passed all three (229 to 232, none lost). Norco: "Take MUS-39 twice for a total of six units" only, since MUS-41 sits in two options at two counts. #3441.',array['program-requirements','harvest','reconcile','rccd'],'proposed','S672 SkyWren, #3441; college page read 44045355408',null,null,'SkyWren (S672)','2026-11-17'),
('f-norco-mis-performance-options-ungrouped-s672','fact','Norco Music Industry Studies: Performance fails on three ungrouped options','S672, college page read 44045355408: Norco 30606 and 30607 (one page) print "Complete one of the following options: 8.00" over three options, and the reading kept them as three rule-all blocks with no option group, so the blocks sum to 30-33 against the printed 36-37 after the repeat step. The next fix is an option-group step. Moreno Valley Guitar 38758''s 16-20 comes from "MUS-3* ... *(Test out option available)", not a repeat.',array['program-requirements','harvest','rccd','norco','moreno-valley'],'proposed','college page read 44045355408 (rccd.curriqunet.com)',null,null,'SkyWren (S672)','2026-11-17')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyWren (S672)', 'create', 'S672 (2026-11-17)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-rccd-repeat-rows-reconcile-steps-s672','f-norco-mis-performance-options-ungrouped-s672')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

with old as (
  select * from public.cpl_memory
  where slug = 'd-rccd-pilot-no-blind-force-s671' and author = 'SkyKinglet (S671)' and summary like '%fixed one (31892)%'
), upd as (
  update public.cpl_memory m set summary = replace(m.summary, 'fixed one (31892)', 'fixed none (31892''s apparent pass dropped its one-course-from-each-cluster rule, and main''s reading was restored, COBIx on #3438)'), updated_at = now()
  from old where m.id = old.id
  returning m.id, to_jsonb(old.*) as before_row
)
insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select upd.id, 'SkyWren (S672)', 'update', 'S672: handoff 672, the force fixed none of 15',
       upd.before_row, (select to_jsonb(m) from public.cpl_memory m where m.id = upd.id)
from upd;
