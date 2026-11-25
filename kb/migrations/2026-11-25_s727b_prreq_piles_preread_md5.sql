-- S727B lane 2's cheap piles at American River (named gaps 14). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s727_arc_2026-11-25_s727b.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'American River College', '07206', 39047245752, '7c991f89badb79ff1eb4c58e3f38b90c', '3645279b5fab973bd4b06d8ad64d5c2c', 'd4055a9ab8e6671759772ee6571d194f'),
  (2, 'American River College', '12180', 39047245752, 'e404427869ff0820f57a93d7ea9a493c', '87e5fe088d44991cdab6e95d09f28b7b', '74f40d723b281684c9ef59437f94ae35'),
  (3, 'American River College', '12191', 39047245752, '6aca1763dd188d6921f83819d39e30ac', '3e096e5d8483d0570dfc23bf65a968b0', '585754dabd72d745c8ebfa201980cfb7'),
  (4, 'American River College', '12238', 43212067552, '3fdb009fab22981f69d21723cafb5a86', '077c543235a78b9caa6fc4c1d7d724e9', '60a446653c149e0869e5e75029c8c675'),
  (5, 'American River College', '12250', 39047245752, '10a2a73b7a41481bb6c28fa0e29ccdfa', 'ff2ec940ac119fa5548429dd254e63a2', 'e6b783e13ad6a6bc976cdbe6f0f11915'),
  (6, 'American River College', '20130', 43212067552, '4b99ca0cebb1119fad6924592e690e1a', '3df2490d77d37598c353a7cadf2ba15d', '6dc608bfa5d2189cd9bcc0700424aa9e'),
  (7, 'American River College', '30023', 43212067552, '2be2ce91f27b01a78ad533c906540441', '3e096e5d8483d0570dfc23bf65a968b0', '11b6e5b855463e2f8d9a3e00f8a8e6a3'),
  (8, 'American River College', '30024', 39047245752, 'dda5aaf69a475b00c78c354e22bf50bf', '3e096e5d8483d0570dfc23bf65a968b0', '11b6e5b855463e2f8d9a3e00f8a8e6a3'),
  (9, 'American River College', '31390', 39047245752, '4947a8087c4f60fc550079f8326bfb1a', 'cf9f2f0a6e848e65bab42329ce477d53', '7c52c8a4f915f000ec9b58f5f14a8b62'),
  (10, 'American River College', '31466', 39047245752, '8bc07f24ba5bcd49fc5812143e03d9a9', '27891343e972f72a780a56cf47022b90', '013da14adf17a77ae125576cafb24439'),
  (11, 'American River College', '32643', 43212067552, 'baaf1aa1d41b2203b2e7b84804be5c5b', 'c0bb32c4b48ab13f3bed92ae04cbd36f', '4492fb7faf4b057619d183e8bbfd51cb'),
  (12, 'American River College', '33273', 43212067552, 'be7f1a0863580d1a2f9c38177e0c6c3b', '972ce3267c8b9670b117327200b82b48', '35d6a69e469de4260af72740917c21fc'),
  (13, 'American River College', '37899', 44535418752, '65bb6835ef2b4cd6d09a0593c18069ce', '2372ccaa5a25e8972575e8e90430885f', '90b37df635b645b5b7cbda415303b723'),
  (14, 'American River College', '43381', 39047245752, 'c265b53c5037d625e3900f204ddee78b', 'cfee00a9e5043a7cc7141e2b9c21b3a9', '45b4f130017c097cb1da9d6a9a98025b'))
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
