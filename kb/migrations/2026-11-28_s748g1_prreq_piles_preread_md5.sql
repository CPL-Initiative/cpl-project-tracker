-- S748G1 lane 2's cheap piles, one plan over Allan Hancock, Mt. San Antonio (9 rows: ge_units_not_read 1, hours_total_differs 2, lists_not_closed 1, lists_past_their_figure 1, noted_figures_differ 2, noted_no_total 1, units_within_printed_range 1). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added,
-- or checks.arithmetic to equal for a rescore; the record unchanged. Receipts (before_image per
-- row), one a college:
--   kb/receipts/program_requirement_records_piles_s742_allan_hancock_2026-11-28_s748g1.json
--   kb/receipts/program_requirement_records_piles_s742_mt_san_antonio_2026-11-28_s748g1.json
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Allan Hancock College', '05874', 38843474519, '82d09ee3f0d9cb6cd218b0302cf36fd0', 'b76acd785dbc59227502ae4e04690d0b', 'a25da37440106316c8e2b142b15d5e58'),
  (2, 'Allan Hancock College', '12129', 38843474519, 'd0a230380de8ba43cb805f068499d7dd', 'a0b064d96be523a34ceed3ec24054f2f', '9e9773100182d4c3bf4c37eeacc863f9'),
  (3, 'Allan Hancock College', '19928', 38843474519, '883c8c4ee9b027182a7ebd1f8309388c', '3c81834a38a33a73170c8fc53655fda9', 'df1dbe682342568a2f889277dec1a7a3'),
  (4, 'Allan Hancock College', '30363', 38843474519, 'd0a3cc337acac5dc32b67f6884fccf7a', 'dd0e3718f0cc4fde4db70ac5ba05d7e1', '23816234f8fadef1077363c04b5a4243'),
  (5, 'Allan Hancock College', '30934', 38843474519, 'd10e260fd9875c99fdbacaffeaa15277', '52ec4b6e51cbffb73993766c4fc9737b', '8446d2478461aae8926e00f4205dc6de'),
  (6, 'Allan Hancock College', '31093', 38843474519, '00e9b32d5dbe5f134689488927667a4e', 'ac494dfcba30dea86a379ccb62116a42', '846e8740c8e9d1f4081ae516d2603f38'),
  (7, 'Allan Hancock College', '40003', 38843474519, '10739dca666cf5d58b1b53995b2568f7', 'f1275b67c1691d1312d8a0f9272de9d0', 'b20c7f046519355b89f141ac838fa5a1'),
  (8, 'Mt. San Antonio College', '37603', 44744647809, '0f7bc2bb210373863b9153786a220982', 'c59940d88ccdbd2a63fe18ec194066c9', '15a7f2dad7537a32a60a0768cfd0bf98'),
  (9, 'Mt. San Antonio College', '44520', 38059865531, '2c651f9c9c3cc6b916cbbf9010b297f0', '532de530bf88679b99388d2352906299', '52c50f6ffb81491092ea034711b5b25e'))
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
