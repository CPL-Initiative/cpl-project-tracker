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
create or replace function public.search_college_programs(
  search_terms   text[],
  college_filter text    default null,
  result_limit   integer default 150,
  generic_pct    numeric default 0.15,
  fuzzy_floor    real    default 0.6
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
  corpus_n bigint; t text; norm text; term_q tsquery; use_simple boolean; df bigint;
  t_eng_keep text[] := '{}'; t_sim_keep text[] := '{}';
  t_eng_all  text[] := '{}'; t_sim_all  text[] := '{}';
  c_eng_keep text[] := '{}'; c_sim_keep text[] := '{}';
  c_eng_all  text[] := '{}'; c_sim_all  text[] := '{}';
  qt_eng tsquery; qt_sim tsquery; qc_eng tsquery; qc_sim tsquery;
begin
  select count(*) into corpus_n from public.coci_college_programs;
  if corpus_n = 0 then return; end if;

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

      select count(*) into df from public.coci_college_programs p
      where to_tsvector('english', public.cx_search_norm(p.program_title)) @@ term_q;
      t_eng_all := t_eng_all || ('(' || term_q::text || ')');
      if df <= corpus_n * generic_pct then
        t_eng_keep := t_eng_keep || ('(' || term_q::text || ')');
      end if;

      select count(*) into df from public.coci_college_programs p
      where to_tsvector('english', public.cx_search_norm(
              coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,''))) @@ term_q;
      c_eng_all := c_eng_all || ('(' || term_q::text || ')');
      if df <= corpus_n * generic_pct then
        c_eng_keep := c_eng_keep || ('(' || term_q::text || ')');
      end if;

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

    -- PER-SURFACE document frequency. A term generic among the code vocabulary
    -- can still be the discriminating word in a freehand program title.
    select count(*) into df from public.coci_college_programs p
    where (to_tsvector('english', public.cx_search_norm(p.program_title))
        || to_tsvector('simple',  public.cx_search_norm(p.program_title))) @@ term_q;
    if use_simple then
      t_sim_all := t_sim_all || term_q::text;
      if df <= corpus_n * generic_pct then t_sim_keep := t_sim_keep || term_q::text; end if;
    else
      t_eng_all := t_eng_all || term_q::text;
      if df <= corpus_n * generic_pct then t_eng_keep := t_eng_keep || term_q::text; end if;
    end if;

    select count(*) into df from public.coci_college_programs p
    where (to_tsvector('english', public.cx_search_norm(
             coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,'')))
        || to_tsvector('simple',  public.cx_search_norm(
             coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,'')))) @@ term_q;
    if use_simple then
      c_sim_all := c_sim_all || term_q::text;
      if df <= corpus_n * generic_pct then c_sim_keep := c_sim_keep || term_q::text; end if;
    else
      c_eng_all := c_eng_all || term_q::text;
      if df <= corpus_n * generic_pct then c_eng_keep := c_eng_keep || term_q::text; end if;
    end if;
  end loop;

  -- If every term looked generic on a surface, that surface keeps them all.
  if array_length(t_eng_keep, 1) is null and array_length(t_sim_keep, 1) is null then
    t_eng_keep := t_eng_all; t_sim_keep := t_sim_all;
  end if;
  if array_length(c_eng_keep, 1) is null and array_length(c_sim_keep, 1) is null then
    c_eng_keep := c_eng_all; c_sim_keep := c_sim_all;
  end if;

  qt_eng := nullif(array_to_string(t_eng_keep, ' | '), '')::tsquery;
  qt_sim := nullif(array_to_string(t_sim_keep, ' | '), '')::tsquery;
  qc_eng := nullif(array_to_string(c_eng_keep, ' | '), '')::tsquery;
  qc_sim := nullif(array_to_string(c_sim_keep, ' | '), '')::tsquery;

  if qt_eng is not null or qt_sim is not null or qc_eng is not null or qc_sim is not null then
    return query
    with hits as (
      select p.college, p.program_title, p.award, p.status,
             p.top_code, p.top_title, p.cip_code, p.cip_title,
             (   (qt_eng is not null and to_tsvector('english', public.cx_search_norm(p.program_title)) @@ qt_eng)
              or (qt_sim is not null and to_tsvector('simple',  public.cx_search_norm(p.program_title)) @@ qt_sim)
             ) as title_hit,
             (   (qc_eng is not null and to_tsvector('english', public.cx_search_norm(
                    coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,''))) @@ qc_eng)
              or (qc_sim is not null and to_tsvector('simple',  public.cx_search_norm(
                    coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,''))) @@ qc_sim)
             ) as code_hit,
             greatest(
               case when qt_eng is null then 0 else ts_rank_cd(
                 setweight(to_tsvector('english', public.cx_search_norm(p.program_title)), 'A'), qt_eng) end,
               case when qt_sim is null then 0 else ts_rank_cd(
                 setweight(to_tsvector('simple',  public.cx_search_norm(p.program_title)), 'A'), qt_sim) end,
               case when qc_eng is null then 0 else ts_rank_cd(
                 setweight(to_tsvector('english', public.cx_search_norm(
                   coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,''))), 'B'), qc_eng) end,
               case when qc_sim is null then 0 else ts_rank_cd(
                 setweight(to_tsvector('simple',  public.cx_search_norm(
                   coalesce(p.top_title,'') || ' ' || coalesce(p.cip_title,''))), 'B'), qc_sim) end
             ) as rank
      from public.coci_college_programs p
      where (college_filter is null or p.college = college_filter)
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
    order by h.rank desc, h.college asc, h.program_title asc
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
      (select max(word_similarity(lower(tt), lower(public.cx_search_norm(p.program_title))))
       from unnest(coalesce(search_terms, '{}'::text[])) tt
       where length(tt) >= 6) desc,
      p.college asc, p.program_title asc
    limit result_limit;
  end if;
end;
$function$;
