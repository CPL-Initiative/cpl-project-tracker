-- Rollback for 2026-11-14_s653b_workplan_goals_drop_current.sql: adds `current` back to public.workplan_goals as
-- numeric and restores every value the forward run recorded.
-- The forward run's receipt (kb/receipts/migration_s653b_workplan_goals_drop_current_<run>.json, `response`)
-- holds `before`, every row's id and `current` where it was not null. The VALUES list below is what the
-- S653b conductor measured live at 18:40Z to 18:46Z 2026-11-14: one row, id 3, value 2. Before running this,
-- replace the list with the receipt's `before` when the two differ; the receipt wins.
-- A row whose id no longer exists is skipped. The column comes back at the end of the table, with no comment;
-- RLS is row-level, so the table's policies cover it as they did. Nothing in the code reads it after step 1,
-- so restoring it changes no page.

alter table public.workplan_goals add column if not exists "current" numeric;

with v(id, "current") as (
  values (3, 2::numeric)
),
restored as (
  update public.workplan_goals g
     set "current" = v."current"
    from v
   where g.id = v.id and g."current" is null
  returning g.id, g."current"
)
select json_build_object(
  'restored', (select coalesce(json_agg(json_build_object('id', r.id, 'current', r."current") order by r.id), '[]'::json)
               from restored r),
  'expected', (select count(*) from v)
) as receipt;

-- Read back: expect one row, (3, 2), and `current is distinct from cur_2025_26` in 0 rows.
--   select json_build_object('non_null', (select json_agg(json_build_object('id', id, 'current', "current"))
--            from public.workplan_goals where "current" is not null),
--          'distinct', (select count(*) from public.workplan_goals where "current" is distinct from cur_2025_26));
