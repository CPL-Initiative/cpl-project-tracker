-- map_ace_catalog_cr: ACE's own credit recommendation text, kept from the catalog view the nightly pull already
-- fetches (S678 SkyWaxwing, 2026-11-17; COBIx item 5 on #3464, comments 6962133442 and 6962134078).
--
-- WHY. `fetch_custom_report.py` asks View_ExhibitCRsCatalog_Dataset for AceID, Title and CreditRecommendation every
-- night, and kb/_sync_map_custom_reports.py kept only AceID, Title and CPLTypeCode. So 25,984 Common CR rows waited
-- on ACE text that arrived daily and was dropped. This table keeps it: one row per distinct (AceID,
-- CreditRecommendation), the catalog's text as sent (trimmed, the loader's one convention), never overwritten.
--
-- THE KEY IS THE ACE ID. exhibit_id holds the catalog's AceID (`AR-0702-0030`, `MOS-42A-001`), the same id
-- map_ace_exhibit_titles and map_college_cr_unit carry. The catalog's numeric ExhibitID is another namespace; the
-- loader never reads it, and a check constraint refuses an all-digit exhibit_id here, so it cannot land as a key.
--
-- WRITES. The service role only, through map_ace_catalog_cr_load(), which the loader calls after the nightly
-- promotion (map-custom-report-load.yml, 04:57 UTC, SUPABASE_SERVICE_KEY in the live-counts environment). The
-- function inserts a new pair and, for a pair already held, moves only last_seen and typo_key forward; the text
-- and the key columns are never updated, and the service role holds UPDATE on those two columns alone. Nobody
-- deletes through the API. A pair the catalog stops sending stays, with its last_seen showing when it was last
-- sent, so a catalog revision is visible rather than silently replacing the record.
--
-- READS. Reviewer-gated, as kb/supabase_map_promote_custom_reports.sql's tables are: anon and authenticated read
-- through is_allowed_reviewer() or team_pass_ok(). map_exhibit_cr_side_by_side puts MAP's credit_rec beside it
-- per exhibit; it is security_invoker, so map_college_cr_unit's own reviewer policy decides what a reader sees.
--
-- typo_key is the typographic rule's folded key (kb/cr_typographic.py typo_key: clean_rec, lowercase, whitespace
-- squashed). It is derived, written by the loader, and never shown as the recommendation.
--
-- Governance (Rule 10 a3): kb/governance_surface_map.json table:map_ace_catalog_cr, rpc:map_ace_catalog_cr_load and
-- view:map_exhibit_cr_side_by_side. Disclosure (adr-student-detail-aggregate-disclosure-control): no student data.
-- A row is an ACE exhibit id, ACE's published recommendation wording and two dates; the view adds MAP's wording and a
-- count of college-course rows, which counts articulations, never students.
--
-- Apply: point kb/migrations/.apply here (supabase-migrate.yml), when the conductor decides:
--   file=kb/migrations/2026-11-17_s678_map_ace_catalog_cr.sql
--   name=s678_map_ace_catalog_cr
-- After applying, read back (service_role true, anon false, authenticated false):
--   select has_function_privilege('service_role', 'public.map_ace_catalog_cr_load(jsonb)', 'execute') as service_role,
--          has_function_privilege('anon', 'public.map_ace_catalog_cr_load(jsonb)', 'execute') as anon,
--          has_function_privilege('authenticated', 'public.map_ace_catalog_cr_load(jsonb)', 'execute') as authenticated;
-- After the first fill (the next 04:57 UTC run, or a dispatch of map-custom-report-load.yml), the success check:
--   select count(*) as pairs, count(distinct (exhibit_id, cr_md5)) as distinct_keys,
--          count(*) filter (where exhibit_id ~ '^[0-9]+$') as numeric_ids from public.map_ace_catalog_cr;
--   with m as (select distinct exhibit_id, credit_rec from public.map_college_cr_unit
--              where exhibit_id <> '' and credit_rec <> ''),
--        a as (select distinct exhibit_id from public.map_ace_catalog_cr)
--   select count(*) as map_pairs,
--          count(*) filter (where exists (select 1 from public.map_ace_catalog_cr c
--                           where c.exhibit_id = m.exhibit_id and c.credit_recommendation = m.credit_rec)) as exact,
--          count(*) filter (where m.exhibit_id not in (select exhibit_id from a)) as ace_missing
--   from m;
-- The runner's log prints the same partition with the typographic bucket (exact + typographic + differs +
-- ace_missing = map pairs), computed from the same pull with kb/cr_typographic.py, and a self-recall line: the
-- typographic-only pairs whose wording a curator already placed in cr_reference_decisions, agreeing or not.
-- Rollback: kb/migrations/2026-11-17_s678_map_ace_catalog_cr_rollback.sql.

