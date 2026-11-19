-- S681 (SkyGrebe), 2026-11-18: roll back Chabot College's course outcomes load of run 44285558570.
-- Why: the outline reader did not know Chabot's two headings ("Measurable Objectives:" and "3. Student Learning
-- Outcomes"), so read 44264136885 filed every course's objectives as its student learning outcomes and never read
-- the outcomes themselves. All 1,013 rows the load inserted are kind=slo and hold objectives.
-- What: the load receipt's own rollback (kb/receipts/course_outcomes_chabot_44285558570.json: ids 30392 to 31404,
-- contiguous, 1,013 of them), narrowed by college, kind and read run. The statement aborts, deleting nothing,
-- unless it matches exactly 1,013 rows.
-- To undo this delete: load the same filed read again (kb/course_outcomes/.load with host=chabot, on a branch that
-- holds kb/course_outcomes/chabot/read_44264136885_p{1,2,3}of3.json); the load inserts every block the table lacks.
-- A later night reads Chabot again with the fixed reader (PR #3492) and loads both kinds.
with d as (
  delete from public.course_outcomes
   where id between 30392 and 31404
     and college = 'Chabot College' and kind = 'slo' and read_run::text = '44264136885'
  returning id),
s as (select count(*) as n, min(id) as first_id, max(id) as last_id from d)
select case when s.n = 1013
            then json_build_object('deleted', s.n, 'first_id', s.first_id, 'last_id', s.last_id)
            else ('s681 chabot rollback guard: the DELETE matched ' || s.n || ' rows, the receipt names 1013')::int::text::json end as returned
  from s;
