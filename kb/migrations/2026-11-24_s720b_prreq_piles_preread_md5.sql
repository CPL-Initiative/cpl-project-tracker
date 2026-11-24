-- S720B lane 2's cheap piles at Cabrillo (named gaps 13). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s720_cabrillo_2026-11-24_s720b.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Cabrillo College', '06349', 38565227455, '713e8c7c7d405e5612644653526691c3', '8c7a8d023729d024aa9c219f950def0c', 'fe2665324300306aa93ddf06b29897e3'),
  (2, 'Cabrillo College', '06352', 38639316727, '66ba156ac06e095907659d08b6cc7ff0', 'd3047c185b87a8a52b032f9218f6c5ef', 'ca58014ee9b9237bed97d02081e89780'),
  (3, 'Cabrillo College', '06380', 38639316727, '662d88041a983ed436888b1d45d8e8e0', 'bd1b97cf81260cd984af03c1ca02d88e', 'ef2f333dcfeb529f84eb093e2b72f6d1'),
  (4, 'Cabrillo College', '06381', 38639316727, '2e51d1691a4579100db0ef9ebc6c4a3d', '3c81834a38a33a73170c8fc53655fda9', 'bd1aba8c1f1176c833be44140be0b617'),
  (5, 'Cabrillo College', '09600', 38639316727, '48e9869c2781a559bc1a8b9a2e61bbe0', '025f5967e09072e40425565d0b8c2cce', 'cd76620bc1fd0846dd308cd38f93def0'),
  (6, 'Cabrillo College', '12745', 38442109713, '44be9346e0b81425a14ba7800cce86d3', 'e4bd821eb538332d9571281a332be6d5', '28cf4fbab11fd6f1dac56f967f972d02'),
  (7, 'Cabrillo College', '12746', 38442109713, '9a3be035c6ac659e6f03fb2e0aa7e9ef', '87e5fe088d44991cdab6e95d09f28b7b', 'ba4f64c4ce04d425a867a08636ae85ea'),
  (8, 'Cabrillo College', '12747', 38442109713, '0addbd17a2adc67ae625c76b825e3078', '3e096e5d8483d0570dfc23bf65a968b0', '2ee82783963dcd37d98b42e1353a8d93'),
  (9, 'Cabrillo College', '12748', 38442109713, 'f59f1f4f9194006bd3d964b6bef0b403', 'c59940d88ccdbd2a63fe18ec194066c9', 'f24c3a3a5d3afd8072fc031c8906e7d7'),
  (10, 'Cabrillo College', '12749', 38442109713, '4466479c5ba6dccf9e9c43aaf6aa5b0b', '3e096e5d8483d0570dfc23bf65a968b0', '2ee82783963dcd37d98b42e1353a8d93'),
  (11, 'Cabrillo College', '16558', 38442109713, 'ea72ccc5f49beebbf80b133de150808e', 'a38eb70cb7ae3d1e0ec60d82a9723400', 'bad1a226a486aef577543d06a92ef474'),
  (12, 'Cabrillo College', '42781', 38442109713, 'bd33705ce625f8782662226fea636f07', '788ee0293bdb78bb388760da1bbc39c5', 'de7e9cfb6573a4f8d03f8b47968fd308'),
  (13, 'Cabrillo College', '44992', 38639316727, '03d8bf00d5489d0b8334b9e9a1ff3a07', '841d9b4ca1b4eaf2c4395d3fefcb8b7e', '5b3498d631edde561c89a6f20dcab6d7'))
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
