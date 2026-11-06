-- course_outcomes.kind: course objectives kept beside the SLOs (SkyMinkowski S584, 2026-11-05).
--
-- Sam, 2026-11-02, S551: "Since we are grabbing leaning outcomes, we should grab course objectives and store them as
-- well. They are often richer descriptions of course content than any other element of the COR and we will need this
-- when we star solving for the edge cases of the common course reference."
--
-- kb/_course_outcomes_read.py now files each page's Course Objectives beside its SLOs; kb/_course_outcomes_load.py
-- posts them as their own rows with kind 'objective'. Every row before this migration is an SLO row, so the column
-- defaults to 'slo'. The unique key gains kind, so an outline that prints the same list under both headings keeps
-- both rows. The load function is unchanged but for reading kind.
--
-- Readers: every SLO reader filters kind=eq.slo from the same pull request (program_requirements.js, cpl_pathways.js,
-- coci_lookup.js, kb/_build_exhibit_slo_neighbors.py, scripts/queue_status.py). Apply this before that code merges:
-- a filter on a missing column answers 400.
--
-- Governance: unchanged. The table stays public record (course outlines of record, no student detail), dismissed in
-- kb/governance_surface_map.json with that reason; the one writer is still course_outcomes_load() on the service role.
--
-- Apply: point kb/migrations/.apply here (supabase-migrate.yml), or the Supabase MCP apply_migration:
--   file=kb/migrations/2026-11-05_course_outcomes_kind.sql
--   name=s584_course_outcomes_kind
-- Rollback: kb/migrations/2026-11-05_course_outcomes_kind_rollback.sql (deletes the objective rows, restores the key
-- and the function, drops the column).

alter table public.course_outcomes
  add column if not exists kind text not null default 'slo';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_outcomes_kind_check') then
    alter table public.course_outcomes add constraint course_outcomes_kind_check check (kind in ('slo', 'objective'));
  end if;
end $$;

alter table public.course_outcomes
  drop constraint if exists course_outcomes_college_course_code_source_url_fingerprint_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_outcomes_college_course_kind_key') then
    alter table public.course_outcomes add constraint course_outcomes_college_course_kind_key
      unique (college, course_code, source_url, kind, fingerprint);
  end if;
end $$;

comment on column public.course_outcomes.kind is
  'slo: the outline''s student learning outcomes. objective: its course objectives (Sam, 2026-11-02). '
  'SLO readers filter kind=eq.slo.';

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
      source_url, source_kind, source_system, read_run, kind)
    values (
      r->>'college', r->>'course_code', r->>'course_title', r->>'heading', r->>'lead',
      r->'outcomes', case when jsonb_typeof(r->'maps_to') = 'array' then r->'maps_to' end,
      r->>'shape', r->>'fingerprint',
      r->>'source_url', coalesce(r->>'source_kind', 'course_outline'), r->>'source_system',
      (r->>'read_run')::bigint, coalesce(r->>'kind', 'slo'))
    on conflict (college, course_code, source_url, kind, fingerprint) do nothing
    returning id into new_id;
    if found then
      ins := ins || jsonb_build_object('id', new_id, 'college', r->>'college', 'course_code', r->>'course_code',
                                       'kind', coalesce(r->>'kind', 'slo'));
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
