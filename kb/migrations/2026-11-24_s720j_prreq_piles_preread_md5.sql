-- S720J lane 2's cheap piles at Modesto Junior (named gaps 8). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s720_modesto_2026-11-24_s720j.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Modesto Junior College', '06639', 38477845911, '6c3f731089d29198881acb13561685cf', 'c59940d88ccdbd2a63fe18ec194066c9', 'ea67b3d082bd462a36317e680b8376cd'),
  (2, 'Modesto Junior College', '06642', 38477845911, '2e755e89e910739d69dffd8fdba5c593', '598b266c8caf0d08b3b919950ad632c6', 'a34b3c1c543846e2552b14edb7caed27'),
  (3, 'Modesto Junior College', '08103', 38477845911, '1d50d9a8f31fa07c5ed274c37ff7f429', '28fe8359ce34d55f70db89736ab84e6a', 'a3f850a69fbe8c3c7d8635e07b4b6b24'),
  (4, 'Modesto Junior College', '30675', 38477845911, '9fdacb46a0bf98d428581bc3c572120f', '6670455651f81e1d04b6fdc803860ecc', '3e8dba5e4ef356fb1a5e309fa991dc3f'),
  (5, 'Modesto Junior College', '32226', 44540818388, '553ba5be077285af0a51afd94ae79c73', '28fe8359ce34d55f70db89736ab84e6a', 'fc9c7af24612941046e725766c6ed665'),
  (6, 'Modesto Junior College', '33945', 38477845911, 'b78a0be1912b0b58a296d0a6c0ba048c', '3e096e5d8483d0570dfc23bf65a968b0', 'e95b38d2a7e71384e79b076f76b5e700'),
  (7, 'Modesto Junior College', '35276', 38477845911, 'bff880f5ea43d1c4cd0572cb63ed1736', '972ce3267c8b9670b117327200b82b48', 'f4f98b2e335364f95a17f55b0f2ba275'),
  (8, 'Modesto Junior College', '35277', 38477845911, '50d7a8f053172edcd5a4088aaa094391', '3c81834a38a33a73170c8fc53655fda9', '6a5e6924f441055bf254abcd14034409'))
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
