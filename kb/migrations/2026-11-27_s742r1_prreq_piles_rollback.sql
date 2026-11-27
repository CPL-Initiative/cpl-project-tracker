-- S742R1 lane 2's cheap piles at Modesto Junior (1 rows: units_within_printed_range 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_modesto_junior_2026-11-27_s742r1.json
-- (before_image per row).
-- Rollback, NOT applied: the before-image's checks back where the row still holds the
-- after-image, skipping and listing a row a person checked. A rollback lasts only until the
-- next load of that college: revert the record files too (git revert of this plan's commit).
with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values
  (1, 'Modesto Junior College', '35127', 45772245635, '{"blocks":[{"courses":[{"alternatives":[],"catalog_addition":false,"code":"SPAN 101","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SPAN 102","units":5,"units_max":null}],"minimum":null,"name":"REQUIRED COURSES","option_group":null,"rule":"all","stated":{"max":10,"min":10}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"SPAN 109","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SPAN 103","units":5,"units_max":null}],"minimum":5,"name":"REQUIRED COURSES","option_group":null,"rule":"choose_units","stated":{"max":5,"min":5}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"SPAN 110","units":5,"units_max":null}],"minimum":null,"name":"REQUIRED COURSES","option_group":null,"rule":"all","stated":{"max":5,"min":5}},{"courses":[{"alternatives":[],"catalog_addition":false,"code":"SPAN 112","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SPAN 173","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ENGL 172","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"ENGL 173","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HIST 125","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"HIST 145","units":3,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SOCIO 156","units":3,"units_max":null}],"minimum":3,"name":"LIST A - SELECT AT LEAST ONE","option_group":null,"rule":"choose_units","stated":{"max":3,"min":3}}],"program":{"careers":[],"ge_pattern":"Cal-GETC","measure":"units","open_elective_units":null,"outcomes":["WRITING- Students will be able to write detailed and well organized letters, essays, or reports on a range of topics, in Spanish, at an intermediate proficiency level with minimal errors in grammar, spelling, and mechanics.","SPEAKING -Students will be able to actively participate in conversations and discussions, in Spanish, with a degree of fluency and spontaneity that makes interaction with Spanish-speakers possible.","READING-Students will be able to read critically about literary texts, articles and reports produced in Spanish.","LISTENING- Students will be able to recognize the linguistic variations that exists within the Spanish-speaking world and understand the main points in conversations, radio, television programs, and film."],"section_heading":"Spanish for Transfer Degree","total_units":{"max":23,"min":19}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":12,"placed":12}'::jsonb, '{"arithmetic":"unequal","confidence":{"catalog_year":100,"course_list_match":100,"ge_pattern":null,"source":100,"unit_arithmetic":50},"coverage":true,"gaps":["units_within_printed_range"],"invented":true,"listed":12,"placed":12}'::jsonb)),
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
            else ('s742r1 piles rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;
