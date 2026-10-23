-- S459 SkyBuckeye, 2026-10-23: remove the six older-build program records each wave left behind, under Sam's standing rule
-- (Open Asks Sheet 118 card 1, 2026-10-23 18:43Z, his own call; cpl_memory sam-sheet-118-rulings-harvest-cards-2026-10-23):
-- Hartnell 12331, 18353 and 19518 (live rows from run 39949570443 whose filed records the S456 code-kind gate removed),
-- Long Beach City 43802 and 46290 (live rows from run 38152016534; their filed records place none of their listed courses,
-- which the display builder leaves out under Sheet 62 card 1), and Palo Verde 04436 (run 38567765687). None is in the
-- current display build (e021a2824548 on #2387, nor d45e5d0fcf78). S458 read the same six at 19:09Z; S459 re-read them.
-- The full rows, as read live just before the delete, are in
-- kb/receipts/program_requirement_records_older_build_removed_2026-10-23_s459.json, which also holds the rollback
-- (jsonb_populate_record over each row_text). Guard, as S456's: a row is removed only while its md5(to_jsonb(r)::text)
-- equals the read's, it is unchecked, and no verdict names it, so a row a person touched since the read is left alone.
-- Returns the count removed. A good result: removed 6.
with target(college, control_number, row_md5) as (values
  ('Hartnell College', '12331', '3c3d465e377b2be8c5a6e8fccab0fdd5'),
  ('Hartnell College', '18353', '4277cef3927b0a668c3a8bb17e620ee1'),
  ('Hartnell College', '19518', '8a0edbab7045b5be67f8ce37560735f5'),
  ('Long Beach City College', '43802', '9d8da0c3ba2af2d5248c048097523a87'),
  ('Long Beach City College', '46290', '41a32a0c8083136809c55b8b9b73f99d'),
  ('Palo Verde College', '04436', 'a4b2e16d1d4bbc00b7b7644736c2c63f')
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
-- Applied 2026-10-23 21:17Z by supabase-migrate.yml run 40025041285: removed 6 (receipt kb/receipts/migration_program_requirement_records_older_build_removed_2026_10_23_s459_40025041285.json); the six keys read 0 live, the table 17,529.
