-- S741E lane 2's cheap piles at Contra Costa (2 rows: degree_summary_ge_none 1, noted_unit_floor 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s741_contra_costa_2026-11-27_s741e.json
-- (before_image per row).
-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,
-- and no person's check. It aborts, writing nothing, unless it matches the plan's 2 rows less
-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'Contra Costa College', '01400', 44687786167, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"AUSER123","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AUSER125","units":5,"units_max":null}],"minimum":null,"name":"1st Semester","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"AUSER124","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AUSER126","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AUSER153","units":3,"units_max":null}],"minimum":null,"name":"2nd Semester","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"AUSER141","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AUSER225","units":5,"units_max":null}],"minimum":null,"name":"3rd Semester","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"AUSER226","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AUSER238","units":3,"units_max":null}],"minimum":null,"name":"4th Semester","option_group":null,"rule":"all","stated":{"max":null,"min":null}}],"program":{"careers":[],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":60,"min":60},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Automotive Collision Repair Technology - A.S. Degree","total_units":{"max":37,"min":37}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":9,"placed":9}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":50,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["degree_summary_ge_none"],"invented":true,"listed":9,"placed":9}'::jsonb),
  (2, 'Contra Costa College', '40761', 44687786167, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"CIS101","units":4,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"CIS135","units":4,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"COMP110","units":2,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CCT275","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CCT155","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CCT160","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CIS099","units":1,"units_max":4}],"minimum":null,"name":"Required Courses with suggested sequence","option_group":null,"rule":"all","stated":{"max":null,"min":null}}],"program":{"careers":["Computer User Support Specialists","Computer Network Support Specialists"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Information Technology - Certificate of Achievement","total_units":{"max":22,"min":22}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":6,"placed":5}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":83,"ge_pattern":null,"source":100,"unit_arithmetic":70},"coverage":true,"gaps":["noted_unit_floor"],"invented":true,"listed":6,"placed":5}'::jsonb)),
c as (select count(*) filter (where r.checked is true) as n,
             coalesce(json_agg(v.i order by v.i) filter (where r.checked is true), '[]'::json) as keys
        from v join public.program_requirement_records r
          on r.college = v.college and r.control_number = v.control_number),
f as (select count(*) as n, coalesce(json_agg(v.i order by v.i), '[]'::json) as keys
        from v join public.program_requirement_records r
          on r.college = v.college and r.control_number = v.control_number
        join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv
                       where pv.college = v.college and pv.control_number = v.control_number
                       order by pv.id desc limit 1) lv on true
       where lv.verdict = 'confirm' and lv.requirements_fp = public.program_record_fp(r.record)),
e(expect) as (values (2)),
u as (
update public.program_requirement_records r
   set checks = v.after_checks
  from v
 where r.college = v.college and r.control_number = v.control_number
   and r.extracted_run = v.extracted_run and r.checks = v.before_checks and r.record = v.before_record
   and r.checked is not true
returning v.i),
s as (select count(*) as n, coalesce(json_agg(i order by i), '[]'::json) as keys from u)
select case when f.n > 0
            then ('s741e piles confirm guard: ' || f.n || ' rows hold a matching confirm verdict ' || f.keys::text)::int::text::json
            when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s741e piles guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e, f;
