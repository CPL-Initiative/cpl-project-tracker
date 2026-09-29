-- Schema of record: public.search_exhibits_by_topic_v2 (+ cx_search_norm)
-- The topic-exhibit lookup behind the shared cpl-chat Edge Function (Sierra +
-- the production map.rccd.edu widget). Applied live via the Supabase MCP in
-- four migrations on 2026-08-06:
--   search_exhibits_by_topic_v2_acronym_safe
--   search_exhibits_v2_separator_normalisation
--   enable_pg_trgm_for_fuzzy_exhibit_search
--   search_exhibits_v2_fuzzy_fallback
--   drop_stale_search_exhibits_v2_overload
--
-- v1 (supabase_search_exhibits_by_topic.sql) is DELIBERATELY LEFT IN PLACE and
-- unmodified. The Edge Function tries v2 first and falls back to v1, so a
-- rollback is removing the v2 call site — no migration required.
--
--
-- WHY THIS EXISTS: the CPR question, broken twice
-- ------------------------------------------------------------------
-- "Which colleges give CPL for a CPR cert?" is the question that keeps
-- exposing this function.
--
--   2026-07-01 (Session 93, v1). cpl_type/collaborative_type sat inside the
--     searched vector, so a generic word matched entire CATEGORIES, and
--     ranking was `ORDER BY rec_count DESC` — which is not relevance at all.
--     All 16 CPR exhibits (rec_count 1) ranked 285-677 and were cut by the
--     limit. Fixed by weighting title/discipline and ranking on ts_rank_cd.
--
--   2026-08-06 (this file, v2). Sierra again answered with 2 colleges when the
--     corpus held 5. FOUR compounding defects, none of them the one that had
--     been fixed:
--
--     1. ACRONYM DESTRUCTION -- and it rode in on the 2026-07-01 fix. That fix
--        added `aed` to the CPR synonym family so any one term would find the
--        whole group. But the caller built `aed:*` and parsed it with the
--        'english' config, where Snowball reads the trailing "-ed" as a
--        past-tense suffix and strips it. The query became `'a':*` — a prefix
--        match on the letter "a" — and since terms are OR'd, that one token
--        matched most of the corpus and pushed the real rows past the cap.
--        A remedy became the next outage.
--
--     2. GENERIC-TERM FLOODING. "cert" matched 445 of 2,397 exhibits (18.6%).
--        It describes the ASK, not the TOPIC.
--
--     3. NO RELEVANCE FLOOR. A query matching nothing returned 200 arbitrary
--        rows rather than an honest zero.
--
--     4. SEPARATOR TOKENISATION. The default parser classifies "Aid/CPR/AED"
--        as a single file-path token, so `cpr` could not match a title that is
--        literally about CPR. Modesto's "HE 100 Standard First Aid/CPR/AED"
--        rows had only ever surfaced by accident — via the word "Certificate".
--
--     5. MISSPELLINGS (Sam, who holds a CPR card, having just Googled the
--        spelling: "like my misspellings :)"). Two different problems wearing
--        one costume. Corpus-side typos are real — "Automotive Service
--        Excellance" is in the data — and are handled HERE by the trigram
--        fallback. Query-side typos are handled in the EDGE FUNCTION, which
--        fuzzy-matches the synonym KEY, because no amount of string distance
--        connects "cardiopulminary" to a title that says "CPR"
--        (word_similarity = 0.069). Fuzzy matching the corpus cannot bridge a
--        vocabulary gap; only the synonym table can.
--
--
-- THE DESIGN
-- ------------------------------------------------------------------
-- Takes RAW TERMS (text[]) rather than a caller-built tsquery, so sanitising
-- happens next to the corpus whose statistics decide it, and a caller can no
-- longer inject an over-broad query.
--
--   * Short tokens (<=4 chars) and any token the English stemmer collapses
--     below 3 characters are matched on an UNSTEMMED 'simple' vector. This is
--     what makes "aed" survivable. Longer tokens keep stemming + prefix match,
--     so "welding" still finds "welder".
--   * Terms whose document frequency exceeds generic_pct of the corpus are
--     dropped. Self-tuning: it caught "engine" (15.5%, prefix-matches
--     "Engineering") without anyone adding it to a list. If EVERY term looks
--     generic we keep them all, so a broad question still answers.
--   * "/", "|", parens and friends are normalised to spaces before tokenising
--     (cx_search_norm), on both the match and the frequency count.
--   * Trigram fallback ONLY when full-text matched nothing, so a normal query
--     never pays for the scan. Floor 0.6 measured against this corpus:
--     'excellence' vs the misspelled 'Excellance' row scores 0.636, unrelated
--     pairs sit near 0.25.
--
-- A NOTE ON THE OVERLOAD TRAP (cost us a live break, caught by the battery):
-- Postgres keys functions by argument signature, so adding `fuzzy_floor` via
-- CREATE OR REPLACE produced a SECOND function rather than replacing the
-- first. A three-argument call — exactly what the Edge Function makes through
-- PostgREST — then failed with "function ... is not unique" (42725). Any
-- future parameter addition must drop the superseded signature explicitly.
--
-- VERIFICATION: chatbox/verify_search_exhibits_v2.sql (self-asserting).
-- Query-side keyword behaviour: tests/sierra_topic_keywords.test.js.

