-- course_outcomes: each course's student learning outcomes, exactly as printed,
-- kept by college and course, and course_outcomes_load(), the one write.
--
-- Sam, Open Asks Sheet 70 card 3 (2026-10-12 20:42Z): "Every course in the loaded
-- records". The harvest reads each course's SLOs exactly as printed and keeps them
-- by college and course; they are what the industry credential skills get matched
-- against, and what faculty read when they assess a CPL request. Card 2's note
-- ("look for other repositories for the outcomes data and record the link and data
-- in prog reqs") is why source_kind names where a row was read: the course outline
-- of record first, another public source where the outline system is closed or
-- prints none.
--
-- The rows come from kb/_course_outcomes_read.py (pages only, filed under
-- kb/course_outcomes/<host>/read_<run>_p<i>of<n>.json) and reach the table through
-- kb/_course_outcomes_load.py, on a runner with the service key, a batch at a time.
--
-- What the load may do, and nothing else:
--   * INSERT a row for an outcomes block the table does not hold: one college, one
--     course, one source, one fingerprint (md5 of the outcomes as printed). A row
--     already there is never touched (ON CONFLICT DO NOTHING, counted as kept); a
--     re-read that finds the same text inserts nothing, and one that finds changed
--     text adds a row beside the old one, so the newest read_run is current.
--   * Rows for a college that is not in program_source_registry are refused, and
--     only the service role may call it: the body checks the caller's role as well
--     as the grant, so the function is closed even before the grant is applied.
--   * It returns the keys it inserted and kept; the load's receipt
--     (kb/receipts/course_outcomes_<host>_<load run>.json) files both, so a load
--     rolls back by its receipt: delete the inserted ids.
--
-- maps_to: the institutional outcomes an outline prints under each SLO (RCCD prints
-- Critical Thinking, Communication Skills and the like as a nested list), one list
-- per outcome, in order; null when the outline prints none.
--
-- Read: public. Course outlines of record are public record with no student
-- detail (Sam, 2026-10-04, on the harvest: "No need for governance at this point.
-- Everything is public record"). kb/governance_surface_map.json dismisses the
-- table and its load function with that reason (Rule 10 a3).

create table if not exists public.course_outcomes (
  id            bigint generated always as identity primary key,
  college       text not null,
  course_code   text not null,
  course_title  text,
  heading       text,
  lead          text,
  outcomes      jsonb not null check (jsonb_typeof(outcomes) = 'array' and jsonb_array_length(outcomes) > 0),
  maps_to       jsonb,
  shape         text not null check (shape in ('list', 'paragraph')),
  fingerprint   text not null check (fingerprint ~ '^[0-9a-f]{32}$'),
  source_url    text not null check (source_url ~ '^https://'),
  source_kind   text not null default 'course_outline'
                check (source_kind in ('course_outline', 'catalog', 'other')),
  source_system text,
  read_run      bigint not null,
  loaded_at     timestamptz not null default now(),
  unique (college, course_code, source_url, fingerprint)
);

create index if not exists course_outcomes_college_course
  on public.course_outcomes (college, course_code, read_run desc);

comment on table public.course_outcomes is
  'Course SLOs exactly as printed, by college and course (Sam, Open Asks Sheet 70 card 3). '
  'Written only by course_outcomes_load() on the service role, insert-only; the newest read_run '
  'per college and course is current. Public read.';

alter table public.course_outcomes enable row level security;

drop policy if exists course_outcomes_read on public.course_outcomes;
create policy course_outcomes_read on public.course_outcomes
  for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.course_outcomes from public, anon, authenticated;
grant select on public.course_outcomes to anon, authenticated;
-- The Data API roles lose default grants on new public tables from 2026-10-30
-- (tests/supabase_table_grants_test.py): the service key's publishers read it too.
grant select on public.course_outcomes to service_role;

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
