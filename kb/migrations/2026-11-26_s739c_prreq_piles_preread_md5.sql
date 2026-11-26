-- S739C lane 2's cheap piles at College of the Canyons (13 rows: lists_not_closed 1, noted_figures_differ 2, noted_unit_floor 1, passes 7, repeat_read_once 1, unit_line_not_read 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_college_of_the_canyons_2026-11-26_s739c.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'College of the Canyons', '02277', 44769429877, 'b01bac1722ffeca05ea8255ebb3b9b80', '3c81834a38a33a73170c8fc53655fda9', '03b91331d7d6495724918843438c7e36'),
  (2, 'College of the Canyons', '10302', 44769429877, 'ee0d22e47fcbd8a0fea4a4ca6d09c337', '1fb996d21dfe35e94099253940fbd0a6', '30d42d09a7fd0192565d114b017c3028'),
  (3, 'College of the Canyons', '15477', 44769429877, 'a54c783d382da92c40c8217149b44ba1', '6d2e0cb935c0d38e7096880bea2459b6', 'f18db3d5a55d8615cd7c1f7f8024f29f'),
  (4, 'College of the Canyons', '19386', 44769429877, 'fbbca063b74e1ff088c9cc2d7a377f27', '385acddd2f8a9fea1ec7d35fb691a32f', '05f255978566ec4f50c14f9690a4b2e7'),
  (5, 'College of the Canyons', '32723', 44769429877, '6054675162de0eb09e5aa3ba92d788b3', 'ac5a4f1949827c29f58d6f1bc14c2d99', '4ec7955c48c6b4861e7e77deb237baf5'),
  (6, 'College of the Canyons', '32815', 44769429877, '46a692c94e4b60bed4d54a0a2cb49339', '8fd0a9378506bd00405b5cf1ecb0628d', '6251025399dbd102c7c2504b6f0c2d66'),
  (7, 'College of the Canyons', '33814', 44769429877, '14536ea69aa11917d242f6444705c752', 'e1c6fbf770128bf10ed9bd26c429380b', '977e450b906fae12281dbb362c5a5662'),
  (8, 'College of the Canyons', '40090', 44887850515, '45e96d22003901d026d04776fd423178', 'eb2e5cc8f42deaf419518ee89dfe9b03', 'f28d449844a4a3e761f3d32e600c7147'),
  (9, 'College of the Canyons', '40384', 44769429877, 'f1b3b0c9d204fb3194bf61e6a0d97ba9', '025f5967e09072e40425565d0b8c2cce', 'b2f52d687182327018d540fc089e06d6'),
  (10, 'College of the Canyons', '41576', 44769429877, '819f6484d5d4dbad064b2d4eec03abc2', '39747decba62d1a4fc97e2e52cd92e81', '632dfa5523d6d248afab77f1be535390'),
  (11, 'College of the Canyons', '44260', 44769429877, '7e8682a47143840df2466281762c2142', '7cb2ed143eae58e89ecd2f7c610ab8a7', '546272a66764ffe805ea8a958c3d7e42'),
  (12, 'College of the Canyons', '44657', 44887850515, '983642d4f3662cb7e29ab4c5047eb841', '4fda625e79bb6947c750abfd135f9573', '0cd7b60aaa7473943434ea5064ba984c'),
  (13, 'College of the Canyons', '45528', 44887850515, '520a03bb6cd7db13556e5b214ba8c01f', '7600e9daa38926abed3355fdbbbda264', '803fb5abcb1a07dcbb6adab74564d600'))
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
