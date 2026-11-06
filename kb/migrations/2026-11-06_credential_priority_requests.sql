-- credential_priority_requests: the Credential Catalog's statewide route (SkyLoop, 2026-11-06).
--
-- RULED (Sam, Open Asks Sheet 162, 15:16Z 2026-11-06, his own call): "Reframe it as a public request to prioritize
-- review of a credential. The idea is that we could collect requests to help us better prioritize our work without
-- promising any one person that we would evaluate their credential--that would be left to the discretion of local
-- colleges." So the public page's word is "Ask us to prioritize this credential"; a request is a count beside a
-- credential, never an evaluation promise, and no reply is owed to the requester.
--
-- Shape (Rule 10 a3, mapped before it ships: kb/governance_surface_map.json rpc:credential_priority_request and
-- table:credential_priority_requests -> DR-31; rpc:credential_priority_counts dismissed as an aggregate read):
--   * The public writes through ONE SECURITY DEFINER function, credential_priority_request(): INSERT-only, validated,
--     bounded; the same email asking for the same credential within a day adds no row (it returns the count).
--   * The public reads ONE aggregate, credential_priority_counts(): credential and how many asked, nothing else.
--   * The table has no public policy of any kind. The team reads the rows (team phrase or a reviewer sign-in) from the
--     Commons' Exhibits List queue; the service role stamps status. Nobody deletes.
-- Privacy (adr-student-detail-aggregate-disclosure-control and the two beside it): a row holds a credential name, an
-- optional college, an optional email and an optional note from a member of the public; no student record and no MAP
-- data. The email never leaves the team lane; the public aggregate carries no row-level field. A count of requests is a
-- count of asks, not of students, so the k=10 rule does not apply to it; the page says the count is the signal.
--
-- Apply: the Supabase MCP apply_migration (name credential_priority_requests), or kb/migrations/.apply through
-- supabase-migrate.yml. Rollback: 2026-11-06_credential_priority_requests_rollback.sql (export rows first if any).

create table if not exists public.credential_priority_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  credential  text not null check (char_length(btrim(credential)) between 2 and 200),
  issuer      text check (issuer is null or char_length(issuer) <= 160),
  college     text check (college is null or char_length(college) <= 120),
  email       text check (email is null or (position('@' in email) > 1 and char_length(email) <= 200)),
  note        text check (note is null or char_length(note) <= 1000),
  source      text not null default 'catalog' check (source in ('catalog', 'commons')),
  status      text not null default 'new' check (status in ('new', 'noted', 'prioritized', 'closed'))
);
create index if not exists credential_priority_requests_cred_idx on public.credential_priority_requests (lower(credential), created_at desc);

alter table public.credential_priority_requests enable row level security;

-- The team reads the queue; the public has no policy here at all (its two doors are the functions below).
drop policy if exists credential_priority_requests_team_read on public.credential_priority_requests;
create policy credential_priority_requests_team_read on public.credential_priority_requests for select
  to anon, authenticated using (public.team_pass_ok() or public.is_allowed_reviewer());

-- Since 2026-10-30 a new table is granted to no API role (tests/supabase_table_grants_test.py): select for the team's
-- policy; select and the status stamp for the service role; no insert for anon (the definer function inserts); no delete.
revoke all on public.credential_priority_requests from anon, authenticated;
grant select on public.credential_priority_requests to anon, authenticated;
grant select, insert, update on public.credential_priority_requests to service_role;

-- The one public write: validated, INSERT-only, returns how many have asked for this credential.
create or replace function public.credential_priority_request(
  p_credential text,
  p_issuer text default null,
  p_college text default null,
  p_email text default null,
  p_note text default null,
  p_source text default 'catalog'
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cred text := btrim(coalesce(p_credential, ''));
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_n integer;
begin
  if char_length(v_cred) < 2 or char_length(v_cred) > 200 then
    raise exception 'name the credential (2 to 200 characters)';
  end if;
  if v_email is not null and (position('@' in v_email) <= 1 or char_length(v_email) > 200) then
    raise exception 'the email is not an address';
  end if;
  if coalesce(p_source, 'catalog') not in ('catalog', 'commons') then
    raise exception 'unknown source';
  end if;
  -- The same person asking again for the same credential within a day adds no row.
  if v_email is null or not exists (
    select 1 from public.credential_priority_requests r
     where lower(r.credential) = lower(v_cred) and r.email = v_email and r.created_at > now() - interval '1 day') then
    insert into public.credential_priority_requests (credential, issuer, college, email, note, source)
    values (v_cred, nullif(left(btrim(coalesce(p_issuer, '')), 160), ''), nullif(left(btrim(coalesce(p_college, '')), 120), ''),
            v_email, nullif(left(btrim(coalesce(p_note, '')), 1000), ''), coalesce(p_source, 'catalog'));
  end if;
  select count(*) into v_n from public.credential_priority_requests r where lower(r.credential) = lower(v_cred);
  return v_n;
end $$;
revoke all on function public.credential_priority_request(text, text, text, text, text, text) from public;
grant execute on function public.credential_priority_request(text, text, text, text, text, text) to anon, authenticated, service_role;

-- The one public read: the count beside each credential, and nothing else from the row.
create or replace function public.credential_priority_counts()
returns table (credential text, n bigint)
language sql
stable
security definer
set search_path = public
as $$
  select min(r.credential) as credential, count(*) as n
    from public.credential_priority_requests r
   group by lower(r.credential)
   order by n desc, 1
$$;
revoke all on function public.credential_priority_counts() from public;
grant execute on function public.credential_priority_counts() to anon, authenticated, service_role;
