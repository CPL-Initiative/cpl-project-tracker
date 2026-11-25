-- S727V Antelope Valley 43028 collected with its gap named (ge_figures_other_pattern). The row's checks
-- become the college load's image of its committed record (load_rows): checks.gaps and checks.confidence
-- added; the record unchanged. Receipt: kb/receipts/program_requirement_records_ge_other_pattern_2026-11-25_s727v.json (before_image per row).
-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,
-- and no person's check. It aborts, writing nothing, unless it matches the plan's 1 row less
-- one a person checked (listed as skipped_checked), or the row holds a matching confirm.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'Antelope Valley College', '43028', 38979725726, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"COMM 107","units":3,"units_max":null}],"minimum":null,"name":"Required Course","option_group":null,"rule":"all","stated":{"max":3,"min":3}},{"courses":[{"alternatives":[{"catalog_addition":false,"code":"COMM C1000H","units":3}],"catalog_addition":false,"code":"COMM C1000","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 201","units":3,"units_max":null}],"minimum":3,"name":"Required Course - Choose one","option_group":null,"rule":"choose_units","stated":{"max":3,"min":3}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"COMM 105","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 109","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 110","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 112","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 115","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 116","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 219","units":3,"units_max":null}],"minimum":9,"name":"List A","option_group":null,"rule":"choose_units","stated":{"max":9,"min":9}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ANTH 102","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 114","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 215","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 217","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ENGL C1002","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ENGL C1001","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"JOUR 121","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PSYC C1000","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SOCI C1000","units":3,"units_max":null}],"minimum":3,"name":"List B, or any List A course not already used","option_group":null,"rule":"choose_units","stated":{"max":3,"min":3}}],"program":{"careers":["journalism","film and television","law","education","philosophy","sociology","English"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":60,"min":60},"electives_fill_degree":false,"ge_pattern":"Cal-GETC","ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":["Program majors will demonstrate and articulate professional verbal expression.","Through active listening, program majors will critically analyze verbal and nonverbal messages in a variety of contexts.","Program majors will make ethical communication decisions based on an understanding of cultural diversity."],"section_heading":"Communication Studies AA-T 2.0","total_units":{"max":18,"min":18}}}'::jsonb, '{"arithmetic":"incomplete","coverage":true,"invented":true,"listed":20,"placed":20}'::jsonb, '{"arithmetic":"incomplete","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":50,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["ge_figures_other_pattern"],"invented":true,"listed":20,"placed":20}'::jsonb)),
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
            then ('s727v ge other pattern confirm guard: ' || f.n || ' rows hold a matching confirm verdict ' || f.keys::text)::int::text::json
            when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s727v ge other pattern guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e, f;
