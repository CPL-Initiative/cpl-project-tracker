-- S360 SkyLichen, 2026-10-11: remove Riverside City 39120 (Building Energy Systems Professional in HVAC Technology, A.S.).
-- Sam's ruling: Open Asks Sheet 61 item 2, "remove", 2026-10-11T01:26:24Z (through 2); in chat, "remove stale".
-- The row reads HVAC Commercial Technology's page (AS946, the page 39105 reads; the reader's own note says TITLE
-- MISMATCH), and the Riverside City re-run with #1967 no longer files it.
-- The full row, as read live just before the delete, is in
-- kb/receipts/program_requirement_records_rcc_39120_removed_2026-10-11_s360.json, with its rollback.
-- Guard: the row is removed only while its md5(to_jsonb(r)::text) equals the read's, it is unchecked, and no verdict
-- names it, so a row a person touched since the read is left alone.
delete from public.program_requirement_records r
where r.college = 'Riverside City College' and r.control_number = '39120'
  and md5(to_jsonb(r)::text) = '6aa0c2e371934c7c4168142ceb6b4632'
  and r.checked = false
  and not exists (select 1 from public.program_record_verdicts v
                  where v.college = r.college and v.control_number = r.control_number);
