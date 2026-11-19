-- The reread batch's live read: each live row's run at 1 colleges, compared with the run of the record origin/main
-- files (b63a4ba96; 48 committed records), for kb/_program_reread_keep_better.py's --checked and live_runs (written by
-- scripts/reread_live_compare_sql.py; S684's shape). Read-only: one SELECT, one JSON value; it writes nothing.
-- The migrate receipt keeps 4,000 characters of a response, so the read returns counts and only the differences.
-- Short keys on purpose: jsonb orders keys by length.
--   at: the read's time. chk: every checked row, by college, at every college. sum: per college, live rows, filed
--   records, rows whose live run equals the filed run, live rows with no run, and the sizes of the two lists below.
--   diff: [college, control number, live run, filed run] where both exist and differ.
--   extra: [college, control number, live run] for a live row the ref files no record for.
--   gone: per college, the control numbers the ref files that have no live row (S687: without it live_runs is a
--   guess wherever a college files more records than it has live rows). chk is limited to these colleges.
with f(college, cn, run) as (values
  ('Skyline College', '30882', '39032119511'),
  ('Skyline College', '31013', '43968403561'),
  ('Skyline College', '31978', '39032119511'),
  ('Skyline College', '32293', '39032119511'),
  ('Skyline College', '32746', '39032119511'),
  ('Skyline College', '32774', '43968403561'),
  ('Skyline College', '32964', '39032119511'),
  ('Skyline College', '33399', '39032119511'),
  ('Skyline College', '35353', '39032119511'),
  ('Skyline College', '35773', '39032119511'),
  ('Skyline College', '36256', '39032119511'),
  ('Skyline College', '36303', '39032119511'),
  ('Skyline College', '36344', '39032119511'),
  ('Skyline College', '37135', '39032119511'),
  ('Skyline College', '37144', '39032119511'),
  ('Skyline College', '37236', '39032119511'),
  ('Skyline College', '37237', '39032119511'),
  ('Skyline College', '38299', '39032119511'),
  ('Skyline College', '39380', '39035209486'),
  ('Skyline College', '39394', '39035209486'),
  ('Skyline College', '39660', '39035209486'),
  ('Skyline College', '41387', '39035209486'),
  ('Skyline College', '41692', '39035209486'),
  ('Skyline College', '41889', '39035209486'),
  ('Skyline College', '42252', '39035209486'),
  ('Skyline College', '42371', '39035209486'),
  ('Skyline College', '42823', '39035209486'),
  ('Skyline College', '44453', '39035209486'),
  ('Skyline College', '44546', '39035209486'),
  ('Skyline College', '44778', '39035209486'),
  ('Skyline College', '44779', '39035209486'),
  ('Skyline College', '44780', '39035209486'),
  ('Skyline College', '44783', '39035209486'),
  ('Skyline College', '44784', '39035209486'),
  ('Skyline College', '44785', '39035209486'),
  ('Skyline College', '44866', '39035209486'),
  ('Skyline College', '44934', '39035209486'),
  ('Skyline College', '44935', '39035209486'),
  ('Skyline College', '45183', '39035209486'),
  ('Skyline College', '45267', '39035209486'),
  ('Skyline College', '45384', '39035209486'),
  ('Skyline College', '45573', '39035209486'),
  ('Skyline College', '45600', '43968403561'),
  ('Skyline College', '45696', '39035209486'),
  ('Skyline College', '45697', '39035209486'),
  ('Skyline College', '45698', '39035209486'),
  ('Skyline College', '45699', '39035209486'),
  ('Skyline College', '45804', '43968403561')
),
l as (select college, control_number as cn, extracted_run::text as run
        from public.program_requirement_records
       where college in ('Skyline College')),
j as (select coalesce(l.college, f.college) as college, coalesce(l.cn, f.cn) as cn,
             l.run as live_run, f.run as filed_run, (l.cn is not null) as is_live, (f.cn is not null) as is_filed
        from l full outer join f on l.college = f.college and l.cn = f.cn)
select jsonb_build_object(
  'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'chk', coalesce((select jsonb_object_agg(college, cns) from (
            select college, jsonb_agg(control_number order by control_number) as cns
              from public.program_requirement_records where checked = true and college in ('Skyline College')
             group by college) c), '{}'::jsonb),
  'sum', (select jsonb_object_agg(college, x) from (
            select college, jsonb_build_array(
                     count(*) filter (where is_live), count(*) filter (where is_filed),
                     count(*) filter (where is_live and is_filed and live_run = filed_run),
                     count(*) filter (where is_live and live_run is null),
                     count(*) filter (where is_live and is_filed and live_run is distinct from filed_run),
                     count(*) filter (where is_live and not is_filed)) as x
              from j group by college) t),
  'diff', coalesce((select jsonb_agg(jsonb_build_array(college, cn, live_run, filed_run) order by college, cn)
                      from j where is_live and is_filed and live_run is distinct from filed_run), '[]'::jsonb),
  'extra', coalesce((select jsonb_agg(jsonb_build_array(college, cn, live_run) order by college, cn)
                       from j where is_live and not is_filed), '[]'::jsonb),
  'gone', coalesce((select jsonb_object_agg(college, cns) from (
            select college, jsonb_agg(cn order by cn) as cns from j where is_filed and not is_live group by college) g),
            '{}'::jsonb)
) as live_compare;
