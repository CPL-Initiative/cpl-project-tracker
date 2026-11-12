-- first_light_marks + first_light_apply_requests: the First Light tab's marks and its Apply (S643 SkyLark, 2026-11-12).
--
-- Applied through kb/migrations/.apply (name s643_first_light_marks) after four readers reviewed it, by the
-- conductor's decision; supabase-migrate.yml applies it on the push and commits the receipt to the branch.
--
-- Sam, 2026-11-12 (#3153, relayed by COBIx): "add a cobi tab so I can edit it", and "make it so I can add more
-- photos from our my cpl story series or other collections". Design: #3153 comment 6826461825 (the conductor),
-- read by COBIx in 6829695812. A signed-in reviewer marks a painting or a photo keep, drop, add or a position in
-- COBI's First Light tab (#first-light); Apply files one request row; first-light-apply.yml reads the marks, writes
-- the selection and the hero list, and opens ONE pull request. Sam merges it. Nothing auto-merges.
--
-- first_light_marks — insert only, numbered by the database. The latest mark per item wins on read (first_light_tab.js resolveSet: the
-- latest keep/drop/add decides whether an item is in, and the latest position decides where it sits). No update
-- or delete is granted to anyone, so a newer mark is the only way to change one, and every mark stays as history.
--
-- first_light_apply_requests — the Apply button's request, in a table of its own so the hourly look reads a few
-- rows (COBIx finding 2). A client inserts a pending row and nothing else; only the service role (the workflow)
-- stamps it with the pull request's link. One pending request at a time (a unique partial index): a second Apply
-- while one waits is refused, and the tab says one is already waiting.
--
-- Gates, each earned:
--   * Writers and readers are a reviewer sign-in only (is_allowed_reviewer(), the check the other reviewer-only
--     writes use, and the rung of the tab's cobi_nav row, audience magic_link). The team phrase names nobody, and
--     the point of a mark is who and when. marked_by / requested_by come from the sign-in by trigger, never the
--     client.
--   * No anon grant at all. No update or delete for any client role on either table.
--   * The service role reads the marks and reads and stamps the requests (the workflow's SUPABASE_SERVICE_KEY).
--
-- Governance (Rule 10 a3): kb/governance_surface_map.json table:first_light_marks and
-- table:first_light_apply_requests. Disclosure (adr-student-detail-aggregate-disclosure-control): no student data.
-- A row names a painting file, a photo file or a My CPL Story photo, all already public (the paintings on Wikimedia
-- Commons, the story photos on MAP's own site at map.rccd.edu/cplstories), plus the reviewer's sign-in email.
--
-- Apply: the Supabase MCP apply_migration, or point kb/migrations/.apply here (supabase-migrate.yml):
--   file=kb/migrations/2026-11-12_first_light_marks.sql
--   name=s643_first_light_marks
-- After applying, read back (each should say service_role true, anon false, authenticated false):
--   select p, has_function_privilege('service_role', p, 'execute') as service_role,
--          has_function_privilege('anon', p, 'execute') as anon,
--          has_function_privilege('authenticated', p, 'execute') as authenticated
--   from unnest(array['public.first_light_marks_stamp()', 'public.first_light_apply_requests_stamp()']) as p;
-- Rollback: kb/migrations/2026-11-12_first_light_marks_rollback.sql.

-- Plain create table: a second run fails loudly instead of passing over a table that differs from this file.
-- id is an identity column a client cannot set (GENERATED ALWAYS; PostgREST has no OVERRIDING), and the resolver
-- orders marks by it, so only the database decides which mark is the latest.
create table public.first_light_marks (
  id          bigint generated always as identity primary key,
  item_set    text not null check (item_set in ('paintings', 'photos')),
  item_key    text not null check (char_length(item_key) between 1 and 300),
  mark        text not null check (mark in ('keep', 'drop', 'add', 'position')),
  position    integer check (position is null or position between 1 and 5000),
  collection  text not null check (collection in ('rotation', 'gallery_candidates', 'hero_photos', 'my_cpl_story', 'repo_folder')),
  marked_by   text not null default '',
  marked_at   timestamptz not null default now(),
  constraint first_light_marks_position_only_on_position check ((mark = 'position') = (position is not null)),
  constraint first_light_marks_collection_fits_set check (
    (item_set = 'paintings' and collection in ('rotation', 'gallery_candidates'))
    or (item_set = 'photos' and collection in ('hero_photos', 'my_cpl_story', 'repo_folder'))),
  -- A key is a file name the workflow writes or looks up, never a path out of its folder or markup.
  -- Photos: library/photos/<file> or library/photos/stories/<file>. Paintings: a Wikimedia Commons file name.
  constraint first_light_marks_key_shape check (
    (item_set = 'photos' and item_key ~ '^(stories/)?[a-z0-9][a-z0-9._-]{0,150}\.(png|jpe?g|webp)$'
      and position('..' in item_key) = 0)
    or (item_set = 'paintings' and item_key !~ '[/\\<>`|@[:cntrl:]]' and left(item_key, 1) <> '.'
      and btrim(item_key) = item_key))
);
create index first_light_marks_item_idx on public.first_light_marks (item_set, item_key, id desc);

create table public.first_light_apply_requests (
  id            bigint generated always as identity primary key,
  status        text not null default 'pending' check (status in ('pending', 'opened', 'updated', 'nothing', 'failed')),
  requested_by  text not null default '',
  requested_at  timestamptz not null default now(),
  handled_at    timestamptz,
  pr_number     integer check (pr_number is null or pr_number > 0),
  pr_url        text check (pr_url is null or pr_url ~* '^https://github\.com/CPL-Initiative/cpl-project-tracker/pull/[0-9]+$'),
  run_url       text check (run_url is null or run_url ~* '^https://github\.com/CPL-Initiative/cpl-project-tracker/actions/runs/[0-9]+'),
  detail        text check (detail is null or char_length(detail) <= 2000)
);
-- One pending request at a time: the hourly look and the dispatch handle it; a second Apply waits for it.
create unique index first_light_apply_one_pending on public.first_light_apply_requests (status)
  where status = 'pending';

-- Who and when come from the sign-in and the clock, never the client.
create or replace function public.first_light_marks_stamp() returns trigger
  language plpgsql security invoker set search_path = public, pg_catalog as
$$
begin
  new.marked_by := coalesce(auth.jwt() ->> 'email', current_user);
  new.marked_at := now();
  return new;
end;
$$;

-- A client files a pending request and nothing more; the workflow stamps the rest with the service key.
create or replace function public.first_light_apply_requests_stamp() returns trigger
  language plpgsql security invoker set search_path = public, pg_catalog as
$$
begin
  new.requested_by := coalesce(auth.jwt() ->> 'email', current_user);
  new.requested_at := now();
  new.status := 'pending';
  new.handled_at := null;
  new.pr_number := null;
  new.pr_url := null;
  new.run_url := null;
  new.detail := null;
  return new;
end;
$$;

-- Rule 10 b2: service_role holds an explicit grant first, then PUBLIC and both API roles lose EXECUTE.
grant execute on function public.first_light_marks_stamp() to service_role;
grant execute on function public.first_light_apply_requests_stamp() to service_role;
revoke execute on function public.first_light_marks_stamp() from public, anon, authenticated;
revoke execute on function public.first_light_apply_requests_stamp() from public, anon, authenticated;

drop trigger if exists first_light_marks_stamp_trg on public.first_light_marks;
create trigger first_light_marks_stamp_trg before insert on public.first_light_marks
  for each row execute function public.first_light_marks_stamp();
drop trigger if exists first_light_apply_requests_stamp_trg on public.first_light_apply_requests;
create trigger first_light_apply_requests_stamp_trg before insert on public.first_light_apply_requests
  for each row execute function public.first_light_apply_requests_stamp();

alter table public.first_light_marks enable row level security;
alter table public.first_light_apply_requests enable row level security;

drop policy if exists first_light_marks_read on public.first_light_marks;
create policy first_light_marks_read on public.first_light_marks for select
  to authenticated using (public.is_allowed_reviewer());
drop policy if exists first_light_marks_insert on public.first_light_marks;
create policy first_light_marks_insert on public.first_light_marks for insert
  to authenticated with check (public.is_allowed_reviewer());
drop policy if exists first_light_apply_requests_read on public.first_light_apply_requests;
create policy first_light_apply_requests_read on public.first_light_apply_requests for select
  to authenticated using (public.is_allowed_reviewer());
drop policy if exists first_light_apply_requests_insert on public.first_light_apply_requests;
create policy first_light_apply_requests_insert on public.first_light_apply_requests for insert
  to authenticated with check (public.is_allowed_reviewer());

-- Data API grants, stated rather than inherited (tests/supabase_table_grants_test.py). A reviewer reads and adds;
-- nobody updates or deletes a mark; only the service role stamps a request.
revoke all on public.first_light_marks from anon, authenticated;
revoke all on public.first_light_apply_requests from anon, authenticated;
grant select, insert on public.first_light_marks to authenticated;
grant select, insert on public.first_light_apply_requests to authenticated;
grant select on public.first_light_marks to service_role;
grant select, update on public.first_light_apply_requests to service_role;
