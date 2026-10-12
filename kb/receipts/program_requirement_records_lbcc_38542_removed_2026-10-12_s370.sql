-- S370 SkyHolly, 2026-10-12: remove Long Beach City 38542 (Advanced Arc Welding (SMAW and FCAW)), whose row read the
-- Shielded Metal Arc Welding (SMAW) certificate page the re-read gave to its own program, 38540.
-- Sam's ruling: Open Asks Sheet 68 item 2, "Remove it" (2026-10-12T11:20:51Z, through 2). The full row, as read live just
-- before the delete, is in kb/receipts/program_requirement_records_lbcc_38542_removed_2026-10-12_s370.json, which also
-- holds the rollback (jsonb_populate_record over its row_text).
-- Guard: the row is removed only while its md5(to_jsonb(r)::text) equals the read's, it is unchecked, and no verdict
-- names it, so a row a person touched since the read is left alone. Returns the count removed.
with target(college, control_number, row_md5) as (values
  ('Long Beach City College', '38542', '49dd53764522ac3e9c6f9c43404bc9a4')
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
