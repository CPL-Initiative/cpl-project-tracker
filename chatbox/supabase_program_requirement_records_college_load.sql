-- program_requirement_records_college_load(): the one write a full-college read makes.
--
-- Phase 2 of the program requirements harvest (docs/reference/lanes/
-- program-requirements-harvest.md). Sam, 2026-10-09 (S353, as proposed): the
-- first full-college read is Cerritos, and its records load UNCHECKED; the three
-- machine checks run on each, and Sam reads a sample for the fourth. A college's
-- worth of records is about a megabyte of JSON, which a session cannot carry
-- through the connector, so the workflow that read the college
-- (.github/workflows/program-requirements-college.yml, its load job) calls this
-- function with the service key, a batch at a time, from the records committed
-- under kb/program_requirements_college/<slug>/records/.
--
-- What it may do, and nothing else:
--   * INSERT a row for a program the table does not hold. A row already there
--     (the pilot's, a person's reading, an earlier load) is never touched:
--     ON CONFLICT DO NOTHING, counted as kept.
--   * Every row it writes is checked = false with no checked_by. Only a person's
--     Confirm (program_record_verdict_add, and the trigger that follows it)
--     checks a record, so this path cannot put a record in front of the public
--     read, Sierra or the headline, which read checked rows only.
--   * Each row keeps the extraction run that read it (extracted_run, from the
--     record; a record kept from an earlier run keeps that run). The function
--     returns the keys it inserted and the keys it kept, and the load's receipt
--     (kb/receipts/program_requirement_records_college_<slug>_<load run>.json)
--     files both, so a load rolls back by its receipt: the inserted keys of this
--     college that are still unchecked.
-- Rows for another college than p_college are refused, the college must be in
-- program_source_registry, and only the service role may call it: the body
-- checks the caller's role as well as the grant, so the function is closed even
-- before the grant below is applied.
--
-- Governance: kb/governance_surface_map.json dismisses the workflow with the
-- reason (public catalog data, no student detail; Sam, 2026-10-04: "No need for
-- governance at this point. Everything is public record").

create or replace function public.program_requirement_records_college_load(
  p_college text, p_run text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r       jsonb;
  ins     text[] := '{}';
  kept    text[] := '{}';
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'program_requirement_records_college_load: the service role only';
  end if;
  if p_run is null or p_run !~ '^[0-9]{6,}$' then
    raise exception 'program_requirement_records_college_load: a numeric run id is required';
  end if;
  if p_college is null or not exists (
      select 1 from public.program_source_registry where college = p_college) then
    raise exception 'program_requirement_records_college_load: % is not a registry college', p_college;
  end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if r->>'college' is distinct from p_college then
      raise exception 'program_requirement_records_college_load: a row for % in a load of %',
        r->>'college', p_college;
    end if;
    if coalesce(r->>'extracted_run', p_run) !~ '^[0-9]{6,}$' then
      raise exception 'program_requirement_records_college_load: % carries no numeric run',
        r->>'control_number';
    end if;
    insert into public.program_requirement_records (
      college, control_number, program_title, award, catalog_year, source_url, measure,
      total_min, total_max, record, checks, checked, checked_by, checked_at, extracted_run)
    values (
      p_college, r->>'control_number', r->>'program_title', r->>'award', r->>'catalog_year',
      r->>'source_url', coalesce(r->>'measure', 'units'),
      (r->>'total_min')::numeric, (r->>'total_max')::numeric,
      r->'record', r->'checks', false, null, null,
      coalesce(r->>'extracted_run', p_run)::bigint)
    on conflict (college, control_number) do nothing;
    if found then ins := ins || (r->>'control_number'); else kept := kept || (r->>'control_number'); end if;
  end loop;
  return jsonb_build_object('college', p_college, 'run', p_run,
    'inserted', cardinality(ins), 'kept', cardinality(kept),
    'inserted_keys', to_jsonb(ins), 'kept_keys', to_jsonb(kept));
end
$$;

revoke all on function public.program_requirement_records_college_load(text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.program_requirement_records_college_load(text, text, jsonb)
  to service_role;
