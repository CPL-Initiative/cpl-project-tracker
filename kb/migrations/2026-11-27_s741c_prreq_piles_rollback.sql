-- S741C lane 2's cheap piles at El Camino (2 rows: total_differs 2). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s741_el_camino_2026-11-27_s741c.json
-- (before_image per row).
-- Rollback, NOT applied: the before-image's checks back where the row still holds the
-- after-image, skipping and listing a row a person checked. A rollback lasts only until the
-- next load of that college: revert the record files too (git revert of this plan's commit).
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'El Camino College', '31319', 45768189197, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"MUSI 101","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"MUSI 180","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"MUSI 181A","units":2,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"MUSI 181B","units":2,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"MUSI 182","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"MUSI 284","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"MUSI 285","units":3,"units_max":null}],"minimum":null,"name":"Required Courses","option_group":null,"rule":"all","stated":{"max":null,"min":null}}],"program":{"careers":[],"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Commercial Music Certificate of Achievement","total_units":{"max":20,"min":20}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":8,"placed":7}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":88,"ge_pattern":null,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["total_differs"],"invented":true,"listed":8,"placed":7}'::jsonb),
  (2, 'El Camino College', '42541', 45768189197, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"BUS 150","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS 151","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ECON C2001","units":3,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"ECON C2002H","units":3}],"catalog_addition":false,"code":"ECON C2002","units":3,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"LAW 5","units":3}],"catalog_addition":false,"code":"LAW 4","units":4,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"MATH 140","units":4},{"catalog_addition":false,"code":"MATH 190","units":5}],"catalog_addition":false,"code":"MATH 165","units":5,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"STAT C1000H","units":4},{"catalog_addition":false,"code":"BUS 116","units":3}],"catalog_addition":false,"code":"STAT C1000","units":4,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"BUS 108","units":3}],"catalog_addition":false,"code":"BUS 101","units":3,"units_max":null}],"minimum":null,"name":"Required Core","option_group":null,"rule":"all","stated":{"max":30,"min":28}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"CIS 13","units":3,"units_max":null}],"minimum":null,"name":"Recommended Elective","option_group":null,"rule":"recommended","stated":{"max":null,"min":null}}],"program":{"careers":["accounting","management","marketing","office administration"],"degree_total":{"max":60,"min":60},"electives_fill_degree":true,"ge_pattern":"Cal-GETC","ge_units":{"max":34,"min":34},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Business Administration 2.0, AS-T","total_units":{"max":30,"min":28}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":16,"placed":16}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":100,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["total_differs"],"invented":true,"listed":16,"placed":16}'::jsonb)),
c as (select count(*) filter (where r.checked is true) as n,
             coalesce(json_agg(v.i order by v.i) filter (where r.checked is true), '[]'::json) as keys
        from v join public.program_requirement_records r
          on r.college = v.college and r.control_number = v.control_number),
-- A partial rollback: set expect below to the smaller count you mean.
e(expect) as (values (2)),
u as (
update public.program_requirement_records r
   set checks = v.before_checks
  from v
 where r.college = v.college and r.control_number = v.control_number
   and r.extracted_run = v.extracted_run and r.checks = v.after_checks
   and r.checked is not true
returning v.i),
s as (select count(*) as n, coalesce(json_agg(i order by i), '[]'::json) as keys from u)
select case when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s741c piles rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;
