-- 2026-11-09 (S621 SkyBlackEye): the CSM funding door. #2983 (COBIx, from Sam during the MAP CSM session,
-- 11:12-11:20 AM PT): the Auth mailer is capped at two emails an hour for the whole project, which locked the team out
-- this morning; Sam wants a door that sends no Auth email, with an approval: "The person requests access by
-- submitting their email in the same login space. Sam, Malone, Kristen, and Natalie are the approvers."
--
-- How it works:
--   1. funding_access_request(email, secret_hash) (anon): a Team RACI address gets a pending request. The requester's
--      browser keeps the secret; the table holds only its SHA-256. Nothing is mailed.
--   2. funding_access_pending() / funding_access_decide(id, verdict): an approver (on the reviewer list AND one of the
--      four named in team_members) sees and rules on it in the CSM Workspace. Approve grants funding_access for 30 days.
--   3. The Edge Function funding-door (service role) checks the secret, marks the request claimed once, and mints that
--      person's own Auth session with admin generate_link + verify: no Auth email, so the two-an-hour cap never applies.
--   4. is_funding_reviewer() = is_allowed_reviewer() OR a live funding_access row. It replaces is_allowed_reviewer() in
--      the funding and CSM surfaces ONLY (below). is_allowed_reviewer() is unchanged, so Admin, Team Phrases and every
--      other reviewer-only surface stay closed to a door session; no one is added to allowed_reviewers.
-- No address enters the repo. Rule 10 a3: mapped in kb/governance_surface_map.json. Rollback beside it.

create table if not exists public.funding_access_requests (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  secret_hash  text not null check (secret_hash ~ '^[0-9a-f]{64}$'),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'claimed')),
  requested_at timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   text,
  claimed_at   timestamptz
);
create index if not exists funding_access_requests_email on public.funding_access_requests (lower(email), requested_at desc);
alter table public.funding_access_requests enable row level security;
revoke all on table public.funding_access_requests from public, anon, authenticated;

create table if not exists public.funding_access (
  email      text primary key,
  granted_by text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  revoked_at timestamptz
);
alter table public.funding_access enable row level security;
revoke all on table public.funding_access from public, anon, authenticated;

create or replace function public.is_funding_reviewer()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_allowed_reviewer() or exists (
    select 1 from public.funding_access fa
    where lower(fa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and fa.revoked_at is null and fa.expires_at > now());
$$;

-- The four approvers, by name in Team RACI; the address is matched on its local part, so Natalie's rccd.edu and
-- vendor.rccd.edu both count. The reviewer list is still required.
create or replace function public.is_funding_approver()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_allowed_reviewer() and exists (
    select 1 from public.team_members tm
    where tm.org = 'MAP' and tm.active
      and tm.name in ('Samuel Lee', 'Malone Dunlavy', 'Kristen Himmerick', 'Natalie Powell')
      and split_part(lower(tm.email), '@', 1) = split_part(lower(coalesce(auth.jwt() ->> 'email', '')), '@', 1));
$$;

-- Ask. Answers the same words whether or not the address is on the team, so the door says nothing about who is.
create or replace function public.funding_access_request(p_email text, p_secret_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, ''))); rid uuid;
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' or coalesce(p_secret_hash, '') !~ '^[0-9a-f]{64}$' then
    return json_build_object('ok', false, 'why', 'bad_request');
  end if;
  if (select count(*) from public.funding_access_requests where requested_at > now() - interval '1 hour') >= 60 then
    return json_build_object('ok', false, 'why', 'busy');
  end if;
  if (select count(*) from public.funding_access_requests where lower(email) = e and requested_at > now() - interval '10 minutes') >= 3 then
    return json_build_object('ok', false, 'why', 'wait');
  end if;
  if not exists (select 1 from public.team_members tm where tm.active and lower(tm.email) = e)
     and not exists (select 1 from public.allowed_reviewers ar where lower(ar.email) = e) then
    return json_build_object('ok', true, 'id', null);
  end if;
  insert into public.funding_access_requests (email, secret_hash) values (e, p_secret_hash) returning id into rid;
  return json_build_object('ok', true, 'id', rid);
end $$;

