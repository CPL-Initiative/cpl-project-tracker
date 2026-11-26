-- S740C lane 2's cheap piles at College of the Canyons (1 rows: units_within_printed_range 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_college_of_the_canyons_2026-11-26_s740c.json
-- (before_image per row).
-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,
-- and no person's check. It aborts, writing nothing, unless it matches the plan's 1 rows less
-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'College of the Canyons', '36793', 44769429877, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"HOSP-101","units":3,"units_max":null}],"minimum":null,"name":"Program Requirements","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"CULARTS-110","units":2,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"ECON-C2001H","units":3}],"catalog_addition":true,"code":"ECON-C2001","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HOSP-150","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HOSP-220","units":3,"units_max":null}],"minimum":9,"name":"Plus nine units from the following","option_group":null,"rule":"choose_units","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"BUS-201","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS-211","units":3,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"STAT-C1000E","units":5},{"catalog_addition":false,"code":"STAT-C1000H","units":4}],"catalog_addition":false,"code":"STAT-C1000","units":4,"units_max":null}],"minimum":2,"name":"Plus two courses from the following for six to ten units","option_group":null,"rule":"choose_courses","stated":{"max":10,"min":6}}],"program":{"careers":[],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":"CalGETC","ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":["Students will be able to demonstrate proficiency in the core skills and knowledge required for entry level employment in the hospitality management industry."],"section_heading":"Associate in Science for Transfer Degree: Hospitality Management","total_units":{"max":22,"min":18}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":11,"placed":11}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":null,"source":80,"unit_arithmetic":50},"coverage":true,"gaps":["units_within_printed_range"],"invented":true,"listed":11,"placed":11}'::jsonb)),
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
e(expect) as (values (1)),
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
            then ('s740c piles confirm guard: ' || f.n || ' rows hold a matching confirm verdict ' || f.keys::text)::int::text::json
            when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s740c piles guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e, f;
