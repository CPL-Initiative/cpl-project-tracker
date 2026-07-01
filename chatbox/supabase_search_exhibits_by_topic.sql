-- Schema of record: public.search_exhibits_by_topic
-- The topic-exhibit lookup behind the shared cpl-chat Edge Function (Sierra +
-- the production map.rccd.edu widget). Applied live via the Supabase MCP,
-- migration `search_exhibits_by_topic_relevance_rank` (Session 93, 2026-07-01).
--
-- WHY THIS REVISION EXISTS (the CPR miss, 2026-07-01):
-- The original function (pre-Session-93, never committed to the repo) selected
--   WHERE to_tsvector(title || cpl_type || collaborative_type || discipline)
--         @@ to_tsquery(search_query)
--   ORDER BY rec_count DESC LIMIT result_limit
-- Two compounding defects:
--   1. cpl_type/collaborative_type inside the searched vector meant a generic
--      query word matched entire CATEGORIES — "certs" ('cert':*) matched every
--      "Industry Certification" row, "exam" every "Credit By Exam" row. A
--      pointed "First Aid and CPR ... certs" question matched 729 of 2,397 rows.
--   2. ORDER BY rec_count DESC has no notion of relevance. 76% of exhibits
--      (1,832 of 2,397) carry rec_count = 1, so once a query matched more rows
--      than the limit, every single-rec exhibit was silently unfindable. All 16
--      CPR/First-Aid exhibits (rec_count 1) ranked at positions 285-677 and were
--      cut; only Cabrillo's EMT+CPR bundle (rec_count 3) survived — exactly what
--      Sierra told Sam before hedging.
--
-- THE FIX: search + rank over a WEIGHTED vector — exhibit_title (weight A) +
-- discipline (weight B) only — ordered by ts_rank_cd, with rec_count demoted to
-- a tiebreaker. cpl_type/collaborative_type stay in the RETURN columns but are
-- no longer searchable text. Signature is unchanged (same args, same TABLE
-- shape), so the production widget is untouched and strictly improved.
--
-- Verified 2026-07-01 by replaying the failing query: the CPR rows moved from
-- positions 285-677 (all cut) to positions 2-8 of the returned set.
-- Regression probes (real estate / NCCER construction / firefighter) all still
-- lead with their expected exhibits. Smoke mode 13 (chatbox/smoke_test.sh)
-- guards this end-to-end.

CREATE OR REPLACE FUNCTION public.search_exhibits_by_topic(search_query text, college_filter text DEFAULT NULL::text, result_limit integer DEFAULT 100)
 RETURNS TABLE(college text, exhibit_title text, exhibit_id text, cpl_type text, collaborative_type text, rec_count integer, sample_courses text[], sample_credit_recs text[], landing_page_url text, discipline text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.college,
    e.exhibit_title,
    e.exhibit_id,
    e.cpl_type,
    e.collaborative_type,
    e.rec_count,
    e.sample_courses,
    e.sample_credit_recs,
    p.landing_page_url,
    e.discipline
  FROM chatbox_exhibits e
  LEFT JOIN chatbox_college_profiles p ON e.college = p.college
  WHERE
    (setweight(to_tsvector('english', COALESCE(e.exhibit_title, '')), 'A') ||
     setweight(to_tsvector('english', COALESCE(e.discipline, '')), 'B'))
    @@ to_tsquery('english', search_query)
    AND (college_filter IS NULL OR e.college = college_filter)
  ORDER BY
    ts_rank_cd(
      setweight(to_tsvector('english', COALESCE(e.exhibit_title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(e.discipline, '')), 'B'),
      to_tsquery('english', search_query)
    ) DESC,
    e.rec_count DESC
  LIMIT result_limit;
END;
$function$;
