-- cpl_comms — the Letters, Memos & Reports register: one row per communication the
-- CPL Initiative drafts (an email to CEOs, a CO memo, a MAP Team note, a report, a
-- flyer), with its status, audience, recipients by ROLE, and a body that carries
-- merge fields the tab fills from live data at render time.
--
-- Sam, 2026-10-23 (the side session beside S457): "set this up on our COBI Letter,
-- Memos, Reports tab ... expanded for any type of communication I need to craft that
-- needs to incorporate current data and contacts for various roles in the system
-- that we may already store (e.g., CEO name and email and current CPL metrics)."
-- "Would need to incorporate a status (draft, final, tabled), a search bar for easy
-- navigation, audience selector, comm type (email, CO memo, MAP Team note, report,
-- flyer, etc.)" and "a way to post to COBI Library".
--
-- A ROW HOLDS ROLES, NEVER ADDRESSES. to_roles / cc_roles name columns of
-- map_college_contacts (ceo, vpaa = the CIO, vpss = the CSSO, ...), which MAP syncs
-- daily and which stays behind the team phrase. The tab joins the roster at render
-- time, so a stale address is never frozen into a letter and no contact is copied
-- into a second table (Rule 10 a3: the recipients' privacy posture is the roster's).
-- The body keeps its merge fields ({college}, {ceo_name}, {jst_pct} ...) as typed;
-- the merged text per college exists only in the browser, the clipboard, a mail
-- client's compose window, or the CSV a mail merge reads.
--
-- Nothing deletes. Retire sets retired_at, and every edit files the prior row in
-- cpl_comms_history (a trigger), so any change can be undone from the database
-- (Rule 10 a2). Reads and writes need the team phrase or a reviewer sign-in, the
-- same gate as cpl_library and map_college_contacts.
--
-- Posting to the Library (Sam's item 4) writes a cpl_library row (kind document,
-- home web, the link to this record's own place in the tab) and stores its id in
-- library_id, so the two registers point at each other and never copy content.
--
-- Applied 2026-10-23 through the session's apply_migration (migration cpl_comms).
-- Grants are explicit (tests/supabase_table_grants_test.py: from 2026-10-30 a new
-- table carries no Data API grants unless its own SQL grants them).

create table if not exists public.cpl_comms (
  id            uuid primary key default gen_random_uuid(),
  slug          text        not null unique,
  title         text        not null,
  comm_type     text        not null default 'email',   -- email | memo | team_note | report | flyer | letter | other
  audience      text        not null default 'ceos',    -- ceos | cios | cssos | cpl_leads | vrc | faculty | co | map_team | colleges | public | other
  status        text        not null default 'draft',   -- draft | final | tabled
  to_roles      text[]      not null default '{}',      -- map_college_contacts columns: ceo, vpaa, vpss, primary_contact, cpl_coordinator, ...
  cc_roles      text[]      not null default '{}',
  colleges      text[],                                 -- null = every college in the roster; else these college names
  subject       text,                                   -- the email subject or the memo's RE line
  body          text        not null default '',        -- plain text with merge fields in braces
  sender        text,                                   -- the signature block's name and title
  cc_note       text,                                   -- a cc line that is not a role (a named office, a partner)
  occasion      text,                                   -- what prompted it: "7th Annual CPL Summit", "ESS 25-82 follow-up"
  figures_as_of text,                                   -- what the merge figures are and when they were read
  sent_on       date,
  note          text,
  library_id    uuid,                                   -- the cpl_library record Post to Library made
  made_by       text,
  added_by      text,
  updated_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  retired_at    timestamptz,
  constraint cpl_comms_slug_ck    check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  constraint cpl_comms_title_ck   check (char_length(title) between 1 and 300),
  constraint cpl_comms_type_ck    check (comm_type in ('email', 'memo', 'team_note', 'report', 'flyer', 'letter', 'other')),
  constraint cpl_comms_status_ck  check (status in ('draft', 'final', 'tabled')),
  constraint cpl_comms_audience_ck check (audience in ('ceos', 'cios', 'cssos', 'cpl_leads', 'vrc', 'faculty', 'co', 'map_team', 'colleges', 'public', 'other')),
  constraint cpl_comms_body_ck    check (char_length(body) <= 40000),
  constraint cpl_comms_text_ck    check (
    coalesce(char_length(subject), 0) <= 300 and coalesce(char_length(sender), 0) <= 600
    and coalesce(char_length(cc_note), 0) <= 600 and coalesce(char_length(occasion), 0) <= 300
    and coalesce(char_length(figures_as_of), 0) <= 600 and coalesce(char_length(note), 0) <= 2000
    and coalesce(char_length(made_by), 0) <= 300 and coalesce(char_length(added_by), 0) <= 120
    and coalesce(char_length(updated_by), 0) <= 120)
);
create index if not exists cpl_comms_live_idx
  on public.cpl_comms (updated_at desc) where retired_at is null;

create table if not exists public.cpl_comms_history (
  id        bigserial   primary key,
  comms_id  uuid        not null,
  changed_at timestamptz not null default now(),
  changed_by text,
  before    jsonb       not null
);
create index if not exists cpl_comms_history_row_idx
  on public.cpl_comms_history (comms_id, changed_at desc);

create or replace function public.cpl_comms_touch() returns trigger
  language plpgsql set search_path = public as 'begin new.updated_at = now(); return new; end;';
create or replace function public.cpl_comms_file_history() returns trigger
  language plpgsql security definer set search_path = public as
  'begin insert into public.cpl_comms_history (comms_id, changed_by, before) values (old.id, new.updated_by, to_jsonb(old)); return new; end;';
revoke execute on function public.cpl_comms_touch() from public, anon, authenticated;
revoke execute on function public.cpl_comms_file_history() from public, anon, authenticated;

drop trigger if exists cpl_comms_touch_trg on public.cpl_comms;
create trigger cpl_comms_touch_trg before update on public.cpl_comms
  for each row execute function public.cpl_comms_touch();
drop trigger if exists cpl_comms_history_trg on public.cpl_comms;
create trigger cpl_comms_history_trg after update on public.cpl_comms
  for each row execute function public.cpl_comms_file_history();

alter table public.cpl_comms         enable row level security;
alter table public.cpl_comms_history enable row level security;

drop policy if exists cpl_comms_read on public.cpl_comms;
create policy cpl_comms_read on public.cpl_comms for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());
drop policy if exists cpl_comms_insert on public.cpl_comms;
create policy cpl_comms_insert on public.cpl_comms for insert
  with check (public.team_pass_ok() or public.is_allowed_reviewer());
drop policy if exists cpl_comms_update on public.cpl_comms;
create policy cpl_comms_update on public.cpl_comms for update
  using (public.team_pass_ok() or public.is_allowed_reviewer())
  with check (public.team_pass_ok() or public.is_allowed_reviewer());
drop policy if exists cpl_comms_history_read on public.cpl_comms_history;
create policy cpl_comms_history_read on public.cpl_comms_history for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());

-- Data API grants: each command a policy allows, to each role the policy names
-- (no TO clause means PUBLIC: anon and authenticated), and everything to the
-- service role the cron and the receipts write with. No delete policy, and delete
-- is revoked: a record retires, it never disappears.
grant select, insert, update on public.cpl_comms to anon, authenticated;
grant all on public.cpl_comms to service_role;
revoke delete on public.cpl_comms from anon, authenticated;
grant select on public.cpl_comms_history to anon, authenticated;
grant all on public.cpl_comms_history to service_role;
revoke insert, update, delete on public.cpl_comms_history from anon, authenticated;
grant usage, select on sequence public.cpl_comms_history_id_seq to service_role;
