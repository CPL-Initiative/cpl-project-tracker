-- S721P lane 1's pooled figures at eight colleges (14 rows: passes 13, pool_figure_not_read 1). Each row's checks become the college
-- load's image of its rescored record (load_rows); the record unchanged. Receipt: kb/receipts/program_requirement_records_pooled_s721_2026-11-24_s721p.json (before_image per
-- row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Clovis Community College', '33489', 44522071814, 'bc61cedf5d1e3ad0816950d9978a4d00', '53c4728538a961a906fd37300710b5cd', 'd746f8b3633090bec3b73c8e701d0454'),
  (2, 'College of the Sequoias', '35415', 44688217584, '22cca629a4990307d778bb794b1227c7', 'f56598692dc41388b7063e869aa57522', '1b34a8e918d4d406350d745229106668'),
  (3, 'Fullerton College', '18163', 38675136988, '69f8d5609c1a254dda97c759979a3467', '8ddd9665179bf0976ae896606692e37b', '8a3da0d5fbe84d736a668e53d22b1084'),
  (4, 'Modesto Junior College', '06639', 38477845911, '6c3f731089d29198881acb13561685cf', 'c59940d88ccdbd2a63fe18ec194066c9', 'f13d3420b2a42ba82c0bd95a728f6dae'),
  (5, 'Modesto Junior College', '06642', 38477845911, '2e755e89e910739d69dffd8fdba5c593', '598b266c8caf0d08b3b919950ad632c6', 'a34b3c1c543846e2552b14edb7caed27'),
  (6, 'Modesto Junior College', '08103', 38477845911, '1d50d9a8f31fa07c5ed274c37ff7f429', '28fe8359ce34d55f70db89736ab84e6a', '072e959a821c97284ee3eff595bae498'),
  (7, 'Modesto Junior College', '30675', 38477845911, '9fdacb46a0bf98d428581bc3c572120f', '6670455651f81e1d04b6fdc803860ecc', '7fd3e079795660832a2dad4d086c45c7'),
  (8, 'Modesto Junior College', '32226', 44540818388, '553ba5be077285af0a51afd94ae79c73', '28fe8359ce34d55f70db89736ab84e6a', '072e959a821c97284ee3eff595bae498'),
  (9, 'Modesto Junior College', '33945', 38477845911, 'b78a0be1912b0b58a296d0a6c0ba048c', '3e096e5d8483d0570dfc23bf65a968b0', '1ffb9c066298877a03512a8faaa61844'),
  (10, 'Modesto Junior College', '35276', 38477845911, 'bff880f5ea43d1c4cd0572cb63ed1736', '972ce3267c8b9670b117327200b82b48', 'e56e4f55e2fd2e651d7274ecfc2d45b2'),
  (11, 'Modesto Junior College', '35277', 38477845911, '50d7a8f053172edcd5a4088aaa094391', '3c81834a38a33a73170c8fc53655fda9', '279c9a68d28e4b814ce5679cf3fb61b5'),
  (12, 'Santa Monica College', '03263', 39567439681, 'aae7a022448b5e33c3a2844dab8463df', '0340dd2940ab3c336c57360beddb7a41', '18a75525e8cdee0e9347ce768b17e7f4'),
  (13, 'Santa Monica College', '32792', 39567439681, '470c47cedbeaad6f60f3c2a09963e40a', '4e9c354c317ff21b974e74c8ceb054b5', 'ec1dbe6e79247269ba8afcd6d2872493'),
  (14, 'Ventura College', '20576', 38756014587, '2cc7e5378f748ce0c13dac3027190cd2', 'dd3be177675d4331b44b8247ee2eb19e', '0cd7b60aaa7473943434ea5064ba984c'))
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
