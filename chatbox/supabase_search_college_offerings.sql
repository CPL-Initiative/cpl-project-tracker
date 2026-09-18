-- Schema of record: public.search_college_offerings.
--
-- The COURSE-catalog lookup behind the shared cpl-chat Edge Function (Sierra):
-- "which colleges TEACH this?", read from coci_college_offerings — the rollup
-- of the 141k-row COCI course list by (college x TOP program), with sample
-- courses and the titles text the tsquery matches against.
--
-- This function existed only LIVE until 2026-09-18 — no file of record, so the
-- body below was read back with pg_get_functiondef before it was changed, and
-- everything but the two anchor parameters and the leading ORDER BY keys is
-- verbatim. Applied live via the Supabase MCP on 2026-09-18 as:
--   search_college_offerings_place_anchor
--
--
-- THE PLACE ANCHOR (2026-09-18, S273): anchor_county / anchor_region
-- ------------------------------------------------------------------
-- The edge function ranks colleges by proximity only AFTER this function has
-- applied result_limit, and until v68 only against a RESOLVED college. Sam's
-- test question named "orange county" and no college, so the county anchored
-- nothing; and once the offerings builder could express phrases (see the
-- tsQueryFromTerms note in cpl-chat), the CNA/LVN query matched 323 rows over
-- 104 colleges against a 150-row limit — 18 of them in Orange County, and
-- nothing but rank deciding which survived the cut. The anchor is applied
-- HERE, as the leading ORDER BY keys — same county first, then same region,
-- then the rank the caller has always had — and never as a filter: a county
-- with no matching college still returns the nearest ones, which is the
-- answer that county needs. Null anchors leave the order exactly as it was.
--
-- ⚠️ THE OVERLOAD TRAP: Postgres keys functions by argument signature, so a
-- parameter added via CREATE OR REPLACE leaves a SECOND function behind and a
-- PostgREST call then fails with 42725 "is not unique". The superseded
-- signature is dropped first, in the same transaction, and the grants the drop
-- discards are restored at the end.
--
-- VERIFICATION: chatbox/verify_search_college_offerings.sql (self-asserting).
-- Query-side route: tests/sierra_offerings_retrieval.test.js and
-- tests/sierra_place_anchor.test.js; smoke modes 7r and 7c.

drop function if exists public.search_college_offerings(text, text, integer);

create or replace function public.search_college_offerings(
  search_query   text,
  college_filter text    default null,
  result_limit   integer default 60,
  anchor_county  text    default null,
  anchor_region  text    default null
)
returns table(
  college text, top_code text, top_title text,
  course_count integer, credit_count integer, noncredit_count integer, cid_count integer,
  sample_courses jsonb, region text, county text, landing_page_url text
)
language plpgsql
stable
as $function$
declare tsq tsquery;
begin
  tsq := to_tsquery('english', search_query);
  return query
  select o.college, o.top_code, o.top_title,
         o.course_count, o.credit_count, o.noncredit_count, o.cid_count,
         o.sample_courses, g.region, g.county, p.landing_page_url
  from public.coci_college_offerings o
  left join public.college_geo g on g.college = o.college
  left join public.chatbox_college_profiles p on p.college = o.college
  where to_tsvector('english', coalesce(o.top_title,'') || ' ' || coalesce(o.titles_text,'')) @@ tsq
    and (college_filter is null or o.college = college_filter)
  -- The place anchor leads (never null: IS NOT DISTINCT FROM under the
  -- not-null guard), then the rank the caller has always had.
  order by (anchor_county is not null and g.county is not distinct from anchor_county) desc,
           (anchor_region is not null and g.region is not distinct from anchor_region) desc,
           ts_rank(
             setweight(to_tsvector('english', coalesce(o.top_title,'')), 'A') ||
             setweight(to_tsvector('english', coalesce(o.titles_text,'')), 'D'),
             tsq) desc,
           o.course_count desc
  limit result_limit;
end $function$;

grant execute on function public.search_college_offerings(text, text, integer, text, text)
  to anon, authenticated, service_role;
