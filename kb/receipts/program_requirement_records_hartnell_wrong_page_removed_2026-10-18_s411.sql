-- S411 SkySotol, 2026-10-18: remove four Hartnell College rows that read another program's page
-- (Psychology A.A. 18353, IGETC 19107, Spanish A.A. 19518, Public Health Science A.S.-T 35458). The reader now reads
-- Hartnell's Coursedog PDF by its "Title - CODE" headings, and no heading names these four as their own.
-- Basis: Sam's "remove" rulings on wrong-page rows (Sheets 61, 62, 68) and his standing go of 2026-10-17 (cpl_memory
-- sam-trust-procedures-no-per-item-approval-2026-10-17). The full rows, as read live just before the delete, are in
-- kb/receipts/program_requirement_records_hartnell_wrong_page_removed_2026-10-18_s411.json, which also holds the rollback (jsonb_populate_record over each row_text).
-- Guard: a row is removed only while its md5(to_jsonb(r)::text) equals the read's, it is unchecked, and no verdict
-- names it, so a row a person touched since the read is left alone. Returns the count removed.
with target(college, control_number, row_md5) as (values
  ('Hartnell College', '18353', '0d48971c0c3626b4904b13807f0b52c9'),
  ('Hartnell College', '19107', 'e90b36fbf65893defc85713c20b97882'),
  ('Hartnell College', '19518', 'c9fc5d6e4880fd1fc13d1c2eec214269'),
  ('Hartnell College', '35458', 'f32d508f88c53942e78f5805b58d909e')
), gone as (
delete from public.program_requirement_records r
using target t
where r.college = t.college and r.control_number = t.control_number
  and md5(to_jsonb(r)::text) = t.row_md5
  and r.checked = false
  and not exists (select 1 from public.program_record_verdicts v
                  where v.college = r.college and v.control_number = r.control_number)
returning 1)
select count(*) as removed from gone;
