-- supabase_program_source_addenda_read.sql — the reading agent's write to
-- program_source_addenda: which programs an addendum changes, and when.
--
-- The table's own file (kb/supabase_program_source_addenda.sql, S326) names this
-- writer: "The reading agent sets read / applied and programs_changed (a later
-- function, same pattern, once the reader exists)." The reader is the college page
-- read (kb/_college_page_read.py); its first eight addenda were read in run
-- 38504437775 (S387) and filed by S388 from kb/addenda_reads/.
--
-- p_rows: a JSON array, one object per addendum read:
--   {id, published_on, effective_term, programs_changed}
-- programs_changed is an array, one object per change the addendum prints:
--   {scope: 'program' | 'course', control_number, title, award, course,
--    change_kind: 'new' | 'revised' | 'retitled' | 'discontinued' | 'corrected',
--    change, effective, dated}
-- control_number is COCI's when the program is there, else null (a program new
-- this year is often not yet in the COCI snapshot). An empty array means the
-- addendum was read and names no program or course change.
--
-- WHAT IT CHANGES: status listed -> read, and read_run, read_at, published_on,
-- effective_term, programs_changed. It never touches a row a person corrected
-- (corrected_by set) or a row already applied, gone or ruled not an addendum.
-- A second read of the same addendum replaces the first (status read stays read).
--
-- REVERSIBLE (Rule 10 a2): the table's history trigger copies each old row into
-- program_source_addenda_history with changed_by = p_run_id (the trigger names
-- read_run when it changes). A read rolls back by restoring those rows.
--
-- PRIVILEGES (Rule 10 b2): service_role only. The table is SECURITY INVOKER-written
-- with no insert or update policy, so RLS alone keeps anon and authenticated out;
-- the revoke closes EXECUTE, which PUBLIC holds from creation.

create or replace function public.program_source_addenda_read(p_run_id text, p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  r      jsonb;
  n_read int := 0;
  n_skip int := 0;
  skipped jsonb := '[]'::jsonb;
begin
  if p_run_id is null or length(p_run_id) < 6 then
    raise exception 'program_source_addenda_read: a run id is required';
  end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if jsonb_typeof(r->'programs_changed') is distinct from 'array' then
      raise exception 'program_source_addenda_read: addendum % has no programs_changed array', r->>'id';
    end if;
    update public.program_source_addenda set
      status           = 'read',
      read_run         = p_run_id,
      read_at          = now(),
      published_on     = nullif(r->>'published_on', '')::date,
      effective_term   = nullif(r->>'effective_term', ''),
      programs_changed = r->'programs_changed'
    where id = (r->>'id')::bigint
      and corrected_by is null
      and status in ('listed', 'read');
    if found then
      n_read := n_read + 1;
    else
      n_skip := n_skip + 1;
      skipped := skipped || to_jsonb(r->>'id');
    end if;
  end loop;
  return jsonb_build_object('run_id', p_run_id, 'read', n_read, 'skipped', n_skip,
                            'skipped_ids', skipped);
end
$$;

revoke all on function public.program_source_addenda_read(text, jsonb) from public, anon, authenticated;
grant execute on function public.program_source_addenda_read(text, jsonb) to service_role;
