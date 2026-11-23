-- S714C compact pre-read, read-only: one SELECT, one JSON value. Each row's before-image record and checks and its
-- after-image checks as md5 of their jsonb text, hashed on a local Postgres 16 (p-compact-preread-by-md5-s713); the
-- full before-values (the fallback where a hash does not match) are in kb/migrations/2026-11-23_s714c_prreq_piles_preread.sql and the receipt.
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'City College of San Francisco', '30897', 44474797786, '7f1a17e2dc2b85ea03005000183692d1', 'cb960b7fa811848ebaa9d1adda31a7cd', '0f64d153f27e83e0d383623df5f0d1a2'),
  (2, 'City College of San Francisco', '35690', 39056434592, '04bb1215f800daa88356a4bab9989f2f', '63beebf1c29998874baf9d6878c8912e', '0774b7a7ad7160ad1117b3ba6551f1a9'),
  (3, 'City College of San Francisco', '40704', 39047128472, '9df3be42d83948de41d4da2322c124c3', 'f1926aad22beb41117dec88d6df14eb0', '7fd3e079795660832a2dad4d086c45c7'),
  (4, 'City College of San Francisco', '40876', 39047128472, 'fb072fdaf5118f2c93692d2ee0cae667', 'f1926aad22beb41117dec88d6df14eb0', '7fd3e079795660832a2dad4d086c45c7'),
  (5, 'City College of San Francisco', '42228', 39056434592, '4f6ed843106396cfa2c7f8e9f7dc32f9', '63bb1716563187017be2c4ba1619b459', '69bb5a51ce9fbe2adb7fed3ba3404d43'),
  (6, 'City College of San Francisco', '46323', 43693267535, 'b9dddb0025ea7cba61a0ed95db6f03d3', '4f25a38f4dda2df21ef7c9ab5ce6472f', '5fe93010f15b7246da660375ca4cf1b0'),
  (7, 'City College of San Francisco', '46324', 39056434592, '93f3a5ac88c80110942d428cd7009c96', 'a26b7414751335854356584c52a1a44e', '8e87281bb7270e6ed56a2d1eccdc2f0b'),
  (8, 'City College of San Francisco', '46326', 39047128472, '4ba6b07c96bf10ee1285a3cca9ccdd89', '668f35cd2b4c8e4f919bf96332c4ce36', '0cd7b60aaa7473943434ea5064ba984c'))
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
