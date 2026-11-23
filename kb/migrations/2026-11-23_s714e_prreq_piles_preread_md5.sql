-- S714E lane 2's cheap piles at East Los Angeles College, 15 full-row rows ({"repeat: passes": 1, "ge_waiver: passes": 2, "plan_line: passes": 6, "ge_overlap: passes": 4, "course_renumbers: passes": 1, "total_differs: gap": 1}): record, checks and run to
-- the reconcile run 45176404274's filing. Receipt: kb/receipts/program_requirement_records_piles_ela_2026-11-23_s714e.json.
-- Compact pre-read, read-only: one SELECT, one JSON value. md5 of each value's jsonb text, hashed on a local
-- Postgres 16 (p-compact-preread-by-md5-s713); the full values are in the _preread.sql beside it.
-- A clean read: on_run = both_before = listed, already_after 0, checked_now 0, latest_confirm 0.
with v(i, college, control_number, before_run, rec_md5, chk_md5, after_rec_md5, after_chk_md5) as (values
  (1, 'East Los Angeles College', '14869', 39063389278, '789a4af8534457053547b9df21d428ee', '4e62525ffab7b40148e6f2aab9b3bd9f', '083c2a1cb350205a1231b49d0da2d844', 'e4fa9b14e645cc8d1c8b50402d70841c'),
  (2, 'East Los Angeles College', '21174', 43357061643, '621b69e7ca886b2696719f80e1686d9d', '768b5ffa4426c74c74cd6406935caf7a', 'b287393339a72daac6abc26d5ed0bc60', 'd746f8b3633090bec3b73c8e701d0454'),
  (3, 'East Los Angeles College', '32193', 39063389278, '93e0104b870653ec374cb6f25a5ddbd3', '3c81834a38a33a73170c8fc53655fda9', '9ca51d44a148c3314a5813fa671a9b74', '279c9a68d28e4b814ce5679cf3fb61b5'),
  (4, 'East Los Angeles College', '32902', 39063389278, 'e8b2476f174c7d5f8791c3a5d34d7dba', '05a8a732ddafc0a2f00db74eec12a994', 'ecea4c5928a1ddda0c07e448956c994d', '69bb5a51ce9fbe2adb7fed3ba3404d43'),
  (5, 'East Los Angeles College', '32980', 39063389278, 'cb11230d2feac2d84e403b6eda6fff1f', '3df2490d77d37598c353a7cadf2ba15d', '20fef9bcd3a44a811d90b8a7a695e9bf', '9d432ebf42abcd3c77ebc7352fcdae51'),
  (6, 'East Los Angeles College', '33382', 39063389278, 'b07faeb3eae4e3f6cc96d26d82c4a4da', 'b1d6e0caa9adb797d80a7ae9c2ad68d5', '9e885d5ba5b6a716661c42f5f6c5fa77', '1b0a6776ffd285083b57f688a223a298'),
  (7, 'East Los Angeles College', '35309', 43357061643, '06b8c5de775c2b9d0cfc844143acbbd7', '025f5967e09072e40425565d0b8c2cce', '473c5b22236dacee7fcd92c489d19aaf', 'f0c8a700c3212e0431147df49206ae06'),
  (8, 'East Los Angeles College', '37923', 39063389278, '014f57183b1d50939d264c6c2fc5ddcb', '16c6cdc20607329cfbd615afadef21ee', '8873ecf36c2619a89270176c6377d541', 'f0c8a700c3212e0431147df49206ae06'),
  (9, 'East Los Angeles College', '37956', 39063389278, 'd18fcac784fc7e960248cef796a0f437', '725b75a0db1552d48624ccf8eeaef7ac', '8fa81054e09389c8f226a549a88cea6d', '4a894dbbbf8a006f6d13c76ed2890455'),
  (10, 'East Los Angeles College', '37965', 43357061643, 'e68cd5da3e8e61c0564a773bbe6d9003', '608207fd06d305c892c32e21b82a6227', 'dd873e93b7466b13ee99a60758e0e590', '1c12c6aa818991db9649aac25eaa788b'),
  (11, 'East Los Angeles College', '37969', 43357061643, '3ab0ba88ef061eb0b4a94bf9999cee5a', '87e5fe088d44991cdab6e95d09f28b7b', '59ca3a67c14cfd689e7a50be71f229ca', '260a17d0d437de1d60052766c991a49a'),
  (12, 'East Los Angeles College', '42672', 43357061643, 'f7d07a66caf893dffd57108ff24eef26', 'ff0824422e219dcfb156c2b1d7038ba8', 'acf0bee421ddbab3c071153ce31317ae', '279c9a68d28e4b814ce5679cf3fb61b5'),
  (13, 'East Los Angeles College', '44624', 39063389278, 'd9aff87e22a275f77a7b90c3800b4e0c', '48c697604512ce3373c1b219399398b7', 'd9aff87e22a275f77a7b90c3800b4e0c', '08074668b7756a023e12e3792ba793d8'),
  (14, 'East Los Angeles College', '45602', 39063389278, '9b246d6562def5bb4147d3db2c6d5f73', '88e2495efd06d1573c7fb0fe096e2788', '9b246d6562def5bb4147d3db2c6d5f73', '3598f96bbb8ea17f3b1c16502af911e6'),
  (15, 'East Los Angeles College', '46461', 43357061643, 'd5eb219e6959ee431c4c5505cbb87cd5', '37e1efebffcb1697fdd854e6b6e3afda', '80028238bdf0a234f1c17ee9d95da2c5', '5eb15ca1835b239b4dd6c944a20edd02'))
select json_build_object(
  'listed', (select count(*) from v),
  'on_run', count(*) filter (where r.extracted_run = v.before_run),
  'both_before', count(*) filter (where r.extracted_run = v.before_run and md5(r.record::text) = v.rec_md5 and md5(r.checks::text) = v.chk_md5),
  'already_after', count(*) filter (where md5(r.record::text) = v.after_rec_md5 and md5(r.checks::text) = v.after_chk_md5),
  'checked_now', count(*) filter (where r.checked),
  'latest_confirm', count(*) filter (where lv.verdict = 'confirm'),
  'confirm_on_before', count(*) filter (where lv.verdict = 'confirm' and lv.requirements_fp = public.program_record_fp(r.record)))
  from v join public.program_requirement_records r
    on r.college = v.college and r.control_number = v.control_number
  left join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv
                       where pv.college = v.college and pv.control_number = v.control_number
                       order by pv.id desc limit 1) lv on true;
