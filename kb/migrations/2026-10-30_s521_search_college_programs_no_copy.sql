-- search_college_programs reads the table, not a copy of it (S521, 2026-10-30).
--
-- Applies the function block of chatbox/supabase_search_college_programs.sql as it stands
-- after S521 (its NO COPY note carries the why and the numbers). Same signature, so CREATE OR
-- REPLACE keeps the grants ({=X, postgres=X, anon=X, authenticated=X, service_role=X}) and
-- PostgREST sees one candidate. No table, index or row changes.
--
-- Sam, Open Asks Sheet 142 card 1, 00:21Z 2026-10-30: "tonight" (the handoff of 2026-10-29 had
-- held function changes until after the Summit). Apply it by pointing kb/migrations/.apply here:
--   file=kb/migrations/2026-10-30_s521_search_college_programs_no_copy.sql
--   name=s521_search_college_programs_no_copy
-- then run the after-read in kb/receipts/search_college_programs_no_copy_2026-10-30_s521.sql.
--
-- BEFORE  md5(prosrc) ff716ac2b17267d8154dfce76a627d68 (11,183 chars) = the file at 72ff7a94
-- AFTER   md5(prosrc) e803674b239fcdd4675bbdff8898e0b2 (11,139 chars) = the block below
--
-- Rollback: point kb/migrations/.apply at
-- kb/migrations/2026-10-30_s521_search_college_programs_no_copy_rollback.sql (the BEFORE block,
-- verbatim), and git revert the source-file change.

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

  -- ── 2. One pass: stored vectors, every DF in one scan, then the ranked match.
  -- The four vectors are columns of the row (STORED VECTORS above, 2026-09-30);
  -- nothing here builds a tsvector. PER-SURFACE document frequency. A term generic among the code vocabulary
  -- can still be the discriminating word in a freehand program title. If EVERY
  -- term looks generic on a surface, that surface keeps them all, so a broad
  -- question still answers rather than returning nothing.
  -- Both passes read the table itself, never a copy of it (NO COPY above).
  if array_length(qs, 1) is not null then
    return query
    with terms as (
      select u.ord, u.q::tsquery as q, u.kind
      from unnest(qs, kinds) with ordinality as u(q, kind, ord)
    ),
    df as (
      select tm.ord, tm.q, tm.kind,
             count(*) filter (where case when tm.kind = 'phrase' then p.tsv_title_en @@ tm.q
                                          else p.tsv_title_en @@ tm.q or p.tsv_title_simple @@ tm.q end) as df_t,
             count(*) filter (where case when tm.kind = 'phrase' then p.tsv_code_en @@ tm.q
                                          else p.tsv_code_en @@ tm.q or p.tsv_code_simple @@ tm.q end) as df_c
      from terms tm cross join public.coci_college_programs p
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
      select p.college, p.program_title, p.award, p.status,
             p.top_code, p.top_title, p.cip_code, p.cip_title,
             (   (q4.qt_eng is not null and p.tsv_title_en @@ q4.qt_eng)
              or (q4.qt_sim is not null and p.tsv_title_simple @@ q4.qt_sim)
             ) as title_hit,
             (   (q4.qc_eng is not null and p.tsv_code_en @@ q4.qc_eng)
              or (q4.qc_sim is not null and p.tsv_code_simple @@ q4.qc_sim)
             ) as code_hit,
             greatest(
               case when q4.qt_eng is null then 0 else ts_rank_cd(setweight(p.tsv_title_en, 'A'), q4.qt_eng) end,
               case when q4.qt_sim is null then 0 else ts_rank_cd(setweight(p.tsv_title_simple, 'A'), q4.qt_sim) end,
               case when q4.qc_eng is null then 0 else ts_rank_cd(setweight(p.tsv_code_en, 'B'), q4.qc_eng) end,
               case when q4.qc_sim is null then 0 else ts_rank_cd(setweight(p.tsv_code_simple, 'B'), q4.qc_sim) end
             ) as rank
      from public.coci_college_programs p cross join q4
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
    -- The place anchor leads (never null: IS NOT DISTINCT FROM under the
    -- not-null guard), then the rank the caller has always had.
    order by (anchor_county is not null and g.county is not distinct from anchor_county) desc,
             (anchor_region is not null and g.region is not distinct from anchor_region) desc,
             h.rank desc, h.college asc, h.program_title asc
    limit result_limit;
  end if;

  -- Corpus-side typos only ("Excellance"). A query-side vocabulary gap is the
  -- synonym table's job, not string distance's.
  --
  -- ⚠️ TWO BRANCHES, ONE PER SCOPE (S400, 2026-10-16). This fallback filtered
  -- with `(college_filter is null or p.college = college_filter)`. plpgsql
  -- caches a GENERIC plan after a few calls on a pooled connection, and a
  -- generic plan cannot use coci_programs_college for that OR, so a call scoped
  -- to one college scanned all 22,335 statewide programs: 2.06 s measured under
  -- force_generic_plan (2.65 s for the whole call, anon's limit is 3 s), against
  -- 0.25 s for `p.college = $1`. The smoke's 7l negative control (a nonsense
  -- phrase at Mt. San Antonio, every call reaching this fallback) timed out
  -- with 57014 on 2026-10-16 (run 38957574640). Rows are unchanged: with a
  -- college named the two filters are the same predicate, and the statewide
  -- branch keeps the original text.
  if not found and college_filter is not null then
    return query
    select p.college, p.program_title, p.award, p.status,
           p.top_code, p.top_title, p.cip_code, p.cip_title,
           'fuzzy'::text as matched_via,
           g.region, g.county, pr.landing_page_url
    from public.coci_college_programs p
    left join public.college_geo g on g.college = p.college
    left join public.chatbox_college_profiles pr on pr.college = p.college
    where p.college = college_filter
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
  elsif not found then
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
