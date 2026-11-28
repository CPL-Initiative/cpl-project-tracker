-- S748R1 lane 2's cheap piles at El Camino (1 rows: total_differs 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s742_el_camino_2026-11-28_s748r1.json
-- (before_image per row).
-- Rollback, NOT applied: the before-image's checks back where the row still holds the
-- after-image, skipping and listing a row a person checked. A rollback lasts only until the
-- next load of that college: revert the record files too (git revert of this plan's commit).
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'El Camino College', '19857', 44480396671, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ARCH 100","units":1,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 107","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 108","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 251","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 170","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 171","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 149","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 199","units":4,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 299","units":4,"units_max":null}],"minimum":null,"name":"Required Core","option_group":null,"rule":"all","stated":{"max":30,"min":30}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ARCH 119","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 121","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 125","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 252","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 258","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 174","units":2,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 172","units":3,"units_max":null}],"minimum":6,"name":"6 units from","option_group":null,"rule":"choose_units","stated":{"max":6,"min":6}}],"program":{"careers":["entry-level draftsperson"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Certificate of Achievement","total_units":{"max":36,"min":36}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":14,"placed":8}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":57,"ge_pattern":null,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["total_differs"],"invented":true,"listed":14,"placed":8}'::jsonb)),
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
            else ('s748r1 piles rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;
