-- Rollback for 2026-11-14_s653b_workplan_goals_drop_current.sql: adds `current` back to public.workplan_goals as
-- numeric and restores every value the forward run recorded.
-- The before-values sit in the forward run's receipt: kb/receipts/migration_<name>_<run>.json, where <name> is
-- the name in kb/migrations/.apply and <run> the GitHub run id, or the version stamp when there is none
-- (scripts/supabase_migrate.py names it so). Its `response` key holds the API's response body; inside it,
-- `before` lists every row's id and `current` where it was not null. The VALUES list below is what the
-- S653b conductor measured live at 18:40Z to 18:46Z 2026-11-14: one row, id 3, value 2. Before running this,
-- replace the list with the receipt's `before` when the two differ; the receipt wins.
-- A row whose id no longer exists is skipped. The column comes back at the end of the table, with no comment;
-- RLS is row-level, so the table's policies cover it as they did. Nothing in the code reads it after step 1,
-- so restoring it changes no page.
--
-- APPLIED: the forward file ran once, through kb/migrations/.apply on claude/workplan-drop-current-s653b, run
-- 43638452928, ledger version 20261114204116 (2026-11-14, UTC). Its receipt is
-- kb/receipts/migration_s653b_workplan_goals_drop_current_43638452928.json; its `before` reads
-- [{"id": 3, "current": 2}], the same one row as the VALUES list below, so this file restores it as written.
-- Read back live by the S653b conductor after the run: the column is absent, 72 rows, 19 columns, id 3 still
-- holds cur_2025_26 = 2. The forward file is left byte for byte as it ran (the receipt's sha256 names it).

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
