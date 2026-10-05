-- supabase_cpl_library.sql — the Library: one record per deck, film and document
-- the CPL Initiative makes, with a link to where the file lives.
--
-- Sam, 2026-10-05: "I think I may need a COBI tab to store and retrieve artifacts
-- like this ppt and video. Advise". After the mockup
-- (https://claude.ai/artifact/VPpbDp7DD4acvHErVFkCqH) he ruled, by number:
--   1 yes  — build the Library tab;
--   2 Drive — approved files live in the team Drive folder
--             https://drive.google.com/drive/folders/1WNtaaKMGSYsKsdJLxi4fbR24fXD4fGUZ;
--   3 yes  — drafts stop going into the public tracker repo.
--
-- ── Why a record holds a LINK, never the bytes ──────────────────────────────
-- Measured again 2026-10-05: a session's proxy rejects *.supabase.co, so a file
-- uploaded to Storage is one no session can put there or read back. The two
-- upload buckets we built (contract-docs, factsheet-images) hold 0 objects.
-- Same finding, same answer, as kb/supabase_nc_artifacts.sql (2026-08-06).
-- A session reads Drive through the Drive connector; a person drops a large
-- file into the folder.
--
-- ── Doctrine ─────────────────────────────────────────────────────────────────
--   1. Nothing is deleted. A piece that should leave the list gets retired_at;
--      no DELETE policy exists.
--   2. Every edit is reversible from the database itself: the history trigger
--      files the row as it was before each UPDATE (CLAUDE.md Rule 10 a2).
--   3. Provenance is a field: added_by / updated_by on every write.
--   4. A null status or seen_by is "Not set": Sam has not ruled. The tab says
--      so in words, and never guesses.
--
-- RLS: the team phrase (team_pass_ok()) or a signed-in reviewer, for read and
-- write — the nc_artifacts posture. Governance: kb/governance_surface_map.json
-- dismisses both tables with the reason.

-- ── The register ─────────────────────────────────────────────────────────────
create table if not exists public.cpl_library (
  id            uuid primary key default gen_random_uuid(),
  slug          text        not null unique,
  title         text        not null,
  kind          text        not null,             -- deck | film | document
  occasion      text,                             -- groups the list: "Vision 2030 Noncredit Summit"
  made_on       date,
  version       text,                             -- "v1", "3", "4 cuts"
  summary       text,                             -- one line under the title
  extent        text,                             -- "12 slides", "1:41", "2 pages"
  file_type     text,                             -- pptx | mp4 | pdf | docx ...
  status        text,                             -- null = not set
  seen_by       text,                             -- null = not set
  home          text        not null default 'not_filed',
  url           text,                             -- null exactly when home = not_filed
  file_name     text,
  poster        text,                             -- repo path of a title frame (films)
  made_by       text,
  ruling        text,                             -- Sam's words and where he said them
  figures       text,                             -- what the figures are and as of when
  refresh_note  text,                             -- set = figures to refresh; listed under Needs attention
  rebuild_from  text,                             -- the source that rebuilds it
  note          text,
  versions      jsonb       not null default '[]'::jsonb,  -- [{label, date, size, status, url}]
  added_by      text,
  updated_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  retired_at    timestamptz,
  constraint cpl_library_slug_ck     check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  constraint cpl_library_title_ck    check (char_length(title) between 1 and 300),
  constraint cpl_library_kind_ck     check (kind in ('deck', 'film', 'document')),
  constraint cpl_library_status_ck   check (status is null or status in ('draft', 'approved', 'presented')),
  constraint cpl_library_seen_ck     check (seen_by is null or seen_by in ('team', 'colleges', 'public')),
  constraint cpl_library_home_ck     check (home in ('drive', 'public_repo', 'vault', 'web', 'not_filed')),
  constraint cpl_library_filed_ck    check ((home = 'not_filed') = (url is null)),
  constraint cpl_library_url_ck      check (url is null or (url ~ '^https://' and char_length(url) <= 2000)),
  constraint cpl_library_versions_ck check (jsonb_typeof(versions) = 'array'),
  constraint cpl_library_text_ck     check (
    coalesce(char_length(occasion), 0) <= 300 and coalesce(char_length(summary), 0) <= 600
    and coalesce(char_length(ruling), 0) <= 2000 and coalesce(char_length(figures), 0) <= 2000
    and coalesce(char_length(note), 0) <= 2000 and coalesce(char_length(refresh_note), 0) <= 600
    and coalesce(char_length(made_by), 0) <= 300 and coalesce(char_length(rebuild_from), 0) <= 600
    and coalesce(char_length(file_name), 0) <= 600 and coalesce(char_length(poster), 0) <= 300
    and coalesce(char_length(added_by), 0) <= 120 and coalesce(char_length(updated_by), 0) <= 120)
);

create index if not exists cpl_library_live_idx
  on public.cpl_library (made_on desc) where retired_at is null;

-- ── History: the row as it was before every edit ─────────────────────────────
create table if not exists public.cpl_library_history (
  id          bigserial   primary key,
  library_id  uuid        not null,
  changed_at  timestamptz not null default now(),
  changed_by  text,
  before      jsonb       not null
);

create index if not exists cpl_library_history_row_idx
  on public.cpl_library_history (library_id, changed_at desc);

-- Function bodies are single-quoted: the Supabase MCP's apply_migration timed
-- out twice on the dollar-quoted form (2026-10-05) and applied this one at once.
create or replace function public.cpl_library_touch() returns trigger
  language plpgsql set search_path = public as 'begin new.updated_at = now(); return new; end;';

-- SECURITY DEFINER so the trigger can file history that no client may write.
create or replace function public.cpl_library_file_history() returns trigger
  language plpgsql security definer set search_path = public as
  'begin insert into public.cpl_library_history (library_id, changed_by, before) values (old.id, new.updated_by, to_jsonb(old)); return new; end;';

-- A trigger fires without EXECUTE on its function, so close both to clients
-- (Rule 10 b2: PUBLIC holds EXECUTE from creation, and anon is granted by name).
revoke execute on function public.cpl_library_touch() from public, anon, authenticated;
revoke execute on function public.cpl_library_file_history() from public, anon, authenticated;

drop trigger if exists cpl_library_touch_trg on public.cpl_library;
create trigger cpl_library_touch_trg before update on public.cpl_library
  for each row execute function public.cpl_library_touch();

drop trigger if exists cpl_library_history_trg on public.cpl_library;
create trigger cpl_library_history_trg after update on public.cpl_library
  for each row execute function public.cpl_library_file_history();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.cpl_library         enable row level security;
alter table public.cpl_library_history enable row level security;

drop policy if exists cpl_library_read on public.cpl_library;
create policy cpl_library_read on public.cpl_library for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());

