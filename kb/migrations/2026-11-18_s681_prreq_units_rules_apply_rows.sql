-- S681 cheap piles, item 2: the units rules. Receipt: kb/receipts/program_requirement_records_units_rules_2026-11-18_s681.json.
-- The plan in two parts (second reader's F1): checks-only, A1 0 rows; full-row, A4 1 rows (A4 1).
-- A6 is off (F5). A5 is off on every further record. The collection lane's seven colleges are not in the list (kb/collection_lane.py).
-- The plan names records at Golden West College, Coastline Community College, Orange Coast College, Los Medanos College, Diablo Valley College, College of the Redwoods, Antelope Valley College alone (--college).
-- Part 2: the 1 corrected rows take the record and checks the college load (load_rows) posts for their
-- committed record, where the row holds the filed run, the load's image of main's record and checks, and no
-- person's check. The statement aborts, writing nothing, unless it matches the plan's 1 rows less those a person
-- checked (listed as skipped_checked). Before-images: the receipt's before_image per row.
with v(i, college, control_number, extracted_run, before_record, before_checks, after_record, after_checks) as (values
  (1, 'Coastline Community College', '18223', 38445051060, '{"blocks":[{"courses":[{"alternatives":[{"catalog_addition":false,"code":"SPAN C180A","units":null},{"catalog_addition":false,"code":"SPAN C180B","units":null}],"catalog_addition":false,"code":"SPAN C180","units":5,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"SPAN C185A","units":null},{"catalog_addition":false,"code":"SPAN C185B","units":null}],"catalog_addition":false,"code":"SPAN C185","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SPAN C280","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SPAN C285","units":4,"units_max":null}],"minimum":null,"name":"Required Core","option_group":null,"rule":"all","stated":{"max":null,"min":null}}],"program":{"careers":["international trade","politics","interpretation","translation"],"ge_pattern":"Local General Education or CalGETC pattern","measure":"units","open_elective_units":null,"outcomes":["Demonstrate appropriate level written and spoken fluency in the language.","Demonstrate understanding and respect for the cultural and global diversity in the Spanish-speaking countries."],"section_heading":"Spanish, Associate of Arts Degree","total_units":{"max":18,"min":18}}}'::jsonb, '{"arithmetic":"unequal","coverage":true,"invented":true,"listed":8,"placed":8}'::jsonb, '{"blocks":[{"courses":[{"alternatives":[{"catalog_addition":false,"code":"SPAN C180A","units":5,"units_max":null},{"catalog_addition":false,"code":"SPAN C180B","units":5,"units_max":null}],"catalog_addition":false,"code":"SPAN C180","units":5,"units_max":null},{"alternatives":[{"catalog_addition":false,"code":"SPAN C185A","units":5,"units_max":null},{"catalog_addition":false,"code":"SPAN C185B","units":5,"units_max":null}],"catalog_addition":false,"code":"SPAN C185","units":5,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SPAN C280","units":4,"units_max":null},{"alternatives":[],"catalog_addition":false,"code":"SPAN C285","units":4,"units_max":null}],"minimum":null,"name":"Required Core","option_group":null,"rule":"all","stated":{"max":null,"min":null}}],"program":{"careers":["international trade","politics","interpretation","translation"],"ge_pattern":"Local General Education or CalGETC pattern","measure":"units","open_elective_units":null,"outcomes":["Demonstrate appropriate level written and spoken fluency in the language.","Demonstrate understanding and respect for the cultural and global diversity in the Spanish-speaking countries."],"section_heading":"Spanish, Associate of Arts Degree","total_units":{"max":18,"min":18}}}'::jsonb, '{"arithmetic":"equal","coverage":true,"invented":true,"listed":8,"placed":8}'::jsonb)),
c as (select count(*) filter (where r.checked is true) as n,
             coalesce(json_agg(v.i order by v.i) filter (where r.checked is true), '[]'::json) as keys
        from v join public.program_requirement_records r
          on r.college = v.college and r.control_number = v.control_number),
e(expect) as (values (1)),
u as (
update public.program_requirement_records r
   set record = v.after_record, checks = v.after_checks
  from v
 where r.college = v.college and r.control_number = v.control_number
   and r.extracted_run = v.extracted_run and r.record = v.before_record and r.checks = v.before_checks
   and r.checked is not true
returning v.i),
s as (select count(*) as n, coalesce(json_agg(i order by i), '[]'::json) as keys from u)
select case when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s681 full-row guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;
