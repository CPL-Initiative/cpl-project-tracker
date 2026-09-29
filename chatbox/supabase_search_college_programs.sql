-- Schema of record: public.coci_college_programs (cip_code, cip_title),
-- public.coci_programs_replace, public.search_college_programs.
--
-- The PROGRAM-level lookup behind the shared cpl-chat Edge Function (Sierra).
-- Applied live via the Supabase MCP on 2026-09-17 as:
--   coci_programs_cip_and_program_search
--
--
-- WHY THIS EXISTS: Sierra could not see program data at all
-- ------------------------------------------------------------------
-- search_college_offerings reads coci_college_offerings — a rollup of the
-- 141k-row COURSE list by (college x TOP program). coci_college_programs held
-- 22,335 rows across 118 colleges and NO retrieval path touched it, so Sierra
-- declined a real student question about LVN programs while the answer sat one
-- table away.
--
-- A course rollup cannot stand in for it. A program is an AWARD a college
-- confers; the course rollup knows only that some nursing courses exist.
--
--
-- THE MEASUREMENT THAT DESIGNED THIS (2026-09-17, the LVN case)
-- ------------------------------------------------------------------
-- Counting colleges in the active program export:
--
--   by program TITLE (lvn | vocational nurs) ....... 53
--   by TOP code title ............................... 44
--   by CIP code title ............................... 43
--   by EITHER code .................................. 44
--   union of title and codes ........................ 56
--     title-only, missed by both codes .............. 12
--     code-only, missed by the title ................  3
--
-- NEITHER SURFACE ALONE DECIDES, and that is the whole design. The 12 rows a
-- code-gated search loses are LVN-to-RN bridge programs — "Nursing: Career
-- Ladder LVN to RN", "LVN 30 Unit Option" — correctly coded Registered Nursing
-- in BOTH taxonomies, because a code says what a program IS ABOUT and cannot
-- say who it is FOR (docs/kb-notes/methodology-a-code-cannot-say-who-a-program-
-- is-for.md). The 3 rows a title-only search loses are programs whose title
-- names a specialty and whose code names the field.
--
-- So the function matches on BOTH surfaces, returns the UNION, and reports
-- `matched_via` ('title' | 'code' | 'title+code') on every row — the caller can
-- see which signal spoke rather than inferring it.
--
--
-- CIP IS LOADED AND IS NOT GATED ON
-- ------------------------------------------------------------------
-- Sam, 2026-09-17: "Maybe use CIP instead of TOP — more reliable." Right about
-- the direction, and measured it does not replace TOP:
--
--   CIP blank on 13.4% of the 22,335 ACTIVE rows the builder keeps (2,986)
--   CIP blank on 29.1% of all 29,147 export rows
--   CIP blank on 14.1% of the 20,282 rows whose status is exactly "Active"
--   TOP blank on  0.0% everywhere
--
-- (All three denominators are real; 14.1% is the "Active"-only reading carried
-- in cpl_memory `cip-load-do-not-gate`, 13.4% is this builder's three-status
-- keep. They are the same fact counted twice, not a contradiction.)
--
-- CIP therefore joins the CODE surface as a second independent voice. It is
-- never required, never a filter, and a blank CIP never reads as "no
-- discipline". Rule 7's posture toward TOP — corroborate, do not gate — applies
-- to CIP until it earns trust, and the CO's TOP-to-CIP cutover does not change
-- that on its own.
--
--
-- THE DESIGN — inherited from search_exhibits_by_topic_v2, one change
-- ------------------------------------------------------------------
-- Takes RAW TERMS (text[]) rather than a caller-built tsquery, for the reason
-- that function's header records at length: `aed:*` parsed with the 'english'
-- config becomes `'a':*`. "LVN" is exactly that class — three letters, no
-- meaning to a stemmer — so the acronym path is not an edge case here, it is
-- the headline query. Short tokens (<=4 chars) and any token the stemmer
-- collapses below 3 characters match an UNSTEMMED 'simple' vector.
--
-- THE ONE DEPARTURE: generic-term frequency is counted PER SURFACE, where v2
-- counts it over one combined vector. Measured on this corpus:
--
--                 title DF    code DF
--   technology       7.8%      16.3%
--   science          5.7%       4.9%
--   lvn              0.2%       0.0%
--
-- "technology" crosses the 15% generic threshold on the code surface and sits
-- well under it on titles. That is structural, not incidental: code titles are
-- a small controlled vocabulary repeated across many rows (602 active programs
-- share the TOP title "Automotive Technology"), while program titles are
-- freehand. A combined count blends the two and throws away a term that is
-- still discriminating in the place a student actually typed it. So
-- "technology" is dropped as a CODE term and kept as a TITLE term — which is
-- also the right reading: "Automotive Technology" as a code barely narrows
-- anything, while "Welding Technology" in a program title does.
--
-- If EVERY term looks generic on a surface, that surface keeps them all, so a
-- broad question still answers rather than returning nothing.
--
-- MULTI-WORD TERMS are phrases (phraseto_tsquery), which is what lets the LVN
-- question be asked precisely — see the measured note in the term loop below.
--
-- Zero rows is a RESULT. The trigram fallback runs only when full-text matched
-- nothing, and a genuine zero is returned as zero — the caller must not offer a
-- neighbouring program instead.
--
-- ⚠️ THE OVERLOAD TRAP (cost search_exhibits_by_topic_v2 a live break):
-- Postgres keys functions by argument signature, so adding a parameter via
-- CREATE OR REPLACE produces a SECOND function and a PostgREST call then fails
-- with "function ... is not unique" (42725). Any future parameter addition here
-- must DROP the superseded signature explicitly.
--
-- THE PLACE ANCHOR (2026-09-18, S273): anchor_county / anchor_region
-- ------------------------------------------------------------------
-- Sam's test question on v67 — "I have a cna cert and I want to go to a
-- college in orange county. What CNA courses at the colleges match LVN courses
-- so I can ask for credit?" — came back with LVN programs in Sacramento, Butte,
-- Humboldt, Madera and Siskiyou counties. The edge function ranks by proximity
-- only AFTER this function has applied result_limit, and only against a
-- RESOLVED college; a county in the question anchored nothing. With the cna
-- family added the CNA/LVN term set matches 162 rows over 69 colleges, so a
-- 150-row limit ordered by rank alone can cut a local college before the
-- caller ever sees it. The anchor is therefore applied HERE, as the leading
-- ORDER BY keys — same county first, then same region, then rank — and never
-- as a filter: a county with no matching program still returns the nearest
-- ones, which is the answer that county needs. Null anchors leave the order
-- exactly as it was. Measured 2026-09-18: the OC CNA/LVN call returns the same
-- row SET with and without the anchor; Orange County's five colleges move from
-- positions 46-120 to 1-16.
--
-- VERIFICATION: chatbox/verify_search_college_programs.sql (self-asserting,
-- and it carries its own CIP fixture so the CIP half is proven without
-- waiting on a sync). Query-side route: tests/sierra_program_search.test.js.

