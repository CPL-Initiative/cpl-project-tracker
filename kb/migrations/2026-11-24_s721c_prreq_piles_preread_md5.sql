-- S721C lane 2's cheap piles at Porterville (15 rows: noted_figures_differ 1, noted_no_total 9, noted_section_cut_off 1, passes 1, pool_figure_not_read 2, repeat_read_once 1). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- for the renamed row coverage and invented passing; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s721_porterville_2026-11-24_s721c.json (before_image
-- per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Porterville College', '06773', 39046786897, '400a4b303466bf4e0a6c3a31af7ef4ef', '87e5fe088d44991cdab6e95d09f28b7b', 'ecb96730320b13f1d2d32337412effa7'),
  (2, 'Porterville College', '06797', 44477695238, '655978883f47ca92dee36ba956d7100a', 'd40728d886a3f56d672a9668c8fb4605', '8e4477aaee633bde2eb85fc62fe54e2e'),
  (3, 'Porterville College', '06809', 39046786897, 'cada6b035c951a0bd182318deeb5110d', '725b75a0db1552d48624ccf8eeaef7ac', '8c4d56df2d0c092d334a3c3ec612d310'),
  (4, 'Porterville College', '09520', 39046786897, '8c4bc366a4825feb8b01e0cd377f60b7', '05a8a732ddafc0a2f00db74eec12a994', 'ca3b03ac9c964fa5f966f90040e41c27'),
  (5, 'Porterville College', '30235', 44477695238, '0bf681b0221494f743f9dac74f906b67', '28fe8359ce34d55f70db89736ab84e6a', '45b7478937c8fa0babaf83c650667d36'),
  (6, 'Porterville College', '35239', 39046786897, '1953de4b4159786c54bf49811decbbb3', 'd7948df13c764fbd4ba82dfbe9e62caf', '2dc3a62402f212434c2550bb41407ce9'),
  (7, 'Porterville College', '35256', 39046786897, '0c1d16eeb15dbae832e8ed9cb4a2ef43', 'e4769b25a38853bf34bcc352eada49b1', 'e01248e3e51e37b21977c4e5f1714047'),
  (8, 'Porterville College', '36704', 44477695238, 'd292c73e36182fc06a0e283a9a0509f9', '16c6cdc20607329cfbd615afadef21ee', '113a416cdd2e53005aaf110043003e42'),
  (9, 'Porterville College', '37377', 39046786897, 'dabdf23ca49f7a4aa3e8f2d0aac2cd29', '3f55c9c5a0bb29a18862232881ffd752', 'c60d7b33bc1b701c7f7d75aa53b6e7c8'),
  (10, 'Porterville College', '40122', 39046786897, 'e221a10389ac7567e2761063b1537b4a', '87e5fe088d44991cdab6e95d09f28b7b', 'ff13a217b067694f02b406aeb6dd9602'),
  (11, 'Porterville College', '41689', 39046786897, 'af8572c89cc57b52d4e99fcb678e1611', '24ddfa68326ccb5cf0a8142c92f04809', '0f9e6b4a3fc3594aace3812481618b9a'),
  (12, 'Porterville College', '43554', 39046786897, 'a56b74912cc9b9f40846ccd6bc9454ea', '9145462fe05f476bc1bc5e1be3956b2a', '279c9a68d28e4b814ce5679cf3fb61b5'),
  (13, 'Porterville College', '44409', 39046786897, '4b1b20d087a5d468eb1035375ddb893e', '3df2490d77d37598c353a7cadf2ba15d', '84404eb1ec528f51bcd12ff9da052b84'),
  (14, 'Porterville College', '44926', 39046786897, '6b961e17992a3e4237181b18701df4c9', '459dfeeb5c989cefc33fe2c631af6755', '31b7c31aabd6e242d97b5819b243d8e0'),
  (15, 'Porterville College', '45626', 44477695238, 'e08019c5723ef615ce8b7e2a860c1491', '18c0f11e5a5d6f2f0787ec9e6ea33a3c', '0974e9aa34a90afd9be3e1a4928bd2bd'))
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
