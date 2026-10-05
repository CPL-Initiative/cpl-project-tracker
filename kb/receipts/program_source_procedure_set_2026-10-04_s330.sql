-- S330 (SkyRoutine), 2026-10-04: program_source_procedure_set(), the procedure record's one write path.
-- Sam's go in session (~00:00Z): "go ahead on writing the function"; on governance: "we can revise governance
-- if needed". Applied as migration program_source_procedure_set_2026_10_04 (also in
-- kb/supabase_program_source_registry.sql).
-- Rollback: drop function public.program_source_procedure_set(text, jsonb, text, text);
-- A record written through it rolls back from program_source_registry_history (the receipts name how).

create or replace function public.program_source_procedure_set(
  p_college text, p_procedure jsonb, p_by text, p_expect_md5 text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur     public.program_source_registry%rowtype;
  now_md5 text;
begin
  if coalesce(trim(p_by), '') = '' then
    raise exception 'program_source_procedure_set: procedure_by is required (a person, or the session and run)';
  end if;
  if p_procedure is null or jsonb_typeof(p_procedure) <> 'object'
     or (p_procedure->>'v') is null
     or jsonb_typeof(p_procedure->'hosts') is distinct from 'array' then
    raise exception 'program_source_procedure_set: a record is an object with v and a hosts array';
  end if;
  select * into cur from public.program_source_registry where college = p_college for update;
  if not found then
    raise exception 'program_source_procedure_set: no registry row for %', p_college;
  end if;
  now_md5 := coalesce(md5(cur.procedure::text), 'none');
  if p_expect_md5 is distinct from now_md5 then
    raise exception 'program_source_procedure_set: the record changed since it was read (expected %, found %); re-read it before writing',
      p_expect_md5, now_md5;
  end if;
  update public.program_source_registry
     set procedure = p_procedure, procedure_by = p_by, procedure_at = now()
   where college = p_college;
  return jsonb_build_object('college', p_college, 'procedure_by', p_by, 'v', p_procedure->>'v',
                            'was_md5', now_md5, 'md5', md5(p_procedure::text));
end
$$;
revoke all on function public.program_source_procedure_set(text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.program_source_procedure_set(text, jsonb, text, text) to service_role;

-- Read back: the grants (anon and authenticated false, service_role true)
select r.rolname, has_function_privilege(r.rolname, 'public.program_source_procedure_set(text, jsonb, text, text)', 'execute') as can_execute
  from (values ('anon'), ('authenticated'), ('service_role')) r(rolname);
