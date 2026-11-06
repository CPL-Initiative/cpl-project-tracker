-- Rollback of 2026-11-06_library_public_revised_on.sql: the public read as it stood before (made_on only).
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
