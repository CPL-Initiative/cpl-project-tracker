-- S739J, Orange Coast 41373 alone: s739j's rollback limited to the one row (its values line is s739j's own,
-- kb/migrations/2026-11-26_s739j_prreq_piles_rollback.sql row 3). Why: its 29 sits inside the printed 28-29,
-- so noted_figures_differ's sentence is not true of it (d-lists-gap-holds-range-sums-s703; S739's reader).
-- Receipt: kb/receipts/program_requirement_records_piles_s739_orange_coast_2026-11-26_s739j.json.
-- Rollback: the before-image's checks back where the row still holds s739j's after-image; it aborts,
-- writing nothing, unless it matches exactly 1 row (less a row a person checked, listed as
-- skipped_checked). The committed record's score goes back with it, or the next load posts the gap again.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (3, 'Orange Coast College', '41373', 38670927724, '{"blocks":[{"courses":[{"alternatives":[{"catalog_addition":false,"code":"ACCT A101H","units":4}],"catalog_addition":false,"code":"ACCT A101","units":4,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"ACCT A102H","units":4}],"catalog_addition":false,"code":"ACCT A102","units":4,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"ECON C2001H","units":3}],"catalog_addition":false,"code":"ECON C2001","units":3,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"ECON C2002H","units":3}],"catalog_addition":false,"code":"ECON C2002","units":3,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"BUS A110H","units":3}],"catalog_addition":false,"code":"BUS A110","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"MATH A140","units":5,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"PSYC A160","units":4}],"catalog_addition":false,"code":"STAT C1000","units":4,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"BUS A100H","units":3},{"catalog_addition":false,"code":"BUS A139","units":3}],"catalog_addition":false,"code":"BUS A100","units":3,"units_max":null}],"minimum":null,"name":"Required Courses","option_group":null,"rule":"all","stated":{"max":null,"min":null}}],"program":{"careers":[],"degree_elective_units":{"max":4,"min":3},"degree_total":{"max":60,"min":60},"electives_fill_degree":false,"ge_pattern":"Cal-GETC","ge_units":{"max":34,"min":34},"measure":"units","open_elective_units":null,"outcomes":["Function effectively in entry-level business positions or at a four-year college business program using the skills, principles, and tools they have acquired.","Demonstrate effective written and/or oral skills.","Students will be eligible and prepared for admission (SB 1440 and Education Code 66746) to California State University system schools."],"section_heading":"Business Administration 2.0, Associate in Science Degree for Transfer (AS-T)","total_units":{"max":29,"min":28}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":15,"placed":15}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":100,"source":100,"unit_arithmetic":40},"coverage":true,"gaps":["noted_figures_differ"],"invented":true,"listed":15,"placed":15}'::jsonb)),
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
            else ('s739j 41373 rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;
