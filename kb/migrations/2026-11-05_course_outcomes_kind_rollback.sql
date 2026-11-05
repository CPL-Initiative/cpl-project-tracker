-- Rollback of 2026-11-05_course_outcomes_kind.sql. The objective rows go first (each load receipt names them too:
-- kb/receipts/course_outcomes_<host>_<run>.json, inserted_keys with kind objective); every SLO row stays.
delete from public.course_outcomes where kind = 'objective';
alter table public.course_outcomes drop constraint if exists course_outcomes_college_course_kind_key;
alter table public.course_outcomes drop constraint if exists course_outcomes_kind_check;
alter table public.course_outcomes
  add constraint course_outcomes_college_course_code_source_url_fingerprint_key
  unique (college, course_code, source_url, fingerprint);

-- The load function as it stood before (chatbox/supabase_course_outcomes.sql at 2f49f1c3).
create or replace function public.course_outcomes_load(p_run text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r     jsonb;
  new_id bigint;
  ins   jsonb := '[]'::jsonb;
  kept  int := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'course_outcomes_load: the service role only';
  end if;
  if p_run is null or p_run !~ '^[0-9]{6,}$' then
    raise exception 'course_outcomes_load: a numeric run id is required';
  end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if not exists (select 1 from public.program_source_registry where college = r->>'college') then
      raise exception 'course_outcomes_load: % is not a registry college', r->>'college';
    end if;
    if coalesce(r->>'read_run', '') !~ '^[0-9]{6,}$' then
      raise exception 'course_outcomes_load: % at % carries no numeric read run',
        r->>'course_code', r->>'college';
    end if;
    insert into public.course_outcomes (
      college, course_code, course_title, heading, lead, outcomes, maps_to, shape, fingerprint,
      source_url, source_kind, source_system, read_run)
    values (
      r->>'college', r->>'course_code', r->>'course_title', r->>'heading', r->>'lead',
      r->'outcomes', case when jsonb_typeof(r->'maps_to') = 'array' then r->'maps_to' end,
      r->>'shape', r->>'fingerprint',
      r->>'source_url', coalesce(r->>'source_kind', 'course_outline'), r->>'source_system',
      (r->>'read_run')::bigint)
    on conflict (college, course_code, source_url, fingerprint) do nothing
    returning id into new_id;
    if found then
      ins := ins || jsonb_build_object('id', new_id, 'college', r->>'college', 'course_code', r->>'course_code');
    else
      kept := kept + 1;
    end if;
  end loop;
  return jsonb_build_object('run', p_run, 'inserted', jsonb_array_length(ins), 'kept', kept,
                            'inserted_keys', ins);
end
$$;

revoke all on function public.course_outcomes_load(text, jsonb) from public, anon, authenticated;
grant execute on function public.course_outcomes_load(text, jsonb) to service_role;

alter table public.course_outcomes drop column if exists kind;
