-- Rollback of 2026-11-19_library_publishing_model.sql (#3560 part 1). The tab degrades on its own once the tables and
-- columns are gone: Publish to Internal Library still works, and Publish to Public Library says the check record is
-- not available yet. Dropping the columns loses only who chose Public and which pieces are templates; count them first:
--   select json_build_object('public', count(*) filter (where publish_target = 'public'),
--     'templates', count(*) filter (where template), 'checks', (select count(*) from public.cpl_library_checks))
--   from public.cpl_library;
-- cpl_library_history keeps every prior row, the dropped columns inside each before-value.
drop table if exists public.cpl_library_checks;
drop trigger if exists cpl_library_publish_target_trg on public.cpl_library;
drop function if exists public.cpl_library_publish_target_on_unlist();
alter table public.cpl_library drop constraint if exists cpl_library_division_fk;
alter table public.cpl_library drop constraint if exists cpl_library_publish_target_ck;
alter table public.cpl_library
  drop column if exists publish_target,
  drop column if exists template,
  drop column if exists division;
drop table if exists public.cpl_library_division_settings;
