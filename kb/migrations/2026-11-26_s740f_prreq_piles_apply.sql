-- S740F lane 2's cheap piles at Santa Monica (1 rows: units_within_printed_range 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_santa_monica_2026-11-26_s740f.json
-- (before_image per row).
-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,
-- and no person's check. It aborts, writing nothing, unless it matches the plan's 1 rows less
-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'Santa Monica College', '41797', 39567439681, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ACCTG 1","units":5,"units_max":null}],"minimum":null,"name":"Accounting: ACCTG 1","option_group":"Accounting","rule":"all","stated":{"max":5,"min":5}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ACCTG 21","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ACCTG 22","units":3,"units_max":null}],"minimum":null,"name":"Accounting: ACCTG 21 and ACCTG 22","option_group":"Accounting","rule":"all","stated":{"max":6,"min":6}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ACCTG 31A","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ACCTG 31B","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CIS 30","units":3,"units_max":null}],"minimum":1,"name":"Excel","option_group":null,"rule":"choose_courses","stated":{"max":3,"min":3}},{"courses":[{"alternatives":[{"catalog_addition":false,"code":"CIS 35A","units":3}],"catalog_addition":false,"code":"CIS 2","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CIS 35B","units":3,"units_max":null}],"minimum":null,"name":"Other Specialty","option_group":null,"rule":"all","stated":{"max":6,"min":6}}],"program":{"careers":["QuickBooks ProAdvisors"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":null,"ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":["students will demonstrate proficiency and self-confidence in using QuickBooks Desktop, QuickBooks Online, and Excel, as well as the accounting foundation needed to use these programs.","Students will apply self-discipline and professional communication techniques in an office environment.","Students will also employ interpersonal and critical thinking skills, as well as problem solving."],"section_heading":"Quickbooks Virtual Enterprise, Certificate of Achievement","total_units":{"max":15,"min":13}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":9,"placed":9}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":null,"source":80,"unit_arithmetic":50},"coverage":true,"gaps":["units_within_printed_range"],"invented":true,"listed":9,"placed":9}'::jsonb)),
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
e(expect) as (values (1)),
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
            then ('s740f piles confirm guard: ' || f.n || ' rows hold a matching confirm verdict ' || f.keys::text)::int::text::json
            when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s740f piles guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e, f;
