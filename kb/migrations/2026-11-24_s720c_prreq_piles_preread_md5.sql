-- S720C lane 2's cheap piles at City College of San Francisco (named gaps 17). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_ccsf_2026-11-24_s720c.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'City College of San Francisco', '05482', 44474797786, 'd31f4cf4ed8c2e59334ee8530b86f1d7', 'ff0824422e219dcfb156c2b1d7038ba8', '67c3ac55e860cf97fcac0754f6795c3d'),
  (2, 'City College of San Francisco', '16990', 44474797786, '462f1901df47d03d27830b2bf3539df2', 'b76acd785dbc59227502ae4e04690d0b', 'e4d45faf215cdee85684fdbc6981de8a'),
  (3, 'City College of San Francisco', '16991', 44474797786, 'f1eba3a7d9b4f1a05923d2e780b3cf37', '025f5967e09072e40425565d0b8c2cce', '14ba5989a7af6db9a3a8e140767e8212'),
  (4, 'City College of San Francisco', '17614', 39047128472, 'efe303bce7ca88f32ca61a8e909af334', '3db55b679c617879bf8ee2173a835eae', 'a3212ce68ad2e30c2db99183519bec0c'),
  (5, 'City College of San Francisco', '17615', 39047128472, '7bcaacee6a32a241af9f59eecd3d48a3', 'be095b039bb1c195485474eb04b82f58', '0e10ce462633ce563307825f19000c72'),
  (6, 'City College of San Francisco', '17616', 39047128472, 'c6d5c5e2805ac25c8d24b7185b2963d7', 'c59940d88ccdbd2a63fe18ec194066c9', '173bb77bc0c0aefcb08a98f3b0a70ed0'),
  (7, 'City College of San Francisco', '17617', 39047128472, 'cf07cbcdcfb84c7148892ae28c615e58', 'be095b039bb1c195485474eb04b82f58', '0e10ce462633ce563307825f19000c72'),
  (8, 'City College of San Francisco', '17618', 39047128472, '3e460a9fb6987aedf8ab619f44b58ea3', '3db55b679c617879bf8ee2173a835eae', 'a3212ce68ad2e30c2db99183519bec0c'),
  (9, 'City College of San Francisco', '17619', 39047128472, 'cf07cbcdcfb84c7148892ae28c615e58', 'be095b039bb1c195485474eb04b82f58', '0e10ce462633ce563307825f19000c72'),
  (10, 'City College of San Francisco', '33208', 44474797786, '6074906ef4e406fccdae8978d8dc4c4b', 'ba33342a251af2755bc92717d10ac73a', 'bfa2ab4acb1064a07ee4f49c0c11cbb8'),
  (11, 'City College of San Francisco', '37781', 39047128472, '5e601cb97fe59e08221473206d38d0b8', '434c0b441c88ec8f78ae1d758b64e68d', 'b29384740ea4f4d810a4f9cecdab57b8'),
  (12, 'City College of San Francisco', '38267', 39047128472, '30136f0b1817ff9a6e347c81120a5f99', 'ff0824422e219dcfb156c2b1d7038ba8', '9fcc1a2a4e6255a506064e79b3c4cbc7'),
  (13, 'City College of San Francisco', '38907', 39047128472, '249992b3ea080aa885ff4c0244e14095', '7f508f3102898bbce71bd8f711c03f4e', 'f5d9d917a2352027810465c8aa13aacc'),
  (14, 'City College of San Francisco', '38909', 44474797786, 'd8ec6d63c49ca8ce546e0dec1b1b4cf4', '95e1ba636e62452b6a426e38ea61b1aa', '6f56ab998823fa637e4659409e538eab'),
  (15, 'City College of San Francisco', '39727', 39047128472, 'ec52f1664c18e0ed86c1b0c00c8f5de8', 'c59940d88ccdbd2a63fe18ec194066c9', '76019c7b42b7d47b6369d54ebfd45efe'),
  (16, 'City College of San Francisco', '40157', 39047128472, '05d48847ed9299fc7917a2c9ddd5fef2', '565698f6affa77ef6c1410d28f8c0923', 'f93cf15daabdb29a05eca99a77b539bc'),
  (17, 'City College of San Francisco', '41361', 44474797786, '373e84d5d86888e506ca9afe9874f2e5', 'ed413f9a6f75f7cff5fb9284744fe057', 'aa7dfa9e885a6b50a7fa1fd37b076a9d'))
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
