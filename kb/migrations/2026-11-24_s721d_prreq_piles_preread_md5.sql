-- S721D lane 2's cheap piles at Gavilan (named gaps 7). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s721_gavilan_2026-11-24_s721d.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Gavilan College', '06129', 38948144064, 'fa1a178e4c9e8f94f1a51906ec46ad3d', 'eaeecba98a269e444b59f4123fb3d9ff', '5660e06ec1c735df4bdd6af40c2b95c2'),
  (2, 'Gavilan College', '14041', 38948144064, 'c0617a5bae3cced19ea018fb3a8feeed', '972ce3267c8b9670b117327200b82b48', '5435ba4962d44258916b99298f8eac78'),
  (3, 'Gavilan College', '15555', 38948144064, 'e9d493ed27bc5be7fb8de62f72ea49a8', '17d0bd7b6abdc6e63ddeac2699eaa543', 'de25d0d1bec19c8c6aaf7c6e77d50ff6'),
  (4, 'Gavilan College', '18453', 38948144064, 'd7505e433dd142909ead5ca388cce8d8', 'f1275b67c1691d1312d8a0f9272de9d0', 'e81dee01c059d1a5a39b06570b9b97be'),
  (5, 'Gavilan College', '37750', 38948144064, 'bdc0b76238fc336e440b86f6a06483f6', '025f5967e09072e40425565d0b8c2cce', '0d760e357d1f42ea4196d858a056e5d8'),
  (6, 'Gavilan College', '38119', 38948144064, 'bd82ca6c303a0ab9821456651c00368f', '9a3b2c91b8c5492fa06edd938acb8240', '57a6c20edbe122792b45352771b7922e'),
  (7, 'Gavilan College', '39624', 38948144064, '2df28dea0631ee54607a2c47714ae2ef', 'c34a5582e6c0a6741c6da26def4a4775', 'efc73adfd8692525439925e4808df728'))
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
