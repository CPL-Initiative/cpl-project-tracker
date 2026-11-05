-- cpl_library_drafts: a revision of a public Library page drafted from its card (SkyBarnard S577, 2026-11-05).
--
-- Sam, 2026-11-05, in session, on SkyMice's plan for revising a visual from the Library card without a session:
-- "Build it." A teammate asks for changes on the card (Revise and remediate: refresh_note, sources, regen) and
-- presses Draft it now; the edge function library-revise-draft reads the piece's public copy on GitHub Pages, asks
-- Claude for edits to it, and stores the edited page here as one row. The card then offers the draft and Replace the
-- public copy. The library-publish workflow (scripts/library_publish.py, service key) writes an approved draft to
-- library/<slug>/index.html, stamps published_at and published_commit here, and moves the record.
--
-- Decision right: the same as cpl_library's (kb/governance_surface_map.json table:cpl_library): the team phrase or a
-- reviewer sign-in drafts; replacing a public copy stays the decision of whoever presses Replace the public copy,
-- which the record's regen keeps. Rule 10 a3: the first writer is library-revise-draft, mapped before it ships
-- (table:cpl_library_drafts, function:library-revise-draft, workflow:library-publish.yml).
-- Disclosure (adr-student-detail-aggregate-disclosure-control): a row holds a public page and the words a teammate
-- typed; the tab's help says never a student's record, and the function's instructions forbid copying a person's
-- email, phone or ID number onto the page.
--
-- Rows are kept: a draft is never edited or deleted by the team (no update or delete policy), so the public page's
-- history is readable from here and from git. Only the service role stamps a publish.
--
-- Apply: point kb/migrations/.apply here (supabase-migrate.yml), or the Supabase MCP apply_migration:
--   file=kb/migrations/2026-11-05_library_drafts.sql
--   name=s577_library_drafts
-- Rollback: kb/migrations/2026-11-05_library_drafts_rollback.sql (drops the table; export the rows first if any).

create table if not exists public.cpl_library_drafts (
  id                uuid primary key default gen_random_uuid(),
  library_id        uuid not null references public.cpl_library (id),
  slug              text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  html              text not null check (char_length(html) between 1 and 2000000),
  based_on          text check (based_on is null or char_length(based_on) <= 500),
  request           jsonb,
  summary           text check (summary is null or char_length(summary) <= 2000),
  edits             integer check (edits is null or edits between 0 and 200),
  model             text check (model is null or char_length(model) <= 80),
  made_by           text not null check (char_length(btrim(made_by)) between 1 and 160),
  made_at           timestamptz not null default now(),
  published_at      timestamptz,
  published_commit  text check (published_commit is null or published_commit ~ '^[0-9a-f]{7,40}$')
);
create index if not exists cpl_library_drafts_library_idx on public.cpl_library_drafts (library_id, made_at desc);

alter table public.cpl_library_drafts enable row level security;

drop policy if exists cpl_library_drafts_read on public.cpl_library_drafts;
create policy cpl_library_drafts_read on public.cpl_library_drafts for select
  to anon, authenticated using (public.team_pass_ok() or public.is_allowed_reviewer());
drop policy if exists cpl_library_drafts_insert on public.cpl_library_drafts;
create policy cpl_library_drafts_insert on public.cpl_library_drafts for insert
  to anon, authenticated with check (public.team_pass_ok() or public.is_allowed_reviewer());

-- From 2026-10-30 Supabase grants a new table to no API role (tests/supabase_table_grants_test.py): select and insert
-- for the team's policies, select and update for the service role's publish stamp; nobody deletes.
revoke all on public.cpl_library_drafts from anon, authenticated;
grant select, insert on public.cpl_library_drafts to anon, authenticated;
grant select, insert, update on public.cpl_library_drafts to service_role;

-- A draft says when it was made; only the service role stamps a publish, and nothing else changes after insert.
create or replace function public.cpl_library_drafts_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.made_at := now();
    new.published_at := null;
    new.published_commit := null;
    return new;
  end if;
  if new.id <> old.id or new.library_id <> old.library_id or new.slug <> old.slug or new.html <> old.html
     or new.made_by <> old.made_by or new.made_at <> old.made_at then
    raise exception 'a Library draft is kept as made; only its publish stamp changes';
  end if;
  return new;
end;
$$;
revoke execute on function public.cpl_library_drafts_guard() from public, anon, authenticated;

drop trigger if exists cpl_library_drafts_guard on public.cpl_library_drafts;
create trigger cpl_library_drafts_guard before insert or update on public.cpl_library_drafts
  for each row execute function public.cpl_library_drafts_guard();
