-- S731P lane 1's pooled reading at four colleges (8 rows: option_lists_read_apart 1, passes 5, pool_figure_not_read 2). Each row's checks become the college
-- load's image of its rescored record (load_rows); the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s731_pooled_2026-11-25_s731p.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Cuyamaca College', '18628', 44752892297, '263db9e57d1fe2319736677712751159', '639e2f24726fec0b7145ccbb2fae568b', '6fff68f09b91d817b2092156573fb2e5'),
  (2, 'Modesto Junior College', '06655', 38477845911, '6483a6a98959a8b50b57b691789ebef5', '972ce3267c8b9670b117327200b82b48', '4dd86e27051d5c9b73d3838b76510458'),
  (3, 'Modesto Junior College', '08109', 38477845911, '25872c225cfe245e59cdd5e6d08023fc', 'ebd12c758ebab5aaeac4ca39249f2f79', '64a4bbf93f4a48da971b9c34cd6a3beb'),
  (4, 'Modesto Junior College', '10602', 38477845911, '63d3340193769f0dbe3cc06bb3057a13', '9b1f1d670fff2ae1355332e88bab98c0', 'aa811a3ee44bdf6b9cf029c0bc0a8311'),
  (5, 'Modesto Junior College', '38869', 38477845911, 'a348b2973e76f54650c3f7393a7fcab6', '972ce3267c8b9670b117327200b82b48', 'e56e4f55e2fd2e651d7274ecfc2d45b2'),
  (6, 'Modesto Junior College', '43164', 38477845911, 'b0ba8a6d10ad916ba68a87b72ff1efcb', '63bb1716563187017be2c4ba1619b459', '69bb5a51ce9fbe2adb7fed3ba3404d43'),
  (7, 'Porterville College', '06773', 39046786897, '400a4b303466bf4e0a6c3a31af7ef4ef', 'ecb96730320b13f1d2d32337412effa7', '260a17d0d437de1d60052766c991a49a'),
  (8, 'Porterville College', '30235', 44477695238, '0bf681b0221494f743f9dac74f906b67', '45b7478937c8fa0babaf83c650667d36', '072e959a821c97284ee3eff595bae498'))
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
