-- S727A lane 2's cheap piles at College of the Canyons (9 rows: heading_not_in_text 1, lists_not_closed 1, noted_figures_differ 3, noted_section_cut_off 1, noted_unit_floor 1, pool_figure_not_read 1, unit_line_not_read 1). An UPDATE row's checks become
-- the college load's image of its committed record (load_rows): checks.gaps and checks.confidence added;
-- the record unchanged. An INSERT row (43388) is the load's image of a record moved from held_for_person/
-- to records/. Receipt: kb/receipts/program_requirement_records_piles_s727_canyons_2026-11-25_s727a.json (before_image per UPDATE row,
-- after_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql). insert_present and
-- insert_verdicts must read 0.
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'College of the Canyons', '02277', 44769429877, 'b01bac1722ffeca05ea8255ebb3b9b80', '3c81834a38a33a73170c8fc53655fda9', '03b91331d7d6495724918843438c7e36'),
  (2, 'College of the Canyons', '10312', 44769429877, '7433c8af535fa2e99153bfe5e995baef', 'b167e014df6b97bdebba96ca16afce51', 'a54d651fc6a696ebd80f5d37405cb210'),
  (3, 'College of the Canyons', '15477', 44769429877, 'a54c783d382da92c40c8217149b44ba1', '6d2e0cb935c0d38e7096880bea2459b6', 'f18db3d5a55d8615cd7c1f7f8024f29f'),
  (4, 'College of the Canyons', '16962', 44769429877, 'ee66bf27d36d39229f0fc9bc7c355f3a', '234453088e0b56a19eaeadeba055ec57', 'a4eebf937e7f76112191d60a66fb0bc1'),
  (5, 'College of the Canyons', '32896', 44769429877, '6207051ad9ed21f49aad4a530f4aaeed', 'f61818b42c814e08375c21e81c36f31e', 'fc76fd3c74d7ed9cb6382fd420048ba8'),
  (6, 'College of the Canyons', '37648', 44887850515, '399fbdb5881972ed041d2ea1987827e9', 'db490ca8012a7848af424ef80ddf2930', 'd21a97d2e502ab364e154db42048f4bf'),
  (7, 'College of the Canyons', '40383', 44769429877, 'e77edfa5c75401e5bb5d8ea2aa0bdb50', '025f5967e09072e40425565d0b8c2cce', 'b2f52d687182327018d540fc089e06d6'),
  (8, 'College of the Canyons', '43549', 44769429877, 'f029489641f518df8e1ae6c06ae93a02', '9fa490af04301b243653e4713e374514', 'ca8139eeccdd73cd6266169729b6b460'))
select json_build_object(
  'listed', (select count(*) from v),
  'insert_listed', 1,
  'insert_present', (select count(*) from public.program_requirement_records r0
                      where r0.college = 'College of the Canyons' and r0.control_number in ('43388')),
  'insert_verdicts', (select count(*) from public.program_record_verdicts pv0
                       where pv0.college = 'College of the Canyons' and pv0.control_number in ('43388')),
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
