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
--     unchecked and was read by an earlier extraction run than the posted
--     record's. A person's reading of an unchecked row does not hold it (S392,
--     2026-10-14): Needs a fix sends the note to the reading procedure, and the
--     Records view tells a reviewer who confirms a record failing a machine check
--     that it "stays unchecked after you confirm, until its reading procedure
--     takes the fix and a rerun passes". The rerun is that fix (Sam's Cabrillo
--     Biology 06328, and his reconcile pass). The verdict rows stay in
--     program_record_verdicts; program_requirement_records_follow_verdict applies
--     the latest one while its fingerprint matches the new record, and a record
--     whose requirements the rerun changed waits for a person again. It writes the
--     record's own columns (title, award, catalog year, source, measure, totals,
--     record, checks, extracted_run) and leaves checked, checked_by and display.
--   * A confirm carries over (Sam, Open Asks Sheet 82 card 1, "carry", 2026-10-14
--     22:14Z): when the row's latest verdict is a confirm of the record being
--     replaced, and the posted record keeps every block and every other program
--     field, changing only the totals and the degree's figures
--     (program_record_carry_basis), it adds one confirm row to program_record_verdicts
--     for the new record, in the confirming reviewer's name, with a note naming the
--     verdict it carries and this run. The trigger then marks the row checked when
--     its machine checks pass. Cabrillo Astronomy 06326 is the case: Sam confirmed
--     it, and the reconcile pass added the degree's 60 and its general education 24
--     and dropped the "at least 30 units in the major" the reading had taken for the
--     major's total, with every block the same. program_record_fp is unchanged, so
--     every stored verdict keeps matching the record it was given on.
--   * Every other posted record is reported and left alone: absent (no row; the
--     college load inserts it), held (checked), kept
--     (the row is from the same run or a newer one). Held now means checked.
--   * It returns each replaced row's before-values, and the workflow commits
--     them in the receipt (kb/receipts/program_requirement_records_college_
--     reread_<slug>_<run>.json), which is the rollback (Rule 10 a2): restore the
--     before-values where the row still holds this run, set it unchecked, and
--     delete the confirm rows this run carried (their notes name the run).
-- Rows for another college than p_college are refused, the college must be in
-- program_source_registry, and only the service role may call it.
--
-- Governance: kb/governance_surface_map.json maps it under the workflow and the
-- table (public catalog data, no student detail; Sam, 2026-10-04: "No need for
-- governance at this point. Everything is public record").

-- The requirements a confirm carries across a rerun: the program's fields and every
-- block, leaving out what program_record_fp leaves out (outcomes, careers) and the totals
-- and the degree's figures, the fields a college's reconcile steps fill or clear
-- (kb/program_requirements_reconcile.json; Sheet 82 card 1). Compared as jsonb, which reads 3 and 3.0
-- as the same number; two records with an equal basis differ at most in those figures.
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
               - 'degree_total_minimum',
    'blocks',  coalesce(rec->'blocks', '[]'::jsonb));
$$;
revoke all on function public.program_record_carry_basis(jsonb) from public, anon, authenticated;
grant execute on function public.program_record_carry_basis(jsonb) to service_role;

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
  carried  text[] := '{}';
  before   jsonb := '[]'::jsonb;
  v        public.program_record_verdicts%rowtype;
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
    elsif cur.checked then
      held := held || cur.control_number;
    elsif cur.extracted_run is not null and cur.extracted_run >= new_run then
      kept := kept || cur.control_number;
    else
      before := before || jsonb_build_array(jsonb_build_object(
        'control_number', cur.control_number, 'program_title', cur.program_title, 'award', cur.award,
        'catalog_year', cur.catalog_year, 'source_url', cur.source_url, 'measure', cur.measure,
        'total_min', cur.total_min, 'total_max', cur.total_max, 'record', cur.record,
        'checks', cur.checks, 'extracted_run', cur.extracted_run));
      -- Sheet 82 card 1: the confirm carries over a rerun that changes only the figures.
      select * into v from public.program_record_verdicts
       where college = p_college and control_number = cur.control_number
       order by id desc limit 1;
      if found and v.verdict = 'confirm'
         and v.requirements_fp = public.program_record_fp(cur.record)
         and public.program_record_fp(r->'record') <> v.requirements_fp
         and public.program_record_carry_basis(r->'record') = public.program_record_carry_basis(cur.record) then
        insert into public.program_record_verdicts
          (college, control_number, verdict, note, requirements_fp, checked_after, by_email)
        values (p_college, cur.control_number, 'confirm',
          'Carried over from verdict ' || v.id || ': re-read run ' || p_run || ' changed only the totals '
            || 'and the degree''s figures, with every block the same (Open Asks Sheet 82 card 1).',
          public.program_record_fp(r->'record'), public.program_record_machine_pass(r->'checks'), v.by_email);
        carried := carried || cur.control_number;
      end if;
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
    'kept', cardinality(kept), 'carried', cardinality(carried), 'replaced_keys', to_jsonb(replaced),
    'absent_keys', to_jsonb(absent), 'held_keys', to_jsonb(held), 'kept_keys', to_jsonb(kept),
    'carried_keys', to_jsonb(carried), 'before', before);
end
$$;

revoke all on function public.program_requirement_records_college_reread(text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.program_requirement_records_college_reread(text, text, jsonb)
  to service_role;
