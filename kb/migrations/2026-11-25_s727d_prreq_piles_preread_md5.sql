-- S727D lane 2's cheap piles at Santa Barbara City (13 rows: passes 7, pool_figure_not_read 1, repeat_read_once 4, required_list_outside_total 1). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- for a passed row the arithmetic equal; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s727_sbcc_2026-11-25_s727d.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Santa Barbara City College', '05902', 38670933359, '3eae7882a0c576d658c0dc16bdbc3424', '565698f6affa77ef6c1410d28f8c0923', '9e3aeae7d2aa8193e03a9a1b2e4bfe57'),
  (2, 'Santa Barbara City College', '05913', 38670933359, 'd79f7727d45ffc6726d885c6d6e0b81f', '04eba1603f30ec72d2c2741fe30ffe20', '941225bb70ffd5223af3ab4cda269fdf'),
  (3, 'Santa Barbara City College', '05924', 38670933359, '668a6ed3ee5df702d7d2da5f6c45cab0', '565698f6affa77ef6c1410d28f8c0923', 'b8b080e814acd612339978d9756bf29a'),
  (4, 'Santa Barbara City College', '05934', 38670933359, 'a27aa5f48f521ecbde47996d8cc542fd', 'f4f07c065875022ef3cbd3d0b40f2650', 'e475b8def47a870e8c33f74ccbcbdec4'),
  (5, 'Santa Barbara City College', '08565', 39782741424, '47b6a838fa4e6bf6404e4a273c6c04e4', '373967db51ec6f7d68777f88776b6b17', '68eb9a1f83a4a8e59c48ef90f93a4a55'),
  (6, 'Santa Barbara City College', '10661', 39782741424, '824438f85f1c411926135a9f7c1a4ad8', 'd2b6fcfb6953124b2f0584dbf2bd644b', '7433bfd400f32a927801e2fe1f20e1b6'),
  (7, 'Santa Barbara City College', '10889', 38670933359, '6e97be3f1ad0b0a61486baf7e4b216e5', 'cbf5307c76c2a0516620ac747998024e', '891b409bd4bbee90cca1f5dfc817f9a6'),
  (8, 'Santa Barbara City College', '10890', 38670933359, 'db040c2c5d59ef35af7e488e61f89b4c', 'ebe5721367bc6ed927d18e2de5e6445a', '2003f7d0b64082241da5e921fdeb378b'),
  (9, 'Santa Barbara City College', '10894', 38670933359, '7cd898c344ddba9ca04b2b3a8f6af561', 'fd07aefb39fc45dd7df7116b6f1d4910', 'ac9d9b70e252436db639746747c85159'),
  (10, 'Santa Barbara City College', '19099', 39782741424, 'dde041cd4c46ec53f158f09b7d1b6114', 'f06db34bb8fdcada1d51280dd49be005', '492c6b6fb1d833f11e331d8a5db3315e'),
  (11, 'Santa Barbara City College', '31338', 39782741424, '844c757f1a2dcf70c2c92208d6dec38b', '639e2f24726fec0b7145ccbb2fae568b', '6fff68f09b91d817b2092156573fb2e5'),
  (12, 'Santa Barbara City College', '38595', 38670933359, 'b4186c20d0423fff64589e2aefc1d1df', '4c25c25e40d342193a7ec38f62bd75ec', 'f28d449844a4a3e761f3d32e600c7147'),
  (13, 'Santa Barbara City College', '43539', 38670933359, '00f7dff5fc4624d856b97d86f6bb043d', 'f06db34bb8fdcada1d51280dd49be005', '492c6b6fb1d833f11e331d8a5db3315e'))
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
