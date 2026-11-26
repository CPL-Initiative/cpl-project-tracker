-- S740D lane 2's cheap piles at Cabrillo (7 rows: catalog_figures_differ 3, noted_figures_differ 1, pool_figure_not_read 1, repeat_read_once 1, unit_line_not_read 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_cabrillo_2026-11-26_s740d.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Cabrillo College', '06328', 38639316727, '5d2b0d1cbc324b2a29f422a79757efe8', '841d9b4ca1b4eaf2c4395d3fefcb8b7e', '818ef4edcda516fea1de654747ca2702'),
  (2, 'Cabrillo College', '06341', 38565227455, '0f3aa1e2e0cd5250e888fe200f931b9b', 'ebd12c758ebab5aaeac4ca39249f2f79', 'b560d2e3d210a8d710e27fdc11444ea3'),
  (3, 'Cabrillo College', '06349', 38565227455, '713e8c7c7d405e5612644653526691c3', '8c7a8d023729d024aa9c219f950def0c', '71da9d577a364357a8986bf10e64cb90'),
  (4, 'Cabrillo College', '06385', 38639316727, '4c1530bbc633fc892f27f55120275884', '598b266c8caf0d08b3b919950ad632c6', '751c543403e0ba43f8bb2a84a1d8635c'),
  (5, 'Cabrillo College', '32291', 38565227455, 'fe6229d3ea992b9c933b0dde47be4d72', 'ebd12c758ebab5aaeac4ca39249f2f79', '38668794711474e4a49528c1aef71921'),
  (6, 'Cabrillo College', '41186', 38639316727, 'bbbf485e4ff57582c4eafc77964292d8', '8a8a131b7a421d5bb4f8f0d8eb46c633', '73e08b38e8345416cef9ff875f5fcdff'),
  (7, 'Cabrillo College', '43556', 38442109713, 'e7da20f37cc00fe5216d1665061b5ade', '565698f6affa77ef6c1410d28f8c0923', '9e3aeae7d2aa8193e03a9a1b2e4bfe57'))
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
