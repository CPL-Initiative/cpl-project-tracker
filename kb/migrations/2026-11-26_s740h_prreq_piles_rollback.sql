-- S740H lane 2's cheap piles at Butte (1 rows: required_list_outside_total 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_butte_2026-11-26_s740h.json
-- (before_image per row).
-- Rollback, NOT applied: the before-image's checks back where the row still holds the
-- after-image, skipping and listing a row a person checked. A rollback lasts only until the
-- next load of that college: revert the record files too (git revert of this plan's commit).
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'Butte College', '33579', 42973457189, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":true,"code":"AB 22","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AGS 50","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ECON C2002","units":3,"units_max":null}],"minimum":null,"name":"Required courses","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"STAT C1000","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"STAT C1000E","units":4,"units_max":null}],"minimum":1,"name":"Select one","option_group":null,"rule":"choose_courses","stated":{"max":4,"min":4}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"AB 15","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AB 25","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AB 26","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AB 50","units":3,"units_max":null}],"minimum":3,"name":"List A (Select three)","option_group":null,"rule":"choose_courses","stated":{"max":9,"min":9}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"AGS 20","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"AGS 40","units":3,"units_max":null}],"minimum":1,"name":"Select one","option_group":null,"rule":"choose_courses","stated":{"max":3,"min":3}},{"courses":[{"alternatives":[],"catalog_addition":true,"code":"ACCT 4","units":null,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"CHEM 51","units":null,"units_max":null}],"minimum":null,"name":"Elective (Department recommends)","option_group":null,"rule":"recommended","stated":{"max":null,"min":null}}],"program":{"careers":[],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":64,"min":60},"electives_fill_degree":true,"ge_pattern":"Cal-GETC","ge_units":{"max":34,"min":34},"measure":"units","open_elective_units":null,"outcomes":["Accumulate, record, and analyze agricultural financial statements.","Analyze specific markets to explain and predict changes in price and economic behavior.","Demonstrate core management principles and apply them to different working scenarios.","Apply core marketing principles to the unique structure of the agriculture sector.","Demonstrate effective verbal and written communication in an agricultural business environment.","Recognize consumer and producer responsiveness to changing market conditions."],"section_heading":"AS-T Degree in Agriculture Business","total_units":{"max":23,"min":23}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":10,"placed":10}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":100,"source":100,"unit_arithmetic":70},"coverage":true,"gaps":["required_list_outside_total"],"invented":true,"listed":10,"placed":10}'::jsonb)),
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
            else ('s740h piles rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;
