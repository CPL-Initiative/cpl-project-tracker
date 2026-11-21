-- The S691 pages worker's second live read (read-only: one SELECT, one JSON value; nothing is written).
-- Keep-the-better's step=load at Solano names 24 records an earlier run (44514080886) filed, and at West Los Angeles
-- 38677 (run 44475503054), as having no live row only because the first read (2026-11-21_s691_pages_live_read.sql,
-- run 44884703771) did not name them. This read names them.
--   at: the read's time. live: each named control number with a live row, "<control number>": "<extracted_run>,<checked>".
with f(college, cn) as (values
  ('Solano Community College', '06535'), ('Solano Community College', '07808'), ('Solano Community College', '30671'),
  ('Solano Community College', '30678'), ('Solano Community College', '32121'), ('Solano Community College', '32126'),
  ('Solano Community College', '32495'), ('Solano Community College', '32917'), ('Solano Community College', '32918'),
  ('Solano Community College', '32919'), ('Solano Community College', '32927'), ('Solano Community College', '32937'),
  ('Solano Community College', '32992'), ('Solano Community College', '33373'), ('Solano Community College', '35808'),
  ('Solano Community College', '36249'), ('Solano Community College', '36511'), ('Solano Community College', '37103'),
  ('Solano Community College', '43948'), ('Solano Community College', '44069'), ('Solano Community College', '44820'),
  ('Solano Community College', '44833'), ('Solano Community College', '46127'), ('Solano Community College', '46128'),
  ('West Los Angeles College', '38677')
),
c(college) as (select distinct college from f)
select jsonb_build_object(
  'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'live', (select jsonb_object_agg(c.college, coalesce((
             select jsonb_object_agg(r.control_number, r.extracted_run::text || ',' || r.checked::text)
               from public.program_requirement_records r join f on f.college = r.college and f.cn = r.control_number
              where r.college = c.college), '{}'::jsonb)) from c)
) as live_read_b;
