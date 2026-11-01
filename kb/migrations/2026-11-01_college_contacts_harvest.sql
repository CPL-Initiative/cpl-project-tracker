-- 2026-11-01_college_contacts_harvest.sql — the college contacts harvest's table and its one write path.
--
-- Sam, 2026-10-31: "harvest the contacts when it sends runners out to collect our catalog data ... it might be
-- better in the daily for a while until we get a good dataset"; armed on these instructions ("go"). Spec:
-- docs/reference/scheduled_sessions.md, At the start, step 8 (piece 2); lane
-- docs/reference/lanes/map-users-student-contact.md (The weekly contacts harvest). S536 SkySugarberry.
--
-- WHAT A ROW IS: one person in one position at one college, as the college's (or district's) own public
-- site prints it: the position (one word from Sam's list), the title as printed, the name, the email only
-- when the page prints it, and the page it came from. seen_run names the harvest run that last read it.
--
-- WHO READS: reviewers and the team phrase (is_allowed_reviewer() or team_pass_ok()), as map_college_contacts.
-- WHO WRITES: college_contacts_harvest_apply(jsonb) only, under the service role (the harvest's apply job).
-- It upserts on (college, position, email), moves last_seen, and sets gone_since on a row of a college the
-- run read that the run no longer finds; it never deletes. It never writes map_college_contacts or MAP.
--
-- GOVERNANCE (Rule 10 a3): kb/governance_surface_map.json dismisses table:college_contacts_harvest and
-- workflow:college-contacts-harvest.yml with the reason. No student detail.
-- ROLLBACK (Rule 10 a2): each load commits kb/receipts/college_contacts_harvest_<run>.json; the surface
-- retires with 2026-11-01_college_contacts_harvest_rollback.sql.

create table if not exists public.college_contacts_harvest (
  id               bigint generated always as identity primary key,
  college          text not null check (char_length(college) between 2 and 120),
  position         text not null check (position in ('district_ceo', 'college_ceo', 'vice_chancellor',
                     'assoc_vice_chancellor', 'vpaa', 'vpss', 'vpbs', 'assoc_vp', 'dean_cte', 'dean_instruction',
                     'dean_ar', 'vrc', 'articulation_officer')),
  title_as_printed text not null check (char_length(title_as_printed) between 2 and 300),
  name             text not null check (char_length(name) between 2 and 160),
  email            text not null default '' check (email = '' or email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  source_url       text not null check (source_url ~ '^https?://'),
  seen_run         text not null,
  first_seen       timestamptz not null default now(),
  last_seen        timestamptz not null default now(),
  gone_since       timestamptz
);
-- The email is '' when the page prints none, so the key stays one row a person a position a college.
create unique index if not exists college_contacts_harvest_key
  on public.college_contacts_harvest (college, position, lower(email), lower(name));
create index if not exists college_contacts_harvest_college on public.college_contacts_harvest (college, last_seen);

alter table public.college_contacts_harvest enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'college_contacts_harvest' and policyname = 'cch_select') then
    create policy cch_select on public.college_contacts_harvest
      for select using (public.is_allowed_reviewer() or public.team_pass_ok());
  end if;
end
$$;

-- Default privileges grant every privilege on a new table to anon and authenticated; RLS stops row writes
-- but not TRUNCATE. Reads only, under the policy (anon reads only with the team phrase).
revoke all on table public.college_contacts_harvest from public, anon, authenticated;
grant select on table public.college_contacts_harvest to anon, authenticated;
grant select, insert, update on table public.college_contacts_harvest to service_role;
revoke all on sequence public.college_contacts_harvest_id_seq from public, anon, authenticated;
grant usage on sequence public.college_contacts_harvest_id_seq to service_role;

-- p: {"run": "<run id>", "colleges": ["<every college the run read>"], "rows": [{college, position,
-- title_as_printed, name, email, source_url}, ...]}. Returns the counts the receipt records.
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
  select coalesce(array_agg(x), '{}') into v_colleges from jsonb_array_elements_text(coalesce(p -> 'colleges', '[]')) x;
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
  -- A person the run's read of a college no longer finds is marked gone, never deleted.
  update public.college_contacts_harvest
     set gone_since = now()
   where college = any (v_colleges) and seen_run <> v_run and gone_since is null;
  get diagnostics n_gone = row_count;
  return jsonb_build_object('run', v_run, 'colleges', coalesce(array_length(v_colleges, 1), 0),
                            'new', n_new, 'seen_again', n_seen, 'gone', n_gone);
end
$$;

-- Rule 10 b2: PUBLIC holds EXECUTE from creation and default privileges grant anon by name.
revoke all on function public.college_contacts_harvest_apply(jsonb) from public, anon, authenticated;
grant execute on function public.college_contacts_harvest_apply(jsonb) to service_role;