-- word_similarity() in the fuzzy fallback needs the extension; it does NOT need
-- an index (see the measured note further down).
create extension if not exists pg_trgm;

-- ── The two columns the builder had been dropping on the floor ────────────────
alter table public.coci_college_programs
  add column if not exists cip_code  text,
  add column if not exists cip_title text;

-- ── The loader carries them (chunked replace: first chunk truncates) ──────────
-- Unchanged otherwise. CREATE OR REPLACE preserves existing grants, so this does
-- not widen who may call a definer function that truncates a live table.
create or replace function public.coci_programs_replace(
  p_rows jsonb, p_truncate boolean default true)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n integer;
begin
  if p_truncate then delete from public.coci_college_programs where true; end if;
  insert into public.coci_college_programs
    (college, program_title, award, top_code, top_title, cip_code, cip_title, status)
  select r.college, nullif(r.program_title,''), nullif(r.award,''),
         nullif(r.top_code,''), nullif(r.top_title,''),
         nullif(r.cip_code,''), nullif(r.cip_title,''), nullif(r.status,'')
  from jsonb_to_recordset(p_rows) as r(
    college text, program_title text, award text, top_code text, top_title text,
    cip_code text, cip_title text, status text)
  where coalesce(r.college,'') <> '';
  get diagnostics n = row_count;
  return n;
