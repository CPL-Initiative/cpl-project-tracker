-- csm_log: the CSM Workspace's communications log (S555 SkyTadpole, 2026-11-02; lane csm-workspace, NEXT 1).
--
-- Sam, 2026-11-02: "a CSM workspace for handling the comms (notes, follow ups, acceptances, etc.) for the colleges",
-- and "I will want to extend this to other activities, like onboarding colleges to MAP; communicating on activity
-- cards". One row is one thing the team did or will do with a college: a note, a call, an email copied, a meeting,
-- each with an optional follow-up date the queue counts down to. Rows belong to an ACTIVITY ('funding' today), never
-- to the funding module, so MAP onboarding and the activity cards join without a new table.
--
-- Decision right: DR-09 (kb/governance_surface_map.json), the funding tab's own; the same writers and audience as
-- cpl_funding_notes (the CO Monitor's note): a signed-in reviewer (is_allowed_reviewer()) reads and writes, nothing
-- public reads. Rule 10 a3: the first writer to this table is the workspace's Log form, mapped before it ships.
-- Disclosure (adr-student-detail-aggregate-disclosure-control): a row names a college and the reviewer who wrote it,
-- and its words are the team's working notes about the college's administration; no student detail belongs here,
-- and the form says so.
--
-- Who wrote a row and who closed its follow-up are stamped by the trigger from the caller's JWT, so a writer cannot
-- name someone else. A reviewer may delete a row (a mistaken entry); the log is the team's working record, not an
-- audit trail.
--
-- Apply: point kb/migrations/.apply here (supabase-migrate.yml), or the Supabase MCP apply_migration:
--   file=kb/migrations/2026-11-02_csm_log.sql
--   name=s555_csm_log
-- Rollback: kb/migrations/2026-11-02_csm_log_rollback.sql (drops the table: export the rows first if any were kept).

create table if not exists public.csm_log (
  id            bigserial primary key,
  college       text not null check (char_length(btrim(college)) between 1 and 160),
  activity      text not null default 'funding' check (activity ~ '^[a-z0-9-]{1,40}$'),
  kind          text not null check (kind in ('note', 'call', 'email', 'meeting', 'follow_up')),
  body          text check (body is null or char_length(body) between 1 and 4000),
  follow_up_on  date,
  done_at       timestamptz,
  done_by       text check (done_by is null or char_length(done_by) <= 160),
  by_email      text check (by_email is null or char_length(by_email) <= 160),
  created_at    timestamptz not null default now(),
  constraint csm_log_holds_something check (body is not null or follow_up_on is not null)
);
create index if not exists csm_log_college_idx on public.csm_log (activity, college, created_at desc);
create index if not exists csm_log_due_idx on public.csm_log (follow_up_on) where follow_up_on is not null and done_at is null;

alter table public.csm_log enable row level security;

drop policy if exists csm_log_select on public.csm_log;
create policy csm_log_select on public.csm_log for select
  to anon, authenticated using (public.is_allowed_reviewer());
drop policy if exists csm_log_insert on public.csm_log;
create policy csm_log_insert on public.csm_log for insert
  to anon, authenticated with check (public.is_allowed_reviewer());
drop policy if exists csm_log_update on public.csm_log;
create policy csm_log_update on public.csm_log for update
  to anon, authenticated using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());
drop policy if exists csm_log_delete on public.csm_log;
create policy csm_log_delete on public.csm_log for delete
  to anon, authenticated using (public.is_allowed_reviewer());

-- From 2026-10-30 Supabase grants a new table to no API role (tests/supabase_table_grants_test.py), so the file says
-- them: each command its policies allow, to the roles they name, and the service role for exports.
revoke all on public.csm_log from anon, authenticated;
grant select, insert, update, delete on public.csm_log to anon, authenticated;
grant usage, select on sequence public.csm_log_id_seq to anon, authenticated;
grant select, insert, update, delete on public.csm_log to service_role;
grant usage, select on sequence public.csm_log_id_seq to service_role;

create or replace function public.csm_log_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  who text := nullif(auth.jwt() ->> 'email', '');
begin
  if tg_op = 'INSERT' then
    new.by_email := who;
    new.created_at := now();
    new.done_at := null;
    new.done_by := null;
  else
    -- What was written and by whom stays; an update closes or reopens the follow-up, or corrects the words.
    new.college := old.college;
    new.activity := old.activity;
    new.by_email := old.by_email;
    new.created_at := old.created_at;
    if new.done_at is not null and old.done_at is null then
      new.done_at := now();
      new.done_by := who;
    elsif new.done_at is null then
      new.done_by := null;
    else
      new.done_at := old.done_at;
      new.done_by := old.done_by;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.csm_log_stamp() from public, anon, authenticated;

drop trigger if exists csm_log_stamp on public.csm_log;
create trigger csm_log_stamp before insert or update on public.csm_log
  for each row execute function public.csm_log_stamp();