-- The requester's tab asks after its own request, by id and the secret's hash.
create or replace function public.funding_access_status(p_id uuid, p_secret_hash text)
returns text language sql stable security definer set search_path = public as $$
  select case when r.status = 'approved' and r.decided_at < now() - interval '30 minutes' then 'expired' else r.status end
  from public.funding_access_requests r where r.id = p_id and r.secret_hash = p_secret_hash;
$$;

create or replace function public.funding_access_pending()
returns table (id uuid, email text, name text, role text, requested_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.email, tm.name, tm.role, r.requested_at
  from public.funding_access_requests r
  left join public.team_members tm on lower(tm.email) = lower(r.email)
  where public.is_funding_approver() and r.status = 'pending' and r.requested_at > now() - interval '1 day'
  order by r.requested_at;
$$;

create or replace function public.funding_access_decide(p_id uuid, p_verdict text)
returns json language plpgsql security definer set search_path = public as $$
declare me text := lower(coalesce(auth.jwt() ->> 'email', '')); r public.funding_access_requests;
begin
  if not public.is_funding_approver() then return json_build_object('ok', false, 'why', 'not_an_approver'); end if;
  if p_verdict not in ('approve', 'deny') then return json_build_object('ok', false, 'why', 'bad_verdict'); end if;
  update public.funding_access_requests set status = case when p_verdict = 'approve' then 'approved' else 'denied' end,
         decided_at = now(), decided_by = me
   where id = p_id and status = 'pending' returning * into r;
  if r.id is null then return json_build_object('ok', false, 'why', 'not_pending'); end if;
  if p_verdict = 'approve' then
    insert into public.funding_access (email, granted_by) values (r.email, me)
    on conflict (email) do update set granted_by = excluded.granted_by, granted_at = now(),
      expires_at = now() + interval '30 days', revoked_at = null;
  end if;
  return json_build_object('ok', true, 'status', r.status);
end $$;

revoke all on function public.is_funding_reviewer(), public.is_funding_approver(),
  public.funding_access_request(text, text), public.funding_access_status(uuid, text),
  public.funding_access_pending(), public.funding_access_decide(uuid, text) from public, anon, authenticated;
grant execute on function public.is_funding_reviewer(), public.is_funding_approver() to anon, authenticated, service_role;
grant execute on function public.funding_access_request(text, text), public.funding_access_status(uuid, text) to anon, authenticated, service_role;
grant execute on function public.funding_access_pending(), public.funding_access_decide(uuid, text) to authenticated, service_role;

-- The funding and CSM surfaces take is_funding_reviewer(): the policies on these seven tables and the bodies of these
-- four read functions, rewritten in place (is_allowed_reviewer() -> is_funding_reviewer()); nothing else changes.
do $$
declare p record; f text; d text;
begin
  for p in select tablename, policyname, qual, with_check from pg_policies
           where schemaname = 'public'
             and tablename in ('cpl_funding_participation', 'cpl_funding_nc_attestation', 'cpl_funding_notes', 'csm_log',
                               'map_college_contacts', 'map_college_users', 'map_college_nudges')
             and (coalesce(qual, '') like '%is_allowed_reviewer()%' or coalesce(with_check, '') like '%is_allowed_reviewer()%')
  loop
    execute format('alter policy %I on public.%I', p.policyname, p.tablename)
      || case when p.qual is not null then format(' using (%s)', replace(p.qual, 'is_allowed_reviewer()', 'is_funding_reviewer()')) else '' end
      || case when p.with_check is not null then format(' with check (%s)', replace(p.with_check, 'is_allowed_reviewer()', 'is_funding_reviewer()')) else '' end;
  end loop;
  foreach f in array array['cpl_funding_optin_review', 'cpl_funding_nc_attestation_review',
                           'cpl_funding_requester_context', 'map_landing_contacts_roster'] loop
    select pg_get_functiondef(pr.oid) into d from pg_proc pr join pg_namespace n on n.oid = pr.pronamespace
     where n.nspname = 'public' and pr.proname = f;
    if d is not null and d like '%is_allowed_reviewer()%' then
      execute replace(d, 'is_allowed_reviewer()', 'is_funding_reviewer()');
    end if;
  end loop;
end $$;
-- Read-back:
--   select count(*) from pg_policies where schemaname='public' and (qual like '%is_funding_reviewer()%' or with_check like '%is_funding_reviewer()%');
--   select proname from pg_proc where prosrc like '%is_funding_reviewer()%';
