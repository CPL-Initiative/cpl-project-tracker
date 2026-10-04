-- S326 (SkyAddendum), 2026-10-04: Part B of the catalog addenda table, the privilege close.
-- For a person to paste in the Supabase SQL editor and run whole.
--
-- Sam said "Go" on the table (open-asks sheet 29 card 5, 12:00Z). Part A, create-only, is live
-- (migrations program_source_addenda_create_2026_10_04 and
-- program_source_addenda_return_keeps_read_2026_10_04). The full statement timed out at 60 s
-- through the Supabase connector and wrote nothing: the connector holds any statement naming a
-- destructive SQL word for a confirmation a remote session cannot answer
-- (cpl_memory mcp-apply-migration-destructive-confirm-times-out-2026-10-02).
--
-- What is open until this runs: the default privileges handed anon and authenticated every table
-- privilege on both new tables, and PUBLIC holds EXECUTE on both new functions. Row-level
-- security already refuses their inserts, updates and deletes (one SELECT policy, nothing else),
-- and the write function is SECURITY INVOKER, so a call from anon writes nothing. TRUNCATE
-- ignores row-level security, which is why the extras are removed outright, as on the registry.
--
-- service_role keeps its explicit grants (EXECUTE on the write function; SELECT, INSERT, UPDATE
-- on the table; SELECT, INSERT on the history), so the weekly census keeps writing (Rule 10 b2).
--
-- Rollback: each line is a privilege removal; re-granting the same privilege undoes it.

revoke insert, update, delete, truncate, references, trigger
  on public.program_source_addenda from anon, authenticated;
revoke all on sequence public.program_source_addenda_id_seq from anon, authenticated;
revoke all on public.program_source_addenda_history from anon, authenticated;
revoke all on sequence public.program_source_addenda_history_id_seq from anon, authenticated;
revoke all on function public.program_source_addenda_keep_history() from public, anon, authenticated;
revoke all on function public.program_source_addenda_apply(text, jsonb) from public, anon, authenticated;

-- Read back: every row should read false except the three service_role rows and anon_select.
select 'anon_select'            as check_name, has_table_privilege('anon', 'public.program_source_addenda', 'select') as holds
union all select 'anon_insert',     has_table_privilege('anon', 'public.program_source_addenda', 'insert')
union all select 'anon_truncate',   has_table_privilege('anon', 'public.program_source_addenda', 'truncate')
union all select 'anon_history',    has_table_privilege('anon', 'public.program_source_addenda_history', 'select')
union all select 'auth_truncate',   has_table_privilege('authenticated', 'public.program_source_addenda', 'truncate')
union all select 'anon_exec_apply', has_function_privilege('anon', 'public.program_source_addenda_apply(text, jsonb)', 'execute')
union all select 'auth_exec_apply', has_function_privilege('authenticated', 'public.program_source_addenda_apply(text, jsonb)', 'execute')
union all select 'service_exec_apply',   has_function_privilege('service_role', 'public.program_source_addenda_apply(text, jsonb)', 'execute')
union all select 'service_insert',       has_table_privilege('service_role', 'public.program_source_addenda', 'insert')
union all select 'service_history_ins',  has_table_privilege('service_role', 'public.program_source_addenda_history', 'insert');
