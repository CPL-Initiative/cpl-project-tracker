-- S720F lane 2's cheap piles at Fullerton (named gaps 6). Each row's checks become the college load's
-- image of its committed record (load_rows): checks.gaps and checks.confidence added; the record unchanged.
-- Receipt: kb/receipts/program_requirement_records_piles_fullerton_2026-11-24_s720f.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Fullerton College', '03853', 38675136988, '661521d12f43c32dc8471dad067083ee', '112b34833862251951c68159fd59e607', '2f5924cdd8b4ed1df63fea365bed4a76'),
  (2, 'Fullerton College', '03866', 38675136988, 'a3063eb0cbf38475313e5ef7aeddd7eb', '2162fd293221ee16cb456fedc91fc3b1', '5de58829ba322943552299e3eceebe8d'),
  (3, 'Fullerton College', '08420', 38675136988, '70edb5b70fc45b74817bb6bc9686a432', '87e5fe088d44991cdab6e95d09f28b7b', 'ac3a79b326c7bdf95d845a3a184f6724'),
  (4, 'Fullerton College', '08422', 38675136988, 'c30f03559a19a1bf732238fd58ba2407', 'ff0824422e219dcfb156c2b1d7038ba8', 'fd3b6bae67a837eb5c21fe5dcc313f22'),
  (5, 'Fullerton College', '18163', 38675136988, '69f8d5609c1a254dda97c759979a3467', '66379397ba3b1e0fdbee9f6b10baf724', '8ddd9665179bf0976ae896606692e37b'),
  (6, 'Fullerton College', '42394', 38675136988, '0869daa42000e8c90d71448c884e3f25', 'c34a5582e6c0a6741c6da26def4a4775', 'ace814ce7721211fa68bc55dec0f93a2'))
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
