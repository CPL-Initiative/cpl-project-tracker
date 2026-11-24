-- cpl_memory row for the whole-dollar totals fix (2026-11-24). INSERT ... ON CONFLICT (slug) DO NOTHING, and the
-- opportunity row it carries out marked superseded by a guarded UPDATE.
-- ROLLBACK:
--   delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where slug = 'd-whole-dollar-totals-2026-11-24');
--   delete from public.cpl_memory where slug = 'd-whole-dollar-totals-2026-11-24';
--   update public.cpl_memory set status = 'proposed', updated_at = now() where slug = 'o-whole-dollar-allocation-2026-11-24' and status = 'superseded';
--   (before-value of that row's status: 'proposed', written 2026-11-24 by this session)
insert into public.cpl_memory (slug,kind,title,summary,detail,tags,status,source,verified_by,verified_at,author,event_date) values
('d-whole-dollar-totals-2026-11-24','decision','Every funding award is whole dollars at its source',
 'The model gives each award, its credit and noncredit shares, each priority''s part and each qualifying figure in whole dollars, by the largest-remainder method, so the rows, subtotals, Statewide row, drill-ins and memo agree to the dollar.',
 'Sam, 2026-11-24: "no cents should be included in our calcs", after the field memo and the dashboard differed by about $4. Measured that day under the published scenario: Qualified So Far rows $21,454,266 against the Statewide row $21,454,262; 13 rows with CR plus NC off by $1; priority rows off on 28 (Max) and 58 (Qualified) rows. After: zero off in both views. Guard tests/cpl_funding_whole_dollars.test.js.',
 array['funding','rounding','allocation','memo','decision'],'verified','docs/reference/lanes/implementation-funding.md','Sam Lee (chat, 2026-11-24)',now(),'Claude (funding side session, 2026-11-24)','2026-11-24')
on conflict (slug) do nothing;
update public.cpl_memory set status = 'superseded', updated_at = now()
where slug = 'o-whole-dollar-allocation-2026-11-24' and status = 'proposed';
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'Claude (funding side session, 2026-11-24)', 'create', '2026-11-24', to_jsonb(m)
from public.cpl_memory m where m.slug = 'd-whole-dollar-totals-2026-11-24';
insert into public.cpl_memory_log (memory_id, actor, action, note, before)
select id, 'Claude (funding side session, 2026-11-24)', 'supersede', 'carried out by d-whole-dollar-totals-2026-11-24', jsonb_build_object('status','proposed')
from public.cpl_memory where slug = 'o-whole-dollar-allocation-2026-11-24';