end $function$;

-- ── NO INDEXES ARE ADDED HERE, and that is a measured decision ────────────────
-- This file originally created three GIN indexes over cx_search_norm(program_title)
-- — english, simple and trigram — to keep the per-surface DF loop below fast.
-- Applied 2026-09-17, they BROKE THE LOADER within the hour:
--
--   coci_offerings_replace: 16097 rows total   ✓
--   coci_programs_replace → HTTP 500 {"code":"57014",
--     "message":"canceling statement due to statement timeout"}
--                                       (coci-offerings-sync run 11)
--
-- coci_programs_replace deletes and reinserts all 22,335 rows in ONE statement.
-- The table already carried a GIN FTS index (coci_programs_fts, on the combined
-- english program_title+top_title vector) and coped; three more tripled the
-- index maintenance on that statement and pushed it past the timeout. No data
-- was lost — the delete+insert rolls back atomically — but every later sync
-- would have failed identically.
--
-- ⚠️ THEY ALSO BOUGHT NOTHING. Measured on the live table, 5 calls of a 6-term
-- query (12 DF counts) at result_limit 300:
--
--     with the three indexes ....... 561.9 ms per call
--     without them ................. 565.8 ms per call
--
-- A 4 ms difference, inside the noise. 22,335 rows is a seq scan of a few
-- milliseconds, and a `count(*)` over a predicate matching a large share of the
-- table is not what a GIN index helps. The evidence was already in this file's
-- own design: the CODE surface has never had an index and performs the same.
-- Reversed by migration drop_coci_programs_search_indexes_loader_timeout.
--
-- The lesson worth keeping: an index added on reasoning rather than on a
-- measurement is a write-path cost with no read-path benefit, and the write path
-- here is a single statement under a fixed timeout.

