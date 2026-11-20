-- Rollback of 2026-11-19_library_check_binds_url.sql: cpl_library_set_public() as
-- 2026-11-19_library_publishing_model.sql wrote it (a pass counts by version key alone), the trigger function as
-- 2026-11-19_library_unlist_on_url_change.sql wrote it, and cpl_library_checks without its url column. Grants and
-- revokes are the ones those files set.
--
-- It refuses while any check row carries a url: the column is the only record of which page a check saw, and nothing
-- else keeps it (the same rule the publishing model's rollback follows for the check rows themselves). Until part 2's
-- check run writes checks, no row carries one and the rollback runs.
do $$
declare
  n bigint;
begin
  if to_regclass('public.cpl_library_checks') is not null
     and exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'cpl_library_checks' and column_name = 'url') then
    execute 'select count(*) from public.cpl_library_checks where url is not null' into n;
    if n > 0 then
      raise exception 'cpl_library_checks holds % check record(s) with a url; the rollback would lose which page each one checked', n;
    end if;
  end if;
end $$;

-- List or unlist one piece. Listing also sets Seen by to Public, the audience the
-- listing declares. Returns the row's public fields so the caller can show them.
-- The one gate on the Public Library (#3560; Sam, Nov 19, 2026, via COBIx: "The only gate on the Public Library is
-- the passing accessibility check record"): listing needs the latest check of the page the record names now
-- (version_key 'version:<version>', or 'page' with no version number) to be a pass. A draft's check never lists a page.
-- Unlisting takes no check, and the service role is exempt. The check table and this body ride
-- kb/migrations/2026-11-19_library_publishing_model.sql; its rollback restores the body without the gate.
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

-- A listed piece whose page changes leaves the Public Library until the new page is checked (#3560; COBIx on #3572,
-- comments 7022946691, 7023361983 and 7023581179; decided by the S687 conductor). cpl_library_set_public() gates the
-- listing itself; this trigger covers a listed page that changes afterward. Any writer may cause it, the service role
-- included: unlisting is the safe direction. The wish to list stays (publish_target 'public'), so the check run
-- checks the new page and lists it again.
--   A url change always unlists: no check is keyed on a url, so no earlier pass can speak for a page at a new address.
--   A version change unlists unless the latest check for the new version key is a pass.
-- A draft never unlists anything: only a published new version or a new url does.
-- Fires after cpl_library_guard_public_trg and cpl_library_publish_target_trg (name order), so that trigger's reset
-- of publish_target on an unlisting does not see this one.
create or replace function public.cpl_library_unlist_on_new_page() returns trigger
  language plpgsql set search_path = public as $$
declare
  v_result text;
begin
  if new.public_listed and old.public_listed and new.url is distinct from old.url then
    new.public_listed := false;
    if to_regclass('public.cpl_library_checks') is not null then
      new.publish_target := 'public';
    end if;
    return new;
  end if;
  if new.public_listed and old.public_listed and new.version is distinct from old.version then
    if to_regclass('public.cpl_library_checks') is null then
      new.public_listed := false;
      return new;
    end if;
    select c.result into v_result
      from public.cpl_library_checks c
     where c.library_id = new.id
       and c.version_key = case when nullif(new.version, '') is not null then 'version:' || new.version else 'page' end
     order by c.checked_at desc, c.created_at desc
     limit 1;
    if v_result is distinct from 'pass' then
      new.public_listed := false;
      new.publish_target := 'public';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.cpl_library_unlist_on_new_page() from public, anon, authenticated;

drop trigger if exists cpl_library_unlist_new_page_trg on public.cpl_library;
create trigger cpl_library_unlist_new_page_trg before update on public.cpl_library
  for each row execute function public.cpl_library_unlist_on_new_page();

alter table public.cpl_library_checks drop constraint if exists cpl_library_checks_url_ck;
alter table public.cpl_library_checks drop column if exists url;
