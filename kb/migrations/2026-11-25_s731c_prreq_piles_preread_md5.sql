-- S731C lane 2's cheap piles at Long Beach City (12 rows: lists_not_closed 2, lists_past_their_figure 1, noted_figures_differ 1, option_lists_read_apart 1, passes 3, prerequisites_counted 2, repeat_read_once 1, unit_line_not_read 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s731_lbcc_2026-11-25_s731c.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Long Beach City College', '02618', 38147472758, '1697b95ec6630d73705ebfbcd9d12aac', '598b266c8caf0d08b3b919950ad632c6', '4269719a02fd3fa65973d584aa5937d3'),
  (2, 'Long Beach City College', '02678', 38152016534, '093af8b841ba85109ac13480efbaaed9', '7c2a6dfca48d32194a28ee696f138b2c', '18a75525e8cdee0e9347ce768b17e7f4'),
  (3, 'Long Beach City College', '02683', 38152016534, '5248e08800494eac8cf7581fbb96fc6f', 'd2b6fcfb6953124b2f0584dbf2bd644b', '869b91f70368b6a616e3b9332797beb2'),
  (4, 'Long Beach City College', '08834', 38152016534, 'ba647b6e6caab90e1b43c4da626403e5', 'd2b6fcfb6953124b2f0584dbf2bd644b', '366a0e2f9ace6acd868e3d4717234c5e'),
  (5, 'Long Beach City College', '20937', 38152016534, 'd5829b81e4e0c59b35bf2adcceaa47aa', 'd2b6fcfb6953124b2f0584dbf2bd644b', '869b91f70368b6a616e3b9332797beb2'),
  (6, 'Long Beach City College', '20940', 38185403454, '6ebbd28186d8816023854198598c8609', '35f2877d99d2b003e2bfeff489cc243d', '86755d2d2acf8d66c7aa97ffc7e97717'),
  (7, 'Long Beach City College', '30650', 38152016534, '2c2c150997ddc36b3cb92d054de17cd6', '565698f6affa77ef6c1410d28f8c0923', 'deb7800cc2e98a175ec85a26e7f121d8'),
  (8, 'Long Beach City College', '32634', 38152016534, '05572be738df3cfc9ec0ced7d7f61416', 'ebd12c758ebab5aaeac4ca39249f2f79', '6510fe627b8821629efcf5dc51e5b811'),
  (9, 'Long Beach City College', '33302', 38152016534, '5bc7fc066f8065d6fe4e5f753fd203d5', 'df1f46dda28f904ad5c64f462c51773e', '6434bfe56c0f6e51af755d307dec125c'),
  (10, 'Long Beach City College', '33390', 38185403454, '1553cf300d95d54de8d6326dce4c8249', '972ce3267c8b9670b117327200b82b48', 'e9fa5c488a27df9f47dba4cde2012b6f'),
  (11, 'Long Beach City College', '35803', 38152016534, 'd1862e1286dcac22379bdab03b17af85', 'b167e014df6b97bdebba96ca16afce51', '9c3dd0c6001c56373d76c68dac7bedae'),
  (12, 'Long Beach City College', '41220', 38152016534, 'e7446d4d9efd1c577ee92548f7d5ec25', '025f5967e09072e40425565d0b8c2cce', '5469ca49c9d4b1f60cb372c833c75e1d'))
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
