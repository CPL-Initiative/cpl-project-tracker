-- S721A lane 2's cheap piles at Palo Verde (named gaps 15). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s721_paloverde_2026-11-24_s721a.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Palo Verde College', '18000', 39852997888, '03ae0cc80ab6336a3a1b90d8041bab64', '39747decba62d1a4fc97e2e52cd92e81', 'd3cc8f2ee6c92c0e298b42df2ffcf0d4'),
  (2, 'Palo Verde College', '18045', 39852997888, '38a85ee330d3902ec38706bf7bba9dee', '841d9b4ca1b4eaf2c4395d3fefcb8b7e', 'be301ec88599da71440e4080129ba9a0'),
  (3, 'Palo Verde College', '22484', 39852997888, '63da0f62ffb74e2864a095376df16e9a', 'ebd12c758ebab5aaeac4ca39249f2f79', '2c98a64c36a3dc1ebf3da7be588aaec1'),
  (4, 'Palo Verde College', '41189', 39852997888, 'c3502497d20548583cdb78675c88cde9', 'a28f8dff0d4eaa11f3ebb6e0928553f4', 'fbdac065a7b535e49bada68d1d212e26'),
  (5, 'Palo Verde College', '41208', 39852997888, '21658844d17be0d5984bd4578c92b778', '2efd1426b83a79da0a0f0776d66a41ee', 'df3f716020a05de12f6d2cee9255f12f'),
  (6, 'Palo Verde College', '41221', 39852997888, '94dde3a1b0c5d14e72ae4be0555fcf33', '726c0943e12218600a348c72bf68e080', 'b118ee604ed16fa4a46a9eec8cde47b6'),
  (7, 'Palo Verde College', '41222', 39852997888, 'dc340443d5b3b2f9ccef8c1dcbb632f3', '2efd1426b83a79da0a0f0776d66a41ee', 'df3f716020a05de12f6d2cee9255f12f'),
  (8, 'Palo Verde College', '41223', 39852997888, '08ef48b33d28c40f3f882c2d8f39508a', '871560717615bc41f9060559401e00ff', '0f79b25be914e7a83b875e10ce24b522'),
  (9, 'Palo Verde College', '41224', 39852997888, 'cbea0385af5bd8650cf1d888b1348e6e', '726c0943e12218600a348c72bf68e080', 'b118ee604ed16fa4a46a9eec8cde47b6'),
  (10, 'Palo Verde College', '41225', 39852997888, 'dd57acdccc31c1d26e9b93495894f7a3', '0ae709925199e4be6ceebc0c8939f52c', 'b19b99faf7dd3403a51439e771c4cba5'),
  (11, 'Palo Verde College', '41226', 39852997888, '433742d713ae897013b06771ee855cb5', '2efd1426b83a79da0a0f0776d66a41ee', 'df3f716020a05de12f6d2cee9255f12f'),
  (12, 'Palo Verde College', '41241', 39852997888, '7d530b670c2c7eaba043575f487468d9', '2efd1426b83a79da0a0f0776d66a41ee', 'df3f716020a05de12f6d2cee9255f12f'),
  (13, 'Palo Verde College', '41243', 39852997888, '1be1073fde7e27f7acf682b0d2a222dc', '2efd1426b83a79da0a0f0776d66a41ee', 'df3f716020a05de12f6d2cee9255f12f'),
  (14, 'Palo Verde College', '41250', 39852997888, '2ab834f23cf73e87994b8eee8c424d1c', '2efd1426b83a79da0a0f0776d66a41ee', 'df3f716020a05de12f6d2cee9255f12f'),
  (15, 'Palo Verde College', '41260', 39852997888, 'c6cfa620f39b9b4a06acc403c60073ef', '726c0943e12218600a348c72bf68e080', 'b118ee604ed16fa4a46a9eec8cde47b6'))
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
