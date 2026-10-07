-- The read behind kb/program_requirements_pilot/map_cr_by_course.json: MAP's credit
-- recommendations per course code at the harvest's colleges. Counts and exhibit titles
-- only; no student column is selected. Run through the Supabase MCP (the table is
-- reviewer-gated) and file the rows in map_cr_by_course.json by hand.
-- A college_course string naming several courses counts toward each course it names.
with u as (
  select c.college_name college, u.source_code, u.exhibit_id, u.credit_rec,
         (regexp_matches(u.college_course, '(?:^|,\s*)([A-Z][A-Z0-9&/ ]*?)-([0-9A-Z][0-9A-Z.]*)', 'g')) m
  from map_colleges c join map_college_cr_unit u on u.college_id = c.college_id
  where c.college_name in ('Cerritos College','Irvine Valley College','Mt. San Antonio College','Riverside City College','San Diego Miramar College','Santa Monica College','West Los Angeles College')
    and coalesce(u.college_course,'') <> ''
), p as (
  select college, m[1] || ' ' || m[2] code, source_code, exhibit_id, credit_rec from u
), t as (
  select p.*, coalesce(a.title, (select x.exhibit_title from chatbox_exhibits x where x.exhibit_id::text = p.exhibit_id::text limit 1)) title,
         coalesce(nullif(p.source_code,''), 'unnamed') src from p
  left join map_ace_exhibit_titles a on a.exhibit_id = p.exhibit_id
)
select college, code, count(distinct credit_rec) recs, count(distinct exhibit_id) exhibits,
  (select jsonb_object_agg(src, n) from (select src, count(distinct exhibit_id) n from t t3 where t3.college=t.college and t3.code=t.code group by src) s) exhibits_by_source,
  (select jsonb_agg(jsonb_build_object('title', title, 'source', src, 'recs', n) order by n desc, title) from (select title, src, count(distinct credit_rec) n from t t2 where t2.college=t.college and t2.code=t.code and title is not null group by title, src) z) titles,
  (select count(distinct exhibit_id) from t t4 where t4.college=t.college and t4.code=t.code and t4.title is null) untitled_exhibits
from t group by college, code order by college, code;
