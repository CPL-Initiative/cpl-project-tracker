-- S742 lane 1 (readers): the live read for seven colleges (read-only, one SELECT, one JSON value).
-- The keys this lane holds tonight: Cuyamaca 18637; El Camino 19861, 19866, 38948, 43993, 19883 and 19857; Coastline
-- 43057 (and 33014, the legacy program read from the 2.0 degree's page); Modesto Junior 35127; Reedley 30465; Los
-- Angeles Pierce 19181; Grossmont 21402. A reread posts a committed record, and kb/_program_reread_keep_better.py
-- runs first, from this read: the control numbers a person checked (by_college) and every live row's run
-- (live_runs), at each college. `rows` holds each key's live row beside the run its committed record holds
-- (v.filed_run): whether a person checked it, md5 of its record and checks as jsonb text, and its checks' figures.
-- The conductor files the value whole as kb/receipts/program_requirements_reread_s742_readers_checked.json
-- (keep-better's --checked file). A key with no live row comes back with a null run.
with c(college) as (values
  ('Cuyamaca College'), ('El Camino College'), ('Coastline Community College'), ('Modesto Junior College'),
  ('Reedley College'), ('Los Angeles Pierce College'), ('Grossmont College')),
v(college, control_number, filed_run) as (values
  ('Cuyamaca College', '18637', 38748833332),
  ('El Camino College', '19861', 45768189197),
  ('El Camino College', '19866', 45768189197),
  ('El Camino College', '38948', 45768189197),
  ('El Camino College', '43993', 45768189197),
  ('El Camino College', '19883', 45768189197),
  ('El Camino College', '19857', 44480396671),
  ('Coastline Community College', '43057', 38445051060),
  ('Coastline Community College', '33014', 38445051060),
  ('Modesto Junior College', '35127', 45772245635),
  ('Reedley College', '30465', 39616074283),
  ('Los Angeles Pierce College', '19181', 44475498778),
  ('Grossmont College', '21402', 39061728041))
select json_build_object(
  'what', 'S742 lane 1 readers: keep-better live read at seven colleges, and the held keys'' live rows',
  'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'row_counts', (select json_object_agg(c.college, (select count(*) from public.program_requirement_records r
                                                     where r.college = c.college)) from c),
  'by_college', (select json_object_agg(c.college,
                   coalesce((select json_agg(r.control_number order by r.control_number)
                               from public.program_requirement_records r
                              where r.college = c.college and r.checked), '[]'::json)) from c),
  'live_runs', (select json_object_agg(c.college,
                  coalesce((select json_object_agg(r.control_number, r.extracted_run::text)
                              from public.program_requirement_records r
                             where r.college = c.college), '{}'::json)) from c),
  'listed', (select count(*) from v),
  'rows', (select json_agg(json_build_object(
             'college', v.college, 'cn', v.control_number, 'filed_run', v.filed_run, 'live_run', r.extracted_run,
             'checked', r.checked, 'rec_md5', md5(r.record::text), 'chk_md5', md5(r.checks::text),
             'arithmetic', r.checks->>'arithmetic', 'coverage', r.checks->'coverage',
             'invented', r.checks->'invented', 'gaps', r.checks->'gaps')
           order by v.college, v.control_number)
           from v left join public.program_requirement_records r
             on r.college = v.college and r.control_number = v.control_number));
