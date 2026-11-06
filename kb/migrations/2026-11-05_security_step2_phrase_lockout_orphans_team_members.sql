-- Security step 2 (COBIx round 1 items 3, 4, 6 and the team_members half of 8; Sam's go
-- 2026-11-05 ~22:15Z). One migration, four parts. Rollback beside it.
--
-- 1. The three orphan tables (kpi_snapshots_college, kpi_snapshots_statewide, update_log)
--    carried an ALL policy granted to `public` with using(true): anyone with the anon key
--    could write or delete. Nothing reads or writes them any more (last write 2026-04-17;
--    update_log holds 0 rows; the generator reads the update log from the workbook). They
--    close to service_role.
-- 2. The phrase oracle. team_pass_ok() (RLS, the browser, three edge functions, the worker)
--    answers true or false per guess as fast as PostgREST answers. The reads stay STABLE
--    (a VOLATILE function in a policy would run per row), so the writes live in a new
--    VOLATILE team_pass_verify(p_site) that the explicit unlock calls: it records a failure
--    per request IP in team_pass_attempts and locks the IP for 15 minutes after 8 failures
--    in 10 minutes. The STABLE checks consult the lock (a locked IP reads false everywhere).
--    The 250 ms sleep on a mismatch lives only where one request makes one call: in
--    team_pass_verify and in a direct POST to rpc/team_pass_ok, gr_pass_ok or fin_pass_ok
--    (request.path names it). Never in *_pass_check: 89 RLS policies call team_pass_ok()
--    unwrapped, once per row, so a sleep there would stall every table read made with a
--    stale phrase (S588, 2026-11-06, before apply). With no IP header
--    on the request the lock logic skips itself rather than lock everyone under one key.
-- 3. Housekeeping revokes: the *_pass_check functions are reached only through the
--    SECURITY DEFINER *_pass_ok / team_pass_verify, and the two audit trigger functions
--    and the event trigger are never called by a client. is_map_team() stays: two
--    cobi_live_session policies call it as the invoking role.
-- 4. team_members (43 rows: name, email, role, org) was readable by anyone (tm_select true).
--    Its one reader, the RACI tab, sends a reviewer bearer or the team phrase; the nudges
--    builder uses the service key.

begin;

-- ── 1. orphan tables ──────────────────────────────────────────────────────────
drop policy if exists "Service role full access" on public.kpi_snapshots_college;
drop policy if exists "Service role full access" on public.kpi_snapshots_statewide;
drop policy if exists "Allow auth write" on public.update_log;
drop policy if exists "Allow public read" on public.update_log;

create policy kpi_snapshots_college_service on public.kpi_snapshots_college
  for all to service_role using (true) with check (true);
create policy kpi_snapshots_statewide_service on public.kpi_snapshots_statewide
  for all to service_role using (true) with check (true);
create policy update_log_service on public.update_log
  for all to service_role using (true) with check (true);

revoke all on table public.kpi_snapshots_college from public, anon, authenticated;
revoke all on table public.kpi_snapshots_statewide from public, anon, authenticated;
revoke all on table public.update_log from public, anon, authenticated;
grant all on table public.kpi_snapshots_college to service_role;
grant all on table public.kpi_snapshots_statewide to service_role;
grant all on table public.update_log to service_role;

-- ── 2. the phrase lockout ─────────────────────────────────────────────────────
create table if not exists public.team_pass_attempts (
  ip           text primary key,
  fails        integer not null default 0,
  first_fail   timestamptz not null default now(),
  last_seen    timestamptz not null default now(),
  locked_until timestamptz
);
comment on table public.team_pass_attempts is
  'Failed team-phrase unlocks per request IP (team_pass_verify). Definer-only: no API role reads or writes it.';
alter table public.team_pass_attempts enable row level security;
revoke all on table public.team_pass_attempts from public, anon, authenticated;
grant all on table public.team_pass_attempts to service_role;

-- The request's IP as the API gateway forwards it; null when no header names one.
create or replace function public.cpl_request_ip()
returns text
language sql stable
set search_path = ''
as $$
  select nullif(btrim(coalesce(
    nullif(current_setting('request.headers', true)::json ->> 'cf-connecting-ip', ''),
    nullif(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1), ''),
    nullif(current_setting('request.headers', true)::json ->> 'x-real-ip', '')
  )), '');
$$;
revoke execute on function public.cpl_request_ip() from public, anon, authenticated;
grant execute on function public.cpl_request_ip() to service_role;

create or replace function public.team_pass_locked()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_pass_attempts a
    where a.ip = public.cpl_request_ip() and a.locked_until > now()
  );
$$;
revoke execute on function public.team_pass_locked() from public, anon, authenticated;
grant execute on function public.team_pass_locked() to service_role;

create or replace function public.team_pass_check(p text)
returns boolean
language plpgsql stable security definer
set search_path = 'public'
as $$
declare ok boolean;
begin
  if p is null or p = '' then return false; end if;
  if public.team_pass_locked() then return false; end if;
  select exists (
    select 1 from public.team_access
    where id <> 'gr'          -- GR is a site phrase, not a shared-team phrase
      and secret = p
  ) into ok;
  return ok;
end $$;

