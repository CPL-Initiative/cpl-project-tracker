-- S360 SkyLichen, 2026-10-11: the record fingerprint leaves out program.careers (record shape 4, Sam's rule 5),
-- as it leaves out the outcomes, so a verdict pins to the requirements alone.
-- APPLIED 2026-10-11 ~02:05Z through apply_migration (program_record_fp_leaves_out_careers_2026_10_11_s360).
-- Measured before and after over all 1,226 rows (none carried careers):
--   md5(string_agg(college|control_number|program_record_fp(record) order by C)) = f2e3cce12ff9cec57d82c7d97ab80087 both times.
-- Grants after: anon no, authenticated yes, service_role yes.
-- Rollback: re-create the function with "- 'outcomes'" alone (chatbox/supabase_program_record_verdicts.sql before S360).
create or replace function public.program_record_fp(rec jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select md5(jsonb_build_object(
    'program', coalesce(rec->'program', '{}'::jsonb) - 'outcomes' - 'careers',
    'blocks',  coalesce(rec->'blocks', '[]'::jsonb))::text);
$$;
revoke all on function public.program_record_fp(jsonb) from public, anon;
grant execute on function public.program_record_fp(jsonb) to authenticated, service_role;