-- Plain create table: a second run fails loudly instead of passing over a table that differs from this file.
create table public.map_ace_catalog_cr (
  exhibit_id             text not null,
  credit_recommendation  text not null,
  -- The key on the text: a btree cannot index an unbounded run-on field (AR-0102-0007), its hash can.
  cr_md5                 text generated always as (md5(credit_recommendation)) stored,
  typo_key               text not null default '',
  first_seen             date not null default current_date,
  last_seen              date not null default current_date,
  constraint map_ace_catalog_cr_pkey primary key (exhibit_id, cr_md5),
  constraint map_ace_catalog_cr_ace_id check (
    exhibit_id <> '' and btrim(exhibit_id) = exhibit_id and exhibit_id !~ '^[0-9]+$'),
  constraint map_ace_catalog_cr_text check (credit_recommendation <> '' and btrim(credit_recommendation) = credit_recommendation),
  constraint map_ace_catalog_cr_seen check (last_seen >= first_seen)
);

alter table public.map_ace_catalog_cr enable row level security;
drop policy if exists map_ace_catalog_cr_select on public.map_ace_catalog_cr;
create policy map_ace_catalog_cr_select on public.map_ace_catalog_cr
  for select to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok());

-- Data API grants, stated rather than inherited (tests/supabase_table_grants_test.py). Readers read through the
-- policy; the service role reads, inserts, and updates the two derived columns only.
revoke all on public.map_ace_catalog_cr from anon, authenticated, service_role;
grant select on public.map_ace_catalog_cr to anon, authenticated;
grant select, insert on public.map_ace_catalog_cr to service_role;
grant update (last_seen, typo_key) on public.map_ace_catalog_cr to service_role;

-- The loader's one write: p_rows is a JSON array of {exhibit_id, credit_recommendation, typo_key}. A pair already
-- held keeps its text and first_seen; only last_seen and typo_key move. Security invoker: it runs with the caller's
-- grants, so it can do nothing the service role's table grants above do not allow.
create or replace function public.map_ace_catalog_cr_load(p_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_catalog as
$$
declare
  sent int;
  added int;
  held_before int;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'map_ace_catalog_cr_load: p_rows must be a JSON array';
  end if;
  select count(*) into held_before from public.map_ace_catalog_cr;
  with r as (
    select distinct on (x.exhibit_id, md5(x.credit_recommendation))
           x.exhibit_id, x.credit_recommendation, coalesce(x.typo_key, '') as typo_key
    from jsonb_to_recordset(p_rows) as x(exhibit_id text, credit_recommendation text, typo_key text)
  )
  insert into public.map_ace_catalog_cr as t (exhibit_id, credit_recommendation, typo_key)
  select exhibit_id, credit_recommendation, typo_key from r
  on conflict (exhibit_id, cr_md5) do update
    set last_seen = greatest(t.last_seen, excluded.last_seen),
        typo_key  = excluded.typo_key;
  get diagnostics sent = row_count;
  select count(*) - held_before into added from public.map_ace_catalog_cr;
  return jsonb_build_object('sent', sent, 'added', added, 'seen_again', sent - added,
                            'held', held_before + added);
end;
$$;

-- Rule 10 b2: service_role holds an explicit grant first, then PUBLIC and both API roles lose EXECUTE.
grant execute on function public.map_ace_catalog_cr_load(jsonb) to service_role;
revoke all on function public.map_ace_catalog_cr_load(jsonb) from public, anon, authenticated;
do $$
begin
  if not has_function_privilege('service_role', 'public.map_ace_catalog_cr_load(jsonb)', 'execute') then
    raise exception 'service_role lost EXECUTE on map_ace_catalog_cr_load; the nightly load would fail';
  end if;
  if has_function_privilege('anon', 'public.map_ace_catalog_cr_load(jsonb)', 'execute')
     or has_function_privilege('authenticated', 'public.map_ace_catalog_cr_load(jsonb)', 'execute') then
    raise exception 'map_ace_catalog_cr_load is still callable by an API role';
  end if;
end $$;

-- MAP's wording and ACE's, per exhibit, for the #cr-reference panel and the success check. One row per distinct
-- (exhibit, source, text). rows_n counts MAP's college-course-year rows for that wording (articulations, never
-- students); ACE rows carry none.
-- The MAP half groups and filters on credit_rec as stored, never on an expression over it. The loader's _clean
-- already trims it, and a filter through btrim() is not leakproof, so Postgres would run both gate functions on
-- every map_college_cr_unit row before the panel's cr_text filter (1.3 to 2.8 s against anon's 3 s timeout,
-- measured by the second reader on #3468, against 46 ms on the plain column).
create or replace view public.map_exhibit_cr_side_by_side with (security_invoker = true) as
  select u.exhibit_id, 'MAP'::text as source, u.credit_rec as cr_text, count(*)::int as rows_n
  from public.map_college_cr_unit u
  where u.exhibit_id <> '' and u.credit_rec <> ''
  group by u.exhibit_id, u.credit_rec
  union all
  select c.exhibit_id, 'ACE'::text, c.credit_recommendation, null::int
  from public.map_ace_catalog_cr c;

revoke all on public.map_exhibit_cr_side_by_side from anon, authenticated, service_role;
grant select on public.map_exhibit_cr_side_by_side to anon, authenticated, service_role;
