-- S748R1 lane 2's cheap piles at El Camino (1 rows: total_differs 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s742_el_camino_2026-11-28_s748r1.json
-- (before_image per row).
-- Pre-read, read-only: one SELECT, one JSON value.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'El Camino College', '19857', 44480396671, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ARCH 100","units":1,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 107","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 108","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 251","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 170","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 171","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 149","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 199","units":4,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 299","units":4,"units_max":null}],"minimum":null,"name":"Required Core","option_group":null,"rule":"all","stated":{"max":30,"min":30}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ARCH 119","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 121","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 125","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 252","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 258","units":3,"units_max":null},{"alternatives":[],"catalog_addition":true,"code":"ARCH 174","units":2,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ARCH 172","units":3,"units_max":null}],"minimum":6,"name":"6 units from","option_group":null,"rule":"choose_units","stated":{"max":6,"min":6}}],"program":{"careers":["entry-level draftsperson"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Certificate of Achievement","total_units":{"max":36,"min":36}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":14,"placed":8}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":57,"ge_pattern":null,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["total_differs"],"invented":true,"listed":14,"placed":8}'::jsonb))
select json_build_object(
  'listed', (select count(*) from v),
  'on_run', count(*) filter (where r.extracted_run = v.extracted_run),
  'record_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record),
  'checks_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.checks = v.before_checks),
  'both_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record and r.checks = v.before_checks),
  'already_after', count(*) filter (where r.checks = v.after_checks),
  'checked_now', count(*) filter (where r.checked),
  'confirm_matches', count(*) filter (where lv.verdict = 'confirm'
                                       and lv.requirements_fp = public.program_record_fp(r.record)))
  from v join public.program_requirement_records r
    on r.college = v.college and r.control_number = v.control_number
  left join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv
                      where pv.college = v.college and pv.control_number = v.control_number
                      order by pv.id desc limit 1) lv on true;
