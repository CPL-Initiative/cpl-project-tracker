-- Rollback of 2026-11-14_s651_passing_function.sql: the passing function as
-- chatbox/supabase_program_record_verdicts.sql defines it (coverage, invented, arithmetic equal or unstated).
create or replace function public.program_record_machine_pass(c jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(c->>'coverage', '') = 'true'
     and coalesce(c->>'invented', '') = 'true'
     and coalesce(c->>'arithmetic', '') in ('equal', 'unstated');
$$;
revoke all on function public.program_record_machine_pass(jsonb) from public, anon;
grant execute on function public.program_record_machine_pass(jsonb) to authenticated, service_role;
