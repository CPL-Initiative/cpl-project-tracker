-- S359 SkyMoss, 2026-10-10: remove the eight program_requirement_records rows the Approved re-reads no longer carry.
-- Sam's ruling: Open Asks Sheet 60 item 1, "remove", 2026-10-10T23:52:04Z (through 1). Full rows, as read live just
-- before the delete, are in kb/receipts/program_requirement_records_eight_dropped_removed_2026-10-10_s359.json, which
-- also holds the rollback (jsonb_populate_recordset over its rows array).
-- Guard: a row is removed only while its md5(to_jsonb(r)::text) equals the read's, it is unchecked, and no verdict
-- names it, so a row a person touched since the read is left alone.
-- Applied 2026-10-10 ~23:58Z as migration program_requirement_records_eight_dropped_removed_2026_10_10_s359 (execute_sql's
-- guard routes data writes away from it). Read back: none of the eight remain; 1,206 rows live (1,214 before); 29 checked.
with target(college, control_number, row_md5) as (values
  ('Cerritos College', '19170', '5ac6d9a77b6f69594b9c117327efe552'),
  ('Cerritos College', '19172', 'b8b1515eb0d3dd441664eb697b9e4727'),
  ('Mt. San Antonio College', '31598', 'b8d69b3caa1fce1606a1a12a818a0ea0'),
  ('Mt. San Antonio College', '32892', '8e4b04ae93d0f48a2fbe8c902209b98e'),
  ('Mt. San Antonio College', '38942', '9b47b68ddad82e935ebe60306fc576c5'),
  ('Mt. San Antonio College', '43373', '43e11d3b4011530556f342f816b10bd4'),
  ('Mt. San Antonio College', '43777', 'c93582994623c92b4c5036103f96d182'),
  ('Mt. San Antonio College', '43999', '7bccec1cc05d108d9fb3307d67ee9b56')
)
delete from public.program_requirement_records r
using target t
where r.college = t.college and r.control_number = t.control_number
  and md5(to_jsonb(r)::text) = t.row_md5
  and r.checked = false
  and not exists (select 1 from public.program_record_verdicts v
                  where v.college = r.college and v.control_number = r.control_number);