drop policy if exists cpl_library_insert on public.cpl_library;
create policy cpl_library_insert on public.cpl_library for insert
  with check (public.team_pass_ok() or public.is_allowed_reviewer());

drop policy if exists cpl_library_update on public.cpl_library;
create policy cpl_library_update on public.cpl_library for update
  using (public.team_pass_ok() or public.is_allowed_reviewer())
  with check (public.team_pass_ok() or public.is_allowed_reviewer());

drop policy if exists cpl_library_history_read on public.cpl_library_history;
create policy cpl_library_history_read on public.cpl_library_history for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());

-- Data API grants, stated here rather than inherited: from 2026-10-30 Supabase
-- stops granting anon, authenticated and service_role on new public tables
-- (tests/supabase_table_grants_test.py). Each command a policy allows is granted
-- to the roles that policy names (no TO clause: anon and authenticated); RLS
-- still decides which rows. service_role publishes and rolls back receipts.
grant select, insert, update on public.cpl_library to anon, authenticated;
grant select, insert, update, delete on public.cpl_library to service_role;
grant select on public.cpl_library_history to anon, authenticated;
grant select, insert on public.cpl_library_history to service_role;
grant usage, select on sequence public.cpl_library_history_id_seq to service_role;

-- No DELETE policy on either table, and no client write on history at all.
revoke delete on public.cpl_library from anon, authenticated;
revoke insert, update, delete on public.cpl_library_history from anon, authenticated;
revoke usage, select on sequence public.cpl_library_history_id_seq from anon, authenticated;
-- Supabase's default grants include TRUNCATE, which row-level security does not
-- govern. PostgREST cannot issue it; revoke it anyway.
revoke truncate, references, trigger on public.cpl_library from anon, authenticated;
revoke truncate, references, trigger on public.cpl_library_history from anon, authenticated;

-- Applied 2026-10-05 as migrations cpl_library_register_tables,
-- cpl_library_register_policies, cpl_library_register_triggers,
-- cpl_library_register_revoke_truncate and cpl_library_register_explicit_grants.
