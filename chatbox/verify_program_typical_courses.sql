-- Self-asserting verification for public.program_typical_courses and its
-- normalizer public.cpl_course_title_norm. Companion to
-- chatbox/supabase_program_typical_courses.sql (the schema of record).
-- Every check RAISES on failure, so a clean run is a silent one.
--
-- Run through the Supabase MCP after applying the migration. Safe to re-run:
-- read-only, no writes, no fixtures left behind.
--
-- The thresholds are THRESHOLDS, never counts (mode 14's lesson): 49 of 65
-- colleges folded to "nurse assistant" on 2026-09-18; 30 still fails loudly if
-- the normalization stops folding the variants, and survives a catalog refresh.

do $$
declare n bigint; t0 timestamptz; ms numeric; s text;
begin
  -- A1: EXACTLY ONE signature of each function. Postgres keys functions by
  -- argument list; two candidates make PostgREST's rpc call ambiguous.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'program_typical_courses';
  if n <> 1 then raise exception 'A1 FAIL: expected 1 program_typical_courses, found %', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'cpl_course_title_norm';
  if n <> 1 then raise exception 'A1 FAIL: expected 1 cpl_course_title_norm, found %', n; end if;

  -- A2: the API roles and the edge function can execute both.
  if not has_function_privilege('anon', 'public.program_typical_courses(text[], integer, integer)', 'execute')
     or not has_function_privilege('authenticated', 'public.program_typical_courses(text[], integer, integer)', 'execute')
     or not has_function_privilege('service_role', 'public.program_typical_courses(text[], integer, integer)', 'execute') then
    raise exception 'A2 FAIL: a caller role lacks EXECUTE on program_typical_courses';
  end if;
  if not has_function_privilege('anon', 'public.cpl_course_title_norm(text)', 'execute') then
    raise exception 'A2 FAIL: anon lacks EXECUTE on cpl_course_title_norm';
  end if;

  -- A3: the normalizer folds the variants a counselor reads as one course.
  s := public.cpl_course_title_norm('Certified Nursing Assistant Theory');
  if s <> 'nurse assistant' then raise exception 'A3 FAIL: CNA theory normalized to "%"', s; end if;
  s := public.cpl_course_title_norm('NURSE ASSISTANT TRAINING PROGRAM');
  if s <> 'nurse assistant' then raise exception 'A3 FAIL: NA training program normalized to "%"', s; end if;
  s := public.cpl_course_title_norm('Fundamentals of Vocational Nursing – Theory');
  if s <> 'fundamentals vocational nurse' then raise exception 'A3 FAIL: fundamentals VN normalized to "%"', s; end if;
  s := public.cpl_course_title_norm('Intravenous Therapy/Blood Withdrawal');
  if s <> 'intravenous therapy blood withdrawal' then raise exception 'A3 FAIL: IV/blood normalized to "%"', s; end if;
  s := public.cpl_course_title_norm('Vocational Nursing II (Clinical)');
  if s <> 'vocational nurse' then raise exception 'A3 FAIL: VN II clinical normalized to "%"', s; end if;
  -- Level words survive: an entry course and an advanced one stay distinct.
  s := public.cpl_course_title_norm('Advanced Medical Surgical Nursing');
  if s <> 'advanced medical surgical nurse' then raise exception 'A3 FAIL: advanced med-surg normalized to "%"', s; end if;
  -- The possessive: the punctuation strip leaves a lone "s", which is a stop word.
  s := public.cpl_course_title_norm('Nurse''s Aide');
  if s <> 'nurse aide' then raise exception 'A3 FAIL: possessive normalized to "%"', s; end if;
  if public.cpl_course_title_norm(null) <> '' or public.cpl_course_title_norm('') <> '' then
    raise exception 'A3 FAIL: null/empty title must normalize to empty';
  end if;

  -- A4: the CNA program folds to one leading family at a THRESHOLD of colleges.
  select r.n_colleges into n from public.program_typical_courses(array['1230.30'], 2, 5) r
   where r.top_code = '1230.30' and r.norm = 'nurse assistant';
  if coalesce(n, 0) < 30 then raise exception 'A4 FAIL: nurse assistant folds to only % colleges (49 of 65 measured 2026-09-18; need 30)', coalesce(n, 0); end if;
  select r.program_colleges into n from public.program_typical_courses(array['1230.30'], 2, 1) r limit 1;
  if coalesce(n, 0) < 50 then raise exception 'A4 FAIL: only % colleges teach the CNA program (65 measured; need 50)', coalesce(n, 0); end if;

  -- A5: the LVN program yields at least five course families with 2+ colleges.
  select count(*) into n from public.program_typical_courses(array['1230.20'], 2, 40) r;
  if n < 5 then raise exception 'A5 FAIL: only % LVN course families (need 5)', n; end if;

  -- A6: counts are in colleges — no family may exceed the program's colleges,
  -- and the colleges array carries exactly n_colleges names.
  select count(*) into n from public.program_typical_courses(array['1230.30','1230.20'], 2, 40) r
   where r.n_colleges > r.program_colleges or coalesce(array_length(r.colleges, 1), 0) <> r.n_colleges
      or r.example_code is null or r.example_college is null;
  if n <> 0 then raise exception 'A6 FAIL: % rows with a bad college count or no example course', n; end if;

  -- A7: the caps hold. per_top rows per program at most; min_colleges respected.
  select count(*) into n from public.program_typical_courses(array['1230.20'], 2, 3) r;
  if n > 3 then raise exception 'A7 FAIL: per_top=3 returned % rows', n; end if;
  select count(*) into n from public.program_typical_courses(array['1230.20'], 10, 40) r where r.n_colleges < 10;
  if n <> 0 then raise exception 'A7 FAIL: min_colleges=10 returned % rows under it', n; end if;

  -- A8: fail-safe shapes — an empty array, a null array and an unknown code
  -- return no rows (the caller renders nothing).
  select count(*) into n from public.program_typical_courses('{}'::text[], 2, 40) r;
  if n <> 0 then raise exception 'A8 FAIL: empty top_codes returned % rows', n; end if;
  select count(*) into n from public.program_typical_courses(null, 2, 40) r;
  if n <> 0 then raise exception 'A8 FAIL: null top_codes returned % rows', n; end if;
  select count(*) into n from public.program_typical_courses(array['0000.00'], 2, 40) r;
  if n <> 0 then raise exception 'A8 FAIL: an unknown code returned % rows', n; end if;

  -- A9: cost. Eight health programs (RN's 1,544 rows among them) in well under
  -- the anon key's 3 s statement timeout; 1,500 ms fails loudly first.
  t0 := clock_timestamp();
  perform count(*) from public.program_typical_courses(array['1230.30','1230.20','1230.10','1208.00','1205.10','1225.00','1217.00','1209.00'], 2, 40) r;
  ms := extract(epoch from clock_timestamp() - t0) * 1000;
  if ms > 1500 then raise exception 'A9 FAIL: eight programs took % ms (need under 1500)', round(ms); end if;

  -- A10: cost at the shape that failed. The 47 health programs (10,106 rows) are
  -- the broad question's load; the first version took 32,986 ms here and the
  -- linear one ~900 ms. 3,000 ms fails loudly, under the edge function's 5 s cut.
  t0 := clock_timestamp();
  perform count(*) from public.program_typical_courses(array(select distinct o.top_code from public.coci_college_offerings o where o.top_code like '12%'), 2, 40) r;
  ms := extract(epoch from clock_timestamp() - t0) * 1000;
  if ms > 3000 then raise exception 'A10 FAIL: the 47 health programs took % ms (need under 3000; 900 measured)', round(ms); end if;
end $$;
