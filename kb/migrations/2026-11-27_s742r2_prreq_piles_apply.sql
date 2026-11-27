-- S742R2 lane 2's cheap piles at El Camino (2 rows: total_differs 2). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s741_el_camino_2026-11-27_s742r2.json
-- (before_image per row).
-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,
-- and no person's check. It aborts, writing nothing, unless it matches the plan's 2 rows less
-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'El Camino College', '19883', 46007782666, '{"blocks":[{"courses":[{"alternatives":[{"catalog_addition":false,"code":"PHOT 106","units":3},{"catalog_addition":false,"code":"JOUR 6","units":3}],"catalog_addition":true,"code":"PHOT 101","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PHOT 102","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"PHOT 202","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"PHOT 203","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PHOT 223A","units":4,"units_max":null}],"minimum":null,"name":"Required Core","option_group":null,"rule":"all","stated":{"max":18,"min":17}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"FILM 234","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PHOT 204","units":3,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"JOUR 7ab","units":2}],"catalog_addition":false,"code":"PHOT 206ab","units":2,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PHOT 223B","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PHOT 254","units":2,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PHOT 257","units":2,"units_max":null}],"minimum":9,"name":"9 units from","option_group":null,"rule":"choose_units","stated":{"max":9,"min":9}}],"program":{"careers":[],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Photography Certificate of Achievement","total_units":{"max":27,"min":26}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":11,"placed":11}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":null,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["total_differs"],"invented":true,"listed":11,"placed":11}'::jsonb),
  (2, 'El Camino College', '38948', 46007782666, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"BUS 111","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS 113","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS 124","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS 125","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS 127","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS 128","units":1,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CIS 13","units":3,"units_max":null}],"minimum":null,"name":"Required Core","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"BUS 126","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS 150","units":4,"units_max":null}],"minimum":3,"name":"3-4 units from","option_group":null,"rule":"choose_units","stated":{"max":4,"min":3}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"BUS 119","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS 120","units":3,"units_max":null}],"minimum":3,"name":"3-4 units from","option_group":null,"rule":"choose_units","stated":{"max":4,"min":3}}],"program":{"careers":["competitive entrepreneurs"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Entrepreneurial Studies Certificate of Achievement","total_units":{"max":20,"min":19}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":11,"placed":11}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":null,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["total_differs"],"invented":true,"listed":11,"placed":11}'::jsonb)),
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
            then ('s742r2 piles confirm guard: ' || f.n || ' rows hold a matching confirm verdict ' || f.keys::text)::int::text::json
            when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s742r2 piles guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e, f;
