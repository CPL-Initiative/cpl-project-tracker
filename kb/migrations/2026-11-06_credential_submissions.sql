-- credential_submissions: the Credential Catalog's Add your credential route (SkyHarbor, 2026-11-06).
--
-- RULED (Sam, in session 2026-11-06 ~20:55Z, SkyLantern's run): "yes, build the add your credential route", on the
-- design advised in that session: when the Catalog's search finds nothing, Add it with the search words filled in; a
-- short form (name, issuer, kind, a link to the issuer's page, a license lookup or the badge; college and email
-- optional); nothing a visitor types shows until the team verifies it; a verified one joins the Catalog as Not yet
-- evaluated with its asks counted. The prompt for it: the Pierce Articulation Officer's email naming three insurance
-- licenses no record held.
--
-- Shape (Rule 10 a3, mapped before it ships: kb/governance_surface_map.json table:credential_submissions,
-- rpc:credential_submission_add and rpc:credential_submission_decide -> DR-32; rpc:credential_submissions_verified
-- dismissed as a read of verified rows only):
--   * The public writes through ONE SECURITY DEFINER function, credential_submission_add(): INSERT-only, validated,
--     bounded; the same name and issuer already waiting or verified adds no row (it returns false).
--   * A signed-in reviewer decides through ONE SECURITY DEFINER function, credential_submission_decide(): Verify, Merge
--     into an existing credential, Decline, or Reopen. The team phrase does not carry it (a decision right). Each
--     decision appends the row's prior state to history, so a decision rolls back from the row itself (Rule 10 a2).
--   * The public reads ONE function, credential_submissions_verified(): name, issuer, kind and link of verified rows,
--     with the asks counted. No college, email or note, and nothing waiting or declined.
--   * The table has no public policy of any kind. The team reads the rows (team phrase or a reviewer sign-in) in the
--     Exhibits tab's Requests view. Nobody deletes.
-- Privacy (adr-student-detail-aggregate-disclosure-control and the two beside it): a row holds a credential's name,
-- issuer, kind and public link, an optional college, an optional email and an optional note from a member of the
-- public; no student record and no MAP data. The email never leaves the team lane and is never shown there either (the
-- view counts it); the public read carries no field a visitor typed about themselves.
--
-- Apply: the Supabase MCP apply_migration (name credential_submissions), or kb/migrations/.apply through
-- supabase-migrate.yml. Rollback: 2026-11-06_credential_submissions_rollback.sql (export rows first if any).

create table if not exists public.credential_submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null check (char_length(btrim(name)) between 2 and 200),
  issuer        text not null check (char_length(btrim(issuer)) between 2 and 160),
  kind          text not null check (kind in ('license', 'certification', 'badge')),
  link          text not null check (link ~* '^https?://[^[:space:]]+$' and char_length(link) <= 500),
  college       text check (college is null or char_length(college) <= 120),
  email         text check (email is null or (position('@' in email) > 1 and char_length(email) <= 200)),
  note          text check (note is null or char_length(note) <= 1000),
  status        text not null default 'new' check (status in ('new', 'verified', 'merged', 'declined')),
  merged_into   text check (merged_into is null or char_length(merged_into) between 2 and 200),
  decided_by    text,
  decided_at    timestamptz,
  decision_note text check (decision_note is null or char_length(decision_note) <= 1000),
  history       jsonb not null default '[]'::jsonb,
  check (status <> 'merged' or merged_into is not null)
);
create index if not exists credential_submissions_name_idx on public.credential_submissions (lower(name), lower(issuer));
create index if not exists credential_submissions_status_idx on public.credential_submissions (status, created_at desc);

alter table public.credential_submissions enable row level security;

-- The team reads the queue; the public has no policy here at all (its two doors are the functions below).
drop policy if exists credential_submissions_team_read on public.credential_submissions;
create policy credential_submissions_team_read on public.credential_submissions for select
  to anon, authenticated using (public.team_pass_ok() or public.is_allowed_reviewer());

-- Since 2026-10-30 a new table is granted to no API role (tests/supabase_table_grants_test.py): select for the team's
-- policy; the service role for exports. No insert or update for an API role (the definer functions write); no delete.
revoke all on public.credential_submissions from anon, authenticated;
grant select on public.credential_submissions to anon, authenticated;
grant select, insert, update on public.credential_submissions to service_role;

