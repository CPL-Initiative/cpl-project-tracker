-- program_requirement_records_college_reread(): a newer read replaces an unchecked record.
--
-- The program requirements harvest (docs/reference/lanes/program-requirements-harvest.md).
-- The college load (program_requirement_records_college_load) inserts a record
-- for a program the table does not hold and never touches a row already there,
-- so a re-read of a loaded program could never reach the table. Two re-reads
-- need it (S389):
--   * Sam, Open Asks Sheet 78 card 2 (2026-10-14, "Record both figures"):
--     record shape 5 keeps the degree total and the general education units a
--     page prints, and the records whose arithmetic was incomplete for want of
--     them are read again (Cabrillo's 55 live rows).
--   * Palo Verde's catalog year: the census moves it to its 2026-27 Acalog
--     catalog, and its 52 loaded records were read from 2025-26.
--
-- What it may do, and nothing else:
--   * UPDATE one row per posted record, of p_college, when the row is still
--     unchecked, carries no person's reading (program_record_verdicts), and was
--     read by an earlier extraction run than the posted record's. It writes the
--     record's own columns (title, award, catalog year, source, measure, totals,
--     record, checks, extracted_run) and leaves checked, checked_by and display.
--   * Every other posted record is reported and left alone: absent (no row; the
--     college load inserts it), held (checked, or a person has read it), kept
--     (the row is from the same run or a newer one).
--   * It returns each replaced row's before-values, and the workflow commits
--     them in the receipt (kb/receipts/program_requirement_records_college_
--     reread_<slug>_<run>.json), which is the rollback (Rule 10 a2): restore the
--     before-values where the row still holds this run and is still unchecked.
-- Rows for another college than p_college are refused, the college must be in
-- program_source_registry, and only the service role may call it.
--
-- Governance: kb/governance_surface_map.json maps it under the workflow and the
-- table (public catalog data, no student detail; Sam, 2026-10-04: "No need for
-- governance at this point. Everything is public record").

create or replace function public.program_requirement_records_college_reread(
  p_college text, p_run text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r        jsonb;
  cur      public.program_requirement_records%rowtype;
  new_run  bigint;
  replaced text[] := '{}';
  absent   text[] := '{}';
  held     text[] := '{}';
  kept     text[] := '{}';
  before   jsonb := '[]'::jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'program_requirement_records_college_reread: the service role only';
  end if;
  if p_run is null or p_run !~ '^[0-9]{6,}$' then
    raise exception 'program_requirement_records_college_reread: a numeric run id is required';
  end if;
  if p_college is null or not exists (
      select 1 from public.program_source_registry where college = p_college) then
    raise exception 'program_requirement_records_college_reread: % is not a registry college', p_college;
  end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if r->>'college' is distinct from p_college then
      raise exception 'program_requirement_records_college_reread: a row for % in a re-read of %',
        r->>'college', p_college;
    end if;
    if coalesce(r->>'extracted_run', '') !~ '^[0-9]{6,}$' then
      raise exception 'program_requirement_records_college_reread: % carries no numeric run',
        r->>'control_number';
    end if;
    new_run := (r->>'extracted_run')::bigint;
    select * into cur from public.program_requirement_records
     where college = p_college and control_number = r->>'control_number'
     for update;
    if not found then
      absent := absent || (r->>'control_number');
    elsif cur.checked or exists (
        select 1 from public.program_record_verdicts v
         where v.college = p_college and v.control_number = cur.control_number) then
      held := held || cur.control_number;
    elsif cur.extracted_run is not null and cur.extracted_run >= new_run then
      kept := kept || cur.control_number;
    else
      before := before || jsonb_build_array(jsonb_build_object(
        'control_number', cur.control_number, 'program_title', cur.program_title, 'award', cur.award,
        'catalog_year', cur.catalog_year, 'source_url', cur.source_url, 'measure', cur.measure,
        'total_min', cur.total_min, 'total_max', cur.total_max, 'record', cur.record,
        'checks', cur.checks, 'extracted_run', cur.extracted_run));
      update public.program_requirement_records set
        program_title = r->>'program_title', award = r->>'award', catalog_year = r->>'catalog_year',
        source_url = r->>'source_url', measure = coalesce(r->>'measure', 'units'),
        total_min = (r->>'total_min')::numeric, total_max = (r->>'total_max')::numeric,
        record = r->'record', checks = r->'checks', extracted_run = new_run
       where college = p_college and control_number = cur.control_number and checked = false;
      replaced := replaced || cur.control_number;
    end if;
  end loop;
  return jsonb_build_object('college', p_college, 'run', p_run,
    'replaced', cardinality(replaced), 'absent', cardinality(absent), 'held', cardinality(held),
    'kept', cardinality(kept), 'replaced_keys', to_jsonb(replaced), 'absent_keys', to_jsonb(absent),
    'held_keys', to_jsonb(held), 'kept_keys', to_jsonb(kept), 'before', before);
end
$$;

revoke all on function public.program_requirement_records_college_reread(text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.program_requirement_records_college_reread(text, text, jsonb)
  to service_role;
