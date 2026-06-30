-- ─────────────────────────────────────────────────────────────────────────
-- map_college_users — gated roster of MAP "College Users & Roles" (StarMax,
-- Session 87, 2026-06-30)
--
-- The COBI "MAP Users" tab manages the MAP platform's per-college user roster
-- (View_CollegeUsersRoles_APIDataset, category #9 — 2,741 rows of staff
-- names + emails + role assignments) so the team can nudge colleges to keep it
-- current. This is **staff PII** — it was deliberately dropped from the daily
-- fetch (Session 34) so it never lands on the Action runner's committed output
-- or the public repo. It lives ONLY here, in this gated table, synced
-- server-side by map/sync_map_users.py via the Supabase service key.
--
-- #1 RULE: MAP user PII is NEVER committed to the repo. Public visitors see
-- AGGREGATES ONLY (per-college counts + the 7-way RoleName mix) via the
-- SECURITY DEFINER map_users_summary() RPC; the raw roster (names/emails/
-- username) is readable only by a magic-link reviewer or a shared-team-phrase
-- user — the same gate as item_raci / project_lifecycle.
--
-- Schema captured from the MAP Builder + a value-signature probe (PR #618; the
-- Session-88 probe confirmed 16 fields). API columns: College, CollegeId,
-- FirstName, LastName, Email, RoleName, UserName + (Session 88) UserStatus
-- (∈ {Active, Inactive}), UserDisciplines (comma-delimited), LastUpdatedOn
-- (MAP's per-user last-update date) — all case-sensitive. `Active` (True/False)
-- is the redundant boolean twin of UserStatus → not synced. MAP's LastUpdatedOn
-- is now the per-user staleness signal (vs OUR synced_at = whole-table refresh).
--
-- Applied live via the Supabase MCP; this file is the schema of record.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.map_college_users (
  id          bigserial primary key,
  college     text not null,
  college_id  text,
  first_name  text,
  last_name   text,
  email       text,
  role_name   text,
  username    text,
  -- Session 88: the 3 fields Sam added to the Custom Report (value-signature
  -- confirmed). user_status ∈ {Active, Inactive}; disciplines is comma-delimited
  -- (~35% populated); last_updated_on is MAP's per-user last-update date (text —
  -- 10-char, locale format kept verbatim). Disciplines + last_updated_on are
  -- reviewer-gated (roster only); user_status feeds the public active_count.
  user_status     text,
  disciplines     text,
  last_updated_on text,
  synced_at   timestamptz not null default now()
);
create index if not exists mcu_college_idx on public.map_college_users (college);
create index if not exists mcu_role_idx    on public.map_college_users (role_name);

alter table public.map_college_users enable row level security;

-- NO anon SELECT policy → the public anon key CANNOT read raw rows (staff PII).
-- Reviewers (magic-link) and shared-team-phrase users CAN read the roster —
-- the is_allowed_reviewer() OR team_pass_ok() gate used by item_raci /
-- project_lifecycle. The service role (the sync) bypasses RLS.
drop policy if exists mcu_select on public.map_college_users;
create policy mcu_select on public.map_college_users for select
  using (is_allowed_reviewer() or team_pass_ok());

-- NO insert/update/delete policies at all → the anon/authenticated roles can
-- never write. MAP is the source of truth; only the service-role sync mutates
-- this table (it bypasses RLS), and reviewers nudge colleges to update MAP
-- rather than editing here.

-- ── Public AGGREGATE surface (no PII) ─────────────────────────────────────
-- Per-college user count + role mix + last-synced, exposed to anon so the tab's
-- public view shows "N users, role breakdown, last refreshed" WITHOUT any row
-- access. SECURITY DEFINER so it reads the table past RLS; returns only counts.
-- active_count (UserStatus='Active') added Session 88 — still no PII. Disciplines
-- / last_updated_on are NOT exposed here (per-user → reviewer-gated roster only).
drop function if exists public.map_users_summary();
create or replace function public.map_users_summary()
returns table (college text, user_count bigint, active_count bigint,
              role_mix jsonb, last_synced timestamptz)
language sql stable security definer set search_path = public as $$
  with per_role as (
    select college,
           coalesce(nullif(role_name, ''), '(unspecified)') as role,
           count(*)::int as n,
           sum(case when user_status = 'Active' then 1 else 0 end)::int as act,
           max(synced_at) as synced
    from public.map_college_users
    group by college, coalesce(nullif(role_name, ''), '(unspecified)')
  )
  select college,
         sum(n)::bigint                as user_count,
         sum(act)::bigint              as active_count,
         jsonb_object_agg(role, n)     as role_mix,
         max(synced)                   as last_synced
  from per_role
  group by college;
$$;
revoke all on function public.map_users_summary() from public;
grant execute on function public.map_users_summary() to anon, authenticated, service_role;

-- ── Transactional full-refresh (service-role only) ───────────────────────
-- The sync re-fetches the entire view each run (MAP is authoritative), so the
-- refresh is a delete-all + insert-all done ATOMICALLY in one statement-pair so
-- the table is never observed empty / doubled. SECURITY DEFINER + revoked from
-- the public/anon roles → only the service role (the runner sync) can call it.
create or replace function public.map_users_replace(p_rows jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  -- Explicit WHERE: Supabase's pg-safeupdate guard blocks an unqualified
  -- DELETE through the PostgREST API roles ("DELETE requires a WHERE clause").
  delete from public.map_college_users where true;
  insert into public.map_college_users
        (college, college_id, first_name, last_name, email, role_name, username,
         user_status, disciplines, last_updated_on, synced_at)
  select r.college, r.college_id, r.first_name, r.last_name, r.email,
         r.role_name, r.username,
         nullif(r.user_status, ''), nullif(r.disciplines, ''),
         nullif(r.last_updated_on, ''), now()
  from jsonb_to_recordset(p_rows) as r(
         college text, college_id text, first_name text, last_name text,
         email text, role_name text, username text,
         user_status text, disciplines text, last_updated_on text)
  where coalesce(r.college, '') <> '';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.map_users_replace(jsonb) from public, anon, authenticated;
grant execute on function public.map_users_replace(jsonb) to service_role;