create extension if not exists pg_trgm;

-- Normalise separators that the default parser would otherwise glue into one
-- "file" token. IMMUTABLE so it can back an index.
create or replace function public.cx_search_norm(t text)
returns text language sql immutable parallel safe as
$$ select regexp_replace(coalesce(t, ''), '[/\\|;:,()\[\]]+', ' ', 'g') $$;

create index if not exists chatbox_exhibits_title_trgm
  on chatbox_exhibits using gin (cx_search_norm(exhibit_title) gin_trgm_ops);

create or replace function public.search_exhibits_by_topic_v2(
  search_terms   text[],
  college_filter text    default null,
  result_limit   integer default 100,
  generic_pct    numeric default 0.15,
  fuzzy_floor    real    default 0.6
)
returns table(
  college text, exhibit_title text, exhibit_id text, cpl_type text,
  collaborative_type text, rec_count integer, sample_courses text[],
  sample_credit_recs text[], landing_page_url text, discipline text
)
language plpgsql
stable
as $function$
declare
  corpus_n bigint; t text; norm text; term_q tsquery; use_simple boolean; df bigint;
  eng_keep text[] := '{}'; sim_keep text[] := '{}';
  eng_all  text[] := '{}'; sim_all  text[] := '{}';
  q_eng tsquery; q_sim tsquery;
begin
  select count(*) into corpus_n from chatbox_exhibits;
  if corpus_n = 0 then return; end if;

  foreach t in array coalesce(search_terms, '{}'::text[]) loop
    norm := lower(regexp_replace(coalesce(t, ''), '[^a-zA-Z0-9]', '', 'g'));
    continue when length(norm) < 3;

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

    select count(*) into df from chatbox_exhibits e
    where (to_tsvector('english', cx_search_norm(e.exhibit_title) || ' ' || cx_search_norm(e.discipline))
        || to_tsvector('simple',  cx_search_norm(e.exhibit_title) || ' ' || cx_search_norm(e.discipline))) @@ term_q;

    if use_simple then
      sim_all := sim_all || term_q::text;
      if df <= corpus_n * generic_pct then sim_keep := sim_keep || term_q::text; end if;
    else
      eng_all := eng_all || term_q::text;
      if df <= corpus_n * generic_pct then eng_keep := eng_keep || term_q::text; end if;
    end if;
  end loop;

  if array_length(eng_keep, 1) is null and array_length(sim_keep, 1) is null then
    eng_keep := eng_all; sim_keep := sim_all;
  end if;

  q_eng := nullif(array_to_string(eng_keep, ' | '), '')::tsquery;
  q_sim := nullif(array_to_string(sim_keep, ' | '), '')::tsquery;

  if q_eng is not null or q_sim is not null then
    return query
    select e.college, e.exhibit_title, e.exhibit_id, e.cpl_type, e.collaborative_type,
           e.rec_count, e.sample_courses, e.sample_credit_recs, p.landing_page_url, e.discipline
    from chatbox_exhibits e
    left join chatbox_college_profiles p on p.college = e.college
    where (college_filter is null or e.college = college_filter)
      and (
        (q_eng is not null and
          (setweight(to_tsvector('english', cx_search_norm(e.exhibit_title)), 'A') ||
           setweight(to_tsvector('english', cx_search_norm(e.discipline)),    'B')) @@ q_eng)
        or
        (q_sim is not null and
          (setweight(to_tsvector('simple', cx_search_norm(e.exhibit_title)), 'A') ||
           setweight(to_tsvector('simple', cx_search_norm(e.discipline)),    'B')) @@ q_sim)
      )
    order by
      greatest(
        case when q_eng is null then 0 else ts_rank_cd(
          setweight(to_tsvector('english', cx_search_norm(e.exhibit_title)), 'A') ||
          setweight(to_tsvector('english', cx_search_norm(e.discipline)),    'B'), q_eng) end,
        case when q_sim is null then 0 else ts_rank_cd(
          setweight(to_tsvector('simple', cx_search_norm(e.exhibit_title)), 'A') ||
          setweight(to_tsvector('simple', cx_search_norm(e.discipline)),    'B'), q_sim) end
      ) desc,
      e.rec_count desc nulls last
    limit result_limit;
  end if;

  if not found then
    return query
    select e.college, e.exhibit_title, e.exhibit_id, e.cpl_type, e.collaborative_type,
           e.rec_count, e.sample_courses, e.sample_credit_recs, p.landing_page_url, e.discipline
    from chatbox_exhibits e
    left join chatbox_college_profiles p on p.college = e.college
    where (college_filter is null or e.college = college_filter)
      and (select max(word_similarity(lower(tt), lower(cx_search_norm(e.exhibit_title))))
           from unnest(coalesce(search_terms, '{}'::text[])) tt
           where length(tt) >= 6) > fuzzy_floor
    order by
      (select max(word_similarity(lower(tt), lower(cx_search_norm(e.exhibit_title))))
       from unnest(coalesce(search_terms, '{}'::text[])) tt
       where length(tt) >= 6) desc,
      e.rec_count desc nulls last
    limit result_limit;
  end if;
end;
$function$;
