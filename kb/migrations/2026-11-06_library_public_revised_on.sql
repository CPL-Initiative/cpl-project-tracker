-- 2026-11-06 (ELL IET links session): the public library's cards show the newest version's date and "Version N".
-- Sam: "date for ver 5 not updating on the public library"; "probs should have ver5 in small gray print next to the date".
-- The public read only; no table, row or grant changes beyond re-granting the recreated function as before.
-- Source: kb/supabase_cpl_library_public.sql. ROLLBACK: kb/migrations/2026-11-06_library_public_revised_on_rollback.sql
-- APPLIED 2026-11-06 through the Supabase MCP (apply_migration library_public_revised_on_2026_11_06); read back: ELL IET 2026-11-05, Version 5; anon and service_role keep EXECUTE.
drop function if exists public.cpl_library_public();
-- revised_on and version_label (Sam, 2026-11-06: "date for ver 5 not updating on the public library", then
-- "probs should have ver5 in small gray print next to the date"): a card shows the date of the piece's newest
-- version and sorts by it, with "Version N" beside it once a piece has more than one. Only each version's date
-- is read from l.versions; its notes never leave the table.
create or replace function public.cpl_library_public()
returns table (slug text, title text, kind text, occasion text, made_on date,
               summary text, topics text[], url text, listed_at timestamptz,
               for_kind text, for_category text, for_name text,
               revised_on date, version_label text)
  language sql stable security definer set search_path = public as $$
  select l.slug, l.title, l.kind, l.occasion, l.made_on, l.public_summary, l.public_topics, l.url, l.listed_at,
         l.for_kind, l.for_category, l.for_name,
         r.revised_on, case when n.num > 1 then 'Version ' || n.num end
  from public.cpl_library l
  cross join lateral (
    select greatest(l.made_on, max((e ->> 'date')::date)) as revised_on
    from jsonb_array_elements(case when jsonb_typeof(l.versions) = 'array' then l.versions else '[]'::jsonb end) e
    where e ->> 'date' ~ '^\d{4}-\d{2}-\d{2}$') r
  cross join lateral (
    select case when l.version ~ '^[vV]?[0-9]{1,4}$' then ltrim(l.version, 'vV')::int end as num) n
  where l.public_listed and l.retired_at is null and l.url is not null
  order by r.revised_on desc nulls last, l.title
$$;
revoke execute on function public.cpl_library_public() from public;
grant execute on function public.cpl_library_public() to anon, authenticated, service_role;
