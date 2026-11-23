-- S714F lane 2's cheap piles at Fullerton (course_renumbers 11). Each row's checks become the college load's
-- image of its committed record (load_rows); the record itself is unchanged.
-- Receipt: kb/receipts/program_requirement_records_piles_fullerton_2026-11-23_s714f.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Fullerton College', '03816', 38675136988, '84e1b3c23ea356fdf1a2236a3bfbdf8f', '97549f220a1372381d93746ec075f3bc', '1ffb9c066298877a03512a8faaa61844'),
  (2, 'Fullerton College', '03839', 38675136988, 'a47b86384e1acb8b900561a630a26fc1', '854c1cb3815c7a0c9c704619a198d108', '260a17d0d437de1d60052766c991a49a'),
  (3, 'Fullerton College', '08438', 38675136988, '776ebe602c3cd7949573d4710caa483c', '47da0209649c82cd95b3823123a7b1f9', '072e959a821c97284ee3eff595bae498'),
  (4, 'Fullerton College', '11690', 38675136988, '9691e7bdd4bf78a6cc9a3131855e68e9', '48c697604512ce3373c1b219399398b7', '08074668b7756a023e12e3792ba793d8'),
  (5, 'Fullerton College', '18747', 38675136988, '3687cb526a4af4486bcadd4604e81bc8', 'dbf973e4fa452773f65971f6a2d57336', 'df492adc7511d7afb38460dd0342f6f6'),
  (6, 'Fullerton College', '21252', 38675136988, 'b3cf48f1dbff8ad6c54d2489c1c928ba', '939625dcee344fd49aacc6cc00e964ee', 'f13d3420b2a42ba82c0bd95a728f6dae'),
  (7, 'Fullerton College', '21266', 38675136988, 'c7db5b754237b05d9e32f52f0818fc88', '6141fd8663484e9117aea717b0e5c85d', '1bc9d14aaac75f0ea7f89ef6e1d23770'),
  (8, 'Fullerton College', '21271', 38675136988, '49b61e5d1702631fc4b61d7ced6a8eca', '811b36bcf4dc29f4799769ef80ddb540', '32a6823cffe0b29fa0d6b22bf40b18bd'),
  (9, 'Fullerton College', '36790', 38675136988, '827fa51107951b34882f273f3161e9f1', '385acddd2f8a9fea1ec7d35fb691a32f', '05f255978566ec4f50c14f9690a4b2e7'),
  (10, 'Fullerton College', '45320', 38675136988, '99c6c0a773990951423d809ce8348c1f', '811b36bcf4dc29f4799769ef80ddb540', '0fbb61a6bbd8f45ffbdaede5a84a0423'),
  (11, 'Fullerton College', '45378', 38675136988, 'a1b83d97f8765a0a15f69bca3a24fff0', 'e45084d7d804f2c4620b9e3dc34f5d67', '1b0a6776ffd285083b57f688a223a298'))
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