-- The one public write: validated, INSERT-only. Returns true when a row was added, false when the same name and issuer
-- already wait or are verified (the visitor's word still counts there as an ask, through credential_priority_request).
create or replace function public.credential_submission_add(
  p_name text,
  p_issuer text,
  p_kind text,
  p_link text,
  p_college text default null,
  p_email text default null,
  p_note text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_issuer text := btrim(coalesce(p_issuer, ''));
  v_kind text := lower(btrim(coalesce(p_kind, '')));
  v_link text := btrim(coalesce(p_link, ''));
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
begin
  if char_length(v_name) < 2 or char_length(v_name) > 200 then
    raise exception 'name the credential (2 to 200 characters)';
  end if;
  if char_length(v_issuer) < 2 or char_length(v_issuer) > 160 then
    raise exception 'name who issues it (2 to 160 characters)';
  end if;
  if v_kind not in ('license', 'certification', 'badge') then
    raise exception 'the kind is a license, a certification or a badge';
  end if;
  if v_link !~* '^https?://[^[:space:]]+$' or char_length(v_link) > 500 then
    raise exception 'the link is a web address';
  end if;
  if v_email is not null and (position('@' in v_email) <= 1 or char_length(v_email) > 200) then
    raise exception 'the email is not an address';
  end if;
  if exists (select 1 from public.credential_submissions s
              where lower(s.name) = lower(v_name) and lower(s.issuer) = lower(v_issuer) and s.status in ('new', 'verified')) then
    return false;
  end if;
  insert into public.credential_submissions (name, issuer, kind, link, college, email, note)
  values (v_name, v_issuer, v_kind, v_link, nullif(left(btrim(coalesce(p_college, '')), 120), ''), v_email,
          nullif(left(btrim(coalesce(p_note, '')), 1000), ''));
  return true;
end $$;
revoke all on function public.credential_submission_add(text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.credential_submission_add(text, text, text, text, text, text, text) to anon, authenticated, service_role;

-- The team's decision: a signed-in reviewer only. verify | merge (p_merged_into names the existing credential) |
-- decline | reopen (back to new). The prior state goes to history first, so the receipt is the row.
create or replace function public.credential_submission_decide(
  p_id uuid,
  p_decision text,
  p_merged_into text default null,
  p_note text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  who text := nullif(auth.jwt() ->> 'email', '');
  v_dec text := lower(btrim(coalesce(p_decision, '')));
  v_into text := nullif(btrim(coalesce(p_merged_into, '')), '');
  v_status text;
  r public.credential_submissions%rowtype;
begin
  if not public.is_allowed_reviewer() then
    raise exception 'a reviewer sign-in decides a submission';
  end if;
  v_status := case v_dec when 'verify' then 'verified' when 'merge' then 'merged' when 'decline' then 'declined'
                         when 'reopen' then 'new' else null end;
  if v_status is null then
    raise exception 'the decision is verify, merge, decline or reopen';
  end if;
  if v_status = 'merged' and (v_into is null or char_length(v_into) > 200) then
    raise exception 'name the credential it merges into';
  end if;
  select * into r from public.credential_submissions where id = p_id for update;
  if not found then
    raise exception 'no such submission';
  end if;
  update public.credential_submissions
     set history = history || jsonb_build_array(jsonb_build_object('status', r.status, 'merged_into', r.merged_into,
                     'decided_by', r.decided_by, 'decided_at', r.decided_at, 'decision_note', r.decision_note, 'replaced_at', now())),
         status = v_status,
         merged_into = case when v_status = 'merged' then v_into else null end,
         decided_by = case when v_status = 'new' then null else who end,
         decided_at = case when v_status = 'new' then null else now() end,
         decision_note = nullif(left(btrim(coalesce(p_note, '')), 1000), '')
   where id = p_id;
  return v_status;
end $$;
revoke all on function public.credential_submission_decide(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.credential_submission_decide(uuid, text, text, text) to authenticated, service_role;

-- The one public read: verified submissions only, as the Catalog shows them, with the asks counted (the submission
-- itself and every request to prioritize the same name).
create or replace function public.credential_submissions_verified()
returns table (name text, issuer text, kind text, link text, asks bigint)
language sql
stable
security definer
set search_path = public
as $$
  select s.name, s.issuer, s.kind, s.link,
         (select count(*) from public.credential_submissions x where lower(x.name) = lower(s.name) and x.status <> 'declined')
         + (select count(*) from public.credential_priority_requests q where lower(q.credential) = lower(s.name)) as asks
    from public.credential_submissions s
   where s.status = 'verified'
   order by lower(s.name)
$$;
revoke all on function public.credential_submissions_verified() from public, anon, authenticated;
grant execute on function public.credential_submissions_verified() to anon, authenticated, service_role;
