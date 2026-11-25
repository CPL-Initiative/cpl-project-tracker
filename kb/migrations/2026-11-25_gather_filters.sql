-- gather_filters: Gather's saved filters (S726, the next slice of Gather; Sam, 2026-11-24, on the Gather mock:
-- saved filters "might come in handy for auto combining"; cpl_memory d-gather-saved-filters-s726).
--
-- WHAT. A signed-in reviewer names the words, Look in, common subject, local subject codes and target of a Gather
-- view and saves them under a name. Every reviewer sees the team's saved filters and opens one from its own address,
-- #coci-lookup/gather?f=<slug>. commons_gather.js writes through gather_filter_save() and gather_filter_retire().
-- A filter saves no decision: it is a query. The merges it leads to are kb_curation rows under the reviewer's name,
-- as before.
--
-- THE SIGN-IN RULE. A reviewer's own sign-in, never the team phrase. gather_filter_save() stamps saved_by from the
-- sign-in; the page never sends it. A reviewer changes or retires only a filter they saved. Nothing deletes a row.
--
-- NOT YET. A nightly run that gathers new matches above a confidence score reads these rows later; this file adds
-- no column for it.
--
-- GOVERNANCE (Rule 10 a3): decision right DR-36 in kb/governance_register.json; each surface is mapped to it in
-- kb/governance_surface_map.json. No student data is touched.
--
-- Idempotent. Rollback: kb/migrations/2026-11-25_gather_filters_rollback.sql.

create table if not exists public.gather_filters (
  slug        text primary key,
  name        text not null,
  query       jsonb not null,
  note        text,
  saved_by    text not null,
  saved_at    timestamptz not null default now(),
  changed_at  timestamptz,
  retired_at  timestamptz,
  constraint gather_filters_slug_ck check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  constraint gather_filters_name_ck check (length(btrim(name)) between 1 and 80),
  constraint gather_filters_query_ck check (jsonb_typeof(query) = 'object' and length(query::text) <= 2000),
  constraint gather_filters_note_ck check (note is null or length(note) <= 500)
);

comment on table public.gather_filters is
  'Gather''s saved filters (S726): a named Gather query a signed-in reviewer saved, opened at #coci-lookup/gather?f=<slug>. Written only by gather_filter_save() and gather_filter_retire(). Reviewer read.';
comment on column public.gather_filters.query is 'The view''s address fields: w (the words), look (title, desc or both), cs, ls, to.';
comment on column public.gather_filters.saved_by is 'The reviewer''s sign-in address, stamped by gather_filter_save(). Never sent by the page.';

alter table public.gather_filters enable row level security;
drop policy if exists gather_filters_reviewer_read on public.gather_filters;
create policy gather_filters_reviewer_read on public.gather_filters
  for select to authenticated using (public.is_allowed_reviewer());

revoke all on public.gather_filters from public, anon, authenticated;
grant select on public.gather_filters to authenticated;
grant select, insert, update on public.gather_filters to service_role;

