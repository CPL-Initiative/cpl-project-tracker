-- S740C6 lane 2's cheap piles at Solano (1 rows: total_not_printed 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_solano_community_2026-11-26_s740c6.json
-- (before_image per row).
-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,
-- and no person's check. It aborts, writing nothing, unless it matches the plan's 1 rows less
-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'Solano Community College', '42041', 45840125172, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"HSW 001","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"STAT C1000","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PSYC C1000","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SOCI C1000","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COUN 064","units":1.5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COUN 064P","units":2,"units_max":null}],"minimum":null,"name":"REQUIRED COURSES","option_group":null,"rule":"all","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"BIOL 004","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BIOL 005","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"BIOL 016","units":3,"units_max":null}],"minimum":1,"name":"List A: Biology (select one course)","option_group":null,"rule":"choose_courses","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"ECON C2002","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ECON C2001","units":3,"units_max":null}],"minimum":1,"name":"List B: Economics (select one course)","option_group":null,"rule":"choose_courses","stated":{"max":null,"min":null}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"CJ 001","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PSYC 005","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PSYC 006","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"PSYC 040","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SJS 001","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SOCI 002","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ANTH 002","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CDEV C1000","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"CDFS 050","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"COMM 012","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ENGL C1001","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HIST C1001","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HIST C1002","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SJS 002","units":3,"units_max":null}],"minimum":2,"name":"List C: Electives (select two courses)","option_group":null,"rule":"choose_courses","stated":{"max":null,"min":null}}],"program":{"careers":["Social Work and Human Services paraprofessionals","mental and behavioral health","social welfare","developmental services","criminal justice","chemical dependency"],"degree_elective_units":{"max":null,"min":null},"degree_total":{"max":null,"min":null},"electives_fill_degree":false,"ge_pattern":"Cal-GETC","ge_units":{"max":null,"min":null},"measure":"units","open_elective_units":null,"outcomes":[],"section_heading":"Associate in Arts in Social Work and Human Services for Transfer (ADT: A.A.-T)","total_units":{"max":null,"min":null}}}'::jsonb, '{"arithmetic":"incomplete","coverage":true,"invented":true,"listed":25,"placed":25}'::jsonb, '{"arithmetic":"incomplete","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":null,"source":80,"unit_arithmetic":40},"coverage":true,"gaps":["total_not_printed"],"invented":true,"listed":25,"placed":25}'::jsonb)),
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
            then ('s740c6 piles confirm guard: ' || f.n || ' rows hold a matching confirm verdict ' || f.keys::text)::int::text::json
            when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s740c6 piles guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e, f;
