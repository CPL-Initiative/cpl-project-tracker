-- S748 lane 1 (keys): the live read at San Bernardino Valley and San Jose City, in the compact form (read-only, one
-- SELECT, one JSON value). The two colleges' free reconciles (San Bernardino Valley's and_units and repeat steps for
-- Music A.A. 04894; San Jose City's CGID renumbers and pooled 18 units for 18449, 41533, 42682 and 44388) are kept
-- or restored by kb/_program_reread_keep_better.py from this read, before any reread posts them: the control
-- numbers a person checked (by_college, a list) and every live row's run.
-- live_runs comes back grouped by run, {"<college>": {"<run>": "<cn>,<cn>,..."}}, the control numbers in "C" order,
-- with each college's row count and the md5 of its "<cn>:<run>" pairs joined by commas in "C" order of control
-- number. kb/_live_read_expand.py checks the count and the md5 and writes keep-better's own shape.
-- keys (beside the compact form, which the expander leaves alone): the twelve control numbers of the brief and of
-- San Jose City's three sister programs, each with the state's status, its live run, whether a person checked it,
-- its named gaps and its three flat checks. It answers two things the committed files cannot: that Santa Ana 31859
-- and 21789, Copper Mountain 43854, 14737 and 20094 and San Diego City 22367 are collected already (S741), and
-- whether San Jose City 18449, 41533, 42682 and 44388 are 'Approved' rows outside the census's Active universe.
with c(college) as (values ('San Bernardino Valley College'), ('San Jose City College')),
k(college, cn) as (values
  ('Santa Ana College', '31859'), ('Santa Ana College', '21789'),
  ('Copper Mountain College', '43854'), ('Copper Mountain College', '14737'), ('Copper Mountain College', '20094'),
  ('San Diego City College', '22367'),
  ('San Jose City College', '18449'), ('San Jose City College', '41533'), ('San Jose City College', '42682'),
  ('San Jose City College', '44388'),
  ('San Bernardino Valley College', '04894'), ('San Bernardino Valley College', '04860')),
g as (select r.college, r.extracted_run::text as run,
             string_agg(r.control_number, ',' order by r.control_number collate "C") as cns
        from public.program_requirement_records r join c on c.college = r.college
       group by r.college, r.extracted_run)
select json_build_object(
  'what', 'S748 lane 1 keys: keep-better live read, San Bernardino Valley and San Jose City (compact: live_runs grouped by run), and twelve keys',
  'form', 'compact-by-run',
  'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'count', (select json_object_agg(c.college, (select count(*) from public.program_requirement_records r
                                                where r.college = c.college)) from c),
  'md5', (select json_object_agg(c.college,
            (select md5(coalesce(string_agg(r.control_number || ':' || r.extracted_run::text, ','
                                            order by r.control_number collate "C"), ''))
               from public.program_requirement_records r where r.college = c.college)) from c),
  'by_college', (select json_object_agg(c.college,
                   coalesce((select json_agg(r.control_number order by r.control_number collate "C")
                               from public.program_requirement_records r
                              where r.college = c.college and r.checked), '[]'::json)) from c),
  'live_runs', (select json_object_agg(c.college,
                  coalesce((select json_object_agg(g.run, g.cns) from g where g.college = c.college),
                           '{}'::json)) from c),
  'keys', (select json_agg(json_build_object(
              'college', k.college, 'cn', k.cn,
              'status', (select p.status from public.coci_college_programs p
                          where p.college = k.college and p.control_number = k.cn limit 1),
              'run', r.extracted_run::text, 'checked', r.checked,
              'gaps', r.checks -> 'gaps', 'coverage', r.checks -> 'coverage', 'invented', r.checks -> 'invented',
              'arithmetic', r.checks -> 'arithmetic')
            order by k.college, k.cn)
             from k left join public.program_requirement_records r
               on r.college = k.college and r.control_number = k.cn));
