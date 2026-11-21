-- The S691 pages worker's live read for keep-the-better (read-only: one SELECT, one JSON value; nothing is written).
-- San Joaquin Delta (extraction 44883860902), West Los Angeles (44883863572) and Solano (the extraction from capture
-- 44883709684): the control numbers each extraction read, 19752 beside them (the filing dropped its record file).
--   at: the read's time. chk: each college's checked control numbers.
--   live: each college's named control numbers with a live row, as "<control number>": "<extracted_run>".
with f(college, cn) as (values
  ('San Joaquin Delta College', '13976'), ('San Joaquin Delta College', '17506'), ('San Joaquin Delta College', '18586'),
  ('San Joaquin Delta College', '18815'), ('San Joaquin Delta College', '19752'), ('San Joaquin Delta College', '31692'),
  ('San Joaquin Delta College', '32341'), ('San Joaquin Delta College', '32913'), ('San Joaquin Delta College', '36535'),
  ('San Joaquin Delta College', '36747'), ('San Joaquin Delta College', '37638'), ('San Joaquin Delta College', '40824'),
  ('San Joaquin Delta College', '40902'), ('San Joaquin Delta College', '40903'), ('San Joaquin Delta College', '40904'),
  ('San Joaquin Delta College', '44322'), ('San Joaquin Delta College', '44860'), ('San Joaquin Delta College', '44912'),
  ('San Joaquin Delta College', '45583'), ('San Joaquin Delta College', '45621'),
  ('West Los Angeles College', '46261'),
  ('Solano Community College', '06541'), ('Solano Community College', '06552'), ('Solano Community College', '06555'),
  ('Solano Community College', '20988'), ('Solano Community College', '20992'), ('Solano Community College', '31761'),
  ('Solano Community College', '32475'), ('Solano Community College', '33305'), ('Solano Community College', '38404'),
  ('Solano Community College', '38652'), ('Solano Community College', '41377')
),
c(college) as (select distinct college from f)
select jsonb_build_object(
  'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'chk', (select jsonb_object_agg(c.college, coalesce((
             select jsonb_agg(r.control_number order by r.control_number)
               from public.program_requirement_records r
              where r.checked = true and r.college = c.college), '[]'::jsonb)) from c),
  'live', (select jsonb_object_agg(c.college, coalesce((
             select jsonb_object_agg(r.control_number, r.extracted_run::text)
               from public.program_requirement_records r join f on f.college = r.college and f.cn = r.control_number
              where r.college = c.college), '{}'::jsonb)) from c)
) as live_read;
