-- S740F lane 2's cheap piles at Santa Monica (1 rows: units_within_printed_range 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_santa_monica_2026-11-26_s740f.json
-- (before_image per row).
-- Pre-read, read-only: one SELECT, one JSON value.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'Santa Monica College', '41797', 39567439681, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ACCTG 1","units":5,"units_max":null}],"minimum":null,"name":"Accounting: ACCTG 1","option_group":"Accounting","rule":"all","stated":{"max":5,"min":5}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ACCTG 21","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ACCTG 22","units":3,"units_max":null}],"minimum":null,"name":"Accounting: ACCTG 21 and ACCTG 22","option_group":"Accounting","rule":"all","stated":{"max":6,"min":6}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ACCTG 31A","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ACCTG 31B","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CIS 30","units":3,"units_max":null}],"minimum":1,"name":"Excel","option_group":null,"rule":"choose_courses","stated":{"max":3,"min":3}},{"courses":[{"alternatives":[{"catalog_addition":false,"code":"CIS 35A","units":3}],"catalog_addition":false,"code":"CIS 2","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CIS 35B","units":3,"units_max":null}],"minimum":null,"name":"Other Specialty","option_group":null,"rule":"all","stated":{"max":6,"min":6}}],"program":{"careers":["QuickBooks ProAdvisors"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":["students will demonstrate proficiency and self-confidence in using QuickBooks Desktop, QuickBooks Online, and Excel, as well as the accounting foundation needed to use these programs.","Students will apply self-discipline and professional communication techniques in an office environment.","Students will also employ interpersonal and critical thinking skills, as well as problem solving."],"section_heading":"Quickbooks Virtual Enterprise, Certificate of Achievement","total_units":{"max":15,"min":13}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":9,"placed":9}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":null,"source":80,"unit_arithmetic":50},"coverage":true,"gaps":["units_within_printed_range"],"invented":true,"listed":9,"placed":9}'::jsonb))
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
