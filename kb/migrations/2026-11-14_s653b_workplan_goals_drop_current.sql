-- Annual Workplan Goals, step 2 of 2 (S653b): drop the one-column `current` the per-year cur_* columns replaced.
-- The workplan lane's NEXT 0c; the decision is d-workplan-drop-current-two-steps-s653b (the S653b conductor,
-- 2026-11-14). Step 1, the PR "workplan_goals.current stops being read", removed every read and write of the
-- column (the loader's select, the Refresh summaries drafter, the generator's _row_current_years);
-- tests/workplan_goals_current_column_guard_test.py fails a reader that names it again. A PostgREST select
-- that names a dropped column answers 400, so this file runs only after step 1 merged and a daily build
-- published with it. NOT listed in kb/migrations/.apply when committed: the conductor lists it there.
--
-- Measured live 18:40Z to 18:46Z 2026-11-14 (the S653b conductor): 72 rows; `current` non-null in one row
-- (id 3, a GOAL row, value 2); `current is distinct from cur_2025_26` in 0 rows; no view, function or trigger
-- in public reads the column. The drop names no CASCADE, so a dependent object found later fails the drop.
--
-- How the file runs: scripts/supabase_migrate.py reads the whole file and its `post` sends it as the one
-- `query` string of a single POST to the Management API, so Postgres runs every statement below as one
-- implicit transaction; any error rolls all of them back. The `lock table` depends on that: Postgres refuses
-- LOCK TABLE outside a transaction block. Run with `psql -f` (autocommit, one statement at a time) the lock
-- errors and nothing it guards is held; with `-v ON_ERROR_STOP=1` the file stops at the lock and changes
-- nothing, and without it psql carries on to the drop unlocked. Run it through the runner, or with
-- `psql -1 -v ON_ERROR_STOP=1 -f`.
--   1. Lock the table, so no write lands between the check and the drop.
--   2. Copy every row's id and `current` where it is not null into a temp table (dropped at commit).
--   3. Abort unless `current is distinct from cur_2025_26` counts 0: a value someone wrote to the old column
--      after step 1 would be lost, so the drop refuses and nothing changes.
--   4. Drop the column.
--   5. The last statement returns one JSON value: the row count and the before-values. The runner stores the
--      API's response body as `response` in kb/receipts/migration_<name>_<run>.json (its first 4,000
--      characters; 72 rows at about 25 characters each fit). A session that did not run this file can undo it
--      from that receipt alone with kb/migrations/2026-11-14_s653b_workplan_goals_drop_current_rollback.sql.

lock table public.workplan_goals in access exclusive mode;

create temp table s653b_current_before on commit drop as
  select g.id, g."current" from public.workplan_goals g where g."current" is not null;

do $$
declare n_diff integer;
begin
  select count(*) into n_diff from public.workplan_goals where "current" is distinct from cur_2025_26;
  if n_diff <> 0 then
    raise exception 'refused: % row(s) hold a current that differs from cur_2025_26; nothing is dropped', n_diff;
  end if;
end
$$;

alter table public.workplan_goals drop column "current";

select json_build_object(
  'dropped', 'public.workplan_goals.current',
  'rows', (select count(*) from public.workplan_goals),
  'before', (select coalesce(json_agg(json_build_object('id', b.id, 'current', b."current") order by b.id), '[]'::json)
             from s653b_current_before b)
) as receipt;

-- Read back: expect 0 (the column is gone) and the 72 rows unchanged in count.
--   select json_build_object('has_current', (select count(*) from information_schema.columns
--            where table_schema = 'public' and table_name = 'workplan_goals' and column_name = 'current'),
--          'rows', (select count(*) from public.workplan_goals));
