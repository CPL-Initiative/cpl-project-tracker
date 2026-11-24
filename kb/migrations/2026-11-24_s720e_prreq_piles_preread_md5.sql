-- S720E lane 2's cheap piles at East Los Angeles (named gaps 4). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s720_ela_2026-11-24_s720e.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'East Los Angeles College', '02430', 39063389278, '1a14d248ea43d9602d1b6328b745c276', '96cfd147b96e2ed622e8eb80dddaaff7', 'fb83fbd2d18002371789efbd44799ca9'),
  (2, 'East Los Angeles College', '02456', 45176404274, 'e64c42c97becd9bfd1955f22ea66e25b', '025f5967e09072e40425565d0b8c2cce', '020c7c6a0be88acee2a620e8505f3fb0'),
  (3, 'East Los Angeles College', '08252', 39063389278, 'd143ee9c32a593ac6f2927050f19b8d5', '0c577c47fb947d6c0003a362e0a582e0', '0522daae9ae7b9a9ba1a409efb588f96'),
  (4, 'East Los Angeles College', '21157', 39063389278, '85a10ac2b1855d45d72a79b5a1e0fd5f', 'ef8748a4053763697e7a544b5a8f38e6', 'cb9acaf80b782942ea06fa6da12036e5'))
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