create or replace function public.gr_pass_check(p text)
returns boolean
language plpgsql stable security definer
set search_path = 'public'
as $$
declare ok boolean;
begin
  if p is null or p = '' then return false; end if;
  if public.team_pass_locked() then return false; end if;
  select exists (select 1 from public.team_access where id = 'gr' and secret = p) into ok;
  return ok;
end $$;

create or replace function public.fin_pass_check(p text)
returns boolean
language plpgsql stable security definer
set search_path = 'public'
as $$
declare ok boolean;
begin
  if p is null or p = '' then return false; end if;
  if public.team_pass_locked() then return false; end if;
  select exists (select 1 from public.team_access where id = 'fin' and secret = p) into ok;
  return ok;
end $$;

-- The RLS readers keep their bodies; a direct RPC call (one per request) pays the sleep.
create or replace function public.team_pass_ok()
returns boolean
language plpgsql stable security definer
set search_path = 'public'
as $$
declare hdr text; ok boolean;
begin
  hdr := nullif(current_setting('request.headers', true)::json ->> 'x-team-pass', '');
  if hdr is null then return false; end if;
  ok := public.team_pass_check(hdr);
  if not ok and current_setting('request.path', true) like '%/rpc/team_pass_ok' then
    perform pg_sleep(0.25);
  end if;
  return ok;
end $$;

create or replace function public.gr_pass_ok()
returns boolean
language plpgsql stable security definer
set search_path = 'public'
as $$
declare hdr text; ok boolean;
begin
  hdr := nullif(current_setting('request.headers', true)::json ->> 'x-team-pass', '');
  if hdr is null then return false; end if;
  ok := public.gr_pass_check(hdr);
  if not ok and current_setting('request.path', true) like '%/rpc/gr_pass_ok' then
    perform pg_sleep(0.25);
  end if;
  return ok;
end $$;

create or replace function public.fin_pass_ok()
returns boolean
language plpgsql stable security definer
set search_path = 'public'
as $$
declare hdr text; ok boolean;
begin
  hdr := nullif(current_setting('request.headers', true)::json ->> 'x-team-pass', '');
  if hdr is null then return false; end if;
  ok := public.fin_pass_check(hdr);
  if not ok and current_setting('request.path', true) like '%/rpc/fin_pass_ok' then
    perform pg_sleep(0.25);
  end if;
  return ok;
end $$;

-- The explicit unlock: the phrase in x-team-pass, the site in the body. Records failures.
create or replace function public.team_pass_verify(p_site text default 'team')
returns boolean
language plpgsql volatile security definer
set search_path = 'public'
as $$
declare
  hdr       text;
  v_ip      text;
  ok        boolean;
  win       constant interval := interval '10 minutes';
  max_fails constant integer  := 8;
  lock_for  constant interval := interval '15 minutes';
begin
  hdr  := nullif(current_setting('request.headers', true)::json ->> 'x-team-pass', '');
  v_ip := public.cpl_request_ip();
  if hdr is null then return false; end if;
  if v_ip is not null and exists (
       select 1 from public.team_pass_attempts a where a.ip = v_ip and a.locked_until > now()) then
    return false;
  end if;
  ok := case coalesce(p_site, 'team')
          when 'gr'  then public.gr_pass_check(hdr)
          when 'fin' then public.fin_pass_check(hdr)
          else            public.team_pass_check(hdr)
        end;
  if not ok then perform pg_sleep(0.25); end if;   -- one call a request: a wrong guess costs a quarter second
  if v_ip is null then return ok; end if;
  delete from public.team_pass_attempts a where a.last_seen < now() - interval '1 day';
  if ok then
    delete from public.team_pass_attempts a where a.ip = v_ip;
    return true;
  end if;
  insert into public.team_pass_attempts as a (ip, fails, first_fail, last_seen)
  values (v_ip, 1, now(), now())
  on conflict (ip) do update set
    fails        = case when a.first_fail < now() - win then 1 else a.fails + 1 end,
    first_fail   = case when a.first_fail < now() - win then now() else a.first_fail end,
    last_seen    = now(),
    locked_until = case when (case when a.first_fail < now() - win then 1 else a.fails + 1 end) >= max_fails
                        then now() + lock_for else a.locked_until end;
  return false;
end $$;
revoke execute on function public.team_pass_verify(text) from public;
grant execute on function public.team_pass_verify(text) to anon, authenticated, service_role;

-- ── 3. housekeeping revokes ───────────────────────────────────────────────────
revoke execute on function public.team_pass_check(text) from public, anon, authenticated;
revoke execute on function public.gr_pass_check(text)   from public, anon, authenticated;
revoke execute on function public.fin_pass_check(text)  from public, anon, authenticated;
grant execute on function public.team_pass_check(text) to service_role;
grant execute on function public.gr_pass_check(text)   to service_role;
grant execute on function public.fin_pass_check(text)  to service_role;
revoke execute on function public.cobi_nav_audit()     from public, anon, authenticated;
revoke execute on function public.sierra_rules_audit() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable()    from public, anon, authenticated;

-- ── 4. team_members reads need a reviewer or the phrase ───────────────────────
drop policy if exists tm_select on public.team_members;
create policy tm_select on public.team_members
  for select to anon, authenticated
  using (public.is_allowed_reviewer() or public.team_pass_ok());

commit;
