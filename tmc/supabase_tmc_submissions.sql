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
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint tmc_submissions_college_tmc_uniq unique (college, tmc_id),
  constraint tmc_submissions_college_len check (char_length(college) between 1 and 200),
  constraint tmc_submissions_tmc_len     check (char_length(tmc_id) between 1 and 100),
  constraint tmc_submissions_notes_len   check (notes is null or char_length(notes) <= 8000),
  constraint tmc_submissions_cname_len   check (contact_name  is null or char_length(contact_name)  <= 200),
  constraint tmc_submissions_cemail_len  check (contact_email is null or char_length(contact_email) <= 200),
  constraint tmc_submissions_status_chk  check (status in ('draft','submitted')),
  constraint tmc_submissions_align_size  check (octet_length(alignments::text) <= 262144)
);

alter table public.tmc_submissions enable row level security;

create policy tmc_submissions_anon_select on public.tmc_submissions
  for select to anon using (true);
create policy tmc_submissions_anon_insert on public.tmc_submissions
  for insert to anon with check (true);
create policy tmc_submissions_anon_update on public.tmc_submissions
  for update to anon using (true) with check (true);

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
