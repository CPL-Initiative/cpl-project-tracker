-- S742B lane 2's cheap piles at East Los Angeles (1 rows: unit_line_not_read 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s742_east_los_angeles_2026-11-27_s742b.json
-- (before_image per row).
-- Rollback, NOT applied: the before-image's checks back where the row still holds the
-- after-image, skipping and listing a row a person checked. A rollback lasts only until the
-- next load of that college: revert the record files too (git revert of this plan's commit).
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'East Los Angeles College', '02456', 45176404274, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ALD HTH 057","units":1,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"CAOT 082","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 054","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 040","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 061","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 051","units":1,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 052","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 053","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 055","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 056","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HLTHOCC 059","units":2,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"HLTHOCC 060","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"HTHTEK 133","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PHYSIOL 006","units":6,"units_max":null}],"minimum":null,"name":"REQUIRED CORE","option_group":null,"rule":"all","stated":{"max":50,"min":48}}],"program":{"careers":["medical assistant"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":65,"min":63},"electives_fill_degree":false,"ge_overlap":true,"ge_pattern":"LACCD General Education Plan","ge_units":{"max":27,"min":27},"measure":"units","open_elective_units":null,"outcomes":["Communicate and collaborate professionally and effectively with patients, healthcare team, and third-party providers in diverse environments.","Demonstrate a mastery of a complex body of knowledge and specialized skills in the cognitive (knowledge), psychomotor (skills), and affective (behavior) learning domains.","Demonstrate and practice behavior consistent with the legal and ethical standards of the profession.","Demonstrate standard, quality, safety, and risk-reduction precautions in the healthcare setting.","Prepare students to display professionalism and cultural sensitivity while interacting and communicating with providers, staff and patients.","Provide competent medical assisting care, in variety of settings, based on the entry-level competencies for a Medical Assistant."],"section_heading":"(Academic Plan E002456C)","total_units":{"max":50,"min":48}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":11,"placed":11}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":100,"source":80,"unit_arithmetic":40},"coverage":true,"gaps":["unit_line_not_read"],"invented":true,"listed":11,"placed":11}'::jsonb)),
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
            else ('s742b piles rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;
