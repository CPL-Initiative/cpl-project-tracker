-- cpl_memory rows for SkyPhoebe (S673), the CPL Queue routine, 2026-11-17. Applied by supabase-migrate.yml (kb/migrations/.apply),
-- never Execute SQL. INSERT ... ON CONFLICT (slug) DO NOTHING (a replay is harmless). Session decisions land proposed.
-- Also one guarded UPDATE: SkyWren's own proposed row f-norco-mis-performance-options-ungrouped-s672 said the options were
-- ungrouped; the filed records already shared option_group 'Ensemble option' (S673), so it is superseded by the S673 decision.
-- GUARD: the row changes only while its author is SkyWren (S672) and its status is proposed.
-- ROLLBACK: kb/migrations/2026-11-17_s673_cpl_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-norco-option-heading-counts-s673','decision','A count printed in a block''s own heading belongs to that block','S673: Norco 30606 and 30607''s three options were already one option_group; each listed its courses once. A repeat step''s name_pattern reads the count on a rule-all block''s heading (MUS-41 four times in Option 1, twice in Option 2), only where the words are on the page and the sum is the stated 8. Norco 130 to 132 passing, none lost (reconcile 44063769303). #3443.',array['program-requirements','harvest','reconcile','rccd'],'proposed','S673 SkyPhoebe, #3443; reconcile 44063769303',null,null,'SkyPhoebe (S673)','2026-11-17'),
('d-mvc-38758-total-is-20-s673','decision','Moreno Valley Guitar 38758''s total is the printed 20','S673: Moreno Valley Guitar 38758 prints Required Courses (16-20 Units), Units: 20.00 and Total: 20.00; the 16 is the MUS-3 test-out option. Credit by exam still awards MUS-3''s 4 units, so the record''s total is 20. Next: a narrow step setting a test-out low end to the printed total; no step today overwrites a filled total.',array['program-requirements','harvest','reconcile','rccd'],'proposed','S673 SkyPhoebe; record kb/program_requirements_college/moreno_valley/records/38758.json',null,null,'SkyPhoebe (S673)','2026-11-17'),
('f-ccn-renumber-shows-as-catalog-addition-s673','fact','A renumbered common-course code still displays as a catalog addition','S673, COBIx point 2 on #3438: HIST-C1001, MATH-C2210 and ARTH-C1100 at Riverside City carry catalog_addition true though coverage matches each to the local course by course_id. kb/_build_roep_display.py counts additions and gaps from catalog_addition and COCI listing alone, so these read as courses off the list. Reader-wide; a display fix waits behind harvest.',array['program-requirements','harvest','display','ccn'],'proposed','S673 SkyPhoebe; COBIx on #3438; kb/_build_roep_display.py adds and gaps',null,null,'SkyPhoebe (S673)','2026-11-17')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyPhoebe (S673)', 'create', 'S673 (2026-11-17)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-norco-option-heading-counts-s673','d-mvc-38758-total-is-20-s673','f-ccn-renumber-shows-as-catalog-addition-s673')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

with old as (
  select * from public.cpl_memory
  where slug = 'f-norco-mis-performance-options-ungrouped-s672' and author = 'SkyWren (S672)' and status = 'proposed'
), upd as (
  update public.cpl_memory m set status = 'superseded', updated_at = now()
  from old where m.id = old.id
  returning m.id, to_jsonb(old.*) as before_row
)
insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select upd.id, 'SkyPhoebe (S673)', 'update', 'S673: the options were grouped; superseded by d-norco-option-heading-counts-s673',
       upd.before_row, (select to_jsonb(m) from public.cpl_memory m where m.id = upd.id)
from upd;
