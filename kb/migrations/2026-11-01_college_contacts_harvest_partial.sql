-- College contacts harvest: a partial load (S539 SkySilverberry, 2026-11-01).
--
-- WHY: Sam ruled Open Asks Sheet 151 card 1 "vpbs" (VP Administrative Services counts as VPBS). The four rows the
-- harvest had held for that ruling must load without a fresh read. A load that names a college marks every other
-- row of that college gone, so a held-rows load sends {"partial": true, "colleges": []}: the function takes the
-- colleges from its rows and marks nobody gone. Every other load behaves as before.
--
-- WHO WRITES: unchanged, college_contacts_harvest_apply(jsonb) under the service role only (Rule 10 b2 restated).
-- GOVERNANCE: the surface is unchanged (kb/governance_surface_map.json); no new writer, no student detail.
-- ROLLBACK (Rule 10 a2): rerun the function block of 2026-11-01_college_contacts_harvest.sql.

create or replace function public.college_contacts_harvest_apply(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run      text := nullif(btrim(coalesce(p ->> 'run', '')), '');
  v_colleges text[];
  r          jsonb;
  n_new      int := 0;
  n_seen     int := 0;
  n_gone     int := 0;
  v_id       bigint;
begin
  if v_run is null then
    raise exception 'college_contacts_harvest_apply: the run is named' using errcode = '22023';
  end if;
  if coalesce((p ->> 'partial')::boolean, false) then
    -- A partial load (held rows a ruling released) read no college whole: its rows name their colleges,
    -- and it marks nobody gone.
    if jsonb_array_length(coalesce(p -> 'colleges', '[]')) > 0 then
      raise exception 'college_contacts_harvest_apply: a partial load names no colleges' using errcode = '22023';
    end if;
    select coalesce(array_agg(distinct r2 ->> 'college'), '{}') into v_colleges
      from jsonb_array_elements(coalesce(p -> 'rows', '[]')) r2;
  else
    select coalesce(array_agg(x), '{}') into v_colleges from jsonb_array_elements_text(coalesce(p -> 'colleges', '[]')) x;
  end if;
  for r in select * from jsonb_array_elements(coalesce(p -> 'rows', '[]')) loop
    if not ((r ->> 'college') = any (v_colleges)) then
      raise exception 'college_contacts_harvest_apply: % is not among the colleges the run read', r ->> 'college'
        using errcode = '22023';
    end if;
    update public.college_contacts_harvest
       set title_as_printed = r ->> 'title_as_printed', source_url = r ->> 'source_url',
           seen_run = v_run, last_seen = now(), gone_since = null
     where college = r ->> 'college' and position = r ->> 'position'
       and lower(email) = lower(coalesce(r ->> 'email', '')) and lower(name) = lower(r ->> 'name')
    returning id into v_id;
    if v_id is null then
      insert into public.college_contacts_harvest (college, position, title_as_printed, name, email, source_url, seen_run)
      values (r ->> 'college', r ->> 'position', r ->> 'title_as_printed', r ->> 'name',
              coalesce(r ->> 'email', ''), r ->> 'source_url', v_run);
      n_new := n_new + 1;
    else
      n_seen := n_seen + 1;
    end if;
    v_id := null;
  end loop;
  -- A person the run's read of a college no longer finds is marked gone, never deleted. A partial load
  -- read no college whole, so it marks nobody.
  if not coalesce((p ->> 'partial')::boolean, false) then
    update public.college_contacts_harvest
       set gone_since = now()
     where college = any (v_colleges) and seen_run <> v_run and gone_since is null;
    get diagnostics n_gone = row_count;
  end if;
  return jsonb_build_object('run', v_run, 'colleges', coalesce(array_length(v_colleges, 1), 0),
                            'new', n_new, 'seen_again', n_seen, 'gone', n_gone);
end
$$;

-- Rule 10 b2: PUBLIC holds EXECUTE from creation and default privileges grant anon by name.
revoke all on function public.college_contacts_harvest_apply(jsonb) from public, anon, authenticated;
grant execute on function public.college_contacts_harvest_apply(jsonb) to service_role;
