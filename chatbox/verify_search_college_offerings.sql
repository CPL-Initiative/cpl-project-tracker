-- Self-asserting verification for public.search_college_offerings.
-- Companion to chatbox/supabase_search_college_offerings.sql (the schema of
-- record). Every check RAISES on failure, so a clean run is a silent one.
-- Read-only; safe to re-run through the Supabase MCP.
--
-- The phrase query below is what cpl-chat's tsQueryFromTerms builds for the
-- CNA/LVN term set (transcribed; tests/sierra_place_anchor.test.js re-derives
-- it from index.ts and fails when they part).
do $$
declare n bigint; m bigint; k bigint;
  q text := 'cna:* | lvn:* | (nurse:* <-> assistant:*) | (certified:* <-> nurse:* <-> assistant:*) | (practical:* <-> nursing:*) | (vocational:* <-> nursing:*)';
begin
  -- O1: exactly one signature — the superseded one was dropped.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'search_college_offerings';
  if n <> 1 then raise exception 'O1 FAIL: % signatures of search_college_offerings — drop the superseded one', n; end if;

  -- O2: the PHRASE reaches the Vocational Nursing TOP. Before phrases the LVN
  -- question reached this TOP only where a course title spelled "LVN" — the RN
  -- bridges — so no LVN course list ever reached the model. 44 colleges measured.
  select count(*) into n from public.search_college_offerings(search_query := q, college_filter := null, result_limit := 1000)
   where top_title = 'Licensed Vocational Nursing';
  if n < 20 then raise exception 'O2 FAIL: the phrase query reached only % Licensed Vocational Nursing rows (44 measured) — is the <-> phrase being dropped?', n; end if;

  -- O3: a nonsense term returns nothing.
  select count(*) into n from public.search_college_offerings(search_query := 'zzqqxxwwvv:*', college_filter := null, result_limit := 50);
  if n <> 0 then raise exception 'O3 FAIL: a nonsense term returned % rows', n; end if;

  -- O4: anchored rows LEAD, and they are contiguous.
  with r as (
    select row_number() over () as pos, county
    from public.search_college_offerings(search_query := q, college_filter := null,
           result_limit := 150, anchor_county := 'Orange', anchor_region := 'Orange County'))
  select count(*) filter (where county = 'Orange'),
         min(pos) filter (where county = 'Orange'),
         max(pos) filter (where county = 'Orange') into n, m, k from r;
  if coalesce(n, 0) = 0 then raise exception 'O4 FAIL: no Orange County rows for the CNA/LVN query'; end if;
  if m <> 1 or k <> n then
    raise exception 'O4 FAIL: Orange County rows sit at positions %..% of % — the anchor is a tiebreak, not the leading key', m, k, n;
  end if;

  -- O5: the anchor changes the ORDER, never the SET.
  select count(*) into n from (
    (select college, top_code from public.search_college_offerings(search_query := q, college_filter := null, result_limit := 1000)
     except
     select college, top_code from public.search_college_offerings(search_query := q, college_filter := null, result_limit := 1000, anchor_county := 'Orange'))
    union all
    (select college, top_code from public.search_college_offerings(search_query := q, college_filter := null, result_limit := 1000, anchor_county := 'Orange')
     except
     select college, top_code from public.search_college_offerings(search_query := q, college_filter := null, result_limit := 1000))
  ) d;
  if n <> 0 then raise exception 'O5 FAIL: the anchor changed the row set by % rows — it must order, never filter', n; end if;

  -- O6: the college_filter still scopes.
  select count(*) filter (where college <> 'Santa Ana College') into n
    from public.search_college_offerings(search_query := q, college_filter := 'Santa Ana College', result_limit := 50);
  if n <> 0 then raise exception 'O6 FAIL: college_filter leaked % foreign rows', n; end if;

  raise notice 'OFFERINGS: 6 checks passed.';
end $$;
