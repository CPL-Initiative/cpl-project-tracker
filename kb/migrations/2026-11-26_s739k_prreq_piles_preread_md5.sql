-- S739K lane 2's cheap piles at Palo Verde (5 rows: degree_electives_not_printed 1, figure_within_variable_units 1, lists_not_closed 1, noted_figures_differ 1, pool_figure_not_read 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_palo_verde_2026-11-26_s739k.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Palo Verde College', '17998', 39852997888, '714899d5fe81fc53680f9ec36bcbbbcd', '39747decba62d1a4fc97e2e52cd92e81', 'd3cc8f2ee6c92c0e298b42df2ffcf0d4'),
  (2, 'Palo Verde College', '17999', 39852997888, '557edb43f5250ce5cda6d9e7941d121e', '38665921113e6a6ea481bd3ebe2e02c7', 'e71eb9cdacd75390d3521d14449af8ac'),
  (3, 'Palo Verde College', '41227', 39852997888, 'e44e4cc12ca749ee192b93f3e1bf7cfd', '2efd1426b83a79da0a0f0776d66a41ee', '037b701ca542e18140778f989e77209a'),
  (4, 'Palo Verde College', '41242', 39852997888, '21980fea8e65fb13cea4f68cb2fca39c', '41dd3c24e382cabef390df2f06e936e2', 'a1b89b57c9dae1ed4fe064107ffc2b64'),
  (5, 'Palo Verde College', '45359', 39852997888, '0d7419c949374ddc6b9fd13e449c7ed8', 'bfac2dadad7ab69a6e626cca5600b3f5', '8adc1aafe5bc7e2ce944fb42aa277119'))
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
