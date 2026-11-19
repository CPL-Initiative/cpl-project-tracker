-- A listed Library piece leaves the Public Library on ANY url change (#3560 part 1, third migration; S687, 2026-11-19).
--
-- COBIx on #3572 (comments 7023361983 and 7023581179): checks are keyed by version:<v> or page, never by url, so a
-- url change kept the old page's pass and a never-checked page at a new url stayed listed; the applied memory row
-- d-library-new-page-unlists-s687 promised more than the trigger did. The third round of one finding class, so the
-- S687 conductor took the simpler design: any url change of a listed row unlists it, keeping publish_target 'public'
-- (Part 2's run checks the new page and lists it again). A version change keeps its rule: it unlists unless the
-- latest check for the new version key passes. No check is keyed on a url.
--
-- Additive, after 2026-11-19_library_publishing_model.sql (run 44621258767) and
-- 2026-11-19_library_relist_on_new_version.sql (run 44624282220), both applied and unchanged. It replaces one trigger
-- function's body (the trigger, its grants and its revoke stay the same) and corrects one cpl_memory summary with a
-- guarded UPDATE: the S687 row, and only while its summary is still the text that row was written with. The rollback
-- holds both before-values. Decision rights (Rule 10 a3): the trigger only ever unlists, the safe direction any writer
-- may already cause. Source: kb/supabase_cpl_library_public.sql carries the same body.
--
-- Apply: the Supabase MCP apply_migration, or point kb/migrations/.apply here (supabase-migrate.yml):
--   file=kb/migrations/2026-11-19_library_unlist_on_url_change.sql
--   name=s687_library_unlist_on_url_change
-- Re-runnable. Rollback: kb/migrations/2026-11-19_library_unlist_on_url_change_rollback.sql.

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

-- The memory row says what the trigger now does (Rule 10 a2: the before-value is in the rollback). Guarded on the row's
-- author and its exact text, so a person's edit to it wins and this leaves it alone.
update public.cpl_memory set summary = 'SkyPipit (S687), COBIx on #3572: a listed piece leaves the Public Library when its url changes, and when its version changes unless the new version''s latest check passes. publish_target stays public, so Part 2''s run relists it after checking the new page. Until then this overrides Sam''s Nov 19 item 9 (a Public piece stays listed while redrafted); his to reverse.'
 where slug = 'd-library-new-page-unlists-s687' and author = 'SkyPipit (S687)'
   and summary = 'SkyPipit (S687), COBIx on #3572: when a listed piece''s version or url changes, a trigger unlists it unless the new page key has a passing check, and keeps publish_target public so Part 2''s run relists it. Until then this overrides Sam''s Nov 19 item 9 (a Public piece stays listed while redrafted); his to reverse.';

select json_build_object('slug', slug, 'summary_chars', char_length(summary)) as memory_row
  from public.cpl_memory where slug = 'd-library-new-page-unlists-s687';
