-- S720r: 9 Los Rios rows take section_cut_off: record (unchanged body), checks and run to the committed
-- filing of the free reconciles. Receipt: kb/receipts/program_requirement_records_cut_window_gaps_s720r.json.
-- Compact pre-read, read-only: one SELECT, one JSON value. A clean read: on_run = both_before = listed, already_after 0,
-- checked_now 0, latest_confirm 0.
with v(i, college, control_number, before_run, rec_md5, chk_md5, after_rec_md5, after_chk_md5) as (values
  (1, 'Cosumnes River College', '04602', 39047009824, '6567e75673b5089a3f78e1a03be52b20', 'a7e3b2810a21b466d5d538f838396bfe', '6567e75673b5089a3f78e1a03be52b20', '72afd5dc4bd089bd8c575b379767ecd5'),
  (2, 'Cosumnes River College', '04614', 39047009824, 'a1cadf76c8cbedc45d2d72c8f3de1393', '9a544ad4455012a8cbf5bdf416620619', 'a1cadf76c8cbedc45d2d72c8f3de1393', 'ffbee8f06788d045787288abbfacdd1d'),
  (3, 'Folsom Lake College', '15368', 39046850071, '2f034892d34de3c1d08733482cc00002', '20de479d9d6c17a09be7bd27aa19ff7a', '2f034892d34de3c1d08733482cc00002', 'cbc54cc28b2f8fcab0e26df1e56e99b6'),
  (4, 'Folsom Lake College', '39574', 39046850071, '97f31d722d552263f827ac6c3833e7dc', '8c504b1965d00e7f10d11be65a482677', '97f31d722d552263f827ac6c3833e7dc', '080831b8c81fc0c5da71ee50b1457bfa'),
  (5, 'Folsom Lake College', '42612', 39046850071, '07ab6f7ec73f32c01c6ed377d806eb1b', '7beedc559a8551f9de9a238864ed4763', '07ab6f7ec73f32c01c6ed377d806eb1b', '58286653bf5a15595829530650829c20'),
  (6, 'Sacramento City College', '04656', 39047070975, '39d13a29a62545f8a6fe7c888a45959e', 'b1c83e83c58f50adbd086ea45ddcbaea', '39d13a29a62545f8a6fe7c888a45959e', '009a5cf1372a34eb19abbbde067562b7'),
  (7, 'Sacramento City College', '04688', 39047070975, '5e3b9e35f68fc4b0f35f6dbd2c4ef20d', '4e1c710e2756859f1ad163b279cd3f92', '5e3b9e35f68fc4b0f35f6dbd2c4ef20d', '33bbfade806091309ececb1c459e4803'),
  (8, 'Sacramento City College', '07350', 39047070975, '1809bdd89b3f7c427443abae934a7c0c', '775889b425822a0eeb04715c74d828a5', '1809bdd89b3f7c427443abae934a7c0c', '871cbcdab77bf78ecd948210d4e09926'),
  (9, 'Sacramento City College', '21418', 39047070975, '9b12f6ab36098ca551e83d6685a41eb6', '4fe8f17668f7cd66e592f63fe0532138', '9b12f6ab36098ca551e83d6685a41eb6', 'af11905e1a2681f06de35afe48bf5cf7'))
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
