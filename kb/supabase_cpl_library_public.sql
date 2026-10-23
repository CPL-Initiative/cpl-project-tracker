-- supabase_cpl_library_public.sql — the public Library: the pieces Sam lists for
-- anyone to open, read by the public page (library/index.html) and by Sierra.
--
-- Sam, 2026-10-20 (DSP side session): "a public library I can copy them over to and
-- set view permissions in the Admin tab", then "Maybe give me a toggle to copy over
-- from the Private library to the public one... Copy or move...to save space." He
-- approved the mock-up (https://claude.ai/artifact/Ebz253XFREqAni5D3sgVP9): "Mock up
-- looks great!" And: "It would be great if Sierra could access the info in the public
-- library... present links to appropriate library artifacts."
--
-- ── One record, a switch, never a copy ───────────────────────────────────────
-- A listed piece is the same cpl_library row with public_listed set. Nothing is
-- copied, so nothing can drift and nothing takes space twice. Unlisting takes it off
-- the page and out of Sierra's answers at once.
--
-- ── What goes public ─────────────────────────────────────────────────────────
-- Only what cpl_library_public() returns: title, kind, occasion, made_on, the
-- public summary, topics, the link, and who the piece is made for (for_kind,
-- for_category, for_name; Sam, Sheet 120, 2026-10-23). Notes, briefs, made_by, rebuild_from,
-- versions and the internal summary stay behind the team phrase. The public summary
-- is its own column because the internal one is written for the team.
--
-- ── Who decides ──────────────────────────────────────────────────────────────
-- Listing takes the team phrase or a reviewer sign-in (Sam, 2026-10-23 18:50Z, his
-- own call, reversing his 2026-10-20 reviewer-only call: "can you set the Library
-- page to be editable with Team phrase and not just magic link? I want the team to
-- be able to make their artifacts public on the public library"). A trigger still
-- refuses a change to the four public columns unless it comes through
-- cpl_library_set_public(), which checks team_pass_ok() or is_allowed_reviewer()
-- and records who listed (the sign-in's email, else the name given, else "team
-- phrase"). The history trigger files every prior row, so a listing is reversible
-- from the database (Rule 10 a2). Governance: kb/governance_surface_map.json,
-- "rpc:cpl_library_set_public". Re-runnable: applied 2026-10-20, again on
-- 2026-10-23 for the phrase, and again on 2026-10-23 for the made-for columns
-- (cpl_library_public_made_for_2026_10_23_s459; the columns themselves ride
-- kb/supabase_cpl_library.sql, applied first).

alter table public.cpl_library
  add column if not exists public_listed  boolean not null default false,
  add column if not exists public_summary text,
  add column if not exists public_topics  text[] not null default '{}',
  add column if not exists listed_at      timestamptz,
  add column if not exists listed_by      text;

alter table public.cpl_library drop constraint if exists cpl_library_public_ck;
alter table public.cpl_library add constraint cpl_library_public_ck check (
  coalesce(char_length(public_summary), 0) <= 600
  and coalesce(array_length(public_topics, 1), 0) <= 12
  and coalesce(char_length(listed_by), 0) <= 120
  and (not public_listed or (
        url is not null and retired_at is null and seen_by = 'public'
        and char_length(coalesce(public_summary, '')) between 1 and 600)));

-- The public columns change only inside cpl_library_set_public(), which sets this
-- transaction-local flag. service_role (receipts, rollback) passes too.
create or replace function public.cpl_library_guard_public() returns trigger
  language plpgsql set search_path = public as $$
begin
  if (new.public_listed is distinct from old.public_listed
      or new.public_summary is distinct from old.public_summary
      or new.public_topics is distinct from old.public_topics
      or new.listed_by is distinct from old.listed_by)
     and coalesce(current_setting('cpl.library_public', true), '') <> 'on'
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Listing in the public library needs the team phrase or a reviewer sign-in (cpl_library_set_public)';
  end if;
  -- Retiring a piece, or setting its audience to anything but Public, takes it off
  -- the public list in the same write. Unlisting is the safe direction, so any
  -- writer may cause it.
  if new.public_listed and (new.retired_at is not null or new.seen_by is distinct from 'public') then
    new.public_listed := false;
  end if;
  return new;
end $$;
revoke execute on function public.cpl_library_guard_public() from public, anon, authenticated;

drop trigger if exists cpl_library_guard_public_trg on public.cpl_library;
create trigger cpl_library_guard_public_trg before update on public.cpl_library
  for each row execute function public.cpl_library_guard_public();

-- List or unlist one piece. Listing also sets Seen by to Public, the audience the
-- listing declares. Returns the row's public fields so the caller can show them.
create or replace function public.cpl_library_set_public(
  p_slug text, p_listed boolean, p_summary text default null,
  p_topics text[] default null, p_by text default null)
returns table (slug text, public_listed boolean, public_summary text, public_topics text[], listed_at timestamptz)
  language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_allowed_reviewer() or public.team_pass_ok()) then
    raise exception 'Listing in the public library needs the team phrase or a reviewer sign-in';
  end if;
  perform set_config('cpl.library_public', 'on', true);
  update public.cpl_library l set
    public_listed  = p_listed,
    seen_by        = case when p_listed then 'public' else l.seen_by end,
    public_summary = coalesce(nullif(btrim(p_summary), ''), l.public_summary),
    public_topics  = coalesce(p_topics, l.public_topics),
    listed_at      = case when p_listed then now() else l.listed_at end,
    listed_by      = left(coalesce(nullif(btrim(p_by), ''), auth.jwt() ->> 'email',
                          case when public.is_allowed_reviewer() then 'reviewer' else 'team phrase' end), 120),
    updated_by     = left(coalesce(nullif(btrim(p_by), ''), auth.jwt() ->> 'email',
                          case when public.is_allowed_reviewer() then 'reviewer' else 'team phrase' end), 120)
  where l.slug = p_slug and l.retired_at is null;
  if not found then raise exception 'No current Library piece with slug %', p_slug; end if;
  return query select l.slug, l.public_listed, l.public_summary, l.public_topics, l.listed_at
    from public.cpl_library l where l.slug = p_slug;
end $$;
-- anon holds EXECUTE on purpose (Sam, 2026-10-23): a phrase holder calls it with the
-- anon key and the x-team-pass header, and the gate inside refuses everyone else.
revoke execute on function public.cpl_library_set_public(text, boolean, text, text[], text) from public;
grant execute on function public.cpl_library_set_public(text, boolean, text, text[], text) to anon, authenticated, service_role;

-- The public read: listed pieces only, public fields only. Open to anon on purpose,
-- because the public page and Sierra both read it.
-- Who a piece is made for travels with it (Sam, Open Asks Sheet 120 card 4,
-- 2026-10-23: show it on the public page and filter by it): for_kind, for_category
-- and for_name name an organization the title already names, never a person.
drop function if exists public.cpl_library_public();
create or replace function public.cpl_library_public()
returns table (slug text, title text, kind text, occasion text, made_on date,
               summary text, topics text[], url text, listed_at timestamptz,
               for_kind text, for_category text, for_name text)
  language sql stable security definer set search_path = public as $$
  select l.slug, l.title, l.kind, l.occasion, l.made_on, l.public_summary, l.public_topics, l.url, l.listed_at,
         l.for_kind, l.for_category, l.for_name
  from public.cpl_library l
  where l.public_listed and l.retired_at is null and l.url is not null
  order by l.made_on desc nulls last, l.title
$$;
revoke execute on function public.cpl_library_public() from public;
grant execute on function public.cpl_library_public() to anon, authenticated, service_role;
