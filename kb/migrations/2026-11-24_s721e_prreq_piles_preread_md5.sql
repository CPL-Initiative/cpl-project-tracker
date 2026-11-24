-- S721E lane 2's cheap piles at Butte (named gaps 14). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s721_butte_2026-11-24_s721e.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Butte College', '01305', 42973457189, 'ee2bbec362f7d0690d05fc7a9e60cfbe', '3e096e5d8483d0570dfc23bf65a968b0', '5b8d3c8acaaec75ebc972751c289d76f'),
  (2, 'Butte College', '01358', 42973457189, '8f05473261572d2cb19db1b2df5b71fc', '88e2495efd06d1573c7fb0fe096e2788', '582c97103b0c9e38dafb1613f96ab97b'),
  (3, 'Butte College', '01362', 42973457189, 'ea93aa27744886c7384ed01fde8530e8', '565698f6affa77ef6c1410d28f8c0923', 'd046c1f4ef21b8e060f93a19282e8918'),
  (4, 'Butte College', '07258', 42973457189, '1387ea3281401c0281c69e8517010dc2', 'd2b6fcfb6953124b2f0584dbf2bd644b', 'bdd0ac1797d5413654fa702e60c0a77f'),
  (5, 'Butte College', '07269', 42973457189, '63f83969149ab71d1bd3d1ef799c73b5', '87e5fe088d44991cdab6e95d09f28b7b', 'a97feab1ffa8c25830662715e2dbe48a'),
  (6, 'Butte College', '11136', 42973457189, '1b04990c309fdb25ade18b3963dc3dc0', '3c81834a38a33a73170c8fc53655fda9', 'edb894436b28799c1f10375c55c60d6d'),
  (7, 'Butte College', '31000', 42973457189, '5e4a6e16dc367583005bc7f89bb87611', '3c80fbd5773b6304e04af72d50991591', '55970c21bc316cdbc66fff9321d62551'),
  (8, 'Butte College', '31042', 42973457189, '1ba76c5facab13c8a6ab2a7a55e20c91', '025f5967e09072e40425565d0b8c2cce', '0d75c12ba8156cf5318ad8084dd1a48b'),
  (9, 'Butte College', '31941', 42973457189, '8d43f4e736f135d46757a6eef907f18c', 'b167e014df6b97bdebba96ca16afce51', '350557de2c7138e68de6ef9cc8168a25'),
  (10, 'Butte College', '32469', 42973457189, '323aa66e5740198d654c33e070e05f7a', '788ee0293bdb78bb388760da1bbc39c5', '380a8516b0d6434c88c7f02cb43c416e'),
  (11, 'Butte College', '33199', 42973457189, '6f92dfc3db97092a3bae7f7e42c1112c', '63bb1716563187017be2c4ba1619b459', '47ab6901eae2f68f3a0dccb3aa143899'),
  (12, 'Butte College', '40923', 42973457189, '550067f78616fad01e5ba1dd4e7ec713', '6670455651f81e1d04b6fdc803860ecc', 'd1cd4cfd8a867e73295ace5cce92c6fb'),
  (13, 'Butte College', '43453', 42973457189, '6b368a7d0862d41eb1eebdcbddbfe099', '565698f6affa77ef6c1410d28f8c0923', 'd046c1f4ef21b8e060f93a19282e8918'),
  (14, 'Butte College', '45652', 42973457189, 'ab4e92d16fffe542b327f73109183615', 'c59940d88ccdbd2a63fe18ec194066c9', '80d96e1f7d76b23dc1924b9cd145385d'))
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
