-- S740C3 lane 2's cheap piles at San Bernardino Valley (6 rows: noted_figures_differ 2, total_differs 2, waived_course_counted 2). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_san_bernardino_valley_2026-11-26_s740c3.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'San Bernardino Valley College', '12197', 38748858322, 'db0697c85207138959328b8a1ac954f7', '768b5ffa4426c74c74cd6406935caf7a', '83dce534cfff59b1e0b9d91c6365de39'),
  (2, 'San Bernardino Valley College', '22771', 38748858322, 'a19db2a459a99e09609e87ea83ac0fc1', '025f5967e09072e40425565d0b8c2cce', '0e79276ee68109f4db154ef1a7357662'),
  (3, 'San Bernardino Valley College', '22776', 38748858322, 'fe4a5cd500ebed84ab5df3ccfd7d3de9', 'd2b6fcfb6953124b2f0584dbf2bd644b', '4318a002e91dfe167bcd62fd70ff7ace'),
  (4, 'San Bernardino Valley College', '22820', 38748858322, 'e02c647c940dc63805d45029741dd3bc', '3c81834a38a33a73170c8fc53655fda9', '5657e42ab79315df774562e8a865db1b'),
  (5, 'San Bernardino Valley College', '32309', 44481529632, '3f1b048ff072e2f618c4d708b5721495', '39747decba62d1a4fc97e2e52cd92e81', '05522c0cfd07a2c6045c13a4a8bcb6fa'),
  (6, 'San Bernardino Valley College', '35802', 38748858322, 'e9a8cff27889b59264750b3c2edf8989', '598b266c8caf0d08b3b919950ad632c6', '3067089624fe6b1cddc238e5051c7cc6'))
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
