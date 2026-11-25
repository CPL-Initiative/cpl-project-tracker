-- Rollback of kb/migrations/2026-11-25_gather_filters.sql (Gather's saved filters, S726).
--
-- It closes the surface at once and keeps what reviewers saved. A saved filter is person-entered data, so the table
-- is dropped only while EMPTY; with rows in place it stays, closed to every API role, for a person to decide on
-- (CLAUDE.md, the ask test: a delete of person-entered data). No kb_curation row depends on a filter.

drop function if exists public.gather_filter_save(jsonb);
drop function if exists public.gather_filter_retire(text);

drop policy if exists gather_filters_reviewer_read on public.gather_filters;
revoke all on public.gather_filters from public, anon, authenticated;

do $rb$
begin
  if to_regclass('public.gather_filters') is not null then
    if not exists (select 1 from public.gather_filters) then
      drop table public.gather_filters;
    else
      raise notice 'gather_filters holds rows: the table is kept, closed to every API role';
    end if;
  end if;
end
$rb$;
