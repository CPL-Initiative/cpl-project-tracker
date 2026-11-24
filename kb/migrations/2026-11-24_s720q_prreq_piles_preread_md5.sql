-- S720Q lane 2's cheap piles at College of the Sequoias (named gaps 7). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_sequoias_2026-11-24_s720q.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'College of the Sequoias', '06764', 38748848139, '21759d8635455197c2d273eb28173827', '3c81834a38a33a73170c8fc53655fda9', '40b3607b22e0f91890bce0997c20b5e0'),
  (2, 'College of the Sequoias', '10045', 38748848139, '9f3a2496b00e8d76f1b76b2304bd2c65', '3db55b679c617879bf8ee2173a835eae', 'd4829ff893fea5b0dd9e407ee59c3b1a'),
  (3, 'College of the Sequoias', '32710', 38748848139, 'ba37d208d4019a0a84809be4225f4194', 'b167e014df6b97bdebba96ca16afce51', 'a0e1bc471478bd7adf979fc2eed82dd7'),
  (4, 'College of the Sequoias', '35415', 44688217584, '22cca629a4990307d778bb794b1227c7', '6eb7b53826741ea0f8c0fc89c8d2ae1c', 'f56598692dc41388b7063e869aa57522'),
  (5, 'College of the Sequoias', '36073', 38748848139, 'eb7ac8dbb01a04cfd9e62360c0bff637', '565698f6affa77ef6c1410d28f8c0923', '0272325feec5b177048a56ac2a9b9ac6'),
  (6, 'College of the Sequoias', '37744', 38748848139, '411e6a09f63df68115c9ff604481270a', '3e096e5d8483d0570dfc23bf65a968b0', '3f78c72147bf6f9dbff6f34a361e1c3b'),
  (7, 'College of the Sequoias', '42254', 38748848139, '82f0b3d6bd134c1ef53bd61cd2b18ad4', '608207fd06d305c892c32e21b82a6227', '1a3b1280f15a4bed4e431698ce16efe6'))
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
