-- S720S lane 2's cheap piles at Santa Monica (named gaps 20). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_smc_2026-11-24_s720s.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Santa Monica College', '03256', 44885033145, '0fc08e4551dec778043ad5dda1f61a1a', 'df1f46dda28f904ad5c64f462c51773e', 'b0a179ceb7362a506df91d2f6aefc299'),
  (2, 'Santa Monica College', '03263', 39567439681, 'aae7a022448b5e33c3a2844dab8463df', '7c2a6dfca48d32194a28ee696f138b2c', '0340dd2940ab3c336c57360beddb7a41'),
  (3, 'Santa Monica College', '03272', 44885033145, '8139c1b83ba3f82ba935675e221c59bf', '19858e944fcf61269cbf472edbd139cb', '3d95f5abf50b41d8c7172fe56ad2cc6b'),
  (4, 'Santa Monica College', '03282', 39567439681, '679522ec54c18bd6638da16ea0d5281b', 'be095b039bb1c195485474eb04b82f58', 'ee8da741f5b6689adaf09e47f52ec9b4'),
  (5, 'Santa Monica College', '03302', 39567439681, 'bfead6ee1dc7147e74820efea1c8524d', 'f61818b42c814e08375c21e81c36f31e', '56467bfce2343ac51e7d39d59459b510'),
  (6, 'Santa Monica College', '08970', 44885033145, '375254fa3c19c1be5139611893b01bb9', 'ebe5721367bc6ed927d18e2de5e6445a', 'c73d066749232c6b26a4b2338c925f2b'),
  (7, 'Santa Monica College', '21007', 44885033145, 'ff163a4674ae197428dc8bc3982e0db7', '841d9b4ca1b4eaf2c4395d3fefcb8b7e', '87156774f675cb795a60e34af46f2a19'),
  (8, 'Santa Monica College', '32792', 39567439681, '470c47cedbeaad6f60f3c2a09963e40a', '1b4ae803faf072e664173ac41afdb0c3', '4e9c354c317ff21b974e74c8ceb054b5'),
  (9, 'Santa Monica College', '33270', 39567439681, '90308c89fd5ab8a8db39e6f494286596', '28fe8359ce34d55f70db89736ab84e6a', '534b9e89bf5a4681cefd0c25ec557780'),
  (10, 'Santa Monica College', '33271', 39567439681, '535ddc4b0111eb1dbacafdade982d364', 'e6b0b5cfa78794c26cb970412b264e83', 'c093b4ac395cd8962a041fd10007c7d6'),
  (11, 'Santa Monica College', '33339', 39567439681, 'da7bc80d77b288aada27e8318582d08b', 'ea5ae3dd83e8f9f63df6ab4a1b775ba9', 'd9b236d178fca92ec6a854c1988a125f'),
  (12, 'Santa Monica College', '35284', 39567439681, '6d3c5c57021cbd0acbeb0434c396e63f', '732f760180d5357662ee4e0d4427de43', 'c3f9781c9c7de3cfb382fd05eb5d96b7'),
  (13, 'Santa Monica College', '37452', 39567439681, '0208c35fa730daa87daf96fb45a8391a', '9d8285ed9639b8b2136a17b9b67c3e3c', '8dfd45b366791a1e624e1f1e856f4ea5'),
  (14, 'Santa Monica College', '39671', 39567439681, '36858983a7034f7f391d73f467cee73f', '3db55b679c617879bf8ee2173a835eae', '59e9e411112909dc246bff3b388d173c'),
  (15, 'Santa Monica College', '39680', 39567439681, 'ee0b20d77ab1818653cc992029b2ecd8', 'be095b039bb1c195485474eb04b82f58', '83325c0681a5796379c8bb041d9d1791'),
  (16, 'Santa Monica College', '43655', 39567439681, '308086db755c2bb659dd36f43df5b04d', 'dfde00127a538f508c28565d7c2b6fb6', '90862a34a707b1788bc7ed855a7775c7'),
  (17, 'Santa Monica College', '43743', 39567439681, '865b01a20a9dd479408ad229a8d0e57b', '16260182f27048bd5418fbe24f7d4746', '63eb195a838fb0002efa723b3b3dd3b6'),
  (18, 'Santa Monica College', '44004', 39567439681, '58f8b04dc80745d38a2261e341bf20ed', '3c81834a38a33a73170c8fc53655fda9', '70b9577b32d0655b5729f1a78fd5765e'),
  (19, 'Santa Monica College', '44720', 39567439681, 'a0606c9d783eb2401fb9ebbc64b46482', 'c34a5582e6c0a6741c6da26def4a4775', '139be4ad4e32e26f4acb1c81b8d678f1'),
  (20, 'Santa Monica College', '46189', 44739378155, 'c134d7a24f00520a421225e5c9ba08bf', '788ee0293bdb78bb388760da1bbc39c5', 'f5d33e6731faf1be01181d61314d634d'))
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
