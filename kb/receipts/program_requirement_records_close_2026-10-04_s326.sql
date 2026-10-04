-- S326 (SkyAddendum), 2026-10-04: the privilege close for program_requirement_records.
-- For a person to paste in the Supabase SQL editor and run whole.
--
-- Sam said "yes" to Sierra's catalog requirements for checked records (open-asks sheet 29, card 4). The
-- table is live (migration program_requirement_records_2026_10_04) with 20 checked records loaded
-- (kb/receipts/program_requirement_records_load_2026-10-04.sql, four parts). Like the addenda table, its
-- close cannot go through the Supabase connector, which holds any statement naming a privilege removal
-- for a confirmation a remote session cannot answer.
--
-- What is open until this runs: the default privileges handed anon and authenticated every table
-- privilege. Row-level security already refuses their inserts, updates and deletes (one SELECT policy,
-- checked rows only); TRUNCATE ignores row-level security, so the extras are removed outright.
-- service_role keeps SELECT, INSERT and UPDATE for the loader.
--
-- Rollback: each line is a privilege removal; re-granting the same privilege undoes it.

revoke insert, update, delete, truncate, references, trigger
  on public.program_requirement_records from anon, authenticated;

-- Read back: anon_select true; every other row false except service_insert.
select 'anon_select' as check_name, has_table_privilege('anon', 'public.program_requirement_records', 'select') as holds
union all select 'anon_insert',    has_table_privilege('anon', 'public.program_requirement_records', 'insert')
union all select 'anon_truncate',  has_table_privilege('anon', 'public.program_requirement_records', 'truncate')
union all select 'auth_truncate',  has_table_privilege('authenticated', 'public.program_requirement_records', 'truncate')
union all select 'service_insert', has_table_privilege('service_role', 'public.program_requirement_records', 'insert');