-- Save a filter. A new name adds a row; the saver's own live name changes its query; another reviewer's live name
-- is refused, so a filter is never replaced under someone else's name. A retired slug comes back for its saver only.
create or replace function public.gather_filter_save(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_name  text := btrim(coalesce(p ->> 'name', ''));
  v_note  text := nullif(btrim(coalesce(p ->> 'note', '')), '');
  v_q     jsonb := p -> 'query';
  v_slug  text;
  v_row   public.gather_filters;
  k       text;
begin
  if v_email = '' or not public.is_allowed_reviewer() then
    raise exception 'gather_filter_save: sign in as a reviewer to save a filter' using errcode = '42501';
  end if;
  if length(v_name) < 1 or length(v_name) > 80 then
    raise exception 'gather_filter_save: give the filter a name of 1 to 80 characters' using errcode = '22023';
  end if;
  if v_note is not null and length(v_note) > 500 then
    raise exception 'gather_filter_save: the note is longer than 500 characters' using errcode = '22023';
  end if;
  if v_q is null or jsonb_typeof(v_q) <> 'object' then
    raise exception 'gather_filter_save: the filter has no query' using errcode = '22023';
  end if;
  for k in select jsonb_object_keys(v_q) loop
    if k not in ('w', 'look', 'cs', 'ls', 'to') then
      raise exception 'gather_filter_save: the query has a field Gather does not take (%)', k using errcode = '22023';
    end if;
    if jsonb_typeof(v_q -> k) <> 'string' then
      raise exception 'gather_filter_save: the query field % is not text', k using errcode = '22023';
    end if;
  end loop;
  if length(btrim(coalesce(v_q ->> 'w', ''))) = 0 or length(v_q ->> 'w') > 300 then
    raise exception 'gather_filter_save: name the words first (up to 300 characters)' using errcode = '22023';
  end if;
  if coalesce(v_q ->> 'look', 'title') not in ('title', 'desc', 'both') then
    raise exception 'gather_filter_save: Look in is title, desc or both' using errcode = '22023';
  end if;
  if length(coalesce(v_q ->> 'cs', '')) > 40 or length(coalesce(v_q ->> 'ls', '')) > 200 or length(coalesce(v_q ->> 'to', '')) > 40 then
    raise exception 'gather_filter_save: a field of the query is too long' using errcode = '22023';
  end if;

  v_slug := left(btrim(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), '-'), 60);
  v_slug := btrim(v_slug, '-');
  if v_slug = '' then
    raise exception 'gather_filter_save: the name needs a letter or a number' using errcode = '22023';
  end if;

  select * into v_row from public.gather_filters where slug = v_slug for update;
  if not found then
    insert into public.gather_filters (slug, name, query, note, saved_by)
    values (v_slug, v_name, v_q, v_note, v_email);
    return jsonb_build_object('slug', v_slug, 'saved', 'added');
  end if;
  if v_row.saved_by <> v_email then
    raise exception 'gather_filter_save: % saved a filter by this name; pick another name', v_row.saved_by using errcode = '23505';
  end if;
  update public.gather_filters
     set name = v_name, query = v_q, note = v_note, changed_at = now(), retired_at = null
   where slug = v_slug;
  return jsonb_build_object('slug', v_slug, 'saved', 'changed');
end
$fn$;

-- Retire a filter: it leaves the list and its address says so. Only its saver retires it; the row stays.
create or replace function public.gather_filter_retire(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_by    text;
begin
  if v_email = '' or not public.is_allowed_reviewer() then
    raise exception 'gather_filter_retire: sign in as a reviewer' using errcode = '42501';
  end if;
  select saved_by into v_by from public.gather_filters where slug = p_slug for update;
  if v_by is null then
    raise exception 'gather_filter_retire: no filter %', p_slug using errcode = '22023';
  end if;
  if v_by <> v_email then
    raise exception 'gather_filter_retire: % saved this filter; only they retire it', v_by using errcode = '42501';
  end if;
  update public.gather_filters set retired_at = now() where slug = p_slug and retired_at is null;
  return jsonb_build_object('slug', p_slug, 'retired', true);
end
$fn$;

grant execute on function public.gather_filter_save(jsonb) to authenticated, service_role;
revoke execute on function public.gather_filter_save(jsonb) from public, anon;
grant execute on function public.gather_filter_retire(text) to authenticated, service_role;
revoke execute on function public.gather_filter_retire(text) from public, anon;

-- The migration refuses to stand if either half of a grant is wrong (Rule 10 b2).
do $chk$
begin
  if has_function_privilege('anon', 'public.gather_filter_save(jsonb)', 'execute')
     or has_function_privilege('anon', 'public.gather_filter_retire(text)', 'execute') then
    raise exception 'a gather_filter function is open to anon';
  end if;
  if not has_function_privilege('authenticated', 'public.gather_filter_save(jsonb)', 'execute')
     or not has_function_privilege('authenticated', 'public.gather_filter_retire(text)', 'execute') then
    raise exception 'a gather_filter function is closed to a signed-in reviewer';
  end if;
  if has_table_privilege('anon', 'public.gather_filters', 'select')
     or has_table_privilege('authenticated', 'public.gather_filters', 'insert')
     or has_table_privilege('authenticated', 'public.gather_filters', 'update')
     or has_table_privilege('authenticated', 'public.gather_filters', 'delete') then
    raise exception 'gather_filters grants an API role more than a reviewer read';
  end if;
end
$chk$;
