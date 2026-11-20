-- A Library check counts only when it ran after the page last changed (#3560 part 2; S688, 2026-11-20).
--
-- The limit #3577 left (the lane's Known limit; d-library-check-binds-url-s688): a check names a version key and a url,
-- and every version of a Library piece on Pages has the same url (library/<slug>/). So a writer who sets a record's
-- version back to a key that already passed (v5 relabeled "4", where Version 4 passed at that address) points the
-- record at a pass its current page never earned. cpl_library_set_public() found that pass and listed the page, and the
-- trigger's version branch kept a listed piece listed through the same relabel. Sam's rule: nothing lists publicly
-- until it passes its accessibility check.
--
-- The design (d-library-check-after-page-change-s688):
--   cpl_library.page_changed_at   when the record's page last changed: set to now() by a trigger whenever url or
--                                 version changes, for every writer, and held at its old value on any other update,
--                                 so no writer sets it by hand. Null on every existing row until its page changes.
--   cpl_library_set_public()      a pass counts only at the record's current key and url AND no earlier than
--                                 page_changed_at. A null page_changed_at restricts nothing.
--   cpl_library_unlist_on_new_page()  a listed piece leaves the Public Library on ANY url or version change, keeping
--                                 publish_target 'public'. The version branch's exception (stay listed when the new key
--                                 already passed) is gone: a pass for the new key at the moment it changes can only be
--                                 an earlier page's. The check run (scripts/library_check.py) checks the new page after
--                                 the record moves and lists it again on a pass.
-- The check run writes checked_at as the database's now(), after --finish moved the record, so its own check of a new
-- page always counts.
--
-- Grants: set_public keeps EXECUTE for anon, authenticated and service_role, revoked from PUBLIC (a phrase holder calls
-- it with the anon key); both trigger functions are revoked from public, anon and authenticated (Rule 10 b2; they run
-- as triggers, never called). Decision rights (Rule 10 a3): no new writer and no new surface; the change only narrows
-- which checks can list a piece. Disclosure: a timestamp on a Library record, no student detail.
--
-- Additive, after kb/migrations/2026-11-19_library_check_binds_url.sql. Source: kb/supabase_cpl_library_public.sql
-- carries the same bodies.
--
-- Apply: the Supabase MCP apply_migration, or point kb/migrations/.apply here (supabase-migrate.yml):
--   file=kb/migrations/2026-11-20_library_check_after_page_change.sql
--   name=s688_library_check_after_page_change
-- Re-runnable. Rollback: kb/migrations/2026-11-20_library_check_after_page_change_rollback.sql.

-- ── When the page last changed ──────────────────────────────────────────────────────────────────────────────────
alter table public.cpl_library add column if not exists page_changed_at timestamptz;

-- Stamp the time a record's page changes, and hold it otherwise: a writer never sets it by hand.
create or replace function public.cpl_library_stamp_page_change() returns trigger
  language plpgsql set search_path = public as $$
begin
  if new.url is distinct from old.url or new.version is distinct from old.version then
    new.page_changed_at := now();
  else
    new.page_changed_at := old.page_changed_at;
  end if;
  return new;
end $$;
revoke execute on function public.cpl_library_stamp_page_change() from public, anon, authenticated;

drop trigger if exists cpl_library_page_changed_trg on public.cpl_library;
create trigger cpl_library_page_changed_trg before update on public.cpl_library
  for each row execute function public.cpl_library_stamp_page_change();

-- ── The gate inside cpl_library_set_public() ─────────────────────────────────────────────────────────────────────
-- List or unlist one piece. Listing also sets Seen by to Public, the audience the
-- listing declares. Returns the row's public fields so the caller can show them.
-- The one gate on the Public Library (#3560; Sam, Nov 19, 2026, via COBIx: "The only gate on the Public Library is
-- the passing accessibility check record"): listing needs the latest check of the page the record names now
-- (version_key 'version:<version>', or 'page' with no version number, at the record's current url, run no earlier than
-- the page last changed) to be a pass. A check with no url, one run at another url (COBIx on #3572, 7023899407), or one
-- older than the record's page_changed_at (a version relabeled to a key that passed) never lists a page. A draft's check
-- never lists a page. Unlisting takes no check, and the service role is exempt. The time binding rides
-- kb/migrations/2026-11-20_library_check_after_page_change.sql; its rollback restores the body that matches key and url.
create or replace function public.cpl_library_set_public(
  p_slug text, p_listed boolean, p_summary text default null,
  p_topics text[] default null, p_by text default null)
returns table (slug text, public_listed boolean, public_summary text, public_topics text[], listed_at timestamptz)
  language plpgsql security definer set search_path = public as $$
declare
  v_result text;
begin
  if not (public.is_allowed_reviewer() or public.team_pass_ok()) then
    raise exception 'Listing in the public library needs the team phrase or a reviewer sign-in';
  end if;
  if p_listed and coalesce(auth.role(), '') <> 'service_role' then
    select c.result into v_result
      from public.cpl_library l
      join public.cpl_library_checks c on c.library_id = l.id
       and c.version_key = case when nullif(l.version, '') is not null then 'version:' || l.version else 'page' end
       and c.url = l.url
       and c.checked_at >= coalesce(l.page_changed_at, '-infinity'::timestamptz)
     where l.slug = p_slug and l.retired_at is null
     order by c.checked_at desc, c.created_at desc
     limit 1;
    if v_result is distinct from 'pass' then
      raise exception 'Listing in the Public Library needs a passing accessibility check record for the page it names now';
    end if;
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

-- ── The trigger on a listed piece whose page changes ─────────────────────────────────────────────────────────────
-- A listed piece whose page changes leaves the Public Library until the new page is checked (#3560; COBIx on #3572,
-- comments 7022946691, 7023361983, 7023581179 and 7023899407; decided by the S687 and S688 conductors, and by S688's
-- part 2 for the version branch). cpl_library_set_public() gates the listing itself; this trigger covers a listed
-- page that changes afterward. Any writer may cause it, the service role included: unlisting is the safe direction.
-- The wish to list stays (publish_target 'public'), so the check run checks the new page and lists it again.
--   A url change or a version change always unlists: no check made before the change speaks for the page after it.
-- A draft never unlists anything: only a published new version or a new url does.
-- Fires after cpl_library_guard_public_trg and cpl_library_publish_target_trg (name order), so that trigger's reset
-- of publish_target on an unlisting does not see this one.
create or replace function public.cpl_library_unlist_on_new_page() returns trigger
  language plpgsql set search_path = public as $$
begin
  if new.public_listed and old.public_listed
     and (new.url is distinct from old.url or new.version is distinct from old.version) then
    new.public_listed := false;
    if to_regclass('public.cpl_library_checks') is not null then
      new.publish_target := 'public';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.cpl_library_unlist_on_new_page() from public, anon, authenticated;

drop trigger if exists cpl_library_unlist_new_page_trg on public.cpl_library;
create trigger cpl_library_unlist_new_page_trg before update on public.cpl_library
  for each row execute function public.cpl_library_unlist_on_new_page();

select json_build_object('records', count(*), 'page_changed_at_set', count(page_changed_at)) as cpl_library
  from public.cpl_library;
