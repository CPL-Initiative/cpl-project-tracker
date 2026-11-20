-- A listed Library piece leaves the Public Library when its page changes, until the new page passes (#3560 part 1,
-- second migration; S687, 2026-11-19).
--
-- COBIx on #3572 (comment 7022946691): the gate in cpl_library_set_public() runs only at listing time, and
-- cpl_library_guard_public() unlists on retire or an audience change, but not when version or url changes. So a listed
-- Version 4 that becomes Version 5 stayed in the Public Library with no check for version:5, and a team-phrase writer
-- could set version to a key that already passed. Decided by the S687 conductor: when the new row is listed and its
-- version or url differs from the old row's, it is unlisted unless the latest check for the NEW page key is a pass;
-- publish_target stays 'public' so the check run (part 2) lists it again once the new page passes; the service role is
-- not exempt. Until part 2 relists, this overrides Sam's "a Public Library piece stays listed while redrafted, showing
-- the last published version" (Nov 19, item 9): a draft stays a draft, and only a published new version unlists.
--
-- Additive: one new trigger function and its trigger, after 2026-11-19_library_publishing_model.sql (applied, run
-- 44621258767). No existing function or grant changes. Decision rights (Rule 10 a3): it only ever unlists, the safe
-- direction any writer may already cause (kb/governance_surface_map.json, rpc:cpl_library_set_public, table:cpl_library).
-- Source: kb/supabase_cpl_library_public.sql carries the same body.
--
-- Apply: the Supabase MCP apply_migration, or point kb/migrations/.apply here (supabase-migrate.yml):
--   file=kb/migrations/2026-11-19_library_relist_on_new_version.sql
--   name=s687_library_relist_on_new_version
-- Re-runnable. Rollback: kb/migrations/2026-11-19_library_relist_on_new_version_rollback.sql.

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
