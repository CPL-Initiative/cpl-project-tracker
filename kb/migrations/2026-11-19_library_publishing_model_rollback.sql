-- Rollback of 2026-11-19_library_publishing_model.sql (#3560 part 1). The tab degrades on its own once the tables and
-- columns are gone: Publish to Internal Library still works, and Publish to Public Library says the check record is
-- not available yet. Dropping the columns loses only who chose Public and which pieces are templates; count them first:
--   select json_build_object('public', count(*) filter (where publish_target = 'public'),
--     'templates', count(*) filter (where template), 'checks', (select count(*) from public.cpl_library_checks))
--   from public.cpl_library;
-- cpl_library_history keeps every prior row, the dropped columns inside each before-value.
-- Nothing else keeps the check records, so the rollback refuses while any exist. Export them first, then delete them
-- by hand if the rollback must run.
do $$
declare n bigint;
begin
  if to_regclass('public.cpl_library_checks') is not null then
    execute 'select count(*) from public.cpl_library_checks' into n;
    if n > 0 then
      raise exception 'cpl_library_checks holds % check record(s); export them before this rollback drops the table', n;
    end if;
  end if;
end $$;

-- cpl_library_set_public() as it was before the migration: no check gate (kb/supabase_cpl_library_public.sql, 2026-10-23).
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
