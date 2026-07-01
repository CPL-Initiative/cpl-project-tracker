-- Schema of record for the TMC Builder's Supabase store (applied 2026-06-16 via
-- the Supabase MCP, migrations create_tmc_submissions +
-- harden_tmc_submissions_touch_search_path). Committed here for provenance, the
-- same way kb/supabase_*.sql mirror the curation/budget schema.
--
-- Each row = one college's alignment of its local courses to a Transfer Model
-- Curriculum (ADT) template. INSTITUTIONAL CURRICULUM DATA ONLY — no student PII.
-- The authoritative submission path is the exported form (.docx / print / JSON);
-- this table is the resume/track store + a seed for a future statewide adoption
-- view. Public, no-login tool, so anon may read (resume), insert, and update
-- (upsert/edit). The always-true anon INSERT/UPDATE policies are DELIBERATE and
-- mirror the project's existing anon-write tables (chat_interactions,
-- cpl_reflections); if abuse appears, move writes behind the magic-link reviewer
-- auth like kb_curation.

create table if not exists public.tmc_submissions (
  id                bigint generated always as identity primary key,
  college           text not null,
  tmc_id            text not null,
  tmc_discipline    text,
  degree_type       text,
  alignments        jsonb not null default '{}'::jsonb,
  notes             text,
  contact_name      text,
  contact_email     text,
  status            text not null default 'draft',
  total_major_units numeric,
  filled_slots      integer,
  total_slots       integer,
  -- CO review receipts (migrations tmc_submissions_co_review_states +
  -- tmc_submissions_review_server_gate, 2026-07-01, Session 92 follow-on):
  -- an approval is a Chancellor's-Office authority claim, so it is SERVER-
  -- gated — these columns are revoked from direct anon/authenticated writes
  -- and set only by the is_allowed_reviewer()-checked RPC
  -- tmc_review_submission(college, tmc_id, status, note); reviewed_by comes
  -- from the JWT. Anon INSERT/UPDATE keep the deliberate college draft flow
  -- but WITH CHECK (status in ('draft','submitted')) — anon can never mint
  -- approved/returned.
  review_note       text,
  reviewed_by       text,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint tmc_submissions_college_tmc_uniq unique (college, tmc_id),
  constraint tmc_submissions_college_len check (char_length(college) between 1 and 200),
  constraint tmc_submissions_tmc_len     check (char_length(tmc_id) between 1 and 100),
  constraint tmc_submissions_notes_len   check (notes is null or char_length(notes) <= 8000),
  constraint tmc_submissions_cname_len   check (contact_name  is null or char_length(contact_name)  <= 200),
  constraint tmc_submissions_cemail_len  check (contact_email is null or char_length(contact_email) <= 200),
  constraint tmc_submissions_status_chk  check (status in ('draft','submitted','approved','returned')),
  constraint tmc_submissions_review_note_len check (review_note is null or char_length(review_note) <= 8000),
  constraint tmc_submissions_reviewed_by_len check (reviewed_by is null or char_length(reviewed_by) <= 200),
  constraint tmc_submissions_align_size  check (octet_length(alignments::text) <= 262144)
);

alter table public.tmc_submissions enable row level security;

create policy tmc_submissions_anon_select on public.tmc_submissions
  for select to anon using (true);
create policy tmc_submissions_anon_insert on public.tmc_submissions
  for insert to anon with check (status in ('draft','submitted'));
create policy tmc_submissions_anon_update on public.tmc_submissions
  for update to anon using (true) with check (status in ('draft','submitted'));

-- the review receipt columns are not directly writable by the API roles —
-- only the SECURITY DEFINER review RPC below sets them
revoke insert (review_note, reviewed_by, reviewed_at) on public.tmc_submissions from anon, authenticated;
revoke update (review_note, reviewed_by, reviewed_at) on public.tmc_submissions from anon, authenticated;

-- the CO review gate: requires an allowed reviewer's JWT (Authorization
-- bearer); stamps reviewed_by from the token, never from the client payload
create or replace function public.tmc_review_submission(
  p_college text, p_tmc_id text, p_status text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_allowed_reviewer() then
    raise exception 'not an allowed reviewer';
  end if;
  if p_status not in ('approved','returned') then
    raise exception 'invalid review status %', p_status;
  end if;
  update public.tmc_submissions
     set status      = p_status,
         review_note = nullif(trim(coalesce(p_note,'')), ''),
         reviewed_by = coalesce(auth.jwt() ->> 'email', 'reviewer'),
         reviewed_at = now()
   where college = p_college and tmc_id = p_tmc_id;
  if not found then
    raise exception 'no submission for % / %', p_college, p_tmc_id;
  end if;
end $$;

revoke execute on function public.tmc_review_submission(text,text,text,text) from public, anon;
grant execute on function public.tmc_review_submission(text,text,text,text) to authenticated;

create or replace function public.tmc_submissions_touch()
  returns trigger language plpgsql
  set search_path = ''
  as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists tmc_submissions_touch_trg on public.tmc_submissions;
create trigger tmc_submissions_touch_trg
  before update on public.tmc_submissions
  for each row execute function public.tmc_submissions_touch();
