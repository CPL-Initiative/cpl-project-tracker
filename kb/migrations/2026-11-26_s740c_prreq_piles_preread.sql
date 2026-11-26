-- S740C lane 2's cheap piles at College of the Canyons (1 rows: units_within_printed_range 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_college_of_the_canyons_2026-11-26_s740c.json
-- (before_image per row).
-- Pre-read, read-only: one SELECT, one JSON value.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'College of the Canyons', '36793', 44769429877, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"HOSP-101","units":3,"units_max":null}],"minimum":null,"name":"Program Requirements","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"CULARTS-110","units":2,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"ECON-C2001H","units":3}],"catalog_addition":true,"code":"ECON-C2001","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HOSP-150","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HOSP-220","units":3,"units_max":null}],"minimum":9,"name":"Plus nine units from the following","option_group":null,"rule":"choose_units","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"BUS-201","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BUS-211","units":3,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"STAT-C1000E","units":5},{"catalog_addition":false,"code":"STAT-C1000H","units":4}],"catalog_addition":false,"code":"STAT-C1000","units":4,"units_max":null}],"minimum":2,"name":"Plus two courses from the following for six to ten units","option_group":null,"rule":"choose_courses","stated":{"max":10,"min":6}}],"program":{"careers":[],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":"CalGETC","ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":["Students will be able to demonstrate proficiency in the core skills and knowledge required for entry level employment in the hospitality management industry."],"section_heading":"Associate in Science for Transfer Degree: Hospitality Management","total_units":{"max":22,"min":18}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":11,"placed":11}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":null,"source":80,"unit_arithmetic":50},"coverage":true,"gaps":["units_within_printed_range"],"invented":true,"listed":11,"placed":11}'::jsonb))
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
