-- cpl_library_pictures: the pictures a Library piece carries (SkyWhirlpool S635, 2026-11-11).
--
-- Sam, 2026-11-11, on the visual made in the Library from a deck's PDF: "the visual didn't include any of the map
-- screenshots from the pdf that the user will need to know how to navigate map. i'd like to edit it in the library
-- (not here)", then "it would be even better if you ... just assemble the pics together with the text from the get
-- go". The Library tab finds a PDF's pictures in the browser (the vendored pdf.js: the rendered page cropped to each
-- placed image, so a deck's highlight boxes stay) and adds each here as one row. library-revise-draft shows them to
-- the model, which says where each goes; scripts/library_publish.py writes each placed picture to
-- library/<slug>/img/<n>.<ext> when the page is published.
--
-- Decision right: the same as cpl_library's (kb/governance_surface_map.json table:cpl_library): the team phrase or a
-- reviewer sign-in adds a picture, covers or crops it, or leaves it out; publishing stays the decision of whoever
-- presses Publish it or Replace the public copy, who confirms the pictures were checked. Rule 10 a3: the first
-- writer is the Library tab (library.js), mapped before it ships (table:cpl_library_pictures).
-- Disclosure (adr-student-detail-aggregate-disclosure-control): a picture is a screen from a document a teammate
-- chose, and a screen can show a person's name or address. The table is read only under the team phrase or a
-- reviewer sign-in; the card shows every picture before publishing, with Cover, Crop and Leave it out; the drafting
-- function names pictures that show personal details; the tab's help says never a student's record.
--
-- Rows are kept: nobody deletes. A picture left out stays as a row with left_out true.
--
-- Apply: the Supabase MCP apply_migration, or point kb/migrations/.apply here (supabase-migrate.yml):
--   file=kb/migrations/2026-11-11_library_pictures.sql
--   name=s635_library_pictures
-- Rollback: kb/migrations/2026-11-11_library_pictures_rollback.sql.

create table if not exists public.cpl_library_pictures (
  id            uuid primary key default gen_random_uuid(),
  library_id    uuid not null references public.cpl_library (id),
  n             integer not null check (n between 1 and 99),
  mime          text not null check (mime in ('image/webp', 'image/png')),
  data          text not null check (char_length(data) between 100 and 1400000 and data ~ '^[A-Za-z0-9+/=]+$'),
  width         integer not null check (width between 1 and 8000),
  height        integer not null check (height between 1 and 8000),
  source_title  text check (source_title is null or char_length(source_title) <= 200),
  page          integer check (page is null or page between 1 and 5000),
  pic_key       text check (pic_key is null or char_length(pic_key) <= 200),
  alt           text check (alt is null or char_length(alt) <= 400),
  left_out      boolean not null default false,
  added_by      text not null check (char_length(btrim(added_by)) between 1 and 160),
  added_at      timestamptz not null default now(),
  changed_by    text check (changed_by is null or char_length(changed_by) <= 160),
  changed_at    timestamptz,
  unique (library_id, n)
);

alter table public.cpl_library_pictures enable row level security;

drop policy if exists cpl_library_pictures_read on public.cpl_library_pictures;
create policy cpl_library_pictures_read on public.cpl_library_pictures for select
  to anon, authenticated using (public.team_pass_ok() or public.is_allowed_reviewer());
drop policy if exists cpl_library_pictures_insert on public.cpl_library_pictures;
create policy cpl_library_pictures_insert on public.cpl_library_pictures for insert
  to anon, authenticated with check (public.team_pass_ok() or public.is_allowed_reviewer());
drop policy if exists cpl_library_pictures_update on public.cpl_library_pictures;
create policy cpl_library_pictures_update on public.cpl_library_pictures for update
  to anon, authenticated using (public.team_pass_ok() or public.is_allowed_reviewer())
  with check (public.team_pass_ok() or public.is_allowed_reviewer());

-- From 2026-10-30 Supabase grants a new table to no API role (tests/supabase_table_grants_test.py): the team reads,
-- adds and changes a picture; the service role reads it to publish; nobody deletes.
revoke all on public.cpl_library_pictures from anon, authenticated;
grant select, insert, update on public.cpl_library_pictures to anon, authenticated;
grant select on public.cpl_library_pictures to service_role;

-- A picture keeps its piece and its number; a change is stamped.
create or replace function public.cpl_library_pictures_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.added_at := now();
    new.changed_at := null;
    return new;
  end if;
  if new.id <> old.id or new.library_id <> old.library_id or new.n <> old.n or new.added_by <> old.added_by
     or new.added_at <> old.added_at then
    raise exception 'a Library picture keeps its piece and its number';
  end if;
  new.changed_at := now();
  return new;
end;
$$;
revoke execute on function public.cpl_library_pictures_guard() from public, anon, authenticated;

drop trigger if exists cpl_library_pictures_guard on public.cpl_library_pictures;
create trigger cpl_library_pictures_guard before insert or update on public.cpl_library_pictures
  for each row execute function public.cpl_library_pictures_guard();
