-- S644 (SkyWren's worker), 2026-11-13: Grossmont's and East Los Angeles's reconcile steps set
-- electives_fill_words, the catalog's own sentence that electives fill the degree ("Complete
-- transferable units as needed to reach 60"), which the scorer's electives guard reads. It is a
-- field the reconcile fills, like ge_overlap (S486), so a confirm carries across it; so is
-- hours_total_printed, San Bernardino Valley's and Coalinga's flag for the no-colon hours total. Apply before
-- the two colleges' rereads. Rollback: 2026-11-13_s644_carry_basis_electives_fill_words_rollback.sql
-- (the function as S486 left it). Prepared, not applied: no kb/migrations/.apply in this PR.
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
               - 'degree_total_minimum' - 'total_units_minimum' - 'ge_overlap'
               - 'electives_fill_words' - 'hours_total_printed',
    'blocks',  coalesce(rec->'blocks', '[]'::jsonb));
$$;
revoke all on function public.program_record_carry_basis(jsonb) from public, anon, authenticated;
grant execute on function public.program_record_carry_basis(jsonb) to service_role;