-- ── The route ─────────────────────────────────────────────────────────────────
-- ⚠️ ONE PASS OVER THE TABLE PER CALL, AND THAT IS A MEASURED DECISION
-- (2026-09-17, S273). The first version of this function counted document
-- frequency with two `count(*)` statements PER TERM, each recomputing two
-- tsvectors for all 22,335 rows — about 320 ms a count. The cost scaled with
-- the term count, and the term count is set by the synonym table, not by the
-- student: "How do I become an LVN?" is 3 terms, an EMT question 6, a
-- firefighter question 12, and a Boys & Girls Club question 30. Measured on the
-- live table, uncontended, as the postgres role:
--
--                                     per-term loop      one pass (this)
--     3 terms  (the LVN question) ........  1,788 ms          1,168 ms
--     6 terms  (an EMT question) .........  4,255 ms          1,098 ms
--     12 terms (a firefighter question) ..  8,076 ms          1,382 ms
--     30 terms (a Boys & Girls Club ask) . 19,784 ms          2,522 ms
--
-- The slope is what changed: ~650 ms per term before, ~60 ms per term now, on
-- a ~700 ms floor (the four vectors, computed once). Row-for-row identical on
-- nine term sets — the four above, a college_filter, the per-surface generic
-- rule ("technology"), a nonsense token, the fuzzy fallback ("excellance") and
-- a phrase alone — 0 rows differ in either direction; the order differs in 2 of
-- 300 positions on "technology", two rows tied on rank, college and title.
-- Measured on a session-local pg_temp copy beside the live function, so the
-- comparison touched no shared schema.
--
-- Through PostgREST the effective statement timeout is 8 s (the authenticator
-- role's), and the anon key's is 3 s. In the first preview A/B run of the
-- edge function (2026-09-17 21:14–21:27Z) the route timed out on 3 of the
-- questions that expanded past ~10 terms and the function logged
-- `search_college_programs unavailable` each time; pg_stat_statements recorded
-- the surviving calls at a MEAN of 4,282 ms and a max of 7,875 ms. The edge
-- function awaits every retrieval route in one Promise.all, so a slow route
-- delays the whole answer, and a timed-out one costs the Program Catalog
-- section silently — the answer reads fluent and complete.
--
-- The fix is structural, not an index (see the NO INDEXES note above — three
-- GIN indexes broke the loader for a measured 4 ms). The four tsvectors are
-- computed ONCE per call into a materialized CTE, every term's document
-- frequency is counted in one pass over that CTE, and the ranked match reads
-- the same CTE. Semantics are unchanged — the same per-surface DF rule, the
-- same keep-all-if-all-generic rule, the same english/simple split, the same
-- phrase handling, the same ranking. chatbox/verify_search_college_programs.sql
-- Part D pins the cost so the per-term scan cannot come back unnoticed.
-- ⚠️ SIGNATURE CHANGE (2026-09-18): two anchor parameters. Per the OVERLOAD
-- TRAP note above, the superseded signature is dropped first, in the same
-- transaction, so PostgREST never sees two candidates. The grants the drop
-- discards are restored at the end of this file.
drop function if exists public.search_college_programs(text[], text, integer, numeric, real);

create or replace function public.search_college_programs(
  search_terms   text[],
  college_filter text    default null,
  result_limit   integer default 150,
  generic_pct    numeric default 0.15,
  fuzzy_floor    real    default 0.6,
  anchor_county  text    default null,
  anchor_region  text    default null
)
returns table(
  college text, program_title text, award text, status text,
  top_code text, top_title text, cip_code text, cip_title text,
  matched_via text, region text, county text, landing_page_url text
)
language plpgsql
stable
as $function$
declare
  corpus_n bigint; t text; norm text; term_q tsquery; use_simple boolean;
  -- Every parsed term as the text of its tsquery, beside the vector it belongs
  -- to: 'phrase' (english only), 'eng' (stemmed prefix) or 'sim' (unstemmed).
  qs    text[] := '{}';
  kinds text[] := '{}';
begin
  select count(*) into corpus_n from public.coci_college_programs;
  if corpus_n = 0 then return; end if;

  -- ── 1. Parse the terms. No table access in this loop. ──────────────────────
  foreach t in array coalesce(search_terms, '{}'::text[]) loop
    -- ── PHRASE TERMS (2026-09-17) ─────────────────────────────────────────────
    -- A term carrying whitespace is a phrase, and phrases exist because no single
    -- token could express "vocational nursing". Measured on this corpus against
    -- the ground truth (titles matching /\mlvn\M|vocational nurs/):
    --
    --     lvn alone ........................ 28 colleges
    --     lvn + "vocational" (one token) ... 82   (vocational education, ESL)
    --     lvn + "practical"  (one token) ... 63   but 30 of 36 added title rows
    --                                            are Architectural PRACTICE,
    --                                            Teaching PRACTICES, PRACTICUM —
    --                                            `practical:*` stems to
    --                                            `'practic':*` and prefix-matches
    --                                            them. The aed → 'a':* family.
    --     lvn + the two PHRASES ............ 53 title · 44 code · 56 union
    --                                            and ZERO non-nursing title rows
    --
    -- phraseto_tsquery keeps the adjacency, so `'vocat' <-> 'nurs'` matches
    -- "Licensed Vocational Nursing" and cannot match "Architectural Practice".
    -- Phrases run on the english vector only (the 'simple' config would not stem
    -- "Nursing" to match "Nurse") and are parenthesized before the OR-join —
    -- tsquery binds <-> tighter than |, so this is belt and braces.
    if btrim(coalesce(t, '')) ~ '\s' then
      begin
        term_q := phraseto_tsquery('english', public.cx_search_norm(t));
      exception when others then term_q := null;
      end;
      continue when term_q is null or term_q::text = '';
      qs := qs || term_q::text;
      kinds := kinds || 'phrase'::text;
      continue;
    end if;

    norm := lower(regexp_replace(coalesce(t, ''), '[^a-zA-Z0-9]', '', 'g'));
    continue when length(norm) < 3;

    -- Acronym safety, verbatim from v2: a token the 'english' stemmer collapses
    -- below 3 characters goes to the unstemmed vector. This is what carries LVN.
    use_simple := length(norm) <= 4;
    if not use_simple then
      if length(regexp_replace(
           split_part(to_tsquery('english', norm || ':*')::text, ':', 1),
           '''', '', 'g')) < 3 then
        use_simple := true;
      end if;
    end if;

    begin
      if use_simple then term_q := to_tsquery('simple', norm);
      else                term_q := to_tsquery('english', norm || ':*'); end if;
    exception when others then continue;
    end;
    continue when term_q is null or term_q::text = '';
    qs := qs || term_q::text;
    kinds := kinds || (case when use_simple then 'sim' else 'eng' end)::text;
  end loop;

  -- ── 2. One pass: vectors once, every DF in one scan, then the ranked match. ─
  -- PER-SURFACE document frequency. A term generic among the code vocabulary
  -- can still be the discriminating word in a freehand program title. If EVERY
  -- term looks generic on a surface, that surface keeps them all, so a broad
  -- question still answers rather than returning nothing.
  if array_length(qs, 1) is not null then
    return query
    with tv as materialized (
      select p.college, p.program_title, p.award, p.status,
             p.top_code, p.top_title, p.cip_code, p.cip_title,
             v.te, v.ts, v.ce, v.cs, v.te || v.ts as tb, v.ce || v.cs as cb
      from public.coci_college_programs p
      cross join lateral (
        select to_tsvector('english', public.cx_search_norm(p.program_title)) as te,
               to_tsvector('simple',  public.cx_search_norm(p.program_title)) as ts,
               to_tsvector('english', public.cx_search_norm(
                 coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,''))) as ce,
               to_tsvector('simple',  public.cx_search_norm(
                 coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,''))) as cs
      ) v
    ),
    terms as (
      select u.ord, u.q::tsquery as q, u.kind
      from unnest(qs, kinds) with ordinality as u(q, kind, ord)
    ),
    df as (
      select tm.ord, tm.q, tm.kind,
             count(*) filter (where case when tm.kind = 'phrase' then tv.te @@ tm.q else tv.tb @@ tm.q end) as df_t,
             count(*) filter (where case when tm.kind = 'phrase' then tv.ce @@ tm.q else tv.cb @@ tm.q end) as df_c
      from terms tm cross join tv
      group by tm.ord, tm.q, tm.kind
    ),
    sel as (
      select df.ord, df.q, df.kind,
             (df.df_t <= corpus_n * generic_pct)
               or not bool_or(df.df_t <= corpus_n * generic_pct) over () as use_t,
             (df.df_c <= corpus_n * generic_pct)
               or not bool_or(df.df_c <= corpus_n * generic_pct) over () as use_c
      from df
    ),
    q4 as (
      select
        nullif(string_agg(case when sel.kind = 'phrase' then '(' || sel.q::text || ')' else sel.q::text end,
                          ' | ' order by sel.ord)
               filter (where sel.use_t and sel.kind in ('phrase', 'eng')), '')::tsquery as qt_eng,
        nullif(string_agg(sel.q::text, ' | ' order by sel.ord)
               filter (where sel.use_t and sel.kind = 'sim'), '')::tsquery as qt_sim,
        nullif(string_agg(case when sel.kind = 'phrase' then '(' || sel.q::text || ')' else sel.q::text end,
                          ' | ' order by sel.ord)
               filter (where sel.use_c and sel.kind in ('phrase', 'eng')), '')::tsquery as qc_eng,
        nullif(string_agg(sel.q::text, ' | ' order by sel.ord)
               filter (where sel.use_c and sel.kind = 'sim'), '')::tsquery as qc_sim
      from sel
    ),
    hits as (
      select tv.college, tv.program_title, tv.award, tv.status,
             tv.top_code, tv.top_title, tv.cip_code, tv.cip_title,
             (   (q4.qt_eng is not null and tv.te @@ q4.qt_eng)
              or (q4.qt_sim is not null and tv.ts @@ q4.qt_sim)
             ) as title_hit,
             (   (q4.qc_eng is not null and tv.ce @@ q4.qc_eng)
              or (q4.qc_sim is not null and tv.cs @@ q4.qc_sim)
             ) as code_hit,
             greatest(
               case when q4.qt_eng is null then 0 else ts_rank_cd(setweight(tv.te, 'A'), q4.qt_eng) end,
               case when q4.qt_sim is null then 0 else ts_rank_cd(setweight(tv.ts, 'A'), q4.qt_sim) end,
               case when q4.qc_eng is null then 0 else ts_rank_cd(setweight(tv.ce, 'B'), q4.qc_eng) end,
               case when q4.qc_sim is null then 0 else ts_rank_cd(setweight(tv.cs, 'B'), q4.qc_sim) end
             ) as rank
      from tv cross join q4
      where (college_filter is null or tv.college = college_filter)
    )
    select h.college, h.program_title, h.award, h.status,
           h.top_code, h.top_title, h.cip_code, h.cip_title,
           case when h.title_hit and h.code_hit then 'title+code'
                when h.title_hit then 'title'
                else 'code' end as matched_via,
           g.region, g.county, pr.landing_page_url
    from hits h
    left join public.college_geo g on g.college = h.college
    left join public.chatbox_college_profiles pr on pr.college = h.college
    where h.title_hit or h.code_hit
    -- The place anchor leads (never null: IS NOT DISTINCT FROM under the
    -- not-null guard), then the rank the caller has always had.
    order by (anchor_county is not null and g.county is not distinct from anchor_county) desc,
             (anchor_region is not null and g.region is not distinct from anchor_region) desc,
             h.rank desc, h.college asc, h.program_title asc
    limit result_limit;
  end if;

  -- Corpus-side typos only ("Excellance"). A query-side vocabulary gap is the
  -- synonym table's job, not string distance's.
  if not found then
    return query
    select p.college, p.program_title, p.award, p.status,
           p.top_code, p.top_title, p.cip_code, p.cip_title,
           'fuzzy'::text as matched_via,
           g.region, g.county, pr.landing_page_url
    from public.coci_college_programs p
    left join public.college_geo g on g.college = p.college
    left join public.chatbox_college_profiles pr on pr.college = p.college
    where (college_filter is null or p.college = college_filter)
      and (select max(word_similarity(lower(tt), lower(public.cx_search_norm(p.program_title))))
           from unnest(coalesce(search_terms, '{}'::text[])) tt
           where length(tt) >= 6) > fuzzy_floor
    order by
      (anchor_county is not null and g.county is not distinct from anchor_county) desc,
      (anchor_region is not null and g.region is not distinct from anchor_region) desc,
      (select max(word_similarity(lower(tt), lower(public.cx_search_norm(p.program_title))))
       from unnest(coalesce(search_terms, '{}'::text[])) tt
       where length(tt) >= 6) desc,
      p.college asc, p.program_title asc
    limit result_limit;
  end if;
end;
$function$;

-- The drop above discarded the explicit grants; restore them. anon is what the
-- smoke test and every anon-key caller use, service_role is the edge function.
grant execute on function public.search_college_programs(text[], text, integer, numeric, real, text, text)
  to anon, authenticated, service_role;
