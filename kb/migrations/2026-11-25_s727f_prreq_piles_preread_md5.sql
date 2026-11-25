-- S727F lane 2: the records held for a person, collected with each gap named (7 rows: entry_path_range 1, lists_not_closed 2, noted_no_total 1, noted_section_cut_off 1, pool_figure_not_read 1, upper_division_only 1). Each row's
-- checks become the college load's image of its committed record: checks.gaps and checks.confidence
-- added; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s727_persons_2026-11-25_s727f.json (before_image and after_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'De Anza College', '45499', 43056325121, '6d2956000c8ec638519574a23637ba7d', '8fd0a9378506bd00405b5cf1ecb0628d', '29c0c0091e28eff18029dcaed9b34e45'),
  (2, 'Santa Monica College', '10345', 39567439681, '93ca74463f246afea4ccd9ccf165115a', 'e6dc2db0903ea1bdee923dfafbc1258b', '487cf01dd90ee6d54ef9616375b3b578'),
  (3, 'Santa Monica College', '43765', 39567439681, 'eea0fd78dd81e117849f38aef411c5ec', '687245fbbcb76ffb696e8d39dc31eba0', 'faaf6f5be0e51a0103d850d33f7df030'),
  (4, 'Clovis Community College', '33501', 44522071814, '908a9a868a11a7ef95386700c0d7ce58', '24ddfa68326ccb5cf0a8142c92f04809', '6fc858c99b11fad873d126f9b46f4c71'),
  (5, 'Clovis Community College', '39539', 44522071814, '1d43d90eca94552c3a9e493b8b1d1b0c', '85cb78235b640eeab335f115809108a4', '6aedd7788c632ba79790d8b1a15d97b6'),
  (6, 'East Los Angeles College', '33013', 43357061643, 'e60e92a0961d107d068ac31962a74cbc', '841d9b4ca1b4eaf2c4395d3fefcb8b7e', '16625e680839852e7758509e692a7001'),
  (7, 'Contra Costa College', '01417', 38979730323, '40b2eefd41abc798d701cf7ba833ccb1', '6670455651f81e1d04b6fdc803860ecc', 'd57b1fc63f3c584af5f5b12e1b9d2d92'))
select json_build_object(
  'listed', (select count(*) from v),
  'on_run', count(*) filter (where r.extracted_run = v.extracted_run),
  'record_is_before', count(*) filter (where r.extracted_run = v.extracted_run and md5(r.record::text) = v.rec_md5),
  'checks_is_before', count(*) filter (where r.extracted_run = v.extracted_run and md5(r.checks::text) = v.chk_md5),
  'already_after', count(*) filter (where md5(r.checks::text) = v.after_md5),
  'checked_now', count(*) filter (where r.checked),
  'confirm_matches', count(*) filter (where lv.verdict = 'confirm'
                                       and lv.requirements_fp = public.program_record_fp(r.record)))
  from v join public.program_requirement_records r
    on r.college = v.college and r.control_number = v.control_number
  left join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv
                      where pv.college = v.college and pv.control_number = v.control_number
                      order by pv.id desc limit 1) lv on true;
