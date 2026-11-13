-- Rollback of 2026-11-13_s644_carry_basis_electives_fill_words.sql: the function as
-- 2026-10-26_s486_carry_basis_ge_overlap.sql left it.
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
