-- S318 pending migration (open-asks sheet 21, the program-course card): paste
-- into the Supabase SQL editor and run, or have a session run it while you watch
-- and approve the confirm prompt the Supabase connector shows. Every statement is
-- also in its schema-of-record file (chatbox/supabase_search_college_programs.sql,
-- chatbox/supabase_program_courses.sql); delete this file once it has run.
-- After it runs: dispatch coci-offerings-sync so the programs reload with their
-- control numbers.
-- 1) The programs loader carries control_number (the join key Sierra needs).
-- 2) Only the service key may run the three catalog loaders (today any signed-in
--    user can, and each one empties its table first).
-- 3) The new coci_program_courses table: the API roles hold SELECT only.
create or replace function public.coci_programs_replace(
  p_rows jsonb, p_truncate boolean default true)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n integer;
begin
  if p_truncate then delete from public.coci_college_programs where true; end if;
  insert into public.coci_college_programs
    (college, program_title, award, top_code, top_title, cip_code, cip_title, status,
     control_number)
  select r.college, nullif(r.program_title,''), nullif(r.award,''),
         nullif(r.top_code,''), nullif(r.top_title,''),
         nullif(r.cip_code,''), nullif(r.cip_title,''), nullif(r.status,''),
         nullif(r.control_number,'')
  from jsonb_to_recordset(p_rows) as r(
    college text, program_title text, award text, top_code text, top_title text,
    cip_code text, cip_title text, status text, control_number text)
  where coalesce(r.college,'') <> '';
  get diagnostics n = row_count;
  return n;
end $function$;

grant execute on function public.coci_programs_replace(jsonb, boolean) to service_role;
grant execute on function public.coci_offerings_replace(jsonb, boolean) to service_role;
grant execute on function public.college_geo_replace(jsonb) to service_role;
revoke all on function public.coci_programs_replace(jsonb, boolean) from public, anon, authenticated;
revoke all on function public.coci_offerings_replace(jsonb, boolean) from public, anon, authenticated;
revoke all on function public.college_geo_replace(jsonb) from public, anon, authenticated;

revoke all on public.coci_program_courses from public, anon, authenticated;
grant select on public.coci_program_courses to anon, authenticated;
grant select, insert, update, delete on public.coci_program_courses to service_role;
