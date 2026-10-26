-- S486 SkyQuince, 2026-10-26: Hartnell's reconcile step sets ge_overlap where a tab prints
-- "Students can double-count required courses and courses for General Education". It is a
-- figure the reconcile fills, like ge_units, so a confirm carries across it. Rollback: the
-- same function without - 'ge_overlap' (chatbox/supabase_program_requirement_records_college_reread.sql at 18174c49).
create or replace function public.program_record_carry_basis(rec jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_build_object(
    'program', coalesce(rec->'program', '{}'::jsonb) - 'outcomes' - 'careers'
               - 'total_units' - 'degree_total' - 'ge_units' - 'ge_pattern'
               - 'open_elective_units' - 'degree_elective_units' - 'electives_fill_degree'
               - 'degree_total_minimum' - 'total_units_minimum' - 'ge_overlap',
    'blocks',  coalesce(rec->'blocks', '[]'::jsonb));
$$;
revoke all on function public.program_record_carry_basis(jsonb) from public, anon, authenticated;
grant execute on function public.program_record_carry_basis(jsonb) to service_role;
