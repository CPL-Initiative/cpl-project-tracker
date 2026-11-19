-- Rollback of 2026-11-19_library_unlist_on_url_change.sql: the trigger function's body as
-- 2026-11-19_library_relist_on_new_version.sql left it (a url change that keeps its version key keeps that key's
-- check), and the memory row's summary as 2026-11-19_s687_library_memory_rows.sql wrote it. Pieces this unlisted stay
-- unlisted with publish_target 'public'; list them again from the Library tab once their page passes.
-- A listed piece whose page changes leaves the Public Library until the new page passes (#3560; COBIx on #3572,
-- comment 7022946691; decided by the S687 conductor). cpl_library_set_public() gates the listing itself, but a
-- listed Version 4 that becomes Version 5, or a page that moves to a new url, would otherwise stay listed with no
-- check of what it now shows. Any writer may cause it, the service role included: unlisting is the safe direction.
-- The wish to list stays (publish_target 'public'), so the check run lists it again once the new page passes.
-- A draft never unlists anything: only a published new version or a new url does. A url change that keeps the same
-- version key keeps that key's check, since a check names a version, not a url.
-- Fires after cpl_library_guard_public_trg and cpl_library_publish_target_trg (name order), so that trigger's reset
-- of publish_target on an unlisting does not see this one.
create or replace function public.cpl_library_unlist_on_new_page() returns trigger
  language plpgsql set search_path = public as $$
declare
  v_result text;
begin
  if new.public_listed and old.public_listed
     and (new.version is distinct from old.version or new.url is distinct from old.url) then
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

-- The memory row's before-value, restored only while it still holds the text the migration wrote.
update public.cpl_memory set summary = 'SkyPipit (S687), COBIx on #3572: when a listed piece''s version or url changes, a trigger unlists it unless the new page key has a passing check, and keeps publish_target public so Part 2''s run relists it. Until then this overrides Sam''s Nov 19 item 9 (a Public piece stays listed while redrafted); his to reverse.'
 where slug = 'd-library-new-page-unlists-s687' and author = 'SkyPipit (S687)'
   and summary = 'SkyPipit (S687), COBIx on #3572: a listed piece leaves the Public Library when its url changes, and when its version changes unless the new version''s latest check passes. publish_target stays public, so Part 2''s run relists it after checking the new page. Until then this overrides Sam''s Nov 19 item 9 (a Public piece stays listed while redrafted); his to reverse.';
