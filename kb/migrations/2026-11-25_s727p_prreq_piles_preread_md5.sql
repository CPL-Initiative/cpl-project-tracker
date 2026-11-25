-- S727P lane 1's pooled figures at five colleges (11 rows, every one passes). Each row's checks become the
-- college load's image of its rescored record (load_rows); the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s727_pooled_2026-11-25_s727p.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Cuyamaca College', '18629', 44752892297, '8d553d8f9135c641c2eca29aea188889', '7b2c3ad34f7d31d6257377554f7619ba', 'a8dac9e5ff51f30f7e512996359926e7'),
  (2, 'Cuyamaca College', '18631', 44752892297, '1eac7af4a73fe22e0da10498c0365984', '90d275889c39604de34bae907ecb545a', '88657f9453a95ee48cbb0b3e51693fda'),
  (3, 'Golden West College', '19461', 38748828247, '715da7727b797b221e41229054124b6a', '5e512fa834cea01dbe58f2a39f7e7e29', 'a202b02e789e522abc26a202ee1d9f04'),
  (4, 'Modesto Junior College', '08104', 38477845911, '6489347f07c5bbea18c54b387af9d6fa', '109beebec561d7ac9d201559c9646b58', '5e1cdf92ba6c80ef4a7671d6f1db856c'),
  (5, 'Modesto Junior College', '08111', 38477845911, '72b74e77212a313d97345f4999b546ee', '28fe8359ce34d55f70db89736ab84e6a', '072e959a821c97284ee3eff595bae498'),
  (6, 'Modesto Junior College', '33944', 38477845911, '3c56cd248225a2d45945f8b2f03f827c', '3c81834a38a33a73170c8fc53655fda9', '279c9a68d28e4b814ce5679cf3fb61b5'),
  (7, 'Modesto Junior College', '37300', 38477845911, '31106d7071591bd499a6ca77422de1e0', '63bb1716563187017be2c4ba1619b459', '69bb5a51ce9fbe2adb7fed3ba3404d43'),
  (8, 'Modesto Junior College', '38067', 38477845911, 'e84a5d73c96ad5f95892feb3bb5751c1', '788ee0293bdb78bb388760da1bbc39c5', '08074668b7756a023e12e3792ba793d8'),
  (9, 'Rio Hondo College', '19274', 38843465712, 'a15a852f6e6242590a72cec13351652e', '28982a308a512893d3cac0d482b6a3b2', '83ace3c469e917f1dd7490c2458c3cc3'),
  (10, 'Rio Hondo College', '19275', 38843465712, '29bfa7220c082911d794e7395428783c', '65f41c0efef7929fe0cb511a1d5afb4e', '412e1f4b18578679d60035c8937337e2'),
  (11, 'Rio Hondo College', '19276', 38843465712, '3da57b152cc59f4bd77089d933c23c00', '36d1690a63a54cdf7892c487ccdc3a09', '2ae8fbb14745d8ecefa0a3d2e72c7dc2'))
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
