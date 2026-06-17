-- Schema of record for the TMC Builder's curator + request layer (applied
-- 2026-06-17 via the Supabase MCP, migrations create_tmc_curator_notes_and_requests
-- + harden). Committed for provenance alongside tmc/supabase_tmc_submissions.sql.

-- 1) GLOBAL curator notes on a TMC course row (one shared note per tmc_id+slot).
--    Public-readable; written ONLY by allowed reviewers (reuses is_allowed_reviewer(),
--    the same gate as kb_curation). map@rccd.edu is the current allowed reviewer; a
--    CCCCO Curriculum-staff account is planned. No student PII.
create table if not exists public.tmc_curator_notes (
  id             bigint generated always as identity primary key,
  tmc_id         text not null,
  slot_key       text not null,                 -- "<sectionIdx>:<slotIdx>"
  note           text not null default '',
  reviewer_email text,
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  constraint tmc_curator_notes_uniq unique (tmc_id, slot_key),
  constraint tmc_curator_notes_len  check (char_length(note) <= 4000),
  constraint tmc_curator_notes_tmc  check (char_length(tmc_id) between 1 and 100),
  constraint tmc_curator_notes_slot check (char_length(slot_key) between 1 and 60)
);
alter table public.tmc_curator_notes enable row level security;
create policy tmc_curator_notes_read   on public.tmc_curator_notes for select to anon, authenticated using (true);
create policy tmc_curator_notes_write  on public.tmc_curator_notes for insert to authenticated with check (public.is_allowed_reviewer());
create policy tmc_curator_notes_update on public.tmc_curator_notes for update to authenticated using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());
create or replace function public.tmc_curator_notes_touch()
  returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists tmc_curator_notes_touch_trg on public.tmc_curator_notes;
create trigger tmc_curator_notes_touch_trg before update on public.tmc_curator_notes
  for each row execute function public.tmc_curator_notes_touch();

-- 2) tmc_requests — a lightweight "request a TMC/ADT be added/reviewed" log.
--    Anyone may submit (anon insert) + read. NOTE: the primary "new request" path
--    in the app is a completed alignment submitted for CO review, which is a
--    public.tmc_submissions row with status='submitted' (see tmc/supabase_tmc_submissions.sql);
--    this table backs free-form requests for disciplines/updates.
create table if not exists public.tmc_requests (
  id            bigint generated always as identity primary key,
  discipline    text not null,
  tmc_id        text,
  college       text,
  reason        text,
  contact_email text,
  status        text not null default 'open',
  created_at    timestamptz not null default now(),
  constraint tmc_requests_disc_len   check (char_length(discipline) between 1 and 200),
  constraint tmc_requests_reason_len check (reason is null or char_length(reason) <= 4000),
  constraint tmc_requests_status_chk check (status in ('open','reviewing','done','declined'))
);
alter table public.tmc_requests enable row level security;
create policy tmc_requests_read   on public.tmc_requests for select to anon, authenticated using (true);
create policy tmc_requests_insert on public.tmc_requests for insert to anon, authenticated with check (true);
