-- Self-asserting verification for public.search_college_programs.
-- Companion to chatbox/supabase_search_college_programs.sql (the schema of
-- record). Every check RAISES on failure, so a clean run is a silent one.
--
-- Run through the Supabase MCP after applying the migration. Safe to re-run:
-- read-only, no writes, no fixtures left behind.
--
-- PART A holds the moment the migration is applied.
-- PART B needs the coci-offerings-sync run that lands CIP; it says so and skips
-- rather than failing, because "not synced yet" is a schedule, not a defect.
--
-- ⚠️ A8 is the check worth understanding. The function counts generic-term
-- frequency PER SURFACE, so "technology" (7.8% of program titles, 16.3% of the
-- code vocabulary) is kept as a title term and dropped as a code term. The
-- observable consequence is that searching it returns title matches and no
-- code-only rows. If that check fails, per-surface counting has been collapsed
-- back into one combined count and the term is being thrown away — or kept
-- everywhere, which floods the result with every "* Automotive Technology" row.

-- ── PART A ───────────────────────────────────────────────────────────────────
do $$
declare n bigint; m bigint;
begin
  -- A1: the two columns the builder now carries.
  select count(*) into n from information_schema.columns
   where table_schema = 'public' and table_name = 'coci_college_programs'
     and column_name in ('cip_code', 'cip_title');
  if n <> 2 then raise exception 'A1 FAIL: expected cip_code + cip_title, found % of 2', n; end if;

  -- A2: EXACTLY ONE signature. Postgres keys functions by argument list, so a
  -- parameter added via CREATE OR REPLACE leaves a second function behind and
  -- every PostgREST call then fails with 42725 "is not unique". This is the
  -- trap that broke search_exhibits_by_topic_v2 live.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'search_college_programs';
  if n <> 1 then raise exception 'A2 FAIL: % signatures of search_college_programs (expected 1) — drop the superseded one', n; end if;

  -- A3: the CTE asterisk is not part of a name. Until 2026-09-17 split_top left
  -- it on 14,740 of 22,335 rows.
  select count(*) into n from public.coci_college_programs where top_title like '* %';
  if n > 0 then
    raise exception 'A3 FAIL: % rows still carry the CTE marker in top_title — the sync has not run the fixed builder', n;
  end if;

  -- A4: the union is the point. The LVN question must return colleges that NO
  -- code finds: LVN-to-RN bridges are coded Registered Nursing in both
  -- taxonomies, so a code-gated search loses 12 of 56 colleges.
  select count(*) into n from public.search_college_programs(array['lvn'], null, 200)
   where matched_via = 'title';
  if n = 0 then raise exception 'A4 FAIL: no title-only LVN matches — the title surface is not being searched, or the acronym was stemmed away'; end if;

  -- A5: …and the code surface must contribute too, or "match both" is a comment
  -- rather than a behavior.
  select count(*) into n from public.search_college_programs(array['nursing'], null, 200)
   where matched_via in ('code', 'title+code');
  if n = 0 then raise exception 'A5 FAIL: the code surface returned nothing for nursing'; end if;

  -- A6: zero rows is a RESULT, not a license to offer a neighbour. The trigram
  -- fallback must not manufacture one.
  select count(*) into n from public.search_college_programs(array['zzqqxxjjwwvv'], null, 50);
  if n <> 0 then raise exception 'A6 FAIL: a nonsense term returned % rows', n; end if;

  -- A7: college_filter narrows to the one college.
  select count(*) into n from public.search_college_programs(array['nursing'], 'Chabot College', 200);
  select count(*) into m from public.search_college_programs(array['nursing'], 'Chabot College', 200)
   where college <> 'Chabot College';
  if n = 0 then raise exception 'A7 FAIL: college_filter returned nothing for a college that has nursing programs'; end if;
  if m <> 0 then raise exception 'A7 FAIL: college_filter leaked % foreign rows', m; end if;

  -- A8: per-surface generic dropping. See the header.
  select count(*) into n from public.search_college_programs(array['technology'], null, 300)
   where matched_via = 'title';
  select count(*) into m from public.search_college_programs(array['technology'], null, 300)
   where matched_via = 'code';
  if n = 0 then raise exception 'A8 FAIL: "technology" returned no title matches — it is 7.8%% of titles and must survive as a title term'; end if;
  if m > 0 then raise exception 'A8 FAIL: "technology" returned % code-only rows — it is 16.3%% of the code vocabulary and must be dropped there', m; end if;

  raise notice 'PART A: 8 checks passed.';
end $$;

