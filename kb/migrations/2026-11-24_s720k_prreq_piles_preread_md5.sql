-- S720K lane 2's cheap piles at Contra Costa (named gaps 16). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s720_contracosta_2026-11-24_s720k.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Contra Costa College', '01381', 38979730323, '03340707cf4be906d0b71f04b037d8f3', '8b6a83d3fa553ad1c6e1e21039beeb4a', '7cffb482adc730f75e71c11e3f12f72e'),
  (2, 'Contra Costa College', '01384', 38979730323, '06794717d76e80a5a981002c395bf9ea', '4234c8b4cfa5f7752ec9b00ea3828eef', 'f5ccc0434500dc05f471eaef269b7ecd'),
  (3, 'Contra Costa College', '01387', 38979730323, '8b119492c018eb37a3facce24af80718', 'f1275b67c1691d1312d8a0f9272de9d0', '862730dd91cb40adf651300a3ed59147'),
  (4, 'Contra Costa College', '01393', 38979730323, 'b54b71a4e686679d9233178b4975c591', '88e2495efd06d1573c7fb0fe096e2788', '37ce6af7298f98308d9573748640f2b5'),
  (5, 'Contra Costa College', '01408', 44687786167, '3b91baa5ceaa47a0710e982c3856af94', 'a48ac3033dae06ab1d7b265686e8358b', '0b9964a88b56ac04c53ec10dddf2f22a'),
  (6, 'Contra Costa College', '01437', 38979730323, '577d5b045ccdc795db64dd5b182f8dae', '88e2495efd06d1573c7fb0fe096e2788', '37ce6af7298f98308d9573748640f2b5'),
  (7, 'Contra Costa College', '01443', 38979730323, '2a615511f310206fee57a9484d1f9c7c', 'dfde00127a538f508c28565d7c2b6fb6', '900482111999cd2d98f893f709a7e049'),
  (8, 'Contra Costa College', '01447', 44687786167, '16e251e3086a452a33ec81fc60db279e', '3e096e5d8483d0570dfc23bf65a968b0', '9624be220a59db2cdc13650b7d62dc2c'),
  (9, 'Contra Costa College', '01448', 38979730323, '24a29497425b428ca1bb5bbdf5aff640', 'd2b6fcfb6953124b2f0584dbf2bd644b', '66b5880a4707f1b14990f43bc97a52b1'),
  (10, 'Contra Costa College', '07602', 38979730323, 'fcac70bb3a46757c57cfb5b0f74bcbe6', '6670455651f81e1d04b6fdc803860ecc', '8ce486f954c7c48406cd2969dc12a9c9'),
  (11, 'Contra Costa College', '07614', 38979730323, 'df8a6000ade4f17f0d65bb5897b56bbf', 'a6167bd981d5703e38a22ea38e0e88e4', '4711193fbfba655b7c2ba0279d477867'),
  (12, 'Contra Costa College', '07616', 38979730323, '3b98b6e3daf90024e7f2e7d1a789a05b', '025f5967e09072e40425565d0b8c2cce', 'd318cab2e10b526c3f5e4e5a2632f4f7'),
  (13, 'Contra Costa College', '11702', 44687786167, 'b57433575eee25361c46ce180f54c105', '565698f6affa77ef6c1410d28f8c0923', '66e4cd2fef2e598228721e8f6aae440a'),
  (14, 'Contra Costa College', '18984', 44687786167, 'b94572c867bae21d74a4c7b0c6ea26bd', 'c87b25e273ac29679a622724f1b595f2', 'da2c5a809942251b3e6ef2c0a8d4c581'),
  (15, 'Contra Costa College', '36158', 38979730323, 'e9b7e1545e06bca0ee513ad435d557a5', '22822ddfa4797050c8e5ea2d4f402d5e', '6052d17c27ffe634d5c55833f308d243'),
  (16, 'Contra Costa College', '42085', 38979730323, '06bde4f042883391993b1c9f1e7a74f0', 'e45cef76177bad42e9f8ebf85bb96c71', '3f61988c567401e2df54466591114321'))
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
