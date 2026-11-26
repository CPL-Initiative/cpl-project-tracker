-- S740R3 lane 2's cheap piles at Copper Mountain (1 rows: noted_figures_differ 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_copper_mountain_2026-11-26_s740r3.json
-- (before_image per row).
-- Rollback, NOT applied: the before-image's checks back where the row still holds the
-- after-image, skipping and listing a row a person checked. A rollback lasts only until the
-- next load of that college: revert the record files too (git revert of this plan's commit).
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'Copper Mountain College', '42178', 39035222722, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":true,"code":"BIOL 005","units":4,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"BIOL 006","units":4,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"CH 001A","units":5,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"CH 001B","units":5,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"MATH C2210","units":4,"units_max":null}],"minimum":null,"name":"Required Courses","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"PH 002A","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PH 002B","units":4,"units_max":null}],"minimum":null,"name":"Physics Requirement: PH 002A & 002B series","option_group":"Physics series","rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":true,"code":"PH 004A","units":4,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"PH 004B","units":4,"units_max":null}],"minimum":null,"name":"Physics Requirement: PH 004A & 004B series","option_group":"Physics series","rule":"all","stated":{"max":null,"min":null}}],"program":{"careers":[],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":66,"min":66},"electives_fill_degree":true,"ge_pattern":"Cal-GETC","ge_units":{"max":33,"min":31},"measure":"units","open_elective_units":null,"outcomes":["Compare and contrast best practices in biology including ethical behavior and peer-reviewed research. (Institutional Learning Outcomes 3 Ethics and 4 Personal Development)","Utilize scientific methods to empirically test hypotheses and apply findings within the context of the sciences. (Institutional Learning Outcomes 2 Critical Thinking Skills and 5 Information Competency)","Collaboratively analyze collected data using problem-based learning and communicate findings in written and oral forms. (Institutional Learning Outcomes 1 Communication Skills and 5 Information Competency)."],"section_heading":"Associate in Science in BIOLOGY for transfer","total_units":{"max":33,"min":32}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":2,"placed":2}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":100,"source":80,"unit_arithmetic":40},"coverage":true,"gaps":["noted_figures_differ"],"invented":true,"listed":2,"placed":2}'::jsonb)),
c as (select count(*) filter (where r.checked is true) as n,
             coalesce(json_agg(v.i order by v.i) filter (where r.checked is true), '[]'::json) as keys
        from v join public.program_requirement_records r
          on r.college = v.college and r.control_number = v.control_number),
-- A partial rollback: set expect below to the smaller count you mean.
e(expect) as (values (1)),
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
            else ('s740r3 piles rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;