-- ── PART B (needs the CIP sync) ──────────────────────────────────────────────
do $$
declare n bigint; loaded bigint;
begin
  select count(*) into loaded from public.coci_college_programs where cip_code is not null;
  if loaded = 0 then
    raise notice 'PART B SKIPPED: cip_code is empty. Dispatch coci-offerings-sync.yml, then re-run. Expect ~19,349 of 22,335 rows to carry a CIP.';
    return;
  end if;

  -- B1: CIP is loaded and INCOMPLETE, which is the whole reason it is not a
  -- gate. Blank on ~13.4% of active rows against TOP's 0%.
  if loaded >= (select count(*) from public.coci_college_programs) then
    raise exception 'B1 FAIL: every row has a CIP — the export had 2,986 active rows without one, so something is filling blanks with a guess';
  end if;

  -- B2: CIP earns its place only if it can match where TOP cannot. "Practical"
  -- appears in the CIP title "Licensed Practical/Vocational Nurse Training" and
  -- in no TOP title — TOP calls the same program "Licensed Vocational Nursing".
  -- A hit here is CIP speaking on its own.
  select count(*) into n from public.search_college_programs(array['practical'], null, 200);
  if n = 0 then
    raise exception 'B2 FAIL: "practical" matched nothing — the CIP title is not in the searched code surface, so CIP was loaded and is still unread';
  end if;

  raise notice 'PART B: 2 checks passed (% rows carry a CIP).', loaded;
end $$;

-- ── PART C: phrase terms (2026-09-17) ────────────────────────────────────────
-- Phrases exist because the LVN question cannot be asked with single tokens.
-- C2 is the one that matters: adjacency is the whole point. `practical:*` stems
-- to `'practic':*` and prefix-matches Architectural PRACTICE; `'practic' <->
-- 'nurs'` cannot. If C2 ever fires, the phrase branch has fallen back to loose
-- token matching and the noise is back.
do $$
declare n bigint;
begin
  select count(*) into n from public.search_college_programs(array['vocational nursing'], null, 300);
  if n = 0 then
    raise exception 'C1 FAIL: a phrase term matched nothing — the phraseto_tsquery branch is not being reached (is the term reaching the RPC with its whitespace intact?)';
  end if;

  select count(*) into n from public.search_college_programs(array['vocational nursing'], null, 600)
   where program_title !~* 'practical|vocational|lvn|lpn|nurs';
  if n > 0 then
    raise exception 'C2 FAIL: the phrase matched % non-nursing rows — adjacency has been lost', n;
  end if;

  select count(*) into n from public.search_college_programs(array['zzq qqz'], null, 50);
  if n <> 0 then raise exception 'C3 FAIL: a nonsense phrase returned % rows', n; end if;

  -- The end-to-end shape of the question this was built for. The edge function
  -- expands "How do I become an LVN?" to exactly these three terms.
  select count(distinct college) into n from public.search_college_programs(
    array['lvn','practical nursing','vocational nursing'], null, 600);
  if n < 50 then
    raise exception 'C4 FAIL: the LVN question reached only % colleges; it measured 56 on 2026-09-17 (28 before phrases)', n;
  end if;

  raise notice 'PART C: 4 checks passed.';
end $$;

-- ── PART D: the cost is bounded (2026-09-17, S273) ───────────────────────────
-- The first version counted document frequency with two full scans PER TERM,
-- ~320 ms each, so the cost was set by the synonym table rather than the
-- student: a 30-term expansion took 19,784 ms and timed out through PostgREST
-- (8 s), and the edge function logged `search_college_programs unavailable`
-- three times in one smoke run while every assertion still passed. The one-pass
-- rewrite measures 2,522 ms for the same 30 terms and 1,168 ms for the LVN
-- question. These bounds sit at roughly 2x the measured values and well under
-- both timeouts; if D1 fires, the DF loop has gone back to one scan per term.
do $$
declare t0 timestamptz; ms numeric; n bigint;
begin
  t0 := clock_timestamp();
  select count(*) into n from public.search_college_programs(array[
    'boys','girls','club','near','san','pedro','nccer','carpentry','electrician','plumbing',
    'welding','osha','teens','nearby','them','construction','carpenter','woodworking','electrical','ibew',
    'apprentice','wiring','pipefitting','plumber','weld','welder','fabrication','smaw','fcaw','occupational'], null, 150);
  ms := extract(epoch from clock_timestamp() - t0) * 1000;
  if ms > 6000 then
    raise exception 'D1 FAIL: a 30-term call took % ms (2,522 ms one-pass; 19,784 ms with per-term scans) — is the DF loop scanning the table once per term again?', round(ms);
  end if;

  t0 := clock_timestamp();
  select count(*) into n from public.search_college_programs(
    array['lvn','practical nursing','vocational nursing'], null, 600);
  ms := extract(epoch from clock_timestamp() - t0) * 1000;
  if ms > 3000 then
    raise exception 'D2 FAIL: the LVN question took % ms — smoke 7p calls this with the anon key, whose statement timeout is 3 s', round(ms);
  end if;

  raise notice 'PART D: 2 checks passed.';
end $$;
